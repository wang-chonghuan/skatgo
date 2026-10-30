// SkatZero's own game for every hand the bidding practice could ask (SKATGO-154; every bid since SKATGO-159): for each
// seat of free play's pool that SkatZero bids with, at its highest bid, or that the rules of thumb would bid with
// (`routineOf`), at 18 — the share of skats in which each pickup game is SkatZero's best, whether a Hand game would beat
// picking up, and each suit game's and Grand's chance to be made at every bid — `seatGames`, the same simulation as
// the pool's bidding, the skats in the pool's own order. About a second a hand; written as it goes, so a run can resume.
//
//   node --import tsx scripts/bidding-practice-games.ts <out.json> [part=0 parts=1]
//
// With parts > 1 a run takes every parts-th deal from part on, so several can run side by side into their own files;
// make-bidding-practice.ts reads them all.
// make-bidding-practice.ts reads the file to name each question's contract as SkatZero itself does.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { type Card } from '../../app/src/lib/skat/cards'
import { deal, roleOf, type Seat } from '../../app/src/lib/skat/game'
import { routineOf } from '../../app/src/lib/skat/bidding/practice'
import { loadPool } from '../src/free'
import { SKAT_PAIRS, bidIndex, seatGames } from '../src/skatzero/bidding'
import { loadPolicy } from '../src/skatzero/policy'
import { shuffle } from '../../app/src/lib/skat/cards'

const DIR = new URL('../skatzero/', import.meta.url)
const POOL_SEED = 'skatgo-free-pool/1'
const POSITION = { forehand: 0, middlehand: 1, rearhand: 2 } as const
const out = process.argv[2]
if (!out) throw new Error('usage: bidding-practice-games.ts <out.json> [part=0 parts=1]')
const part = Number(process.argv[3] ?? 0)
const parts = Number(process.argv[4] ?? 1)

function rng(label: string) {
  let a = createHash('sha256').update(`${POOL_SEED}|${label}`).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const poolCard = (s: string): Card => ({ suit: s[0] as Card['suit'], rank: (s[1] === 'T' ? '10' : s[1]) as Card['rank'] })
const z = (c: Card) => c.suit + (c.rank === '10' ? 'T' : c.rank)
const round = (x: number) => Math.round(x * 1000) / 1000

const pool = await loadPool(DIR)
const policy = await loadPolicy(DIR)
const games: Record<string, unknown> = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {}
let n = 0
for (const [i, d] of pool.deals.entries()) {
  if (i % parts !== part) continue
  const g = deal(d.dealer, d.deck.split(' ').map(poolCard))
  for (const seat of [0, 1, 2] as Seat[]) {
    const id = `${i}-${seat}`
    const maxBid = d.computers[String(seat) as '0' | '1' | '2'].maxBid
    if (games[id] || (maxBid < 18 && routineOf(g.hands[seat]).contract === 'pass')) continue
    const r = await seatGames(policy, g.hands[seat].map(z), POSITION[roleOf(seat, d.dealer)], shuffle(SKAT_PAIRS, rng(`skats|${i}|${seat}`)), bidIndex(Math.max(18, maxBid)))
    games[id] = { ...r, made: Object.fromEntries(Object.entries(r.made).map(([m, t]) => [m, t.map(round)])) }
    if (++n % 25 === 0) {
      writeFileSync(out, JSON.stringify(games))
      console.log(`${n} hands`)
    }
  }
}
writeFileSync(out, JSON.stringify(games))
console.log(`done: ${Object.keys(games).length} hands`)
