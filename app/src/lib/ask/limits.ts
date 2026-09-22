// Abuse limits for the public /api/ask endpoint (SKATGO-9). Anyone can call it without an account,
// and every call costs money, so the door is narrow: a per-IP rate, a site-wide daily cap, and a
// short question. Counters live in this process — production runs exactly one replica
// (operations.md), so that is the whole site — and restart with it.

export const LIMITS = {
  /** Calls per IP inside the window. */
  perIp: 10,
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

const byIp = new Map<string, number[]>()
let day = ''
let today = 0

/** Records one call and says whether it is allowed. `now` is injectable for the tests. */
export function admit(ip: string, now = Date.now()): Refusal | null {
  const d = new Date(now).toISOString().slice(0, 10)
  if (d !== day) {
    day = d
    today = 0
  }
  if (today >= LIMITS.perDay) return 'daily'
  const recent = (byIp.get(ip) ?? []).filter((t) => now - t < LIMITS.windowMs)
  if (recent.length >= LIMITS.perIp) {
    byIp.set(ip, recent)
    return 'rate'
  }
  recent.push(now)
  byIp.set(ip, recent)
  today += 1
  // Forget addresses that have gone quiet, so the map cannot grow without bound.
  if (byIp.size > 5000) {
    for (const [k, v] of byIp) if (v.every((t) => now - t >= LIMITS.windowMs)) byIp.delete(k)
  }
  return null
}

/** Test hook: start from nothing. */
export function resetLimits(): void {
  byIp.clear()
  day = ''
  today = 0
}
