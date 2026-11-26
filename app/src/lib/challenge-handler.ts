import { admitFree, clientIp } from '~/lib/free-handler'
import { signedInUser } from '~/lib/session'

// POST /api/challenge/new, /act, /review and /again — hard hands (SKATGO-248) on the server. As /api/free: the deal runs in
// the multiplayer service, this handler passes requests on with the service's key, under free play's limits per address.
// A challenge is counted nowhere (grill Q2) but in its kind's progress (SKATGO-249): the review names the signed-in
// player, so a passed deal is the account's; /api/challenge/progress and /merge read the account's progress and join a
// guest's to it, for a session only. The player is this handler's to name, never the browser's. Wired in src/server.ts
// before the page router.

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

export async function handleChallenge(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice('/api/challenge/'.length)
  const record = op === 'progress' || op === 'merge'
  if (op !== 'new' && op !== 'act' && op !== 'review' && op !== 'again' && !record) return json(404, { error: 'not found' })
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return json(503, { error: 'unavailable' })
  if (!record && !admitFree(op === 'new' || op === 'again' ? 'new' : 'act', clientIp(request))) return json(429, { error: 'slow_down' })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'player' in body) return json(400, { error: 'invalid_request' })
  let sent: object = body
  if (record || op === 'review') {
    const userId = await signedInUser(request)
    if (userId) sent = { ...body, player: `user:${userId}` }
    else if (record) return json(401, { error: 'signed_out' })
  }
  const path = record ? `/challenge-record/${op === 'progress' ? 'state' : 'merge'}` : `/challenge/${op}`
  try {
    const upstream = await fetch(new URL(path, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify(sent),
      signal: AbortSignal.timeout(15_000),
    })
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
