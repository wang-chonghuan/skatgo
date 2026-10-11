import { type ChatMessage, openModelStream } from '~/lib/ask/azure'
import { LIMITS } from '~/lib/ask/limits'
import { type Card, type Contract, pointsOf, trickWinnerIndex } from '~/lib/skat/cards'
import type { Played, Seat } from '~/lib/skat/game'
import { type DealReview, type DealSummary, PLAYER } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

// The words of a deal's review (SKATGO-79): the multiplayer service finds the player's worst card with
// SkatZero; this asks the assistant's model (`gpt-5.6-luna`, medium — the human's choice) for two or three
// sentences on why it was worse than SkatZero's card. The model is given only the facts the service
// found, in the page's language, and explains them; it never decides which card was worst. To the player
// SkatZero is "the AI" — its name is never shown, nor given to the model (the human, SKATGO-79).

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

/** Which cards are trumps in a contract, in words — and for Null, what the game is about. */
function trumpWords(c: Contract, locale: Locale): string {
  const de = locale === 'de'
  if (c.kind === 'null') {
    return de
      ? 'Nullspiel: kein Trumpf, Augen zählen nicht. Der Alleinspieler verliert, sobald er einen Stich bekommt; die Gegenspieler wollen ihm einen Stich aufzwingen.'
      : 'Null game: no trumps, card points do not count. The declarer loses as soon as they take a trick; the defenders try to force one on them.'
  }
  if (c.kind === 'grand') return de ? 'Trumpf sind nur die vier Buben.' : 'Only the four jacks are trumps.'
  return de ? `Trumpf sind die vier Buben und ${contractWords(c, locale)}.` : `Trumps are the four jacks and ${contractWords(c, locale)}.`
}

/** A trick's three cards in playing order, its taker, and — outside Null — its card points. */
function trickWords(cards: Played[], contract: Contract, side: (s: Seat) => string, locale: Locale): string {
  const de = locale === 'de'
  const taker = cards[trickWinnerIndex(cards.map((p) => p.card), contract)].seat
  const order = cards.map((p) => `${seatName(p.seat, locale)} ${cardWords(p.card, locale)}`).join(', ')
  const points = contract.kind === 'null' ? '' : de ? ` mit ${pointsOf(cards.map((p) => p.card))} Augen` : ` with ${pointsOf(cards.map((p) => p.card))} points`
  return de ? `${order} – ${seatName(taker, locale)} (${side(taker)}) bekommt den Stich${points}` : `${order} — ${seatName(taker, locale)} (${side(taker)}) takes the trick${points}`
}

/** The facts the model explains, and how it is to answer. Null when there is no worst card. It is given
 *  every fact a sentence could need — the two sides, the trumps (or what Null is about), how the trick
 *  really ended, and, when the player was the last to play it, how it would have ended with SkatZero's
 *  card — because a model left to work out a trick, or who is whose partner, gets it wrong. */
export function reviewPrompt(r: DealReview, locale: Locale): { system: string; messages: ChatMessage[] } | null {
  const w = r.worst
  if (!w || !r.mine.declaration || r.mine.declarer === null) return null
  const de = locale === 'de'
  const declarer = r.mine.declarer
  const contract = r.mine.declaration.contract
  const partner = ([1, 2] as Seat[]).find((s) => s !== declarer)!
  const side = (s: Seat) =>
    s === declarer ? (de ? 'Alleinspieler' : 'declarer') : declarer === PLAYER ? (de ? 'Gegenspieler' : 'defender') : de ? 'deine Partei' : 'your side'
  const sides = declarer === PLAYER
    ? de ? 'Der Spieler ist Alleinspieler gegen Lina und Noah.' : 'The player is the declarer against Lina and Noah.'
    : de ? `Alleinspieler ist ${seatName(declarer, locale)}. Der Spieler ist Gegenspieler zusammen mit seinem Partner ${seatName(partner, locale)}.` : `${seatName(declarer, locale)} is the declarer. The player defends together with their partner ${seatName(partner, locale)}.`
  const trick = r.tricks[w.trick - 1]
  const before = w.table.map((p) => `${seatName(p.seat, locale)} ${cardWords(p.card, locale)}`).join(', ')
  // Only a last card's trick is decided by it; otherwise the others' answer to SkatZero's card is unknown.
  const last = w.table.length === 2
  const instead = last
    ? de ? `Mit ${cardWords(w.best, locale)} statt dessen: ${trickWords([...w.table, { seat: PLAYER, card: w.best }], contract, side, locale)}.` : `With ${cardWords(w.best, locale)} instead: ${trickWords([...w.table, { seat: PLAYER, card: w.best }], contract, side, locale)}.`
    : de ? `Nach dem Spieler kamen noch Karten in den Stich; wie sie auf ${cardWords(w.best, locale)} geantwortet hätten, ist nicht bekannt.` : `Cards were still to come after the player's; how they would have answered ${cardWords(w.best, locale)} is not known.`
  const game = `${contractWords(contract, locale)}${r.mine.declaration.hand ? ' Hand' : ''}`
  const facts = de
    ? [
        `Spiel: ${game}, gereizt bis ${r.bid}. ${sides}`,
        trumpWords(contract, locale),
        `${w.trick}. Stich. ${before ? `Vor dem Spieler gespielt: ${before}.` : 'Der Spieler spielt aus.'}`,
        `Hand des Spielers vor dem Zug: ${w.hand.map((c) => cardWords(c, locale)).join(', ')}.`,
        `Gespielt: ${cardWords(w.played, locale)}. Die AI hätte gespielt: ${cardWords(w.best, locale)}.`,
        trick ? `So lief der Stich wirklich: ${trickWords(trick.cards, contract, side, locale)}.` : '',
        instead,
        dealLine(r.mine, 'Ergebnis des Spiels', locale),
      ]
    : [
        `Game: ${game}, bid to ${r.bid}. ${sides}`,
        trumpWords(contract, locale),
        `Trick ${w.trick}. ${before ? `Played before the player: ${before}.` : 'The player leads.'}`,
        `The player's hand before the move: ${w.hand.map((c) => cardWords(c, locale)).join(', ')}.`,
        `Played: ${cardWords(w.played, locale)}. The AI would have played: ${cardWords(w.best, locale)}.`,
        trick ? `How the trick really went: ${trickWords(trick.cards, contract, side, locale)}.` : '',
        instead,
        dealLine(r.mine, 'Result of the game', locale),
      ]
  const system = de
    ? 'Du bist der Skat-Trainer von SkatGo. Antworte auf Deutsch. Erkläre einem Lernenden in zwei bis drei kurzen Sätzen, warum seine Karte schlechter war als die der AI. Stütze dich nur auf die genannten Fakten und nenne keine Karten, Stiche oder Ergebnisse, die dort nicht stehen. Beachte, wer zu wessen Partei gehört: Augen, die der Partner bekommt, gehören auch dem Spieler. Wer einen Stich bekommt, steht in den Fakten; wo dort steht, dass es nicht bekannt ist, behaupte es nicht und erwähne es auch nicht, sondern erkläre, was feststeht (etwa wie viele Augen die Karte in den Stich gibt oder ob ein Trumpf verbraucht wird). Duze den Lernenden und nutze die Begriffe einer Skatrunde (Stich, Trumpf, Augen, Alleinspieler, Gegenspieler, schmieren). Kein Markdown, keine Aufzählung, keine Überschrift.'
    : "You are SkatGo's Skat coach. Answer in English only, whatever language the terms are in. In two or three short sentences, explain to a learner why their card was worse than the AI's. Use only the facts given and name no card, trick or result that is not in them. Mind who is on whose side: points the partner takes belong to the player too. Who takes a trick is in the facts; where they say it is not known, do not claim it and do not mention it — explain what is certain instead (such as how many points the card puts into the trick, or whether a trump is spent). Address the learner as you; keep the German Skat terms Grand, Null, Hand and Ouvert. No Markdown, no lists, no heading."
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
