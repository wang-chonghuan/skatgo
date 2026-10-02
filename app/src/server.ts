import handler from '@tanstack/react-start/server-entry'

import { handleAsk } from './lib/ask/handler'
import { handleDaily } from './lib/daily-handler'
import { handleFree } from './lib/free-handler'
import { chooseLocale } from './lib/locale'
import { movedTo } from './lib/moved'
import { buildSitemap } from './lib/sitemap'
import { paraglideMiddleware } from './paraglide/server.js'
import { defineCustomServerStrategy } from './paraglide/runtime.js'

// The language rule (SKATGO-23) — see lib/locale.ts and paraglide.options.ts.
defineCustomServerStrategy('custom-skatgo', {
  getLocale: (request) =>
    request ? chooseLocale({ url: request.url, cookie: request.headers.get('cookie'), acceptLanguage: request.headers.get('accept-language') }) : undefined,
})

// The server entry: every request passes Paraglide's middleware first, which settles the request's
// language (URL prefix → saved choice → the browser's first language, German or else English → German
// when the browser names none; lib/locale.ts)
// and redirects a URL without a prefix to the localized one. The router un-prefixes URLs itself
// (router.tsx `rewrite`), so the ORIGINAL request goes to the handler — passing the middleware's
// de-localized one would make both strip the prefix and loop, as the TanStack example warns.
//
// Answered here, before the middleware and without the page router (SKATGO-29):
//   /             302 to the visitor's language, with Vary, so a cache keeps one answer per language;
//   moved pages   301 to where they live now (lib/moved.ts);
//   sitemap.xml   built from the page list (lib/sitemap.ts).
//
// The assistant's endpoint (SKATGO-9) is answered here, before the middleware and outside the page
// router: it is a server route, not a page — no language prefix, no redirect, and nothing that reads
// the page route tree has to know about it. The daily tournament's endpoints (SKATGO-35,
// lib/daily-handler.ts) and free play's (SKATGO-40, lib/free-handler.ts) are answered here for the same
// reason.
export default {
  fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === '/api/ask') return handleAsk(req)
    if (url.pathname.startsWith('/api/daily/')) return handleDaily(req)
    if (url.pathname.startsWith('/api/free/')) return handleFree(req)
    if (url.pathname === '/') {
      const locale = chooseLocale({ url: req.url, cookie: req.headers.get('cookie'), acceptLanguage: req.headers.get('accept-language') })
      return Promise.resolve(new Response(null, { status: 302, headers: { location: `/${locale}${url.search}`, vary: 'Accept-Language, Cookie' } }))
    }
    const moved = movedTo(url.pathname, url.search)
    if (moved) return Promise.resolve(Response.redirect(new URL(moved, url), 301))
    if (url.pathname === '/sitemap.xml') return Promise.resolve(new Response(buildSitemap(), { headers: { 'content-type': 'application/xml; charset=utf-8' } }))
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
}
