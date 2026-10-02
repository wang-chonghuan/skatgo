import type { Card, Contract } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, pickUpSkat, roleOf, actor, type Game, type Move, type Seat } from '../../app/src/lib/skat/game'
import { type Declaration, nextBid } from '../../app/src/lib/skat/value'
import { PLAYER } from '../../app/src/lib/skat/tournament'
import { applySeatMove } from './model'
import { type HandMode, type PickupMode, declareAfterPickup } from './skatzero/bidding'
import type { Policy } from './skatzero/policy'

// The computers of a server-owned game (the daily tournament, SKATGO-35/38/39; free play, SKATGO-40):
// recorded moves and their replay, SkatZero's turn in the auction and at the skat, and the loop that
// lets the computers move until it is the player's turn. A game's moves — the player's and the
// computers' — are kept, and replaying them never asks a computer again.

/** One recorded move of a deal: who made it, and what. */
export type Logged = { seat: Seat; move: Move }

/** A computer could not decide: the move is not made, and nothing plays in its place (SKATGO-38 Q6). */
export class ComputerFailed extends Error {}
/** How long one computer decision may take. */
const DECISION_MS = 2000

export function decide<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const late = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ComputerFailed('decision_timeout')), DECISION_MS) })
  return Promise.race([work, late]).finally(() => clearTimeout(timer)).catch((e) => {
    throw e instanceof ComputerFailed ? e : new ComputerFailed(e instanceof Error ? e.message : 'decision_failed')
  })
}

/** A deal as it stands after its recorded moves; finished tricks are collected by rule. No computer is
 *  asked. */
export function replayLog(dealer: Seat, deck: Card[], log: Logged[]): Game {
  let g = deal(dealer, deck)
  for (const { seat, move } of log) {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    g = applySeatMove(g, seat, move)
  }
  return g.phase === 'trickEnd' ? collectTrick(g) : g
}

export const raw = (c: Card) => c.suit + (c.rank === '10' ? 'T' : c.rank)
export const card = (z: string): Card => ({ suit: z[0] as Card['suit'], rank: (z[1] === 'T' ? '10' : z[1]) as Card['rank'] })
export const POSITION = { forehand: 0, middlehand: 1, rearhand: 2 } as const

/** A SkatZero game type as the engine's declaration. Hand games never announce more (SKATGO-39 Q6). */
export function declaration(mode: PickupMode | HandMode): Declaration {
  const hand = mode.endsWith('H') && mode !== 'H'
  const base = hand ? mode.slice(0, -1) : mode
  const contract: Contract = base === 'G' ? { kind: 'grand' } : base === 'N' || base === 'NO' ? { kind: 'null' } : { kind: 'suit', trump: base as 'C' | 'S' | 'H' | 'D' }
  return { contract, hand, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: base === 'NO' }
}

/** What a computer seat decided about the auction when its deal was prepared (SKATGO-39). */
export type SeatPlan = {
  /** SkatZero's highest bid; 17 or 0 is a pass everywhere (SKATGO-39 Q2). */
  maxBid: number
  /** Pick up, or which Hand game, at a winning bid. */
  skatOrHand: (bid: number) => { pickup: true } | { pickup: false; mode: HandMode }
}

/** SkatZero's turn in the auction and at the skat, from the seat's prepared plan; the discard and the
 *  game after a pick-up are worked out now. */
export async function skatzeroTurn(g: Game, seat: Seat, plan: SeatPlan, policy: Policy): Promise<Logged[]> {
  const top = plan.maxBid >= 18 ? plan.maxBid : 0
  if (g.phase === 'bidding') {
    const b = g.bidding
    const say = b.awaiting === 'forehandAlone' ? (top >= 18 ? 'bid' : 'pass')
      : b.awaiting === 'speaker' ? ((nextBid(b.value) ?? Infinity) <= top ? 'bid' : 'pass')
      : b.value <= top ? 'hold' : 'pass'
    return [{ seat, move: { type: 'bid', value: say } }]
  }
  if (g.phase === 'skat' && !g.pickedUp) {
    const choice = plan.skatOrHand(g.bid)
    if (!choice.pickup) return [{ seat, move: { type: 'hand' } }, { seat, move: { type: 'declare', declaration: declaration(choice.mode) } }]
    const picked = pickUpSkat(g)
    const position = POSITION[roleOf(seat, g.dealer)]
    const d = await decide(declareAfterPickup(policy, picked.hands[seat].map(raw), position, g.bid))
    return [{ seat, move: { type: 'pickup' } }, { seat, move: { type: 'discard', cards: d.discard.map(card) } }, { seat, move: { type: 'declare', declaration: declaration(d.mode) } }]
  }
  throw new ComputerFailed('computer_unexpected_phase')
}

/** Let the computers move until it is the player's turn or the deal is over, recording each move in
 *  `log`; `steps` collects every state left behind, for the table to show in order. Every proposed
 *  move is checked by the engine; an illegal one fails the request. */
export async function advance(g: Game, log: Logged[], turn: (g: Game) => Promise<Logged[]>, steps?: Game[]): Promise<Game> {
  for (;;) {
    if (g.phase === 'trickEnd') {
      g = collectTrick(g)
      steps?.push(g)
      continue
    }
    const seat = actor(g)
    if (seat === null || seat === PLAYER) return g
    for (const l of await turn(g)) {
      try {
        g = applySeatMove(g, l.seat, l.move)
      } catch {
        throw new ComputerFailed('computer_illegal_move')
      }
      log.push(l)
      steps?.push(g)
    }
  }
}
