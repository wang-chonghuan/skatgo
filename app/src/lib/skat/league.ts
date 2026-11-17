// The League (SKATGO-204, the human: 「分场天梯先做，而且人机匹配，有人则匹配人，没人则匹配AI」, 「就按sf分，玩家就会希望下次来一手
// 好牌」): a signed-in player checks in once a day for coins, pays a tier's entry fee for a round of three deals at a table
// of three, and moves up or down the six tiers by their place at the table — the three deals' Seeger-Fabian totals, never
// the difference to the AI. Pure: the multiplayer service scores a round with it, and the pages state the same numbers.

/** The tiers, lowest first (the human: 「参考多邻国的，不要用方块红心」, 「最高级的钻石改为传奇」); a new player starts in the first. */
export const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'] as const
export type Tier = (typeof TIERS)[number]
export const LEGEND = TIERS.length - 1

/** Coins a round costs in each tier, taken when it starts and kept if the player leaves. */
export const FEES: readonly number[] = [10, 12, 15, 20, 25, 30]

/** Coins a day's check-in gives: the first time a signed-in player opens SkatGo that day (the human: 「不打开游戏就不给，打开了
 *  就能积累」). They add up with no limit and cannot be bought or exchanged. */
export const CHECKIN_COINS = 100

/** A round: three deals, so each player deals once. */
export const ROUND_DEALS = 3

/** League points for first, second and third place at the table. */
export const PLACE_POINTS: readonly [number, number, number] = [3, 1, -2]

/** League points that move a player up a tier, or down one. */
export const PROMOTE_AT = 12
export const RELEGATE_AT = -8

/** How long the League waits for other people of the same tier before personas take the empty seats. */
export const MATCH_WAIT_MS = 5_000

/** Each seat's place from the round's Seeger-Fabian totals, 0 the first: equal totals share the better place. */
export function placesOf(totals: readonly number[]): number[] {
  return totals.map((t) => totals.filter((o) => o > t).length)
}

/** A player's standing: their tier (an index of `TIERS`) and their league points in it. */
export type Standing = { tier: number; points: number }

/** What a place does to a standing: its points added; at `PROMOTE_AT` up a tier, at `RELEGATE_AT` down one, starting again
 *  from 0 there. Bronze never goes down, its points stopping at `RELEGATE_AT`, so a beginner is never further than that
 *  from the climb; Legend never goes up, its points running on — its board ranks them. */
export function standingAfter(s: Standing, place: number): Standing & { moved: -1 | 0 | 1 } {
  const points = s.points + PLACE_POINTS[place]
  if (points >= PROMOTE_AT && s.tier < LEGEND) return { tier: s.tier + 1, points: 0, moved: 1 }
  if (points <= RELEGATE_AT && s.tier > 0) return { tier: s.tier - 1, points: 0, moved: -1 }
  return { tier: s.tier, points: Math.max(points, RELEGATE_AT), moved: 0 }
}

/** One player's League as the service answers it. `coins` the balance; `today` whether today's check-in counted;
 *  `table` the round they are seated at, while it runs. */
export type LeagueMe = Standing & { coins: number; today: boolean; table: string | null }

/** The Legend board: the accounts in Legend by their points there, the most first; `you` on the asker's row. Names only. */
export type LegendBoard = { rows: { rank: number; nickname: string; points: number; you?: true }[] }

/** A finished round as the table shows it: by room seat, each seat's name, total, place, and for a person the points it
 *  brought and where it left them. */
export type LeagueResult = {
  tier: number
  seats: { name: string; total: number; place: number; person: boolean; points?: number; standing?: Standing; moved?: -1 | 0 | 1 }[]
}
