// The tournament's Elo (SKATGO-123): one number per player from the daily tournament, made the way chess makes
// it, so a player can follow it and check it by hand (the human: 「既专业，又简单，别人容易理解，还能从给我的系统里
// 产生出来」). Everyone plays the same six deals, so a day compares play, not cards: each ended day is one game
// against everyone else who played it and against the KI, won by the higher Seeger-Fabian total. Pure: the
// multiplayer service replays every ended day with it, and the page states the same numbers.

/** Where a new player starts. */
export const ELO_START = 1500

/** The KI's fixed number, the scale's anchor: players' day totals beat its total about a quarter of the time
 *  (26% over the first 42 entries), about 180 points below it from 1500. */
export const ELO_KI = 1700

/** A player's number is provisional until this many days are counted (FIDE asks five games for a first rating). */
export const ELO_PROVISIONAL_DAYS = 5

/** How far one day moves a number, as FIDE's K: 40 for a player's first 30 days, 20 after. */
export const eloK = (daysBefore: number) => (daysBefore < 30 ? 40 : 20)

/** FIDE's expected score against one opponent. */
export const eloExpected = (own: number, other: number) => 1 / (1 + 10 ** ((other - own) / 400))

/** One ended tournament day: each player's Seeger-Fabian total, and the KI's, null when the day has none. */
export type EloDay = { ki: number | null; totals: { player: string; total: number }[] }

export type EloStanding = { elo: number; days: number }

/** The Elo board as the service answers it: the top players by their rounded number, equal numbers sharing a
 *  rank; `total` players in all; the KI's fixed number to stand among them. Names only, never a player id. */
export type EloBoard = { rows: { rank: number; nickname: string; elo: number; provisional: boolean }[]; total: number; ki: number }

/**
 * Every player's Elo after the given days, in order. A player's day is one game against the field — everyone
 * else that day, and the KI: a higher total wins (1), the same draws (½), a lower loses (0). The day's score is
 * the average over the opponents; so is its expectation, from the ratings everyone had before the day. The
 * number moves by K × (score − expectation). A player alone on a day without the KI has no game.
 */
export function eloRatings(days: EloDay[]): Map<string, EloStanding> {
  const standing = new Map<string, EloStanding>()
  for (const day of days) {
    const before = new Map(day.totals.map((t) => [t.player, standing.get(t.player) ?? { elo: ELO_START, days: 0 }]))
    for (const own of day.totals) {
      const field = day.totals.filter((t) => t.player !== own.player).map((t) => ({ elo: before.get(t.player)!.elo, total: t.total }))
      if (day.ki !== null) field.push({ elo: ELO_KI, total: day.ki })
      if (field.length === 0) continue
      const me = before.get(own.player)!
      const score = field.reduce((s, o) => s + (own.total > o.total ? 1 : own.total === o.total ? 0.5 : 0), 0) / field.length
      const expected = field.reduce((s, o) => s + eloExpected(me.elo, o.elo), 0) / field.length
      standing.set(own.player, { elo: me.elo + eloK(me.days) * (score - expected), days: me.days + 1 })
    }
  }
  return standing
}
