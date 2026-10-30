// POST /api/room/ticket — a private room's way in (SKATGO-61). The room itself is a Colyseus room in the
// multiplayer service, which the browser reaches directly over a WebSocket; this handler hands the browser that
// service's address and a two-minute admission ticket signed with its key (lib/room-ticket.ts), so the key itself
// never leaves the server. Per address, at most ROOM_LIMITS tickets: one opens or joins a room, or takes a seat back
// after a lost connection.
//
// Since SKATGO-163 every seat is an account's, so every ticket needs one and names it: `open` a new room, `join` the
// room with this number. Before a join ticket the service is asked what the number is to the account — no room,
// full, its own, or one it may come into — and wrong numbers are counted per account (WRONG_LIMITS), so numbers
// cannot be tried one after another. A ticket is issued only while the service can seat people (`/readyz`): during a
// deploy the new service restores its rooms first, and until then the browser is told `not_ready` and tries again.
//
// POST /api/room/mine — the room the account is in, for the friends page's "Back to room" (SKATGO-163).
//
// POST /api/room/referral — a newcomer who signed up to come into a room (SKATGO-117): the new account and the
// room are passed on, and the service records whose room brought it. Only an account made within REFERRAL_MS
// counts — signing in to an older one is not being brought.
//
// Wired in src/server.ts before the page router, like /api/free.

import { issueTicket, ROOM_CODE } from './room-ticket'
import { accountCreatedAt, signedInUser } from './session'

export const ROOM_LIMITS = { count: 120, windowMs: 60 * 60 * 1000 } as const
/** How new an account must be for a room to have brought it. */
export const REFERRAL_MS = 60 * 60 * 1000
/** Wrong room numbers an account may enter in a minute (SKATGO-163). */
export const WRONG_LIMITS = { count: 10, windowMs: 60 * 1000 } as const

const wrong = new Map<string, number[]>()

/** Whether this account may try another number now; `miss` records a wrong one. `now` is injectable for tests. */
export function mayTryNumber(account: string, miss = false, now = Date.now()): boolean {
  const recent = (wrong.get(account) ?? []).filter((t) => now - t < WRONG_LIMITS.windowMs)
  if (miss) recent.push(now)
  wrong.set(account, recent)
  if (wrong.size > 10_000) for (const [k, v] of wrong) if (!v.some((t) => now - t < WRONG_LIMITS.windowMs)) wrong.delete(k)
  return recent.length < WRONG_LIMITS.count
}

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

/** The service's answer about a room, behind the admission key. */
async function ask(endpoint: string, key: string, path: string): Promise<{ status: number; body: Record<string, unknown> }> {
  const r = await fetch(new URL(path, endpoint), { headers: { 'x-admission-key': key }, signal: AbortSignal.timeout(5_000) })
  return { status: r.status, body: (await r.json().catch(() => ({}))) as Record<string, unknown> }
}

export async function handleRoom(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const path = new URL(request.url).pathname
  if (path !== '/api/room/ticket' && path !== '/api/room/mine' && path !== '/api/room/referral') return json(404, { error: 'not found' })
  const endpoint = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!endpoint || !key) return json(503, { error: 'unavailable' })
  if (!admitTicket(clientIp(request))) return json(429, { error: 'slow_down' })
  const input = await body(request)
  if (!input) return json(400, { error: 'invalid_request' })
  const user = await signedInUser(request)
  if (!user) return json(401, { error: 'sign_in_required' })
  const account = `user:${user}`

  try {
    if (path === '/api/room/mine') {
      const r = await ask(endpoint, key, `/rooms/mine?account=${encodeURIComponent(account)}`)
      return r.status === 200 ? json(200, { room: r.body.room ?? null }) : json(503, { error: 'not_ready' })
    }

    if (path === '/api/room/ticket') {
      if (input.for !== 'open' && input.for !== 'join') return json(400, { error: 'invalid_request' })
      if (input.for === 'open') {
        if (!(await serviceReady(endpoint))) return json(503, { error: 'not_ready' })
        return json(200, { endpoint, ticket: issueTicket(key, { purpose: 'open', user: account }) })
      }
      if (!mayTryNumber(account)) return json(429, { error: 'too_many_tries' })
      const room = typeof input.room === 'string' ? input.room : ''
      if (!ROOM_CODE.test(room)) {
        mayTryNumber(account, true)
        return json(404, { error: 'room_not_found' })
      }
      if (!(await serviceReady(endpoint))) return json(503, { error: 'not_ready' })
      const r = await ask(endpoint, key, `/rooms/${room}?account=${encodeURIComponent(account)}`)
      if (r.status === 404) {
        mayTryNumber(account, true)
        return json(404, { error: 'room_not_found' })
      }
      if (r.status !== 200) return json(503, { error: 'not_ready' })
      if (typeof r.body.elsewhere === 'string') return json(409, { error: 'already_in_room', room: r.body.elsewhere })
      if (r.body.status === 'full') return json(409, { error: 'room_full' })
      return json(200, { endpoint, ticket: issueTicket(key, { purpose: 'join', user: account, room }) })
    }

    const { roomId } = input
    if (typeof roomId !== 'string' || !ROOM_CODE.test(roomId)) return json(400, { error: 'invalid_request' })
    const created = await accountCreatedAt(request, user)
    if (created === null || Date.now() - created > REFERRAL_MS) return json(200, { recorded: false })
    const upstream = await fetch(new URL('/rooms/referral', endpoint), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify({ account, roomId }),
      signal: AbortSignal.timeout(10_000),
    })
    return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
