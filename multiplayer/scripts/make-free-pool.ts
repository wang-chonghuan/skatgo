// Free play's pool of deals (SKATGO-40): deals with both computers' SkatZero bidding worked out in
// advance, so a game can start without the ≈ 1 s-per-computer simulation (SKATGO-39). Each deal is
// fixed by its index and the seed — deck, dealer and the order the computers try the 231 skats — so the
// pool is the same however many processes make it.
//
//   node --import tsx scripts/make-free-pool.ts [count=5000] [processes=12]
//
// Writes skatzero/free-pool.json.gz and its entry in skatzero/manifest.json. Run once; commit both.
import { fork } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { fullDeck, shuffle } from '../../app/src/lib/skat/cards'
import { deal, roleOf, type Seat } from '../../app/src/lib/skat/game'
import { BIDS, HAND_MODES, SKAT_PAIRS, seatBidding, skatOrHand } from '../src/skatzero/bidding'
import { loadPolicy } from '../src/skatzero/policy'

export const POOL_SEED = 'skatgo-free-pool/1'
const DIR = new URL('../skatzero/', import.meta.url)
const POSITION = { forehand: 0, middlehand: 1, rearhand: 2 } as const
/** One letter per SkatZero bid value: P = pick up, else the Hand game (C S H D G N, O = Null Ouvert). */
const CODE: Record<string, string> = { pickup: 'P', CH: 'C', SH: 'S', HH: 'H', DH: 'D', GH: 'G', NH: 'N', NOH: 'O' }

function rng(label: string) {
  let a = createHash('sha256').update(`${POOL_SEED}|${label}`).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const z = (c: { suit: string; rank: string }) => c.suit + (c.rank === '10' ? 'T' : c.rank)

async function worker(from: number, to: number, out: string) {
  const policy = await loadPolicy(DIR)
  const deals: unknown[] = []
  for (let i = from; i < to; i++) {
    const r = rng(`deal|${i}`)
    const deck = shuffle(fullDeck(), r)
    const dealer = Math.floor(r() * 3) as Seat
    const g = deal(dealer, deck)
    const computers: Record<string, { maxBid: number; decisions: string }> = {}
    for (const seat of [1, 2] as Seat[]) {
      const b = await seatBidding(policy, g.hands[seat].map(z), POSITION[roleOf(seat, dealer)], shuffle(SKAT_PAIRS, rng(`skats|${i}|${seat}`)))
      const decisions = BIDS.map((bid) => {
        const c = skatOrHand(b, bid)
        return CODE[c.pickup ? 'pickup' : c.mode]
      }).join('')
      computers[seat] = { maxBid: b.maxBid, decisions }
    }
    deals.push({ dealer, deck: deck.map(z).join(' '), computers })
  }
  writeFileSync(out, JSON.stringify(deals))
  await policy.release()
}

async function main(count: number, processes: number) {
  const started = Date.now()
  const per = Math.ceil(count / processes)
  const parts = await Promise.all(Array.from({ length: processes }, (_, k) => {
    const from = k * per, to = Math.min(count, from + per)
    const out = fileURLToPath(new URL(`../skatzero/.free-pool-part-${k}.json`, import.meta.url))
    return new Promise<string>((resolve, reject) => {
      const child = fork(fileURLToPath(import.meta.url), ['--worker', String(from), String(to), out], { execArgv: ['--import', 'tsx'] })
      child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`worker ${k} exited ${code}`))))
    })
  }))
  const deals = parts.flatMap((p) => JSON.parse(readFileSync(p, 'utf8')))
  for (const p of parts) rmSync(p)
  if (deals.length !== count) throw new Error('pool count')
  const pool = { version: 'skatzero@1fe5cab', seed: POOL_SEED, bids: BIDS, handModes: HAND_MODES, codes: CODE, deals }
  const gz = gzipSync(JSON.stringify(pool), { level: 9 })
  const file = fileURLToPath(new URL('free-pool.json.gz', DIR))
  writeFileSync(file, gz)
  const manifestFile = fileURLToPath(new URL('manifest.json', DIR))
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  manifest.freePool = { name: 'free-pool.json.gz', bytes: gz.length, sha256: createHash('sha256').update(gz).digest('hex'), deals: count, seed: POOL_SEED }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify({ deals: count, bytes: gz.length, minutes: +((Date.now() - started) / 60000).toFixed(1), processes }))
}

if (process.argv[2] === '--worker') await worker(Number(process.argv[3]), Number(process.argv[4]), process.argv[5])
else await main(Number(process.argv[2] ?? 5000), Number(process.argv[3] ?? 12))
