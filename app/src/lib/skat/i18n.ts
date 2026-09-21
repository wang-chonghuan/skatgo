// Everything the rules engine knows, phrased in the learner's language. The engine (cards, game,
// value, ai) returns facts — a suit, a contract, a reason code with the cards it cites — and this is
// the one place that turns them into words, through the Paraglide messages in app/messages/*.json.
// The current language is Paraglide's: the URL prefix, on the server and in the browser alike.

import { m } from '~/paraglide/messages'
import { type Card, type Contract, type Rank, type Suit, SUIT_SYMBOL } from './cards'
import type { Role } from './game'
import type { AdviceReason } from './ai'
import type { MultiplierPart, SettleReason } from './value'

export function suitName(s: Suit): string {
  return { C: m.suit_clubs, S: m.suit_spades, H: m.suit_hearts, D: m.suit_diamonds }[s]()
}

/** The letter printed for a rank. German Skat writes Bube and Dame as B and D. */
export function rankLetter(r: Rank): string {
  if (r === 'J') return m.rank_letter_jack()
  if (r === 'Q') return m.rank_letter_queen()
  return r
}

/** "♣J" (zh, en) or "♣B" (de): the compact label every explanation cites a card by. */
export const cardLabel = (c: Card) => `${SUIT_SYMBOL[c.suit]}${rankLetter(c.rank)}`

/** What a screen reader says for a card: "Clubs Jack", "Kreuz Bube", "梅花 J". */
export function spokenCard(c: Card): string {
  const names: Partial<Record<Rank, () => string>> = { A: m.rank_name_ace, K: m.rank_name_king, Q: m.rank_name_queen, J: m.rank_name_jack }
  return m.card_spoken({ suit: suitName(c.suit), rank: names[c.rank]?.() ?? c.rank })
}

export function contractName(c: Contract): string {
  if (c.kind === 'grand') return 'Grand'
  if (c.kind === 'null') return 'Null'
  return m.contract_suit({ name: suitName(c.trump), symbol: SUIT_SYMBOL[c.trump] })
}

/** The suit a card counts as when following, by name: a suit, or "trumps". */
export const ledName = (led: Suit | 'T') => (led === 'T' ? m.trumps() : `${suitName(led)}${SUIT_SYMBOL[led]}`)

export function roleName(r: Role): string {
  return { forehand: m.role_forehand, middlehand: m.role_middlehand, rearhand: m.role_rearhand }[r]()
}

/** "with 2" / "without 3" — the matador count as the table says it. */
export const matadorLabel = (w: boolean, n: number) => (w ? m.matadors_with({ n }) : m.matadors_without({ n }))

export function partLabel(p: MultiplierPart, matadors: { with: boolean; count: number }): string {
  switch (p.kind) {
    case 'matadors':
      return matadorLabel(matadors.with, matadors.count)
    case 'game':
      return m.part_game()
    case 'hand':
      return 'Hand'
    case 'schneider':
      return 'Schneider'
    case 'schneiderAnnounced':
      return m.announced_schneider()
    case 'schwarz':
      return 'Schwarz'
    case 'schwarzAnnounced':
      return m.announced_schwarz()
    case 'ouvert':
      return 'Ouvert'
  }
}

export function settleReason(r: SettleReason): string {
  switch (r.kind) {
    case 'nullWon':
      return m.settle_null_won()
    case 'nullLost':
      return m.settle_null_lost()
    case 'enough':
      return m.settle_enough({ points: r.points })
    case 'short':
      return m.settle_short({ points: r.points })
    case 'schneiderMissed':
      return m.settle_schneider_missed()
    case 'schwarzMissed':
      return m.settle_schwarz_missed()
    case 'overbid':
      return m.settle_overbid({ worth: r.worth, bid: r.bid })
  }
}

export function adviceReason(r: AdviceReason): string {
  switch (r.code) {
    case 'onlyCard':
      return m.advice_only_card()
    case 'drawTrumpsMaster':
      return m.advice_draw_trumps_master({ card: cardLabel(r.card) })
    case 'drawTrumpsLow':
      return m.advice_draw_trumps_low()
    case 'cashMasterNoTrumps':
      return m.advice_cash_master_no_trumps({ card: cardLabel(r.card) })
    case 'cashMaster':
      return m.advice_cash_master({ card: cardLabel(r.card) })
    case 'leadLow':
      return m.advice_lead_low()
    case 'cannotWin':
      return m.advice_cannot_win()
    case 'lastWinPlain':
      return m.advice_last_win_plain({ card: cardLabel(r.card) })
    case 'lastNoPoints':
      return m.advice_last_no_points()
    case 'lastWinCheapTrump':
      return m.advice_last_win_cheap_trump({ card: cardLabel(r.card), pot: r.pot })
    case 'safeWin':
      return m.advice_safe_win({ card: cardLabel(r.card) })
    case 'grabPot':
      return m.advice_grab_pot({ pot: r.pot })
    case 'secondLow':
      return m.advice_second_low()
    case 'defCashAce':
      return m.advice_def_cash_ace({ card: cardLabel(r.card) })
    case 'defNoTrumpLead':
      return m.advice_def_no_trump_lead()
    case 'defOnlyTrumps':
      return m.advice_def_only_trumps()
    case 'defSmear':
      return m.advice_def_smear({ card: cardLabel(r.card), points: r.points })
    case 'defNothingToSmear':
      return m.advice_def_nothing_to_smear()
    case 'defOvertake':
      return m.advice_def_overtake({ card: cardLabel(r.card) })
    case 'defDontFeed':
      return m.advice_def_dont_feed()
    case 'defAceBeforeDeclarer':
      return m.advice_def_ace_before_declarer({ card: cardLabel(r.card) })
    case 'defWait':
      return m.advice_def_wait()
    case 'nullLeadDeclarer':
      return m.advice_null_lead_declarer()
    case 'nullLeadDefender':
      return m.advice_null_lead_defender()
    case 'nullVoidDump':
      return m.advice_null_void_dump()
    case 'nullDuck':
      return m.advice_null_duck({ card: cardLabel(r.card) })
    case 'nullForced':
      return m.advice_null_forced()
    case 'nullDefUnder':
      return m.advice_null_def_under({ card: cardLabel(r.card) })
    case 'nullDefDump':
      return m.advice_null_def_dump()
    case 'nullDefPressure':
      return m.advice_null_def_pressure()
  }
}
