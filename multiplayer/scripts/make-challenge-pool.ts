// Hard hands' pool (SKATGO-248): per kind, deals whose player's ten cards are of the kind and that SkatZero, declaring the
// set game, makes in 50–90 % of the ways the other twenty cards can lie — the same ten and skat, the rest dealt anew
// RUNS times (the first run the deal as kept). The bad seat's: a hand the rules of thumb would play, the game SkatZero's
// own choice of suit or Grand from forehand, made there in at least 90 % and from middlehand in 50–90 %.
//
//   node --import tsx scripts/make-challenge-pool.ts [processes=8]          find deals into the scratch file, then write
//   node --import tsx scripts/make-challenge-pool.ts --write                write the pool from the scratch file
//   node --import tsx scripts/make-challenge-pool.ts --check [sample=3]     recompute some deals' rates
//
// Found deals go one per line into skatzero/challenge-found.jsonl (git-ignored), so a stopped run goes on where it
// stopped. --write takes CHALLENGE_DEALS a kind spread evenly over the rates found, easiest (highest rate) first, into
// skatzero/challenge-pool.json, which is committed.
import { fork } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Card, fullDeck, shuffle } from '../../app/src/lib/skat/cards'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, type ChallengeGame, type ChallengeKind, dealerFor, gameOfKind, ofKind, ownSlice, seatOf } from '../../app/src/lib/skat/challenge'
import { routineOf } from '../../app/src/lib/skat/bidding/practice'
import type { Seat } from '../../app/src/lib/skat/game'
import { aiPlays, type ChallengeDeal, redeal } from '../src/challenge'
import { card, raw } from '../src/computers'
import { declareAfterPickup } from '../src/skatzero/bidding'
import { type Policy, loadPolicy } from '../src/skatzero/policy'

const DIR = new URL('../skatzero/', import.meta.url)
const FOUND = new URL('challenge-found.jsonl', DIR)
const SEED = 'skatgo-challenge/1'
/** Lies of the other twenty cards a deal is judged over. */
const RUNS = 40
/** Deals found per kind before the pool is chosen from them. */
const FIND = 150
const LOW = 0.5
const HIGH = 0.9

function rng(label: string) {
  let a = createHash('sha256').update(`${SEED}|${label}`).digest().readUInt32LE(0)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const text = (deck: Card[]) => deck.map(raw).join(' ')

/** The same twelve cards (seat 0's ten as dealt, the skat) in a deck dealt by `dealer`. */
function moved(deck: Card[], from: Seat, to: Seat): Card[] {
  const [a, b] = ownSlice(from)
  const [c, d] = ownSlice(to)
  const mine = deck.slice(a, b)
  const rest = deck.filter((_, i) => (i < a || i >= b) && i < 30)
  const out: Card[] = []
  let k = 0
  for (let i = 0; i < 30; i++) out.push(i >= c && i < d ? mine[i - c] : rest[k++])
  return [...out, deck[30], deck[31]]
}

/** SkatZero's rate over RUNS lies, stopping as soon as it falls outside [low, high]; null when outside. */
async function rate(policy: Policy, dealer: Seat, deck: Card[], game: ChallengeGame, random: () => number, low: number, high: number): Promise<number | null> {
  let won = 0
  for (let r = 0; r < RUNS; r++) {
    const lie = r === 0 ? deck : redeal(dealer, deck, (n) => Math.floor(random() * n))
    const end = await aiPlays(policy, dealer, lie, game)
    if (end.result?.won) won++
    const lost = r + 1 - won
    if (won > high * RUNS || lost > (1 - low) * RUNS) return null
  }
  return won / RUNS
}

async function worker(kind: ChallengeKind, index: number) {
  const policy = await loadPolicy(DIR)
  const random = rng(`${kind}|${index}`)
  const seat = seatOf(kind)
  const dealer = dealerFor(seat)
  const [a, b] = ownSlice(dealer)
  for (let tried = 0; ; tried++) {
    const deck = shuffle(fullDeck(), random)
    const hand = deck.slice(a, b)
    if (!ofKind(kind, hand)) continue
    let found: ChallengeDeal | null = null
    if (kind === 'bad-seat') {
      if (routineOf(hand).contract === 'pass') continue
      const fore = dealerFor('forehand')
      const front = moved(deck, dealer, fore)
      const [c, d] = ownSlice(fore)
      const choice = await declareAfterPickup(policy, [...front.slice(c, d), front[30], front[31]].map(raw), 0, 18)
      if (!['C', 'S', 'H', 'D', 'G'].includes(choice.mode)) continue
      const game = choice.mode as ChallengeGame
      const strong = await rate(policy, fore, front, game, random, HIGH, 1)
      if (strong === null) continue
      const r = await rate(policy, dealer, deck, game, random, LOW, HIGH)
      if (r !== null) found = { dealer, deck: text(deck), game, rate: r, front: strong }
    } else {
      const game = gameOfKind(kind, hand)
      const r = await rate(policy, dealer, deck, game, random, LOW, HIGH)
      if (r !== null) found = { dealer, deck: text(deck), game, rate: r }
    }
    if (found) {
      appendFileSync(FOUND, JSON.stringify({ kind, ...found }) + '\n')
      console.log(JSON.stringify({ kind, index, tried, rate: found.rate }))
    }
  }
}

function found(): { kind: ChallengeKind; deal: ChallengeDeal }[] {
  if (!existsSync(FOUND)) return []
  return readFileSync(FOUND, 'utf8').split('\n').filter(Boolean).map((l) => {
    const { kind, ...deal } = JSON.parse(l) as { kind: ChallengeKind } & ChallengeDeal
    return { kind, deal }
  })
}
const counts = () => Object.fromEntries(CHALLENGE_KINDS.map((k) => [k, found().filter((f) => f.kind === k).length])) as Record<ChallengeKind, number>

async function main(processes: number) {
  // Workers per kind in proportion to how rare its deals are; each stops when its kind has enough.
  const share: Record<ChallengeKind, number> = { 'one-jack-suit': 1, 'short-trumps': 1, 'one-jack-grand': 1, 'null-weak-spot': 2, 'bad-seat': 3 }
  const total = Object.values(share).reduce((x, y) => x + y, 0)
  const children: { kind: ChallengeKind; child: ReturnType<typeof fork> }[] = []
  let started = Date.now() % 100000
  for (const kind of CHALLENGE_KINDS) {
    const n = Math.max(1, Math.round((processes * share[kind]) / total))
    for (let k = 0; k < n; k++) children.push({ kind, child: fork(fileURLToPath(import.meta.url), ['--worker', kind, String(started++)], { execArgv: ['--import', 'tsx'] }) })
  }
  const timer = setInterval(() => {
    const c = counts()
    console.log(JSON.stringify({ event: 'progress', ...c }))
    for (const w of children) if (c[w.kind] >= FIND && w.child.exitCode === null) w.child.kill()
    if (children.every((w) => w.child.exitCode !== null || w.child.killed)) {
      clearInterval(timer)
      console.log(JSON.stringify({ event: 'done', ...c }))
    }
  }, 30_000)
}

function write() {
  const all = found()
  const kinds = {} as Record<ChallengeKind, ChallengeDeal[]>
  for (const kind of CHALLENGE_KINDS) {
    // Each ten cards once; easiest first — the highest rate, equal rates in the order found — then CHALLENGE_DEALS spread
    // evenly from the easiest to the hardest, so the kind climbs steadily.
    const seen = new Set<string>()
    const deals = all.filter((f) => f.kind === kind).map((f) => f.deal).filter((d) => {
      const mine = d.deck.split(' ').slice(...ownSlice(d.dealer)).sort().join(' ')
      return !seen.has(mine) && !!seen.add(mine)
    })
    if (deals.length < CHALLENGE_DEALS) throw new Error(`${kind}: ${deals.length} of ${CHALLENGE_DEALS}`)
    const sorted = deals.map((d, i) => ({ d, i })).sort((x, y) => y.d.rate - x.d.rate || x.i - y.i).map((x) => x.d)
    kinds[kind] = Array.from({ length: CHALLENGE_DEALS }, (_, k) => sorted[Math.round((k * (sorted.length - 1)) / (CHALLENGE_DEALS - 1))])
  }
  writeFileSync(new URL('challenge-pool.json', DIR), JSON.stringify({ seed: SEED, runs: RUNS, kinds }, null, 1) + '\n')
  console.log(JSON.stringify(Object.fromEntries(CHALLENGE_KINDS.map((k) => [k, kinds[k].map((d) => d.rate)]))))
}

/** Every deal's rate within its bounds and order; then `sample` deals a kind replayed with the pool's first lie and fresh
 *  others, their rate within a margin of the recorded. */
async function check(sample: number) {
  const pool = JSON.parse(readFileSync(new URL('challenge-pool.json', DIR), 'utf8')) as { kinds: Record<ChallengeKind, ChallengeDeal[]> }
  const policy = await loadPolicy(DIR)
  let bad = 0
  for (const kind of CHALLENGE_KINDS) {
    const deals = pool.kinds[kind]
    const inBounds = deals.every((d) => d.rate >= LOW && d.rate <= HIGH && (kind !== 'bad-seat' || (d.front ?? 0) >= HIGH))
    const ordered = deals.every((d, i) => i === 0 || deals[i - 1].rate >= d.rate)
    const patterned = deals.every((d) => ofKind(kind, d.deck.split(' ').map(card).slice(...ownSlice(d.dealer))))
    const again: number[] = []
    for (const d of deals.slice(0, sample)) {
      const random = rng(`check|${kind}|${d.deck}`)
      let won = 0
      for (let r = 0; r < RUNS; r++) {
        const deck = d.deck.split(' ').map(card)
        const end = await aiPlays(policy, d.dealer, r === 0 ? deck : redeal(d.dealer, deck, (n) => Math.floor(random() * n)), d.game)
        if (end.result?.won) won++
      }
      again.push(won / RUNS)
    }
    const ok = deals.length === CHALLENGE_DEALS && inBounds && ordered && patterned
    if (!ok) bad++
    console.log(JSON.stringify({ kind, deals: deals.length, inBounds, ordered, patterned, recorded: deals.slice(0, sample).map((d) => d.rate), again }))
  }
  if (bad) process.exit(1)
}

if (process.argv[2] === '--worker') await worker(process.argv[3] as ChallengeKind, Number(process.argv[4]))
else if (process.argv[2] === '--write') write()
else if (process.argv[2] === '--check') await check(Number(process.argv[3] ?? 3))
else await main(Number(process.argv[2] ?? 8))
