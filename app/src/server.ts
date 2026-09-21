import handler from '@tanstack/react-start/server-entry'

import { paraglideMiddleware } from './paraglide/server.js'

// The server entry: every request passes Paraglide's middleware first, which settles the request's
// language (URL prefix → saved choice → browser languages → English) and redirects a URL without a
// prefix to the localized one. The router un-prefixes URLs itself (router.tsx `rewrite`), so the
// ORIGINAL request goes to the handler — passing the middleware's de-localized one would make both
// strip the prefix and loop, as the TanStack example warns.
export default {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
