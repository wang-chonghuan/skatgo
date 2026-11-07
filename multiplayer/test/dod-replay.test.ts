import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import express from 'express'
import pg from 'pg'
import { legalPlays } from '../../app/src/lib/skat/cards'
import { DEAL_OF_DAY, type SeatView, gameFromView } from '../../app/src/lib/skat/tournament'
import { HEURISTIC, dayBefore, dayOf, dealDay } from '../src/daily'
import { shareRoutes } from '../src/shares'
import { loadPolicy } from '../src/skatzero/policy'
import { Store } from '../src/store'

// SKATGO-177 (the human: 「每天1deal的，应该也能复盘」): today's deal of the day played again, as a past day's is practised —
// but only by a player who has finished it, so no one plays it unranked first; its end has the review, and nothing of it
// is recorded.

const DIR = new URL('../skatzero/', import.meta.url)
const KEY = 'k'.repeat(64)

test('today’s deal of the day once more: only after finishing it, reviewed, recorded nowhere', { timeout: 120_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_dodreplay_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  await store.migrate()
  const policy = await loadPolicy(DIR)
  const app = express()
  app.use('/share', shareRoutes(store, KEY, () => true, () => policy))
  const http = app.listen(0)
  t.after(async () => {
    http.close()
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  type Reply = { token: string; steps: SeatView[]; revision: number; result: unknown; error?: string }
  const post = async (op: string, body: object) => {
    const r = await fetch(`http://127.0.0.1:${(http.address() as AddressInfo).port}/share/${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': KEY }, body: JSON.stringify(body) })
    return { status: r.status, data: (await r.json()) as Reply & Record<string, unknown> }
  }
  const rows = async () => Number((await store.pool.query('SELECT (SELECT count(*) FROM daily_entries) + (SELECT count(*) FROM play_deals) AS n')).rows[0].n)

  const day = dayOf(Date.now())
  const spec = dealDay()[0]
  await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', [day, DEAL_OF_DAY, JSON.stringify([spec]), HEURISTIC])
  const anna = 'user:anna'

  // Nobody, and a player who has not finished it, may not play today's deal unranked.
  assert.equal((await post('practice/new', { day })).data.error, 'not_past')
  assert.equal((await post('practice/new', { day, player: anna })).data.error, 'not_past')
  await store.pool.query('INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, 0, $6)', [day, DEAL_OF_DAY, anna, '[]', '[]', Date.now()])
  assert.equal((await post('practice/new', { day, player: anna })).data.error, 'not_past', 'started is not finished')
  // A day still to come is no one's.
  assert.equal((await post('practice/new', { day: '2999-01-01', player: anna })).data.error, 'not_past')

  // Finished: the same deal, from the first move.
  await store.pool.query('UPDATE daily_entries SET finished_at = $1 WHERE player = $2', [Date.now(), anna])
  const before = await rows()
  let on = (await post('practice/new', { day, player: anna })).data
  assert.ok(on.token, JSON.stringify(on).slice(0, 200))
  assert.equal(on.steps[0].phase, 'bidding')
  assert.equal(on.steps[0].dealer, spec.dealer)

  // Not over yet: no review.
  assert.equal((await post('practice/review', { token: on.token })).data.error, 'not_finished')

  // Played out — the player passes and, defending, plays the first card it may — then reviewed.
  for (let n = 0; n < 40 && !on.result; n++) {
    const g = gameFromView(on.steps.at(-1)!)
    const action = g.phase === 'bidding' ? { type: 'bid', value: 'pass' } : { type: 'play', card: legalPlays(g.hands[0], g.trick.map((p) => p.card), g.declaration!.contract)[0] }
    const next = await post('practice/act', { token: on.token, revision: on.revision, action })
    assert.equal(next.status, 200, JSON.stringify(next.data).slice(0, 200))
    on = next.data
  }
  assert.ok(on.result, 'the replay ends')
  const review = await post('practice/review', { token: on.token })
  assert.equal(review.status, 200)
  assert.ok(Array.isArray(review.data.differs) && Array.isArray(review.data.tricks))
  assert.equal(await rows(), before, 'nothing recorded')

  // A past day's deal is still anyone's practice.
  await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', [dayBefore(day), DEAL_OF_DAY, JSON.stringify([spec]), HEURISTIC])
  assert.equal((await post('practice/new', { day: dayBefore(day) })).status, 200)
})
