import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import express from 'express'
import pg from 'pg'
import { actor, deal } from '../../app/src/lib/skat/game'
import type { Logged } from '../src/computers'
import { deckOf, freeRoutes, loadPool, open, seal, tokenKey } from '../src/free'
import { applySeatMove } from '../src/model'
import { loadPolicy } from '../src/skatzero/policy'
import { Store } from '../src/store'

// SKATGO-170: a finished free deal played again is the same cards, and goes into no record whatever the page asks.

const DIR = new URL('../skatzero/', import.meta.url)
const KEY = 'k'.repeat(64)

test('a finished deal played again: the same cards, and no record of it', { timeout: 120_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_replay_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  await store.migrate()
  const [policy, pool] = await Promise.all([loadPolicy(DIR), loadPool(DIR)])
  const app = express()
  app.use('/free', freeRoutes(store, KEY, () => true, () => policy, () => pool))
  const http = app.listen(0)
  t.after(async () => {
    http.close()
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  const post = async (op: string, body: object) => {
    const r = await fetch(`http://127.0.0.1:${(http.address() as AddressInfo).port}/free/${op}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admission-key': KEY }, body: JSON.stringify(body) })
    return { status: r.status, data: await r.json() as { token: string; steps: { phase: string; hand: unknown; dealer: number }[]; revision: number; error?: string } }
  }
  const records = async () => Number((await store.pool.query('SELECT count(*) FROM play_deals')).rows[0].count)

  // A deal both computers pass, so all three passing ends it without a card played.
  const id = pool.deals.findIndex((d) => d.computers['1'].maxBid < 18 && d.computers['2'].maxBid < 18)
  assert(id >= 0, 'the pool has a deal both computers pass')
  const d = pool.deals[id]
  const key = tokenKey(KEY)
  const token = (log: Logged[]) => seal(key, { v: 1, pool: pool.version, id, t: Date.now(), log })
  let g = deal(d.dealer, deckOf(d.deck))
  const dealt = g.hands[0]
  const log: Logged[] = []
  while (g.phase === 'bidding') {
    const seat = actor(g)!
    const move = { type: 'bid', value: 'pass' } as const
    g = applySeatMove(g, seat, move)
    log.push({ seat, move })
  }
  assert.equal(g.phase, 'passedIn')

  // Not over yet: nothing to play again.
  assert.equal((await post('replay', { token: token([]) })).data.error, 'not_finished')

  // The deal itself goes into the record, once however often its review is asked.
  const first = token(log)
  assert.equal((await post('review', { token: first, player: 'user:anna' })).status, 200)
  assert.equal((await post('review', { token: first, player: 'user:anna' })).status, 200)
  assert.equal(await records(), 1)

  // Played again: the same cards and dealer, from the first move, under a token that says so.
  const again = await post('replay', { token: first })
  assert.equal(again.status, 200)
  assert.deepEqual(again.data.steps[0].hand, dealt)
  assert.equal(again.data.steps[0].dealer, d.dealer)
  assert.equal(again.data.steps[0].phase, 'bidding')

  // Its token stays one through its moves; its end is reviewed but recorded nowhere, whoever is named.
  let on = again.data
  while (on.steps.at(-1)!.phase === 'bidding') {
    const next = await post('act', { token: on.token, revision: on.revision, action: { type: 'bid', value: 'pass' } })
    assert.equal(next.status, 200)
    on = next.data
  }
  assert.equal(on.steps.at(-1)!.phase, 'passedIn')
  assert.equal(open<{ replay?: true }>(key, on.token).replay, true)
  assert.equal((await post('review', { token: on.token, player: 'user:anna' })).status, 200)
  assert.equal(await records(), 1)

  // And again from a replay.
  const third = await post('replay', { token: on.token })
  assert.equal(third.status, 200)
  assert.equal(open<{ replay?: true }>(key, third.data.token).replay, true)
  assert.equal(await records(), 1)
})
