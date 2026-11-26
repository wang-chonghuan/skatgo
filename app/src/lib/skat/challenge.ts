import { type Card, type Contract, type Suit, SUITS } from './cards'
import { type Game, type Seat, deal, forehandOf, middlehandOf, next } from './game'
import type { Declaration } from './value'

// Hard hands (SKATGO-248, the human: 「要做一个刻意挑战，针对特定的牌型，给出合约，去打」, 「我要新模块难牌挑战」): deals picked for a
// kind of hand that is hard to play, the game already set, the player always the declarer in seat 0. Every deal of a kind
// was picked offline (multiplayer/scripts/make-challenge-pool.ts) for its pattern — in the twelve cards with the skat
// (SKATGO-249) — and for SkatZero making it in 50–90 % of
// the ways the other twenty cards can lie. These rules are shared by the script, the service and the pages.

export const CHALLENGE_KINDS = ['one-jack-suit', 'short-trumps', 'one-jack-grand', 'null-weak-spot', 'bad-seat', 'schneider'] as const
export type ChallengeKind = (typeof CHALLENGE_KINDS)[number]

/** How many deals each kind has, easiest first (the human: each kind's own fixed deals, 「同意这个方案」). */
export const CHALLENGE_DEALS = 30

/** The bid every challenge is held at: the lowest, so the game's own value decides it. */
export const CHALLENGE_BID = 18

/** The game, as the pool keeps it: a suit, Grand or Null. */
export type ChallengeGame = Suit | 'G' | 'N'

export const contractOfGame = (g: ChallengeGame): Contract => (g === 'G' ? { kind: 'grand' } : g === 'N' ? { kind: 'null' } : { kind: 'suit', trump: g })

/** The declaration a challenge is played with: its game after picking up the skat, nothing announced. */
export const declarationOf = (g: ChallengeGame): Declaration => ({ contract: contractOfGame(g), hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false })

/** The seat the player declares from: forehand, but the bad seat's middlehand (grill Q5). */
export const seatOf = (kind: ChallengeKind): 'forehand' | 'middlehand' => (kind === 'bad-seat' ? 'middlehand' : 'forehand')

/** The dealer that puts seat 0 in that seat. */
export const dealerFor = (seat: 'forehand' | 'middlehand'): Seat => ([0, 1, 2] as Seat[]).find((d) => (seat === 'forehand' ? forehandOf(d) : middlehandOf(d)) === 0)!

/** Where seat 0's ten cards lie in a deck dealt by `dealer` (lib/skat/game.ts `deal`): forehand's first. */
export function ownSlice(dealer: Seat): [number, number] {
  const fore = forehandOf(dealer)
  const k = fore === 0 ? 0 : next(fore) === 0 ? 1 : 2
  return [k * 10, k * 10 + 10]
}

/** A challenge's deal as it starts: the auction over, seat 0 the declarer at the lowest bid, the skat still face down. */
export function challengeStart(dealer: Seat, deck: Card[]): Game {
  const g = deal(dealer, deck)
  return { ...g, phase: 'skat', declarer: 0, bid: CHALLENGE_BID, bidding: { ...g.bidding, value: CHALLENGE_BID }, turn: forehandOf(dealer) }
}

const jacks = (hand: Card[]) => hand.filter((c) => c.rank === 'J').length
const suitCards = (hand: Card[], s: Suit) => hand.filter((c) => c.suit === s && c.rank !== 'J').length

/** The suit with most cards beside the Jacks; on a tie the higher suit (clubs first). */
export function longestSuit(hand: Card[]): Suit {
  return [...SUITS].sort((a, b) => suitCards(hand, b) - suitCards(hand, a))[0]
}

/** Trumps in a suit game: the Jacks and the suit's own cards. */
export const trumpsIn = (hand: Card[], s: Suit) => jacks(hand) + suitCards(hand, s)

/** Null's order, low to high: the Ten between Nine and Jack, the Jack in its suit. */
const NULL_ORDER: Card['rank'][] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A']

/** A Null suit that cannot be made to take a trick: low to high, the k-th card at most the (2k+1)-th of the suit's
 *  eight (grill Q7) — every card has enough lower ones beneath it to stay under. A void is safe. */
export function nullSafe(hand: Card[], s: Suit): boolean {
  const held = hand.filter((c) => c.suit === s).map((c) => NULL_ORDER.indexOf(c.rank)).sort((a, b) => a - b)
  return held.every((r, k) => r <= 2 * k)
}

/** The Null suits that could be made to take a trick. */
const weakSuits = (hand: Card[]) => SUITS.filter((s) => !nullSafe(hand, s)).length

/**
 * Whether the player's cards are of `kind` once the skat is picked up (SKATGO-249, the human: 「题库按拿底牌后的牌重做」):
 * `twelve` is the ten as dealt and the skat — the game is set before the skat is seen, so what the skat brings must not
 * make the hand another kind. Trumps and Jacks are counted in the twelve; a Null keeps one weak spot whichever two are put
 * away. The bad seat has no pattern: SkatZero's rates in the two seats decide it.
 */
export function ofKind(kind: ChallengeKind, twelve: Card[]): boolean {
  switch (kind) {
    case 'one-jack-suit': {
      const t = trumpsIn(twelve, longestSuit(twelve))
      return jacks(twelve) === 1 && t >= 5 && t <= 6
    }
    case 'short-trumps':
      return trumpsIn(twelve, longestSuit(twelve)) <= 4
    case 'one-jack-grand':
      return jacks(twelve) === 1
    case 'null-weak-spot': {
      let fewest = SUITS.length
      for (let i = 0; i < twelve.length; i++) {
        for (let j = i + 1; j < twelve.length; j++) fewest = Math.min(fewest, weakSuits(twelve.filter((_, k) => k !== i && k !== j)))
      }
      return fewest === 1
    }
    case 'bad-seat':
      return true
    case 'schneider':
      return strongGrand(twelve) || trumpsIn(twelve, longestSuit(twelve)) >= 7
  }
}

/** Three or four Jacks: the Schneider kind's Grand. */
const strongGrand = (twelve: Card[]) => jacks(twelve) >= 3

/** The Schneider kind (SKATGO-249, the human: 「Schneider 挑战」): a hand anyone wins, so the aim is Schneider — 90 points or
 *  more — rather than the game alone. */
export const aimsSchneider = (kind: ChallengeKind) => kind === 'schneider'

/** Whether a declarer's finished deal reached the kind's aim: the game won, and for the Schneider kind with Schneider. */
export const madeAim = (kind: ChallengeKind, won: boolean | null, schneider: boolean) => won === true && (!aimsSchneider(kind) || schneider)

/** The game a kind is played with, from the twelve cards; the bad seat's comes from the pool (SkatZero's own choice). */
export function gameOfKind(kind: Exclude<ChallengeKind, 'bad-seat'>, twelve: Card[]): ChallengeGame {
  if (kind === 'one-jack-grand') return 'G'
  if (kind === 'null-weak-spot') return 'N'
  if (kind === 'schneider' && strongGrand(twelve)) return 'G'
  return longestSuit(twelve)
}

/** The player's twelve cards in a deck: the ten as dealt to seat 0 and the skat. */
export const twelveOf = (dealer: Seat, deck: Card[]): Card[] => [...deck.slice(...ownSlice(dealer)), deck[30], deck[31]]

/** Each kind's deals passed, by number (SKATGO-249): won, or lost where SkatZero's run of the same cards lost too. */
export type ChallengeProgress = Partial<Record<ChallengeKind, number[]>>

/** How many of a kind's deals are passed, and the deal its card opens: the first not passed, or the first when all are. */
export function kindProgress(passed: ChallengeProgress, kind: ChallengeKind, of = CHALLENGE_DEALS): { done: number; next: number } {
  const ns = new Set(passed[kind] ?? [])
  let next = 1
  while (next <= of && ns.has(next)) next++
  return { done: [...ns].filter((n) => n >= 1 && n <= of).length, next: next > of ? 1 : next }
}
