/**
 * Portfolio Chatbot — Cloudflare Worker
 *
 * API Endpoints:
 * - GET  /api/health          → Health check
 * - POST /api/chat            → Chat with RAG (streaming response)
 * - GET  /api/providers       → List available LLM providers
 * - GET  /api/config          → Get current configuration (without secrets)
 * - POST /api/vault/unlock    → PIN check for the portfolio's notes viewer
 */

import { Router } from 'itty-router'
import { getLLMConfig, Env, ChatMessage } from './config'
import { LLMProviderFactory } from './llm/factory'
import { runRAG, SCOPE_REMINDER } from './rag/pipeline'
import { buildKnowledgeBase } from './rag/knowledge'
import { checkMessage, createOutputGuard, sanitizeHistory, REPLIES } from './rag/guard'

export { VaultLock } from './vault'

// Initialize knowledge base at cold start
// Embeddings are lazily initialized on first request
const rawChunks = buildKnowledgeBase()
let embeddedChunks: Array<typeof rawChunks[0] & { embedding: number[] }> | null = null

const router = Router()

/**
 * Lazily initialize embeddings for all knowledge chunks.
 * First request will be slightly slower, subsequent requests are fast.
 */
async function getEmbeddedChunks(env: Env) {
  if (embeddedChunks) return embeddedChunks

  const { embedBatch } = await import('./rag/embedder')
  // Embed metadata (company, role, period) alongside content so queries like
  // "where does he work" surface experience chunks by employer, not just keywords.
  const texts = rawChunks.map((c) => {
    const meta = c.metadata ?? {}
    const metaParts = [meta.company, meta.role, meta.period, meta.project].filter(Boolean).join(', ')
    return metaParts ? `${metaParts}. ${c.content}` : c.content
  })
  const embeddings = await embedBatch(texts, env)

  embeddedChunks = rawChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }))

  return embeddedChunks
}

/**
 * CORS headers helper
 */
function corsHeaders(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGINS || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

const sseEvent = (data: Record<string, unknown>) => `data: ${JSON.stringify(data)}\n\n`

/**
 * A fixed answer in the same SSE shape as a streamed one, so the chat widget
 * needs no special case. Used when the guard blocks a message before the LLM.
 */
function cannedReply(content: string, env: Env): Response {
  const body =
    sseEvent({ type: 'sources', sources: [] }) +
    sseEvent({ type: 'content', content }) +
    sseEvent({ type: 'done' })
  return new Response(body, { headers: { ...SSE_HEADERS, ...corsHeaders(env) } })
}

/**
 * Handle CORS preflight requests
 */
router.options('*', (request: Request, env: Env) => {
  return new Response(null, {
    headers: corsHeaders(env),
  })
})

/**
 * GET /api/health — Health check
 */
router.get('/api/health', () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

/**
 * GET /api/providers — List available LLM providers
 */
router.get('/api/providers', (request: Request, env: Env) => {
  const currentProvider = env.LLM_PROVIDER || 'openai'
  return new Response(
    JSON.stringify({
      current: currentProvider,
      available: LLMProviderFactory.listProviders(),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

/**
 * GET /api/config — Get current configuration (without secrets)
 */
router.get('/api/config', (request: Request, env: Env) => {
  return new Response(
    JSON.stringify({
      provider: env.LLM_PROVIDER || 'openai',
      openaiModel: env.OPENAI_MODEL || 'gpt-4o-mini',
      geminiModel: env.GEMINI_MODEL || 'gemini-1.5-flash',
      embeddingModel: '@cf/baai/bge-small-en-v1.5 (Workers AI, free)',
      maxTokens: parseInt(env.MAX_TOKENS || '512'),
      temperature: parseFloat(env.TEMPERATURE || '0.7'),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

/**
 * POST /api/chat — Chat with RAG (streaming response)
 *
 * Request body:
 * {
 *   "message": "User's question",
 *   "history": [  // Optional: previous messages for context
 *     { "role": "user"|"assistant", "content": "..." }
 *   ]
 * }
 *
 * Response: Server-Sent Events stream
 */
router.post('/api/chat', async (request: Request, env: Env) => {
  try {
    const body = (await request.json()) as {
      message: string
      history?: unknown
    }

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing "message" field in request body' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env),
          },
        }
      )
    }

    const question = body.message.trim()

    // Step 0: Off-topic, code and injection requests never reach the LLM
    const blocked = checkMessage(question)
    if (blocked) return cannedReply(REPLIES[blocked], env)

    // Step 1: Initialize embeddings (lazy) and run RAG
    const chunks = await getEmbeddedChunks(env)
    const ragResult = await runRAG(question, env, chunks)

    // Step 2: Build messages array for LLM — system prompt, sanitized
    // history, the question, then the scope reminder
    const messages: ChatMessage[] = [
      { role: 'system', content: ragResult.systemPrompt },
      ...sanitizeHistory(body.history),
      { role: 'user', content: question },
      { role: 'system', content: SCOPE_REMINDER },
    ]

    // Step 3: Get the LLM provider and stream the response
    const config = getLLMConfig(env)
    const provider = LLMProviderFactory.getProvider(config)

    const llmStream = await provider.chat(messages, config)

    // Step 4: Transform the LLM stream into SSE with source metadata
    const encoder = new TextEncoder()

    // Send sources as the first SSE event
    const sourceEvent = `data: ${JSON.stringify({
      type: 'sources',
      sources: ragResult.sources,
    })}\n\n`

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Write the source event first
    writer.write(encoder.encode(sourceEvent))

    // Then pipe the LLM stream as content events. If the answer turns into
    // code, stop the model and tell the widget to replace what it has shown.
    ;(async () => {
      const llmReader = llmStream.getReader()
      const outputGuard = createOutputGuard()
      try {
        while (true) {
          const { done, value } = await llmReader.read()
          if (done) break
          if (!outputGuard.push(value)) {
            await llmReader.cancel()
            await writer.write(encoder.encode(sseEvent({ type: 'replace', content: REPLIES.code })))
            break
          }
          await writer.write(encoder.encode(sseEvent({ type: 'content', content: value })))
        }
        // Signal end of stream
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        )
      } catch (err) {
        const errorEvent = `data: ${JSON.stringify({
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        })}\n\n`
        await writer.write(encoder.encode(errorEvent))
      } finally {
        await writer.close()
        llmReader.releaseLock()
      }
    })()

    return new Response(readable, {
      headers: { ...SSE_HEADERS, ...corsHeaders(env) },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders(env),
        },
      }
    )
  }
})

/**
 * POST /api/vault/unlock — { pin } → { key } for the right PIN.
 * One Durable Object instance holds the global wrong-PIN count.
 */
router.post('/api/vault/unlock', async (request: Request, env: Env) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(env) }
  const body = await request.text()
  if (body.length > 200) {
    return new Response(JSON.stringify({ error: 'bad_request' }), { status: 400, headers })
  }
  const lock = env.VAULT_LOCK.get(env.VAULT_LOCK.idFromName('notes-vault'))
  const res = await lock.fetch('https://vault-lock/unlock', { method: 'POST', body })
  return new Response(res.body, { status: res.status, headers })
})

/**
 * Proxy /api/admin requests to the Python backend (Render)
 * Set PYTHON_BACKEND_URL env var to your Render URL once deployed.
 * Keep it empty to fall back to local profiles (no upload capability).
 */
router.all('/api/admin/:path*', async (request: Request, env: Env) => {
  const pythonBackendUrl = env.PYTHON_BACKEND_URL
  
  // If no backend URL configured, return fallback profiles for GET
  if (!pythonBackendUrl) {
    const pathname = new URL(request.url).pathname
    if (request.method === 'GET' && pathname === '/api/admin/profiles') {
      const profiles = [
        { id: 'mobile-dev',       label: 'Mobile Developer',     icon: '📱',  uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
        { id: 'java-software-dev', label: 'Java Software Dev',    icon: '☕',  uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
        { id: 'backend-software',  label: 'Backend Software',     icon: '⚙️', uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
        { id: 'aiml',              label: 'AI/ML Engineer',       icon: '🤖', uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
        { id: 'nodejs-dev',        label: 'Node.js Developer',    icon: '🟢', uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
        { id: 'fullstack-dev',     label: 'Fullstack Developer',  icon: '🌐', uploaded_at: null, chunk_count: 0, file_name: null, file_size: null, cloud_url: null, active: false },
      ]
      return new Response(
        JSON.stringify({ profiles }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders(env) } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Resume upload works on local only. Run: cd chatbot/backend-python && python -m src.main' }),
      { status: 501, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) } }
    )
  }

  // Proxy to Python backend
  try {
    const url = new URL(request.url)
    const targetUrl = new URL(url.pathname + url.search, pythonBackendUrl)
    
    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow',
    })

    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders(env)).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error'
    return new Response(
      JSON.stringify({ error: `Backend unreachable: ${message}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders(env) } }
    )
  }
})

/**
 * 404 handler
 */
router.all('*', () => {
  return new Response(
    JSON.stringify({ error: 'Not found. Available endpoints: GET /api/health, POST /api/chat, GET /api/providers, GET /api/config, GET /api/admin/profiles' }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    }
  )
})

export default {
  fetch: router.fetch,
}
