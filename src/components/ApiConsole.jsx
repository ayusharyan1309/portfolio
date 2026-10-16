import { useEffect, useState } from 'react'
import { personalInfo } from '../data/portfolio'
import { openChat } from './Icons'

// Values wrapped with t() are coloured by track inside the JSON.
const t = (value, track) => ({ $value: value, track })

function experienceLabel(since) {
  const [y, m] = since.split('-').map(Number)
  const now = new Date()
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) parts.push(`${years} yr`)
  if (rest) parts.push(`${rest} mo`)
  return `${parts.join(' ')} full-time`
}

const QUESTIONS = [
  'What has Ayush built with Kafka?',
  'How does this RAG assistant work?',
  'What GenAI work has he shipped?',
]

const ENDPOINTS = [
  {
    id: 'me',
    method: 'GET',
    path: '/api/me',
    ms: 38,
    body: {
      name: personalInfo.name,
      role: personalInfo.currentRole,
      focus: [t('Java backend', 'backend'), t('GenAI / RAG', 'ai')],
      experience: experienceLabel(personalInfo.fullTimeSince),
      location: personalInfo.location,
      openTo: ['Java Backend Engineer', 'GenAI Engineer'],
      status: 'open_to_work',
      email: personalInfo.email,
    },
  },
  {
    id: 'stack',
    method: 'GET',
    path: '/api/stack',
    ms: 21,
    body: {
      backend: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'gRPC', 'Microservices'].map((s) => t(s, 'backend')),
      genai: ['RAG', 'LLM APIs', 'Embeddings', 'Vector search', 'LangChain4j'].map((s) => t(s, 'ai')),
      data: ['MySQL', 'MongoDB', 'Elasticsearch'],
      cloud: ['AWS', 'Docker', 'Jenkins'],
    },
  },
  {
    id: 'ask',
    method: 'POST',
    path: '/api/ask',
    ms: null,
    body: {
      answeredBy: t('RAG over my resume and projects', 'ai'),
      try: QUESTIONS.map((q) => ({ $question: q })),
    },
  },
]

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function Value({ value }) {
  if (value && typeof value === 'object' && '$question' in value) {
    return (
      <button
        type="button"
        onClick={() => openChat(value.$question)}
        className="text-soft underline decoration-lilac/50 underline-offset-4 hover:text-lilac hover:decoration-lilac text-left cursor-pointer"
      >
        "{value.$question}"
      </button>
    )
  }
  if (value && typeof value === 'object' && '$value' in value) {
    return (
      <span className={value.track === 'backend' ? 'text-amber' : 'text-lilac'}>"{value.$value}"</span>
    )
  }
  if (typeof value === 'boolean') return <span className="text-soft">{String(value)}</span>
  return <span className="text-text">"{value}"</span>
}

function Json({ body }) {
  const entries = Object.entries(body)
  return (
    <div>
      <span className="text-muted">{'{'}</span>
      {entries.map(([key, value], i) => {
        const comma = i < entries.length - 1 ? <span className="text-muted">,</span> : null
        return (
          <div key={key} className="pl-4">
            <span className="text-key">"{key}"</span>
            <span className="text-muted">: </span>
            {Array.isArray(value) ? (
              <>
                <span className="text-muted">[</span>
                {value.map((v, j) => (
                  <div key={j} className="pl-4">
                    <Value value={v} />
                    {j < value.length - 1 && <span className="text-muted">,</span>}
                  </div>
                ))}
                <span className="text-muted">]</span>
                {comma}
              </>
            ) : (
              <>
                <Value value={value} />
                {comma}
              </>
            )}
          </div>
        )
      })}
      <span className="text-muted">{'}'}</span>
    </div>
  )
}

export default function ApiConsole() {
  const [active, setActive] = useState('me')
  const [typed, setTyped] = useState(0)
  const [question, setQuestion] = useState('')
  const endpoint = ENDPOINTS.find((e) => e.id === active)
  const requestLine = `${endpoint.method} ${endpoint.path}`
  const done = typed >= requestLine.length

  // Type the request line, then show the response — the page's one bit of
  // unprompted motion. Skipped entirely for reduced-motion users.
  useEffect(() => {
    if (reducedMotion()) {
      setTyped(requestLine.length)
      return
    }
    let n = 0
    setTyped(0)
    const id = setInterval(() => {
      n += 1
      setTyped(n)
      if (n >= requestLine.length) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [requestLine])

  const ask = (e) => {
    e.preventDefault()
    if (!question.trim()) return
    openChat(question.trim())
    setQuestion('')
  }

  return (
    <div className="rounded-xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)] font-mono text-[13px] leading-relaxed overflow-hidden">
      <div role="tablist" aria-label="Endpoints" className="flex border-b border-line overflow-x-auto">
        {ENDPOINTS.map((e) => (
          <button
            key={e.id}
            role="tab"
            type="button"
            aria-selected={active === e.id}
            onClick={() => setActive(e.id)}
            className={`px-4 py-2.5 whitespace-nowrap border-r border-line cursor-pointer transition-colors ${
              active === e.id ? 'bg-raised text-text' : 'text-muted hover:text-soft'
            }`}
          >
            <span className={e.method === 'GET' ? 'text-amber' : 'text-lilac'}>{e.method}</span> {e.path}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-5 min-h-[23rem] break-words" role="tabpanel" aria-live="polite">
        <div className="text-soft">
          <span className="text-muted">$ </span>
          {requestLine.slice(0, typed)}
          {!done && <span className="inline-block w-2 h-4 align-middle bg-amber ml-0.5" style={{ animation: 'caret 1s step-end infinite' }} />}
        </div>

        {done && (
          <div className="mt-3" style={{ animation: 'reveal 0.25s ease-out' }}>
            <Json body={endpoint.body} />

            {endpoint.id === 'ask' && (
              <form onSubmit={ask} className="mt-4 flex gap-2">
                <label htmlFor="ask-input" className="sr-only">Ask a question about Ayush's work</label>
                <input
                  id="ask-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything about my work"
                  className="flex-1 min-w-0 rounded-md border border-line bg-bg px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-lilac"
                />
                <button type="submit" className="rounded-md bg-lilac px-3 py-2 font-sans font-semibold text-bg hover:bg-lilac/90 cursor-pointer">
                  Ask
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2 text-xs text-muted">
        <span>{done ? (endpoint.ms ? '200 OK' : 'Streams over SSE') : 'Sending…'}</span>
        <span>{done && endpoint.ms ? `${endpoint.ms} ms` : 'application/json'}</span>
      </div>
    </div>
  )
}
