import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { type Card, cardId, shuffle } from '../../app/src/lib/skat/cards'
import { deal, next, roleOf, type Seat } from '../../app/src/lib/skat/game'
import { PRACTICE_QUESTIONS, SURE, answerOf, bestSuit, contractOf, difficultyOf, practiceHand, solutionOf, valueOptions } from '../../app/src/lib/skat/bidding/practice'
import { SKAT_PAIRS, bidIndex, seatGames } from '../src/skatzero/bidding'
import { loadPolicy } from '../src/skatzero/policy'
import { loadPool } from '../src/free'

// The bidding practice (SKATGO-149): every stored question is its pool deal's seat — the same ten cards, the same
// position at the bidding, and SkatZero's own highest bid as the answer (below 18 a pass) — and one game explains it.

const DIR = new URL('../skatzero/', import.meta.url)
const poolCard = (s: string): Card => ({ suit: s[0] as Card['suit'], rank: (s[1] === 'T' ? '10' : s[1]) as Card['rank'] })
const sorted = (cards: Card[]) => cards.map(cardId).sort().join(' ')

test("every bidding-practice answer is SkatZero's highest bid for those cards from that seat", async () => {
  const pool = await loadPool(DIR)
  assert.ok(PRACTICE_QUESTIONS.length >= 100)
  for (const q of PRACTICE_QUESTIONS) {
    const d = pool.deals[q.deal]
    const g = deal(d.dealer, d.deck.split(' ').map(poolCard))
    const seat = q.seat as Seat
    const hand = practiceHand(q)
    assert.equal(sorted(hand), sorted(g.hands[seat]), `deal ${q.deal} seat ${q.seat}: cards`)
    assert.equal(q.position, (seat - next(d.dealer) + 3) % 3, `deal ${q.deal} seat ${q.seat}: position`)
    const maxBid = d.computers[String(seat) as '0' | '1' | '2'].maxBid
    assert.equal(q.bid, maxBid < 18 ? 0 : maxBid, `deal ${q.deal} seat ${q.seat}: answer`)
    assert.ok(answerOf(hand, q.bid), `deal ${q.deal} seat ${q.seat}: one game explains it`)
    const sol = solutionOf(q)
    assert.ok(sol.value === null || valueOptions(q).includes(sol.value), `deal ${q.deal} seat ${q.seat}: the bid is offered`)
  }
  // Easy to hard (SKATGO-151).
  const steps = PRACTICE_QUESTIONS.map(difficultyOf)
  assert.deepEqual(steps, [...steps].sort((a, b) => a - b))
})

// SKATGO-154: the contract a question names is SkatZero's own at its highest bid — recorded per question (`sure`) and,
// for a few, worked out again here (about a second each) — and the suit with most trumps; the hand of the human's
// 「第五题」 (Spades named, plainly Diamonds) is not asked.
test("every bid question's contract is SkatZero's own at its highest bid", { timeout: 120_000 }, async () => {
  const bids = PRACTICE_QUESTIONS.filter((q) => q.bid > 0)
  for (const q of bids) {
    const a = answerOf(practiceHand(q), q.bid)!
    assert.ok((q.sure ?? 0) >= SURE, `deal ${q.deal} seat ${q.seat}: SkatZero names its game`)
    if (a.kind === 'game' && a.game.contract.kind === 'suit') assert.equal(a.game.trumps, bestSuit(practiceHand(q)).trumps, `deal ${q.deal} seat ${q.seat}: the suit with most trumps`)
  }
  assert.ok(!PRACTICE_QUESTIONS.some((q) => q.deal === 889 && q.seat === 0), 'the 「第五题」 hand is gone')

  const pool = await loadPool(DIR)
  const policy = await loadPolicy(DIR)
  const rng = (label: string) => {
    let a = createHash('sha256').update(`skatgo-free-pool/1|${label}`).digest().readUInt32LE(0)
    return () => {
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const z = (c: Card) => c.suit + (c.rank === '10' ? 'T' : c.rank)
  const POSITION = { forehand: 0, middlehand: 1, rearhand: 2 } as const
  const sample = [...bids.filter((q) => solutionOf(q).contract !== 'G' && solutionOf(q).contract !== 'N').slice(0, 3), ...bids.filter((q) => solutionOf(q).contract === 'G').slice(0, 1)]
  for (const q of sample) {
    const d = pool.deals[q.deal]
    const g = deal(d.dealer, d.deck.split(' ').map(poolCard))
    const r = await seatGames(policy, g.hands[q.seat].map(z), POSITION[roleOf(q.seat as Seat, d.dealer)], shuffle(SKAT_PAIRS, rng(`skats|${q.deal}|${q.seat}`)), bidIndex(q.bid))
    const mode = contractOf(solutionOf(q).answer)
    assert.ok(r.pickupValue >= r.hand.value, `deal ${q.deal} seat ${q.seat}: SkatZero picks up`)
    assert.equal(Math.round(r.pickup[mode as keyof typeof r.pickup] * 100) / 100, q.sure, `deal ${q.deal} seat ${q.seat}: the recorded share`)
  }
})
