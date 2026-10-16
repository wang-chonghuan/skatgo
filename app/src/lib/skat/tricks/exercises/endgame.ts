import { type Card, type Contract, cardId, effectiveSuit, legalPlays, pointsOf, sameCard, trickWinnerIndex } from '../../cards'
import { cards } from './cards-of'
import { type Position, type Seat, openPoints, splits, sureOf } from './solve'

// "Sieg sichern" (SKATGO-108): Skat's mate-in-N. The declarer leads with a few cards left and sees what a
// player at the table sees — its own cards, the skat it put away, every card played. Exactly one card makes
// 61 sure however the defenders' cards lie, among the splits the play has left possible (a defender who did
// not follow a suit has none of it). Every other card loses in at least one of those splits, even played
// with every card open. Positions come from SkatZero's games against itself (multiplayer/scripts/
// make-endgames.ts); this module proves them and works out what the analysis shows.

/** Seats as the learner sees them: you (the declarer) lead, left plays next, then right. */
export type Side = 'you' | 'left' | 'right'
const SEAT: Record<Side, Seat> = { you: 0, left: 1, right: 2 }
const SIDE: Side[] = ['you', 'left', 'right']
export type Game = 'C' | 'S' | 'H' | 'D' | 'G'
export const contractOf = (g: Game): Contract => (g === 'G' ? { kind: 'grand' } : { kind: 'suit', trump: g })

/** One position as stored (`endgames.json`): cards by id, the play so far, the defenders' real hands. */
export type EndgameRecord = {
  id: string
  game: Game
  /** The declarer's seat at the table. */
  position: 'forehand' | 'middlehand' | 'rearhand'
  level: 1 | 2 | 3
  skat: string[]
  hand: string[]
  tricks: { cards: [Side, string][]; winner: Side }[]
  left: string[]
  right: string[]
}

export type Trick = { cards: { side: Side; card: Card }[]; winner: Side; points: number }

/** Everything the exercise shows and the tests prove, worked out from a record. */
export type Endgame = {
  id: string
  contract: Contract
  position: EndgameRecord['position']
  level: EndgameRecord['level']
  skat: Card[]
  hand: Card[]
  tricks: Trick[]
  left: Card[]
  right: Card[]
  /** Card points the declarer holds: the skat and its tricks. */
  have: number
  need: number
  /** The suits ('T' for trumps) each defender showed it has none of, with the trick that showed it. */
  voids: { side: 'left' | 'right'; suit: Card['suit'] | 'T'; trick: number }[]
  /** Cards that must sit with one defender in every possible split. */
  placed: { left: Card[]; right: Card[] }
  answer: Card
  /** The sure way through the real deal: the declarer's sure card each time, the defenders' best replies. */
  line: Trick[]
  /** For each other card: a possible split in which it loses even with every card open. */
  traps: { card: Card; left: Card[]; right: Card[] }[]
}

const ids = (cs: string[]) => cs.map((c) => cards(c)[0])

function base(r: EndgameRecord) {
  const contract = contractOf(r.game)
  const tricks: Trick[] = r.tricks.map((t) => {
    const cs = t.cards.map(([side, c]) => ({ side, card: cards(c)[0] }))
    return { cards: cs, winner: t.winner, points: pointsOf(cs.map((x) => x.card)) }
  })
  const skat = ids(r.skat)
  const have = pointsOf(skat) + tricks.filter((t) => t.winner === 'you').reduce((n, t) => n + t.points, 0)
  const voids: Endgame['voids'] = []
  tricks.forEach((t, i) => {
    const led = effectiveSuit(t.cards[0].card, contract)
    for (const p of t.cards.slice(1)) {
      if (p.side !== 'you' && effectiveSuit(p.card, contract) !== led && !voids.some((v) => v.side === p.side && v.suit === led)) {
        voids.push({ side: p.side, suit: led, trick: i + 1 })
      }
    }
  })
  return { contract, tricks, skat, have, need: 61 - have, voids, hand: ids(r.hand), left: ids(r.left), right: ids(r.right) }
}

/** The defenders' hands the declarer must allow for: every split of their cards that fits the voids shown. */
export function worldsOf(r: EndgameRecord): Position[] {
  const b = base(r)
  const out = [...b.left, ...b.right]
  const fits = (h: Card[], side: 'left' | 'right') => h.every((c) => !b.voids.some((v) => v.side === side && v.suit === effectiveSuit(c, b.contract)))
  return splits(out, b.left.length)
    .filter(([l, rr]) => fits(l, 'left') && fits(rr, 'right'))
    .map(([l, rr]) => ({ hands: [b.hand, l, rr], trick: [], turn: 0 }))
}

const without = (h: Card[], c: Card) => h.filter((d) => !sameCard(c, d))

/** `p` after the seat to play plays `card`; a full trick is gathered. */
function play(p: Position, card: Card, contract: Contract): { next: Position; trick: Trick | null } {
  const hands = p.hands.map((h, i) => (i === p.turn ? without(h, card) : h)) as Position['hands']
  const trick = [...p.trick, { seat: p.turn, card }]
  if (trick.length < 3) return { next: { hands, trick, turn: ((p.turn + 1) % 3) as Seat }, trick: null }
  const by = trick[trickWinnerIndex(trick.map((t) => t.card), contract)].seat
  return {
    next: { hands, trick: [], turn: by },
    trick: { cards: trick.map((t) => ({ side: SIDE[t.seat], card: t.card })), winner: SIDE[by], points: pointsOf(trick.map((t) => t.card)) },
  }
}

/** Is `card`, led now, sure to bring `need` in every one of `worlds`? */
const sureLead = (worlds: Position[], card: Card, contract: Contract, need: number) =>
  sureOf(worlds.map((w) => play(w, card, contract).next), contract, 0, need)

/** Proves the record and works out its analysis. Throws when it is not a puzzle. */
export function solveEndgame(r: EndgameRecord): Endgame {
  const b = base(r)
  if (b.need <= 0) throw new Error(`${r.id}: already won`)
  const worlds = worldsOf(r)
  if (!worlds.some((w) => w.hands[1].every((c) => b.left.some((d) => sameCard(c, d))))) throw new Error(`${r.id}: the real deal is not a possible split`)
  const legal = legalPlays(b.hand, [], b.contract)
  const sure = legal.filter((c) => sureLead(worlds, c, b.contract, b.need))
  if (sure.length !== 1) throw new Error(`${r.id}: ${sure.length} sure cards`)
  if (legal.length < 3) throw new Error(`${r.id}: too few choices`)
  const answer = sure[0]
  const traps = legal
    .filter((c) => !sameCard(c, answer))
    .map((card) => {
      const w = worlds.find((x) => openPoints(play(x, card, b.contract).next, b.contract, 0) < b.need)
      if (!w) throw new Error(`${r.id}: ${cardId(card)} loses in no split with open cards`)
      return { card, left: w.hands[1], right: w.hands[2] }
    })
  const placed = {
    left: [...b.left, ...b.right].filter((c) => worlds.every((w) => w.hands[1].some((d) => sameCard(c, d)))),
    right: [...b.left, ...b.right].filter((c) => worlds.every((w) => w.hands[2].some((d) => sameCard(c, d)))),
  }
  return { id: r.id, contract: b.contract, position: r.position, level: r.level, skat: b.skat, hand: b.hand, tricks: b.tricks, left: b.left, right: b.right, have: b.have, need: b.need, voids: b.voids, placed, answer, line: lineOf(worlds, b.hand, b.left, b.right, b.contract, b.need), traps }
}

/**
 * The sure way, played out in the real deal: at each lead or follow of the declarer the first card that is
 * still sure across the splits not yet ruled out; the defenders reply with the card that leaves the declarer
 * least, every card open.
 */
function lineOf(start: Position[], hand: Card[], left: Card[], right: Card[], contract: Contract, need: number): Trick[] {
  let worlds = start
  let real: Position = { hands: [hand, left, right], trick: [], turn: 0 }
  let still = need
  const out: Trick[] = []
  while (real.hands.some((h) => h.length)) {
    let card: Card
    if (real.turn === 0) {
      const legal = legalPlays(real.hands[0], real.trick.map((t) => t.card), contract)
      card = legal.find((c) => sureOf(worlds.map((w) => play(w, c, contract).next), contract, 0, still)) ?? legal[0]
    } else {
      const legal = legalPlays(real.hands[real.turn], real.trick.map((t) => t.card), contract)
      card = legal.reduce((best, c) => (openPoints(play(real, c, contract).next, contract, 0) < openPoints(play(real, best, contract).next, contract, 0) ? c : best))
      const seat = real.turn
      worlds = worlds.filter((w) => w.hands[seat].some((d) => sameCard(d, card)))
    }
    worlds = worlds.map((w) => play(w, card, contract).next)
    const step = play(real, card, contract)
    real = step.next
    if (step.trick) {
      out.push(step.trick)
      if (step.trick.winner === 'you') still -= step.trick.points
    }
  }
  return out
}

export const sideSeat = SEAT

/** A record with its worked-out analysis, as `endgames.json` keeps it: the browser reads it as it is, and the
 *  tests work it out again from the record and compare. */
export type StoredEndgame = EndgameRecord & {
  have: number
  need: number
  voids: Endgame['voids']
  placed: { left: string[]; right: string[] }
  answer: string
  line: { cards: [Side, string][]; winner: Side; points: number }[]
  traps: { card: string; left: string[]; right: string[] }[]
}

const trickOut = (t: Trick) => ({ cards: t.cards.map((x) => [x.side, cardId(x.card)] as [Side, string]), winner: t.winner, points: t.points })
const trickIn = (t: StoredEndgame['line'][number]): Trick => ({ cards: t.cards.map(([side, c]) => ({ side, card: cards(c)[0] })), winner: t.winner, points: t.points })

export function storeEndgame(r: EndgameRecord, e: Endgame): StoredEndgame {
  return {
    ...r,
    have: e.have,
    need: e.need,
    voids: e.voids,
    placed: { left: e.placed.left.map(cardId), right: e.placed.right.map(cardId) },
    answer: cardId(e.answer),
    line: e.line.map(trickOut),
    traps: e.traps.map((x) => ({ card: cardId(x.card), left: x.left.map(cardId), right: x.right.map(cardId) })),
  }
}

/** The stored analysis as the page uses it — nothing is worked out in the browser. */
export function readEndgame(s: StoredEndgame): Endgame {
  return {
    id: s.id,
    contract: contractOf(s.game),
    position: s.position,
    level: s.level,
    skat: ids(s.skat),
    hand: ids(s.hand),
    tricks: s.tricks.map((t) => trickIn({ cards: t.cards, winner: t.winner, points: pointsOf(t.cards.map(([, c]) => cards(c)[0])) })),
    left: ids(s.left),
    right: ids(s.right),
    have: s.have,
    need: s.need,
    voids: s.voids,
    placed: { left: ids(s.placed.left), right: ids(s.placed.right) },
    answer: cards(s.answer)[0],
    line: s.line.map(trickIn),
    traps: s.traps.map((x) => ({ card: cards(x.card)[0], left: ids(x.left), right: ids(x.right) })),
  }
}

/** The record part of a stored endgame. */
export const recordOf = (s: StoredEndgame): EndgameRecord => ({ id: s.id, game: s.game, position: s.position, level: s.level, skat: s.skat, hand: s.hand, tricks: s.tricks, left: s.left, right: s.right })
