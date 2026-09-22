// Abuse limits for the /api/ask endpoint (SKATGO-9). Every call costs money, so the door is narrow: a
// per-account rate (SKATGO-12 — by account rather than address, so a school or a household behind
// one address does not share one allowance), a site-wide daily cap, and a short question. Counters
// live in this process — production runs exactly one replica (operations.md), so that is the whole
// site — and restart with it.

export const LIMITS = {
  /** Calls per account inside the window. */
  perAccount: 10,
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

const byAccount = new Map<string, number[]>()
let day = ''
let today = 0

/** Records one call and says whether it is allowed. `now` is injectable for the tests. */
export function admit(account: string, now = Date.now()): Refusal | null {
  const d = new Date(now).toISOString().slice(0, 10)
  if (d !== day) {
    day = d
    today = 0
  }
  if (today >= LIMITS.perDay) return 'daily'
  const recent = (byAccount.get(account) ?? []).filter((t) => now - t < LIMITS.windowMs)
  if (recent.length >= LIMITS.perAccount) {
    byAccount.set(account, recent)
    return 'rate'
  }
  recent.push(now)
  byAccount.set(account, recent)
  today += 1
  // Forget accounts that have gone quiet, so the map cannot grow without bound.
  if (byAccount.size > 5000) {
    for (const [k, v] of byAccount) if (v.every((t) => now - t >= LIMITS.windowMs)) byAccount.delete(k)
  }
  return null
}

/** Test hook: start from nothing. */
export function resetLimits(): void {
  byAccount.clear()
  day = ''
  today = 0
}
