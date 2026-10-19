// POST /api/room/ticket — a private table's way in (SKATGO-61). The table itself is a Colyseus room in
// the multiplayer service, which the browser reaches directly over a WebSocket; this handler hands the
// browser that service's address and a two-minute admission ticket signed with its key
// (lib/room-ticket.ts), so the key itself never leaves the server. Per address, at most ROOM_LIMITS
// tickets: one opens or joins a table, or takes a seat back after a lost connection.
//
// Since SKATGO-117 a ticket says what it is for: `open` needs an account and names it, so the room
// knows its host; `join` needs none. A ticket is issued only while the service can seat people
// (`/readyz`): during a deploy the new service restores its tables first, and until then the browser
// is told `not_ready` and tries again rather than finding no table.
//
// POST /api/room/referral — a guest who signed up while sitting at someone's table (SKATGO-117): the
// new account and the seat it sat in are passed on, and the service records whose table brought it.
// Only an account made within REFERRAL_MS counts — signing in to an older one is not being brought.
//
// Wired in src/server.ts before the page router, like /api/free.

import { issueTicket } from './room-ticket'
import { accountCreatedAt, signedInUser } from './session'

export const ROOM_LIMITS = { count: 120, windowMs: 60 * 60 * 1000 } as const
/** How new an account must be for a table to have brought it. */
export const REFERRAL_MS = 60 * 60 * 1000

const seen = new Map<string, number[]>()

/** Records one ticket and says whether this address may have it. `now` is injectable for tests. */
export function admitTicket(address: string, now = Date.now()): boolean {
  const recent = (seen.get(address) ?? []).filter((t) => now - t < ROOM_LIMITS.windowMs)
  if (recent.length >= ROOM_LIMITS.count) {
    seen.set(address, recent)
    return false
  }
  recent.push(now)
  seen.set(address, recent)
  if (seen.size > 10_000) for (const [k, v] of seen) if (!v.some((t) => now - t < ROOM_LIMITS.windowMs)) seen.delete(k)
  return true
}

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await request.json()
    return b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Whether the service is seating people now. */
async function serviceReady(endpoint: string): Promise<boolean> {
  try {
    return (await fetch(new URL('/readyz', endpoint), { signal: AbortSignal.timeout(3_000) })).ok
  } catch {
    return false
  }
}

const TOKEN = /^[a-f0-9]{64}$/
const ROOM = /^[A-Za-z0-9_-]{1,32}$/

export async function handleRoom(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const path = new URL(request.url).pathname
  if (path !== '/api/room/ticket' && path !== '/api/room/referral') return json(404, { error: 'not found' })
  const endpoint = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!endpoint || !key) return json(503, { error: 'unavailable' })
  if (!admitTicket(clientIp(request))) return json(429, { error: 'slow_down' })
  const input = await body(request)
  if (!input) return json(400, { error: 'invalid_request' })

  if (path === '/api/room/ticket') {
    if (input.for !== 'open' && input.for !== 'join') return json(400, { error: 'invalid_request' })
    let user: string | null = null
    if (input.for === 'open') {
      user = await signedInUser(request)
      if (!user) return json(401, { error: 'sign_in_required' })
    }
    if (!(await serviceReady(endpoint))) return json(503, { error: 'not_ready' })
    const ticket = user ? issueTicket(key, { purpose: 'open', user: `user:${user}` }) : issueTicket(key, { purpose: 'join' })
    return json(200, { endpoint, ticket })
  }

  const { roomId, seatToken } = input
  if (typeof roomId !== 'string' || !ROOM.test(roomId) || typeof seatToken !== 'string' || !TOKEN.test(seatToken)) {
    return json(400, { error: 'invalid_request' })
  }
  const user = await signedInUser(request)
  if (!user) return json(401, { error: 'sign_in_required' })
  const created = await accountCreatedAt(request, user)
  if (created === null || Date.now() - created > REFERRAL_MS) return json(200, { recorded: false })
  try {
    const upstream = await fetch(new URL('/rooms/referral', endpoint), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify({ account: `user:${user}`, roomId, seatToken }),
      signal: AbortSignal.timeout(10_000),
    })
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
