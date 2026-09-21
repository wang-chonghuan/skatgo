// Drill generators. Each builds a fresh question from random cards and lets the rules engine work
// out the answer, so the tenth attempt is as new as the first and no answer key can drift away from
// the rules. They use Math.random, so they run in the browser only — the lesson player calls them
// after mount. Their wording comes from the Paraglide messages (`drill_*`), in the learner's language.

import {
  type Card,
  type Contract,
  type Suit,
  POINTS,
  SUITS,
  SUIT_SYMBOL,
  effectiveSuit,
  fullDeck,
  isTrump,
  legalPlays,
  pointsOf,
  sameCard,
  shuffle,
  sortHand,
  strength,
  trickWinnerIndex,
} from '../cards'
import { SUIT_BASE, GRAND_BASE, matadors } from '../value'
import { cardLabel, contractName, ledName, matadorLabel, suitName } from '../i18n'
import { m } from '~/paraglide/messages'
import type { ChoiceStep, OrderStep, PickStep } from './types'

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]
const randomSuit = (): Suit => pick(SUITS)
const suitContract = (): Contract => ({ kind: 'suit', trump: randomSuit() })

/** Four distinct numeric options containing the answer, shuffled. */
function numberOptions(answer: number, decoys: number[]): { options: string[]; answer: number } {
  const pool = [...new Set(decoys.filter((d) => d !== answer && d >= 0))]
  const options = shuffle([answer, ...shuffle(pool).slice(0, 3)])
  return { options: options.map(String), answer: options.indexOf(answer) }
}

export function countPointsDrill(): ChoiceStep {
  // Draw until the trick is worth something: three blanks teach nothing about counting.
  let trick: Card[]
  do trick = shuffle(fullDeck()).slice(0, 3)
  while (pointsOf(trick) < 5)
  const total = pointsOf(trick)
  const sum = trick.map((c) => POINTS[c.rank]).join(' + ')
  return {
    kind: 'choice',
    prompt: m.drill_count_prompt(),
    rows: [{ cards: trick }],
    ...numberOptions(total, [total + 1, total - 1, total + 2, total - 2, total + 10, total - 10, total + 7, total - 7, total + 3]),
    explain: m.drill_count_explain({ sum, total }),
    hint: m.drill_count_hint(),
  }
}

// The defaults below draw suit games only: lessons 3 and 4 use them, and Grand is not taught until
// lesson 5, which asks for it by name.
export function pickTrumpsDrill(contract: Contract = suitContract()): PickStep {
  let hand: Card[]
  let trumps: Card[]
  do {
    hand = shuffle(fullDeck()).slice(0, 8)
    trumps = hand.filter((c) => isTrump(c, contract))
  } while (trumps.length < 2 || trumps.length > 6 || !trumps.some((c) => c.rank === 'J'))
  return {
    kind: 'pick',
    prompt: m.drill_trumps_prompt({ contract: contractName(contract) }),
    cards: sortHand(hand, null),
    correct: trumps,
    explain:
      contract.kind === 'suit'
        ? m.drill_trumps_explain_suit({ suit: `${suitName(contract.trump)}${SUIT_SYMBOL[contract.trump]}` })
        : m.drill_trumps_explain_grand(),
    hint: contract.kind === 'grand' ? m.drill_trumps_hint_grand() : m.drill_trumps_hint_suit(),
  }
}

export function orderDrill(contract: Contract = suitContract()): OrderStep {
  let chosen: Card[]
  if (contract.kind === 'null') {
    const suit = randomSuit()
    chosen = shuffle(fullDeck().filter((c) => c.suit === suit)).slice(0, 5)
  } else {
    const trumps = fullDeck().filter((c) => isTrump(c, contract))
    do chosen = shuffle(trumps).slice(0, Math.min(5, trumps.length))
    while (contract.kind === 'suit' && chosen.filter((c) => c.rank === 'J').length < 2)
  }
  const correct = [...chosen].sort((a, b) => strength(b, contract) - strength(a, contract))
  return {
    kind: 'order',
    prompt: m.drill_order_prompt({ contract: contractName(contract) }),
    cards: shuffle(chosen),
    correct,
    explain:
      contract.kind === 'null'
        ? m.drill_order_explain_null({ order: correct.map(cardLabel).join(' > ') })
        : m.drill_order_explain({ order: correct.map(cardLabel).join(' > ') }),
    hint: contract.kind === 'null' ? m.drill_order_hint_null() : m.drill_order_hint(),
  }
}

export function legalDrill(contract: Contract = suitContract()): PickStep {
  // Aim for the instructive cases: a plain-suit lead while the hand holds the Jack of that printed
  // suit, or a trump lead answered with Jacks.
  for (;;) {
    const deck = shuffle(fullDeck())
    const hand = deck.slice(0, 7)
    const lead = deck[7]
    const legal = legalPlays(hand, [lead], contract)
    if (legal.length === hand.length && Math.random() < 0.8) continue
    const trap = hand.some((c) => c.rank === 'J' && c.suit === lead.suit) || isTrump(lead, contract)
    if (!trap && Math.random() < 0.6) continue
    const led = effectiveSuit(lead, contract)
    const name = ledName(led)
    return {
      kind: 'pick',
      prompt: m.drill_legal_prompt({ contract: contractName(contract), lead: cardLabel(lead) }),
      context: m.drill_legal_context({ lead: cardLabel(lead), led: name }),
      cards: sortHand(hand, contract),
      correct: legal,
      explain:
        legal.length === hand.length
          ? m.drill_legal_explain_any({ led: name })
          : led === 'T'
            ? m.drill_legal_explain_follow_trump({ led: name })
            : m.drill_legal_explain_follow_suit({ led: name }),
      hint: m.drill_legal_hint({ led: name }),
    }
  }
}

export function trickWinnerDrill(contract: Contract = suitContract()): PickStep {
  for (;;) {
    const deck = shuffle(fullDeck())
    // Build a trick people could really have played: the second and third cards must be legal.
    const lead = deck[0]
    const second = pick(legalPlays(deck.slice(1, 11), [lead], contract))
    const third = pick(legalPlays(deck.slice(11, 21), [lead, second], contract))
    const trick = [lead, second, third]
    const interesting = trick.some((c) => isTrump(c, contract)) || new Set(trick.map((c) => c.suit)).size > 1
    if (!interesting && Math.random() < 0.7) continue
    const w = trickWinnerIndex(trick, contract)
    const winner = trick[w]
    const why = isTrump(winner, contract)
      ? trick.filter((c) => isTrump(c, contract)).length > 1
        ? m.drill_winner_why_top_trump({ card: cardLabel(winner) })
        : m.drill_winner_why_only_trump({ card: cardLabel(winner) })
      : m.drill_winner_why_suit({ suit: suitName(lead.suit), card: cardLabel(winner) })
    return {
      kind: 'pick',
      single: true,
      prompt: m.drill_winner_prompt({ contract: contractName(contract) }),
      cards: trick,
      correct: [winner],
      explain: m.drill_winner_explain({ why, points: pointsOf(trick) }),
      hint: m.drill_winner_hint(),
    }
  }
}

function dealtHand(): Card[] {
  return shuffle(fullDeck()).slice(0, 10)
}

export function matadorDrill(): ChoiceStep {
  const contract: Contract = Math.random() < 0.8 ? suitContract() : { kind: 'grand' }
  const hand = sortHand(dealtHand(), contract)
  const mat = matadors(hand, contract)
  const label = matadorLabel
  const decoys = [label(!mat.with, mat.count), label(mat.with, mat.count + 1), label(mat.with, Math.max(1, mat.count - 1)), label(!mat.with, mat.count + 1), label(mat.with, mat.count + 2)]
  const options = shuffle([label(mat.with, mat.count), ...[...new Set(decoys)].filter((d) => d !== label(mat.with, mat.count)).slice(0, 3)])
  return {
    kind: 'choice',
    prompt: m.drill_matador_prompt({ contract: contractName(contract) }),
    rows: [{ cards: hand }],
    options,
    answer: options.indexOf(label(mat.with, mat.count)),
    explain: mat.with
      ? m.drill_matador_explain_with({ n: mat.count })
      : m.drill_matador_explain_without({ n: mat.count }),
    hint: m.drill_matador_hint(),
  }
}

export function gameValueDrill(): ChoiceStep {
  const contract: Contract = Math.random() < 0.8 ? suitContract() : { kind: 'grand' }
  const hand = sortHand(dealtHand(), contract)
  const mat = matadors(hand, contract)
  const handGame = Math.random() < 0.3
  const base = contract.kind === 'grand' ? GRAND_BASE : SUIT_BASE[(contract as { trump: Suit }).trump]
  const mult = mat.count + 1 + (handGame ? 1 : 0)
  const value = base * mult
  return {
    kind: 'choice',
    prompt: handGame
      ? m.drill_value_prompt_hand({ contract: contractName(contract) })
      : m.drill_value_prompt({ contract: contractName(contract) }),
    rows: [{ cards: hand }],
    ...numberOptions(value, [base * (mult + 1), base * (mult - 1), base * mat.count, base * (mult + 2), (base + 1) * mult, (base - 1) * mult, base * mult + base / 2]),
    explain: (handGame ? m.drill_value_explain_hand : m.drill_value_explain)({
      matadors: matadorLabel(mat.with, mat.count),
      mult,
      contract: contractName(contract),
      base,
      value,
    }),
    hint: m.drill_value_hint(),
  }
}

export function settleDrill(): ChoiceStep {
  const trump = randomSuit()
  const base = SUIT_BASE[trump]
  const mult = pick([2, 3, 4])
  const value = base * mult
  const scenario = pick(['win', 'lose', 'overbid', 'schneider'] as const)
  const name = contractName({ kind: 'suit', trump })
  let prompt: string
  let score: number
  let explain: string
  if (scenario === 'win') {
    const pts = pick([61, 64, 72, 80, 88])
    prompt = m.drill_settle_win_prompt({ name, mult, value, pts })
    score = value
    explain = m.drill_settle_win_explain({ pts, value })
  } else if (scenario === 'lose') {
    const pts = pick([60, 58, 52, 45, 38])
    prompt = m.drill_settle_lose_prompt({ name, mult, value, pts })
    score = -2 * value
    explain = m.drill_settle_lose_explain({ pts, value, score }) + (pts === 60 ? m.drill_settle_lose_tie() : '')
  } else if (scenario === 'schneider') {
    const pts = pick([90, 93, 101])
    prompt = m.drill_settle_schneider_prompt({ name, mult, pts })
    score = base * (mult + 1)
    explain = m.drill_settle_schneider_explain({ pts, base, mult: mult + 1, score })
  } else {
    const bid = value + base
    prompt = m.drill_settle_overbid_prompt({ bid, name, mult, value })
    score = -2 * bid
    explain = m.drill_settle_overbid_explain({ value, bid, base, mult: mult + 1, score })
  }
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n))
  const decoys = [value, -value, -2 * value, 2 * value, base * (mult + 1), -2 * base * (mult + 1), -(value + base)].filter((d) => d !== score)
  const options = shuffle([score, ...shuffle([...new Set(decoys)]).slice(0, 3)])
  return {
    kind: 'choice',
    prompt,
    options: options.map(fmt),
    answer: options.indexOf(score),
    explain,
    hint: m.drill_settle_hint(),
  }
}

/** Does the learner's pick equal the expected set? Order-free. */
export function sameSet(a: Card[], b: Card[]): boolean {
  return a.length === b.length && a.every((c) => b.some((d) => sameCard(c, d)))
}
