import { clerkClient } from '@clerk/tanstack-react-start/server'

import { SITE_URL } from '~/lib/site'
import { testAccount } from '~/lib/test-account'

// Who is signed in behind a server request (SKATGO-12): read by the server routes — the assistant
// (SKATGO-9) to count questions by account, the daily tournament (SKATGO-35) to record a day's deals
// under the account, a private table (SKATGO-117) to let an account open one. Server only. A local test
// account (lib/test-account.ts) answers first, on a developer's machine only.

/**
 * Which pages may present a session token here: the site itself — and, when this server is being
 * reached on the developer's own machine, the local page talking to it. The test is the request's own
 * host rather than NODE_ENV, which the build compiles to "production" even for a local run. Clerk's
 * production instance never issues a token to a localhost page, so in production this admits only
 * the site. A token minted for any other origin is refused.
 */
function authorizedParties(request: Request): string[] {
  const here = new URL(request.url)
  const local = here.hostname === 'localhost' || here.hostname === '127.0.0.1'
  return local ? [SITE_URL, here.origin] : [SITE_URL]
}

/**
 * The signed-in learner behind this request, or null. Clerk reads only the URL and the headers (the
 * session cookie), and it copies the request it is given — which fails once the body has been read —
 * so it gets exactly those two and the body stays the caller's. A failure at Clerk counts as signed
 * out: signing in gates nothing, so it must not be able to break asking or playing either.
 */
export async function signedInUser(request: Request): Promise<string | null> {
  const test = testAccount(request)
  if (test) return test.userId
  try {
    const credentials = new Request(request.url, { headers: request.headers })
    const state = await clerkClient().authenticateRequest(credentials, { authorizedParties: authorizedParties(request) })
    return state.toAuth()?.userId ?? null
  } catch {
    return null
  }
}

/** When this request's account was made (ms), or null if that cannot be told. */
export async function accountCreatedAt(request: Request, userId: string): Promise<number | null> {
  const test = testAccount(request)
  if (test && test.userId === userId) return test.createdAt
  try {
    return (await clerkClient().users.getUser(userId)).createdAt
  } catch {
    return null
  }
}
