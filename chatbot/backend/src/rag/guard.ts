/**
 * Guardrails — keep the assistant scoped to questions about Ayush.
 *
 * The system prompt alone is not enough: visitors can wrap any task in
 * "...that Ayush knows" and the model will happily write the code. So:
 * 1. Input checks run before the LLM is called (code/task requests, prompt
 *    injection, oversized messages) and answer with a fixed redirect.
 * 2. History from the client is untrusted: only user/assistant turns survive,
 *    each one truncated, and turns that already broke scope are dropped.
 * 3. The output guard watches the streamed answer and swaps it for the
 *    redirect if the model starts emitting code anyway.
 *
 * Mirrored in chatbot/backend-python/src/rag/guard.py — keep the two in sync.
 */

import type { ChatMessage } from '../config'

export const MAX_MESSAGE_CHARS = 500
export const MAX_HISTORY_MESSAGES = 6
export const MAX_HISTORY_CHARS = 1000

const EMAIL = 'ayusharyan1309@gmail.com'
const GITHUB_URL = 'https://github.com/ayusharyan1309'
const LEETCODE_URL = 'https://leetcode.com/u/ayusharyan1309/'

export const REPLIES = {
  code:
    `I can't write or share code here — I only answer questions about Ayush's experience, projects and skills. ` +
    `You can read his real code on GitHub (${GITHUB_URL}) and see his DSA practice on LeetCode (${LEETCODE_URL}). ` +
    `Want to know which projects he built in Java, or what he's done with Kafka?`,
  offTopic:
    `I can only answer questions about Ayush — his experience, projects, skills, education and how to reach him. ` +
    `Try asking what he built at Visionify or EventStrat, or email him at ${EMAIL}.`,
  tooLong: `That's a bit long for me. Please ask a short question about Ayush's work (under ${MAX_MESSAGE_CHARS} characters).`,
} as const

export type BlockReason = keyof typeof REPLIES

const LANGUAGES = 'java|python|c\\+\\+|cpp|c#|javascript|js|typescript|ts|go|golang|kotlin|rust|sql|dart|c'

// "write / give me ... code", "palindrome partitioning code in java", "solve two sum"
const CODE_REQUEST = [
  /\b(write|give|show|share|send|provide|generate|create|print|paste|type out|output)\b[^.?!\n]{0,60}\b(code|program|snippet|function|method|class|script|pseudo-?code|regex)\b/i,
  /\b(code|program|snippet|script|pseudo-?code)\s+(for|of|to|in|that|which|using)\b/i,
  new RegExp(`\\b(solution|implementation|algorithm|approach)\\s+(\\w+\\s+){0,2}(in|using)\\s+(${LANGUAGES})\\b`, 'i'),
  /\b(solution|answer|algorithm|approach|implementation)\s+(to|for|of)\s+(this|that|the|a|an)?\s*(\w+\s+){0,3}(problem|question|challenge|puzzle)\b/i,
  /(^|\b(can|could|would|will) you\s+|\bplease\s+|\bhelp me\s+(to\s+)?)(implement|solve|debug|refactor|optimi[sz]e|dry[- ]run|code)\b/i,
  /\bhow (do|can|would|should|to) (i |you |we |one |he |ayush )?[^.?!\n]{0,40}\b(code|implement|program|solve|reverse|sort|traverse|parse)\b/i,
  /\b(fix|review|complete|finish|correct)\s+(this|my|the following|the)\s+(code|program|function|query|bug|snippet)\b/i,
  /\b(write|give|show|create|generate)\b[^.?!\n]{0,30}\bquery\s+(to|for|that)\b/i,
  /\b(leetcode|gfg|geeksforgeeks|hackerrank|codeforces|dsa)\s+(problem|question|#?\d+)\b/i,
  /```|#include\s*<|public\s+static\s+void|System\.out\.print|\bdef\s+\w+\s*\(|console\.log\(/,
]

// Unrelated deliverables.
const TASK_REQUEST = [
  /\b(write|compose|draft|generate|create)\b[^.?!\n]{0,40}\b(essay|poem|story|song|joke|email|letter|article|blog|tweet|post|speech)\b/i,
  /\btranslate\b/i,
]

const PROMPT_INJECTION = [
  /\b(ignore|disregard|forget|override|bypass)\b[^.?!\n]{0,40}\b(previous|above|prior|earlier|all|any|your|the|these|system)\b[^.?!\n]{0,30}\b(instructions?|rules?|prompts?|guidelines?|messages?|restrictions?)\b/i,
  /\b(system prompt|developer (message|mode)|initial prompt|hidden prompt|your (instructions|rules|prompt|guidelines))\b/i,
  /\b(you are now|from now on,? (you|act|answer|respond|reply)|pretend (to be|you are|that you)|role-?play|jailbreak|dan mode)\b/i,
  /^\s*(please\s+)?act as\b/i,
  /\b(reveal|repeat|print|show)\b[^.?!\n]{0,30}\b(instructions|prompt)\b/i,
]

export function checkMessage(message: string): BlockReason | null {
  if (message.length > MAX_MESSAGE_CHARS) return 'tooLong'
  if (PROMPT_INJECTION.some((re) => re.test(message))) return 'offTopic'
  if (CODE_REQUEST.some((re) => re.test(message))) return 'code'
  if (TASK_REQUEST.some((re) => re.test(message))) return 'offTopic'
  return null
}

// Code in the model's answer: fences, or a line that starts a declaration.
const CODE_OUTPUT = [
  /```/,
  /(^|\n)\s*(public|private|protected)\s+(static\s+)?[\w<>[\],\s]+\s+\w+\s*\(/,
  /(^|\n)\s*(class|interface)\s+\w+[^\n]*\{/,
  /(^|\n)\s*(def|function|fn|func)\s+\w+\s*\(/,
  /(^|\n)\s*(#include|import\s+java\.|from\s+\w+\s+import\s)/,
  /\b(System\.out\.println|console\.log)\(/,
  /(^|\n)\s*for\s*\(\s*(int|let|var|const)\s+\w+\s*=/,
]

export function looksLikeCode(text: string): boolean {
  return CODE_OUTPUT.some((re) => re.test(text))
}

/**
 * Keep only well-formed user/assistant turns from the client, truncated. User
 * turns that would be blocked now and assistant turns containing code are
 * dropped — forged history is the easiest way around the system prompt.
 */
export function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return []

  const turns: ChatMessage[] = []
  for (const item of history) {
    if (!item || typeof item !== 'object') continue
    const { role, content } = item as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue
    const text = content.trim().slice(0, MAX_HISTORY_CHARS)
    if (!text) continue
    if (role === 'user' && checkMessage(text)) continue
    if (role === 'assistant' && looksLikeCode(text)) continue
    turns.push({ role, content: text })
  }

  const recent = turns.slice(-MAX_HISTORY_MESSAGES)
  // Some providers require the conversation to open with a user turn.
  while (recent.length && recent[0].role !== 'user') recent.shift()
  return recent
}

/** Accumulates the streamed answer; push() returns false once it turns into code. */
export function createOutputGuard() {
  let text = ''
  return {
    push(chunk: string): boolean {
      text += chunk
      return !looksLikeCode(text)
    },
  }
}
