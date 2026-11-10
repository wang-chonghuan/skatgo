import { anonOf, guestCookie, guestDevice, newDevice } from '~/lib/guest'
import { signedInUser } from '~/lib/session'

// POST /api/daily/state, /act, /name, /board, /review and /xp — the daily tournament's only way in from the
// browser (SKATGO-35, SKATGO-36: a finished player's nickname, and the leaderboard; SKATGO-79: a finished
// deal's replay with SkatZero's card wherever the player's was not; SKATGO-172: the XP board, everyone's; SKATGO-128:
// /profile, the record of play — an account's, or since SKATGO-182 a guest's own games). The tournament itself runs in the
// multiplayer service, which owns the cards and the scores; this handler only says who is playing and
// passes the request on with the service's key.
//
// Playing needs an account (SKATGO-123, the human: 「要求参加锦标赛必须登录」): opening the day's deals or making a
// move as a guest is refused with 401; looking — the day's status, the boards — stays open to everyone.
//
// Who is playing: the signed-in account, or else this device (`lib/guest.ts`). When someone signs in on a device that
// played as a guest, the device's games go to the account: today's entry moves (the service decides whether it may),
// and every game of the device counts as the account's (SKATGO-182).
//
// Wired in src/server.ts before the page router: it is not a page.

const PREFIX = '/api/daily'
const OPS = new Set(['state', 'act', 'name', 'nick', 'board', 'review', 'xp', 'profile', 'share', 'shared', 'practice-new', 'practice-act', 'practice-review', 'talk'])
/** The shared deal of the day's operations (SKATGO-132), answered by the service's /share routes: the player's code
 *  for today's finished deal; what a code shares; a past day's deal played as practice — or today's, played again by
 *  whoever finished it, with its review (SKATGO-177). */
const SHARE_PATHS: Record<string, string> = { share: 'code', shared: 'read', 'practice-new': 'practice/new', 'practice-act': 'practice/act', 'practice-review': 'practice/review' }

/** A shared deal's card (SKATGO-132): `/api/card/<code>-<de|en>.png`, drawn by the service, kept a day by
 *  whoever fetches it. Anything else under /api/card is not found. */
export async function handleCard(request: Request): Promise<Response> {
  const m = /^\/api\/card\/([a-z0-9]{8})-(de|en)\.png$/.exec(new URL(request.url).pathname)
  if (!m) return json(404, { error: 'not found' })
  try {
    const upstream = await callShare('card', { code: m[1], lang: m[2] })
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

/** The asks after which a signed-in device's guest games go to the account (SKATGO-182): the day's page and boards, and
 *  the front page's XP board and progress, so they count from the first page after signing in. */
const CLAIMING = new Set(['state', 'board', 'xp', 'profile'])

export async function handleDaily(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice(`${PREFIX}/`.length)
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

  const known = guestDevice(request)
  const device = known ?? newDevice()
  const anon = await anonOf(device)
  const userId = await signedInUser(request)
  // Opening the deals (state with `open`) or making a move is playing; anything else only looks. The deal of the day
  // (size 1) a guest may play too (SKATGO-131, the human: 游客能打); the tournament of six needs an account.
  const playing = op === 'act' || (op === 'state' && (body as { open?: unknown }).open === true)
  if (playing && !userId && (body as { size?: unknown }).size !== 1) return json(401, { error: 'sign_in_required' })
  // Looking at the board needs no player: a visitor nobody knows yet asks as nobody. The XP board is
  // everyone's; an account asks as itself, so its own row is marked, and a guest as nobody (SKATGO-172).
  const player = op === 'xp' ? (userId ? `user:${userId}` : null) : userId ? `user:${userId}` : known || playing || op === 'state' ? anon : null
  // A code, a practice game: nobody's (SKATGO-132). The player's own code needs who they are, guest or account; so does
  // today's deal played again, which only whoever finished it may (SKATGO-177) — the player named here, never by the page.
  if (op in SHARE_PATHS) {
    if (op === 'share' && !player) return json(409, { error: 'not_finished' })
    // A practice game names its day, and from the record of play (SKATGO-182) which tournament's deal it is.
    const { day, size, deal } = body as { day?: unknown; size?: unknown; deal?: unknown }
    const payload = op === 'share' ? { player } : op === 'practice-new' ? { day, ...(size === undefined ? {} : { size, deal }), ...(player ? { player } : {}) } : body
    try {
      const upstream = await callShare(SHARE_PATHS[op], payload)!
      return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
    } catch {
      return json(503, { error: 'unavailable' })
    }
  }
  if (op === 'review' && !player) return json(409, { error: 'not_finished' })
  // Lina's and Noah's talk is about the asker's own deal (SKATGO-142): nobody's, nothing to say.
  if (op === 'talk' && !player) return json(200, { kind: null })
  // The nickname is an account's, set in the settings (SKATGO-126).
  if ((op === 'name' || op === 'nick') && !userId) return json(401, { error: 'sign_in_required' })
  // A guest's record of play is the games of this device (SKATGO-182); a device that never played has none.
  if (op === 'profile' && !userId && !known) return json(200, { deals: [], notes: [] })

  const call = (path: string, payload: object) => callDaily(path, payload)!

  try {
    if (userId && known && CLAIMING.has(op)) await call('claim', { from: anon, to: `user:${userId}` })
    const upstream = await call(op, { ...body, player })
    const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    // A guest without the cookie who only looks is a stranger the service has never seen: "not
    // started", and no cookie. The id is kept only once a guest's play has been accepted. A known one is set again for
    // all of /api, so free play keeps the same guest's games (SKATGO-182).
    if (known || (!userId && playing && upstream.ok)) headers['set-cookie'] = guestCookie(device)
    return new Response(await upstream.text(), { status: upstream.status, headers })
  } catch {
    return json(503, { error: 'unavailable' })
  }
}
