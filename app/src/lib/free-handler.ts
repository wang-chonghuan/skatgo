// POST /api/free/new and /api/free/act — free play and lesson 11 on the server (SKATGO-40). The game
// runs in the multiplayer service; this handler only passes requests on with the service's key and
// keeps the door from being run through: per address, at most FREE_LIMITS new games an hour and
// moves per ten seconds (a classroom or a family often shares one address, so the limits are wide).
// No identity, no cookie: the game's state is the opaque token the page holds in memory.
//
// Wired in src/server.ts before the page router, like /api/ask and /api/daily.

export const FREE_LIMITS = {
  newGames: { count: 300, windowMs: 60 * 60 * 1000 },
  moves: { count: 200, windowMs: 10 * 1000 },
} as const

const seen = { new: new Map<string, number[]>(), act: new Map<string, number[]>() }

/** Records one request and says whether this address may make it. `now` is injectable for tests. */
export function admitFree(op: 'new' | 'act', address: string, now = Date.now()): boolean {
  const limit = op === 'new' ? FREE_LIMITS.newGames : FREE_LIMITS.moves
  const map = seen[op]
  const recent = (map.get(address) ?? []).filter((t) => now - t < limit.windowMs)
  if (recent.length >= limit.count) {
    map.set(address, recent)
    return false
  }
  recent.push(now)
  map.set(address, recent)
  // Forget addresses that have gone quiet, so the map does not grow without end.
  if (map.size > 10_000) for (const [k, v] of map) if (!v.some((t) => now - t < limit.windowMs)) map.delete(k)
  return true
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

/** The visitor's address, as the platform's proxy passes it on. */
function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

export async function handleFree(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice('/api/free/'.length)
  if (op !== 'new' && op !== 'act') return json(404, { error: 'not found' })
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return json(503, { error: 'unavailable' })
  if (!admitFree(op, clientIp(request))) return json(429, { error: 'slow_down' })
  let body: unknown
  try {
    body = op === 'new' ? {} : await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  try {
    const upstream = await fetch(new URL(`/free/${op}`, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
