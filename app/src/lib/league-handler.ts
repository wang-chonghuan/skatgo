// POST /api/league/state, /checkin, /play, /ticket and /review — the League's way in from the browser (SKATGO-204). The
// League runs in the multiplayer service (its coins, tiers, tables and their rooms); this handler says which account
// asks and passes the request on with the service's key. Everything but looking needs an account: a guest sees the tiers,
// their fees and the Legend board, and is told to sign in.
//
// `/play` waits while the service looks for other people of the account's tier (up to five seconds) and answers the
// table's room; `/ticket` signs the two-minute admission ticket to that room (lib/room-ticket.ts) for the account seated
// there — at the start, and to come back after a lost connection. `/review` is a finished deal at the account's table,
// worked out for its seat, as free play's review is.
//
// Wired in src/server.ts before the page router, like /api/room.

import { admitTicket } from './room-handler'
import { issueTicket } from './room-ticket'
import { signedInUser } from './session'

const OPS = new Set(['state', 'checkin', 'play', 'ticket', 'review'])

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

/** The service's answer, behind its key; null when it cannot be reached. */
async function call(endpoint: string, key: string, op: string, body: object, ms = 10_000): Promise<{ status: number; data: Record<string, unknown> } | null> {
  try {
    const r = await fetch(new URL(`/league/${op}`, endpoint), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ms),
    })
    return { status: r.status, data: (await r.json().catch(() => ({}))) as Record<string, unknown> }
  } catch {
    return null
  }
}

export async function handleLeague(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice('/api/league/'.length)
  if (!OPS.has(op)) return json(404, { error: 'not found' })
  const endpoint = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!endpoint || !key) return json(503, { error: 'unavailable' })
  let input: Record<string, unknown> = {}
  try {
    const b = await request.json()
    if (b && typeof b === 'object' && !Array.isArray(b)) input = b as Record<string, unknown>
  } catch {
    // An empty body is no question of its own.
  }
  const user = await signedInUser(request)
  const player = user ? `user:${user}` : null
  if (op === 'state') {
    const r = await call(endpoint, key, 'state', { player })
    return r ? json(r.status, r.data) : json(503, { error: 'unavailable' })
  }
  if (!player) return json(401, { error: 'sign_in_required' })
  if ((op === 'play' || op === 'ticket') && !admitTicket(clientIp(request))) return json(429, { error: 'slow_down' })

  if (op === 'checkin') {
    const r = await call(endpoint, key, 'checkin', { player })
    return r ? json(r.status, r.data) : json(503, { error: 'unavailable' })
  }
  if (op === 'play') {
    // The wait for others of the tier, then the table being made.
    const r = await call(endpoint, key, 'play', { player }, 30_000)
    return r ? json(r.status, r.data) : json(503, { error: 'not_ready' })
  }
  if (op === 'review') {
    const r = await call(endpoint, key, 'review', { player, match: input.match, deal: input.deal }, 30_000)
    return r ? json(r.status, r.data) : json(503, { error: 'unavailable' })
  }
  // The ticket to the account's own table, while it runs.
  const r = await call(endpoint, key, 'state', { player })
  if (!r || r.status !== 200) return json(503, { error: 'not_ready' })
  const room = (r.data.me as { table?: unknown } | null)?.table
  if (typeof room !== 'string') return json(404, { error: 'no_table' })
  return json(200, { endpoint, room, ticket: issueTicket(key, { purpose: 'join', user: player, room }) })
}
