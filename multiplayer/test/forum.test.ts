import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { ANNOUNCEMENT_DAYS, DAILY_LIMITS } from '../../app/src/lib/forum'
import {
  forumComment, forumCreate, forumDelete, forumLatest, forumList, forumModerate, forumPost, forumReport, forumReports, forumSitemap,
} from '../src/forum'
import { Store } from '../src/store'

// The forum (SKATGO-118) against a database of its own: who may write where, what hidden content shows to whom,
// what search engines are offered, and the daily limits.

const DAY = 24 * 60 * 60 * 1000
const admin = { player: 'user:admin', official: true }
const anna = { player: 'user:anna', official: false }
const ben = { player: 'user:ben', official: false }
const guest = { player: null, official: false }

test('forum: sections, visibility, moderation, search and limits', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_forum_${randomBytes(6).toString('hex')}`
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

  // Each write a millisecond apart, so the order of activity is the order written.
  let clock = Date.now() - 60_000
  const tick = () => ++clock

  // Only the official announces.
  await assert.rejects(forumCreate(store, { ...anna, locale: 'de', section: 'news', title: 'Neu hier', body: 'Hallo' }, tick()), { name: 'Error' })
  const news = await forumCreate(store, { ...admin, locale: 'de', section: 'news', title: 'Turnier am Sonntag', body: 'Alle sind eingeladen.' }, tick())
  const article = await forumCreate(store, { ...admin, locale: 'de', section: 'articles', title: 'Wann Grand?', body: '## Regel\n[♣B ♠B ♥A]' }, tick())
  const post = await forumCreate(store, { ...anna, locale: 'de', section: 'talk', title: 'Frage zum Reizen', body: 'Wie weit reize ich?' }, tick())
  const feedback = await forumCreate(store, { ...anna, locale: 'de', section: 'feedback', title: 'Fehler beim Tisch', body: 'Die Karte hing.' }, tick())
  await forumCreate(store, { ...ben, locale: 'en', section: 'talk', title: 'Hello', body: 'From Ohio' }, tick())

  // One forum per language; the announcement first; names, never ids.
  const de = await forumList(store, { ...guest, locale: 'de' })
  assert.deepEqual(de.posts.map((p) => p.id), [news.id, feedback.id, post.id, article.id])
  assert.ok(de.posts.every((p) => p.author && !p.author.startsWith('user:') && !p.mine))
  assert.deepEqual((await forumList(store, { ...guest, locale: 'en' })).posts.map((p) => p.title), ['Hello'])
  assert.deepEqual((await forumList(store, { ...guest, locale: 'de', section: 'feedback' })).posts.map((p) => p.id), [feedback.id])
  assert.equal((await forumList(store, { ...anna, locale: 'de' })).posts.find((p) => p.id === post.id)?.mine, true)

  // Flat comments, in order; a comment moves the post up.
  const first = await forumComment(store, { ...ben, post: post.id, body: '@Anna bis 18' }, tick())
  await forumComment(store, { ...admin, post: post.id, body: 'Siehe Artikel' }, tick())
  const thread = (await forumPost(store, { ...guest, id: post.id })).post
  assert.deepEqual(thread.thread.map((c) => c.body), ['@Anna bis 18', 'Siehe Artikel'])
  assert.equal(thread.comments, 2)
  assert.equal((await forumList(store, { ...guest, locale: 'de' })).posts[1].id, post.id)

  // Search engines: the official's posts; a player's once marked; feedback never.
  const indexed = async () => (await forumSitemap(store)).posts.map((p) => p.id).sort((a, b) => a - b)
  assert.deepEqual(await indexed(), [news.id, article.id])
  await forumModerate(store, { ...admin, action: 'index', post: post.id })
  assert.deepEqual(await indexed(), [news.id, article.id, post.id])
  await assert.rejects(forumModerate(store, { ...admin, action: 'index', post: feedback.id }), /not_markable/)
  await assert.rejects(forumModerate(store, { ...anna, action: 'index', post: post.id }))

  // Reports reach the official's list; hiding settles them and hides from everyone but author and official.
  await forumReport(store, { ...ben, post: post.id, reason: 'Spam' })
  await forumReport(store, { ...ben, post: post.id, reason: 'again' })
  await forumReport(store, { ...anna, comment: first.id })
  await assert.rejects(forumReports(store, { ...anna }))
  const open = (await forumReports(store, { ...admin })).reports
  assert.deepEqual(open.map((r) => [r.postId, r.commentId, r.count]), [[post.id, null, 1], [post.id, first.id, 1]])
  await forumModerate(store, { ...admin, action: 'hide', post: post.id, reason: 'Werbung' })
  assert.deepEqual((await forumReports(store, { ...admin })).reports.map((r) => r.commentId), [first.id])
  await assert.rejects(forumPost(store, { ...ben, id: post.id }))
  await assert.rejects(forumPost(store, { ...guest, id: post.id }))
  assert.equal((await forumPost(store, { ...anna, id: post.id })).post.hidden, 'Werbung')
  assert.equal((await forumPost(store, { ...admin, id: post.id })).post.hidden, 'Werbung')
  assert.ok(!(await forumList(store, { ...guest, locale: 'de' })).posts.some((p) => p.id === post.id))
  assert.deepEqual(await indexed(), [news.id, article.id])
  await forumModerate(store, { ...admin, action: 'restore', post: post.id })
  await forumModerate(store, { ...admin, action: 'dismiss', report: (await forumReports(store, { ...admin })).reports[0].id })
  assert.deepEqual((await forumReports(store, { ...admin })).reports, [])

  // Authors delete their own, and only their own.
  await assert.rejects(forumDelete(store, { ...anna, comment: first.id }))
  await forumDelete(store, { ...ben, comment: first.id })
  await forumDelete(store, { ...anna, post: post.id })
  await assert.rejects(forumPost(store, { ...admin, id: post.id }))

  // The announcement line: two weeks.
  const now = tick()
  assert.equal((await forumLatest(store, { locale: 'de' }, now)).announcement?.id, news.id)
  assert.equal((await forumLatest(store, { locale: 'de' }, now + (ANNOUNCEMENT_DAYS + 1) * DAY)).announcement, null)
  assert.equal((await forumLatest(store, { locale: 'en' }, now)).announcement, null)

  // A day's posts, then refused; the official has no limit.
  for (let n = 1; n < DAILY_LIMITS.posts; n++) await forumCreate(store, { ...ben, locale: 'en', section: 'talk', title: `Post ${n}`, body: 'x' })
  await assert.rejects(forumCreate(store, { ...ben, locale: 'en', section: 'talk', title: 'One more', body: 'x' }))
  await forumCreate(store, { ...admin, locale: 'en', section: 'talk', title: 'Official', body: 'x' })
})
