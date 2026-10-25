import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { daysOf } from '../../app/src/lib/skat/profile'
import { DAILY_DEALS } from '../../app/src/lib/skat/tournament'
import { playProfile, recordFreeDeal } from '../src/profile'
import { Store } from '../src/store'

// A player's record of play (SKATGO-128) against a database of its own: the tournament's deals with the AI's on
// the same cards, free deals recorded once per game, and the ids one person plays under counted as one.

const summary = (score: number) => ({ declarer: 0, declaration: null, bid: 18, won: score > 0, scores: [score, 0, 0], detail: null })

test('profile: tournament and free deals, once each, the aliases as one person', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_profile_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  t.after(async () => {
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()

  // A day whose first two deals the AI played for +70 and −90 from the player's seat; the player finished two.
  const specs = [{ benchmark: { summary: summary(70), log: [] } }, { benchmark: { summary: summary(-90), log: [] } }]
  await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', ['2026-10-20', DAILY_DEALS, JSON.stringify(specs), 'x'])
  await store.pool.query(
    'INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    ['2026-10-20', DAILY_DEALS, 'anon:guestday', '[]', JSON.stringify([summary(120), summary(-50)]), 70, 1000])
  // The guest day is the account's, as the human names it.
  await store.pool.query('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', ['anon:guestday', 'user:anna'])

  // A free deal, its review asked twice: one deal.
  const free = { player: 'user:anna', game: 'free:p:7:123', day: '2026-10-21', at: 5000, score: 66, ai: -100 }
  await recordFreeDeal(store, free)
  await recordFreeDeal(store, { ...free, at: 6000 })
  // Someone else's deal is not hers.
  await recordFreeDeal(store, { ...free, player: 'user:ben' })

  const { deals } = await playProfile(store, 'user:anna')
  assert.deepEqual(deals, [
    { day: '2026-10-20', source: 'daily', score: 120, ai: 70 },
    { day: '2026-10-20', source: 'daily', score: -50, ai: -90 },
    { day: '2026-10-21', source: 'free', score: 66, ai: -100 },
  ])
  // Asked under the alias, the same person.
  assert.deepEqual((await playProfile(store, 'anon:guestday')).deals, deals)
  assert.deepEqual(daysOf(deals), [
    { day: '2026-10-21', deals: 1, againstAi: 166 },
    { day: '2026-10-20', deals: 2, againstAi: 90 },
  ])
  assert.deepEqual((await playProfile(store, 'user:nobody')).deals, [])
})
