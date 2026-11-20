// The League (SKATGO-204, the human: 「分场天梯先做，而且人机匹配，有人则匹配人，没人则匹配AI」): a signed-in player checks in once a
// day for coins, sits down at a table of three in their tier and pays for each deal; each deal scores League points by how
// their own side came out of it (SKATGO-205, the human: 「能否不管round，就从一个deal里，用简单直观的方法，让玩家觉得打一个deal就有
// 一个获得感」, 「庄赢+3，防赢+3，庄输-3」, 「我建议就1」), never the difference to the AI; the points move them up or down the
// six tiers. Pure: the multiplayer service scores with it, and the pages state the same numbers.

/** The tiers, lowest first (the human: 「参考多邻国的，不要用方块红心」, 「最高级的钻石改为传奇」); a new player starts in the first. */
export const TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'] as const
export type Tier = (typeof TIERS)[number]
export const LEGEND = TIERS.length - 1

/** Coins a deal costs in each tier, taken when it is dealt and kept if the player leaves during it (SKATGO-210, the human:
 *  「每个tier的扣分是：3，4，5，6，10，12」): a day's coins buy 20 deals in Bronze, 6 in Diamond, 5 in Legend. */
export const FEES: readonly number[] = [3, 4, 5, 6, 10, 12]

/** Coins a day's check-in gives: the first time a signed-in player opens SkatGo that day (the human: 「不打开游戏就不给，打开了
 *  就能积累」) — 60 since SKATGO-210 (「每天自动给的金币太多了，没意思」, 「100个太多，而且必须每周金币清零」, then 「每天30个我觉得
 *  太少」, 「60」): they add up through a week, Monday to Sunday in Berlin, and the week's first check-in starts again from 60, what
 *  was left gone. They cannot be bought or exchanged. */
export const CHECKIN_COINS = 60

/** League points of a deal for one seat (SKATGO-205): its side won — its own game, or the declarer beaten — +3; its own
 *  game lost −3; the declarer's game made against it −2, the common case, so a player only rises where they play well
 *  enough (the human: 「主要是要让厉害的玩家能爬上去，一般的玩家落到他自己的档次」) — but 0 when the defenders still took
 *  `SAVE_AT` card points, the declarer held to 80 (`saved`, SKATGO-210 at 31, the human: 「防家拿到31就不扣分」; SKATGO-214
 *  at 40, 「开工单改成40」), so a bad hand defended well is not a point lost; all passed 0. Whole numbers only (「我不太喜欢这里引入小数」).
 *  −2, not SKATGO-205's −1 (SKATGO-215, the human: 「升分和降分如何分配，才更有意思，如果40，会不会升分太多了？」, then
 *  「开工单改成防守输-2」): at −1 a table of three equal players gained about 2 points a deal between them, so everyone
 *  climbed by playing more; at −2 about half that, and an ordinary player settles in their tier. Leaving as a defender
 *  follows at −2 — leaving counts as losing (SKATGO-206), and must never cost less than playing a lost defence out. */
export const DEAL_POINTS = { won: 3, lost: -3, defended: -2, saved: 0, passed: 0, leftDeclaring: -3, left: -2 } as const
export type DealOutcome = keyof typeof DEAL_POINTS
/** A deal a person did not see to its end (SKATGO-206, the human: 「没进入结算页面就不算打完，就不进历史。离桌多久应该算输，比如
 *  1分钟？如果是庄家就-3，如果是防家就-1」): they left the table during it, or were away `AWAY_MS`, or the deal ended while they
 *  were away and they did not come back to its result within `AWAY_MS` — lost, −3 if they were the declarer when they went,
 *  else a defender's loss, −2 since SKATGO-215; it goes into no record and earns no XP. */
export type LeftOutcome = 'leftDeclaring' | 'left'
export const leftOutcome = (declarer: number | null, seat: number): LeftOutcome => (declarer === seat ? 'leftDeclaring' : 'left')
/** How long a person may be away from a League table — the connection gone — before it counts as leaving it (SKATGO-206). */
export const AWAY_MS = 60_000

/** The defenders' card points that keep a lost defence at 0 — the declarer held to 80 (SKATGO-214, the human: 「防守的到31
 *  分及其以上，好像挺容易的」, then 「开工单改成40」). At 31, the Schneider line, two lost defences in three cost nothing and
 *  defending earned points by itself; 40 is about half of them, so a lost defence is won or lost by how it was played. */
export const SAVE_AT = 40

/** How a deal came out for `seat`: who declared (null when all passed), whether the declarer won, and the defenders' card
 *  points — null where they count nothing, a Null game. */
export function dealOutcome(declarer: number | null, won: boolean, seat: number, defenders: number | null = null): DealOutcome {
  if (declarer === null) return 'passed'
  if (declarer === seat) return won ? 'won' : 'lost'
  if (!won) return 'won'
  return defenders !== null && defenders >= SAVE_AT ? 'saved' : 'defended'
}

/** League points that move a player up a tier, or down one (SKATGO-205: at about the pace of SKATGO-204's +12 / −8 in
 *  rounds, measured in the ticket's calibration). */
export const PROMOTE_AT = 30
export const RELEGATE_AT = -20
/** The lowest League points in Bronze, which has no relegation (SKATGO-207, the human: 「我看青铜最低是0吧，有人玩了，说搞那么
 *  负，没动力爬了」): a beginner never sees a minus and is never more than `PROMOTE_AT` from the climb. */
export const BRONZE_FLOOR = 0

/** How long the League waits for other people of the same tier before personas take the empty seats. */
export const MATCH_WAIT_MS = 5_000

/** A player's standing: their tier (an index of `TIERS`) and their league points in it. */
export type Standing = { tier: number; points: number }

/** What a deal's points do to a standing: added; at `PROMOTE_AT` up a tier, at `RELEGATE_AT` down one, starting again from 0
 *  there. Bronze never goes down, its points stopping at `BRONZE_FLOOR`, so a beginner is never further than that from the
 *  climb; Legend never goes up, its points running on, ranking its accounts at the head of the League's board. */
export function standingAfter(s: Standing, delta: number): Standing & { moved: -1 | 0 | 1 } {
  const points = s.points + delta
  if (points >= PROMOTE_AT && s.tier < LEGEND) return { tier: s.tier + 1, points: 0, moved: 1 }
  if (points <= RELEGATE_AT && s.tier > 0) return { tier: s.tier - 1, points: 0, moved: -1 }
  return { tier: s.tier, points: s.tier === 0 ? Math.max(points, BRONZE_FLOOR) : points, moved: 0 }
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
