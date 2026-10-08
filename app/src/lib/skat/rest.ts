// When a deal is already decided before its last card (SKATGO-59): the declarer who holds the rest,
// and a Null nobody can make the declarer take a trick in. Pure functions of the cards; the moves that
// end a deal on them are `claim` and `concede` in game.ts, which play the rest out by the rules.

import { type Card, type Contract, SUITS, effectiveSuit, sameCard, strength } from './cards'

const byStrength = (contract: Contract) => (a: Card, b: Card) => strength(b, contract) - strength(a, contract)

/**
 * The declarer's rest in a suit game or a Grand, judged only from what the declarer sees: their own
 * hand and every card not in it, not yet played and not a skat they know (`unseen`). The declarer is
 * on lead. The rest is theirs when this line takes every remaining trick, however the unseen cards
 * lie and whatever the defenders play: every trump first, strongest first, then each suit strongest
 * first. Returns that line, or null when the rest is not certain this way.
 *
 * Why the line holds: assume one defender holds every unseen card of a kind — the worst case, since he
 * can keep his high cards longest by following with low ones. In the i-th round of a kind he still
 * holds max(0, m − i) of its m unseen cards, the strongest of them. So the declarer's i-th card of the
 * kind wins when i ≥ m or it beats the strongest unseen card. The declarer must hold at least as many
 * trumps as are unseen, so that none is left when the suits are led; after that a suit card can only be
 * beaten by its own suit.
 */
export function restLine(hand: Card[], unseen: Card[], contract: Contract): Card[] | null {
  if (contract.kind === 'null') return null
  const kinds: ('T' | Card['suit'])[] = ['T', ...SUITS]
  const line: Card[] = []
  for (const kind of kinds) {
    const mine = hand.filter((c) => effectiveSuit(c, contract) === kind).sort(byStrength(contract))
    const theirs = unseen.filter((c) => effectiveSuit(c, contract) === kind)
    if (kind === 'T' && mine.length < theirs.length) return null
    const top = Math.max(-1, ...theirs.map((c) => strength(c, contract)))
    for (let i = 0; i < Math.min(mine.length, theirs.length); i++) {
      if (strength(mine[i], contract) < top) return null
    }
    line.push(...mine)
  }
  return line
}

/**
 * A Null the declarer cannot lose any more, whoever plays whatever — the declarer's own cards
 * included — judged on every hand (`hands`, the declarer's at `declarer`) at an empty trick that
 * `leader` leads. It holds when in every suit each of the declarer's cards is below each of the
 * defenders' cards of that suit, and, if the declarer leads, the defenders still hold cards of every
 * suit the declarer has: then a led card is always beaten by a defender who must follow, and once a
 * defender leads, the declarer either plays under or throws a card away. The declarer never wins a
 * trick, so never leads again, and the defenders' cards only grow stronger relative to theirs.
 */
export function nullBeaten(hands: Card[][], declarer: number, leader: number): boolean {
  const contract: Contract = { kind: 'null' }
  const mine = hands[declarer]
  const theirs = hands.filter((_, seat) => seat !== declarer).flat()
  return SUITS.every((suit) => {
    const d = mine.filter((c) => c.suit === suit).map((c) => strength(c, contract))
    const t = theirs.filter((c) => c.suit === suit).map((c) => strength(c, contract))
    if (d.length === 0) return true
    if (t.length === 0) return leader !== declarer
    return Math.max(...d) < Math.min(...t)
  })
}

/** The cards in `all` that are not in `without`. */
export const minus = (all: Card[], without: Card[]): Card[] => all.filter((c) => !without.some((w) => sameCard(w, c)))
