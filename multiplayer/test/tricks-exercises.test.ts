import test from 'node:test'
import assert from 'node:assert/strict'
import { type Card, cardId, sameCard } from '../../app/src/lib/skat/cards'
import { EXERCISES } from '../../app/src/lib/skat/tricks/exercises/positions'
import type { Exercise, Judge } from '../../app/src/lib/skat/tricks/exercises/types'
import { raw } from '../src/computers'
import { SKAT_PAIRS, seatBidding } from '../src/skatzero/bidding'
import { type Policy, loadPolicy } from '../src/skatzero/policy'
import { type Valued, cardValues, discardValues, gameValues } from './tricks-judge'

// The Skat-Tricks exercises SkatZero judges (SKATGO-103): what to bid, put away, play or lead. Each answer
// must be SkatZero's own choice, and better than the next choice by at least MARGIN game points — so no
// exercise asks a question two good players would answer differently. The exact exercises are the app's
// tests' (lib/skat/tricks/exercises/exercises.test.ts).

const DIR = new URL('../skatzero/', import.meta.url)
export const MARGIN = 10

const ids = (cs: Card[]) => cs.map(cardId).sort().join(' ')

/** The answer's value and the best value of any other option, as SkatZero weighs them. */
export async function judged(policy: Policy, e: Exercise): Promise<{ answer: number; other: number; ranking: string[] }> {
  if (e.proof.by !== 'skatzero') throw new Error('not_skatzero')
  const j: Judge = e.proof.judge
  const split = <T>(list: Valued<T>[], right: (o: T) => boolean, label: (o: T) => string) => {
    const r = list.filter((v) => right(v.option))
    const w = list.filter((v) => !right(v.option))
    assert.ok(r.length > 0 && w.length > 0, `${e.id}: the answer must be one option among others`)
    return { answer: Math.min(...r.map((v) => v.value)), other: Math.max(...w.map((v) => v.value)), ranking: list.map((v) => `${label(v.option)} ${v.value.toFixed(1)}`) }
  }
  if (j.kind === 'card') {
    assert.equal(e.ask.kind, 'play')
    const ask = e.ask as Extract<Exercise['ask'], { kind: 'play' }>
    const values = await cardValues(policy, { contract: ask.contract, me: j.me, hand: ask.hand, trace: j.trace, skat: j.skat, points: j.points, handGame: j.handGame, openCards: null })
    return split(values, (c) => ask.best.some((b) => sameCard(b, c)), cardId)
  }
  if (j.kind === 'discard') {
    assert.equal(e.ask.kind, 'pick')
    const ask = e.ask as Extract<Exercise['ask'], { kind: 'pick' }>
    const values = await discardValues(policy, ask.cards, j.game, j.position)
    return split(values, (pair) => ids(pair) === ids(ask.correct), ids)
  }
  if (j.kind === 'game') {
    assert.equal(e.ask.kind, 'choice')
    const ask = e.ask as Extract<Exercise['ask'], { kind: 'choice' }>
    const row = e.situation.rows.find((r) => r.kind === 'hand12')
    assert.ok(row, `${e.id}: twelve cards to judge`)
    const right = ask.options[ask.answer]
    assert.equal(right.kind, 'game')
    // Every game on offer is weighed; the answer must beat the best of the others.
    const offered = ask.options.flatMap((o) => (o.kind === 'game' ? [o.game] : []))
    const values = (await gameValues(policy, row.cards, j.position, j.bid)).filter((v) => offered.includes(v.option))
    return split(values, (g) => right.kind === 'game' && g === right.game, String)
  }
  // A bid: SkatZero's highest bid from these ten cards, against the bid asked about.
  assert.equal(e.ask.kind, 'choice')
  const ask = e.ask as Extract<Exercise['ask'], { kind: 'choice' }>
  const hand = e.situation.rows.find((r) => r.kind === 'hand')
  assert.ok(hand && hand.kind === 'hand')
  const b = await seatBidding(policy, hand.cards.map(raw), j.position, SKAT_PAIRS)
  const top = b.maxBid >= 18 ? b.maxBid : 0
  // Option 0 is "say it", option 1 "pass"; the gap is how far SkatZero's limit is from the bid.
  const says = top >= j.bid
  assert.equal(ask.answer, says ? 0 : 1, `${e.id}: SkatZero would ${says ? 'bid' : 'pass'} (highest bid ${top})`)
  // Clearly: a hand that bids goes at least two steps past the bid; a hand that passes would not even say 18.
  assert.ok(says ? top >= j.bid + 4 : top === 0, `${e.id}: SkatZero's highest bid ${top} is too close to ${j.bid}`)
  return { answer: top, other: j.bid, ranking: [`highest bid ${top}`] }
}

test('every SkatZero exercise is SkatZero\'s choice, clearly ahead of the next', { timeout: 300_000 }, async () => {
  const policy = await loadPolicy(DIR)
  try {
    const judgedOnes = EXERCISES.filter((e) => e.proof.by === 'skatzero')
    assert.ok(judgedOnes.length > 0)
    for (const e of judgedOnes) {
      const r = await judged(policy, e)
      if (e.proof.by === 'skatzero' && e.proof.judge.kind === 'bid') continue
      assert.ok(r.answer - r.other >= MARGIN, `${e.id}: answer ${r.answer.toFixed(1)}, next ${r.other.toFixed(1)} — ${r.ranking.join(', ')}`)
    }
  } finally {
    await policy.release()
  }
})
