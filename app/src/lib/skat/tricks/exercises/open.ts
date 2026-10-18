import { type Card, type Contract, cardId, legalPlays, pointsOf, sameCard, trickWinnerIndex } from '../../cards'
import { type Game, type Move, type Seat, actor, applyMove, collectTrick, deal } from '../../game'
import { cards } from './cards-of'
import { type Position, openPoints } from './solve'

// The open-card endgames (SKATGO-110, the human: 「把tricks卡片的内容，彻底改成明牌残局练习……都是明牌，形式就是有人打明手时
// 的桌面的样子」): a real deal, from SkatZero's games against itself, stopped with three to five tricks to go where it is
// seat 0's turn — the learner's, as declarer or as a defender — and every hand is shown. With every card open and
// both sides playing their best, exactly one of the learner's cards wins (the declarer to 61 card points, or the
// defenders below it). The learner then plays on, card by card, until the game is decided: at each turn every card
// that still wins is right, and the others answer with their best. A wrong card does not stop the game: the learner
// plays on to the end, against the same best answers, and is told only then (SKATGO-111, the human: 「我觉得可以打完，
// 打完后告诉它错了，记下来，但是可以重试」). Everything is worked out here, in the generator
// (multiplayer/scripts/make-open-endgames.ts) and in the tests; the browser reads it as stored.

/** One card played, and by whom. */
export type Played = { seat: Seat; card: Card }

/**
 * Seat 0's turn: what the declarer ends up with after each card it may play, both sides playing their best from
 * there; the cards that keep seat 0's side winning — any of them is right, and once a wrong one is played there are
 * none; and after each card it may play, what the others play, at their best, until seat 0's next turn (or none,
 * once the game is decided).
 */
export type OpenNode = {
  values: { card: Card; points: number }[]
  win: Card[]
  after: { card: Card; plays: Played[]; next: OpenNode | null }[]
}

/** A move as stored: cards by id. */
type StoredMove =
  | { type: 'bid'; value: 'bid' | 'hold' | 'pass'; to?: number }
  | { type: 'pickup' }
  | { type: 'hand' }
  | { type: 'discard'; cards: string[] }
  | { type: 'declare'; declaration: Extract<Move, { type: 'declare' }>['declaration'] }
  | { type: 'play'; card: string }

/** One position as stored: the deal (dealer and deck, in the order `deal` hands it out) and every move up to it. */
export type OpenRecord = { id: string; dealer: Seat; deck: string[]; moves: StoredMove[] }

type StoredNode = {
  values: { card: string; points: number }[]
  win: string[]
  after: { card: string; plays: [Seat, string][]; next: StoredNode | null }[]
}
export type StoredOpen = OpenRecord & { play: StoredNode }

/** What the page uses: the table as it stands, whose side the learner is on, and the worked-out play. */
export type OpenEndgame = { id: string; game: Game; role: 'declarer' | 'defender'; have: number; play: OpenNode }

const one = (id: string): Card => cards(id)[0]

export function moveOut(m: Move): StoredMove {
  switch (m.type) {
    case 'bid':
      return m.to === undefined ? { type: 'bid', value: m.value } : { type: 'bid', value: m.value, to: m.to }
    case 'discard':
      return { type: 'discard', cards: m.cards.map(cardId) }
    case 'play':
      return { type: 'play', card: cardId(m.card) }
    case 'pickup':
    case 'hand':
    case 'declare':
      return m
    default:
      throw new Error(`${m.type}: not a move before an endgame`)
  }
}

function moveIn(m: StoredMove): Move {
  if (m.type === 'discard') return { type: 'discard', cards: m.cards.map(one) }
  if (m.type === 'play') return { type: 'play', card: one(m.card) }
  return m
}

/** The table at the position: the deal replayed through the rules, move by move, each trick gathered in. */
export function tableOf(r: OpenRecord): Game {
  let g = deal(r.dealer, r.deck.map(one))
  for (const m of r.moves) {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    const before = g
    g = applyMove(g, moveIn(m))
    if (g === before) throw new Error(`${r.id}: ${m.type} is not legal here`)
  }
  if (g.phase === 'trickEnd') g = collectTrick(g)
  if (g.phase !== 'play' || actor(g) !== 0 || !g.declaration || g.declarer === null) throw new Error(`${r.id}: not seat 0's turn in the play`)
  return g
}

/** The declarer's card points so far: the skat and its tricks. */
const haveOf = (g: Game) => pointsOf(g.skat) + g.tricks.filter((t) => t.winner === g.declarer).reduce((n, t) => n + pointsOf(t.cards.map((p) => p.card)), 0)

type At = { p: Position; have: number }

/** `at` after the seat to play plays `card`; a full trick is gathered, its points to the declarer's side if it took it. */
function step(at: At, card: Card, contract: Contract, declarer: Seat): At {
  const { p } = at
  const hands = p.hands.map((h, i) => (i === p.turn ? h.filter((c) => !sameCard(c, card)) : h)) as Position['hands']
  const trick = [...p.trick, { seat: p.turn, card }]
  if (trick.length < 3) return { p: { hands, trick, turn: ((p.turn + 1) % 3) as Seat }, have: at.have }
  const by = trick[trickWinnerIndex(trick.map((t) => t.card), contract)].seat
  return { p: { hands, trick: [], turn: by }, have: at.have + (by === declarer ? pointsOf(trick.map((t) => t.card)) : 0) }
}

/** Decided: the declarer has 61, or cannot reach it with every card still out. */
function decided(at: At): boolean {
  const left = pointsOf([...at.p.hands.flat(), ...at.p.trick.map((t) => t.card)])
  return at.have >= 61 || at.have + left < 61
}

/**
 * Proves the position and works out its play. Throws when it is not a puzzle: fewer than two cards to choose
 * from, or not exactly one that wins.
 */
export function solveOpen(r: OpenRecord): OpenEndgame {
  const g = tableOf(r)
  const contract = g.declaration!.contract
  if (contract.kind === 'null') throw new Error(`${r.id}: a Null`)
  const declarer = g.declarer!
  const role = declarer === 0 ? 'declarer' : 'defender'
  const memo = new Map<string, number>()
  /** The declarer's card points at the end, both sides playing their best from `at`. */
  const end = (at: At) => at.have + openPoints(at.p, contract, declarer, memo)
  const wins = (points: number) => (role === 'declarer' ? points >= 61 : points <= 60)
  const legal = (at: At) => legalPlays(at.p.hands[at.p.turn], at.p.trick.map((t) => t.card), contract)
  /** The best card for the seat to play: the declarer most, a defender least; among equals the cheapest. */
  const best = (at: At): Card => {
    const forDeclarer = at.p.turn === declarer
    const rated = legal(at).map((card) => ({ card, v: end(step(at, card, contract, declarer)) }))
    const top = forDeclarer ? Math.max(...rated.map((x) => x.v)) : Math.min(...rated.map((x) => x.v))
    return rated.filter((x) => x.v === top).reduce((a, b) => (pointsOf([b.card]) < pointsOf([a.card]) ? b : a)).card
  }
  const nodeAt = (at: At): OpenNode => {
    const values = legal(at).map((card) => ({ card, points: end(step(at, card, contract, declarer)) }))
    const win = values.filter((v) => wins(v.points)).map((v) => v.card)
    return {
      values,
      win,
      after: values.map(({ card }) => {
        let next = step(at, card, contract, declarer)
        const plays: Played[] = []
        while (!decided(next) && next.p.turn !== 0) {
          const c = best(next)
          plays.push({ seat: next.p.turn, card: c })
          next = step(next, c, contract, declarer)
        }
        return { card, plays, next: decided(next) ? null : nodeAt(next) }
      }),
    }
  }
  const at: At = { p: { hands: g.hands, trick: g.trick, turn: 0 }, have: haveOf(g) }
  if (decided(at)) throw new Error(`${r.id}: already decided`)
  const play = nodeAt(at)
  if (play.values.length < 2) throw new Error(`${r.id}: no choice`)
  if (play.win.length !== 1) throw new Error(`${r.id}: ${play.win.length} winning cards`)
  return { id: r.id, game: g, role, have: at.have, play }
}

const playedOut = (p: Played): [Seat, string] => [p.seat, cardId(p.card)]
const playedIn = ([seat, c]: [Seat, string]): Played => ({ seat, card: one(c) })

function nodeOut(n: OpenNode): StoredNode {
  return {
    values: n.values.map((v) => ({ card: cardId(v.card), points: v.points })),
    win: n.win.map(cardId),
    after: n.after.map((a) => ({ card: cardId(a.card), plays: a.plays.map(playedOut), next: a.next && nodeOut(a.next) })),
  }
}

function nodeIn(n: StoredNode): OpenNode {
  return {
    values: n.values.map((v) => ({ card: one(v.card), points: v.points })),
    win: n.win.map(one),
    after: n.after.map((a) => ({ card: one(a.card), plays: a.plays.map(playedIn), next: a.next && nodeIn(a.next) })),
  }
}

export const storeOpen = (r: OpenRecord, e: OpenEndgame): StoredOpen => ({ ...r, play: nodeOut(e.play) })

/** The stored puzzle as the page uses it: the table replayed by the rules, the play as worked out. */
export function readOpen(s: StoredOpen): OpenEndgame {
  const game = tableOf(s)
  return { id: s.id, game, role: game.declarer === 0 ? 'declarer' : 'defender', have: haveOf(game), play: nodeIn(s.play) }
}

/** The record part of a stored puzzle. */
export const recordOfOpen = (s: StoredOpen): OpenRecord => ({ id: s.id, dealer: s.dealer, deck: s.deck, moves: s.moves })
