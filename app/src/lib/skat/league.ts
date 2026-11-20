// The League (SKATGO-204, the human: 「分场天梯先做，而且人机匹配，有人则匹配人，没人则匹配AI」): a signed-in player checks in once a
// day for coins, sits down at a table of three in their tier and pays for each deal; each deal scores League points
// (SKATGO-205, the human: 「能否不管round，就从一个deal里，用简单直观的方法，让玩家觉得打一个deal就有一个获得感」) — their
// Seeger-Fabian score against the table's since SKATGO-216 — never the difference to the AI; the points move them up or down
// the six tiers. Pure: the multiplayer service scores with it, and the pages state the same numbers.

import { SEEGER_FABIAN } from './tournament'

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

/** League points of a deal for one seat (SKATGO-216, the human: 「我们搞这么复杂，你思考一下，用sf是不是更好？…巧用一下它们的
 *  算分系统」, then 「开工单改成SF减两家平均」): the seat's Seeger-Fabian score minus the average of the other two seats' — the
 *  declarer who wins a game worth 36 +86, each defender −43; lost, the declarer −162 and each defender +81; all passed 0.
 *  A table's points add up to 0 (a half rounds to the nearest whole number, whole numbers only: 「我不太喜欢这里引入小数」), so
 *  equal players neither rise nor fall and a player climbs only by playing better than the table (「主要是要让厉害的玩家能爬
 *  上去，一般的玩家落到他自己的档次」). It replaces SKATGO-205's +3 / −3 / −1, SKATGO-210's and 214's line of card points and
 *  SKATGO-215's −2, which let everyone climb by playing more. The average, not 「我-A+我-B」 (the record of play's against
 *  the table, twice this): the declarer's points are then their score on the result, and the scale does not grow with the
 *  table. */
export function dealPoints(scores: readonly [number, number, number], seat: number): number {
  const others = scores.reduce((sum, x, i) => (i === seat ? sum : sum + x), 0)
  return Math.round(scores[seat] - others / 2)
}

/** How a deal came out for `seat`, said beside its points: its own game won or lost, the declarer beaten or not, all passed. */
export type DealOutcome = 'won' | 'lost' | 'defended' | 'passed' | LeftOutcome

/** A deal a person did not see to its end (SKATGO-206, the human: 「没进入结算页面就不算打完，就不进历史。离桌多久应该算输，比如
 *  1分钟？如果是庄家就-3，如果是防家就-1」): they left the table during it, or were away `AWAY_MS`, or the deal ended while they
 *  were away and they did not come back to its result within `AWAY_MS` — lost: `forfeitPoints`; it goes into no record and
 *  earns no XP. */
export type LeftOutcome = 'leftDeclaring' | 'left'
export const leftOutcome = (declarer: number | null, seat: number): LeftOutcome => (declarer === seat ? 'leftDeclaring' : 'left')
/** How long a person may be away from a League table — the connection gone — before it counts as leaving it (SKATGO-206). */
export const AWAY_MS = 60_000

/** A deal left before its end, lost for the one who left (SKATGO-216): their side loses the game played out — their own game
 *  lost at its value when their seat declared, the declarer's game made when another did — scored as `dealPoints`; nothing
 *  when all passed. Never better than playing it out to a loss. */
export function forfeitPoints(declarer: number | null, value: number, seat: number): number {
  if (declarer === null) return 0
  const scores: [number, number, number] = [0, 0, 0]
  if (declarer === seat) {
    scores[declarer] = -2 * value - SEEGER_FABIAN.lost
    for (const s of [0, 1, 2]) if (s !== declarer) scores[s] = SEEGER_FABIAN.defender
  } else scores[declarer] = value + SEEGER_FABIAN.won
  return dealPoints(scores, seat)
}

/** How a deal came out for `seat`: who declared (null when all passed) and whether the declarer won. */
export function dealOutcome(declarer: number | null, won: boolean, seat: number): DealOutcome {
  if (declarer === null) return 'passed'
  if (declarer === seat) return won ? 'won' : 'lost'
  return won ? 'defended' : 'won'
}

/** League points a player has on coming into a tier — a new account in Bronze, and anyone moved up or down — and the two
 *  lines from there (SKATGO-217, the human: 「每个档次，初始给1000分。达到2000了晋级，达到0了降级。这样好理解吧？」): 2000 moves
 *  them up a tier, 0 down one. Even, as the points of a table add up to 0 — a player as good as the tier's table goes up
 *  or down as often; one clearly better (about 10 a deal) goes up nine times in ten, in about 70 deals, measured on 2870
 *  free-play deals' Seeger-Fabian swings. The page states the two lines, never the distance to them (「你不用给分差，只用
 *  说明这个0和2000就行了」), and the points are never below 0. Before, from 0 to +1000 and −1000 (SKATGO-216), +30 and
 *  −20 (SKATGO-205). */
export const START_AT = 1000
export const PROMOTE_AT = 2000
/** The relegation line, and Bronze's floor: Bronze has no relegation and its points stop here (SKATGO-207, the human:
 *  「我看青铜最低是0吧，有人玩了，说搞那么负，没动力爬了」). */
export const RELEGATE_AT = 0

/** How long the League waits for other people of the same tier before personas take the empty seats. */
export const MATCH_WAIT_MS = 5_000

/** A player's standing: their tier (an index of `TIERS`) and their league points in it. */
export type Standing = { tier: number; points: number }

/** What a deal's points do to a standing: added; at `PROMOTE_AT` up a tier, at `RELEGATE_AT` down one, starting again from
 *  `START_AT` there. Bronze never goes down, its points stopping at `RELEGATE_AT`; Legend never goes up, its points running
 *  on past `PROMOTE_AT`, ranking its accounts at the head of the League's board. */
export function standingAfter(s: Standing, delta: number): Standing & { moved: -1 | 0 | 1 } {
  const points = s.points + delta
  if (points >= PROMOTE_AT && s.tier < LEGEND) return { tier: s.tier + 1, points: START_AT, moved: 1 }
  if (points <= RELEGATE_AT && s.tier > 0) return { tier: s.tier - 1, points: START_AT, moved: -1 }
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
