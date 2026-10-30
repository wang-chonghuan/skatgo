// The bidding practice's questions (SKATGO-149): ten cards and a seat from free play's pool, whose SkatZero highest
// bid is stored there (scripts/make-free-pool.ts), and the game SkatZero plays at that bid (SKATGO-154): a bid question
// needs SkatZero to pick up and play one game in at least SURE of the skats (`bidding-practice-games.ts`), a Null by its
// kind the same way.
//
// Since SKATGO-159 (the human: 「不用600个，可以减少，但是要稍微难一点，不要我说那种套路，套路应该有，但是是基础的，低难度的」)
// the run is short and mostly hands the rules of thumb get wrong (`routineOf`), in four kinds, each to a share: a pass
// the routine would bid, a bid the routine would pass, another game than the routine's, and the routine's game bid
// below its ten-card value (SkatZero bids past it only in a Hand game, which is not asked). A bid away from that value is asked only when SkatZero's chances explain it
// (FAR_AT, FAR_DROP, BORDER). The routine's own questions open the run, a few.
// One fixed order from a seed: shuffled, then ordered from easy to hard (`difficultyOf`).
//
//   node --import tsx scripts/bidding-practice-games.ts <games.json> [part parts]   (resumable; parts run side by side)
//   node --import tsx scripts/make-bidding-practice.ts <games.json>...
//
// Writes app/src/lib/skat/bidding/practice.data.ts. Run once; commit it. test/bidding-practice.test.ts holds every
// question to the pool and SkatZero again.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { cardId, shuffle, type Card } from '../../app/src/lib/skat/cards'
import { deal, next, type Seat } from '../../app/src/lib/skat/game'
import { NULL_BIDS, SURE, type ContractKey, type GameKey, type Practice, difficultyOf, routineMisses, routineOf, valuedOf } from '../../app/src/lib/skat/bidding/practice'
import { loadPool } from '../src/free'
import { BIDS, bidIndex } from '../src/skatzero/bidding'

const DIR = new URL('../skatzero/', import.meta.url)
const OUT = new URL('../../app/src/lib/skat/bidding/practice.data.ts', import.meta.url)
const SEED = 'skatgo-bidding-practice/2'
/** How many of each kind the run asks: the routine's own, then the four ways it fails. */
const QUOTA = { routine: 30, pass: 22, play: 25, game: 30, far: 30, border: 13 } as const
/** A bid away from the ten-card value is asked when SkatZero's chance at it is at least FAR_AT and at the very next bid
 *  at least FAR_DROP lower — so the stop is where its chance falls — or, at 18, when the game is borderline (at most
 *  BORDER): "say 18, go no higher", as the cheat sheet has it. Otherwise the stop is SkatZero's bidding penalties at
 *  work, which nothing on the page could explain. */
const FAR_AT = 55
const FAR_DROP = 12
const BORDER = 68
/** …and the count itself clearly riskier than 18, so stopping short of it is the lesson. */
const BORDER_GAP = 8

type Games = { pickup: Record<string, number>; hand: { mode: string; value: number }; pickupValue: number; made: Record<GameKey, number[]> }
const files = process.argv.slice(2)
if (!files.length) throw new Error('usage: make-bidding-practice.ts <games.json>...')
const games: Record<string, Games> = Object.assign({}, ...files.map((f) => JSON.parse(readFileSync(f, 'utf8'))))

const KEYS: GameKey[] = ['C', 'S', 'H', 'D', 'G']
const pct = (x: number) => Math.round(x * 100)

/** The game SkatZero names at its highest bid, and how surely; null when none is clear or it would play Hand. */
function named(bid: number, g: Games): { contract: ContractKey; sure: number } | null {
  const picksUp = g.pickupValue >= g.hand.value
  const which = NULL_BIDS[bid]
  if (which) {
    const share = { plain: picksUp ? g.pickup.N : 0, ouvert: picksUp ? g.pickup.NO : 0, hand: !picksUp && g.hand.mode === 'NH' ? 1 : 0, handOuvert: !picksUp && g.hand.mode === 'NOH' ? 1 : 0 }[which]
    return share >= SURE ? { contract: 'N', sure: share } : null
  }
  if (!picksUp) return null
  const key = KEYS.find((k) => (g.pickup[k] ?? 0) >= SURE)
  return key ? { contract: key, sure: g.pickup[key] } : null
}

/** Step 2's numbers for a suit game or Grand: at its ten-card value, that value and a level either side; below it, the
 *  game's level under the bid (else one above the value), the bid and the value; above it, the value, the bid and the
 *  game's next level — always numbers anyone may bid, so where the answer sits among them gives nothing away. */
function optionsOf(hand: Card[], key: GameKey, bid: number): number[] | null {
  const v = valuedOf(hand, key)
  const level = v.count + 1
  const under = Math.ceil(bid / v.base) - 1
  let out: number[]
  if (bid === v.value) {
    const from = Math.max(2, level - 1)
    out = [from, from + 1, from + 2].map((k) => k * v.base)
  } else if (bid < v.value) out = [under >= 2 ? under * v.base : (level + 1) * v.base, bid, v.value]
  else out = [v.value, bid, (Math.floor(bid / v.base) + 1) * v.base]
  out = [...new Set(out)].sort((a, b) => a - b)
  return out.length === 3 && out.every((o) => BIDS.includes(o)) ? out : null
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

type Kind = keyof typeof QUOTA
/** Which way the routine fails a question, or `routine` when it answers it; a borderline game stopped at 18 is its own
 *  kind, kept few, whatever the routine said. */
function kindOf(q: Practice, hand: Card[]): Kind {
  const miss = routineMisses(q)
  if (!miss.contract && !miss.value) return 'routine'
  if (q.options && !q.above && q.bid !== valuedOf(hand, q.contract as GameKey).value) return 'border'
  if (miss.value) return 'far'
  const r = routineOf(hand).contract
  return q.contract === 'pass' ? 'pass' : r === 'pass' ? 'play' : 'game'
}

const pool = await loadPool(DIR)
const found: Record<Kind, Practice[]> = { routine: [], pass: [], play: [], game: [], far: [], border: [] }
pool.deals.forEach((d, i) => {
  const dealt = deal(d.dealer, d.deck.split(' ').map(poolCard))
  for (const seat of [0, 1, 2] as Seat[]) {
    const maxBid = d.computers[String(seat) as '0' | '1' | '2'].maxBid
    const hand = dealt.hands[seat]
    const g = games[`${i}-${seat}`]
    const base = { deal: i, seat, hand: hand.map(cardId).join(' '), position: positionOf(d.dealer, seat) }
    let q: Practice
    if (maxBid < 18) {
      q = { ...base, bid: 0, contract: 'pass' }
      if (g) q.games = Object.fromEntries(KEYS.map((k) => [k, pct(g.made[k][bidIndex(18)])]))
    } else {
      if (!g) continue
      const n = named(maxBid, g)
      if (!n) continue
      q = { ...base, bid: maxBid, contract: n.contract, sure: Math.round(n.sure * 100) / 100, games: Object.fromEntries(KEYS.map((k) => [k, pct(g.made[k][bidIndex(maxBid)])])) }
      if (n.contract !== 'N') {
        const options = optionsOf(hand, n.contract as GameKey, maxBid)
        if (!options) continue
        q.options = options
        q.odds = options.map((o) => pct(g.made[n.contract as GameKey][bidIndex(o)]))
        if (maxBid !== valuedOf(hand, n.contract as GameKey).value) {
          const at = pct(g.made[n.contract as GameKey][bidIndex(maxBid)])
          const next = BIDS[bidIndex(maxBid) + 1]
          const above = pct(g.made[n.contract as GameKey][bidIndex(next)])
          const counted = valuedOf(hand, n.contract as GameKey).value
          const border = maxBid === 18 && at <= BORDER && counted >= 27 && pct(g.made[n.contract as GameKey][bidIndex(counted)]) <= at - BORDER_GAP
          if (!border && (at < FAR_AT || above > at - FAR_DROP)) continue
          if (!border) q.above = [next, above]
        }
      }
    }
    const kind = kindOf(q, hand)
    // A pass the routine would bid is explained by the chance of the routine's game at 18.
    if (kind === 'pass' && !q.games) continue
    if (kind === 'routine') delete q.games
    found[kind].push(q)
  }
})

// Each kind to its quota, the kinds short of theirs leaving the rest to the others' next ones.
const picked: Practice[] = []
const shuffled = Object.fromEntries(Object.entries(found).map(([k, list]) => [k, shuffle(list, rng(k))])) as Record<Kind, Practice[]>
const hardKinds: Kind[] = ['pass', 'play', 'game', 'far', 'border']
const want = hardKinds.reduce((s, k) => s + QUOTA[k], 0)
const taken = Object.fromEntries(hardKinds.map((k) => [k, Math.min(QUOTA[k], shuffled[k].length)])) as Record<Kind, number>
let left = want - hardKinds.reduce((s, k) => s + taken[k], 0)
for (const k of hardKinds) {
  const more = Math.min(left, shuffled[k].length - taken[k])
  taken[k] += more
  left -= more
}
for (const k of hardKinds) picked.push(...shuffled[k].slice(0, taken[k]))
const routine = shuffled.routine.slice(0, Math.min(QUOTA.routine, Math.floor(picked.length / 3)))
const mixed = shuffle([...routine, ...picked], rng('order'))
const chosen = [1, 2, 3].flatMap((step) => mixed.filter((q) => difficultyOf(q) === step))
writeFileSync(
  OUT,
  `// Generated by multiplayer/scripts/make-bidding-practice.ts (SKATGO-149; SkatZero's own game since SKATGO-154, the hands
// the rules of thumb get wrong since SKATGO-159) — never edit by hand; multiplayer's test/bidding-practice.test.ts holds
// every question to free play's pool and SkatZero again.
import type { Practice } from './practice'

export const PRACTICE: Practice[] = [
${chosen.map((q) => `  ${JSON.stringify(q)},`).join('\n')}
]
`,
)
console.log(`${chosen.length} questions: ${routine.length} routine, ${hardKinds.map((k) => `${k} ${taken[k]}/${found[k].length}`).join(', ')}`)
