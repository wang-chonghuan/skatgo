import { postPath } from '~/lib/forum'
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
const WRITES = new Set(['create', 'comment', 'delete', 'report', 'reports', 'moderate'])

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const officials = () => new Set((process.env.FORUM_OFFICIALS ?? '').split(',').map((s) => s.trim()).filter(Boolean))

/** Asks the forum, as the viewer behind `request`; the answer's status and body as they came. */
export async function askForum(op: string, payload: object, request: Pick<Request, 'url' | 'headers'> | null): Promise<{ status: number; body: unknown }> {
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return { status: 503, body: { error: 'unavailable' } }
  const userId = request ? await signedInUser(request as Request) : null
  const viewer = op === 'latest' ? {} : { player: userId ? `user:${userId}` : null, official: userId !== null && officials().has(userId) }
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

export async function handleForum(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const path = new URL(request.url).pathname
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
