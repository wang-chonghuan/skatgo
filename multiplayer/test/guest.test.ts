import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { DEAL_OF_DAY } from '../../app/src/lib/skat/tournament'
import { dailyClaim, dayOf } from '../src/daily'
import { idsOf, playProfile, recordFreeDeal } from '../src/profile'
import { Store } from '../src/store'
import { xpBoard } from '../src/xp'

// A guest's games (SKATGO-182, the human: 「游客存档，登录后合并进账号」), against a database of its own: a device's free deals
// and deals of the day are its record; signing in on it takes them all into the account — today's entry moved as before,
// every other game through `player_aliases` — once, joined to the person the account already is; the past boards keep
// their rows; and the XP board counts them for the account, never for a guest.

const device = (c: string) => `anon:${c.repeat(64)}`
const summary = (scores: [number, number, number]) => {
  const at = scores.findIndex((s) => s !== 0 && s !== 40)
  const declarer = (at < 0 ? null : at) as 0 | 1 | 2 | null
  return { declarer, declaration: null, bid: 18, won: declarer === null ? null : scores[declarer] > 0, scores, detail: null }
}
const played = (scores: [number, number, number]) => { const s = summary(scores); return { scores, declarer: s.declarer, won: s.won } }

test('guest games: kept under the device, taken into the account at sign-in, once', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_guest_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  t.after(async () => {
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()
  // Signing in writes as the leader does.
  assert.ok(await store.acquire(() => {}))

  const a = device('a')
  const now = Date.UTC(2026, 10, 10, 12)
  const today = dayOf(now)
  // Device a: two free deals, a past day's deal of the day under the guest's name, and today's.
  const free = (player: string, n: number, scores: [number, number, number]) =>
    recordFreeDeal(store, { player, game: `free:p:${n}:${n}`, day: '2026-11-09', at: n, mine: played(scores), ai: played([0, 0, 40]) })
  await free(a, 1, [100, 0, 0])
  await free(a, 2, [0, 0, 40])
  for (const day of ['2026-11-08', today]) {
    await store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)',
      [day, DEAL_OF_DAY, JSON.stringify([{ benchmark: { summary: summary([60, 0, 0]), log: [] } }]), 'x'])
    await store.pool.query(
      'INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at, finished_at, nickname) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [day, DEAL_OF_DAY, a, '[]', JSON.stringify([summary([80, 0, 0])]), 80, 1, 2, 'Gast'])
  }

  // The device's record is its own games; no guest stands on the XP board.
  assert.deepEqual((await playProfile(store, a)).deals.map((d) => d.key), [`daily:2026-11-08:${DEAL_OF_DAY}:0`, 'free:p:1:1', 'free:p:2:2', `daily:${today}:${DEAL_OF_DAY}:0`])
  assert.deepEqual((await xpBoard(store, null)).rows, [])

  // Anna signs in on device a: everything of the device is hers; today's entry is hers, the past day's still the guest's.
  await dailyClaim(store, a, 'user:anna', now)
  const anna = (await playProfile(store, 'user:anna')).deals.map((d) => d.key)
  assert.deepEqual(anna.sort(), [`daily:2026-11-08:${DEAL_OF_DAY}:0`, `daily:${today}:${DEAL_OF_DAY}:0`, 'free:p:1:1', 'free:p:2:2'].sort())
  const { rows: past } = await store.pool.query('SELECT player, nickname FROM daily_entries WHERE day = $1', ['2026-11-08'])
  assert.deepEqual(past, [{ player: a, nickname: 'Gast' }])
  const { rows: moved } = await store.pool.query('SELECT player FROM daily_entries WHERE day = $1', [today])
  assert.deepEqual(moved, [{ player: 'user:anna' }])
  const board = (await xpBoard(store, 'user:anna')).rows
  assert.equal(board.length, 1)
  assert.equal(board[0].you, true)
  assert(board[0].xp > 0)

  // Signing in again changes nothing: each game once.
  await dailyClaim(store, a, 'user:anna', now)
  assert.equal((await playProfile(store, 'user:anna')).deals.length, 4)
  // The device stays with the first account; another account signing in on it takes none of it.
  await dailyClaim(store, a, 'user:ben', now)
  assert.equal((await playProfile(store, 'user:ben')).deals.length, 0)

  // An account that is already another's person (Olena is Alice, by hand): the device joins that person, not one step
  // removed, and a device that had another device's games brings them along.
  await store.pool.query('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', ['user:alice', 'user:olena'])
  const b = device('b')
  const c = device('c')
  await free(b, 3, [0, 72, 0])
  await free(c, 4, [0, 0, 72])
  await store.pool.query('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', [c, b])
  await dailyClaim(store, b, 'user:alice', now)
  assert.deepEqual(await idsOf(store, 'user:olena').then((ids) => ids.sort()), ['user:alice', 'user:olena', b, c].sort())
  assert.deepEqual((await playProfile(store, 'user:alice')).deals.map((d) => d.key).sort(), ['free:p:3:3', 'free:p:4:4'])
  // A device's own record never shows an account's: signed out on the device, its games only.
  assert.deepEqual((await playProfile(store, b)).deals.map((d) => d.key), ['free:p:3:3'])
})
