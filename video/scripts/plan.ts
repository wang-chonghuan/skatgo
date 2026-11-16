// What a day's two videos show and say (SKATGO-202), worked out from the deal of the day as stored: the quiz from
// today's deal, the answer from yesterday's. Run through the multiplayer's tsx, which resolves the app's game code:
//   cd multiplayer && node --import tsx ../video/scripts/plan.ts <spec.json> <quiz|answer> <out.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { type Card, type Contract, sortHand } from '../../app/src/lib/skat/cards'
import { collectTrick, deal, roleOf, type Game, type Role, type Seat } from '../../app/src/lib/skat/game'
import type { Declaration } from '../../app/src/lib/skat/value'
import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { applySeatMove } from '../../multiplayer/src/model'

type Logged = { seat: Seat; move: Parameters<typeof applySeatMove>[2] }
type Spec = { dealer: Seat; deck: Card[]; benchmark: { summary: DealSummary; log: Logged[] } }

const SUIT: Record<Card['suit'], string> = { C: 'Kreuz', S: 'Pik', H: 'Herz', D: 'Karo' }
const RANK: Record<Card['rank'], string> = { J: 'Bube', Q: 'Dame', K: 'König', A: 'Ass', '10': 'Zehn', '9': 'Neun', '8': 'Acht', '7': 'Sieben' }
const ROLE: Record<Role, string> = { forehand: 'Vorhand', middlehand: 'Mittelhand', rearhand: 'Hinterhand' }
const MONTH = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const COUNT = ['keine', 'ein', 'zwei', 'drei', 'vier']

const cardName = (c: Card) => `${SUIT[c.suit]}-${RANK[c.rank]}`
const dateName = (day: string) => `${Number(day.slice(8, 10))}. ${MONTH[Number(day.slice(5, 7)) - 1]}`
function contractName(d: Declaration): string {
  const c: Contract = d.contract
  const base = c.kind === 'grand' ? 'Grand' : c.kind === 'null' ? 'Null' : `${SUIT[c.trump]}-Spiel`
  return [base, d.hand ? 'Hand' : '', d.ouvert ? 'Ouvert' : ''].filter(Boolean).join(' ')
}
/** Who a seat is, said to the viewer: the player's seat is "du", the others by their place at the table. */
const who = (seat: Seat, dealer: Seat) => (seat === 0 ? 'du' : ROLE[roleOf(seat, dealer)])
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
  const parts = [`${capital(COUNT[jacks] ?? String(jacks))} ${jacks === 1 ? 'Bube' : 'Buben'}`, `${COUNT[aces] ?? aces} ${aces === 1 ? 'Ass' : 'Asse'}`]
  return `${parts.join(', ')}.`
}

type Segment = { id: string; text: string; scene: string }
type Question = { key: 'pass' | 'bid' | 'game' | 'hand'; text: string }

/** The question a quiz asks, chosen by what the AI did in the player's seat, so it is always the deal's real
 *  decision; the answer itself is never said. */
function question(spec: Spec, day: string): Question {
  const s = spec.benchmark.summary
  const bidding = spec.benchmark.log.filter((l) => l.seat === 0 && l.move.type === 'bid')
  const competed = bidding.some((l) => (l.move as { value: string }).value !== 'pass')
  if (s.declarer === 0 && s.declaration) {
    if (s.declaration.hand) return { key: 'hand', text: 'Spielst du Hand – oder nimmst du den Skat?' }
    if (s.declaration.contract.kind !== 'suit') return { key: 'game', text: 'Welches Spiel sagst du an?' }
    return Number(day.slice(8, 10)) % 2 ? { key: 'bid', text: 'Bis wie viel reizt du?' } : { key: 'game', text: 'Welches Spiel sagst du an?' }
  }
  if (competed) return { key: 'bid', text: 'Bis wie viel reizt du?' }
  return { key: 'pass', text: 'Reizen oder passen?' }
}

function quiz(spec: Spec, day: string) {
  const g = deal(spec.dealer, spec.deck)
  const hand = sortHand(g.hands[0], null)
  const q = question(spec, day)
  const role = ROLE[roleOf(0, spec.dealer)]
  const segments: Segment[] = [
    { id: 'intro', scene: 'intro', text: `Deal des Tages vom ${dateName(day)}.` },
    { id: 'hand', scene: 'hand', text: `Du sitzt in ${role}. ${handWords(hand)}` },
    { id: 'question', scene: 'question', text: q.text },
    { id: 'cta', scene: 'cta', text: 'Spiel den Deal heute selbst auf skatgo.com. Die Auflösung gibt es morgen.' },
  ]
  return { kind: 'quiz', day, date: dateName(day), role, hand, question: q, segments }
}

function answer(spec: Spec, day: string) {
  const s = spec.benchmark.summary
  const g = replay(spec)
  const start = deal(spec.dealer, spec.deck)
  const decl = s.declaration
  const declarer = s.declarer
  const hand = sortHand(start.hands[0], decl?.contract ?? null)
  const role = ROLE[roleOf(0, spec.dealer)]
  const lines: Segment[] = [
    { id: 'intro', scene: 'intro', text: `Die Auflösung: Deal des Tages vom ${dateName(day)}.` },
    { id: 'hand', scene: 'hand', text: `Du sitzt in ${role} mit diesem Blatt.` },
  ]
  let discard: Card[] = []
  if (declarer === 0 && decl) {
    const pickup = !decl.hand
    discard = pickup ? ((spec.benchmark.log.find((l) => l.seat === 0 && l.move.type === 'discard')?.move as { cards?: Card[] })?.cards ?? []) : []
    lines.push({ id: 'auction', scene: 'auction', text: `Die KI reizt bis ${s.bid}${pickup ? ` und nimmt den Skat auf: ${cardName(start.skat[0])} und ${cardName(start.skat[1])}` : ' und spielt Hand'}.` })
    if (discard.length) lines.push({ id: 'discard', scene: 'discard', text: `Sie drückt ${cardName(discard[0])} und ${cardName(discard[1])} und sagt ${contractName(decl)} an.` })
    else lines.push({ id: 'discard', scene: 'auction', text: `Angesagt: ${contractName(decl)}.` })
  } else if (declarer !== null && decl) {
    lines.push({ id: 'auction', scene: 'auction', text: `Die KI passt. ${ROLE[roleOf(declarer, spec.dealer)]} spielt ${contractName(decl)} – du verteidigst.` })
  }
  const tricks = g.tricks.map((t) => ({ winner: t.winner, cards: t.cards }))
  const first = tricks[0]?.cards[0]
  if (first) lines.push({ id: 'play', scene: 'play', text: `${capital(who(first.seat, spec.dealer))} ${first.seat === 0 ? 'spielst' : 'spielt'} ${cardName(first.card)} aus – so läuft das Spiel.` })
  const d = s.detail
  if (d && declarer !== null) {
    const mine = declarer === 0
    const result = mine
      ? s.won ? `Gewonnen mit ${d.declarerPoints} Augen – ${d.value} Punkte.` : `Verloren mit ${d.declarerPoints} Augen.`
      : s.won ? `${ROLE[roleOf(declarer, spec.dealer)]} gewinnt mit ${d.declarerPoints} Augen.` : `${ROLE[roleOf(declarer, spec.dealer)]} bleibt bei ${d.declarerPoints} Augen – die Verteidigung gewinnt mit ${d.defenderPoints}.`
    lines.push({ id: 'result', scene: 'result', text: result })
  }
  lines.push({ id: 'cta', scene: 'cta', text: 'Heute wartet ein neuer Deal – auf skatgo.com.' })
  return {
    kind: 'answer',
    day,
    date: dateName(day),
    role,
    hand,
    skat: start.skat,
    discard,
    declarer: declarer === null ? null : who(declarer, spec.dealer),
    contract: decl ? contractName(decl) : null,
    bid: s.bid,
    won: s.won,
    points: d ? { declarer: d.declarerPoints, defenders: d.defenderPoints, value: d.value } : null,
    tricks: tricks.map((t) => ({ winner: t.winner, cards: t.cards.map((p) => ({ who: who(p.seat, spec.dealer), seat: p.seat, card: p.card })) })),
    segments: lines,
  }
}

const [specFile, kind, out] = process.argv.slice(2)
const { day, spec } = JSON.parse(readFileSync(specFile, 'utf8')) as { day: string; spec: Spec }
writeFileSync(out, JSON.stringify(kind === 'quiz' ? quiz(spec, day) : answer(spec, day), null, 2))
