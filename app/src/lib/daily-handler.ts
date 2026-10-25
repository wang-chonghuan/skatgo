import { signedInUser } from '~/lib/session'

// POST /api/daily/state, /act, /name, /board, /review and /elo — the daily tournament's only way in from the
// browser (SKATGO-35, SKATGO-36: a finished player's nickname, and the leaderboard; SKATGO-79: a finished
// deal's replay with SkatZero's card wherever the player's was not; SKATGO-123: the Elo board, everyone's; SKATGO-128:
// /profile, an account's record of play). The tournament itself runs in the
// multiplayer service, which owns the cards and the scores; this handler only says who is playing and
// passes the request on with the service's key.
//
// Playing needs an account (SKATGO-123, the human: 「要求参加锦标赛必须登录」): opening the day's deals or making a
// move as a guest is refused with 401; looking — the day's status, the boards — stays open to everyone.
//
// Who is playing: the signed-in account, or else this device — a random id in an httpOnly cookie,
// stored at the service only as its hash. The cookie is strictly necessary and nothing else: it is
// set only when a guest actually starts the day's deals, never for looking at /daily, so the site
// needs no consent banner for it (the human, 2026-10-01). When someone signs in with a device entry
// for today, that entry moves to the account (the service decides whether it may).
//
// Wired in src/server.ts before the page router: it is not a page.

const COOKIE = 'skatgo_daily'
const COOKIE_PATH = '/api/daily'
/** 400 days, the longest a browser keeps a cookie. */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60
const OPS = new Set(['state', 'act', 'name', 'nick', 'board', 'review', 'elo', 'profile', 'share', 'shared', 'practice-new', 'practice-act'])
/** The shared deal of the day's operations (SKATGO-132), answered by the service's /share routes: the player's code
 *  for today's finished deal; what a code shares; a past day's deal played as practice. */
const SHARE_PATHS: Record<string, string> = { share: 'code', shared: 'read', 'practice-new': 'practice/new', 'practice-act': 'practice/act' }

/** A shared deal's card (SKATGO-132): `/api/card/<code>-<de|en>-<wide|tall>.png`, drawn by the service, kept a day by
 *  whoever fetches it. Anything else under /api/card is not found. */
export async function handleCard(request: Request): Promise<Response> {
  const m = /^\/api\/card\/([a-z0-9]{8})-(de|en)-(wide|tall)\.png$/.exec(new URL(request.url).pathname)
  if (!m) return json(404, { error: 'not found' })
  try {
    const upstream = await callShare('card', { code: m[1], lang: m[2], shape: m[3] })
    if (!upstream) return json(503, { error: 'unavailable' })
    if (!upstream.ok) return json(upstream.status, { error: 'not found' })
    return new Response(await upstream.arrayBuffer(), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}

/** A call to the service's /share routes with its key; null when this server is not given the service. */
export function callShare(path: string, payload: object): Promise<Response> | null {
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return null
  return fetch(new URL(`/share/${path}`, base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admission-key': key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
}

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

/** A call to the tournament service with its key; null when this server is not given the service. */
export function callDaily(path: string, payload: object): Promise<Response> | null {
  const base = process.env.MULTIPLAYER_URL
  const key = process.env.MULTIPLAYER_ADMISSION_KEY
  if (!base || !key) return null
  return fetch(new URL(`/daily/${path}`, base), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-admission-key': key },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  })
}

function deviceId(request: Request): string | null {
  const found = (request.headers.get('cookie') ?? '').split(';').map((c) => c.trim().split('=')).find(([name]) => name === COOKIE)
  return found && /^[a-f0-9]{64}$/.test(found[1] ?? '') ? found[1] : null
}

const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')

export async function handleDaily(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice(`${COOKIE_PATH}/`.length)
  if (!OPS.has(op)) return json(404, { error: 'not found' })
  if (!process.env.MULTIPLAYER_URL || !process.env.MULTIPLAYER_ADMISSION_KEY) return json(503, { error: 'unavailable' })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'invalid_request' })
  }
  // The player is this handler's to name, never the browser's.
  if (!body || typeof body !== 'object' || Array.isArray(body) || 'player' in body) return json(400, { error: 'invalid_request' })

  const known = deviceId(request)
  const device = known ?? hex(crypto.getRandomValues(new Uint8Array(32)))
  const anon = `anon:${hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(device)))}`
  const userId = await signedInUser(request)
  // Opening the deals (state with `open`) or making a move is playing; anything else only looks. The deal of the day
  // (size 1) a guest may play too (SKATGO-131, the human: 游客能打); the tournament of six needs an account.
  const playing = op === 'act' || (op === 'state' && (body as { open?: unknown }).open === true)
  if (playing && !userId && (body as { size?: unknown }).size !== 1) return json(401, { error: 'sign_in_required' })
  // Looking at the board needs no player: a visitor nobody knows yet asks as nobody. The Elo board is
  // everyone's, asked as nobody whoever looks.
  const player = op === 'elo' ? null : userId ? `user:${userId}` : known || playing || op === 'state' ? anon : null
  // A code, a practice game: nobody's (SKATGO-132). The player's own code needs who they are, guest or account.
  if (op in SHARE_PATHS) {
    if (op === 'share' && !player) return json(409, { error: 'not_finished' })
    try {
      const upstream = await callShare(SHARE_PATHS[op], op === 'share' ? { player } : body)!
      return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
    } catch {
      return json(503, { error: 'unavailable' })
    }
  }
  if (op === 'review' && !player) return json(409, { error: 'not_finished' })
  // The nickname is an account's, set in the settings (SKATGO-126).
  // So is the record of play (SKATGO-128).
  if ((op === 'name' || op === 'nick' || op === 'profile') && !userId) return json(401, { error: 'sign_in_required' })

  const call = (path: string, payload: object) => callDaily(path, payload)!

  try {
    if (userId && known && (op === 'state' || op === 'board')) await call('claim', { from: anon, to: `user:${userId}` })
    const upstream = await call(op, { ...body, player })
    const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    // A guest without the cookie who only looks is a stranger the service has never seen: "not
    // started", and no cookie. The id is kept only once a guest's play has been accepted.
    if (!known && !userId && playing && upstream.ok) {
      headers['set-cookie'] = `${COOKIE}=${device}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
    }
    return new Response(await upstream.text(), { status: upstream.status, headers })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
