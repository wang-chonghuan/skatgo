// POST /api/room/ticket — a private table's way in (SKATGO-61). The table itself is a Colyseus room in
// the multiplayer service, which the browser reaches directly over a WebSocket; this handler hands the
// browser that service's address and a two-minute admission ticket signed with its key
// (lib/room-ticket.ts), so the key itself never leaves the server. Per address, at most ROOM_LIMITS
// tickets: one opens or joins a table, or takes a seat back after a lost connection.
//
// Wired in src/server.ts before the page router, like /api/free.

import { issueTicket } from './room-ticket'

export const ROOM_LIMITS = { count: 120, windowMs: 60 * 60 * 1000 } as const

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

export function handleRoom(request: Request): Response {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  if (new URL(request.url).pathname !== '/api/room/ticket') return json(404, { error: 'not found' })
  const endpoint = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!endpoint || !key) return json(503, { error: 'unavailable' })
  if (!admitTicket(clientIp(request))) return json(429, { error: 'slow_down' })
  return json(200, { endpoint, ticket: issueTicket(key) })
}
