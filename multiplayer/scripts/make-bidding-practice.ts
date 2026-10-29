// The bidding practice's questions (SKATGO-149): ten cards and a seat from free play's pool, whose SkatZero highest
// bid is stored there (scripts/make-free-pool.ts). A hand is a question only when one game explains its answer —
// a pass, a Null, or exactly one suit game's or Grand's ten-card value (app/src/lib/skat/bidding/practice.ts
// `answerOf`). One fixed order from a seed: about one question in three a pass, the rest bids, shuffled together, then
// ordered from easy to hard (`difficultyOf`, SKATGO-151) — the shuffle's order kept within each step.
//
// Since SKATGO-154 a bid question needs SkatZero's own word for its contract, not only a game whose value matches the
// number (the human found 「第五题」 naming Spades where the hand is plainly Diamonds): `bidding-practice-games.ts` works out,
// at the seat's highest bid, how often each pickup game is SkatZero's best and whether Hand would beat picking up; a
// question is kept when SkatZero picks up and plays the answer's game in at least SURE of the skats, and that game is the
// suit with most trumps (or Grand), so the explanation's sum is the game SkatZero plays. A Null by its kind the same way.
//
//   node --import tsx scripts/bidding-practice-games.ts <games.json>      (about 20 minutes, resumable)
//   node --import tsx scripts/make-bidding-practice.ts <games.json> [questions=300]
//
// Writes app/src/lib/skat/bidding/practice.data.ts. Run once; commit it. test/bidding-practice.test.ts holds every
// question to the pool again.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { cardId, shuffle, type Card } from '../../app/src/lib/skat/cards'
import { deal, next, type Seat } from '../../app/src/lib/skat/game'
import { SURE, type Practice, answerOf, bestSuit, contractOf, difficultyOf } from '../../app/src/lib/skat/bidding/practice'
import { loadPool } from '../src/free'

const DIR = new URL('../skatzero/', import.meta.url)
const OUT = new URL('../../app/src/lib/skat/bidding/practice.data.ts', import.meta.url)
const SEED = 'skatgo-bidding-practice/1'
const gamesFile = process.argv[2]
if (!gamesFile) throw new Error('usage: make-bidding-practice.ts <games.json> [questions=300]')
const count = Number(process.argv[3] ?? 300)
type Games = { pickup: Record<string, number>; hand: { mode: string; value: number }; pickupValue: number }
const games = JSON.parse(readFileSync(gamesFile, 'utf8')) as Record<string, Games>

/** SkatZero's share of the answer's game at its highest bid, or null when it does not name that game clearly. */
function sureOf(hand: Card[], bid: number, g: Games | undefined): number | null {
  const answer = answerOf(hand, bid)
  if (!answer || answer.kind === 'pass' || !g) return null
  const picksUp = g.pickupValue >= g.hand.value
  if (answer.kind === 'null') {
    const share = { plain: picksUp ? g.pickup.N : 0, ouvert: picksUp ? g.pickup.NO : 0, hand: !picksUp && g.hand.mode === 'NH' ? 1 : 0, handOuvert: !picksUp && g.hand.mode === 'NOH' ? 1 : 0 }[answer.which]
    return share >= SURE ? share : null
  }
  const mode = contractOf(answer)
  if (!picksUp || (g.pickup[mode] ?? 0) < SURE) return null
  if (answer.game.contract.kind === 'suit' && answer.game.trumps < bestSuit(hand).trumps) return null
  return g.pickup[mode]
}

function rng(label: string) {
  let a = createHash('sha256').update(`${SEED}|${label}`).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The pool's card names ("HT") as the app's cards. */
const poolCard = (s: string): Card => ({ suit: s[0] as Card['suit'], rank: (s[1] === 'T' ? '10' : s[1]) as Card['rank'] })

/** Seat `seat`'s position at the bidding of a deal dealt by `dealer`: 0 forehand, 1 middlehand, 2 rearhand. */
const positionOf = (dealer: Seat, seat: Seat): 0 | 1 | 2 => ((seat - next(dealer) + 3) % 3) as 0 | 1 | 2

const pool = await loadPool(DIR)
const passes: Practice[] = []
const bids: Practice[] = []
pool.deals.forEach((d, i) => {
  const g = deal(d.dealer, d.deck.split(' ').map(poolCard))
  for (const seat of [0, 1, 2] as Seat[]) {
    const maxBid = d.computers[String(seat) as '0' | '1' | '2'].maxBid
    const hand = g.hands[seat]
    const bid = maxBid < 18 ? 0 : maxBid
    if (!answerOf(hand, bid)) continue
    const q: Practice = { deal: i, seat, hand: hand.map(cardId).join(' '), position: positionOf(d.dealer, seat), bid }
    if (!bid) {
      passes.push(q)
      continue
    }
    const sure = sureOf(hand, bid, games[`${i}-${seat}`])
    if (sure !== null) bids.push({ ...q, sure: Math.round(sure * 100) / 100 })
  }
})
const nPass = Math.round(count / 3)
const mixed = shuffle([...shuffle(passes, rng('pass')).slice(0, nPass), ...shuffle(bids, rng('bid')).slice(0, count - nPass)], rng('order'))
const chosen = [1, 2, 3].flatMap((d) => mixed.filter((q) => difficultyOf(q) === d))
writeFileSync(
  OUT,
  `// Generated by multiplayer/scripts/make-bidding-practice.ts (SKATGO-149; SkatZero's own game since SKATGO-154) — never
// edit by hand; multiplayer's test/bidding-practice.test.ts holds every question to free play's pool and SkatZero again.
import type { Practice } from './practice'

export const PRACTICE: Practice[] = [
${chosen.map((q) => `  ${JSON.stringify(q)},`).join('\n')}
]
`,
)
console.log(`${chosen.length} questions (${nPass} passes) from ${passes.length} passes and ${bids.length} bids that qualify`)
