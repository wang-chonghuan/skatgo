import { signedInUser } from '~/lib/session'

// POST /api/tricks/ladder/state, /answer and /merge — the "Sieg sichern" ladder's record (SKATGO-109): which
// steps an account answered right and how many times wrong — and /api/tricks/bidding/* the same for the bidding
// practice (SKATGO-150): each question's first answer and whether it was put right since. The record lives in the multiplayer service; this
// handler only says whose it is and passes the request on with the service's key. Only an account has one —
// a guest's first steps stay in the browser (lib/skat/tricks/ladder-progress.ts) — so a request without a
// session is refused, and nothing here sets a cookie.
//
// Wired in src/server.ts before the page router, like /api/daily: it is not a page.

const RECORD = /^\/api\/tricks\/(ladder|bidding)\/(state|answer|merge)$/

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

export async function handleTricks(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const match = RECORD.exec(new URL(request.url).pathname)
  if (!match) return json(404, { error: 'not found' })
  const [, record, op] = match
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return json(503, { error: 'unavailable' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  // The player is this handler's to name, never the browser's.
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'player' in body) return json(400, { error: 'invalid_request' })
  const userId = await signedInUser(request)
  if (!userId) return json(401, { error: 'signed_out' })

  try {
    const upstream = await fetch(new URL(`/${record}/${op}`, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify({ ...body, player: `user:${userId}` }),
      signal: AbortSignal.timeout(10_000),
    })
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
