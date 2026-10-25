// A player's record of play (SKATGO-128): what the service sends for every deal they played against the AI on the
// same cards, and what the page makes of it. Shared by `multiplayer/src/profile.ts` and the pages.
//
// A deal is judged against the whole table (the human: 「每个deal的差值=用户-lina+用户-noah……然后比较用户的差值和ai的差值，算这个差值
// 的差」): the player's Seeger-Fabian score minus each opponent's, and the same for the AI's game of the same deal from
// the same seat; the difference of the two is how much better or worse the player did than the AI. Unlike the player's
// score alone it also counts defence, where Seeger-Fabian gives both defenders the same.

export type Scores = [number, number, number]

/** One deal: the tournament's day it was played on, where, and the Seeger-Fabian scores of all three seats ([0] the
 *  player's) in the player's game and in the AI's game of the same deal. */
export type ProfileDeal = {
  day: string
  source: 'daily' | 'free'
  mine: Scores
  /** The AI's game from the same seat; null for a tournament day dealt before it played them. */
  ai: Scores | null
}

/** A game against the table: the player's score minus each opponent's. */
export const againstTable = (s: Scores) => 2 * s[0] - s[1] - s[2]

/** A deal against the AI: the player's game against the table minus the AI's. */
export const againstAi = (d: ProfileDeal): number | null => (d.ai === null ? null : againstTable(d.mine) - againstTable(d.ai))

export type ProfileDay = {
  day: string
  deals: number
  /** The average per deal against the AI, over the day's deals that have the AI's game; null when none has. */
  perDeal: number | null
}

/** The days played, oldest first: how many deals, and the average per deal against the AI. */
export function daysOf(deals: ProfileDeal[]): ProfileDay[] {
  const days = new Map<string, { deals: number; sum: number; judged: number }>()
  for (const d of deals) {
    const day = days.get(d.day) ?? { deals: 0, sum: 0, judged: 0 }
    const diff = againstAi(d)
    day.deals += 1
    if (diff !== null) {
      day.sum += diff
      day.judged += 1
    }
    days.set(d.day, day)
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, d]) => ({ day, deals: d.deals, perDeal: d.judged ? Math.round(d.sum / d.judged) : null }))
}

/**
 * The last day played against every day before it, per deal: better, worse, or the same within the noise — a
 * difference counts only beyond twice its standard error, from the spread of single deals. Null before a second day.
 */
export function trendOf(deals: ProfileDeal[]): { last: number; before: number; verdict: 'up' | 'down' | 'same' } | null {
  const judged = deals.flatMap((d) => {
    const diff = againstAi(d)
    return diff === null ? [] : [{ day: d.day, diff }]
  })
  const lastDay = judged.at(-1)?.day
  const last = judged.filter((d) => d.day === lastDay).map((d) => d.diff)
  const before = judged.filter((d) => d.day !== lastDay).map((d) => d.diff)
  if (!last.length || !before.length) return null
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const all = judged.map((d) => d.diff)
  const spread = Math.sqrt(all.reduce((a, x) => a + (x - mean(all)) ** 2, 0) / all.length)
  const noise = 2 * spread * Math.sqrt(1 / last.length + 1 / before.length)
  const change = mean(last) - mean(before)
  return {
    last: Math.round(mean(last)),
    before: Math.round(mean(before)),
    verdict: change > noise ? 'up' : change < -noise ? 'down' : 'same',
  }
}
