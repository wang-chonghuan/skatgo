// Who a guest is (SKATGO-35, SKATGO-182): this device — a random id in an httpOnly cookie, stored at the service only
// as its hash, `anon:<sha256>`. The cookie is strictly necessary and nothing else: it is set only once a guest has
// actually played — started the deal of the day, or finished a free game — never for looking, so the site needs no
// consent banner for it (the human, 2026-10-01). It keeps the guest's games, which go to the account when they sign in
// on this device (SKATGO-182, the human: 「游客存档，登录后合并进账号」).
//
// It keeps its first name, `skatgo_daily`, so every guest keeps their id; since SKATGO-182 it is set for all of `/api`
// (free play's too), where it was `/api/daily` only.

const COOKIE = 'skatgo_daily'
const COOKIE_PATH = '/api'
/** 400 days, the longest a browser keeps a cookie. */
const COOKIE_MAX_AGE = 400 * 24 * 60 * 60

/** The device id the browser sent, or null. With the old cookie (path `/api/daily`) and the new one both sent, the
 *  first is the more specific path's: the id the guest has had longest. */
export function guestDevice(request: Request): string | null {
  const found = (request.headers.get('cookie') ?? '').split(';').map((c) => c.trim().split('=')).find(([name]) => name === COOKIE)
  return found && /^[a-f0-9]{64}$/.test(found[1] ?? '') ? found[1] : null
}

/** A new device id. */
export const newDevice = () => hex(crypto.getRandomValues(new Uint8Array(32)))

/** The id the service knows the device by. */
export async function anonOf(device: string): Promise<string> {
  return `anon:${hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(device)))}`
}

/** The cookie that keeps the device id, for all of `/api`. */
export const guestCookie = (device: string) => `${COOKIE}=${device}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`

const hex = (bytes: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
