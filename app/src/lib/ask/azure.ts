// The one call to the model (SKATGO-9). Azure OpenAI, through its OpenAI-compatible endpoint, the
// same deployment family Trovestep uses. The endpoint and key come from the environment and are
// read per request: the process never starts without them, it just answers 503 until they exist.
//
// Nothing about a conversation is logged here — not the question, not the answer.

import { LIMITS } from './limits'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type AskResult = { ok: true; text: string } | { ok: false; status: 'unconfigured' | 'upstream' | 'timeout' }

const DEFAULT_MODEL = 'gpt-5.6-luna'
const DEFAULT_EFFORT = 'medium'

export function isConfigured(): boolean {
  return Boolean(process.env.LLM_BASE_URL && process.env.LLM_API_KEY)
}

export async function askModel(system: string, messages: ChatMessage[]): Promise<AskResult> {
  const base = process.env.LLM_BASE_URL
  const key = process.env.LLM_API_KEY
  if (!base || !key) return { ok: false, status: 'unconfigured' }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LIMITS.timeoutMs)
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || DEFAULT_MODEL,
        reasoning_effort: process.env.LLM_EFFORT || DEFAULT_EFFORT,
        max_completion_tokens: LIMITS.answerTokens,
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    })
    if (!res.ok) {
      // The body may echo the request; it is not read.
      await res.body?.cancel()
      console.error(`[ask] upstream ${res.status}`)
      return { ok: false, status: 'upstream' }
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = body.choices?.[0]?.message?.content
    if (typeof text !== 'string' || text.trim() === '') return { ok: false, status: 'upstream' }
    return { ok: true, text }
  } catch (e) {
    if (controller.signal.aborted) return { ok: false, status: 'timeout' }
    console.error(`[ask] transport failed: ${(e as Error).message}`)
    return { ok: false, status: 'upstream' }
  } finally {
    clearTimeout(timer)
  }
}
