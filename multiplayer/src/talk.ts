import { type Card, pointsOf } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, type Game, type Seat } from '../../app/src/lib/skat/game'
import { auctionOf, PLAYER } from '../../app/src/lib/skat/tournament'
import type { Logged } from './computers'
import { askModel, modelReady } from './llm'
import { applySeatMove } from './model'

// Lina and Noah talk at free play's table (SKATGO-142, the human: 「就像真人打牌时，根据打的好坏或叫的好坏，碎碎念的一些话，
// 一局里3次，尽量放到牌局里，不要牌局打完了说」, then 「对手赢牌，或者输牌时，说一句即可，叫赢了也可以说，总共不超过3次」). Three lines a
// deal, all while it is played: the bidding just won, when it is worth a word, and tricks Lina or Noah took or lost, spread
// over the play in windows — in each, the first trick worth a word, or its last trick if none was. Which moment it is comes
// from the deal's own record, never from the browser, and a moment missed while a question was out is still found later
// in its window. How good the human's own bid or card was is SkatZero's judgement; the model only says it as table talk.
// What the model is told is public — bids, the contract, the cards already played, the card points taken — never a card
// still in a hand or in the skat: about the computers' bids and cards it hears only what everyone saw.

/** The bidding just won, the first, second or third window of the play, or the play ended early. */
export type TalkKind = 'bid' | 'w1' | 'w2' | 'w3' | 'end'
export const TALK_KINDS: TalkKind[] = ['bid', 'w1', 'w2', 'w3', 'end']
/** The tricks of each window, first and last: after a bidding line two windows, without one three. */
const WINDOWS_AFTER_BID: [number, number][] = [[2, 4], [5, 9]]
const WINDOWS: [number, number][] = [[1, 2], [3, 5], [6, 9]]

/** How the human's card in a trick stood in SkatZero's values: a slip (well below the best), or the strong one. */
export type Verdict = 'slip' | 'strong'
/** A card counts as a slip when SkatZero values the best one this much higher; as strong when it was the best and the
 *  next is this much lower. Measured on SkatZero's own play of 25 pool deals: the best and the second card differ by
 *  0.8 at the median and 6.4 at the 90th percentile, the best and the worst by 33 at the 90th. */
export const SLIP = 15
export const STRONG = 10
/** A bid this high is worth a word whoever made it. */
const BID_WORTH_A_WORD = 30
/** A trick with this many card points is worth a word. */
const BIG_TRICK = 15

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
  let ended: (Step & { kind: 'claim' | 'concede' }) | null = null
  const tricks: TrickStep[] = []
  let mine: TrickStep['mine'] = null
  log.forEach(({ seat, move }, i) => {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    if (seat === PLAYER && move.type === 'play') mine = { before: g, card: move.card }
    const was = g.phase
    g = applySeatMove(g, seat, move)
    if (was === 'bidding' && g.phase !== 'bidding' && g.phase !== 'passedIn') bidEnd = { at: i + 1, g }
    if (g.early && !ended) ended = { at: i + 1, g, kind: g.early.kind }
    if (g.phase === 'trickEnd' && !g.early) {
      const done = collectTrick(g)
      tricks.push({ at: i + 1, g: done, number: done.tricks.length, mine })
      mine = null
    }
  })
  return { bidEnd: bidEnd as Step | null, tricks, ended: ended as (Step & { kind: 'claim' | 'concede' }) | null }
}

/** How high SkatZero would bid the human's hand: at most `atMost` (null when not known), at least `atLeast`. Free play
 *  knows it exactly from the pool; the tournament from the AI's own game of the deal from the human's seat. */
export type BidLimit = { atMost: number | null; atLeast: number }

/** The human's bid against SkatZero's for their hand: bidding beyond it is bold, passing below it cautious; a sound
 *  bid is nothing to talk about. */
function bidVerdict(g: Game, limit: BidLimit): string | null {
  const log = g.bidding.log
  if (g.declarer === PLAYER) {
    return limit.atMost !== null && g.bid > limit.atMost
      ? `You bid ${g.bid}, more than SkatZero would bid with your hand (it would stop at ${limit.atMost}): a bold bid.`
      : null
  }
  const pass = log.findIndex((e) => e.seat === PLAYER && e.say === 'pass')
  if (pass < 0) return null
  const onTable = Math.max(0, ...log.slice(0, pass).map((e) => e.value))
  return limit.atLeast > onTable
    ? `You passed at ${onTable || 'the start'}, though SkatZero would have bid at least ${limit.atLeast} with your hand: a cautious pass.`
    : null
}

/** Who speaks about the bidding: the computer that won it, or, when the human did, the one who bid highest against them. */
function bidSpeaker(g: Game): 1 | 2 {
  if (g.declarer === 1 || g.declarer === 2) return g.declarer
  const a = auctionOf(g)
  return a[2].value > a[1].value ? 2 : 1
}

/** What the model is told about the bidding just won: public bids, and the human's own bid judged by SkatZero. */
function bidFacts(g: Game, limit: BidLimit) {
  const auction = auctionOf(g)
  const said = (s: Seat) => (auction[s].value ? `${auction[s].value}${auction[s].passed ? ', then passed' : ''}` : auction[s].passed ? 'passed without bidding' : 'no bid')
  return {
    moment: 'The bidding is over. The declarer has not chosen the game yet: do not name or guess any game.',
    speaker: NAME[bidSpeaker(g)],
    declarer: NAME[g.declarer!],
    bid: g.bid,
    bids: { You: said(0), Lina: said(1), Noah: said(2) },
    aboutYou: bidVerdict(g, limit),
  }
}

/** Who speaks about a trick: Lina or Noah when one of them took it; when the human did, the one who lost more to it. */
function trickSpeaker(t: TrickStep): 1 | 2 {
  const last = t.g.tricks[t.g.tricks.length - 1]
  if (last.winner === 1 || last.winner === 2) return last.winner
  const lost = (s: Seat) => pointsOf(last.cards.filter((p) => p.seat === s).map((p) => p.card))
  return lost(2) > lost(1) ? 2 : 1
}

/** What the model is told about a finished trick: its cards in order, who took it and how much, the card points so far,
 *  whether it decided the game, and the human's own card judged by SkatZero. */
function trickFacts(t: TrickStep, verdict: Verdict | null, decided: 'declarer' | 'defenders' | null) {
  const last = t.g.tricks[t.g.tricks.length - 1]
  const speaker = trickSpeaker(t)
  return {
    moment: `Trick ${t.number} of 10 has just been taken.`,
    speaker: NAME[speaker],
    speakerTookIt: last.winner === speaker,
    contract: contractName(t.g),
    declarer: NAME[t.g.declarer!],
    trick: last.cards.map((p) => ({ by: NAME[p.seat], card: cardName(p.card) })),
    takenBy: NAME[last.winner],
    trickPoints: pointsOf(last.cards.map((p) => p.card)),
    cardPointsSoFar: taken(t.g),
    decided: decided ? `This trick decided the game: ${decided === 'declarer' ? `the declarer, ${NAME[t.g.declarer!]}, has won` : 'the defenders have won'}; ${10 - t.number} tricks are still to be played.` : null,
    aboutYou: verdict === 'slip'
      ? 'Your card in this trick was a slip by SkatZero’s measure: a clearly better card was in your hand.'
      : verdict === 'strong' ? 'Your card in this trick was the strong one by SkatZero’s measure, well above any other choice.' : null,
  }
}

/** What the model is told when the deal is decided before its last card: the declarer laid the rest open, or the
 *  defenders gave up a Null. The table still shows it; the result comes after. */
function endFacts(e: Step & { kind: 'claim' | 'concede' }, speaker: 1 | 2) {
  return {
    moment: e.kind === 'claim'
      ? `The declarer, ${NAME[e.g.declarer!]}, has laid the rest of the cards open: all remaining tricks are theirs and the deal ends here.`
      : `The defenders have given up the Null of ${NAME[e.g.declarer!]}: the deal ends here.`,
    speaker: NAME[speaker],
    contract: contractName(e.g),
    declarer: NAME[e.g.declarer!],
  }
}

export type Moment = { kind: TalkKind; speaker: 1 | 2; facts: Record<string, unknown> }

/** Whether the bidding is worth a word: the human won it, bid bold or passed cautious by SkatZero's measure, or the bid
 *  reached 30 (「根据……叫的好坏」); an 18 a computer took after everyone passed is not. */
const bidWorthAWord = (g: Game, limit: BidLimit) => g.declarer === PLAYER || bidVerdict(g, limit) !== null || g.bid >= BID_WORTH_A_WORD

/**
 * The line to say now, or null. The bidding's, while no trick of the play has been finished but the first, if it is
 * worth a word; then each window of the play in turn: the latest of its tricks, finished no more than a trick ago, that
 * is worth a word — 15 card points, the game decided by it, the human's card a slip or the strong one — or is the
 * window's last. A moment missed is found again while its window lasts; the tenth trick and the end are never talked
 * about. Kinds already said in this deal are not said again. `limit` is how high SkatZero would bid the human's hand;
 * `judge` is SkatZero's values for the human's legal cards just before their card.
 */
export async function momentOf(
  dealer: Seat, deck: Card[], log: Logged[], said: TalkKind[], limit: BidLimit,
  judge: (before: Game, card: Card) => Promise<Verdict | null>,
): Promise<Moment | null> {
  if (said.length >= 3) return null
  const { bidEnd, tricks, ended } = walk(dealer, deck, log)
  if (!bidEnd || bidEnd.g.declarer === null) return null
  const withBid = bidWorthAWord(bidEnd.g, limit)
  if (withBid && !said.includes('bid') && tricks.length <= 1) {
    return { kind: 'bid', speaker: bidSpeaker(bidEnd.g), facts: bidFacts(bidEnd.g, limit) }
  }
  const latest = tricks.length
  const windows = withBid ? WINDOWS_AFTER_BID : WINDOWS
  // A deal decided before its last card ends the play there: one line on it, in place of the windows it cut short — the
  // declarer's if Lina or Noah laid it open, else theirs who loses it.
  if (ended) {
    if (said.includes('end') || windows.every((_, n) => said.includes(`w${n + 1}` as TalkKind))) return null
    const declarer = ended.g.declarer!
    const speaker: 1 | 2 = declarer === 1 || declarer === 2 ? (ended.kind === 'claim' ? declarer : (declarer === 1 ? 2 : 1)) : bidSpeaker(ended.g)
    return { kind: 'end', speaker, facts: endFacts(ended, speaker) }
  }
  for (const [n, [from, to]] of windows.entries()) {
    const kind = `w${n + 1}` as TalkKind
    if (said.includes(kind)) continue
    const recent = tricks.filter((t) => t.number >= from && t.number <= to && t.number >= latest - 1).reverse()
    for (const t of recent) {
      const verdict = t.mine ? await judge(t.mine.before, t.mine.card) : null
      const points = pointsOf(t.g.tricks[t.g.tricks.length - 1].cards.map((p) => p.card))
      const before = tricks[t.number - 2]?.g
      const decided = decidedBy(t.g) && !(before && decidedBy(before)) ? decidedBy(t.g) : null
      if (verdict || points >= BIG_TRICK || decided || t.number === to) {
        return { kind, speaker: trickSpeaker(t), facts: trickFacts(t, verdict, decided) }
      }
    }
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
The speaker is the one named in the facts: as the one who took the trick or lost it, won the bidding or bid against it.
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
    const line = typeof answer.line === 'string' ? answer.line.trim() : ''
    // A long line is no muttering: it is dropped rather than shown. The speaker is the moment's, whatever the answer says.
    return line && line.split(/\s+/).length <= MAX_WORDS ? { speaker: moment.speaker, line } : null
  } catch (e) {
    console.error(JSON.stringify({ event: 'talk_failed', reason: (e as Error).message }))
    return null
  }
}
