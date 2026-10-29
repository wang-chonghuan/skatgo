// Local test accounts (SKATGO-117): how acceptance checks act as a signed-in learner without Clerk, whose
// sign-in an automated check may not perform. Only on a developer's own machine, and only when both hold:
//   1. this server's environment says so — `SKATGO_TEST_ACCOUNTS=1`, which only a local `app/.env` carries
//      (production's variables are listed in operations.md; this is not among them);
//   2. the request itself was made to this machine — its host is `localhost` or `127.0.0.1`.
// Then the cookie `skatgo_test_account=<name>.<created ms>` signs the request in as `test_<name>`, made at
// that time. Read only by lib/session.ts — every server route sees an ordinary account — and by the root
// route, which hands it to the page (lib/use-account.ts). Server only, but for `readTestAccount`.

import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

const COOKIE = 'skatgo_test_account'
const VALUE = /^([a-z0-9]{1,24})\.(\d{13})$/

export type TestAccount = { userId: string; createdAt: number }

export function testAccount(request: Pick<Request, 'url' | 'headers'>): TestAccount | null {
  if (process.env.SKATGO_TEST_ACCOUNTS !== '1') return null
  const host = new URL(request.url).hostname
  if (host !== 'localhost' && host !== '127.0.0.1') return null
  const raw = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  const found = raw ? VALUE.exec(raw) : null
  return found ? { userId: `test_${found[1]}`, createdAt: Number(found[2]) } : null
}

/** The test account behind the page's own request, for the page (the root route's loader); null in the
 *  browser and whenever the two conditions above do not hold. */
export const readTestAccount = createIsomorphicFn()
  .server((): TestAccount | null => testAccount(getRequest()))
  .client((): TestAccount | null => null)
