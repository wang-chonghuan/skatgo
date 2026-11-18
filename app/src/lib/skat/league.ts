// The League (SKATGO-204, the human: 「分场天梯先做，而且人机匹配，有人则匹配人，没人则匹配AI」): a signed-in player checks in once a
// day for coins, sits down at a table of three in their tier and pays for each deal; each deal scores League points by how
// their own side came out of it (SKATGO-205, the human: 「能否不管round，就从一个deal里，用简单直观的方法，让玩家觉得打一个deal就有
// 一个获得感」, 「庄赢+3，防赢+3，庄输-3」, 「我建议就1」), never the difference to the AI; the points move them up or down the
// six tiers. Pure: the multiplayer service scores with it, and the pages state the same numbers.

/** The tiers, lowest first (the human: 「参考多邻国的，不要用方块红心」, 「最高级的钻石改为传奇」); a new player starts in the first. */
export const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'] as const
export type Tier = (typeof TIERS)[number]
export const LEGEND = TIERS.length - 1

/** Coins a deal costs in each tier, taken when it is dealt and kept if the player leaves during it — about a third of
 *  SKATGO-204's round of three, so a day's coins buy as many deals as before. */
export const FEES: readonly number[] = [3, 4, 5, 7, 8, 10]

/** Coins a day's check-in gives: the first time a signed-in player opens SkatGo that day (the human: 「不打开游戏就不给，打开了
 *  就能积累」). They add up with no limit and cannot be bought or exchanged. */
export const CHECKIN_COINS = 100

/** League points of a deal for one seat (SKATGO-205): its side won — its own game, or the declarer beaten — +3; its own
 *  game lost −3; the declarer's game made against it −1, the common case, so a player only rises where they play well
 *  enough (the human: 「主要是要让厉害的玩家能爬上去，一般的玩家落到他自己的档次」); all passed 0. Whole numbers only (「我不太
 *  喜欢这里引入小数」). */
export const DEAL_POINTS = { won: 3, lost: -3, defended: -1, passed: 0, leftDeclaring: -3, left: -1 } as const
export type DealOutcome = keyof typeof DEAL_POINTS
/** A deal a person did not see to its end (SKATGO-206, the human: 「没进入结算页面就不算打完，就不进历史。离桌多久应该算输，比如
 *  1分钟？如果是庄家就-3，如果是防家就-1」): they left the table during it, or were away `AWAY_MS`, or the deal ended while they
 *  were away and they did not come back to its result within `AWAY_MS` — lost, −3 if they were the declarer when they went,
 *  else −1; it goes into no record and earns no XP. */
export type LeftOutcome = 'leftDeclaring' | 'left'
export const leftOutcome = (declarer: number | null, seat: number): LeftOutcome => (declarer === seat ? 'leftDeclaring' : 'left')
/** How long a person may be away from a League table — the connection gone — before it counts as leaving it (SKATGO-206). */
export const AWAY_MS = 60_000

/** How a deal came out for `seat`: who declared (null when all passed) and whether the declarer won. */
export function dealOutcome(declarer: number | null, won: boolean, seat: number): DealOutcome {
  if (declarer === null) return 'passed'
  if (declarer === seat) return won ? 'won' : 'lost'
  return won ? 'defended' : 'won'
}

/** League points that move a player up a tier, or down one (SKATGO-205: at about the pace of SKATGO-204's +12 / −8 in
 *  rounds, measured in the ticket's calibration). */
export const PROMOTE_AT = 30
export const RELEGATE_AT = -20

/** How long the League waits for other people of the same tier before personas take the empty seats. */
export const MATCH_WAIT_MS = 5_000

/** A player's standing: their tier (an index of `TIERS`) and their league points in it. */
export type Standing = { tier: number; points: number }

/** What a deal's points do to a standing: added; at `PROMOTE_AT` up a tier, at `RELEGATE_AT` down one, starting again from 0
 *  there. Bronze never goes down, its points stopping at `RELEGATE_AT`, so a beginner is never further than that from the
 *  climb; Legend never goes up, its points running on, ranking its accounts at the head of the League's board. */
export function standingAfter(s: Standing, delta: number): Standing & { moved: -1 | 0 | 1 } {
  const points = s.points + delta
  if (points >= PROMOTE_AT && s.tier < LEGEND) return { tier: s.tier + 1, points: 0, moved: 1 }
  if (points <= RELEGATE_AT && s.tier > 0) return { tier: s.tier - 1, points: 0, moved: -1 }
  return { tier: s.tier, points: Math.max(points, RELEGATE_AT), moved: 0 }
}

/** One player's League as the service answers it. `coins` the balance; `today` whether today's check-in counted;
 *  `table` the table they are seated at, while they sit there. */
export type LeagueMe = Standing & { coins: number; today: boolean; table: string | null }

/** How many of the League's board are shown; the asker further down gets their own row after them. */
export const BOARD_SIZE = 100

/** A row of the League's board: the place, the name, the tier and the points in it; `you` on the asker's. Names only. */
export type BoardRow = { rank: number; nickname: string; tier: number; points: number; you?: true }
/** The League's board (SKATGO-206, the human: 「只要打了一局的就要上榜」, 「按照档次和档次的分数排名」): every account that has
 *  played a League deal, by tier, then points in it, equal tier and points sharing a place; the first `BOARD_SIZE`, and as
 *  `me` the asker's own row when it is further down. */
export type LeagueBoard = { rows: BoardRow[]; me?: BoardRow }

/** The last finished deal as the table shows it, by room seat: for a person how it came out, the points it brought, where
 *  it left them, and whether they can pay the next deal; nothing for a persona's seat. */
export type LeagueResult = {
  deal: number
  seats: ({ outcome: DealOutcome; points: number; standing: Standing; moved: -1 | 0 | 1; canPay: boolean } | null)[]
}
