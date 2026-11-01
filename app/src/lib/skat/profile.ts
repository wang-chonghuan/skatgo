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

/** One side's record over a set of games (SKATGO-169): how many it played a game in, all passed left out, and won — as
 *  declarer the game, as defender the declarer's loss — and its average Seeger-Fabian score over all of them. */
export type SideRecord = { played: number; won: number; declared: number; declaredWon: number; defended: number; defendedWon: number; perDeal: number }

export function recordOf(games: Played[]): SideRecord {
  const r: SideRecord = { played: 0, won: 0, declared: 0, declaredWon: 0, defended: 0, defendedWon: 0, perDeal: 0 }
  for (const g of games) {
    r.perDeal += g.scores[0]
    if (g.declarer === null) continue
    r.played += 1
    if (g.declarer === 0) {
      r.declared += 1
      if (g.won) r.declaredWon += 1
    } else {
      r.defended += 1
      if (!g.won) r.defendedWon += 1
    }
  }
  r.won = r.declaredWon + r.defendedWon
  r.perDeal = games.length ? r.perDeal / games.length : 0
  return r
}

/** The player and the AI side by side (SKATGO-169, the human: 「profile里应该显示你这个表格，然后对手就是AI」), over the deals the AI
 *  played too, so both columns count the same cards. Null when it played none. */
export function versusAi(deals: ProfileDeal[]): { you: SideRecord; ai: SideRecord } | null {
  const judged = deals.flatMap((d) => (d.ai === null ? [] : [{ mine: d.mine, ai: d.ai }]))
  return judged.length ? { you: recordOf(judged.map((d) => d.mine)), ai: recordOf(judged.map((d) => d.ai)) } : null
}

/** How many of the latest deals the home page's figures and curve count (SKATGO-169). */
export const RECENT_DEALS = 30

/** What the last `RECENT_DEALS` of `judged` come to, fewer while there are fewer. */
const recent = (judged: ProfileDeal[]) => {
  const last = judged.slice(-RECENT_DEALS)
  return { last, perDeal: Math.round(last.reduce((sum, d) => sum + (againstAi(d) ?? 0), 0) / last.length) }
}

/**
 * Where the player stands now, for the home page (SKATGO-169, the human: 「home页面上，显示胜率的曲线？或者更好的数值？」): over the
 * latest deals the AI played too, the win rate and the average per deal against the AI. Null before the first. Null win
 * rate when all of them were passed in.
 */
export function standingOf(deals: ProfileDeal[]): { deals: number; winRate: number | null; perDeal: number } | null {
  const judged = deals.filter((d) => d.ai !== null)
  if (!judged.length) return null
  const { last, perDeal } = recent(judged)
  const r = recordOf(last.map((d) => d.mine))
  return { deals: last.length, winRate: r.played ? Math.round((100 * r.won) / r.played) : null, perDeal }
}

/**
 * The home page's curve: for each day played, the average per deal against the AI over the latest deals up to that day —
 * the deals so far on the first days. On real records a day's win rate jumps between 0 and 100 on a handful of deals, and
 * a day's average is mostly chance too; over thirty deals the line shows the player's own direction.
 */
export function rollingOf(deals: ProfileDeal[]): { day: string; perDeal: number }[] {
  const judged = deals.filter((d) => d.ai !== null)
  const days = [...new Set(judged.map((d) => d.day))].sort((a, b) => a.localeCompare(b))
  return days.map((day) => ({ day, perDeal: recent(judged.filter((d) => d.day <= day)).perDeal }))
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

/** A week's analysis, written by hand for the player in one language (SKATGO-128): the forum's marks — paragraphs,
 *  lists, **bold**. `week` is the week's Monday. */
export type ProfileNote = { week: string; lang: string; body: string }

export type ProfileWeek = {
  /** The week's Monday. */
  week: string
  deals: number
  /** The average per deal against the AI over the week's deals the AI played; null when none. */
  perDeal: number | null
}

/** The Monday of a day's week, as a day. */
export function weekOf(day: string): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

/** The weeks played, newest first: how many deals, and the average per deal against the AI. */
export function weeksOf(deals: ProfileDeal[]): ProfileWeek[] {
  const weeks = new Map<string, { deals: number; sum: number; judged: number }>()
  for (const d of deals) {
    const week = weeks.get(weekOf(d.day)) ?? { deals: 0, sum: 0, judged: 0 }
    const diff = againstAi(d)
    week.deals += 1
    if (diff !== null) {
      week.sum += diff
      week.judged += 1
    }
    weeks.set(weekOf(d.day), week)
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([week, w]) => ({ week, deals: w.deals, perDeal: w.judged ? Math.round(w.sum / w.judged) : null }))
}
