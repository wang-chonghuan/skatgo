import { type Card, type Suit, SUITS, pointsOf } from './cards'

// Free play's put-away tips (SKATGO-177, the human: 「选合约阶段提示的太多太直白了……让用户能学到东西，能思考，还不是直接告诉
// 他怎么做」, then 「按这个改，不留看ai的扣法」): the rules for choosing the game and putting away from Kulzer's Mein
// Skat-Kompendium (Gewinnplan 30–34, Skat drücken 35–38) — the safe game first, put away the points you would not bring home,
// put a suit free, keep Aces and trumps — each with one pointer at the twelve cards that says what to look for, never which
// card to put away or which game to play. Plain rules over the cards, no AI.

export type PutAwayTips = {
  /** The trumps the longest suit makes with every Jack held. */
  trumps: number
  /** Side cards the opponents would probably take in play: a 10 without its Ace in a suit of one or two cards, a lone King
   *  or Queen. The longest suit is the likely trump, so the side suits are the other three. */
  atRisk: number
  /** The shortest side suit that can be put away whole without giving up an Ace: of one card, of two, none — or a side
   *  suit is already void. */
  short: 'one' | 'two' | 'void' | 'none'
}

/** The pointers for the declarer's twelve cards: the hand after picking up, or the ten kept and the two put away. */
export function putAwayTips(twelve: Card[]): PutAwayTips {
  const jacks = twelve.filter((c) => c.rank === 'J').length
  const of = (s: Suit) => twelve.filter((c) => c.suit === s && c.rank !== 'J')
  // The likely trump: the most cards, then the most points; a tie left after that goes to the higher suit (SUITS' order).
  const trump = [...SUITS].sort((a, b) => of(b).length - of(a).length || pointsOf(of(b)) - pointsOf(of(a)))[0]
  const side = SUITS.filter((s) => s !== trump).map(of)
  const ace = (cs: Card[]) => cs.some((c) => c.rank === 'A')
  const atRisk = side.reduce((n, cs) => {
    const ten = !ace(cs) && cs.length <= 2 && cs.some((c) => c.rank === '10')
    const picture = cs.length === 1 && (cs[0].rank === 'K' || cs[0].rank === 'Q')
    return n + (ten || picture ? 1 : 0)
  }, 0)
  const emptied = (n: number) => side.some((cs) => cs.length === n && !ace(cs))
  const short = emptied(1) ? 'one' : emptied(2) ? 'two' : side.some((cs) => cs.length === 0) ? 'void' : 'none'
  return { trumps: jacks + of(trump).length, atRisk, short }
}
