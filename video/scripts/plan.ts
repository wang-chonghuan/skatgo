// What a day's two videos show and say (SKATGO-202), worked out from the deal of the day as stored: the quiz from
// today's deal, the answer from yesterday's. Run through the multiplayer's tsx, which resolves the app's game code:
//   cd multiplayer && node --import tsx ../video/scripts/plan.ts <today.json> <yesterday.json> <de|en> <out.json>
// English keeps the site's German Skat words (Bube, Dame, Grand, forehand), as the site's English does.
import { readFileSync, writeFileSync } from 'node:fs'
import { type Card, type Contract, sortHand } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, roleOf, type Game, type Role, type Seat } from '../../app/src/lib/skat/game'
import type { Declaration } from '../../app/src/lib/skat/value'
import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { applySeatMove } from '../../multiplayer/src/model'

type Logged = { seat: Seat; move: Parameters<typeof applySeatMove>[2] }
type Spec = { dealer: Seat; deck: Card[]; benchmark: { summary: DealSummary; log: Logged[] } }

type Lang = 'de' | 'en'
const SUIT: Record<Lang, Record<Card['suit'], string>> = {
  de: { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo' },
  en: { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' },
}
const RANK: Record<Lang, Record<Card['rank'], string>> = {
  de: { J: 'Bube', Q: 'Dame', K: 'König', A: 'Ass', '10': 'Zehn', '9': 'Neun', '8': 'Acht', '7': 'Sieben' },
  en: { J: 'Bube', Q: 'Dame', K: 'King', A: 'Ace', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven' },
}
const ROLE: Record<Lang, Record<Role, string>> = {
  de: { forehand: 'Vorhand', middlehand: 'Mittelhand', rearhand: 'Hinterhand' },
  en: { forehand: 'Forehand', middlehand: 'Middlehand', rearhand: 'Rearhand' },
}
const MONTH: Record<Lang, string[]> = {
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}
const COUNT: Record<Lang, string[]> = { de: ['keine', 'ein', 'zwei', 'drei', 'vier'], en: ['no', 'one', 'two', 'three', 'four'] }

let L: Lang = 'de'
const cardName = (c: Card) => (L === 'de' ? `${SUIT.de[c.suit]}-${RANK.de[c.rank]}` : `${RANK.en[c.rank]} of ${SUIT.en[c.suit]}`)
const dateName = (day: string) => {
  const d = Number(day.slice(8, 10))
  const m = MONTH[L][Number(day.slice(5, 7)) - 1]
  return L === 'de' ? `${d}. ${m}` : `${m} ${d}`
}
function contractName(d: Declaration): string {
  const c: Contract = d.contract
  const base = c.kind === 'grand' ? 'Grand' : c.kind === 'null' ? 'Null' : L === 'de' ? `${SUIT.de[c.trump]}-Spiel` : SUIT.en[c.trump]
  return [base, d.hand ? 'Hand' : '', d.ouvert ? 'Ouvert' : ''].filter(Boolean).join(' ')
}
const role = (seat: Seat, dealer: Seat) => ROLE[L][roleOf(seat, dealer)]
/** Who a seat is, said to the viewer: the player's seat is "du" / "you", the others by their place at the table. */
const who = (seat: Seat, dealer: Seat) => (seat === 0 ? (L === 'de' ? 'du' : 'you') : role(seat, dealer))
const capital = (s: string) => s[0].toUpperCase() + s.slice(1)

/** The deal replayed from its stored moves, finished tricks collected as they close. */
function replay(spec: Spec): Game {
  let g = deal(spec.dealer, spec.deck)
  for (const { seat, move } of spec.benchmark.log) {
    if (g.phase === 'trickEnd') g = collectTrick(g)
    g = applySeatMove(g, seat, move)
  }
  return g.phase === 'trickEnd' ? collectTrick(g) : g
}

function handWords(hand: Card[]): string {
  const jacks = hand.filter((c) => c.rank === 'J').length
  const aces = hand.filter((c) => c.rank === 'A').length
  const n = (k: number) => COUNT[L][k] ?? String(k)
  if (L === 'de') return `${capital(n(jacks))} ${jacks === 1 ? 'Bube' : 'Buben'}, ${n(aces)} ${aces === 1 ? 'Ass' : 'Asse'}.`
  return `${capital(n(jacks))} ${jacks === 1 ? 'Bube' : 'Buben'}, ${n(aces)} ${aces === 1 ? 'Ace' : 'Aces'}.`
}

type Segment = { id: string; text: string; scene: string }
type Question = { key: 'pass' | 'bid' | 'game' | 'hand'; text: string }

const QUESTION: Record<Lang, Record<Question['key'], string>> = {
  de: { pass: 'Reizen oder passen?', bid: 'Bis wie viel reizt du?', game: 'Welches Spiel sagst du an?', hand: 'Spielst du Hand – oder nimmst du den Skat?' },
  en: { pass: 'Bid or pass?', bid: 'How high do you bid?', game: 'Which game do you announce?', hand: 'Do you play Hand – or pick up the Skat?' },
}
const ask = (key: Question['key']): Question => ({ key, text: QUESTION[L][key] })

/** The question a quiz asks, chosen by what the AI did in the player's seat, so it is always the deal's real
 *  decision; the answer itself is never said. */
function question(spec: Spec, day: string): Question {
  const s = spec.benchmark.summary
  const bidding = spec.benchmark.log.filter((l) => l.seat === 0 && l.move.type === 'bid')
  const competed = bidding.some((l) => (l.move as { value: string }).value !== 'pass')
  if (s.declarer === 0 && s.declaration) {
    if (s.declaration.hand) return ask('hand')
    if (s.declaration.contract.kind !== 'suit') return ask('game')
    return ask(Number(day.slice(8, 10)) % 2 ? 'bid' : 'game')
  }
  return ask(competed ? 'bid' : 'pass')
}

function quiz(spec: Spec, day: string) {
  const g = deal(spec.dealer, spec.deck)
  const hand = sortHand(g.hands[0], null)
  const q = question(spec, day)
  const place = role(0, spec.dealer)
  const de = L === 'de'
  const segments: Segment[] = [
    { id: 'intro', scene: 'intro', text: de ? `Deal des Tages vom ${dateName(day)}.` : `Deal of the day, ${dateName(day)}.` },
    { id: 'hand', scene: 'hand', text: `${de ? `Du sitzt in ${place}.` : `You sit in ${place}.`} ${handWords(hand)}` },
    { id: 'question', scene: 'question', text: q.text },
    { id: 'cta', scene: 'cta', text: de ? 'Spiel den Deal heute selbst auf skatgo.com. Die Auflösung gibt es morgen.' : 'Play this deal yourself today on skatgo.com. The answer comes tomorrow.' },
  ]
  return { kind: 'quiz', lang: L, day, date: dateName(day), role: place, hand, question: q, segments }
}

function answer(spec: Spec, day: string) {
  const s = spec.benchmark.summary
  const g = replay(spec)
  const start = deal(spec.dealer, spec.deck)
  const decl = s.declaration
  const declarer = s.declarer
  const hand = sortHand(start.hands[0], decl?.contract ?? null)
  const place = role(0, spec.dealer)
  const de = L === 'de'
  const lines: Segment[] = [
    { id: 'intro', scene: 'intro', text: de ? `Die Auflösung: Deal des Tages vom ${dateName(day)}.` : `The answer: deal of the day, ${dateName(day)}.` },
    { id: 'hand', scene: 'hand', text: de ? `Du sitzt in ${place} mit diesem Blatt.` : `You sit in ${place} with this hand.` },
  ]
  let discard: Card[] = []
  if (declarer === 0 && decl) {
    const pickup = !decl.hand
    discard = pickup ? ((spec.benchmark.log.find((l) => l.seat === 0 && l.move.type === 'discard')?.move as { cards?: Card[] })?.cards ?? []) : []
    const skat = `${cardName(start.skat[0])} ${de ? 'und' : 'and'} ${cardName(start.skat[1])}`
    lines.push({ id: 'auction', scene: 'auction', text: de ? `Die KI reizt bis ${s.bid}${pickup ? ` und nimmt den Skat auf: ${skat}` : ' und spielt Hand'}.` : `The AI bids to ${s.bid}${pickup ? ` and picks up the Skat: ${skat}` : ' and plays Hand'}.` })
    if (discard.length) {
      const pair = `${cardName(discard[0])} ${de ? 'und' : 'and'} ${cardName(discard[1])}`
      lines.push({ id: 'discard', scene: 'discard', text: de ? `Sie drückt ${pair} und sagt ${contractName(decl)} an.` : `It discards ${pair} and announces ${contractName(decl)}.` })
    } else lines.push({ id: 'discard', scene: 'auction', text: de ? `Angesagt: ${contractName(decl)}.` : `Announced: ${contractName(decl)}.` })
  } else if (declarer !== null && decl) {
    lines.push({ id: 'auction', scene: 'auction', text: de ? `Die KI passt. ${role(declarer, spec.dealer)} spielt ${contractName(decl)} – du verteidigst.` : `The AI passes. ${role(declarer, spec.dealer)} plays ${contractName(decl)} – you defend.` })
  }
  const tricks = g.tricks.map((t) => ({ winner: t.winner, cards: t.cards }))
  const first = tricks[0]?.cards[0]
  if (first) {
    const lead = capital(who(first.seat, spec.dealer))
    lines.push({ id: 'play', scene: 'play', text: de ? `${lead} ${first.seat === 0 ? 'spielst' : 'spielt'} ${cardName(first.card)} aus – so läuft das Spiel.` : `${lead} ${first.seat === 0 ? 'lead' : 'leads'} the ${cardName(first.card)} – this is how it goes.` })
  }
  const d = s.detail
  if (d && declarer !== null) {
    const mine = declarer === 0
    const them = role(declarer, spec.dealer)
    const result = de
      ? mine
        ? s.won ? `Gewonnen mit ${d.declarerPoints} Augen – ${d.value} Punkte.` : `Verloren mit ${d.declarerPoints} Augen.`
        : s.won ? `${them} gewinnt mit ${d.declarerPoints} Augen.` : `${them} bleibt bei ${d.declarerPoints} Augen – die Verteidigung gewinnt mit ${d.defenderPoints}.`
      : mine
        ? s.won ? `Won with ${d.declarerPoints} card points – ${d.value} points.` : `Lost with ${d.declarerPoints} card points.`
        : s.won ? `${them} wins with ${d.declarerPoints} card points.` : `${them} stops at ${d.declarerPoints} card points – the defence wins with ${d.defenderPoints}.`
    lines.push({ id: 'result', scene: 'result', text: result })
  }
  lines.push({ id: 'cta', scene: 'cta', text: de ? 'Heute wartet ein neuer Deal – auf skatgo.com.' : 'A new deal is waiting today – on skatgo.com.' })
  return {
    kind: 'answer',
    lang: L,
    day,
    date: dateName(day),
    role: place,
    hand,
    skat: start.skat,
    discard,
    declarer: declarer === null ? null : who(declarer, spec.dealer),
    mine: declarer === 0,
    contract: decl ? contractName(decl) : null,
    bid: s.bid,
    won: s.won,
    points: d ? { declarer: d.declarerPoints, defenders: d.defenderPoints, value: d.value } : null,
    tricks: tricks.map((t) => ({ winner: t.winner, cards: t.cards.map((p) => ({ who: who(p.seat, spec.dealer), seat: p.seat, card: p.card })) })),
    segments: lines,
  }
}

// One video a day (the human: 「合成一个比较好吧……你应该先播放昨天的打法。然后留一个问题」): yesterday's deal played
// out first, then today's deal left as the question.
const [todayFile, yesterdayFile, lang, out] = process.argv.slice(2)
L = lang === 'en' ? 'en' : 'de'
const read = (f: string) => JSON.parse(readFileSync(f, 'utf8')) as { day: string; spec: Spec }
const today = read(todayFile)
const yesterday = read(yesterdayFile)
const q = quiz(today.spec, today.day)
const a = answer(yesterday.spec, yesterday.day)
const de = L === 'de'
const segments = [
  { id: 'answer-intro', part: 'answer', scene: 'intro', text: de ? `Deal des Tages: Erst die Auflösung vom ${a.date}.` : `Deal of the day: first, the answer for ${a.date}.` },
  ...a.segments.filter((x) => x.scene !== 'intro' && x.scene !== 'cta').map((x) => ({ ...x, id: `answer-${x.id}`, part: 'answer' })),
  { id: 'quiz-turn', part: 'quiz', scene: 'turn', text: de ? `Und jetzt du: der Deal vom ${q.date}.` : `Now it is your turn: the deal for ${q.date}.` },
  ...q.segments.filter((x) => x.scene !== 'intro').map((x) => ({ ...x, id: `quiz-${x.id}`, part: 'quiz' })),
]
writeFileSync(out, JSON.stringify({ lang: L, day: today.day, today: q, yesterday: a, segments }, null, 2))
