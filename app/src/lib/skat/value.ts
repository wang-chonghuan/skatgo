// What a game is worth, and who won it. ISkO §5: value = base × multiplier for suit and Grand
// games, a fixed number for Null. The bidding ladder is nothing but the sorted set of those values.

import { type Card, type Contract, type Suit, pointsOf, sameCard, trumpSequence } from './cards'

export const SUIT_BASE: Record<Suit, number> = { D: 9, H: 10, S: 11, C: 12 }
export const GRAND_BASE = 24
export const NULL_VALUES = { plain: 23, hand: 35, ouvert: 46, handOuvert: 59 } as const

/** What the declarer announces on top of the contract. Announcements are only legal in Hand games. */
export type Declaration = {
  contract: Contract
  hand: boolean
  schneiderAnnounced: boolean
  schwarzAnnounced: boolean
  ouvert: boolean
}

export function baseValue(contract: Contract): number {
  if (contract.kind === 'grand') return GRAND_BASE
  if (contract.kind === 'suit') return SUIT_BASE[contract.trump]
  return 0
}

/**
 * Matadors (Spitzen): the unbroken run from ♣J downwards that the declarer's side holds ("with")
 * or lacks ("without"). Counted over hand PLUS skat — also in a Hand game, where the declarer only
 * learns the true number afterwards. That is how a Hand game gets overbid by a Jack in the skat.
 */
export function matadors(declarerCards: Card[], contract: Contract): { with: boolean; count: number } {
  const seq = trumpSequence(contract)
  if (seq.length === 0) return { with: true, count: 0 }
  const has = (c: Card) => declarerCards.some((d) => sameCard(c, d))
  const withTop = has(seq[0])
  let count = 0
  for (const c of seq) {
    if (has(c) !== withTop) break
    count++
  }
  return { with: withTop, count }
}

export type MultiplierPart = { label: string; n: number }

/** Every valid game value from 18 up, ascending — the only numbers anyone may bid. */
export const BID_LADDER: number[] = (() => {
  const values = new Set<number>(Object.values(NULL_VALUES))
  for (const base of Object.values(SUIT_BASE)) for (let m = 2; m <= 18; m++) values.add(base * m)
  for (let m = 2; m <= 11; m++) values.add(GRAND_BASE * m)
  return [...values].filter((v) => v >= 18).sort((a, b) => a - b)
})()

export function nextBid(current: number): number | null {
  return BID_LADDER.find((v) => v > current) ?? null
}

export type Outcome = {
  declarerPoints: number
  defenderPoints: number
  declarerTricks: number
  defenderTricks: number
}

export type Settlement = {
  won: boolean
  /** The value the game is scored at (after any overbid correction). Always positive. */
  value: number
  /** What goes on the declarer's score line: +value, or −2×value. */
  score: number
  base: number
  parts: MultiplierPart[]
  multiplier: number
  matadors: { with: boolean; count: number }
  overbid: boolean
  /** One-line reason a game was lost despite, or won because of, the card points. */
  reason: string
}

/**
 * Settle a finished game. `declarerCards` is the declarer's original ten plus the two skat cards,
 * whichever way they ended up — that is the set matadors are counted over.
 */
export function settle(
  decl: Declaration,
  bid: number,
  declarerCards: Card[],
  outcome: Outcome,
): Settlement {
  const { contract } = decl

  if (contract.kind === 'null') {
    const value = decl.hand
      ? decl.ouvert ? NULL_VALUES.handOuvert : NULL_VALUES.hand
      : decl.ouvert ? NULL_VALUES.ouvert : NULL_VALUES.plain
    const won = outcome.declarerTricks === 0
    return {
      won,
      value,
      score: won ? value : -2 * value,
      base: value,
      parts: [],
      multiplier: 1,
      matadors: { with: true, count: 0 },
      overbid: false,
      reason: won ? '庄家一墩都没拿' : '庄家拿到了墩，Null 失败',
    }
  }

  const base = baseValue(contract)
  const m = matadors(declarerCards, contract)
  const parts: MultiplierPart[] = [
    { label: `${m.with ? '有' : '无'} ${m.count}`, n: m.count },
    { label: '成局', n: 1 },
  ]
  if (decl.hand) parts.push({ label: 'Hand', n: 1 })

  // Schneider and Schwarz count for whoever suffered them: a declarer held to 30 or fewer pays for
  // a Schneider against themselves, which is why a bad loss is so much dearer than a narrow one.
  const schneider = outcome.declarerPoints >= 90 || outcome.declarerPoints <= 30
  const schwarz = outcome.defenderTricks === 0 || outcome.declarerTricks === 0
  if (schneider || decl.schneiderAnnounced) parts.push({ label: 'Schneider', n: 1 })
  if (decl.schneiderAnnounced) parts.push({ label: '宣告 Schneider', n: 1 })
  if (schwarz || decl.schwarzAnnounced) parts.push({ label: 'Schwarz', n: 1 })
  if (decl.schwarzAnnounced) parts.push({ label: '宣告 Schwarz', n: 1 })
  if (decl.ouvert) parts.push({ label: 'Ouvert', n: 1 })

  const multiplier = parts.reduce((n, p) => n + p.n, 0)
  let value = base * multiplier

  let won = outcome.declarerPoints >= 61
  let reason = won ? `庄家拿到 ${outcome.declarerPoints} 点，够 61` : `庄家只有 ${outcome.declarerPoints} 点，不到 61`
  if (won && decl.schneiderAnnounced && outcome.declarerPoints < 90) {
    won = false
    reason = '宣告了 Schneider 却没到 90 点'
  }
  if (won && (decl.schwarzAnnounced || decl.ouvert) && outcome.defenderTricks > 0) {
    won = false
    reason = '宣告了 Schwarz 却让防守方拿到了墩'
  }

  // Overbid (überreizt): the game turned out worth less than was bid. It is lost whatever the card
  // points say, and scored at the lowest multiple of the base that would have covered the bid.
  let overbid = false
  if (value < bid) {
    overbid = true
    won = false
    value = Math.ceil(bid / base) * base
    reason = `超叫：这一局只值 ${base * multiplier}，却叫到了 ${bid}`
  }

  return { won, value, score: won ? value : -2 * value, base, parts, multiplier, matadors: m, overbid, reason }
}

/** The value a declaration is worth before play, assuming a plain win — what the declarer can bid up to. */
export function expectedValue(decl: Declaration, declarerCards: Card[]): number {
  if (decl.contract.kind === 'null') {
    return decl.hand
      ? decl.ouvert ? NULL_VALUES.handOuvert : NULL_VALUES.hand
      : decl.ouvert ? NULL_VALUES.ouvert : NULL_VALUES.plain
  }
  const m = matadors(declarerCards, decl.contract)
  let mult = m.count + 1
  if (decl.hand) mult++
  if (decl.schneiderAnnounced) mult += 2
  if (decl.schwarzAnnounced) mult += 2
  if (decl.ouvert) mult++
  return baseValue(decl.contract) * mult
}

export const trickPoints = pointsOf
