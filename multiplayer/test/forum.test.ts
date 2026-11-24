import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { ANNOUNCEMENT_DAYS, DAILY_LIMITS } from '../../app/src/lib/forum'
import {
  forumComment, forumCreate, forumDelete, forumLatest, forumList, forumModerate, forumPost, forumReport, forumReports, forumSitemap,
} from '../src/forum'
import { Store } from '../src/store'

// The forum (SKATGO-118) against a database of its own: who may write where (three lists since SKATGO-231), search and
// sort, the advanced course in order, what hidden content shows to whom, what search engines are offered, and the
// daily limits.

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

  // Only the official announces and writes the advanced course; a player writes in the discussion.
  for (const section of ['news', 'guides'] as const) {
    await assert.rejects(forumCreate(store, { ...anna, section, title: 'Neu hier', body: 'Hallo' }, tick()), { name: 'Error' })
  }
  const news = await forumCreate(store, { ...admin, section: 'news', title: 'Turnier am Sonntag', body: 'Alle sind eingeladen.' }, tick())
  const article = await forumCreate(store, { ...admin, section: 'guides', title: 'Wann Grand?', body: '## Regel\n[♣B ♠B ♥A]' }, tick())
  const post = await forumCreate(store, { ...anna, section: 'talk', title: 'Frage zum Reizen', body: 'Wie weit reize ich?' }, tick())
  await forumCreate(store, { ...anna, section: 'talk', title: 'Fehler beim Tisch', body: 'Die Karte hing 100% fest.' }, tick())
  await forumCreate(store, { ...ben, section: 'talk', title: 'Hello', body: 'From Ohio' }, tick())

  // Three lists, the announcements first when none is named, the newest first; one forum for every language; names,
  // never ids.
  const list = await forumList(store, { ...guest, section: 'talk' })
  assert.deepEqual(list.posts.map((p) => p.title), ['Hello', 'Fehler beim Tisch', 'Frage zum Reizen'])
  assert.deepEqual((await forumList(store, { ...guest })).posts.map((p) => p.id), [news.id])
  assert.ok(list.posts.every((p) => p.author && !p.author.startsWith('user:') && !p.mine))
  assert.equal((await forumList(store, { ...anna, section: 'talk' })).posts.find((p) => p.id === post.id)?.mine, true)

  // Search: the words in the title or the text, any case; its wildcards taken literally.
  const found = async (q: string) => (await forumList(store, { ...guest, section: 'talk', q })).posts.map((p) => p.title)
  assert.deepEqual(await found('reiz'), ['Frage zum Reizen'])
  assert.deepEqual(await found('OHIO'), ['Hello'])
  assert.deepEqual(await found('100%'), ['Fehler beim Tisch'])
  assert.deepEqual(await found('_'), [])
  assert.deepEqual(await found(''), ['Hello', 'Fehler beim Tisch', 'Frage zum Reizen'])

  // Flat comments, in order; a comment moves the post up, and the list shows the newest.
  const first = await forumComment(store, { ...ben, post: post.id, body: '@Anna bis 18' }, tick())
  await forumComment(store, { ...admin, post: post.id, body: 'Siehe Artikel' }, tick())
  const thread = (await forumPost(store, { ...guest, id: post.id })).post
  assert.deepEqual(thread.thread.map((c) => c.body), ['@Anna bis 18', 'Siehe Artikel'])
  assert.equal(thread.comments, 2)
  // Sorted by interaction: the most commented first.
  assert.equal((await forumList(store, { ...guest, section: 'talk', sort: 'active' })).posts[0].id, post.id)
  assert.equal((await forumList(store, { ...guest, section: 'talk', sort: 'new' })).posts[0].title, 'Hello')

  // The advanced course's lessons numbered by publication, each with its neighbours.
  const second = await forumCreate(store, { ...admin, section: 'guides', title: 'Wann Null?', body: 'Ohne Stich.' }, tick())
  const third = await forumCreate(store, { ...admin, section: 'guides', title: 'Wann Hand?', body: 'Ohne Skat.' }, tick())
  const guides = (await forumList(store, { ...guest, section: 'guides' })).posts
  assert.deepEqual(guides.map((p) => [p.id, p.number]), [[third.id, 3], [second.id, 2], [article.id, 1]])
  const middle = (await forumPost(store, { ...guest, id: second.id })).post
  assert.deepEqual([middle.number, middle.prev, middle.next], [2, { id: article.id, title: 'Wann Grand?', number: 1 }, { id: third.id, title: 'Wann Hand?', number: 3 }])
  assert.deepEqual([thread.prev, thread.next, thread.number], [null, null, null])

  // Search engines: the official's posts; a player's once marked.
  const indexed = async () => (await forumSitemap(store)).posts.map((p) => p.id).sort((a, b) => a - b)
  const officials = [news.id, article.id, second.id, third.id]
  assert.deepEqual(await indexed(), officials)
  await forumModerate(store, { ...admin, action: 'index', post: post.id })
  assert.deepEqual(await indexed(), [...officials, post.id].sort((a, b) => a - b))
  await assert.rejects(forumModerate(store, { ...admin, action: 'index', post: article.id }), /not_markable/)
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
  assert.ok(!(await forumList(store, { ...guest })).posts.some((p) => p.id === post.id))
  assert.deepEqual(await indexed(), officials)
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
  assert.equal((await forumLatest(store, {}, now)).announcement?.id, news.id)
  assert.equal((await forumLatest(store, {}, now + (ANNOUNCEMENT_DAYS + 1) * DAY)).announcement, null)

  // A day's posts, then refused; the official has no limit.
  for (let n = 1; n < DAILY_LIMITS.posts; n++) await forumCreate(store, { ...ben, section: 'talk', title: `Post ${n}`, body: 'x' })
  await assert.rejects(forumCreate(store, { ...ben, section: 'talk', title: 'One more', body: 'x' }))
  await forumCreate(store, { ...admin, section: 'talk', title: 'Official', body: 'x' })

  // The articles of before are posts in the discussion, at the same address (SKATGO-231).
  const { rows } = await store.pool.query(
    `INSERT INTO forum_posts (section, author, official, title, body, created_at, last_activity) VALUES ('articles', 'user:admin', true, 'Alt', 'x', $1, $1) RETURNING id`,
    [tick()])
  await store.migrate()
  assert.equal((await forumPost(store, { ...guest, id: Number(rows[0].id) })).post.section, 'talk')
})
