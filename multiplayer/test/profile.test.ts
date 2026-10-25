import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { againstAi, daysOf, trendOf } from '../../app/src/lib/skat/profile'
import { DAILY_DEALS } from '../../app/src/lib/skat/tournament'
import { playProfile, recordFreeDeal } from '../src/profile'
import { Store } from '../src/store'

// A player's record of play (SKATGO-128) against a database of its own: the tournament's deals with the AI's on
// the same cards, the twelve-deal tournament's kept rows too, free deals recorded once per game, the ids one person
// plays under counted as one, and each deal judged against the whole table.

const summary = (scores: [number, number, number]) => ({ declarer: 0, declaration: null, bid: 18, won: scores[0] > 0, scores, detail: null })

test('profile: tournament and free deals, once each, the aliases as one person, against the table', { timeout: 60_000 }, async (t) => {
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

  // A day of two deals. The first the player won for 120 where the AI won 70: +240 against the table against +140, so
  // +100. In the second both defended a game the right-hand seat won, the AI letting it win 110, the player only 90:
  // −90 against −110, so +20 — defence that Seeger-Fabian alone, 0 for both defenders, does not show.
  const specs = [{ benchmark: { summary: summary([70, 0, 0]), log: [] } }, { benchmark: { summary: summary([0, 0, 110]), log: [] } }]
  await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', ['2026-10-20', DAILY_DEALS, JSON.stringify(specs), 'x'])
  await store.pool.query(
    'INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    ['2026-10-20', DAILY_DEALS, 'anon:guestday', '[]', JSON.stringify([summary([120, 0, 0]), summary([0, 0, 90])]), 120, 1000])
  // The same day's twelve-deal tournament (SKATGO-77's kept rows) counts too: +80 against −40, so +120.
  await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', ['2026-10-20', 12, JSON.stringify([{ benchmark: { summary: summary([-20, 0, 0]), log: [] } }]), 'x'])
  await store.pool.query(
    'INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    ['2026-10-20', 12, 'user:anna', '[]', JSON.stringify([summary([40, 0, 0])]), 40, 2000])
  // The guest day is the account's, as the human names it.
  await store.pool.query('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', ['anon:guestday', 'user:anna'])

  // A free deal, its review asked twice: one deal. +132 against the AI's lost game, −280: +412.
  const free = { player: 'user:anna', game: 'free:p:7:123', day: '2026-10-21', at: 5000, mine: [66, 0, 0] as [number, number, number], ai: [-100, 40, 40] as [number, number, number] }
  await recordFreeDeal(store, free)
  await recordFreeDeal(store, { ...free, at: 6000 })
  // Someone else's deal is not hers.
  await recordFreeDeal(store, { ...free, player: 'user:ben' })

  const { deals } = await playProfile(store, 'user:anna')
  assert.deepEqual(deals, [
    { day: '2026-10-20', source: 'daily', mine: [120, 0, 0], ai: [70, 0, 0] },
    { day: '2026-10-20', source: 'daily', mine: [0, 0, 90], ai: [0, 0, 110] },
    { day: '2026-10-20', source: 'daily', mine: [40, 0, 0], ai: [-20, 0, 0] },
    { day: '2026-10-21', source: 'free', mine: [66, 0, 0], ai: [-100, 40, 40] },
  ])
  assert.deepEqual(deals.map(againstAi), [100, 20, 120, 412])
  // Asked under the alias, the same person.
  assert.deepEqual((await playProfile(store, 'anon:guestday')).deals, deals)
  assert.deepEqual(daysOf(deals), [
    { day: '2026-10-20', deals: 3, perDeal: 80 },
    { day: '2026-10-21', deals: 1, perDeal: 412 },
  ])
  // One deal of +412 after three averaging +80 is still within the noise of single deals.
  assert.deepEqual(trendOf(deals), { last: 412, before: 80, verdict: 'same' })
  assert.deepEqual((await playProfile(store, 'user:nobody')).deals, [])
})
