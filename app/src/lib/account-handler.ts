import { clerkClient } from '@clerk/tanstack-react-start/server'

import { callDaily } from '~/lib/daily-handler'
import { guestCookie, newDevice } from '~/lib/guest'
import { signedInUser } from '~/lib/session'
import { testAccount } from '~/lib/test-account'

// An account deleted by its owner (SKATGO-185): `POST /api/account/delete`, signed in. What SkatGo holds under the
// account goes first, in the game service (`/daily/forget`, multiplayer/src/forget.ts), then the account at Clerk — so
// a failure at Clerk leaves an account that can be deleted again, never data without its account. The answer gives the
// browser a new device id, so its next guest games are a stranger's. A local test account (SKATGO-117) has no Clerk
// user: its cookie is cleared instead, which is its signing out. Server only.

const PREFIX = '/api/account'
const SKATGO_TEST_COOKIE = 'skatgo_test_account'

const json = (status: number, body: object, cookies: string[] = []) => {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  for (const c of cookies) headers.append('set-cookie', c)
  return new Response(JSON.stringify(body), { status, headers })
}

export async function handleAccount(request: Request): Promise<Response> {
  if (new URL(request.url).pathname !== `${PREFIX}/delete`) return json(404, { error: 'not found' })
  if (request.method !== 'POST') return json(405, { error: 'POST only' })
  // Only the site's own script asks, with JSON: a page elsewhere cannot send that without the browser asking first.
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json(415, { error: 'json_only' })
  const userId = await signedInUser(request)
  if (!userId) return json(401, { error: 'sign_in_required' })

  try {
    const forgotten = callDaily('forget', { player: `user:${userId}` })
    if (!forgotten || !(await forgotten).ok) return json(503, { error: 'unavailable' })
  } catch {
    return json(503, { error: 'unavailable' })
  }

  const cookies = [guestCookie(newDevice())]
  const test = testAccount(request)
  if (test && test.userId === userId) {
    cookies.push(`${SKATGO_TEST_COOKIE}=; Path=/; Max-Age=0`)
  } else {
    try {
      await clerkClient().users.deleteUser(userId)
    } catch (e) {
      // Already gone at Clerk — an earlier deletion that stopped half-way — is what was asked.
      if ((e as { status?: unknown }).status !== 404) return json(502, { error: 'account_unavailable' })
    }
  }
  return json(200, { deleted: true }, cookies)
}
