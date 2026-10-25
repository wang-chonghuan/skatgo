import test from 'node:test'
import assert from 'node:assert/strict'
import type { DealSummary } from '../../app/src/lib/skat/tournament'
import { type DealPick, kindOf, pickOfDay } from '../src/pick'

// The deal of the day's choosing (SKATGO-131): the four kinds, read from the AI's game in the player's seat, and the
// pick among candidates — never the kind of the day before, the contract rotating, the closest win first.

const game = (o: { declarer: 0 | 1 | 2 | null; kind?: 'suit' | 'grand' | 'null'; won?: boolean; points?: number; schneider?: boolean }): DealSummary => ({
  declarer: o.declarer,
  declaration: o.declarer === null ? null : ({ contract: o.kind === 'suit' || !o.kind ? { kind: 'suit', trump: 'H' } : { kind: o.kind } } as DealSummary['declaration']),
  bid: 18,
  won: o.declarer === null ? null : !!o.won,
  scores: [0, 0, 0],
  detail: o.declarer === null ? null : { value: 40, declarerPoints: o.points ?? 70, defenderPoints: 120 - (o.points ?? 70), overbid: false, schneider: !!o.schneider, schwarz: false },
})

test('the four kinds, and what is none of them', () => {
  assert.equal(kindOf(game({ declarer: 0, won: true, points: 70 }))?.kind, 'closeWin')
  assert.equal(kindOf(game({ declarer: 0, won: true, points: 89 }))?.kind, 'closeWin')
  assert.equal(kindOf(game({ declarer: 0, kind: 'null', won: true, points: 0 }))?.kind, 'nullWin')
  assert.equal(kindOf(game({ declarer: 0, kind: 'grand', won: true, points: 95, schneider: true }))?.kind, 'bigWin')
  assert.equal(kindOf(game({ declarer: 2, won: false, points: 50 }))?.kind, 'defended')
  // Lost as declarer, the opponents' won game, all passed: none of the four.
  assert.equal(kindOf(game({ declarer: 0, won: false, points: 50 })), null)
  assert.equal(kindOf(game({ declarer: 1, won: true, points: 80 })), null)
  assert.equal(kindOf(game({ declarer: null })), null)
})

const pick = (kind: DealPick['kind'], contract: DealPick['contract'], declarerPoints = 70): DealPick => ({ kind, contract, declarerPoints })

test('never the kind of the day before; the contract rotates; the closest win first', () => {
  const offered = [
    { item: 'a', pick: pick('closeWin', 'suit', 85) },
    { item: 'b', pick: pick('closeWin', 'grand', 64) },
    { item: 'c', pick: pick('defended', 'suit') },
  ]
  // Yesterday a close win: only the defended deal may be taken, whatever the draw.
  for (const r of [0, 0.5, 0.99]) assert.equal(pickOfDay(offered, [pick('closeWin', 'suit')], () => r)?.item, 'c')
  // Drawing a close win after a defended day: the Grand at 64 — a contract the last days have not had, and closer.
  assert.equal(pickOfDay(offered, [pick('defended', 'suit')], () => 0)?.item, 'b')
  // With Grands the last two days, the suit game is taken though it is the less close.
  assert.equal(pickOfDay(offered.slice(0, 2), [pick('bigWin', 'grand'), pick('defended', 'grand')], () => 0)?.item, 'a')
  // Only yesterday's kind on offer: nothing may be taken yet.
  assert.equal(pickOfDay(offered.slice(2), [pick('defended', 'null')], () => 0), null)
  assert.equal(pickOfDay([], [], () => 0), null)
})
