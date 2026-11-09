import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { DAILY_DEALS, DEAL_OF_DAY } from '../../app/src/lib/skat/tournament'
import { recordFreeDeal } from '../src/profile'
import { Store } from '../src/store'
import { xpBoard } from '../src/xp'

// The XP board (SKATGO-172) against a database of its own: every deal of every account from XP_SINCE (Monday 2 November)
// on summed by their tier against the AI, later weeks' too and none before (SKATGO-179: no weekly reset), a guest's own deals off the board, the ids one person plays under counted
// as one, each person's win rate over all their deals (SKATGO-178), and the asker's row marked.

// The player declared when their own score is a game's (not 0 or a defender's 40).
const declarerOf = (scores: [number, number, number]): 0 | null => (scores[0] !== 0 && scores[0] !== 40 ? 0 : null)
const summary = (scores: [number, number, number]) => ({ declarer: declarerOf(scores), declaration: null, bid: 18, won: scores[0] > 0, scores, detail: null })
const played = (scores: [number, number, number]) => ({ scores, declarer: declarerOf(scores), won: scores[0] > 0 })

test('xp: every deal since the start by tier, aliases as one person, guests off the board', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_xp_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  t.after(async () => {
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()
  const day = async (d: string, size: number, ai: [number, number, number][]) =>
    store.pool.query('INSERT INTO daily_deals (day, size, deals, computer) VALUES ($1, $2, $3, $4)', [d, size, JSON.stringify(ai.map((s) => ({ benchmark: { summary: summary(s), log: [] } }))), 'x'])
  const entry = (d: string, size: number, player: string, mine: [number, number, number][]) =>
    store.pool.query('INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [d, size, player, '[]', JSON.stringify(mine.map(summary)), 0, 1])

  await day('2026-11-03', DAILY_DEALS, [[70, 0, 0], [0, 0, 0]])
  await day('2026-11-05', DEAL_OF_DAY, [[0, 0, 0]])
  await day('2026-10-28', DEAL_OF_DAY, [[0, 0, 0]])
  // Anna: 50 above the AI (20) in her own game (+2), the same (10) defending; a free deal 166 above (20) in her own game
  // (+2); as a guest on another device, signed up later, 60 below (4) in her own game (+2). 60 XP; two of her three games won,
  // the deal all passed left out of the win rate.
  await entry('2026-11-03', DAILY_DEALS, 'user:anna', [[120, 0, 0], [0, 0, 0]])
  await recordFreeDeal(store, { player: 'user:anna', game: 'free:p:1:1', day: '2026-11-04', at: 1, mine: played([66, 0, 0]), ai: played([-100, 40, 40]) })
  await entry('2026-11-05', DEAL_OF_DAY, 'anon:guest', [[-60, 0, 0]])
  await store.pool.query('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', ['anon:guest', 'user:anna'])
  // Ben: 10 below (6) in his own game (+2) today, won; defending, the same as the AI (10) and the declarer won, so his
  // side lost: 18 XP, half his games won; his deal before the start does not count.
  await recordFreeDeal(store, { player: 'user:ben', game: 'free:p:2:1', day: '2026-11-05', at: 1, mine: played([30, 0, 0]), ai: played([40, 0, 0]) })
  await recordFreeDeal(store, { player: 'user:ben', game: 'free:p:2:2', day: '2026-11-05', at: 2, mine: { scores: [0, 50, 0], declarer: 1, won: true }, ai: { scores: [0, 50, 0], declarer: 1, won: true } })
  await entry('2026-10-28', DEAL_OF_DAY, 'user:ben', [[200, 0, 0]])
  // A guest's own deal, and an account seen only before the start: neither is on the board.
  await entry('2026-11-05', DEAL_OF_DAY, 'anon:stranger', [[100, 0, 0]])
  await entry('2026-10-28', DEAL_OF_DAY, 'user:carl', [[100, 0, 0]])
  // Dora: one deal on Monday, all passed — on the board with no win rate.
  await recordFreeDeal(store, { player: 'user:dora', game: 'free:p:3:1', day: '2026-11-02', at: 1, mine: played([0, 0, 0]), ai: played([0, 0, 0]) })
  await store.pool.query("INSERT INTO daily_players (player, nickname, created_at) VALUES ('user:anna', 'Anna', 1), ('user:ben', 'Ben', 1), ('user:dora', 'Dora', 1), ('user:carl', 'Carl', 1)")

  assert.deepEqual(await xpBoard(store, 'anon:guest'), {
    rows: [
      { rank: 1, nickname: 'Anna', xp: 60, winRate: 67, you: true },
      { rank: 2, nickname: 'Ben', xp: 18, winRate: 50 },
      { rank: 3, nickname: 'Dora', xp: 10, winRate: null },
    ],
  })
  // A later week's deal adds to the same board; asked as nobody, no row is marked.
  await recordFreeDeal(store, { player: 'user:dora', game: 'free:p:3:2', day: '2026-11-10', at: 2, mine: played([0, 0, 0]), ai: played([0, 0, 0]) })
  assert.equal((await xpBoard(store, null)).rows.find((r) => r.nickname === 'Dora')?.xp, 20)
  assert.equal((await xpBoard(store, null)).rows.some((r) => r.you), false)
})
