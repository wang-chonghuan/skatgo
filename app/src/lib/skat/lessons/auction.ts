import type { Role } from '../game'
import { nextBid } from '../value'

// Lesson 7's auction (SKATGO-161): two duels as at a real table — middlehand bids to forehand, then
// rearhand bids to whoever is left — each seat going as far as its limit, the next number on the ladder
// at a time. Everyone plays it right, so the whole auction follows from the three limits; the lesson
// shows it call by call and asks the learner for their own calls, refusing any other.

/**
 * One call. `turn`: naming a number (`speak`), answering one (`answer`), or forehand taking the game alone
 * after both others passed (`alone`); `to` is the other side of the duel. `value` is the number at stake —
 * for a pass, the one the seat would not name or hold.
 */
export type Call = { role: Role; say: 'bid' | 'hold' | 'pass'; value: number; turn: 'speak' | 'answer' | 'alone'; to: Role | null }

export type Auction = {
  calls: Call[]
  /** Who plays, and at what bid; `null` when all three passed. */
  declarer: Role | null
  bid: number
}

export const SEATS: Role[] = ['forehand', 'middlehand', 'rearhand']

/** The seats after `role`, clockwise: forehand → middlehand → rearhand → forehand. */
export function after(role: Role): [Role, Role] {
  const i = SEATS.indexOf(role)
  return [SEATS[(i + 1) % 3], SEATS[(i + 2) % 3]]
}

export function auction(limits: Record<Role, number>): Auction {
  const calls: Call[] = []
  let bid = 0
  const duel = (speaker: Role, listener: Role): Role => {
    for (;;) {
      const value = nextBid(bid)
      if (value === null || value > limits[speaker]) {
        calls.push({ role: speaker, say: 'pass', value: value ?? bid, turn: 'speak', to: listener })
        return listener
      }
      calls.push({ role: speaker, say: 'bid', value, turn: 'speak', to: listener })
      bid = value
      if (value > limits[listener]) {
        calls.push({ role: listener, say: 'pass', value, turn: 'answer', to: speaker })
        return speaker
      }
      calls.push({ role: listener, say: 'hold', value, turn: 'answer', to: speaker })
    }
  }
  const survivor = duel('middlehand', 'forehand')
  const winner = duel('rearhand', survivor)
  if (bid > 0) return { calls, declarer: winner, bid }
  // Nobody named a number: forehand may still take the game at 18.
  const opening = nextBid(0) as number
  if (limits.forehand >= opening) {
    calls.push({ role: 'forehand', say: 'bid', value: opening, turn: 'alone', to: null })
    return { calls, declarer: 'forehand', bid: opening }
  }
  calls.push({ role: 'forehand', say: 'pass', value: opening, turn: 'alone', to: null })
  return { calls, declarer: null, bid: 0 }
}
