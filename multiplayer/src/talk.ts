import { type Card, pointsOf } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, type Game, type Seat } from '../../app/src/lib/skat/game'
import { auctionOf, PLAYER } from '../../app/src/lib/skat/tournament'
import type { Logged } from './computers'
import { askModel, modelReady } from './llm'
import { applySeatMove } from './model'

// Lina and Noah talk at free play's table (SKATGO-142, the human: 「就像真人打牌时，根据打的好坏或叫的好坏，碎碎念的一些话，
// 一局里3次，尽量放到牌局里，不要牌局打完了说」). Up to three moments of a deal, all while it is played: the bidding just
// over, a trick worth a word, the game just decided. Which moment it is comes from the deal's own record, never from the
// browser. How good the human's own bid or card was is SkatZero's judgement; the model only says it as table talk. What
// the model is told is public — bids, the contract, the cards already played, the card points taken — never a card
// still in a hand or in the skat: about the computers' bids and cards it hears only what everyone saw.

export type TalkKind = 'bid' | 'play' | 'decided'
export const TALK_KINDS: TalkKind[] = ['bid', 'play', 'decided']

/** How the human's card in a trick stood in SkatZero's values: a slip (well below the best), or the strong one. */
export type Verdict = 'slip' | 'strong'
/** A card counts as a slip when SkatZero values the best one this much higher; as strong when it was the best and the
 *  next is this much lower. Measured on SkatZero's own play of 25 pool deals: the best and the second card differ by
 *  0.8 at the median and 6.4 at the 90th percentile, the best and the worst by 33 at the 90th. */
export const SLIP = 15
export const STRONG = 10
/** A bid this high is worth a word whoever made it. */
const BID_WORTH_A_WORD = 30
/** Only the first seven tricks are talked about as a trick; later ones belong to the game being decided. */
const TALKED_TRICKS = 7

const NAME: Record<Seat, string> = { 0: 'You', 1: 'Lina', 2: 'Noah' }
const SUIT: Record<Card['suit'], string> = { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' }
const RANK: Record<Card['rank'], string> = { A: 'Ace', '10': 'Ten', K: 'King', Q: 'Queen', J: 'Jack', '9': 'Nine', '8': 'Eight', '7': 'Seven' }
const cardName = (c: Card) => `${SUIT[c.suit]} ${RANK[c.rank]}`

function contractName(g: Game): string | null {
  const d = g.declaration
  if (!d) return null
  const kind = d.contract.kind === 'suit' ? SUIT[d.contract.trump] : d.contract.kind === 'grand' ? 'Grand' : 'Null'
  return [kind, d.hand ? 'Hand' : '', d.ouvert ? 'Ouvert' : ''].filter(Boolean).join(' ')
}

/** Card points taken in the finished tricks, by the declarer's side and the defenders'; the skat is not counted, as
 *  nobody at the table sees it until the end. */
function taken(g: Game): { declarer: number; defenders: number } {
  const of = (mine: boolean) => pointsOf(g.tricks.filter((t) => (t.winner === g.declarer) === mine).flatMap((t) => t.cards.map((p) => p.card)))
  return { declarer: of(true), defenders: of(false) }
}

/** Whether the finished tricks alone decide the game: the declarer has 61 card points, the defenders 60, or a Null's
 *  declarer took a trick. Who has won, or null while it is open. */
function decidedBy(g: Game): 'declarer' | 'defenders' | null {
  if (!g.declaration || g.declarer === null) return null
  if (g.declaration.contract.kind === 'null') return g.tricks.some((t) => t.winner === g.declarer) ? 'defenders' : null
  const t = taken(g)
  return t.declarer >= 61 ? 'declarer' : t.defenders >= 60 ? 'defenders' : null
}

type Step = { at: number; g: Game }
type TrickStep = Step & { number: number; mine: { before: Game; card: Card } | null }

/** The deal replayed from its record: where the bidding ended, and each finished trick — the game with it collected,
 *  its number, and the human's card in it with the game just before they played it. `at` counts the record's moves. */
function walk(dealer: Seat, deck: Card[], log: Logged[]) {
  let g = deal(dealer, deck)
  let bidEnd: Step | null = null
  const tricks: TrickStep[] = []
  let mine: TrickStep['mine'] = null
  log.forEach(({ seat, move }, i) => {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    if (seat === PLAYER && move.type === 'play') mine = { before: g, card: move.card }
    const was = g.phase
    g = applySeatMove(g, seat, move)
    if (was === 'bidding' && g.phase !== 'bidding' && g.phase !== 'passedIn') bidEnd = { at: i + 1, g }
    if (g.phase === 'trickEnd' && !g.early) {
      const done = collectTrick(g)
      tricks.push({ at: i + 1, g: done, number: done.tricks.length, mine })
      mine = null
    }
  })
  return { bidEnd: bidEnd as Step | null, tricks }
}

/** The human's bid against SkatZero's limit for their hand: bidding beyond it is bold, passing below it cautious; a
 *  sound bid is nothing to talk about. */
function bidVerdict(g: Game, limit: number): string | null {
  const log = g.bidding.log
  if (g.declarer === PLAYER) {
    return g.bid > limit ? `You bid ${g.bid}, more than SkatZero would bid with your hand (it would stop at ${limit}): a bold bid.` : null
  }
  const pass = log.findIndex((e) => e.seat === PLAYER && e.say === 'pass')
  if (pass < 0) return null
  const onTable = Math.max(0, ...log.slice(0, pass).map((e) => e.value))
  return limit > onTable
    ? `You passed at ${onTable || 'the start'}, though SkatZero would have bid up to ${limit} with your hand: a cautious pass.`
    : null
}

/** What the model is told about the bidding just over: public bids, and the human's own bid judged by SkatZero. */
function bidFacts(g: Game, limit: number) {
  const auction = auctionOf(g)
  const said = (s: Seat) => (auction[s].value ? `${auction[s].value}${auction[s].passed ? ', then passed' : ''}` : auction[s].passed ? 'passed without bidding' : 'no bid')
  return {
    moment: 'The bidding is over. The declarer has not chosen the game yet: do not name or guess any game.',
    declarer: NAME[g.declarer!],
    bid: g.bid,
    bids: { You: said(0), Lina: said(1), Noah: said(2) },
    aboutYou: bidVerdict(g, limit),
  }
}

/** What the model is told about a finished trick: its cards in order, who took it and how much, the card points so
 *  far, and the human's own card judged by SkatZero. */
function trickFacts(t: TrickStep, verdict: Verdict | null) {
  const last = t.g.tricks[t.g.tricks.length - 1]
  return {
    moment: `Trick ${t.number} of 10 has just been taken.`,
    contract: contractName(t.g),
    declarer: NAME[t.g.declarer!],
    trick: last.cards.map((p) => ({ by: NAME[p.seat], card: cardName(p.card) })),
    takenBy: NAME[last.winner],
    trickPoints: pointsOf(last.cards.map((p) => p.card)),
    cardPointsSoFar: taken(t.g),
    aboutYou: verdict === 'slip'
      ? 'Your card in this trick was a slip by SkatZero’s measure: a clearly better card was in your hand.'
      : verdict === 'strong' ? 'Your card in this trick was the strong one by SkatZero’s measure, well above any other choice.' : null,
  }
}

/** What the model is told when the game has just been decided with tricks still to play. */
function decidedFacts(t: TrickStep, who: 'declarer' | 'defenders') {
  return {
    moment: `After trick ${t.number} of 10 the game is decided; ${10 - t.number} tricks are still to be played.`,
    contract: contractName(t.g),
    declarer: NAME[t.g.declarer!],
    defenders: ([0, 1, 2] as Seat[]).filter((s) => s !== t.g.declarer).map((s) => NAME[s]),
    winner: who === 'declarer' ? `the declarer, ${NAME[t.g.declarer!]}` : 'the defenders',
    cardPointsSoFar: taken(t.g),
  }
}

export type Moment = { kind: TalkKind; facts: Record<string, unknown> }

/**
 * The moment to talk about among the moves after `since`, or null: the game just decided before its last trick, else a
 * trick of the first seven worth a word (the human's card a slip or the strong one, or 20 card points or more), else
 * the bidding just over. Kinds already said in this deal are not said again. `limit` is SkatZero's highest bid for the
 * human's hand; `judge` is SkatZero's values for the human's legal cards just before their card.
 */
export async function momentOf(
  dealer: Seat, deck: Card[], log: Logged[], since: number, said: TalkKind[], limit: number,
  judge: (before: Game, card: Card) => Promise<Verdict | null>,
): Promise<Moment | null> {
  const { bidEnd, tricks } = walk(dealer, deck, log)
  const fresh = tricks.filter((t) => t.at > since)
  if (!said.includes('decided')) {
    // The trick that decided it, if it is among the new moves and tricks are left to play.
    const first = tricks.find((t) => decidedBy(t.g))
    const who = first && decidedBy(first.g)
    if (first && who && first.at > since && first.number < 10) return { kind: 'decided', facts: decidedFacts(first, who) }
  }
  if (!said.includes('play')) {
    for (const t of [...fresh].reverse().filter((t) => t.number <= TALKED_TRICKS)) {
      const verdict = t.mine ? await judge(t.mine.before, t.mine.card) : null
      const points = pointsOf(t.g.tricks[t.g.tricks.length - 1].cards.map((p) => p.card))
      if (verdict || points >= 20) return { kind: 'play', facts: trickFacts(t, verdict) }
    }
  }
  // The bidding is talked about only when there is something to say: the player's bid bold or their pass cautious by
  // SkatZero's measure, or a bid of 30 or more (「根据……叫的好坏」); an 18 everyone passed is not a moment.
  if (!said.includes('bid') && bidEnd && bidEnd.at > since && bidEnd.g.declarer !== null) {
    const facts = bidFacts(bidEnd.g, limit)
    if (facts.aboutYou || bidEnd.g.bid >= BID_WORTH_A_WORD) return { kind: 'bid', facts }
  }
  return null
}

/** SkatZero's verdict on a card from its values for every legal card: a slip, the strong one, or nothing to say. */
export function verdictOf(values: { card: Card; value: number }[], card: Card): Verdict | null {
  if (values.length < 2) return null
  const sorted = [...values].sort((a, b) => b.value - a.value)
  const played = values.find((v) => v.card.suit === card.suit && v.card.rank === card.rank)
  if (!played) return null
  if (sorted[0].value - played.value >= SLIP) return 'slip'
  const isBest = sorted[0].card.suit === card.suit && sorted[0].card.rank === card.rank
  return isBest && sorted[0].value - sorted[1].value >= STRONG ? 'strong' : null
}

const LANGUAGE = { en: 'English', de: 'German' } as const
export type TalkLang = keyof typeof LANGUAGE

const prompt = (lang: TalkLang) => `You write one line of table talk at an online Skat table.
Two computer players talk: Lina — quick, competitive, dry humour; Noah — warm, a little superstitious, laughs at himself.
The third player is the human, called "You" in the facts: never write "You" as a name; speak to them as "you" in English and "du" in German.
Write what one of them mutters at the table about the moment given: short and spoken, at most 9 words, in ${LANGUAGE[lang]}, playful. No semicolons, no dashes, no long sentences.
Name a game (contract) only if the facts give one.
Use only the facts given. Never mention or guess a card that has not been played, nor the skat.
Never say what to play or what to bid. Lina and Noah may tease each other; never mock the human — a slip of theirs gets a light, kind remark, a strong card or a bold bid a nod.
Say at most one number. Keep the Skat words Grand, Null, Hand, Schneider, Ouvert as they are; name cards the way ${LANGUAGE[lang]} Skat players do.
The speaker is whoever the moment concerns most: the one who took the trick, the declarer, a defender, or the one who passed.
Answer as JSON: {"speaker": "Lina" or "Noah", "line": "..."}`

/** How many lines the service writes a day, against a free table being run through on purpose (about a dollar). */
export const TALK_DAILY_MAX = 3000
/** The most words a line may have; the model is asked for nine. */
const MAX_WORDS = 12
const written = { day: '', count: 0 }

/** The line for a moment, or null when the model is not given, the day's lines are used up, or the answer is not one
 *  short line by Lina or Noah. The model gets `timeoutMs`; a late line would be about a moment long gone. */
export async function lineFor(moment: Moment, lang: TalkLang, timeoutMs = 6000, now = Date.now()): Promise<{ speaker: 1 | 2; line: string } | null> {
  if (!modelReady()) return null
  const day = new Date(now).toISOString().slice(0, 10)
  if (written.day !== day) Object.assign(written, { day, count: 0 })
  if (written.count >= TALK_DAILY_MAX) return null
  written.count += 1
  try {
    const answer = await askModel(prompt(lang), JSON.stringify(moment.facts), timeoutMs)
    const speaker = answer.speaker === 'Lina' ? 1 : answer.speaker === 'Noah' ? 2 : null
    const line = typeof answer.line === 'string' ? answer.line.trim() : ''
    // A long line is no muttering: it is dropped rather than shown.
    return speaker && line && line.split(/\s+/).length <= MAX_WORDS ? { speaker, line } : null
  } catch (e) {
    console.error(JSON.stringify({ event: 'talk_failed', reason: (e as Error).message }))
    return null
  }
}
