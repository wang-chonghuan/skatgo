import test from 'node:test'
import assert from 'node:assert/strict'
import { type Card, cardId } from '../../app/src/lib/skat/cards'
import { deal, next, type Seat } from '../../app/src/lib/skat/game'
import { PRACTICE_QUESTIONS, answerOf, optionsOf, practiceHand } from '../../app/src/lib/skat/bidding/practice'
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
    assert.ok(optionsOf(hand, q.bid).includes(q.bid), `deal ${q.deal} seat ${q.seat}: the answer is offered`)
  }
})
