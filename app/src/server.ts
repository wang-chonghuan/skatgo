import handler from '@tanstack/react-start/server-entry'

import { handleAsk } from './lib/ask/handler'
import { paraglideMiddleware } from './paraglide/server.js'

// The server entry: every request passes Paraglide's middleware first, which settles the request's
// language (URL prefix → saved choice → browser languages → English) and redirects a URL without a
// prefix to the localized one. The router un-prefixes URLs itself (router.tsx `rewrite`), so the
// ORIGINAL request goes to the handler — passing the middleware's de-localized one would make both
// strip the prefix and loop, as the TanStack example warns.
//
// The assistant's endpoint (SKATGO-9) is answered here, before the middleware and outside the page
// router: it is a server route, not a page — no language prefix, no redirect, and nothing that reads
// the page route tree has to know about it.
export default {
  fetch(req: Request): Promise<Response> {
    if (new URL(req.url).pathname === '/api/ask') return handleAsk(req)
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
