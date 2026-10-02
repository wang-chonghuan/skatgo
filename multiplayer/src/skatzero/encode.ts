// SkatZero's feature encoder (SKATGO-38), ported from skatzero/env/feature_transformations.py at
// github.com/Jimboom7/SkatZero 1fe5cab (MIT; LICENSE in ../../skatzero/). The port is literal on
// purpose — the models were trained on exactly these features, quirks included (see
// calculateMissing) — and parity with the Python original is what the acceptance checks.
//
// Everything here works in SkatZero's own space: cards as two-letter strings ('DJ', 'HT'), seats
// relative to the declarer (0 the declarer, 1 and 2 the defenders in play order), and every suit game
// played as diamonds — the caller swaps the trump suit with diamonds before and after (swapColors).

export type ZCard = string
/** Trump as SkatZero names it: 'D' for any suit game after the swap, 'J' for Grand, null for Null. */
export type ZTrump = 'D' | 'J' | null
export type ZPlay = [player: number, card: ZCard]

/** The visible state of one seat about to play a card, in SkatZero's space. */
export type ZState = {
  trump: ZTrump
  /** This seat, relative to the declarer. */
  self: number
  /** The seat's cards, in the order it holds them: the candidates keep this order. */
  hand: ZCard[]
  /** Every card played so far, in order, the current trick's included. */
  trace: ZPlay[]
  /** The skat when this seat is the declarer and picked it up; otherwise empty. */
  skat: ZCard[]
  /** Card points banked so far: [declarer, defenders]. */
  points: [number, number]
  /** A Hand game: the skat was never seen. */
  blindHand: boolean
  /** Null Ouvert: the declarer's open cards. */
  openHand: boolean
  soloplayerOpenCards: ZCard[]
}

export const SUITS = ['D', 'H', 'S', 'C'] as const
const RANKS = ['7', '8', '9', 'Q', 'K', 'T', 'A', 'J']
const RANK_INDEX: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i]))
const FIXED_JACKS: Record<string, number> = { C: 0, S: 1, H: 2, D: 3 }

export const DECK: ZCard[] = ['D', 'H', 'S', 'C'].flatMap((s) => RANKS.map((r) => s + r))

/** Swap the non-Jack cards of two suits; SkatZero plays every suit game as diamonds. */
export const swapColors = (cards: ZCard[], a: string, b: string): ZCard[] =>
  cards.map((c) => (c[1] === 'J' ? c : c[0] === a ? b + c[1] : c[0] === b ? a + c[1] : c))

/** One encoding of the four suits to matrix rows, and of the Jacks; built per call, never shared. */
type Encoding = { suit: Record<string, number>; jack: Record<string, number> }

function cardEncoding(trump: ZTrump, hand: ZCard[], others: ZCard[]): Encoding {
  const value: Record<string, number> = {}
  for (const x of SUITS) {
    if (trump === null) {
      value[x] = hand.filter((d) => d[0] === x).length * 100 - others.filter((d) => d[0] === x).length * 10 - (hand.includes(x + '7') ? 1 : 0)
    } else {
      value[x] =
        hand.filter((d) => d[0] === x && d[1] !== 'J').length * 100 - others.filter((d) => d[0] === x && d[1] !== 'J').length * 10 + (hand.includes(x + 'A') ? 1 : 0)
    }
  }
  if (trump === 'D') value.D = 10000
  // Python's sorted() is stable: equal values keep the order D, H, S, C.
  const order = [...SUITS].sort((a, b) => value[b] - value[a])
  const suit = Object.fromEntries(order.map((k, i) => [k, i]))
  return { suit, jack: trump === null ? suit : FIXED_JACKS }
}

const index = (card: ZCard, e: Encoding) => (card[1] === 'J' ? e.jack[card[0]] : e.suit[card[0]]) * 8 + RANK_INDEX[card[1]]

function cards32(cards: ZCard[] | null, e: Encoding): number[] {
  const m = new Array<number>(32).fill(0)
  for (const c of cards ?? []) m[index(c, e)] = 1
  return m
}
const card32 = (card: ZCard | null, e: Encoding) => cards32(card ? [card] : null, e)

function oneHot(n: number, max = 120): number[] {
  const v = new Array<number>(max + 1).fill(0)
  v[n <= max ? n : max] = 1
  return v
}

/** process_action_seq: finish the current trick with empty slots, then pad to 30 on the left. */
function processActionSeq(trace: ZPlay[], self: number): [number, ZCard][] {
  const seq: [number, ZCard][] = [...trace]
  if (seq.length % 3 === 1) seq.push([self, ''], [(self + 1) % 3, ''])
  if (seq.length % 3 === 2) seq.push([self, ''])
  while (seq.length < 30) seq.unshift([-1, ''])
  return seq
}

function history(trace: ZPlay[], self: number, e: Encoding): number[] {
  const out: number[] = []
  for (const [player, card] of processActionSeq(trace, self)) {
    out.push(...(player === -1 ? [0, 0, 0] : oneHot(player, 2)), ...card32(card || null, e))
  }
  return out
}

/**
 * calculate_missing_cards, literally: at the end of each trick — or at the second card of the trick
 * in progress — compare the player's last played card with the trick's lead and mark what the player
 * has shown they lack. `playerCard` deliberately carries over from earlier tricks, as in the original.
 */
function calculateMissing(playerId: number, trace: ZPlay[], trump: ZTrump, e: Encoding): number[] {
  const m = new Array<number>(32).fill(0)
  let counter = 0
  let playerCard: ZCard | undefined
  let baseCard: ZCard | undefined
  for (const [player, card] of trace) {
    counter++
    if (player === playerId) playerCard = card
    if (counter % 3 === 1) baseCard = card
    if (counter % 3 === 0 || (counter % 3 === 2 && trace.length === counter)) {
      if (playerCard === undefined || baseCard === undefined) throw new Error('skatzero_encoder_state')
      const isTrumpish = (c: ZCard) => c[1] === 'J' || c[0] === trump
      if (playerCard[0] === baseCard[0] || (isTrumpish(playerCard) && isTrumpish(baseCard) && trump !== null)) continue
      if ((baseCard[1] === 'J' && trump !== null) || baseCard[0] === trump) {
        if (trump !== 'J') for (let r = 0; r < 7; r++) m[e.suit[trump!] * 8 + r] = 1
        for (let s = 0; s < 4; s++) m[s * 8 + 7] = 1
      } else {
        for (let r = 0; r < 7; r++) m[e.suit[baseCard[0]] * 8 + r] = 1
        if (trump === null) m[e.jack[baseCard[0]] * 8 + 7] = 1
      }
    }
  }
  return m
}

/** No bidding features yet (grill Q5): every suit unbid, Jacks bid on 0 — a one-hot, not zeros. */
const NO_BID = [0, 0, 0, 0, 0]
const NO_BID_JACKS = [1, 0, 0, 0, 0]

export type Encoded = {
  obs: Float32Array
  /** 10 × 105. */
  history: Float32Array
  /** One row of 32 per candidate. */
  actions: Float32Array
  /** The candidates, in hand order: the legal cards. */
  candidates: ZCard[]
  obsWidth: number
}

/** The legal cards in hand order, as SkatZero's available_actions finds them. */
export function legalCards(hand: ZCard[], trace: ZPlay[], trump: ZTrump): ZCard[] {
  const inTrick = trace.length % 3
  if (inTrick === 0) return [...hand]
  let suit = trace[trace.length - inTrick][1][0]
  if (trace[trace.length - inTrick][1][1] === 'J' && trump !== null) suit = trump
  const follow = hand.filter((c) => (c[0] === suit && c[1] !== 'J') || (suit === trump && c[1] === 'J') || (c[0] === suit && trump === null))
  return follow.length > 0 ? follow : [...hand]
}

export function encode(s: ZState): Encoded {
  const played: ZCard[][] = [[], [], []]
  for (const [p, c] of s.trace) played[p].push(c)
  const seen = new Set([...s.trace.map(([, c]) => c), ...s.hand, ...s.skat])
  const others = DECK.filter((c) => !seen.has(c))
  const e = cardEncoding(s.trump, s.hand, others)

  const inTrick = s.trace.length % 3
  const trick = inTrick === 0 ? [] : s.trace.slice(-inTrick)
  const common = [cards32(s.hand, e), cards32(others, e), card32(trick[0]?.[1] ?? null, e), card32(trick.length === 2 ? trick[1][1] : null, e)]
  const blind = [s.blindHand ? 1 : 0]
  let obs: number[]

  if (s.self === 0) {
    const skat = !s.blindHand && s.skat.length === 2 ? cards32(s.skat, e) : cards32(null, e)
    const missingLeft = calculateMissing(1, s.trace, s.trump, e)
    const missingRight = calculateMissing(2, s.trace, s.trump, e)
    const drueck = [0]
    const pos = [0, 0, 0]
    if (s.trump === null) {
      obs = [...common.flat(), ...skat, ...missingLeft, ...cards32(played[1], e), ...missingRight, ...cards32(played[2], e),
        ...NO_BID, ...NO_BID, ...NO_BID_JACKS, ...NO_BID_JACKS, ...blind, s.openHand ? 1 : 0, ...drueck, ...pos]
    } else {
      obs = [...common.flat(), ...skat, ...missingLeft, ...cards32(played[1], e), ...missingRight, ...cards32(played[2], e),
        ...oneHot(s.points[0]), ...oneHot(s.points[1]), ...drueck, ...pos, ...NO_BID, ...NO_BID, ...NO_BID_JACKS, ...NO_BID_JACKS, ...blind]
    }
  } else {
    const teammate = 3 - s.self
    const lastOf = (p: number) => [...s.trace].reverse().find(([q]) => q === p)?.[1] ?? null
    const solo = [calculateMissing(0, s.trace, s.trump, e), cards32(played[0], e), calculateMissing(teammate, s.trace, s.trump, e), cards32(played[teammate], e),
      card32(lastOf(0), e), card32(lastOf(teammate), e)].flat()
    if (s.trump === null) {
      obs = [...common.flat(), ...solo, ...cards32(s.openHand ? s.soloplayerOpenCards : null, e), ...NO_BID, ...NO_BID_JACKS, ...blind, s.openHand ? 1 : 0]
    } else {
      obs = [...common.flat(), ...solo, ...oneHot(s.points[1]), ...oneHot(s.points[0]), ...NO_BID, ...NO_BID_JACKS, ...blind]
    }
  }

  const candidates = legalCards(s.hand, s.trace, s.trump)
  const actions = new Float32Array(candidates.length * 32)
  candidates.forEach((c, i) => (actions[i * 32 + index(c, e)] = 1))
  return { obs: Float32Array.from(obs), history: Float32Array.from(history(s.trace, s.self, e)), actions, candidates, obsWidth: obs.length }
}
