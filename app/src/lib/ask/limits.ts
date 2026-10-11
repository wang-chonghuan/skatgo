// Abuse limits for the /api/ask endpoint (SKATGO-9). Anyone may ask (SKATGO-13) and every call costs
// money, so the door is narrow: a per-visitor rate — a signed-in learner counted by account, anyone
// else by address — a site-wide daily cap, and a short question. Counters live in this process —
// production runs exactly one replica (operations.md), so that is the whole site — and restart with it.

export const LIMITS = {
  /** Calls per visitor (account or address) inside the window. */
  perVisitor: 10,
  windowMs: 60_000,
  /** Calls site-wide per UTC day. */
  perDay: 500,
  /** Characters in one question. */
  questionChars: 500,
  /** Messages of the popup's own conversation the browser may send along. */
  messages: 6,
  /** Tokens the model may spend on one answer. */
  answerTokens: 700,
  /** How long one call to the model may take. */
  timeoutMs: 30_000,
} as const

export type Refusal = 'rate' | 'daily'

const byVisitor = new Map<string, number[]>()
let day = ''
let today = 0

/** Records one call and says whether it is allowed. `now` is injectable for the tests. */
export function admit(visitor: string, now = Date.now()): Refusal | null {
  const d = new Date(now).toISOString().slice(0, 10)
  if (d !== day) {
    day = d
    today = 0
  }
  if (today >= LIMITS.perDay) return 'daily'
  const recent = (byVisitor.get(visitor) ?? []).filter((t) => now - t < LIMITS.windowMs)
  if (recent.length >= LIMITS.perVisitor) {
    byVisitor.set(visitor, recent)
    return 'rate'
  }
  recent.push(now)
  byVisitor.set(visitor, recent)
  today += 1
  // Forget visitors who have gone quiet, so the map cannot grow without bound.
  if (byVisitor.size > 5000) {
    for (const [k, v] of byVisitor) if (v.every((t) => now - t >= LIMITS.windowMs)) byVisitor.delete(k)
  }
  return null
}

/** Test hook: start from nothing. */
export function resetLimits(): void {
  byVisitor.clear()
  day = ''
  today = 0
}
