import * as avataaars from '@dicebear/avataaars'
import { createAvatar } from '@dicebear/core'
import multiavatar from '@multiavatar/multiavatar/esm'

import { AVATAR_SEED_MAX, AVATAR_STYLE, IMAGE_ID, IMAGE_TYPES, postPath } from '~/lib/forum'
import { avatarGrounds } from '../theme/constants'
import { samePath } from '~/lib/head'
import { signedInUser } from '~/lib/session'
import { sitemapXml } from '~/lib/sitemap'

// POST /api/forum/<op> — the forum's only way in from the browser (SKATGO-118). The forum lives in the
// multiplayer service; this handler says who is asking — the signed-in account or nobody — and whether that
// account is the official's (FORUM_OFFICIALS, a comma list of Clerk account ids), and passes the request on
// with the service's key. Reading needs no account; every write does. Nothing here sets a cookie.
//
// Also /sitemap-forum.xml: the posts search engines may read.
//
// Wired in src/server.ts before the page router, like /api/daily: it is not a page.

const PREFIX = '/api/forum/'
const READS = new Set(['list', 'post', 'latest'])
// The account's own (SKATGO-232) — its face, its mentions and their count — take a signed-in account like a write.
const WRITES = new Set(['create', 'comment', 'delete', 'report', 'reports', 'moderate', 'me', 'unread', 'seen', 'face'])

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const officials = () => new Set((process.env.FORUM_OFFICIALS ?? '').split(',').map((s) => s.trim()).filter(Boolean))

/** Asks the forum, as the viewer behind `request`; the answer's status and body as they came. */
export async function askForum(op: string, payload: object, request: Pick<Request, 'url' | 'headers'> | null): Promise<{ status: number; body: unknown }> {
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return { status: 503, body: { error: 'unavailable' } }
  const userId = request ? await signedInUser(request as Request) : null
  const viewer = op === 'latest' || op === 'image' ? {} : { player: userId ? `user:${userId}` : null, official: userId !== null && officials().has(userId) }
  try {
    const upstream = await fetch(new URL(`/forum/${op}`, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify({ ...payload, ...viewer }),
      // The announcement line waits on the front page's render, so it gives up soon; nothing shows instead.
      signal: AbortSignal.timeout(op === 'latest' ? 1_500 : 10_000),
    })
    return { status: upstream.status, body: await upstream.json() }
  } catch {
    return { status: 503, body: { error: 'unavailable' } }
  }
}

// The avatars (SKATGO-231): DiceBear's Avataaars (Pablo Stanley's design, free for personal and commercial use), on a
// round soft tint of the site's colours so each sits in its circle. Since SKATGO-233 exactly as E on SKATGO-231's
// comparison sheet (the human: 「截图里的这一版e不错。当线上的那一版e，完全不行，人是哭的，嘴里流绿水的……就用你现在给我看的图片的
// 这一套，肤色也不限制，不禁止黑人，就跟你图上的参数一样」): its own hair colours, beards and glasses now and then, and only
// calm mouths, eyes and brows — no tears, tongues or sick; every skin tone.
const MATURE = {
  backgroundColor: avatarGrounds,
  radius: 50,
  hairColor: ['e8e1e1', 'ecdcbf', '724133', '2c1b18', 'a55728'],
  facialHairProbability: 45,
  accessoriesProbability: 40,
  accessories: ['prescription01', 'prescription02', 'round'],
  mouth: ['default', 'smile', 'twinkle', 'serious'],
  eyes: ['default', 'happy', 'side', 'squint'],
  eyebrows: ['default', 'defaultNatural', 'raisedExcited', 'flatNatural'],
} satisfies Partial<avataaars.Options & { backgroundColor: string[]; radius: number }>

/** The text an avatar address names, or null — for an avatar, only at the current style's address. */
function seedOf(path: string, kind: 'avatar' | 'multiavatar'): string | null {
  const prefix = kind === 'avatar' ? `avatar\\/${AVATAR_STYLE}` : 'multiavatar'
  const match = new RegExp(`^\\/api\\/forum\\/${prefix}\\/([^/]+)\\.svg$`).exec(path)
  try {
    const seed = match ? decodeURIComponent(match[1]) : null
    return seed && seed.length <= AVATAR_SEED_MAX ? seed : null
  } catch {
    return null
  }
}

const svg = (body: string) =>
  new Response(body, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'",
      'x-content-type-options': 'nosniff',
    },
  })

/** GET /api/forum/avatar/<style>/<text>.svg[?square] — the picture of a text, a post's title or a player's name: DiceBear's Avataaars,
 *  drawn here, never by dicebear.com, so no visitor's address leaves the site; the text is not in the picture. The
 *  same text is always the same picture, so a browser keeps it for a year. GET /api/forum/multiavatar/<text>.svg is
 *  the first try's Multiavatar, kept for now (the human: 「老的集成暂时不用删」) and shown nowhere. */
function avatar(request: Request, path: string): Response {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json(405, { error: 'GET only' })
  const kind = path.startsWith(`${PREFIX}multiavatar/`) ? 'multiavatar' : 'avatar'
  const seed = seedOf(path, kind)
  if (!seed) return json(404, { error: 'not found' })
  // `?square`: the same picture on a square ground, filling the table's square face box as free play's faces do (SKATGO-238,
  // the human: 「默认的框不是方形吗……怎么改成圆形了？」).
  const square = new URL(request.url).searchParams.has('square')
  return svg(kind === 'multiavatar' ? multiavatar(seed) : createAvatar(avataaars, { seed, ...MATURE, ...(square ? { radius: 0 } : {}) }).toString())
}

/** GET /api/forum/avatar/u/<id> — a picture a player uploaded (SKATGO-232), as the forum keeps it: a new id with each
 *  upload, so a browser keeps it for a year; a picture replaced or removed is not found. */
async function uploaded(request: Request, id: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json(405, { error: 'GET only' })
  if (!IMAGE_ID.test(id)) return json(404, { error: 'not found' })
  const answer = await askForum('image', { id }, null)
  const found = answer.body as { type?: string; data?: string }
  if (answer.status !== 200 || !found.data || !IMAGE_TYPES.some((t) => t === found.type)) {
    return json(answer.status === 404 ? 404 : 503, { error: answer.status === 404 ? 'not found' : 'unavailable' })
  }
  return new Response(Buffer.from(found.data, 'base64'), {
    headers: {
      'content-type': found.type!,
      'cache-control': 'public, max-age=31536000, immutable',
      'content-security-policy': "default-src 'none'",
      'x-content-type-options': 'nosniff',
    },
  })
}

export async function handleForum(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname
  if (path.startsWith(`${PREFIX}avatar/u/`)) return uploaded(request, path.slice(`${PREFIX}avatar/u/`.length))
  if (path.startsWith(`${PREFIX}avatar/`) || path.startsWith(`${PREFIX}multiavatar/`)) return avatar(request, path)
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = path.startsWith(PREFIX) ? path.slice(PREFIX.length) : ''
  if (!READS.has(op) && !WRITES.has(op)) return json(404, { error: 'not found' })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  // Who is asking is this handler's to say, never the browser's.
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'player' in body || 'official' in body) return json(400, { error: 'invalid_request' })
  if (WRITES.has(op) && !(await signedInUser(request))) return json(401, { error: 'signed_out' })
  const answer = await askForum(op, body, request)
  return json(answer.status, answer.body as object)
}

/** The forum's sitemap: every post search engines may read, at its address in each language of the site, as the
 *  site's pages are in /sitemap.xml. 503 when the forum does not answer, so a crawler comes back rather than
 *  forgetting the posts. */
export async function forumSitemap(): Promise<Response> {
  const answer = await askForum('sitemap', {}, null)
  if (answer.status !== 200) return new Response('forum unavailable\n', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '600' } })
  const posts = (answer.body as { posts: { id: number; title: string }[] }).posts
  const xml = sitemapXml(posts.map((p) => samePath(postPath(p))))
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
