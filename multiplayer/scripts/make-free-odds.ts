// Free play's win chances (SKATGO-177): for the player's seat (0) of every deal in free play's pool, SkatZero's chance
// that each suit game and Grand is made at every bid of BIDS after picking up the skat — `seatGames(...).made`, the same
// simulation as the pool's bidding, the skats in the pool's own order for seat 0. About a second a hand, too much to work
// out per click on the shared service, so it is worked out once here and the table only looks it up.
//
//   node --import tsx scripts/make-free-odds.ts [processes=12]
//
// Writes skatzero/free-odds.json.gz (per deal, C S H D G: a whole percent per BIDS entry) and its entry in
// skatzero/manifest.json (`freeOdds`). Run once after the pool changes; commit both.
import { fork } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { type Card, shuffle } from '../../app/src/lib/skat/cards'
import { deal, roleOf } from '../../app/src/lib/skat/game'
import { ODDS_MODES, loadPool } from '../src/free'
import { BIDS, SKAT_PAIRS, seatGames } from '../src/skatzero/bidding'
import { loadPolicy } from '../src/skatzero/policy'

const DIR = new URL('../skatzero/', import.meta.url)
const POOL_SEED = 'skatgo-free-pool/1'
const POSITION = { forehand: 0, middlehand: 1, rearhand: 2 } as const

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

async function worker(from: number, to: number, out: string) {
  const pool = await loadPool(DIR, { odds: false })
  const policy = await loadPolicy(DIR)
  const rows: number[][][] = []
  for (let i = from; i < to; i++) {
    const d = pool.deals[i]
    const g = deal(d.dealer, d.deck.split(' ').map(poolCard))
    const r = await seatGames(policy, g.hands[0].map(z), POSITION[roleOf(0, d.dealer)], shuffle(SKAT_PAIRS, rng(`skats|${i}|0`)), 0)
    rows.push(ODDS_MODES.map((m) => r.made[m].map((x) => Math.round(x * 100))))
  }
  writeFileSync(out, JSON.stringify(rows))
  await policy.release()
}

const ODDS_FILE = fileURLToPath(new URL('free-odds.json.gz', DIR))

async function main(processes: number) {
  const started = Date.now()
  const pool = await loadPool(DIR, { odds: false })
  const count = pool.deals.length
  const per = Math.ceil(count / processes)
  const parts = await Promise.all(Array.from({ length: processes }, (_, k) => {
    const from = k * per, to = Math.min(count, from + per)
    const out = fileURLToPath(new URL(`../skatzero/.free-odds-part-${k}.json`, import.meta.url))
    return new Promise<string>((resolve, reject) => {
      const child = fork(fileURLToPath(import.meta.url), ['--worker', String(from), String(to), out], { execArgv: ['--import', 'tsx'] })
      child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`worker ${k} exited ${code}`))))
    })
  }))
  const deals = parts.flatMap((p) => JSON.parse(readFileSync(p, 'utf8')))
  for (const p of parts) rmSync(p)
  if (deals.length !== count) throw new Error('odds count')
  const odds = { version: pool.version, bids: BIDS, modes: ODDS_MODES, deals }
  const gz = gzipSync(JSON.stringify(odds), { level: 9 })
  writeFileSync(ODDS_FILE, gz)
  const manifestFile = fileURLToPath(new URL('manifest.json', DIR))
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  manifest.freeOdds = { name: 'free-odds.json.gz', bytes: gz.length, sha256: createHash('sha256').update(gz).digest('hex'), deals: count, pool: manifest.freePool.sha256 }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify({ deals: count, bytes: gz.length, minutes: +((Date.now() - started) / 60000).toFixed(1), processes }))
}

if (process.argv[2] === '--worker') await worker(Number(process.argv[3]), Number(process.argv[4]), process.argv[5])
else await main(Number(process.argv[2] ?? 12))
