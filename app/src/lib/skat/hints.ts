// The course's own advice at the table, as text: what the 💡 buttons say, in the learner's language.
// One place for it, because two readers need the same words — the table's hint panel, and the
// assistant's view of the table (table-view.ts), which quotes it as the authoritative answer to
// "what should I do?". Seat 0 is always the learner.

import { bidAdvice, chooseDeclaration, declarationAdvice, skatAdvice } from './ai'
import type { Card } from './cards'
import { type Game, type Seat, adviceFor } from './game'
import { adviceReason, cardLabel, contractName } from './i18n'
import { m } from '~/paraglide/messages'

export type Hint = { text: string; card?: Card; cards?: Card[] }

const ME: Seat = 0

export function bidHint(game: Game): Hint {
  const a = bidAdvice(game.hands[ME])
  return { text: a.contract ? m.bid_hint_limit({ contract: contractName(a.contract), limit: a.limit }) : m.bid_hint_pass() }
}

export function skatHint(game: Game): Hint {
  const a = skatAdvice(game.hands[ME], game.bid).hand
  const args = { contract: contractName(a.declaration.contract), value: a.value, bid: game.bid }
  return { text: a.covers ? m.skat_hint_pickup_covers(args) : m.skat_hint_pickup_short(args) }
}

export function discardHint(game: Game): Hint {
  const plan = chooseDeclaration(game.hands[ME], game.bid)
  return {
    cards: plan.discard,
    text: m.skat_hint({ cards: plan.discard.map(cardLabel).join(m.list_and()), contract: contractName(plan.declaration.contract) }),
  }
}

export function declareHint(game: Game): Hint {
  // The same cards the picker values: the ten kept plus the two put away, or in a Hand game
  // the ten alone — the skat is unseen.
  const isHand = !game.pickedUp
  const ten = game.hands[ME]
  const a = declarationAdvice(ten, isHand ? ten : [...ten, ...game.skat], game.bid, isHand)
  const contract = `${contractName(a.declaration.contract)}${isHand ? ' Hand' : ''}`
  const why =
    a.declaration.contract.kind === 'suit'
      ? m.declare_hint_suit({ contract, trumps: a.trumps, aces: a.aces })
      : a.declaration.contract.kind === 'grand'
        ? m.declare_hint_grand({ contract, jacks: a.jacks, aces: a.aces })
        : a.nullRisk === 0
          ? m.declare_hint_null({ contract })
          : m.declare_hint_null_risky({ contract, n: a.nullRisk })
  const worth = a.covers ? m.declare_hint_covers({ value: a.value, bid: game.bid }) : m.declare_hint_overbid({ value: a.value, bid: game.bid })
  const hand = isHand ? `${m.declare_hint_no_announce()}${a.declaration.contract.kind === 'null' ? '' : m.declare_hand_note()}` : ''
  const weak = a.strong ? '' : m.declare_hint_weak()
  return { text: `${why}${worth}${weak}${hand}` }
}

export function playHint(game: Game): Hint | null {
  const advice = adviceFor(game, ME)
  return advice ? { card: advice.card, text: m.play_hint({ card: cardLabel(advice.card), reason: adviceReason(advice.reason) }) } : null
}

/** The hint the table would give right now, if it is the learner's move; null when it is not. */
export function currentHint(game: Game): Hint | null {
  if (game.phase === 'bidding') {
    const b = game.bidding
    const mine = (b.awaiting === 'speaker' && b.speaker === ME) || (b.awaiting === 'listener' && b.listener === ME) || b.awaiting === 'forehandAlone'
    return mine ? bidHint(game) : null
  }
  if (game.declarer !== ME) return null
  if (game.phase === 'skat') return game.pickedUp ? discardHint(game) : skatHint(game)
  if (game.phase === 'declare') return declareHint(game)
  if (game.phase === 'play') return playHint(game)
  return null
}
