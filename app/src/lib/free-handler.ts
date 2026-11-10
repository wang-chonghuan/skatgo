import { anonOf, guestCookie, guestDevice, newDevice } from '~/lib/guest'
import { signedInUser } from '~/lib/session'

// POST /api/free/new, /act, /resume, /replay, /review and /talk — free play and lesson 11 on the server (SKATGO-40;
// SKATGO-79: /resume takes a game up from its token after a change of language, /review is a finished
// game's replay with SkatZero's card wherever the player's was not; SKATGO-142: /talk, Lina's and Noah's table talk;
// SKATGO-170: /replay, a finished deal played again, counted nowhere; SKATGO-177: /odds, the win chances; SKATGO-182:
// /again, a deal of the player's record of play played again, as /replay, for an account only). The game
// runs in the multiplayer service; this handler only passes requests on with the service's key and
// keeps the door from being run through: per address, at most FREE_LIMITS new games an hour and
// moves per ten seconds (a classroom or a family often shares one address, so the limits are wide).
// The game's state is the opaque token the page holds. The one identity passed on is the player's with `review`, so
// the finished deal goes into their record of play: a signed-in account's (SKATGO-128), or a guest's device
// (`lib/guest.ts`, SKATGO-182, the human: 「游客存档，登录后合并进账号」), whose cookie the first kept game sets. `again` names the
// account whose record holds the deal.
//
// Wired in src/server.ts before the page router, like /api/daily.

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
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

export async function handleFree(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice('/api/free/'.length)
  if (op !== 'new' && op !== 'act' && op !== 'resume' && op !== 'replay' && op !== 'again' && op !== 'review' && op !== 'talk' && op !== 'odds') return json(404, { error: 'not found' })
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return json(503, { error: 'unavailable' })
  if (!admitFree(op === 'new' || op === 'replay' || op === 'again' ? 'new' : 'act', clientIp(request))) return json(429, { error: 'slow_down' })
  let body: unknown
  try {
    // A new game may name its dealer, free play's round going round (SKATGO-88); nothing else is passed on.
    if (op === 'new') {
      const asked = await request.json().catch(() => ({})) as { dealer?: unknown }
      body = asked && [0, 1, 2].includes(asked.dealer as number) ? { dealer: asked.dealer } : {}
    } else body = await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  // The player is this handler's to name, never the browser's.
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'player' in body) return json(400, { error: 'invalid_request' })
  // A guest's device, made on the first game kept (SKATGO-182).
  let device: { id: string; known: boolean } | null = null
  if (op === 'review' || op === 'again') {
    const userId = await signedInUser(request)
    if (userId) body = { ...body, player: `user:${userId}` }
    // Playing a deal of the record again takes an account (the human: 「想点此处的复牌，必须登录」).
    else if (op === 'again') return json(401, { error: 'sign_in_required' })
    else {
      const known = guestDevice(request)
      device = { id: known ?? newDevice(), known: !!known }
      body = { ...body, player: await anonOf(device.id) }
    }
  }
  try {
    const upstream = await fetch(new URL(`/free/${op}`, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    if (device && (device.known || upstream.ok)) headers['set-cookie'] = guestCookie(device.id)
    return new Response(await upstream.text(), { status: upstream.status, headers })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
