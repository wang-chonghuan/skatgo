import type { Card } from '../../app/src/lib/skat/cards'
import type { Contract } from '../../app/src/lib/skat/cards'
import { card, raw } from '../src/computers'
import { BIDS, PICKUP_MODES, type PickupMode, bidValueTable } from '../src/skatzero/bidding'
import { type ZState, discardPairs, swapColors } from '../src/skatzero/encode'
import type { Policy, PlayerView } from '../src/skatzero/policy'

// SkatZero's judgement of the Skat-Tricks exercises (SKATGO-103): the same procedures the computers use —
// a card as `Policy.ranked` weighs it, the discard and the game as `declareAfterPickup` weighs them — but
// with every option's value, so an exercise can show its answer beats the second choice.

export type Valued<T> = { option: T; value: number }

/** Every legal card's value, best first. */
export async function cardValues(policy: Policy, view: PlayerView): Promise<Valued<Card>[]> {
  return (await policy.ranked(view)).map((r) => ({ option: r.card, value: r.value })).sort((a, b) => b.value - a.value)
}

function prepared(mode: PickupMode, hand12: string[]): { gametype: 'D' | 'G' | 'N'; state: Omit<ZState, 'discard'> } {
  const base = { self: 0, trace: [], skat: [], points: [0, 0] as [number, number], blindHand: false, soloplayerOpenCards: [] }
  if (mode === 'N' || mode === 'NO') return { gametype: 'N', state: { ...base, trump: null, hand: hand12, openHand: mode === 'NO' } }
  if (mode === 'G') return { gametype: 'G', state: { ...base, trump: 'J', hand: hand12, openHand: false } }
  return { gametype: 'D', state: { ...base, trump: 'D', hand: swapColors(hand12, 'D', mode), openHand: false } }
}

/** Every pair of the twelve put away for `mode`, best first, as the declarer at `position` (0 forehand). */
export async function discardValues(policy: Policy, hand12: Card[], mode: PickupMode, position: number): Promise<Valued<[Card, Card]>[]> {
  const p = prepared(mode, hand12.map(raw))
  const { values } = await policy.score(p.gametype, { ...p.state, discard: { pos: (3 - position) % 3 } })
  return discardPairs(p.state.hand)
    .map((pair, i) => {
      const back = 'CSH'.includes(mode) ? swapColors(pair, mode, 'D') : pair
      return { option: back.map(card) as [Card, Card], value: values[i] }
    })
    .sort((a, b) => b.value - a.value)
}

/** Each game's value after picking up, at the winning bid, best first — the comparison `declareAfterPickup` makes. */
export async function gameValues(policy: Policy, hand12: Card[], position: number, bid: number): Promise<Valued<PickupMode>[]> {
  const i = BIDS.findIndex((b) => b >= bid)
  const out: Valued<PickupMode>[] = []
  for (const mode of PICKUP_MODES) {
    const best = (await discardValues(policy, hand12, mode, position))[0].value
    out.push({ option: mode, value: bidValueTable(policy.tables, hand12.map(raw), mode, best, null)[i] })
  }
  return out.sort((a, b) => b.value - a.value)
}

export const contractOf = (mode: PickupMode): Contract =>
  mode === 'G' ? { kind: 'grand' } : mode === 'N' || mode === 'NO' ? { kind: 'null' } : { kind: 'suit', trump: mode }
