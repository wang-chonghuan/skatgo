import { type Card, type Contract, cardId, legalPlays, pointsOf, sameCard, trickWinnerIndex } from '../../cards'

// The exact answers of the Skat-Tricks exercises (SKATGO-103) that are not SkatZero's judgement: play with
// every card open, and what the declarer can still be sure of when the defenders' cards are not known.
// Seats are 0, 1, 2 in play order; `declarer` names one of them. Small positions only: an endgame of a
// few cards, a Null's last tricks — the search is complete, so the answer is proven, not estimated.

export type Seat = 0 | 1 | 2
export type Played = { seat: Seat; card: Card }
/** A position: each seat's cards, the trick on the table (in play order) and whose turn it is. */
export type Position = { hands: [Card[], Card[], Card[]]; trick: Played[]; turn: Seat }

const nextSeat = (s: Seat): Seat => ((s + 1) % 3) as Seat
const without = (cards: Card[], c: Card) => cards.filter((d) => !sameCard(d, c))
const key = (p: Position) => `${p.hands.map((h) => h.map(cardId).sort().join('')).join('|')}/${p.trick.map((t) => t.seat + cardId(t.card)).join('')}/${p.turn}`

/** `p` after the seat to play plays `card`; a full trick is gathered: who took it, and its card points. */
function gather(p: Position, card: Card, contract: Contract): { next: Position; by: Seat | null; points: number } {
  const hands = p.hands.map((h, i) => (i === p.turn ? without(h, card) : h)) as Position['hands']
  const trick = [...p.trick, { seat: p.turn, card }]
  if (trick.length < 3) return { next: { hands, trick, turn: nextSeat(p.turn) }, by: null, points: 0 }
  const by = trick[trickWinnerIndex(trick.map((t) => t.card), contract)].seat
  return { next: { hands, trick: [], turn: by }, by, points: pointsOf(trick.map((t) => t.card)) }
}

/** The card points the declarer takes from here on, every card open and every seat playing its best. */
export function openPoints(p: Position, contract: Contract, declarer: Seat, memo = new Map<string, number>()): number {
  if (p.hands.every((h) => h.length === 0)) return 0
  const k = key(p)
  const hit = memo.get(k)
  if (hit !== undefined) return hit
  const maximise = p.turn === declarer
  let best = maximise ? -Infinity : Infinity
  for (const card of legalPlays(p.hands[p.turn], p.trick.map((t) => t.card), contract)) {
    const g = gather(p, card, contract)
    const v = (g.by === declarer ? g.points : 0) + openPoints(g.next, contract, declarer, memo)
    best = maximise ? Math.max(best, v) : Math.min(best, v)
  }
  memo.set(k, best)
  return best
}

/** Each legal card of the seat to play, with the declarer's card points from here when it is played (open cards). */
export function openValues(p: Position, contract: Contract, declarer: Seat): { card: Card; points: number }[] {
  const memo = new Map<string, number>()
  return legalPlays(p.hands[p.turn], p.trick.map((t) => t.card), contract).map((card) => {
    const g = gather(p, card, contract)
    return { card, points: (g.by === declarer ? g.points : 0) + openPoints(g.next, contract, declarer, memo) }
  })
}

/** Null, every card open: can the defenders make the declarer take a trick from here? */
export function nullBreaks(p: Position, declarer: Seat, memo = new Map<string, boolean>()): boolean {
  if (p.hands[declarer].length === 0 && p.trick.length === 0) return false
  const k = key(p)
  const hit = memo.get(k)
  if (hit !== undefined) return hit
  const contract: Contract = { kind: 'null' }
  const results = legalPlays(p.hands[p.turn], p.trick.map((t) => t.card), contract).map((card) => () => {
    const g = gather(p, card, contract)
    return g.by === declarer || nullBreaks(g.next, declarer, memo)
  })
  // The declarer escapes if any card escapes; the defenders break it if any card breaks it.
  const out = p.turn === declarer ? results.every((r) => r()) : results.some((r) => r())
  memo.set(k, out)
  return out
}

/** Every way to split `cards` into two hands of the given sizes. */
export function splits(cards: Card[], first: number): [Card[], Card[]][] {
  const out: [Card[], Card[]][] = []
  const pick = (from: number, chosen: Card[]) => {
    if (chosen.length === first) {
      out.push([chosen, cards.filter((c) => !chosen.some((d) => sameCard(c, d)))])
      return
    }
    for (let i = from; i < cards.length; i++) pick(i + 1, [...chosen, cards[i]])
  }
  pick(0, [])
  return out
}

/**
 * Can the declarer be sure of `need` more card points without seeing the defenders' cards? `worlds` are
 * the defenders' possible hands (the declarer's own are in every world alike). The declarer must choose
 * each card from what it can see; the defenders are allowed to see everything — so a yes is proven.
 */
export function sureOf(worlds: Position[], contract: Contract, declarer: Seat, need: number): boolean {
  if (need <= 0) return true
  const p0 = worlds[0]
  if (p0.hands[declarer].length === 0 && p0.trick.length === 0) return false
  if (p0.turn === declarer) {
    return legalPlays(p0.hands[declarer], p0.trick.map((t) => t.card), contract).some((card) => {
      const gs = worlds.map((w) => gather(w, card, contract))
      return sureOf(gs.map((g) => g.next), contract, declarer, need - (gs[0].by === declarer ? gs[0].points : 0))
    })
  }
  // A defender to play: every card it could hold and play, in the worlds where it could.
  const byCard = new Map<string, Position[]>()
  for (const w of worlds) {
    for (const card of legalPlays(w.hands[w.turn], w.trick.map((t) => t.card), contract)) {
      const list = byCard.get(cardId(card)) ?? []
      list.push(w)
      byCard.set(cardId(card), list)
    }
  }
  for (const [id, ws] of byCard) {
    const card = ws[0].hands[ws[0].turn].find((c) => cardId(c) === id)!
    const gs = ws.map((w) => gather(w, card, contract))
    if (!sureOf(gs.map((g) => g.next), contract, declarer, need - (gs[0].by === declarer ? gs[0].points : 0))) return false
  }
  return true
}

/**
 * Null: can the declarer be sure to take no trick without seeing the defenders' cards? As `sureOf`: the
 * declarer chooses from what it sees, the defenders see everything — so a yes is proven.
 */
export function nullSure(worlds: Position[], declarer: Seat): boolean {
  const contract: Contract = { kind: 'null' }
  const p0 = worlds[0]
  if (p0.hands[declarer].length === 0 && p0.trick.length === 0) return true
  if (p0.turn === declarer) {
    return legalPlays(p0.hands[declarer], p0.trick.map((t) => t.card), contract).some((card) => {
      const gs = worlds.map((w) => gather(w, card, contract))
      return gs[0].by !== declarer && nullSure(gs.map((g) => g.next), declarer)
    })
  }
  const byCard = new Map<string, Position[]>()
  for (const w of worlds) {
    for (const card of legalPlays(w.hands[w.turn], w.trick.map((t) => t.card), contract)) {
      const list = byCard.get(cardId(card)) ?? []
      list.push(w)
      byCard.set(cardId(card), list)
    }
  }
  for (const [id, ws] of byCard) {
    const card = ws[0].hands[ws[0].turn].find((c) => cardId(c) === id)!
    const gs = ws.map((w) => gather(w, card, contract))
    // Within one group the trick so far is the same, so who takes it is too.
    if (gs[0].by === declarer || !nullSure(gs.map((g) => g.next), declarer)) return false
  }
  return true
}
