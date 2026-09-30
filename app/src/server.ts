import handler from '@tanstack/react-start/server-entry'

import { handleAsk } from './lib/ask/handler'
import { chooseLocale } from './lib/locale'
import { paraglideMiddleware } from './paraglide/server.js'
import { defineCustomServerStrategy } from './paraglide/runtime.js'

// The language rule (SKATGO-23) — see lib/locale.ts and paraglide.options.ts.
defineCustomServerStrategy('custom-skatgo', {
  getLocale: (request) =>
    request ? chooseLocale({ url: request.url, cookie: request.headers.get('cookie'), acceptLanguage: request.headers.get('accept-language') }) : undefined,
})

// The server entry: every request passes Paraglide's middleware first, which settles the request's
// language (URL prefix → saved choice → German or English from the browser → English; lib/locale.ts)
// and redirects a URL without a prefix to the localized one. The router un-prefixes URLs itself
// (router.tsx `rewrite`), so the ORIGINAL request goes to the handler — passing the middleware's
// de-localized one would make both strip the prefix and loop, as the TanStack example warns.
//
// The Chinese pages were removed (SKATGO-28). Their addresses are indexed and bookmarked, so /zh and
// /zh/... answer a permanent redirect to the same page in English, before the language middleware —
// which no longer knows /zh and would otherwise treat it as an unprefixed path.
//
// The assistant's endpoint (SKATGO-9) is answered here, before the middleware and outside the page
// router: it is a server route, not a page — no language prefix, no redirect, and nothing that reads
// the page route tree has to know about it.
export default {
  fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/api/ask') return handleAsk(req)
    if (url.pathname === '/zh' || url.pathname.startsWith('/zh/')) return Promise.resolve(Response.redirect(new URL(`/en${url.pathname.slice(3)}${url.search}`, url), 301))
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
