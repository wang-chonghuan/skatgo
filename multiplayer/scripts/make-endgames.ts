// The "Sieg sichern" ladder's puzzles (SKATGO-108; one standard since SKATGO-110: four tricks left): positions
// where the declarer leads with four cards left, has picked up the skat, still needs points, and exactly one
// card makes 61 sure however the defenders' cards lie (app/src/lib/skat/tricks/exercises/endgame.ts proves it).
// The games are dealt here from a fixed seed, so a deal's number names the same game on every run. The bidding is
// the course's heuristic (`maxBid` in app/src/lib/skat/ai.ts, always picking up the skat): SkatZero's own bidding
// costs seconds a deal, and an endgame's answer is proven whatever the auction was. SkatZero puts away, names
// the game and plays every card. The thirty were chosen by hand from all that qualify (PICKS: deal and cards
// left), so each can carry a written tip; `--all <file>` writes every one that qualifies for choosing.
//
//   node --import tsx scripts/make-endgames.ts [deals=4000] [--all <file>]
//
// Writes app/src/lib/skat/tricks/exercises/endgames.data.ts. Run once; commit it. The app's tests prove every
// puzzle again from the file.
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { maxBid } from '../../app/src/lib/skat/ai'
import { type Card, cardId, fullDeck, isTrump, legalPlays, pointsOf, shuffle, strength } from '../../app/src/lib/skat/cards'
import { actor, deal, roleOf, type Game, type Seat } from '../../app/src/lib/skat/game'
import { type EndgameRecord, type Side, type StoredEndgame, solveEndgame, storeEndgame } from '../../app/src/lib/skat/tricks/exercises/endgame'
import { type SeatPlan, advance, computerTurn } from '../src/computers'
import { loadPolicy } from '../src/skatzero/policy'

const DIR = new URL('../skatzero/', import.meta.url)
const OUT = new URL('../../app/src/lib/skat/tricks/exercises/endgames.data.ts', import.meta.url)
const SEED = 'skatgo-endgames/1'
const LEFT = 4
const args = process.argv.slice(2)
const allAt = args.indexOf('--all')
const all = allAt >= 0 ? args[allAt + 1] : null
const count = Number(args.find((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--all') ?? 4000)
const next = (s: Seat) => ((s + 1) % 3) as Seat

/** The deal's own random numbers, from the seed and its number (the free pool's generator, its own seed). */
function rng(label: string) {
  let a = createHash('sha256').update(`${SEED}|${label}`).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Candidate = { deal: number; n: number; trap: boolean; game: EndgameRecord['game']; record: EndgameRecord; stored: StoredEndgame }

/** The card a learner reaches for first: the highest trump, or with none the card worth most. */
function obvious(hand: Card[], c: Parameters<typeof isTrump>[1]): Card {
  const trumps = hand.filter((x) => isTrump(x, c))
  if (trumps.length) return trumps.reduce((a, b) => (strength(b, c) > strength(a, c) ? b : a))
  return hand.reduce((a, b) => (pointsOf([b]) > pointsOf([a]) ? b : a))
}

const policy = await loadPolicy(DIR)
const found: Candidate[] = []
for (let k = 0; k < count; k++) {
  const r = rng(`deal|${k}`)
  const deck = shuffle(fullDeck(), r)
  const dealer = Math.floor(r() * 3) as Seat
  const g0 = deal(dealer, deck)
  const plans = [0, 1, 2].map((seat): SeatPlan => ({ maxBid: maxBid(g0.hands[seat]), skatOrHand: () => ({ pickup: true }) }))
  const steps: Game[] = []
  try {
    await advance(g0, [], (g) => computerTurn(g, actor(g)!, plans[actor(g)!], policy), steps, true)
  } catch {
    continue
  }
  for (const s of steps) {
    if (s.phase !== 'play' || !s.declaration || s.trick.length || s.declarer === null || actor(s) !== s.declarer || !s.pickedUp) continue
    const contract = s.declaration.contract
    if (contract.kind === 'null' || s.declaration.hand) continue
    const D = s.declarer
    const n = s.hands[D].length
    if (n !== LEFT) continue
    const side = (seat: Seat): Side => (seat === D ? 'you' : seat === next(D) ? 'left' : 'right')
    const game = contract.kind === 'grand' ? 'G' : contract.trump
    const record: EndgameRecord = {
      id: '',
      game,
      position: roleOf(D, s.dealer),
      skat: s.skat.map(cardId),
      hand: s.hands[D].map(cardId),
      tricks: s.tricks.map((t) => ({ cards: t.cards.map((p) => [side(p.seat), cardId(p.card)] as [Side, string]), winner: side(t.winner) })),
      left: s.hands[next(D)].map(cardId),
      right: s.hands[next(next(D))].map(cardId),
    }
    try {
      const e = solveEndgame(record)
      const trap = cardId(obvious(legalPlays(e.hand, [], contract), contract)) !== cardId(e.answer)
      found.push({ deal: k, n, trap, game, record, stored: storeEndgame(record, e) })
    } catch {
      // not a puzzle: already won or lost, more than one sure card, or a card with no losing split
    }
  }
}
await policy.release()

// The thirty, in the order the ladder climbs (deal:cards): the top card and drawing the last trump first; then a
// winner of another suit led while their one trump is higher than yours, so that either it wins or your trump is
// promoted; then a small trump given up to draw their higher one; last, the King led before the Ten.
const PICKS: string[] = [
  '1559:4', '973:4', '145:4', '3571:4', '2395:4', '3032:4', '3590:4', '1321:4', '2838:4', '1822:4', '3794:4',
  '404:4', '983:4', '2503:4', '2859:4', '3030:4', '3209:4', '3753:4', '3945:4', '2351:4', '1759:4', '544:4', '182:4', '1649:4',
  '3152:4', '3096:4', '1227:4', '482:4', '49:4', '1821:4',
]
if (all) writeFileSync(all, found.map((c) => JSON.stringify({ key: `${c.deal}:${c.n}`, trap: c.trap, ...c.stored })).join('\n') + '\n')
const chosen: StoredEndgame[] = PICKS.map((key, i) => {
  const pick = found.find((c) => `${c.deal}:${c.n}` === key)
  if (!pick) throw new Error(`${key} is not a puzzle`)
  return { ...pick.stored, id: `sieg-sichern-${i + 1}` }
})
if (PICKS.length) writeFileSync(
  OUT,
  `// Generated by multiplayer/scripts/make-endgames.ts (SKATGO-108) — never edit by hand; the app's tests prove
// every puzzle again from this file.
import type { StoredEndgame } from './endgame'

export const ENDGAMES_STORED: StoredEndgame[] = ${JSON.stringify(chosen, null, 1)}
`,
)
console.log(`${found.length} puzzles with ${LEFT} left in ${count} games (${found.filter((c) => c.trap).length} where the card a learner reaches for first is wrong)`)
console.log(chosen.map((c) => `${c.id} ${c.game} need ${c.need} hand ${c.hand.join(' ')} -> ${c.answer}`).join('\n'))
