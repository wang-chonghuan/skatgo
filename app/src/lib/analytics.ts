import { createIsomorphicFn } from '@tanstack/react-start'

import { SITE_URL } from '~/lib/site'

// Product analytics (SKATGO-25): PostHog Cloud EU, organisation SkatGo, project `skatgo` — wired the way
// Risetive (trovestep, TROVESTEP-315/318) wires it.

/**
 * The PostHog project key, read from the server's environment on every server render. The key is
 * public by design — it ships to the browser — but it is configuration, not code: unset (development,
 * tests, a ticket worktree without it) or malformed means analytics is simply not loaded.
 *
 * On the client it is never read again. The first page arrives with the server's answer in the root
 * loader's data, and PostHog, once started, stays started; a server function would have to cross the
 * language middleware (src/server.ts), which redirects every URL without a language prefix.
 */
export const readProjectKey = createIsomorphicFn()
  .server((): string | null => {
    const key = process.env.POSTHOG_PROJECT_KEY?.trim() ?? ''
    return /^phc_[A-Za-z0-9]+$/.test(key) ? key : null
  })
  .client((): string | null => null)

/**
 * Only the published site reports. Derived from SITE_URL rather than listed again, so localhost, a
 * ticket preview and the Render service hostname (skatgo.onrender.com) send nothing — which is what
 * keeps development and diagnostic traffic out of the project.
 */
export function isPublishedSite(hostname: string): boolean {
  const host = new URL(SITE_URL).hostname
  return hostname === host || hostname.endsWith(`.${host}`)
}
