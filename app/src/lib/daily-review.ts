import { type ChatMessage, openModelStream } from '~/lib/ask/azure'
import { LIMITS } from '~/lib/ask/limits'
import { type Card, type Contract, effectiveSuit, fullDeck, pointsOf, sameCard, strength, trickWinnerIndex } from '~/lib/skat/cards'
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
      ? 'Nullspiel: kein Trumpf, Augen zählen nicht; in jeder Farbe gilt die Reihenfolge A, K, D, B, 10, 9, 8, 7. Der Alleinspieler verliert, sobald er einen Stich bekommt; die Gegenspieler wollen ihm einen Stich aufzwingen. Behaupte nichts darüber, welche Karte die höchste ihrer Farbe ist.'
      : 'Null game: no trumps, card points do not count; in every suit the order is A, K, Q, J, 10, 9, 8, 7. The declarer loses as soon as they take a trick; the defenders try to force one on them. Claim nothing about which card is the highest of its suit.'
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

/** Whether a card would be the highest of its suit (trumps counting as one) still unplayed once `gone`
 *  have been played — the rules engine's word on which card would rule the suit afterwards. */
function highestLeft(card: Card, gone: Card[], contract: Contract): boolean {
  const suit = effectiveSuit(card, contract)
  return !fullDeck().some((c) => !sameCard(c, card) && !gone.some((g) => sameCard(g, c)) && effectiveSuit(c, contract) === suit && strength(c, contract) > strength(card, contract))
}

/** The suit a card rules, in words: "die höchste noch nicht gespielte Kreuz-Karte", "the highest trump left". */
function rulesWords(card: Card, contract: Contract, locale: Locale): string {
  const de = locale === 'de'
  if (effectiveSuit(card, contract) === 'T') return de ? 'der höchste noch nicht gespielte Trumpf' : 'the highest trump not yet played'
  const suit = contractWords({ kind: 'suit', trump: card.suit }, locale)
  return de ? `die höchste noch nicht gespielte ${suit}-Karte` : `the highest ${suit} card not yet played`
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
  // Which card would rule its suit after this trick — the reason a card is worth keeping, which the model
  // would otherwise guess at. Not in Null, where the low cards are what count.
  // Worked out from what was known at that moment, with the AI's card played instead: the tricks before,
  // the cards already in this one, and that card — the played one kept. Cards still to come after the
  // player's would have been answers to another card, so they do not count.
  const goneInstead = [...r.tricks.slice(0, w.trick - 1).flatMap((t) => t.cards.map((p) => p.card)), ...w.table.map((p) => p.card), w.best]
  const ruling: string[] = []
  // When both ways the trick is the player's side's, more card points in it are theirs: say so, or the
  // model reads "fewer points with the AI's card" as the reason.
  const ownSide = (s: Seat) => (declarer === PLAYER ? s === PLAYER : s !== declarer)
  const takerWith = (card: Card) => {
    const plays = [...w.table, { seat: PLAYER as Seat, card }]
    return plays[trickWinnerIndex(plays.map((p) => p.card), contract)].seat
  }
  if (last && contract.kind !== 'null' && ownSide(takerWith(w.played)) && ownSide(takerWith(w.best))) {
    ruling.push(de
      ? 'Beide Male bekommt die Partei des Spielers den Stich: Die Augen darin zählen für sie, mehr Augen sind hier also kein Nachteil – der Unterschied liegt woanders.'
      : "Either way the player's side takes the trick: its points count for them, so more points here are no drawback — the difference lies elsewhere.")
  }
  if (contract.kind !== 'null' && highestLeft(w.played, goneInstead, contract)) {
    ruling.push(de
      ? `Mit ${cardWords(w.best, locale)} hätte der Spieler ${cardWords(w.played, locale)} behalten – zu diesem Zeitpunkt ${rulesWords(w.played, contract, locale)}.`
      : `With ${cardWords(w.best, locale)} the player would have kept ${cardWords(w.played, locale)} — at that moment ${rulesWords(w.played, contract, locale)}.`)
  }
  // Whether this was the one place the player left the AI's line — a fact, not a line drawn on a value.
  const only = r.differs.length === 1
  const agreed = de
    ? `In ${r.agreed} von ${r.choices} Stichen, in denen der Spieler wählen konnte, spielte er dieselbe Karte wie die AI. ${only ? 'Dies war die einzige Stelle, an der er anders spielte.' : `Er spielte in ${r.differs.length} Stichen anders; hier am deutlichsten.`}`
    : `In ${r.agreed} of the ${r.choices} tricks where the player had a choice, they played the same card as the AI. ${only ? 'This was the only place they played differently.' : `They played differently in ${r.differs.length} tricks; here most clearly.`}`
  const facts = de
    ? [
        `Spiel: ${game}, gereizt bis ${r.bid}. ${sides}`,
        trumpWords(contract, locale),
        `${w.trick}. Stich. ${before ? `Vor dem Spieler gespielt: ${before}.` : 'Der Spieler spielt aus.'}`,
        `Hand des Spielers vor dem Zug: ${w.hand.map((c) => cardWords(c, locale)).join(', ')}.`,
        `Gespielt: ${cardWords(w.played, locale)}. Die AI hätte gespielt: ${cardWords(w.best, locale)}.`,
        trick ? `So lief der Stich wirklich: ${trickWords(trick.cards, contract, side, locale)}.` : '',
        instead,
        ...ruling,
        agreed,
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
        ...ruling,
        agreed,
        dealLine(r.mine, 'Result of the game', locale),
      ]
  const system = de
    ? 'Du bist der Skat-Trainer von SkatGo. Antworte auf Deutsch. Erkläre einem Lernenden in zwei bis drei kurzen Sätzen, warum seine Karte schlechter war als die der AI. Stütze dich nur auf die genannten Fakten und nenne keine Karten, Stiche oder Ergebnisse, die dort nicht stehen. Beachte, wer zu wessen Partei gehört: Augen in einem Stich, den die eigene Partei bekommt, sind gut für den Spieler – sage nie, er hätte sie sparen sollen oder verschenkt. Steht in den Fakten, welche Karte nach dem Stich die höchste ihrer Farbe wäre, ist das meist der Grund für die Wahl der AI. Nenne den Unterschied nur dann eine Feinheit, wenn die Fakten sagen, dass es die einzige Abweichung war. Nenne Augenzahlen nur so, wie sie in den Fakten stehen. Wer einen Stich bekommt, steht in den Fakten; wo dort steht, dass es nicht bekannt ist, behaupte es nicht und erwähne es auch nicht, sondern erkläre, was feststeht (etwa wie viele Augen die Karte in den Stich gibt oder ob ein Trumpf verbraucht wird). Duze den Lernenden und nutze die Begriffe einer Skatrunde (Stich, Trumpf, Augen, Alleinspieler, Gegenspieler, schmieren). Kein Markdown, keine Aufzählung, keine Überschrift.'
    : "You are SkatGo's Skat coach. Answer in English only, whatever language the terms are in. In two or three short sentences, explain to a learner why their card was worse than the AI's. Use only the facts given and name no card, trick or result that is not in them. Mind who is on whose side: points in a trick the player's own side takes are good for the player — never say they should have been saved or were given away. Where the facts say which card would be the highest of its suit after the trick, that is usually the AI's reason. Call the difference a fine point only where the facts say it was the only place the player played differently. Give point counts only as the facts state them. Who takes a trick is in the facts; where they say it is not known, do not claim it and do not mention it — explain what is certain instead (such as how many points the card puts into the trick, or whether a trump is spent). Address the learner as you; keep the German Skat terms Grand, Null, Hand and Ouvert. No Markdown, no lists, no heading."
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
