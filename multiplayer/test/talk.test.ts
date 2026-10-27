import test from 'node:test'
import assert from 'node:assert/strict'
import { actor, deal, type Seat } from '../../app/src/lib/skat/game'
import { advance, computerTurn, type Logged } from '../src/computers'
import { deckOf, loadPool, plan } from '../src/free'
import { loadPolicy } from '../src/skatzero/policy'
import { momentOf, SLIP, STRONG, type TalkKind, verdictOf } from '../src/talk'

// Lina's and Noah's table talk (SKATGO-142): which moment a deal's record holds, once each kind per deal, while the deal
// is still played, and what the model is told — never a card not yet played.

const DIR = new URL('../skatzero/', import.meta.url)
const SUIT = { C: 'Clubs', S: 'Spades', H: 'Hearts', D: 'Diamonds' } as const
const RANK = { A: 'Ace', '10': 'Ten', K: 'King', Q: 'Queen', J: 'Jack', '9': 'Nine', '8': 'Eight', '7': 'Seven' } as const

test('a card is a slip well below the best, strong when clearly the best', () => {
  const c = (rank: '7' | '8' | 'A') => ({ suit: 'S' as const, rank })
  assert.equal(verdictOf([{ card: c('A'), value: 30 }, { card: c('7'), value: 30 - SLIP }], c('7')), 'slip')
  assert.equal(verdictOf([{ card: c('A'), value: 30 }, { card: c('7'), value: 30 - STRONG }], c('A')), 'strong')
  assert.equal(verdictOf([{ card: c('A'), value: 30 }, { card: c('7'), value: 29 }], c('7')), null)
  assert.equal(verdictOf([{ card: c('A'), value: 30 }], c('A')), null)
})

test('a deal talks three times while it is played — once on an early end — once per kind, naming only cards already played', { timeout: 300_000 }, async () => {
  const [policy, pool] = await Promise.all([loadPolicy(DIR), loadPool(DIR)])
  try {
    let full = 0
    for (const n of [3, 11, 42, 77, 150, 401, 512, 733]) {
      const d = pool.deals[n]
      const plans = { 0: plan(d.computers['0']), 1: plan(d.computers['1']), 2: plan(d.computers['2']) }
      const log: Logged[] = []
      const end = await advance(deal(d.dealer, deckOf(d.deck)), log, (g) => computerTurn(g, actor(g)!, plans[actor(g)!], policy), undefined, true)
      // The browser asks after each move of the human's seat, as free play's replies come. SkatZero is asked nothing
      // here: with no card judged, the windows' last tricks still give three lines.
      const said: TalkKind[] = []
      for (let k = 1; k <= log.length; k++) {
        if (log[k - 1].seat !== (0 as Seat) && k < log.length) continue
        const upTo = log.slice(0, k)
        const moment = await momentOf(d.dealer, deckOf(d.deck), upTo, said, d.computers['0'].maxBid, async () => null)
        if (!moment) continue
        assert.ok(!said.includes(moment.kind), `${moment.kind} said twice in deal ${n}`)
        said.push(moment.kind)
        assert.ok([1, 2].includes(moment.speaker))
        const told = JSON.stringify(moment.facts)
        const trick = /Trick (\d+) of 10/.exec(told)
        if (trick) assert.ok(Number(trick[1]) <= 9, `deal ${n} talks about trick ${trick[1]}`)
        const played = new Set(upTo.flatMap((e) => (e.move.type === 'play' ? [`${SUIT[e.move.card.suit]} ${RANK[e.move.card.rank]}`] : [])))
        for (const s of Object.values(SUIT)) for (const r of Object.values(RANK)) {
          if (told.includes(`${s} ${r}`)) assert.ok(played.has(`${s} ${r}`), `deal ${n} names ${s} ${r} before it was played`)
        }
      }
      assert.ok(said.length <= 3)
      // A deal played to its end talks three times; one decided early talks once on its end, after what came before.
      if (end.phase === 'done' && !end.early && end.tricks.length === 10) {
        assert.equal(said.length, 3, `deal ${n}: ${said.join(',')}`)
        full += 1
      }
      if (end.early) assert.ok(said.at(-1) === 'end' || said.length === 3, `deal ${n}: ${said.join(',')}`)
    }
    assert.ok(full > 0, 'some deal was played to its end')
  } finally {
    await policy.release()
  }
})
