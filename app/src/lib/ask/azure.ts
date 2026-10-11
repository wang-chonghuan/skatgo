// The one call to the model (SKATGO-9). Azure OpenAI, through its OpenAI-compatible endpoint, the
// same deployment family Trovestep uses. The endpoint and key come from the environment and are
// read per request: the process never starts without them, it just answers 503 until they exist.
//
// The answer is streamed (SKATGO-14), as Trovestep's assistant streams: what the model is given — the
// system prompt, the messages, the model, the effort, the token cap — is exactly what it was; only
// the answer now arrives piece by piece instead of whole.
//
// Nothing about a conversation is logged here — not the question, not the answer.

import { LIMITS } from './limits'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** An opened answer: its pieces as they arrive, or why it could not be opened. */
export type ModelStream =
  | { ok: true; deltas: AsyncGenerator<string> }
  | { ok: false; status: 'unconfigured' | 'upstream' | 'timeout' }

const DEFAULT_MODEL = 'gpt-5.6-luna'
const DEFAULT_EFFORT = 'medium'

/**
 * Opens the model's answer. Resolves once the model has accepted the request (so a refusal is still an
 * ordinary error response); the pieces then follow. `signal` aborts the call — the reader leaving, or
 * the whole-answer time limit, which covers the stream too.
 */
export async function openModelStream(system: string, messages: ChatMessage[], signal: AbortSignal): Promise<ModelStream> {
  const base = process.env.LLM_BASE_URL
  const key = process.env.LLM_API_KEY
  if (!base || !key) return { ok: false, status: 'unconfigured' }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || DEFAULT_MODEL,
        reasoning_effort: process.env.LLM_EFFORT || DEFAULT_EFFORT,
        max_completion_tokens: LIMITS.answerTokens,
        messages: [{ role: 'system', content: system }, ...messages],
        stream: true,
      }),
    })
    if (!res.ok || !res.body) {
      // The body may echo the request; it is not read.
      await res.body?.cancel()
      console.error(`[ask] upstream ${res.status}`)
      return { ok: false, status: 'upstream' }
    }
    return { ok: true, deltas: readModelDeltas(res.body) }
  } catch (e) {
    if (signal.aborted) return { ok: false, status: 'timeout' }
    console.error(`[ask] transport failed: ${(e as Error).message}`)
    return { ok: false, status: 'upstream' }
  }
}

/**
 * The text pieces of an OpenAI-style chat-completions stream: `data: {…}` lines whose
 * `choices[0].delta.content` carries the next piece, ended by `data: [DONE]`. Lines without text
 * (the role announcement, content-filter results, keep-alives) are skipped.
 */
export async function* readModelDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') return
        const piece = (JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[] }).choices?.[0]?.delta?.content
        if (piece) yield piece
      }
    }
  } finally {
    reader.releaseLock()
  }
}
