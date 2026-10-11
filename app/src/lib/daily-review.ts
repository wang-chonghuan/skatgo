import { type ChatMessage, openModelStream } from '~/lib/ask/azure'
import { LIMITS } from '~/lib/ask/limits'
import type { Card, Contract } from '~/lib/skat/cards'
import type { Seat } from '~/lib/skat/game'
import { type DealReview, type DealSummary, PLAYER } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

// The words of a deal's review (SKATGO-79): the multiplayer service finds the player's worst card with
// SkatZero; this asks the assistant's model (`gpt-5.6-luna`, medium — the human's choice) for two or three
// sentences on why it was worse than SkatZero's card. The model is given only the facts the service
// found, in the page's language, and explains them; it never decides which card was worst.

/** A card in words: "Pik-Zehn", "Ten of Spades". */
function cardWords(c: Card, locale: Locale): string {
  const o = { locale }
  const suit = { C: m.suit_clubs, S: m.suit_spades, H: m.suit_hearts, D: m.suit_diamonds }[c.suit]({}, o)
  const rank = { A: m.rank_name_ace, K: m.rank_name_king, Q: m.rank_name_queen, J: m.rank_name_jack }[c.rank as 'A' | 'K' | 'Q' | 'J']?.({}, o) ?? c.rank
  return m.card_spoken({ suit, rank }, o)
}

function contractWords(c: Contract, locale: Locale): string {
  if (c.kind === 'grand') return 'Grand'
  if (c.kind === 'null') return 'Null'
  return { C: m.suit_clubs, S: m.suit_spades, H: m.suit_hearts, D: m.suit_diamonds }[c.trump]({}, { locale })
}

const seatName = (s: Seat, locale: Locale) => [m.name_you, m.name_lina, m.name_max][s]({}, { locale })

/** One side's deal as a line: the game, who declared it, won or lost with the card points, the seat's score. */
function dealLine(d: DealSummary, who: string, locale: Locale): string {
  const de = locale === 'de'
  if (d.declarer === null || !d.declaration) return de ? `${who}: alle haben gepasst.` : `${who}: everyone passed.`
  const x = d.detail
  const game = `${contractWords(d.declaration.contract, locale)}${d.declaration.hand ? ' Hand' : ''}${d.declaration.ouvert ? ' Ouvert' : ''}`
  const declarer = d.declarer === PLAYER ? who : seatName(d.declarer, locale)
  const points = x && d.declaration.contract.kind !== 'null' ? ` ${x.declarerPoints}:${x.defenderPoints}` : ''
  const outcome = de ? (d.won ? 'gewonnen' : 'verloren') : d.won ? 'won' : 'lost'
  return de
    ? `${who}: ${game}, Alleinspieler ${declarer}, ${outcome}${points}; Punkte auf diesem Platz ${d.scores[PLAYER]}.`
    : `${who}: ${game}, declarer ${declarer}, ${outcome}${points}; score in this seat ${d.scores[PLAYER]}.`
}

/** The facts the model explains, and how it is to answer. Null when there is no worst card. */
export function reviewPrompt(r: DealReview, locale: Locale): { system: string; messages: ChatMessage[] } | null {
  const w = r.worst
  if (!w || !r.mine.declaration || r.mine.declarer === null) return null
  const de = locale === 'de'
  const role = r.mine.declarer === PLAYER ? m.daily_role_declarer({}, { locale }) : m.daily_role_defender({}, { locale })
  const before = w.table.map((p) => `${seatName(p.seat, locale)} ${cardWords(p.card, locale)}`).join(', ')
  const facts = de
    ? [
        `Spiel: ${contractWords(r.mine.declaration.contract, locale)}${r.mine.declaration.hand ? ' Hand' : ''}, Alleinspieler ${seatName(r.mine.declarer, locale)}, gereizt bis ${r.bid}. Der Spieler ist ${role}.`,
        `${w.trick}. Stich. ${before ? `Schon im Stich: ${before}.` : 'Der Spieler spielt aus.'}`,
        `Hand des Spielers vor dem Zug: ${w.hand.map((c) => cardWords(c, locale)).join(', ')}.`,
        `Gespielt: ${cardWords(w.played, locale)}. SkatZero hätte gespielt: ${cardWords(w.best, locale)}.`,
        dealLine(r.mine, 'Spiel des Spielers', locale),
        r.ai ? dealLine(r.ai, 'Dieselbe Hand, von der KI gespielt', locale) : '',
      ]
    : [
        `Game: ${contractWords(r.mine.declaration.contract, locale)}${r.mine.declaration.hand ? ' Hand' : ''}, declarer ${seatName(r.mine.declarer, locale)}, bid to ${r.bid}. The player is the ${role}.`,
        `Trick ${w.trick}. ${before ? `Already in the trick: ${before}.` : 'The player leads.'}`,
        `The player's hand before the move: ${w.hand.map((c) => cardWords(c, locale)).join(', ')}.`,
        `Played: ${cardWords(w.played, locale)}. SkatZero would have played: ${cardWords(w.best, locale)}.`,
        dealLine(r.mine, "The player's deal", locale),
        r.ai ? dealLine(r.ai, 'The same hand played by the AI', locale) : '',
      ]
  const system = de
    ? 'Du bist der Skat-Trainer von SkatGo. Erkläre einem Lernenden in zwei bis drei kurzen Sätzen, warum seine Karte schlechter war als die von SkatZero. Stütze dich nur auf die genannten Fakten und nenne keine Karten, die dort nicht stehen. Duze den Lernenden und nutze die Begriffe einer Skatrunde (Stich, Trumpf, Augen, Alleinspieler, Gegenspieler). Kein Markdown, keine Aufzählung, keine Überschrift.'
    : "You are SkatGo's Skat coach. In two or three short sentences, explain to a learner why their card was worse than SkatZero's. Use only the facts given and name no card that is not in them. Address the learner as you; keep the German Skat terms Grand, Null, Hand and Ouvert. No Markdown, no lists, no heading."
  return { system, messages: [{ role: 'user', content: facts.filter(Boolean).join('\n') }] }
}

/** The model's few sentences, or null when it cannot answer now (the card itself is still shown). */
export async function explainReview(r: DealReview, locale: Locale): Promise<string | null> {
  const prompt = reviewPrompt(r, locale)
  if (!prompt) return null
  const signal = AbortSignal.timeout(LIMITS.timeoutMs)
  const stream = await openModelStream(prompt.system, prompt.messages, signal, LIMITS.reviewTokens)
  if (!stream.ok) return null
  let text = ''
  try {
    for await (const piece of stream.deltas) text += piece
  } catch {
    return null
  }
  return text.trim() || null
}
