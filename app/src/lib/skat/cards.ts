// The Skat deck and everything that follows from a card and a contract alone: what is trump, what
// beats what, what may legally be played, who takes a trick. Pure functions, no React, no storage —
// the lessons' drills and the full game both judge answers with these, so a rule is stated once.
//
// Rules follow the International Skat Order (ISkO). Terminology in comments is the German/English
// one the rulebook uses. The engine speaks no language: every name the learner reads — suits, cards,
// contracts — is phrased in lib/skat/i18n.ts, in the learner's language.

export type Suit = 'C' | 'S' | 'H' | 'D'
export type Rank = '7' | '8' | '9' | 'Q' | 'K' | '10' | 'A' | 'J'
export type Card = { suit: Suit; rank: Rank }

/** Suits in Skat order, highest first: clubs, spades, hearts, diamonds. */
export const SUITS: Suit[] = ['C', 'S', 'H', 'D']
export const RANKS: Rank[] = ['7', '8', '9', 'Q', 'K', '10', 'A', 'J']

export const SUIT_SYMBOL: Record<Suit, string> = { C: '♣', S: '♠', H: '♥', D: '♦' }

/** Card points (Augen). 120 in the deck; the declarer needs 61. */
export const POINTS: Record<Rank, number> = { A: 11, '10': 10, K: 4, Q: 3, J: 2, '9': 0, '8': 0, '7': 0 }

export type Contract =
  | { kind: 'suit'; trump: Suit }
  | { kind: 'grand' }
  | { kind: 'null' }

export const cardId = (c: Card) => `${c.suit}${c.rank}`
export const sameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank
export const pointsOf = (cards: Card[]) => cards.reduce((n, c) => n + POINTS[c.rank], 0)

export function fullDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })))
}

/** In suit and Grand games the four Jacks are trumps and belong to no suit. In Null nothing is. */
export function isTrump(card: Card, contract: Contract): boolean {
  if (contract.kind === 'null') return false
  if (card.rank === 'J') return true
  return contract.kind === 'suit' && card.suit === contract.trump
}

/**
 * The suit a card counts as when following: 'T' for any trump, otherwise its printed suit. This is
 * the whole reason ♣J cannot be played to a club lead in a hearts game — it is not a club there.
 */
export function effectiveSuit(card: Card, contract: Contract): Suit | 'T' {
  return isTrump(card, contract) ? 'T' : card.suit
}

const PLAIN_ORDER: Rank[] = ['7', '8', '9', 'Q', 'K', '10', 'A']
const NULL_ORDER: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const JACK_ORDER: Suit[] = ['D', 'H', 'S', 'C']

/**
 * Strength within the card's own effective suit; higher wins. Only comparable between two cards of
 * the same effective suit — `beats` handles the cross-suit cases.
 */
export function strength(card: Card, contract: Contract): number {
  if (contract.kind === 'null') return NULL_ORDER.indexOf(card.rank)
  if (card.rank === 'J') return 100 + JACK_ORDER.indexOf(card.suit)
  return PLAIN_ORDER.indexOf(card.rank)
}

/** Does `challenger` beat the card currently winning the trick? */
export function beats(challenger: Card, winning: Card, contract: Contract): boolean {
  const cs = effectiveSuit(challenger, contract)
  const ws = effectiveSuit(winning, contract)
  if (cs === ws) return strength(challenger, contract) > strength(winning, contract)
  return cs === 'T'
}

/** Index (0-based, in play order) of the card that takes the trick. */
export function trickWinnerIndex(trick: Card[], contract: Contract): number {
  let best = 0
  for (let i = 1; i < trick.length; i++) {
    if (beats(trick[i], trick[best], contract)) best = i
  }
  return best
}

/** Follow suit if you can (trumps are one suit); otherwise anything. There is no duty to win. */
export function legalPlays(hand: Card[], trick: Card[], contract: Contract): Card[] {
  if (trick.length === 0) return hand
  const led = effectiveSuit(trick[0], contract)
  const following = hand.filter((c) => effectiveSuit(c, contract) === led)
  return following.length > 0 ? following : hand
}

/** All trumps of a contract, strongest first: ♣J ♠J ♥J ♦J, then A 10 K Q 9 8 7 of the trump suit. */
export function trumpSequence(contract: Contract): Card[] {
  if (contract.kind === 'null') return []
  const jacks: Card[] = SUITS.map((suit) => ({ suit, rank: 'J' as Rank }))
  if (contract.kind === 'grand') return jacks
  const rest = [...PLAIN_ORDER].reverse().map((rank) => ({ suit: contract.trump, rank }))
  return [...jacks, ...rest]
}

/** Hand order for display: trumps first (strongest left), then each suit, strongest first. */
export function sortHand(hand: Card[], contract: Contract | null): Card[] {
  const c: Contract = contract ?? { kind: 'grand' }
  const group = (card: Card) => {
    if (isTrump(card, c)) return -1
    return SUITS.indexOf(card.suit)
  }
  return [...hand].sort((a, b) => group(a) - group(b) || strength(b, c) - strength(a, c))
}

/** Fisher–Yates with an injectable source, so a test or a lesson can deal a known hand. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Parse "C:J A 10 | H:K 7" style shorthand; lessons and tests state hands with it. */
export function cards(spec: string): Card[] {
  return spec
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [suit, ranks] = part.split(':')
      return ranks
        .trim()
        .split(/\s+/)
        .map((rank) => ({ suit: suit.trim() as Suit, rank: rank as Rank }))
    })
}
