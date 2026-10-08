// Free play's pool of deals (SKATGO-40): deals with SkatZero's bidding worked out in advance for every
// seat, so a game can start without the ≈ 1 s-per-seat simulation (SKATGO-39). Free play uses seats 1
// and 2; a private table (SKATGO-61) may need any seat, its host's included. Each deal is fixed by its
// index and the seed — deck, dealer and the order each seat tries the 231 skats — so the pool is the
// same however many processes make it.
//
//   node --import tsx scripts/make-free-pool.ts [count=5000] [processes=12]
//   node --import tsx scripts/make-free-pool.ts --extend [processes=12]
//
// Writes skatzero/free-pool.json.gz and its entry in skatzero/manifest.json. Run once; commit both.
// `--extend` keeps the committed pool's deals and plans as they are and works out only the seats a deal
// lacks — model outputs differ in their last digits between platforms, so a plan already committed is
// never recomputed.
import { fork } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { gunzipSync, gzipSync } from 'node:zlib'
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

type Plan = { maxBid: number; decisions: string }
type PoolDeal = { dealer: Seat; deck: string; computers: Record<string, Plan> }
const SEATS = [0, 1, 2] as Seat[]

async function worker(from: number, to: number, out: string, existing?: string) {
  const policy = await loadPolicy(DIR)
  const known: PoolDeal[] | null = existing ? JSON.parse(readFileSync(existing, 'utf8')) : null
  const deals: PoolDeal[] = []
  for (let i = from; i < to; i++) {
    const r = rng(`deal|${i}`)
    const deck = shuffle(fullDeck(), r)
    const dealer = Math.floor(r() * 3) as Seat
    const g = deal(dealer, deck)
    const before = known?.[i]
    if (before && (before.deck !== deck.map(z).join(' ') || before.dealer !== dealer)) throw new Error(`deal ${i} differs from the committed pool`)
    const computers: Record<string, Plan> = { ...before?.computers }
    for (const seat of SEATS) {
      if (computers[seat]) continue
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

const POOL_FILE = fileURLToPath(new URL('free-pool.json.gz', DIR))

async function main(count: number, processes: number, extend: boolean) {
  const started = Date.now()
  let existing: string | undefined
  if (extend) {
    const old = JSON.parse(gunzipSync(readFileSync(POOL_FILE)).toString('utf8'))
    count = old.deals.length
    existing = fileURLToPath(new URL('../skatzero/.free-pool-existing.json', import.meta.url))
    writeFileSync(existing, JSON.stringify(old.deals))
  }
  const per = Math.ceil(count / processes)
  const parts = await Promise.all(Array.from({ length: processes }, (_, k) => {
    const from = k * per, to = Math.min(count, from + per)
    const out = fileURLToPath(new URL(`../skatzero/.free-pool-part-${k}.json`, import.meta.url))
    return new Promise<string>((resolve, reject) => {
      const child = fork(fileURLToPath(import.meta.url), ['--worker', String(from), String(to), out, ...(existing ? [existing] : [])], { execArgv: ['--import', 'tsx'] })
      child.on('exit', (code) => (code === 0 ? resolve(out) : reject(new Error(`worker ${k} exited ${code}`))))
    })
  }))
  const deals = parts.flatMap((p) => JSON.parse(readFileSync(p, 'utf8')))
  for (const p of parts) rmSync(p)
  if (existing) rmSync(existing)
  if (deals.length !== count) throw new Error('pool count')
  const pool = { version: 'skatzero@1fe5cab', seed: POOL_SEED, bids: BIDS, handModes: HAND_MODES, codes: CODE, deals }
  const gz = gzipSync(JSON.stringify(pool), { level: 9 })
  writeFileSync(POOL_FILE, gz)
  const manifestFile = fileURLToPath(new URL('manifest.json', DIR))
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  manifest.freePool = { name: 'free-pool.json.gz', bytes: gz.length, sha256: createHash('sha256').update(gz).digest('hex'), deals: count, seed: POOL_SEED }
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(JSON.stringify({ deals: count, bytes: gz.length, minutes: +((Date.now() - started) / 60000).toFixed(1), processes }))
}

if (process.argv[2] === '--worker') await worker(Number(process.argv[3]), Number(process.argv[4]), process.argv[5], process.argv[6])
else if (process.argv[2] === '--extend') await main(0, Number(process.argv[3] ?? 12), true)
else await main(Number(process.argv[2] ?? 5000), Number(process.argv[3] ?? 12), false)
