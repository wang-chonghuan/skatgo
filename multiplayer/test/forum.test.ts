import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { ANNOUNCEMENT_DAYS, DAILY_LIMITS, IMAGE_BYTES } from '../../app/src/lib/forum'
import {
  forumComment, forumCreate, forumDelete, forumFace, forumImage, forumLatest, forumList, forumMe, forumModerate, forumPost,
  forumReport, forumReports, forumSeen, forumSitemap, forumUnread,
} from '../src/forum'
import { Store } from '../src/store'

// The forum (SKATGO-118) against a database of its own: who may write where (two lists since SKATGO-234), search and
// sort, what hidden content shows to whom, what search engines are offered, and the
// daily limits.

const DAY = 24 * 60 * 60 * 1000
const admin = { player: 'user:admin', official: true }
const anna = { player: 'user:anna', official: false }
const ben = { player: 'user:ben', official: false }
const guest = { player: null, official: false }

test('forum: one list, visibility, moderation, search and limits', { timeout: 60_000 }, async (t) => {
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

  // One list since SKATGO-247: SkatGo and the players write into it alike.
  const article = await forumCreate(store, { ...admin, title: 'Wann Grand?', body: '## Regel\n[♣B ♠B ♥A]' }, tick())
  const news = await forumCreate(store, { ...admin, title: 'Turnier am Sonntag', body: 'Alle sind eingeladen.' }, tick())
  const post = await forumCreate(store, { ...anna, title: 'Frage zum Reizen', body: 'Wie weit reize ich?' }, tick())
  await forumCreate(store, { ...anna, title: 'Fehler beim Tisch', body: 'Die Karte hing 100% fest.' }, tick())
  await forumCreate(store, { ...ben, title: 'Hello', body: 'From Ohio' }, tick())

  // Every post in the one list, the newest first; one forum for every language; names, never ids.
  const list = await forumList(store, { ...guest })
  assert.deepEqual(list.posts.map((p) => p.title), ['Hello', 'Fehler beim Tisch', 'Frage zum Reizen', 'Turnier am Sonntag', 'Wann Grand?'])
  assert.deepEqual(list.posts.filter((p) => p.official).map((p) => p.id), [news.id, article.id])
  assert.ok(list.posts.filter((p) => !p.official).every((p) => p.author && !p.author.startsWith('user:') && !p.mine))
  assert.equal((await forumList(store, { ...anna })).posts.find((p) => p.id === post.id)?.mine, true)

  // Search: the words in the title or the text, any case; its wildcards taken literally.
  const found = async (q: string) => (await forumList(store, { ...guest, q })).posts.map((p) => p.title)
  assert.deepEqual(await found('reiz'), ['Frage zum Reizen'])
  assert.deepEqual(await found('OHIO'), ['Hello'])
  assert.deepEqual(await found('100%'), ['Fehler beim Tisch'])
  assert.deepEqual(await found('_'), [])
  assert.deepEqual(await found(''), ['Hello', 'Fehler beim Tisch', 'Frage zum Reizen', 'Turnier am Sonntag', 'Wann Grand?'])

  // Flat comments, in order; a comment moves the post up, and the list shows the newest.
  const first = await forumComment(store, { ...ben, post: post.id, body: '@Anna bis 18' }, tick())
  await forumComment(store, { ...admin, post: post.id, body: 'Siehe Artikel' }, tick())
  const thread = (await forumPost(store, { ...guest, id: post.id })).post
  assert.deepEqual(thread.thread.map((c) => c.body), ['@Anna bis 18', 'Siehe Artikel'])
  assert.equal(thread.comments, 2)
  // A line shows the players who commented, newest first; SkatGo's own comment is not among them.
  assert.deepEqual(thread.participants.length, 1)
  assert.ok(!thread.participants.some((p) => p.name === ''))

  // Sorted by interaction: the most commented first.
  assert.equal((await forumList(store, { ...guest, sort: 'active' })).posts[0].id, post.id)
  assert.equal((await forumList(store, { ...guest, sort: 'new' })).posts[0].title, 'Hello')

  // Search engines: the official's posts; a player's once marked.
  const indexed = async () => (await forumSitemap(store)).posts.map((p) => p.id).sort((a, b) => a - b)
  const officials = [article.id, news.id]
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

  // The line on the front page and /daily: SkatGo's own newest post of two weeks, never a player's newer one.
  const now = tick()
  assert.equal((await forumLatest(store, {}, now)).announcement?.id, news.id)
  assert.equal((await forumLatest(store, {}, now + (ANNOUNCEMENT_DAYS + 1) * DAY)).announcement, null)

  // A day's posts, then refused; the official has no limit.
  for (let n = 1; n < DAILY_LIMITS.posts; n++) await forumCreate(store, { ...ben, title: `Post ${n}`, body: 'x' })
  await assert.rejects(forumCreate(store, { ...ben, title: 'One more', body: 'x' }))
  await forumCreate(store, { ...admin, title: 'Official', body: 'x' })

  // The posts of every list there ever was — SkatGo's articles of before (SKATGO-231), the advanced course's lessons
  // (SKATGO-234), the announcements — stand in the one list, at the same addresses.
  const { rows } = await store.pool.query(
    `INSERT INTO forum_posts (section, author, official, title, body, created_at, last_activity) VALUES ('articles', 'user:admin', true, 'Alt', 'x', $1, $1) RETURNING id`,
    [tick()])
  const { rows: lesson } = await store.pool.query(
    `INSERT INTO forum_posts (section, author, official, title, body, created_at, last_activity) VALUES ('guides', 'user:admin', true, 'Lektion', 'x', $1, $1) RETURNING id`,
    [tick()])
  await store.migrate()
  const ids = (await forumList(store, { ...guest })).posts.map((p) => p.id)
  for (const old of [Number(rows[0].id), Number(lesson[0].id), news.id, article.id]) {
    assert.ok(ids.includes(old))
    assert.equal((await forumPost(store, { ...guest, id: old })).post.id, old)
  }
})

test('forum: faces and mentions', { timeout: 60_000 }, async (t) => {
  const base = new URL(process.env.DATABASE_URL || '')
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname), 'Tests refuse external databases')
  const server = new pg.Pool({ connectionString: base.href })
  const name = `skatgo_faces_${randomBytes(6).toString('hex')}`
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
  const cara = { player: 'user:cara', official: false }
  for (const [who, nick] of [['user:anna', 'Anna'], ['user:ben', 'Flinker Fuchs'], ['user:cara', 'Flinker'], ['anon:x', 'Gast']]) {
    await store.pool.query('INSERT INTO daily_players (player, nickname, created_at) VALUES ($1, $2, 1)', [who, nick])
  }
  let clock = Date.now() - 60_000
  const tick = () => ++clock

  // A face: none at first — the picture of the name; a new look is a seed, the same after reading again.
  assert.deepEqual(await forumMe(store, anna), { name: 'Anna', face: null, unread: 0, mentions: [] })
  const drawn = (await forumFace(store, { ...anna, action: 'refresh' })).face
  assert.ok(drawn && 'seed' in drawn)
  assert.deepEqual((await forumMe(store, anna)).face, drawn)

  // An upload: WebP or JPEG by its bytes, at most IMAGE_BYTES; anything else refused, the face unchanged.
  const webp = (n: number) => Buffer.concat([Buffer.from('RIFF\0\0\0\0WEBPVP8 '), Buffer.alloc(n)]).toString('base64')
  await assert.rejects(forumFace(store, { ...anna, action: 'upload', image: Buffer.from('<svg></svg>').toString('base64') }), { message: 'image_refused' })
  await assert.rejects(forumFace(store, { ...anna, action: 'upload', image: webp(IMAGE_BYTES) }), { message: 'image_refused' })
  assert.deepEqual((await forumMe(store, anna)).face, drawn)
  const up = (await forumFace(store, { ...anna, action: 'upload', image: webp(100) })).face
  assert.ok(up && 'image' in up)
  assert.equal((await forumImage(store, { id: up.image })).type, 'image/webp')
  // A second upload replaces the first, which is gone; a new look deletes the picture.
  const again = (await forumFace(store, { ...anna, action: 'upload', image: webp(200) })).face
  assert.ok(again && 'image' in again && again.image !== up.image)
  await assert.rejects(forumImage(store, { id: up.image }))
  const fresh = (await forumFace(store, { ...anna, action: 'refresh' })).face
  assert.ok(fresh && 'seed' in fresh)
  await assert.rejects(forumImage(store, { id: again.image }))
  assert.equal(Number((await store.pool.query('SELECT count(*) FROM player_avatars WHERE image IS NOT NULL')).rows[0].count), 0)

  // The face goes with the name: on the post, its comments and its line's commenters.
  const post = await forumCreate(store, { ...ben, title: 'Reizen bis 18?', body: 'Hallo @anna!' }, tick())
  const c1 = await forumComment(store, { ...anna, post: post.id, body: '@Flinker Fuchs bis 18, @Flinker auch? @Gast @Niemand @Anna' }, tick())
  const shown = (await forumPost(store, { ...guest, id: post.id })).post
  assert.deepEqual(shown.thread[0].face, fresh)
  assert.equal(shown.face, null)
  assert.deepEqual(shown.participants, [{ name: 'Anna', face: fresh }])
  assert.deepEqual((await forumList(store, { ...guest })).posts[0].participants, [{ name: 'Anna', face: fresh }])

  // "@Name", the longest name an account holds, any case, never the writer's own nor a guest's: Ben and Cara once each,
  // Anna by Ben's post.
  assert.deepEqual(await forumUnread(store, ben), { unread: 1 })
  assert.deepEqual(await forumUnread(store, cara), { unread: 1 })
  assert.deepEqual(await forumUnread(store, anna), { unread: 1 })
  const benMe = await forumMe(store, ben)
  assert.deepEqual(benMe.mentions.map((m) => [m.by, m.postTitle, m.commentId, m.unread]), [['Anna', 'Reizen bis 18?', c1.id, true]])
  assert.deepEqual(benMe.mentions[0].face, fresh)
  assert.equal((await forumMe(store, anna)).mentions[0].commentId, null)

  // Seen: nothing new; the list stays.
  await forumSeen(store, ben)
  assert.deepEqual(await forumUnread(store, ben), { unread: 0 })
  assert.equal((await forumMe(store, ben)).mentions[0].unread, false)

  // A hidden comment's mention is not shown; restored, it is again.
  await forumModerate(store, { ...admin, action: 'hide', comment: c1.id, reason: 'x' })
  assert.deepEqual(await forumUnread(store, cara), { unread: 0 })
  assert.deepEqual((await forumMe(store, cara)).mentions, [])
  await forumModerate(store, { ...admin, action: 'restore', comment: c1.id })
  assert.deepEqual(await forumUnread(store, cara), { unread: 1 })
  // A deleted comment takes its mentions with it.
  await forumDelete(store, { ...anna, comment: c1.id })
  assert.deepEqual(await forumUnread(store, cara), { unread: 0 })
})
