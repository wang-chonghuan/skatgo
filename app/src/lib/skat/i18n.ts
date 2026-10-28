// Everything the rules engine knows, phrased in the learner's language. The engine (cards, game,
// value, ai) returns facts — a suit, a contract, a reason code with the cards it cites — and this is
// the one place that turns them into words, through the Paraglide messages in app/messages/*.json.
// The current language is Paraglide's: the URL prefix, on the server and in the browser alike.

import { m } from '~/paraglide/messages'
import { type Card, type Contract, type Rank, type Suit, SUIT_SYMBOL } from './cards'
import type { Role } from './game'
import type { AdviceReason } from './ai'
import type { Declaration, MultiplierPart, SettleReason, Settlement } from './value'
import { SEEGER_FABIAN } from './tournament'

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

/** What a screen reader says for a card: "Clubs Jack", "Kreuz Bube". */
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

/** A deal's whole calculation in one line, the score at its end — won, lost and doubled, or overbid (SKATGO-127,
 *  a player's suggestion: 「Display the full calculation at the end of the game」). */
export function settlementFormula(r: Settlement, d: Declaration, bid: number, seeger: boolean): string {
  const isNull = d.contract.kind === 'null'
  const worth = isNull ? r.value : r.base * r.multiplier
  const calculation = isNull
    ? m.result_null_formula({ contract: `Null${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''}`, value: r.value })
    : m.result_formula_mult({
        parts: r.parts.map((p, i) => (i === 0 ? partLabel(p, r.matadors) : `${partLabel(p, r.matadors)} 1`)).join(' + '),
        mult: r.multiplier,
        contract: contractName(d.contract),
        base: r.base,
        value: worth,
      })
  // Ends in the score the table counts: Seeger-Fabian — +50 for a won game, −50 more for a lost one, and 40 for each
  // defender then — or the game value alone. The same minus sign as in "−2 ×".
  const sf = SEEGER_FABIAN
  const lostBy = r.overbid ? m.result_formula_overbid({ bid, worth, value: r.value }) : ''
  const outcome = r.won
    ? seeger
      ? m.result_formula_won_sf({ value: r.value, bonus: sf.won, score: `+${r.value + sf.won}` })
      : m.result_formula_won({ score: `+${r.score}` })
    : seeger
      ? m.result_formula_lost_sf({ value: r.value, bonus: sf.lost, score: `−${2 * r.value + sf.lost}`, defender: sf.defender })
      : m.result_formula_lost({ value: r.value, score: `−${Math.abs(r.score)}` })
  return [calculation, lostBy, outcome].filter(Boolean).join(' · ')
}

/** One step of a deal's calculation as a row: what it is, and its number. */
export type SettlementRow = { label: string; value: string }

/**
 * A deal's calculation step by step, as the result card lists it (SKATGO-145, the human: 「计算过程写到浅绿色卡片里，
 * 要清晰点，别一坨普通文字」): the base value, the multiplier, the game value, an overbid, the outcome, and last the
 * player's own Seeger-Fabian score. `declarer` names the declarer when it is not the player.
 */
export function settlementRows(r: Settlement, d: Declaration, bid: number, mine: boolean, declarer: string): SettlementRow[] {
  // The calculation in as few rows as it reads (SKATGO-148, the human: 「那个公式占用的行数太多」): the game value from its
  // contract's base value and multiplier in one row, then the outcome to its Seeger-Fabian number in another. The
  // player's own score is the card's title, and everyone's is in the seats above.
  const rows: SettlementRow[] = []
  if (d.contract.kind === 'null') {
    rows.push({ label: m.result_row_null({ contract: `Null${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''}` }), value: String(r.value) })
  } else {
    const parts = r.parts.map((p, i) => (i === 0 ? partLabel(p, r.matadors) : `${partLabel(p, r.matadors)} 1`)).join(' + ')
    rows.push({ label: m.result_row_game({ contract: contractName(d.contract), base: r.base, multiplier: r.multiplier, parts }), value: String(r.base * r.multiplier) })
  }
  if (r.overbid) rows.push({ label: m.result_row_overbid({ bid }), value: String(r.value) })
  const sf = SEEGER_FABIAN
  const signedScore = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0')
  if (mine) {
    rows.push(r.won
      ? { label: `${m.result_row_won()}: ${r.value} + ${sf.won}`, value: signedScore(r.value + sf.won) }
      : { label: `${m.result_row_lost()}: −2 × ${r.value} − ${sf.lost}`, value: signedScore(-2 * r.value - sf.lost) })
  } else {
    rows.push(r.won
      ? { label: `${m.result_row_other_won({ name: declarer })}: ${r.value} + ${sf.won}`, value: signedScore(r.value + sf.won) }
      : { label: m.result_row_other_lost({ name: declarer }), value: signedScore(sf.defender) })
  }
  return rows
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
