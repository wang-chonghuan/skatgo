import { type ChatMessage, openModelStream } from '~/lib/ask/azure'
import { LIMITS } from '~/lib/ask/limits'
import { type Card, type Contract, effectiveSuit, fullDeck, pointsOf, sameCard, strength, trickWinnerIndex, trumpSequence } from '~/lib/skat/cards'
import type { Played, Seat } from '~/lib/skat/game'
import { type DealReview, type DealSummary, PLAYER } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

// The words of a deal's review (SKATGO-79): the multiplayer service finds the player's worst card with
// SkatZero; this asks the assistant's model, `gpt-5.6-luna` at high effort (the human: 「还是用high吧」; the
// assistant itself stays at medium), for two or three sentences on why it was worse than SkatZero's card. The model never decides which card was worst, and it
// is not left to work the trick out: the rules engine gives it the few facts that decide a card's worth —
// who holds the trick and who is still to play, the higher cards of the same suit still out, whether the
// kept card would rule its suit, how the trick went — and no more (the human, after trying the whole game at
// high effort: 「不用给太多东西，给的多了它也分析不出来」). To the player SkatZero is "the AI": its name is never
// shown, nor given to the model.

/** A card in words: "Pik-Zehn", "Ten of Spades". */
function cardWords(c: Card, locale: Locale): string {
  const o = { locale }
  const suit = suitWords(c.suit, locale)
  const rank = { A: m.rank_name_ace, K: m.rank_name_king, Q: m.rank_name_queen, J: m.rank_name_jack }[c.rank as 'A' | 'K' | 'Q' | 'J']?.({}, o) ?? c.rank
  return m.card_spoken({ suit, rank }, o)
}

const cardsWords = (cards: Card[], locale: Locale) => cards.map((c) => cardWords(c, locale)).join(', ')

const suitWords = (s: Card['suit'], locale: Locale) => ({ C: m.suit_clubs, S: m.suit_spades, H: m.suit_hearts, D: m.suit_diamonds })[s]({}, { locale })

function contractWords(c: Contract, locale: Locale): string {
  if (c.kind === 'grand') return 'Grand'
  if (c.kind === 'null') return 'Null'
  return suitWords(c.trump, locale)
}

const seatName = (s: Seat, locale: Locale) => [m.name_you, m.name_lina, m.name_max][s]({}, { locale })

/** A suit's cards in this game from highest to lowest; trumps count as one suit ('T'). */
function order(suit: Card['suit'] | 'T', contract: Contract): Card[] {
  if (suit === 'T') return trumpSequence(contract)
  return fullDeck()
    .filter((c) => effectiveSuit(c, contract) === suit)
    .sort((a, b) => strength(b, contract) - strength(a, contract))
}

/** The facts the model explains, and how it is to answer. Null when there is no worst card. */
export function reviewPrompt(r: DealReview, locale: Locale): { system: string; messages: ChatMessage[] } | null {
  const w = r.worst
  if (!w || !r.mine.declaration || r.mine.declarer === null) return null
  const say = (german: string, english: string) => (locale === 'de' ? german : english)
  const declarer = r.mine.declarer
  const contract = r.mine.declaration.contract
  const isNull = contract.kind === 'null'
  const partner = ([1, 2] as Seat[]).find((s) => s !== declarer)!
  const own = (s: Seat) => (declarer === PLAYER ? s === PLAYER : s !== declarer)
  const name = (s: Seat) => seatName(s, locale)
  const side = (s: Seat) =>
    s === declarer ? say('Alleinspieler', 'declarer') : declarer === PLAYER ? say('Gegenspieler', 'defender') : say('Partei des Spielers', "the player's side")
  const suitName = (suit: Card['suit'] | 'T') => (suit === 'T' ? say('Trumpf', 'trumps') : suitWords(suit, locale))
  const cardsIn = (cards: Played[]) => cards.map((p) => p.card)

  // The game.
  const game = `${contractWords(contract, locale)}${r.mine.declaration.hand ? ' Hand' : ''}${r.mine.declaration.ouvert ? ' Ouvert' : ''}`
  const sides = declarer === PLAYER
    ? say(`Der Spieler ist Alleinspieler gegen ${name(1)} und ${name(2)}.`, `The player is the declarer against ${name(1)} and ${name(2)}.`)
    : say(
        `Alleinspieler ist ${name(declarer)}. Der Spieler spielt zusammen mit seinem Partner ${name(partner)} gegen ${name(declarer)}.`,
        `${name(declarer)} is the declarer. The player defends together with their partner ${name(partner)} against ${name(declarer)}.`,
      )
  const rules = isNull
    ? say(
        'Nullspiel: kein Trumpf, Augen zählen nicht; in jeder Farbe von hoch nach niedrig: Ass, König, Dame, Bube, 10, 9, 8, 7. Der Alleinspieler verliert, sobald er einen Stich bekommt; die Gegenspieler wollen ihm einen Stich aufzwingen.',
        'Null game: no trumps, card points do not count; in every suit from high to low: Ace, King, Queen, Jack, 10, 9, 8, 7. The declarer loses as soon as they take a trick; the defenders try to force one on them.',
      )
    : contract.kind === 'grand'
      ? say('Trumpf sind nur die vier Buben. Augen: Ass 11, 10 10, König 4, Dame 3, Bube 2.', 'Only the four jacks are trumps. Points: Ace 11, 10 10, King 4, Queen 3, Jack 2.')
      : say(`Trumpf sind die vier Buben und ${contractWords(contract, locale)}. Augen: Ass 11, 10 10, König 4, Dame 3, Bube 2.`, `Trumps are the four jacks and ${contractWords(contract, locale)}. Points: Ace 11, 10 10, King 4, Queen 3, Jack 2.`)

  /** Cards of a trick in the order played, with who could not follow (and trumped or threw off). */
  const playWords = (cards: Played[]) => {
    const lead = effectiveSuit(cards[0].card, contract)
    return cards
      .map((p, i) => {
        const suit = effectiveSuit(p.card, contract)
        const note = i === 0 || suit === lead ? '' : suit === 'T'
          ? say(` (bedient ${suitName(lead)} nicht und sticht)`, ` (cannot follow ${suitName(lead)}, trumps)`)
          : say(` (bedient ${suitName(lead)} nicht und wirft ab)`, ` (cannot follow ${suitName(lead)}, throws off)`)
        return `${name(p.seat)} ${cardWords(p.card, locale)}${note}`
      })
      .join(', ')
  }
  const takerOf = (cards: Played[]) => cards[trickWinnerIndex(cardsIn(cards), contract)].seat
  const taken = (cards: Played[]) => {
    const taker = takerOf(cards)
    const points = isNull ? '' : say(` mit ${pointsOf(cardsIn(cards))} Augen`, ` with ${pointsOf(cardsIn(cards))} points`)
    return say(`${name(taker)} (${side(taker)}) bekommt den Stich${points}`, `${name(taker)} (${side(taker)}) takes the trick${points}`)
  }

  // What the player could know when they chose the card.
  const before = r.tricks.slice(0, w.trick - 1)
  // Where the player knew each card to be: their hand, the cards played, the skat a declarer put away.
  const played = [...before.flatMap((t) => cardsIn(t.cards)), ...cardsIn(w.table)]
  const known = [...w.hand, ...played, ...(declarer === PLAYER && !r.mine.declaration.hand ? r.skat : [])]
  const higherOut = (card: Card) => order(effectiveSuit(card, contract), contract).filter((c) => strength(c, contract) > strength(card, contract) && !known.some((k) => sameCard(k, c)))
  const where = declarer === PLAYER
    ? say(`bei ${name(1)} oder ${name(2)}`, `with ${name(1)} or ${name(2)}`)
    : say(`bei ${name(1)}, ${name(2)} oder im Skat – wo genau, wusste der Spieler nicht`, `with ${name(1)}, ${name(2)} or in the skat — the player did not know where`)
  const outWords = (card: Card) => {
    const out = higherOut(card)
    const suit = effectiveSuit(card, contract)
    // A card no one beats in its own suit can still be trumped by a player who has none of it left.
    const trumpable = !isNull && suit !== 'T'
      ? say(` Wer kein ${suitName(suit)} mehr hat, kann ${cardWords(card, locale)} mit Trumpf stechen.`, ` A player with no ${suitName(suit)} left can trump ${cardWords(card, locale)}.`)
      : ''
    return (out.length
      ? say(`In seiner Farbe höher als ${cardWords(card, locale)} und noch draußen: ${cardsWords(out, locale)} (${where}).`, `Higher than ${cardWords(card, locale)} in its suit and still out: ${cardsWords(out, locale)} (${where}).`)
      : say(`In seiner Farbe schlägt keine Karte mehr ${cardWords(card, locale)}.`, `No card left in its suit beats ${cardWords(card, locale)}.`)) + trumpable
  }
  // With the AI's card the played one would have stayed in the hand: whether it would then rule its suit.
  const keptRules = !isNull && !fullDeck().some(
    (c) => !sameCard(c, w.played) && !sameCard(c, w.best) && !played.some((g) => sameCard(g, c)) && effectiveSuit(c, contract) === effectiveSuit(w.played, contract) && strength(c, contract) > strength(w.played, contract),
  )
  // The last card of a trick decides it: both ways are then known before choosing.
  const last = w.table.length === 2
  const stillToPlay = ([1, 2] as Seat[]).filter((s) => !w.table.some((p) => p.seat === s))
  const lastWords = last
    ? [
        say(`Der Spieler spielt als Letzter. Mit ${cardWords(w.played, locale)}: ${taken([...w.table, { seat: PLAYER, card: w.played }])}.`, `The player plays last. With ${cardWords(w.played, locale)}: ${taken([...w.table, { seat: PLAYER, card: w.played }])}.`),
        say(`Mit ${cardWords(w.best, locale)}: ${taken([...w.table, { seat: PLAYER, card: w.best }])}.`, `With ${cardWords(w.best, locale)}: ${taken([...w.table, { seat: PLAYER, card: w.best }])}.`),
        // Both ways the player's side's: then more points in it are a gain, never the reason against.
        !isNull && own(takerOf([...w.table, { seat: PLAYER, card: w.played }])) && own(takerOf([...w.table, { seat: PLAYER, card: w.best }]))
          ? say('Beide Male bekommt die Partei des Spielers den Stich: Jedes Auge darin zählt für sie, mehr Augen sind hier ein Gewinn – der Grund für die Karte der AI liegt woanders.', "Either way the player's side takes the trick: every point in it counts for them, so more points here are a gain — the reason for the AI's card lies elsewhere.")
          : '',
      ]
    : []
  const knewThen = [
    say(
      `Stich ${w.trick}: ${w.table.length ? `vor dem Spieler gespielt: ${playWords(w.table)}.` : 'Der Spieler spielt aus.'}`,
      `Trick ${w.trick}: ${w.table.length ? `played before the player: ${playWords(w.table)}.` : 'The player leads.'}`,
    ),
    // Who holds the trick so far, and who is still to play after the player.
    w.table.length
      ? say(`Den Stich hält bis jetzt ${name(takerOf(w.table))} (${side(takerOf(w.table))}) mit ${cardWords(w.table[trickWinnerIndex(cardsIn(w.table), contract)].card, locale)}.`, `So far the trick is held by ${name(takerOf(w.table))} (${side(takerOf(w.table))}) with ${cardWords(w.table[trickWinnerIndex(cardsIn(w.table), contract)].card, locale)}.`)
      : '',
    last
      ? say('Nach dem Spieler spielt in diesem Stich niemand mehr.', 'No one plays after the player in this trick.')
      : say(`Nach dem Spieler spielen in diesem Stich noch: ${stillToPlay.map(name).join(' und ')}.`, `Still to play after the player in this trick: ${stillToPlay.map(name).join(' and ')}.`),
    say(`Hand des Spielers: ${cardsWords(w.hand, locale)}.`, `The player's hand: ${cardsWords(w.hand, locale)}.`),
    say(`Gespielt: ${cardWords(w.played, locale)}. Die AI hätte gespielt: ${cardWords(w.best, locale)}.`, `Played: ${cardWords(w.played, locale)}. The AI would have played: ${cardWords(w.best, locale)}.`),
    outWords(w.played),
    outWords(w.best),
    // What each card puts at stake if the other side takes it — the comparison the model does not make.
    isNull
      ? ''
      : say(
          `Wird die Karte von der Gegenseite gestochen, gehen ihre Augen dorthin: ${cardWords(w.played, locale)} hat ${pointsOf([w.played])} Augen, ${cardWords(w.best, locale)} hat ${pointsOf([w.best])} Augen.`,
          `If the other side takes the card, its points go to them: ${cardWords(w.played, locale)} is worth ${pointsOf([w.played])} points, ${cardWords(w.best, locale)} ${pointsOf([w.best])} points.`,
        ),
    keptRules
      ? say(`Mit ${cardWords(w.best, locale)} hätte der Spieler ${cardWords(w.played, locale)} behalten, dann die höchste ${suitName(effectiveSuit(w.played, contract))}-Karte im Spiel.`, `With ${cardWords(w.best, locale)} the player would have kept ${cardWords(w.played, locale)}, then the highest ${suitName(effectiveSuit(w.played, contract))} card in play.`)
      : '',
    ...lastWords,
  ]

  // What only became known afterwards.
  const trick = r.tricks[w.trick - 1]
  const only = r.differs.length === 1
  const after = [
    trick && !last ? say(`So lief Stich ${w.trick} wirklich: ${playWords(trick.cards)} – ${taken(trick.cards)}.`, `How trick ${w.trick} really went: ${playWords(trick.cards)} — ${taken(trick.cards)}.`) : '',
    say(
      `In ${r.agreed} von ${r.choices} Stichen, in denen der Spieler wählen konnte, spielte er dieselbe Karte wie die AI. ${only ? 'Dies war die einzige Stelle, an der er anders spielte.' : `Er spielte in ${r.differs.length} Stichen anders; hier am deutlichsten.`}`,
      `In ${r.agreed} of the ${r.choices} tricks where the player had a choice, they played the same card as the AI. ${only ? 'This was the only place they played differently.' : `They played differently in ${r.differs.length} tricks; here most clearly.`}`,
    ),
    resultWords(r.mine, locale),
  ]

  const facts = [
    say('DAS SPIEL', 'THE GAME'),
    say(`${game}, gereizt bis ${r.bid}. ${sides}`, `${game}, bid to ${r.bid}. ${sides}`),
    rules,
    say('WAS DER SPIELER WISSEN KONNTE, ALS ER DIE KARTE WÄHLTE', 'WHAT THE PLAYER COULD KNOW WHEN CHOOSING THE CARD'),
    ...knewThen,
    say('ERST DANACH BEKANNT', 'ONLY KNOWN AFTERWARDS'),
    ...after,
  ]
  const system = say(
    'Du bist der Skat-Trainer von SkatGo. Antworte auf Deutsch, in zwei bis drei kurzen Sätzen, ohne Markdown und ohne Aufzählung. Erkläre aus Sicht des Spielers im Moment seiner Entscheidung, warum die Karte der AI besser war als seine. Was erst danach bekannt wurde, ist nicht der Grund; nenne es höchstens, um zu sagen, dass es diesmal gut oder schlecht ausging. Typische Gründe: Ist eine Karte, die die eigene schlägt, noch draußen, kann sie überstochen werden; Augen in einen Stich der eigenen Partei zu schmieren ist gut, in einen Stich der Gegenseite schlecht; eine hohe Karte oder einen Trumpf für später behalten. Stütze dich nur auf die Fakten: nenne keine Karte, die dort nicht steht, und vergleiche Karten nur so, wie die Fakten es sagen. Nenne den Unterschied nur dann eine Feinheit, wenn die Fakten sagen, dass es die einzige Abweichung war. Duze den Spieler und nutze die Begriffe einer Skatrunde.',
    "You are SkatGo's Skat coach. Answer in English only, whatever language the terms are in, in two or three short sentences, with no Markdown and no lists. Explain from the player's point of view at the moment of the decision why the AI's card was better than theirs. What only became known afterwards is not the reason; mention it at most to say it went well or badly this time. Usual reasons: if a card that beats the player's is still out, it can be taken; points thrown into a trick of the player's own side are good, into the other side's bad; keeping a high card or a trump for later. Use only the facts: name no card that is not in them, and compare cards only as the facts do. Call the difference a fine point only where the facts say it was the only place the player played differently. Address the player as you; keep the German Skat terms Grand, Null, Hand and Ouvert.",
  )
  return { system, messages: [{ role: 'user', content: facts.filter(Boolean).join('\n') }] }
}

/** How the game ended for the player's deal. */
function resultWords(d: DealSummary, locale: Locale): string {
  const de = locale === 'de'
  if (d.declarer === null || !d.declaration) return de ? 'Alle haben gepasst.' : 'Everyone passed.'
  const x = d.detail
  const points = x && d.declaration.contract.kind !== 'null' ? ` ${x.declarerPoints}:${x.defenderPoints}` : ''
  const declarer = seatName(d.declarer, locale)
  return de
    ? `Ergebnis: ${declarer} hat das Spiel ${d.won ? 'gewonnen' : 'verloren'}${points}; der Spieler schreibt ${d.scores[PLAYER]}.`
    : `Result: ${declarer} ${d.won ? 'won' : 'lost'} the game${points}; the player scores ${d.scores[PLAYER]}.`
}

/** The model's few sentences, or null when it cannot answer now (the card itself is still shown). */
export async function explainReview(r: DealReview, locale: Locale): Promise<string | null> {
  const prompt = reviewPrompt(r, locale)
  if (!prompt) return null
  const signal = AbortSignal.timeout(LIMITS.reviewTimeoutMs)
  const stream = await openModelStream(prompt.system, prompt.messages, signal, LIMITS.reviewTokens, 'high')
  if (!stream.ok) return null
  let text = ''
  try {
    for await (const piece of stream.deltas) text += piece
  } catch {
    return null
  }
  return text.trim() || null
}
