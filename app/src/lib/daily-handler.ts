import { isLocale } from '~/lib/ask/context'
import { admit } from '~/lib/ask/limits'
import { explainReview } from '~/lib/daily-review'
import { signedInUser } from '~/lib/session'
import type { DealReview } from '~/lib/skat/tournament'

// POST /api/daily/state, /act, /name, /board and /review — the daily tournament's only way in from the
// browser (SKATGO-35, SKATGO-36: a finished player's nickname, and the leaderboard; SKATGO-79: a finished
// deal's worst card, which the service finds, explained here by the assistant's model). The tournament itself runs in the multiplayer service, which owns the cards and the
// scores; this handler only says who is playing and passes the request on with the service's key.
//
// Who is playing: the signed-in account, or else this device — a random id in an httpOnly cookie,
// stored at the service only as its hash. The cookie is strictly necessary and nothing else: it is
// set only when a guest actually starts the day's deals, never for looking at /daily, so the site
// needs no consent banner for it (the human, 2026-10-01). When someone signs in with a device entry
// for today, that entry moves to the account (the service decides whether it may).
//
// Wired in src/server.ts before the page router, like /api/ask: it is not a page.

const COOKIE = 'skatgo_daily'
const COOKIE_PATH = '/api/daily'
/** 400 days, the longest a browser keeps a cookie. */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60
const OPS = new Set(['state', 'act', 'name', 'board', 'review'])

const json = (status: number, body: object, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

function deviceId(request: Request): string | null {
  const found = (request.headers.get('cookie') ?? '').split(';').map((c) => c.trim().split('=')).find(([name]) => name === COOKIE)
  return found && /^[a-f0-9]{64}$/.test(found[1] ?? '') ? found[1] : null
}

const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')

export async function handleDaily(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  const op = new URL(request.url).pathname.slice(`${COOKIE_PATH}/`.length)
  if (!OPS.has(op)) return json(404, { error: 'not found' })
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

  const known = deviceId(request)
  const device = known ?? hex(crypto.getRandomValues(new Uint8Array(32)))
  const anon = `anon:${hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(device)))}`
  const userId = await signedInUser(request)
  // Opening the deals (state with `open`) or making a move is playing; anything else only looks.
  const playing = op === 'act' || (op === 'state' && (body as { open?: unknown }).open === true)
  // Looking at the board needs no player: a visitor nobody knows yet asks as nobody.
  const player = userId ? `user:${userId}` : known || playing || op === 'state' ? anon : null
  if ((op === 'name' || op === 'review') && !player) return json(409, { error: 'not_finished' })

  const call = (path: string, payload: object) =>
    fetch(new URL(`/daily/${path}`, base), {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admission-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

  try {
    if (userId && known && (op === 'state' || op === 'board')) await call('claim', { from: anon, to: `user:${userId}` })
    if (op === 'review') return await review(call, body as { locale?: unknown }, player!)
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

/** A finished deal's review (SKATGO-79): the worst card from the service, and a few sentences on it from
 *  the assistant's model in the page's language — counted against the same per-visitor and daily limits
 *  as the assistant. Without the sentences (limited, or the model unavailable) the card is still shown. */
async function review(call: (path: string, payload: object) => Promise<Response>, body: { locale?: unknown }, player: string): Promise<Response> {
  const { locale, ...rest } = body
  const upstream = await call('review', { ...rest, player })
  if (!upstream.ok) return new Response(await upstream.text(), { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })
  const found = (await upstream.json()) as DealReview
  if (!found.worst) return json(200, { review: found, text: null })
  const limited = admit(player) !== null
  const text = limited ? null : await explainReview(found, isLocale(locale) ? locale : 'de')
  return json(200, { review: found, text, limited })
}
