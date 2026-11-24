import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { dailyClaim } from '../src/daily'
import { GONE, forgetPlayer } from '../src/forget'
import { forumComment, forumCreate, forumPost } from '../src/forum'
import { idsOf, recordFreeDeal } from '../src/profile'
import { Store } from '../src/store'
import type { Played } from '../../app/src/lib/skat/profile'

// An account deleted by its owner (SKATGO-185), against a database of its own: every row held under the account and the
// devices signed in to it goes; its forum posts and comments stay, under no one; nobody else's rows move; a hand-written
// alias to another account leaves that account its person; asking twice is the same as once.

const device = (c: string) => `anon:${c.repeat(64)}`
const played: Played = { scores: [60, 0, 0], declarer: 0, won: true }
const USER_TABLES: [string, string][] = [
  ['daily_entries', 'player'], ['daily_players', 'player'], ['play_deals', 'player'], ['ladder_answers', 'player'],
  ['bidding_answers', 'player'], ['profile_notes', 'player'], ['dod_shares', 'player'], ['account_referrals', 'account'],
  ['account_referrals', 'referrer'], ['forum_reports', 'reporter'], ['forum_posts', 'author'], ['forum_comments', 'author'],
  ['player_aliases', 'player'], ['player_aliases', 'same_as'],
]

test('forget: an account and its devices leave every table; its forum writing stays anonymous', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_forget_${randomBytes(6).toString('hex')}`
  await server.query(`CREATE DATABASE "${name}"`)
  base.pathname = `/${name}`
  const store = new Store(base.href)
  t.after(async () => {
    await store.close()
    await server.query(`DROP DATABASE "${name}" WITH (FORCE)`)
    await server.end()
  })
  await store.migrate()
  assert.ok(await store.acquire(() => {}))
  const q = (sql: string, args: unknown[] = []) => store.pool.query(sql, args)
  const count = async (who: string) => {
    let n = 0
    for (const [table, column] of USER_TABLES) n += Number((await q(`SELECT count(*) FROM ${table} WHERE ${column} = $1`, [who])).rows[0].count)
    return n
  }

  // Anna, signed in on device a, and Ben: each with something in every table.
  const a = device('a')
  const now = Date.UTC(2026, 10, 10, 12)
  await q("INSERT INTO daily_deals (day, size, deals, computer) VALUES ('2026-11-09', 6, '[]', 'x')")
  for (const who of ['user:anna', 'user:ben', a]) {
    await recordFreeDeal(store, { player: who, game: `free:p:1:${who}`, day: '2026-11-09', at: 1, mine: played, ai: played })
    await q("INSERT INTO daily_entries (day, size, player, actions, deals, total, created_at, finished_at, nickname) VALUES ('2026-11-09', 6, $1, '[]', '[]', 60, 1, 2, $1)", [who])
  }
  await dailyClaim(store, a, 'user:anna', now)
  for (const who of ['user:anna', 'user:ben']) {
    await q('INSERT INTO daily_players (player, nickname, created_at) VALUES ($1, $2, 1)', [who, who === 'user:anna' ? 'Anna' : 'Ben'])
    await q("INSERT INTO ladder_answers (player, step, solved_at, updated_at) VALUES ($1, 's1', 1, 1)", [who])
    await q("INSERT INTO bidding_answers (player, question, first, answered_at, updated_at) VALUES ($1, 'v2-1-0', 18, 1, 1)", [who])
    await q("INSERT INTO profile_notes (player, week, lang, body, created_at) VALUES ($1, '2026-11-02', 'en', 'x', 1)", [who])
    await q("INSERT INTO dod_shares (code, day, player, scores, created_at) VALUES ($1, '2026-11-09', $2, '[0,0,0]', 1)", [who.slice(5, 9).padEnd(8, 'x'), who])
  }
  await q("INSERT INTO account_referrals (account, referrer, room_id, created_at) VALUES ('user:anna', 'user:ben', 'r', 1), ('user:ben', 'user:anna', 'r', 1)")
  const post = await forumCreate(store, { player: 'user:anna', official: false, section: 'talk', title: 'Annas Frage zum Reizen', body: 'Wie hoch?' }, now)
  await forumComment(store, { player: 'user:anna', official: false, post: post.id, body: 'Noch eine Frage' }, now + 1)
  await forumComment(store, { player: 'user:ben', official: false, post: post.id, body: 'Bis 18' }, now + 2)
  await q("INSERT INTO forum_reports (post_id, reporter, created_at) VALUES ($1, 'user:anna', 1), ($1, 'user:ben', 2)", [post.id])
  const benBefore = await count('user:ben')

  assert.deepEqual(await forgetPlayer(store, 'user:anna'), { forgotten: true })

  // Nothing is left under Anna or her device; Ben has everything he had but the two referrals that named Anna.
  assert.equal(await count('user:anna'), 0)
  assert.equal(await count(a), 0)
  assert.equal(await count('user:ben'), benBefore - 2)
  // Her post and comment stand under no one; Ben's comment is his.
  const shown = await forumPost(store, { player: 'user:ben', official: false, id: post.id })
  assert.equal(shown.post.author, '')
  assert.deepEqual(shown.post.thread.map((c) => c.author), ['', 'Ben'])
  assert.equal(Number((await q('SELECT count(*) FROM forum_posts WHERE author = $1', [GONE])).rows[0].count), 1)
  // Asking again changes nothing.
  await forgetPlayer(store, 'user:anna')
  assert.equal(await count('user:ben'), benBefore - 2)

  // Olena is Alice, by hand, and device b signed in to Alice: deleting Olena, the person everyone points to, leaves Alice
  // the person with her device.
  const b = device('b')
  await q('INSERT INTO player_aliases (player, same_as) VALUES ($1, $2)', ['user:alice', 'user:olena'])
  await recordFreeDeal(store, { player: b, game: 'free:p:2:b', day: '2026-11-09', at: 2, mine: played, ai: played })
  await recordFreeDeal(store, { player: 'user:olena', game: 'free:p:2:o', day: '2026-11-09', at: 2, mine: played, ai: played })
  await dailyClaim(store, b, 'user:alice', now)
  await forgetPlayer(store, 'user:olena')
  assert.equal(await count('user:olena'), 0)
  assert.deepEqual((await idsOf(store, 'user:alice')).sort(), ['user:alice', b].sort())
  assert.equal(Number((await q('SELECT count(*) FROM play_deals WHERE player = $1', [b])).rows[0].count), 1)
})
