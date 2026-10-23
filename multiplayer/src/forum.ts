import express from 'express'
import type pg from 'pg'
import { z } from 'zod'
import {
  ANNOUNCEMENT_DAYS, COMMENT_MAX, DAILY_LIMITS, FORUM_LANGS, FORUM_SECTIONS, OFFICIAL_SECTIONS, PAGE_SIZE, POST_MAX,
  REASON_MAX, TITLE_MAX, TITLE_MIN, type ForumAnnouncement, type ForumComment, type ForumList, type ForumPost,
  type ForumLang, type ForumPostSummary, type ForumReport, type ForumSection, type ForumThread, plainText, postIndexable,
} from '../../app/src/lib/forum'
import { nameOf } from './daily'
import { Rejected, secretEquals } from './model'
import type { Store } from './store'
import { type Translation, translateForAll, translationsOf } from './translate'

// The forum (SKATGO-118): posts in four sections, in whatever language their authors write, flat comments, and the least moderation the law
// asks of a host — a report, the official hiding with a reason, authors deleting their own. The web service
// calls these routes with the admission key and names the viewer: a signed-in account (`user:<Clerk id>`) or
// nobody, and whether the account is the official's. Only names leave here, never a player id: whether
// something is the viewer's own travels as `mine`. Nothing here notifies anyone (the human: 「也不用通知」).

const DAY = 24 * 60 * 60 * 1000

class Forbidden extends Error {}
class NotFound extends Error {}
class TooMany extends Error {}

const player = z.string().regex(/^user:[A-Za-z0-9_]{1,64}$/)
const id = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const section = z.enum(FORUM_SECTIONS)
const text = (min: number, max: number) => z.string().transform((s) => s.trim()).pipe(z.string().min(min).max(max))
const viewer = { player: player.nullable(), official: z.boolean() }
const author = { player, official: z.boolean() }
const target = z.union([z.object({ post: id }).strict(), z.object({ comment: id }).strict()])

// The reader's language (SKATGO-124): what is written in another comes translated into it.
const lang = z.enum(FORUM_LANGS).optional()
const listInput = z.object({ ...viewer, section: section.optional(), page: z.number().int().min(1).max(1000).optional(), lang }).strict()
const postInput = z.object({ ...viewer, id, lang }).strict()
const createInput = z.object({ ...author, section, title: text(TITLE_MIN, TITLE_MAX), body: text(1, POST_MAX) }).strict()
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
const latestInput = z.object({}).strict()

/** Exactly one of a post or a comment. */
const one = (i: { post?: number; comment?: number }) => target.parse(i.post !== undefined ? { post: i.post } : { comment: i.comment })

const num = (v: unknown) => Number(v)

type PostRow = {
  id: string; section: string; author: string; official: boolean; title: string; body: string
  indexed: boolean; hidden_reason: string | null; created_at: string; last_activity: string; name: string | null; comments: string
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
    id: num(r.id), section: r.section as ForumSection, title: r.title, excerpt: plainText(r.body, 160),
    author: r.name ?? '', official: r.official, createdAt: num(r.created_at), lastActivity: num(r.last_activity),
    comments: num(r.comments), indexed: r.indexed, hidden: r.hidden_reason, mine: who !== null && r.author === who,
  }
  const translated = body || title
    ? { from: (body ?? title)!.from, title: title?.text ?? r.title, excerpt: body ? plainText(body.text, 160) : p.excerpt }
    : null
  return { ...p, indexable: postIndexable(p), translated }
}

// A post with its author's name and the count of comments everyone sees. Hidden posts and comments are seen
// only by their author and the official: `$v` is the viewer (or null), `$o` whether the viewer is official.
const POSTS = `
  SELECT p.*, d.nickname AS name,
    (SELECT count(*) FROM forum_comments c WHERE c.post_id = p.id AND c.hidden_reason IS NULL) AS comments
    FROM forum_posts p LEFT JOIN daily_players d ON d.player = p.author`
const VISIBLE = `(p.hidden_reason IS NULL OR $2::boolean OR p.author = $1)`

/** One page of the posts, newest activity first; the newest announcement of the last two weeks first
 *  of all, on the first page of the whole list or of the announcements. */
export async function forumList(store: Store, i: z.infer<typeof listInput>, now = Date.now()): Promise<ForumList> {
  const page = i.page ?? 1
  // The announcement stands first on the first page, and is left out of every page's own rows.
  const pinned = !i.section || i.section === 'news' ? await latest(store.pool, now) : null
  const lead = pinned && page === 1 ? 1 : 0
  const { rows } = await store.pool.query(
    `${POSTS} WHERE ${VISIBLE} AND ($3::text IS NULL OR p.section = $3) AND p.id <> $4
      ORDER BY p.last_activity DESC, p.id DESC LIMIT $5 OFFSET $6`,
    [i.player, i.official, i.section ?? null, pinned?.id ?? 0, PAGE_SIZE - lead + 1, Math.max(0, (page - 1) * PAGE_SIZE - (pinned ? 1 : 0))],
  )
  const first = lead ? (await store.pool.query(`${POSTS} WHERE p.id = $1`, [pinned!.id])).rows : []
  const all: PostRow[] = [...first, ...rows]
  const known = i.lang ? await translationsOf(store, all.flatMap((r) => [r.title, r.body]), i.lang) : new Map<string, Translation>()
  const posts = all.map((r) => summary(r, i.player, known, i.lang))
  return { posts: posts.slice(0, PAGE_SIZE), more: posts.length > PAGE_SIZE, viewer: { signedIn: i.player !== null, official: i.official } }
}

/** A post and its comments, oldest first, flat. */
export async function forumPost(store: Store, i: z.infer<typeof postInput>): Promise<ForumThread> {
  const { rows } = await store.pool.query(`${POSTS} WHERE p.id = $3 AND ${VISIBLE}`, [i.player, i.official, i.id])
  if (!rows[0]) throw new NotFound()
  const { rows: comments } = await store.pool.query(
    `SELECT c.*, d.nickname AS name FROM forum_comments c LEFT JOIN daily_players d ON d.player = c.author
      WHERE c.post_id = $3 AND (c.hidden_reason IS NULL OR $2::boolean OR c.author = $1) ORDER BY c.created_at, c.id`,
    [i.player, i.official, i.id],
  )
  const known = i.lang
    ? await translationsOf(store, [rows[0].title, rows[0].body, ...comments.map((c) => c.body as string)], i.lang)
    : new Map<string, Translation>()
  const thread: ForumComment[] = comments.map((c) => {
    const t = other(known, c.body, i.lang)
    return {
      id: num(c.id), author: c.name ?? '', official: c.official, body: c.body, createdAt: num(c.created_at),
      hidden: c.hidden_reason, mine: i.player !== null && c.author === i.player, translated: t ? { from: t.from, body: t.text } : null,
    }
  })
  const head = summary(rows[0], i.player, known, i.lang)
  const body = other(known, rows[0].body, i.lang)
  const post: ForumPost = { ...head, body: rows[0].body, thread, translated: head.translated && { ...head.translated, body: body?.text ?? rows[0].body } }
  return { post, viewer: { signedIn: i.player !== null, official: i.official } }
}

/** How many of `what` the author wrote in the last day; past the limit, the write is refused. */
async function withinLimit(c: pg.PoolClient, table: 'forum_posts' | 'forum_comments' | 'forum_reports', column: string, who: string, limit: number, now: number) {
  const { rows } = await c.query(`SELECT count(*)::int AS n FROM ${table} WHERE ${column} = $1 AND created_at > $2`, [who, now - DAY])
  if (rows[0].n >= limit) throw new TooMany()
}

export async function forumCreate(store: Store, i: z.infer<typeof createInput>, now = Date.now()) {
  if (OFFICIAL_SECTIONS.includes(i.section) && !i.official) throw new Forbidden()
  return store.transaction(async (c) => {
    if (!i.official) await withinLimit(c, 'forum_posts', 'author', i.player, DAILY_LIMITS.posts, now)
    // The author stands under their leaderboard name, given now if they have none yet (SKATGO-90).
    await nameOf(c, i.player, now)
    const { rows } = await c.query(
      `INSERT INTO forum_posts (section, author, official, title, body, created_at, last_activity)
       VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id`,
      [i.section, i.player, i.official, i.title, i.body, now],
    )
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
      const { rows } = await c.query('SELECT section, official FROM forum_posts WHERE id = $1', [i.post])
      if (!rows[0]) throw new NotFound()
      // The official's own posts are always indexed, feedback never (SKATGO-118).
      if (rows[0].official || rows[0].section === 'feedback') throw new Rejected('not_markable')
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
    `SELECT id, title, created_at FROM forum_posts WHERE section = 'news' AND hidden_reason IS NULL AND created_at > $1
      ORDER BY created_at DESC, id DESC LIMIT 1`,
    [now - ANNOUNCEMENT_DAYS * DAY])
  return rows[0] ? { id: num(rows[0].id), title: rows[0].title, createdAt: num(rows[0].created_at) } : null
}

/** The announcement of the last two weeks, for the line on the front page and /daily, or null. */
export async function forumLatest(store: Store, _i: z.infer<typeof latestInput>, now = Date.now()) {
  return { announcement: await latest(store.pool, now) }
}

/** Every post search engines may read, for the forum's sitemap. */
export async function forumSitemap(store: Store) {
  const { rows } = await store.pool.query(
    `SELECT id, title, last_activity FROM forum_posts
      WHERE hidden_reason IS NULL AND section <> 'feedback' AND (official OR indexed) ORDER BY id`)
  return { posts: rows.map((r) => ({ id: num(r.id), title: r.title, lastActivity: num(r.last_activity) })) }
}

/** The routes, behind the admission key. */
export function forumRoutes(store: Store, key: string, ready: () => boolean) {
  const router = express.Router()
  router.use(express.json({ limit: '64kb' }))
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
  router.use((_err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ error: 'invalid_request' })
  })
  return router
}
