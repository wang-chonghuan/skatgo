import { type ZCard, type ZPlay, type ZState, type ZTrump, DECK, discardPairs, legalCards, swapColors } from './encode'
import type { Policy } from './policy'
import { type BiddingTables, type GameKind, REWARDS, interp } from './tables'

// SkatZero's bidding (SKATGO-39), ported from bidding/bidder.py, bidding/bidder_simulated_data.py,
// skatzero/game/utils.py (calculate_max_bids) and api.py (bid, get_max_bid, declare) at
// github.com/Jimboom7/SkatZero 1fe5cab (MIT). Literal on purpose, quirks included — the hand tables
// of a suit game count matadors on colour-swapped cards (get_bid_value_table on an unswapped hand), and
// a "performance hotfix" skips game types that look hopeless after enough skats — because parity with
// the original is what is checked. Where numpy keeps float32 (the net's values and their sums), the
// arithmetic is float32 here too (Math.fround); the tables are float64 as in numpy.
//
// The opponents' bids are not features (grill Q3): every bid feature is zero, as in card play.

const f32 = Math.fround

/** SimulatedDataBidder.get_bid_list: every bid SkatZero knows, ascending (up to 168). */
export const BIDS: number[] = (() => {
  const b = new Set<number>([23, 35, 46, 59])
  for (let base = 9; base <= 12; base++) for (let m = 2; m <= 12; m++) b.add(base * m)
  for (let m = 2; m <= 7; m++) b.add(24 * m)
  return [...b].sort((x, y) => x - y)
})()

export const PICKUP_MODES = ['C', 'S', 'H', 'D', 'G', 'N', 'NO'] as const
export const HAND_MODES = ['CH', 'SH', 'HH', 'DH', 'GH', 'NH', 'NOH'] as const
export type PickupMode = (typeof PICKUP_MODES)[number]
export type HandMode = (typeof HAND_MODES)[number]
type Penalties = Record<string, number>
/** api.bid's penalties for its BID answer; the skat/Hand choice and the declaration use none. */
export const BID_PENALTIES: Penalties = { D: 15, G: 40, N: 0, NO: 0, DH: 30, GH: 60, NH: 0, NOH: 0 }
const NO_PENALTIES: Penalties = { D: 0, G: 0, N: 0, NO: 0, DH: 0, GH: 0, NH: 0, NOH: 0 }

const BASE: Record<string, number> = { G: 24, C: 12, S: 11, H: 10, D: 9 }

/** calculate_max_bids: the highest bid the hand reaches normally, with Schneider, with Schwarz. */
export function maxBids(cards: ZCard[], gamemode: string): { normal: number; schneider: number; schwarz: number } {
  const t = gamemode[0]
  const has = (c: string) => cards.includes(c)
  // "With" counts the run from the top while present, "without" while absent; Grand stops after the
  // Jacks either way (upstream's `gametype != 'G' and …` ends both chains there).
  const chain: (() => boolean | null)[] = [() => has('SJ'), () => has('HJ'), () => has('DJ'), () => (t === 'G' ? null : has(t + 'A')),
    () => has(t + 'T'), () => has(t + 'K'), () => has(t + 'Q'), () => has(t + '9'), () => has(t + '8'), () => has(t + '7')]
  let mult = 2
  const want = has('CJ')
  for (const step of chain) {
    if (step() === want) mult++
    else break
  }
  if (gamemode.length > 1) mult++
  return { normal: mult * BASE[t], schneider: (mult + 1) * BASE[t], schwarz: (mult + 2) * BASE[t] }
}

/** SimulatedDataBidder.get_bid_value_table: the expected reward of playing `gameMode` at each bid. */
export function bidValueTable(tables: BiddingTables, hand: ZCard[], gameMode: string, normalValue: number, penalties: Penalties | null): number[] {
  const out = new Array<number>(BIDS.length).fill(0)
  let mode = gameMode
  if ('CSHDG'.includes(mode[0])) {
    const cards = mode[0] !== 'G' ? swapColors(hand, mode[0], 'D') : hand
    const mb = maxBids(cards, mode)
    if (mode[0] !== 'G') mode = 'D' + mode.slice(1)
    const t = tables[mode as GameKind]
    const r = REWARDS[mode as GameKind]
    const expected = (rewards: number[]) => {
      let v = 0
      for (let o = 0; o < 6; o++) v += interp(normalValue, t.values, t.dists[o]) * rewards[o]
      return v
    }
    const schneider = expected([r[0], r[1], r[2], -130, r[4], r[5]])
    const schwarz = expected([r[0], r[1], r[2], -130, -130, r[5]])
    BIDS.forEach((b, i) => {
      out[i] = b <= mb.normal ? normalValue : b <= mb.schneider ? schneider : b <= mb.schwarz ? schwarz : r[0]
    })
  } else {
    const limit: Record<string, [number, number]> = { N: [23, -136], NO: [46, -182], NH: [35, -160], NOH: [59, -208] }
    const [max, lost] = limit[mode]
    BIDS.forEach((b, i) => (out[i] = b <= max ? normalValue : lost))
  }
  if (penalties) {
    BIDS.forEach((b, i) => {
      if (b > 18) out[i] -= penalties[mode]
      if (mode === 'G' && b > 24) out[i] -= penalties[mode] / 2
    })
  }
  return out
}

/** api.get_max_bid: the highest bid whose value clears the threshold; 17 when only just short of 18. */
export function maxBid(table: number[], threshold = -5): number {
  let best = 0
  if (table[0] > -5 + threshold) best = 17
  BIDS.forEach((b, i) => {
    if (table[i] > threshold + 10 || (table[i] > threshold && b < 27)) best = b
  })
  return best
}

type BState = { hand: ZCard[]; others: ZCard[]; pos: number; position: number }

/** Bidder.prepare_state: the trump, and suit games played as diamonds. */
function prepare(mode: string, hand: ZCard[], others: ZCard[]): { gametype: 'D' | 'G' | 'N'; trump: ZTrump; hand: ZCard[]; others: ZCard[]; openHand: boolean } {
  if (mode === 'N' || mode === 'NO') return { gametype: 'N', trump: null, hand, others, openHand: mode === 'NO' }
  if (mode === 'G') return { gametype: 'G', trump: 'J', hand, others, openHand: false }
  return { gametype: 'D', trump: 'D', hand: swapColors(hand, 'D', mode), others: swapColors(others, 'D', mode), openHand: false }
}

const state = (p: ReturnType<typeof prepare>, extra: Partial<ZState>): ZState => ({
  trump: p.trump, self: 0, hand: p.hand, trace: [], skat: [], points: [0, 0], blindHand: true, openHand: p.openHand, soloplayerOpenCards: [], ...extra,
})

const maxF32 = (v: Float32Array) => v.reduce((a, b) => (b > a ? b : a), -Infinity)

/** The work queue's yield: one slice of computation at a time, so the service stays responsive. */
const yieldNow = () => new Promise<void>((r) => setImmediate(r))

/** Bidder.simulate_player_discards / get_blind_hand_values: the Hand value of each game type. */
async function handValues(policy: Policy, b: BState): Promise<number[]> {
  const out: number[] = []
  for (const mode of PICKUP_MODES) {
    const p = prepare(mode, b.hand, b.others)
    if (b.position === 0) {
      out.push(maxF32((await policy.score(p.gametype, state(p, {}))).values))
      continue
    }
    const values: number[] = []
    for (const card of p.others) {
      const trace: ZPlay[] = [[2, card]]
      values.push(maxF32((await policy.score(p.gametype, state(p, { trace }))).values))
    }
    await yieldNow()
    values.sort((x, y) => x - y)
    const pick = b.position === 1 ? values.slice(0, 5) : values.slice(-10)
    let sum = 0
    for (const v of pick) sum = f32(sum + v)
    out.push(f32(sum / pick.length))
  }
  return out
}

/** Bidder.find_best_game_and_discard on twelve cards: per game type the best discard and its value,
 *  and the per-bid table (max over game types) under each set of penalties given. */
async function bestGameAndDiscard(policy: Policy, tables: BiddingTables, hand12: ZCard[], others: ZCard[], pos: number,
  estimates: Record<PickupMode, number[]>, penaltySets: Penalties[]): Promise<{ discards: Partial<Record<PickupMode, [ZCard, ZCard]>>; tables: number[][] }> {
  const discards: Partial<Record<PickupMode, [ZCard, ZCard]>> = {}
  const best = penaltySets.map(() => new Array<number>(BIDS.length).fill(-170))
  for (const mode of PICKUP_MODES) {
    const p = prepare(mode, hand12, others)
    const est = estimates[mode]
    if (est.length > 0) {
      let sum = 0
      for (const v of est) sum = f32(sum + v)
      const mean = f32(sum / est.length)
      if ((est.length > 5 && mean < -90) || (est.length > 20 && mean < -60)) {
        const [a, c] = [p.hand[0], p.hand[1]]
        if ('CSHD'.includes(mode) && mode.length === 1 && a[0] !== 'D' && c[0] !== 'D') continue
        if ((mode === 'N' || mode === 'NO') && !'789'.includes(a[1]) && !'789'.includes(c[1])) continue
        if (mode === 'G' && !'AJ'.includes(a[1]) && !'AJ'.includes(c[1])) continue
      }
    }
    const { values } = await policy.score(p.gametype, state(p, { blindHand: false, discard: { pos } }))
    let arg = 0
    for (let i = 1; i < values.length; i++) if (values[i] > values[arg]) arg = i
    const bestVal = values[arg]
    const pair = discardPairs(p.hand)[arg]
    discards[mode] = ('CSH'.includes(mode) ? swapColors(pair, mode, 'D') : pair) as [ZCard, ZCard]
    penaltySets.forEach((pen, k) => {
      const t = bidValueTable(tables, p.hand, mode, bestVal, pen)
      for (let i = 0; i < t.length; i++) if (t[i] > best[k][i]) best[k][i] = t[i]
    })
    est.push(bestVal)
  }
  return { discards, tables: best }
}

/** What a computer seat knows from its ten cards and position, worked out once per deal. */
export type SeatBidding = {
  /** SkatZero's highest bid: a value of BIDS, or 17/0 — both "pass" (grill Q2). */
  maxBid: number
  /** Penalty-free value of picking up the skat, per BIDS entry. */
  pickup: number[]
  /** Penalty-free value of each Hand game (HAND_MODES), per BIDS entry. */
  hand: number[][]
}

/** The 231 possible skats among the 22 unknown cards, as index pairs in itertools order. */
export const SKAT_PAIRS: [number, number][] = (() => {
  const out: [number, number][] = []
  for (let i = 0; i < 22; i++) for (let j = i + 1; j < 22; j++) out.push([i, j])
  return out
})()

/**
 * api.bid for one seat, both answers at once: BID (with its penalties) and the inputs of
 * SKAT_OR_HAND_DECL (without). One simulation serves both — the net's values do not depend on the
 * penalties. `order` is the order the 231 skats are tried in (upstream shuffles; here it is given).
 */
export async function seatBidding(policy: Policy, hand: ZCard[], position: number, order: [number, number][]): Promise<SeatBidding & { detail: { handValues: number[]; pickupPen: number[]; handMax: number[] } }> {
  const tables = policy.tables
  const others = DECK.filter((c) => !hand.includes(c))
  const pos = (3 - position) % 3
  const b: BState = { hand, others, pos, position }
  const hv = await handValues(policy, b)
  const estimates = Object.fromEntries(PICKUP_MODES.map((m) => [m, [] as number[]])) as Record<PickupMode, number[]>
  const sums = [new Array<number>(BIDS.length).fill(0), new Array<number>(BIDS.length).fill(0)]
  for (const [i, j] of order) {
    const skat = [others[i], others[j]]
    const rest = others.filter((_, k) => k !== i && k !== j)
    const r = await bestGameAndDiscard(policy, tables, [...skat, ...hand], rest, pos, estimates, [BID_PENALTIES, NO_PENALTIES])
    r.tables.forEach((t, k) => t.forEach((v, x) => (sums[k][x] += v)))
    await yieldNow()
  }
  const pickupPen = sums[0].map((v) => v / order.length)
  const pickup = sums[1].map((v) => v / order.length)
  // get_blind_hand_bidding_table: each Hand game's table averaged over every possible skat.
  const handTables = (penalties: Penalties | null) =>
    HAND_MODES.map((mode, m) => {
      const sum = new Array<number>(BIDS.length).fill(0)
      for (const [i, j] of order) bidValueTable(tables, [others[i], others[j], ...hand], mode, hv[m], penalties).forEach((v, x) => (sum[x] += v))
      return sum.map((v) => v / order.length)
    })
  const handPen = handTables(BID_PENALTIES)
  const handMax = BIDS.map((_, x) => Math.max(...handPen.map((t) => t[x])))
  return { maxBid: Math.max(maxBid(handMax), maxBid(pickupPen)), pickup, hand: handTables(null), detail: { handValues: hv, pickupPen, handMax } }
}

/** Index of a winning bid in BIDS; an off-list bid takes the next higher list bid (grill Q4). */
export function bidIndex(bid: number): number {
  const i = BIDS.findIndex((b) => b >= bid)
  if (i < 0) throw new Error('skatzero_bid_beyond_list')
  return i
}

/** SKAT_OR_HAND_DECL at the winning bid: pick up, or the Hand game worth most. */
export function skatOrHand(s: SeatBidding, bid: number): { pickup: true } | { pickup: false; mode: HandMode } {
  const i = bidIndex(bid)
  const hands = s.hand.map((t) => t[i])
  const top = Math.max(...hands)
  if (s.pickup[i] > top) return { pickup: true }
  return { pickup: false, mode: HAND_MODES[hands.indexOf(top)] }
}

/** DISCARD_AND_DECL: the game and the two cards to put away, for twelve cards at the winning bid. */
export async function declareAfterPickup(policy: Policy, hand12: ZCard[], position: number, bid: number): Promise<{ mode: PickupMode; discard: [ZCard, ZCard] }> {
  const others = DECK.filter((c) => !hand12.includes(c))
  const estimates = Object.fromEntries(PICKUP_MODES.map((m) => [m, [] as number[]])) as Record<PickupMode, number[]>
  const { discards } = await bestGameAndDiscard(policy, policy.tables, hand12, others, (3 - position) % 3, estimates, [])
  const i = bidIndex(bid)
  let best: PickupMode = 'C'
  let top = -Infinity
  for (const mode of PICKUP_MODES) {
    const v = bidValueTable(policy.tables, hand12, mode, estimates[mode][0], null)[i]
    if (v > top) [best, top] = [mode, v]
  }
  return { mode: best, discard: discards[best]! }
}
