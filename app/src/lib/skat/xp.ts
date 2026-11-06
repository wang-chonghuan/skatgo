// Experience points (SKATGO-172, the human: 「看和ai的得分差距，比ai高了x分，一样了y分，低了z分，都加分，但是根据差值换算，作为
// 经验值，可以每周重置」, then 「那就不要平均值」): every deal against the AI earns XP, more the better it went against the AI's
// own game on the same cards in the same seat; a week's XP is the sum over its deals, and every Monday starts at 0. Pure:
// the multiplayer service sums the week with it, and the page states the same tiers.

/** The five tiers of a deal by its Seeger-Fabian difference to the AI's: far below, below, the same, above, far above. */
export type XpTier = 'farBelow' | 'below' | 'same' | 'above' | 'farAbove'

/** What each tier earns. */
export const XP: Record<XpTier, number> = { farBelow: 4, below: 6, same: 10, above: 14, farAbove: 20 }

/** From this difference on a deal is far above or below the AI's. */
export const XP_FAR = 50

/** A deal's tier from the player's score minus the AI's; a deal without the AI's result counts as the same. */
export function xpTier(diff: number | null): XpTier {
  if (diff === null || diff === 0) return 'same'
  if (diff >= XP_FAR) return 'farAbove'
  if (diff > 0) return 'above'
  return diff <= -XP_FAR ? 'farBelow' : 'below'
}

/** What a deal earns on top of its tier when the player declared it, won or lost: taking a game is never worse for XP
 *  than passing it by (SKATGO-172 — on the regulars' 941 deals the declared ones earned 8.13 a deal, the rest 9.50; 2
 *  evens that out without making a lost game nearly free, as 4 did; the human: 「改成+2」). */
export const XP_OWN_GAME = 2

/** A deal's XP: its tier, and the own game's extra when the player declared. */
export const xpOf = (diff: number | null, declared = false) => XP[xpTier(diff)] + (declared ? XP_OWN_GAME : 0)

const DAY_MS = 86_400_000
const dateOf = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)))
const dayAt = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** The Monday of a day's week, as `YYYY-MM-DD`. */
export function weekStart(day: string): string {
  const t = dateOf(day)
  return dayAt(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY_MS)
}

/** Days until the next Monday, when the week starts again: 7 on a Monday, 1 on a Sunday. */
export const daysToReset = (day: string) => 7 - (dateOf(day) - dateOf(weekStart(day))) / DAY_MS

/** Days in a row with at least one deal, ending today or yesterday; 0 when the last such day is older. */
export function streakOf(days: Iterable<string>, today: string): number {
  const played = new Set(days)
  let t = dateOf(today)
  if (!played.has(today)) t -= DAY_MS
  let n = 0
  while (played.has(dayAt(t))) {
    n += 1
    t -= DAY_MS
  }
  return n
}

/** The week's board as the service answers it: every account with XP this week, the most first, equal XP sharing a
 *  rank; its streak, at least 1 for anyone on it; `you` on the asker's own row; the days until it starts again. Names
 *  only, never a player id. */
export type XpBoard = { rows: { rank: number; nickname: string; xp: number; streak: number; you?: true }[]; resetsIn: number }
