// A player's record of play (SKATGO-128): what the service sends for every deal they played against the AI on the
// same cards, and what the page makes of it. Shared by `multiplayer/src/profile.ts` and the pages.
//
// A deal is judged against the whole table (the human: 「每个deal的差值=用户-lina+用户-noah……然后比较用户的差值和ai的差值，算这个差值
// 的差」): the player's Seeger-Fabian score minus each opponent's, and the same for the AI's game of the same deal from
// the same seat; the difference of the two is how much better or worse the player did than the AI. Unlike the player's
// score alone it also counts defence, where Seeger-Fabian gives both defenders the same.

export type Scores = [number, number, number]

/** How one game of a deal went: the three seats' Seeger-Fabian scores ([0] the player's, or the AI's in the player's
 *  seat), who declared (null when all passed) and whether the declarer won. */
export type Played = { scores: Scores; declarer: 0 | 1 | 2 | null; won: boolean | null }

/** One deal: the tournament's day it was played on, where, the player's game and the AI's game of the same deal. */
export type ProfileDeal = {
  day: string
  source: 'daily' | 'free'
  mine: Played
  /** The AI's game from the same seat; null for a tournament day dealt before it played them. */
  ai: Played | null
}

/** A game against the table: the player's score minus each opponent's. */
export const againstTable = (s: Scores) => 2 * s[0] - s[1] - s[2]

/** A deal against the AI: the player's game against the table minus the AI's. */
export const againstAi = (d: ProfileDeal): number | null => (d.ai === null ? null : againstTable(d.mine.scores) - againstTable(d.ai.scores))

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

/**
 * Where a deal's difference against the AI comes from, by who declared it from the player's seat (the human, on the
 * week's analysis: 「你给的四条加上结论，就很好」): the player declared a game the AI did not (`bidAlone`), both declared
 * (`bothPlayed`), the AI declared and the player did not (`aiAlone`), or neither did (`defended`).
 */
export type Kind = 'bidAlone' | 'bothPlayed' | 'aiAlone' | 'defended'
export const KINDS: Kind[] = ['bidAlone', 'bothPlayed', 'aiAlone', 'defended']

export function kindOf(d: ProfileDeal & { ai: Played }): Kind {
  const mine = d.mine.declarer === 0
  const ai = d.ai.declarer === 0
  return mine && ai ? 'bothPlayed' : mine ? 'bidAlone' : ai ? 'aiAlone' : 'defended'
}

export type KindSum = {
  deals: number
  /** The sum of the deals' differences against the AI. */
  sum: number
  /** Of these deals, the games the player won as declarer, and the games the AI won as declarer. */
  won: number
  aiWon: number
}

export type ProfileWeek = {
  /** The week's Monday. */
  week: string
  deals: number
  /** The average per deal against the AI over the week's deals the AI played; null when none. */
  perDeal: number | null
  kinds: Record<Kind, KindSum>
  /** Where the week lost the most against the AI; null when it lost nowhere. */
  worst: Kind | null
}

/** The Monday of a day's week, as a day. */
export function weekOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** The weeks played, newest first, each with its deals split by who declared and where it lost the most. */
export function weeksOf(deals: ProfileDeal[]): ProfileWeek[] {
  const weeks = new Map<string, ProfileWeek>()
  for (const d of deals) {
    const key = weekOf(d.day)
    const week = weeks.get(key) ?? {
      week: key, deals: 0, perDeal: null,
      kinds: Object.fromEntries(KINDS.map((k) => [k, { deals: 0, sum: 0, won: 0, aiWon: 0 }])) as Record<Kind, KindSum>,
      worst: null,
    }
    week.deals += 1
    if (d.ai !== null) {
      const k = week.kinds[kindOf(d as ProfileDeal & { ai: Played })]
      k.deals += 1
      k.sum += againstAi(d)!
      if (d.mine.declarer === 0 && d.mine.won) k.won += 1
      if (d.ai.declarer === 0 && d.ai.won) k.aiWon += 1
    }
    weeks.set(key, week)
  }
  for (const week of weeks.values()) {
    const judged = KINDS.reduce((n, k) => n + week.kinds[k].deals, 0)
    week.perDeal = judged ? Math.round(KINDS.reduce((n, k) => n + week.kinds[k].sum, 0) / judged) : null
    const worst = [...KINDS].sort((a, b) => week.kinds[a].sum - week.kinds[b].sum)[0]
    week.worst = week.kinds[worst].sum < 0 ? worst : null
  }
  return [...weeks.values()].sort((a, b) => b.week.localeCompare(a.week))
}
