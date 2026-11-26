import { randomBytes } from 'node:crypto'
import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import {
  ANNOUNCEMENT_DAYS, COMMENT_MAX, DAILY_LIMITS, FORUM_LANGS, FORUM_SORTS, IMAGE_BYTES, IMAGE_ID,
  MENTIONS_PER_TEXT, MENTIONS_SHOWN, PAGE_SIZE, PARTICIPANTS, POST_MAX, QUERY_MAX, REASON_MAX, TITLE_MAX,
  TITLE_MIN, type Face, type ForumAnnouncement, type ForumComment, type ForumList, type ForumMe, type ForumMention,
  type ForumPost, type ForumLang, type ForumPostSummary, type ForumReport,
  type ForumThread, faceOf, imageTypeOf, mentionCandidates, plainText, postIndexable,
} from '../../app/src/lib/forum'
import { nameOf } from './daily'
import { Rejected, secretEquals } from './model'
import type { Store } from './store'
import { type Translation, translateForAll, translationsOf } from './translate'

// The forum (SKATGO-118): posts in two lists (SKATGO-234), in whatever language their authors write, flat comments, and the least moderation the law
// asks of a host — a report, the official hiding with a reason, authors deleting their own. The web service
// calls these routes with the admission key and names the viewer: a signed-in account (`user:<Clerk id>`) or
// nobody, and whether the account is the official's. Only names leave here, never a player id: whether
// something is the viewer's own travels as `mine`, and a player's picture as their face (SKATGO-232). Nothing here
// notifies anyone outside the site: an "@Name" is kept for that player's /profile and the count on their avatar (SKATGO-232,
// the human: 「如果有人在论坛里at这个用户，就要显示提示角标，profile里显示最新的at的消息」).

const DAY = 24 * 60 * 60 * 1000

class Forbidden extends Error {}
class NotFound extends Error {}
class TooMany extends Error {}

const player = z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/)
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const text = (min: number, max: number) => z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max))
const viewer = { player: player.nullable(), official: z.boolean() }
const author = { player, official: z.boolean() }
const target = z.union([z.object({ post: id }).strict(), z.object({ comment: id }).strict()])

// The reader's language (SKATGO-124): what is written in another comes translated into it.
const lang = z.enum(FORUM_LANGS).optional()
const listInput = z.object({
  ...viewer, page: z.number().int().min(1).max(1000).optional(), lang,
  q: z.string().transform((s) => s.trim()).pipe(z.string().max(QUERY_MAX)).optional(), sort: z.enum(FORUM_SORTS).optional(),
}).strict()
const postInput = z.object({ ...viewer, id, lang }).strict()
const createInput = z.object({ ...author, title: text(TITLE_MIN, TITLE_MAX), body: text(1, POST_MAX) }).strict()
const commentInput = z.object({ ...author, post: id, body: text(1, COMMENT_MAX) }).strict()
const deleteInput = z.object({ ...author, post: id.optional(), comment: id.optional() }).strict()
const reportInput = z.object({ ...author, post: id.optional(), comment: id.optional(), reason: text(0, REASON_MAX).optional() }).strict()
const reportsInput = z.object({ ...author }).strict()
const moderateInput = z.discriminatedUnion('action', [
  z.object({ ...author, action: z.literal('hide'), post: id.optional(), comment: id.optional(), reason: text(1, REASON_MAX) }).strict(),
  z.object({ ...author, action: z.literal('restore'), post: id.optional(), comment: id.optional() }).strict(),
  z.object({ ...author, action: z.literal('dismiss'), report: id }).strict(),
  z.object({ ...author, action: z.enum(['index', 'unindex']), post: id }).strict(),
])
const latestInput = z.object({ lang }).strict()
const meInput = z.object({ ...author }).strict()
/** An uploaded picture, base64: at most `IMAGE_BYTES` once decoded. */
const image = z.string().max(Math.ceil(IMAGE_BYTES / 3) * 4).regex(/^[A-Za-z0-9+/]+={0,2}$/)
const faceInput = z.discriminatedUnion('action', [
  z.object({ ...author, action: z.literal('refresh') }).strict(),
  z.object({ ...author, action: z.literal('upload'), image }).strict(),
])
const imageInput = z.object({ id: z.string().regex(IMAGE_ID) }).strict()

/** Exactly one of a post or a comment. */
const one = (i: { post?: number; comment?: number }) => target.parse(i.post !== undefined ? { post: i.post } : { comment: i.comment })

const num = (v: unknown) => Number(v)

type PostRow = {
  id: string; author: string; official: boolean; title: string; body: string
  indexed: boolean; hidden_reason: string | null; created_at: string; last_activity: string; name: string | null; comments: string
  participants: { name: string; seed: string | null; image: string | null }[] | null
  face_seed: string | null; face_image: string | null
}

/** A text's translation when it was written in a language other than `lang`. */
const other = (known: Map<string, Translation>, text: string, lang: ForumLang | undefined) => {
  const t = known.get(text)
  return t && lang && t.from !== lang ? t : null
}

function summary(r: PostRow, who: string | null, known: Map<string, Translation> = new Map(), lang?: ForumLang): ForumPostSummary {
  const body = other(known, r.body, lang)
  const title = other(known, r.title, lang)
  const p = {
    id: num(r.id), title: r.title, excerpt: plainText(r.body, 160),
    author: r.name ?? '', official: r.official, createdAt: num(r.created_at), lastActivity: num(r.last_activity),
    comments: num(r.comments), indexed: r.indexed, hidden: r.hidden_reason, mine: who !== null && r.author === who,
  }
  const translated = body || title
    ? { from: (body ?? title)!.from, title: title?.text ?? r.title, excerpt: body ? plainText(body.text, 160) : p.excerpt }
    : null
  return {
    ...p, indexable: postIndexable(p), translated,
    participants: (r.participants ?? []).map((w) => ({ name: w.name, face: faceOf(w.seed, w.image) })), face: faceOf(r.face_seed, r.face_image),
  }
}

/** The texts a row shows, for the translations to look up. */
const textsOf = (rows: PostRow[]) => rows.flatMap((r) => [r.title, r.body])

// A post with its author's name, the count of comments everyone sees, the players who wrote them, newest first
// (SKATGO-231). Hidden posts and comments are
// seen only by their author and the official: `$1` is the viewer (or null), `$2` whether the viewer is official.
const POSTS = `
  SELECT p.*, d.nickname AS name, a.seed AS face_seed, a.image_id AS face_image,
    (SELECT count(*) FROM forum_comments c WHERE c.post_id = p.id AND c.hidden_reason IS NULL) AS comments,
    (SELECT array_agg(json_build_object('name', w.nickname, 'seed', w.seed, 'image', w.image_id) ORDER BY w.last DESC) FROM (
      SELECT cd.nickname, ca.seed, ca.image_id, max(c.created_at) AS last FROM forum_comments c
        JOIN daily_players cd ON cd.player = c.author LEFT JOIN player_avatars ca ON ca.player = c.author
       WHERE c.post_id = p.id AND c.hidden_reason IS NULL AND NOT c.official
       GROUP BY cd.nickname, ca.seed, ca.image_id ORDER BY last DESC LIMIT ${PARTICIPANTS}) w) AS participants
    FROM forum_posts p LEFT JOIN daily_players d ON d.player = p.author LEFT JOIN player_avatars a ON a.player = p.author`

/** A text's key in the translations: its sha256, as translate.ts keys it. */
const hashOf = (column: string) => `encode(sha256(convert_to(${column}, 'UTF8')), 'hex')`
const VISIBLE = `(p.hidden_reason IS NULL OR $2::boolean OR p.author = $1)`

/** One page of the forum's one list (SKATGO-231, one since SKATGO-247): the newest first, or the most commented
 *  first; narrowed to the posts whose title or text — as written, or in the reader's language — holds the words
 *  searched for. */
export async function forumList(store: Store, i: z.infer<typeof listInput>): Promise<ForumList> {
  const page = i.page ?? 1
  const order = i.sort === 'active' ? 'comments DESC, p.last_activity DESC, p.id DESC' : 'p.created_at DESC, p.id DESC'
  // The words as a pattern, its own wildcards taken literally.
  const pattern = i.q ? `%${i.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null
  const { rows } = await store.pool.query(
    `${POSTS} WHERE ${VISIBLE}
      AND ($3::text IS NULL OR p.title ILIKE $3 OR p.body ILIKE $3 OR EXISTS (
        SELECT 1 FROM translations t WHERE t.lang = $4 AND t.hash IN (${hashOf('p.title')}, ${hashOf('p.body')}) AND t.text ILIKE $3))
      ORDER BY ${order} LIMIT $5 OFFSET $6`,
    [i.player, i.official, pattern, i.lang ?? '', PAGE_SIZE + 1, (page - 1) * PAGE_SIZE],
  )
  const known = i.lang ? await translationsOf(store, textsOf(rows), i.lang) : new Map<string, Translation>()
  const posts = rows.map((r: PostRow) => summary(r, i.player, known, i.lang))
  return { posts: posts.slice(0, PAGE_SIZE), more: posts.length > PAGE_SIZE, viewer: { signedIn: i.player !== null, official: i.official } }
}

/** A post and its comments, oldest first, flat. */
export async function forumPost(store: Store, i: z.infer<typeof postInput>): Promise<ForumThread> {
  const { rows } = await store.pool.query(`${POSTS} WHERE p.id = $3 AND ${VISIBLE}`, [i.player, i.official, i.id])
  if (!rows[0]) throw new NotFound()
  const { rows: comments } = await store.pool.query(
    `SELECT c.*, d.nickname AS name, a.seed AS face_seed, a.image_id AS face_image FROM forum_comments c
       LEFT JOIN daily_players d ON d.player = c.author LEFT JOIN player_avatars a ON a.player = c.author
      WHERE c.post_id = $3 AND (c.hidden_reason IS NULL OR $2::boolean OR c.author = $1) ORDER BY c.created_at, c.id`,
    [i.player, i.official, i.id],
  )
  const known = i.lang
    ? await translationsOf(store, [...textsOf(rows), ...comments.map((c) => c.body as string)], i.lang)
    : new Map<string, Translation>()
  const thread: ForumComment[] = comments.map((c) => {
    const t = other(known, c.body, i.lang)
    return {
      id: num(c.id), author: c.name ?? '', official: c.official, body: c.body, createdAt: num(c.created_at),
      hidden: c.hidden_reason, mine: i.player !== null && c.author === i.player, translated: t ? { from: t.from, body: t.text } : null,
      face: faceOf(c.face_seed, c.face_image),
    }
  })
  const head = summary(rows[0], i.player, known, i.lang)
  const body = other(known, rows[0].body, i.lang)
  const post: ForumPost = {
    ...head, body: rows[0].body, thread, translated: head.translated && { ...head.translated, body: body?.text ?? rows[0].body },
  }
  return { post, viewer: { signedIn: i.player !== null, official: i.official } }
}

/** How many of `what` the author wrote in the last day; past the limit, the write is refused. */
async function withinLimit(c: pg.PoolClient, table: 'forum_posts' | 'forum_comments' | 'forum_reports', column: string, who: string, limit: number, now: number) {
  const { rows } = await c.query(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1 AND created_at > $2`, [who, now - DAY])
  if (rows[0].n >= limit) throw new TooMany()
}

/** The players a text names with "@" (SKATGO-232), kept for each one's /profile: for each "@" the longest name an
 *  account holds, never the writer's own, at most `MENTIONS_PER_TEXT` players. */
async function mention(c: pg.PoolClient, who: string, post: number, comment: number | null, body: string, now: number) {
  const groups = mentionCandidates(body)
  if (!groups.length) return
  const { rows } = await c.query(
    `SELECT player, lower(nickname) AS name FROM daily_players WHERE lower(nickname) = ANY($1) AND player LIKE 'user:%' AND player <> $2`,
    [groups.flat(), who])
  const byName = new Map(rows.map((r) => [r.name as string, r.player as string]))
  const named = new Set<string>()
  for (const names of groups) {
    const found = names.findLast((n) => byName.has(n))
    if (found) named.add(byName.get(found)!)
  }
  for (const player of [...named].slice(0, MENTIONS_PER_TEXT)) {
    await c.query(
      `INSERT INTO forum_mentions (player, post_id, comment_id, created_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (player, post_id, (coalesce(comment_id, 0))) DO NOTHING`, [player, post, comment, now])
  }
}

export async function forumCreate(store: Store, i: z.infer<typeof createInput>, now = Date.now()) {
  return store.transaction(async (c) => {
    if (!i.official) await withinLimit(c, 'forum_posts', 'author', i.player, DAILY_LIMITS.posts, now)
    // The author stands under their leaderboard name, given now if they have none yet (SKATGO-90).
    await nameOf(c, i.player, now)
    const { rows } = await c.query(
      // One list since SKATGO-247: the stored section is no longer read, every new post writes the same.
      `INSERT INTO forum_posts (section, author, official, title, body, created_at, last_activity)
       VALUES ('talk', $1, $2, $3, $4, $5, $5) RETURNING id`,
      [i.player, i.official, i.title, i.body, now],
    )
    await mention(c, i.player, num(rows[0].id), null, i.body, now)
    return { id: num(rows[0].id), title: i.title }
  }).then((made) => {
    // Translated now, so readers of the other language find it ready.
    translateForAll(store, [i.title, i.body])
    return made
  })
}

export async function forumComment(store: Store, i: z.infer<typeof commentInput>, now = Date.now()) {
  return store.transaction(async (c) => {
    const { rows } = await c.query('SELECT 1 FROM forum_posts p WHERE p.id = $3 AND ' + VISIBLE, [i.player, i.official, i.post])
    if (!rows[0]) throw new NotFound()
    if (!i.official) await withinLimit(c, 'forum_comments', 'author', i.player, DAILY_LIMITS.comments, now)
    await nameOf(c, i.player, now)
    const { rows: made } = await c.query(
      'INSERT INTO forum_comments (post_id, author, official, body, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [i.post, i.player, i.official, i.body, now],
    )
    await c.query('UPDATE forum_posts SET last_activity = $2 WHERE id = $1', [i.post, now])
    await mention(c, i.player, i.post, num(made[0].id), i.body, now)
    return { id: num(made[0].id) }
  }).then((made) => {
    translateForAll(store, [i.body])
    return made
  })
}

/** An author deletes their own post (with its comments) or comment, for good. */
export async function forumDelete(store: Store, i: z.infer<typeof deleteInput>) {
  const what = one(i)
  return store.transaction(async (c) => {
    const [table, key] = 'post' in what ? ['forum_posts', what.post] : ['forum_comments', what.comment]
    const { rowCount } = await c.query(`DELETE FROM ${table} WHERE id = $1 AND author = $2`, [key, i.player])
    if (!rowCount) throw new NotFound()
    return { deleted: true }
  })
}

/** A signed-in player reports a post or comment they can see, once each. */
export async function forumReport(store: Store, i: z.infer<typeof reportInput>, now = Date.now()) {
  const what = one(i)
  return store.transaction(async (c) => {
    const { rows } = 'post' in what
      ? await c.query('SELECT p.id AS post_id FROM forum_posts p WHERE p.id = $3 AND ' + VISIBLE, [i.player, i.official, what.post])
      : await c.query(
        `SELECT c.post_id FROM forum_comments c JOIN forum_posts p ON p.id = c.post_id
          WHERE c.id = $3 AND (c.hidden_reason IS NULL OR $2::boolean OR c.author = $1) AND ${VISIBLE}`,
        [i.player, i.official, what.comment])
    if (!rows[0]) throw new NotFound()
    if (!i.official) await withinLimit(c, 'forum_reports', 'reporter', i.player, DAILY_LIMITS.reports, now)
    await c.query(
      `INSERT INTO forum_reports (post_id, comment_id, reporter, reason, created_at) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (reporter, post_id, (coalesce(comment_id, 0))) DO NOTHING`,
      [rows[0].post_id, 'comment' in what ? what.comment : null, i.player, i.reason || null, now],
    )
    return { reported: true }
  })
}

/** The official's list: every reported post or comment with open reports, oldest first. */
export async function forumReports(store: Store, i: z.infer<typeof reportsInput>): Promise<{ reports: ForumReport[] }> {
  if (!i.official) throw new Forbidden()
  const { rows } = await store.pool.query(`
    SELECT max(r.id) AS id, r.post_id, r.comment_id, min(r.created_at) AS created_at, count(*)::int AS count,
           array_remove(array_agg(r.reason ORDER BY r.created_at), NULL) AS reasons,
           p.title, coalesce(c.body, p.body) AS body, coalesce(c.hidden_reason, p.hidden_reason) AS hidden,
           d.nickname AS name
      FROM forum_reports r JOIN forum_posts p ON p.id = r.post_id
      LEFT JOIN forum_comments c ON c.id = r.comment_id
      LEFT JOIN daily_players d ON d.player = coalesce(c.author, p.author)
     WHERE r.resolved_at IS NULL
     GROUP BY r.post_id, r.comment_id, p.title, c.body, p.body, c.hidden_reason, p.hidden_reason, d.nickname
     ORDER BY min(r.created_at)`)
  return {
    reports: rows.map((r) => ({
      id: num(r.id), postId: num(r.post_id), postTitle: r.title, commentId: r.comment_id === null ? null : num(r.comment_id),
      author: r.name ?? '', excerpt: String(r.body).slice(0, 280), hidden: r.hidden, reasons: r.reasons, count: r.count, createdAt: num(r.created_at),
    })),
  }
}

/** The official hides or restores a post or comment, dismisses a report, or marks a player's post for search
 *  engines. Hiding settles the open reports on it. */
export async function forumModerate(store: Store, i: z.infer<typeof moderateInput>, now = Date.now()) {
  if (!i.official) throw new Forbidden()
  return store.transaction(async (c) => {
    if (i.action === 'dismiss') {
      const { rows } = await c.query('SELECT post_id, comment_id FROM forum_reports WHERE id = $1', [i.report])
      if (!rows[0]) throw new NotFound()
      await c.query(
        'UPDATE forum_reports SET resolved_at = $3 WHERE post_id = $1 AND comment_id IS NOT DISTINCT FROM $2 AND resolved_at IS NULL',
        [rows[0].post_id, rows[0].comment_id, now])
      return { done: true }
    }
    if (i.action === 'index' || i.action === 'unindex') {
      const { rows } = await c.query('SELECT official FROM forum_posts WHERE id = $1', [i.post])
      if (!rows[0]) throw new NotFound()
      // The official's own posts are always indexed (SKATGO-118).
      if (rows[0].official) throw new Rejected('not_markable')
      await c.query('UPDATE forum_posts SET indexed = $2 WHERE id = $1', [i.post, i.action === 'index'])
      return { done: true }
    }
    const what = one(i)
    const reason = i.action === 'hide' ? i.reason : null
    const { rowCount } = 'post' in what
      ? await c.query('UPDATE forum_posts SET hidden_reason = $2 WHERE id = $1', [what.post, reason])
      : await c.query('UPDATE forum_comments SET hidden_reason = $2 WHERE id = $1', [what.comment, reason])
    if (!rowCount) throw new NotFound()
    if (i.action === 'hide') {
      await ('post' in what
        ? c.query('UPDATE forum_reports SET resolved_at = $2 WHERE post_id = $1 AND comment_id IS NULL AND resolved_at IS NULL', [what.post, now])
        : c.query('UPDATE forum_reports SET resolved_at = $2 WHERE comment_id = $1 AND resolved_at IS NULL', [what.comment, now]))
    }
    return { done: true }
  })
}

async function latest(db: pg.Pool | pg.PoolClient, now: number): Promise<ForumAnnouncement | null> {
  const { rows } = await db.query(
    `SELECT id, title, created_at FROM forum_posts WHERE official AND hidden_reason IS NULL AND created_at > $1
      ORDER BY created_at DESC, id DESC LIMIT 1`,
    [now - ANNOUNCEMENT_DAYS * DAY])
  return rows[0] ? { id: num(rows[0].id), title: rows[0].title, createdAt: num(rows[0].created_at), translated: null } : null
}

/** SkatGo's own newest post of the last two weeks (its announcements' list until SKATGO-247), for the line on the front
 *  page and /daily, or null; its title in the reader's language (SKATGO-124). */
export async function forumLatest(store: Store, i: z.infer<typeof latestInput>, now = Date.now()) {
  const found = await latest(store.pool, now)
  if (!found || !i.lang) return { announcement: found }
  const t = other(await translationsOf(store, [found.title], i.lang), found.title, i.lang)
  return { announcement: { ...found, translated: t ? { from: t.from, title: t.text } : null } }
}

/** The mentions of `who` everyone may still see: those in hidden posts and comments are left out. */
const MENTIONS = `
  FROM forum_mentions m JOIN forum_posts p ON p.id = m.post_id LEFT JOIN forum_comments c ON c.id = m.comment_id
  WHERE m.player = $1 AND p.hidden_reason IS NULL AND (m.comment_id IS NULL OR c.hidden_reason IS NULL)`

/** How many mentions the account has not seen, for the count on its avatar (SKATGO-232). */
export async function forumUnread(store: Store, i: z.infer<typeof meInput>) {
  const { rows } = await store.pool.query(`SELECT count(*)::int AS n ${MENTIONS} AND m.read_at IS NULL`, [i.player])
  return { unread: rows[0].n as number }
}

/** The account's own, for /profile (SKATGO-232): its name — given now if it has none, as writing in the forum gives
 *  one — its face, and its latest mentions: who, in which post, one line of the text, when. */
export async function forumMe(store: Store, i: z.infer<typeof meInput>, now = Date.now()): Promise<ForumMe> {
  const name = await store.transaction((c) => nameOf(c, i.player, now))
  const own = (await store.pool.query('SELECT seed, image_id FROM player_avatars WHERE player = $1', [i.player])).rows[0]
  const { rows } = await store.pool.query(
    `SELECT m.id, m.post_id, m.comment_id, m.created_at, m.read_at, p.title, coalesce(c.body, p.body) AS body,
            coalesce(c.official, p.official) AS official, d.nickname AS name, a.seed, a.image_id
     ${MENTIONS.replace('WHERE', `LEFT JOIN daily_players d ON d.player = coalesce(c.author, p.author)
       LEFT JOIN player_avatars a ON a.player = coalesce(c.author, p.author) WHERE`)}
     ORDER BY m.created_at DESC, m.id DESC LIMIT ${MENTIONS_SHOWN}`, [i.player])
  const mentions: ForumMention[] = rows.map((r) => ({
    id: num(r.id), by: r.name ?? '', face: faceOf(r.seed, r.image_id), official: r.official, postId: num(r.post_id), postTitle: r.title,
    commentId: r.comment_id === null ? null : num(r.comment_id), excerpt: plainText(r.body, 140), createdAt: num(r.created_at),
    unread: r.read_at === null,
  }))
  return { name, face: faceOf(own?.seed, own?.image_id), unread: (await forumUnread(store, i)).unread, mentions }
}

/** The account saw its mentions: none is new any more. */
export async function forumSeen(store: Store, i: z.infer<typeof meInput>, now = Date.now()) {
  await store.pool.query('UPDATE forum_mentions SET read_at = $2 WHERE player = $1 AND read_at IS NULL', [i.player, now])
  return { unread: 0 }
}

/** A player draws a new look, which also deletes a picture they uploaded, or uploads a picture in place of the one
 *  before (SKATGO-232). The picture is the browser's 256×256 WebP or JPEG; the service checks its bytes and size. */
export async function forumFace(store: Store, i: z.infer<typeof faceInput>, now = Date.now()): Promise<{ face: Face }> {
  if (i.action === 'refresh') {
    const seed = randomBytes(8).toString('hex')
    await store.pool.query(
      `INSERT INTO player_avatars (player, seed, updated_at) VALUES ($1, $2, $3) ON CONFLICT (player)
       DO UPDATE SET seed = EXCLUDED.seed, image_id = NULL, image = NULL, image_type = NULL, updated_at = EXCLUDED.updated_at`,
      [i.player, seed, now])
    return { face: { seed } }
  }
  const bytes = Buffer.from(i.image, 'base64')
  const type = imageTypeOf(bytes)
  if (!type || bytes.length > IMAGE_BYTES) throw new Rejected('image_refused')
  const id = randomBytes(16).toString('hex')
  await store.pool.query(
    `INSERT INTO player_avatars (player, image_id, image, image_type, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (player)
     DO UPDATE SET image_id = EXCLUDED.image_id, image = EXCLUDED.image, image_type = EXCLUDED.image_type, updated_at = EXCLUDED.updated_at`,
    [i.player, id, bytes, type, now])
  return { face: { image: id } }
}

/** An uploaded picture's bytes, by its id, for the web to serve. */
export async function forumImage(store: Store, i: z.infer<typeof imageInput>) {
  const { rows } = await store.pool.query('SELECT image, image_type FROM player_avatars WHERE image_id = $1', [i.id])
  if (!rows[0]?.image) throw new NotFound()
  return { type: rows[0].image_type as string, data: (rows[0].image as Buffer).toString('base64') }
}

/** Every post search engines may read, for the forum's sitemap. */
export async function forumSitemap(store: Store) {
  const { rows } = await store.pool.query(
    `SELECT id, title, last_activity FROM forum_posts
      WHERE hidden_reason IS NULL AND (official OR indexed) ORDER BY id`)
  return { posts: rows.map((r) => ({ id: num(r.id), title: r.title, lastActivity: num(r.last_activity) })) }
}

/** The routes, behind the admission key. */
export function forumRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  // An uploaded picture comes as base64 (SKATGO-232): at most `IMAGE_BYTES`, a third more written out.
  router.use(express.json({ limit: '128kb' }))
  router.use((req, res, nextHandler) => {
    if (!ready()) return void res.status(503).json({ error: 'not_ready' })
    if (!secretEquals(req.get('x-admission-key'), key)) return void res.status(403).json({ error: 'admission_denied' })
    nextHandler()
  })
  const run = (work: (body: unknown) => Promise<unknown>) => async (req: express.Request, res: express.Response) => {
    try {
      res.set('cache-control', 'no-store').json(await work(req.body))
    } catch (e) {
      if (e instanceof z.ZodError) res.status(400).json({ error: 'invalid_request' })
      else if (e instanceof Forbidden) res.status(403).json({ error: 'forbidden' })
      else if (e instanceof NotFound) res.status(404).json({ error: 'not_found' })
      else if (e instanceof TooMany) res.status(429).json({ error: 'limit_reached' })
      else if (e instanceof Rejected) res.status(409).json({ error: e.message })
      else {
        console.error('forum_storage_unavailable')
        res.status(503).json({ error: 'storage_unavailable' })
      }
    }
  }
  router.post('/list', run(async (body) => forumList(store, listInput.parse(body))))
  router.post('/post', run(async (body) => forumPost(store, postInput.parse(body))))
  router.post('/create', run(async (body) => forumCreate(store, createInput.parse(body))))
  router.post('/comment', run(async (body) => forumComment(store, commentInput.parse(body))))
  router.post('/delete', run(async (body) => forumDelete(store, deleteInput.parse(body))))
  router.post('/report', run(async (body) => forumReport(store, reportInput.parse(body))))
  router.post('/reports', run(async (body) => forumReports(store, reportsInput.parse(body))))
  router.post('/moderate', run(async (body) => forumModerate(store, moderateInput.parse(body))))
  router.post('/latest', run(async (body) => forumLatest(store, latestInput.parse(body))))
  router.post('/sitemap', run(async () => forumSitemap(store)))
  router.post('/me', run(async (body) => forumMe(store, meInput.parse(body))))
  router.post('/unread', run(async (body) => forumUnread(store, meInput.parse(body))))
  router.post('/seen', run(async (body) => forumSeen(store, meInput.parse(body))))
  router.post('/face', run(async (body) => forumFace(store, faceInput.parse(body))))
  router.post('/image', run(async (body) => forumImage(store, imageInput.parse(body))))
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
