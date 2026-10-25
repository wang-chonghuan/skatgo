import handler from '@tanstack/react-start/server-entry'

import { handleCard, handleDaily } from './lib/daily-handler'
import { UNAVAILABLE } from './lib/forum-api'
import { forumSitemap, handleForum } from './lib/forum-handler'
import { handleFree } from './lib/free-handler'
import { handleRoom } from './lib/room-handler'
import { handleTricks } from './lib/tricks-handler'
import { chooseLocale, rootLocale } from './lib/locale'
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
// language (explicit URL, including the German root → saved choice → browser preference → German
// when the browser names none; lib/locale.ts)
// and redirects a URL without a prefix to the localized one. The router un-prefixes URLs itself
// (router.tsx `rewrite`), so the ORIGINAL request goes to the handler — passing the middleware's
// de-localized one would make both strip the prefix and loop, as the TanStack example warns.
//
// Answered here, before the middleware and without the page router (SKATGO-29):
//   moved pages   301 to where they live now (lib/moved.ts);
//   sitemap.xml   built from the page list (lib/sitemap.ts);
//   sitemap-forum.xml  the forum's posts search engines may read, from the forum (SKATGO-118,
//                 lib/forum-handler.ts);
//   /             a visitor whose language is not German goes to /en, the query kept (SKATGO-113,
//                 lib/locale.ts rootLocale) — here and not in the middleware, which redirects only a
//                 browser's document request and would otherwise serve English at the German address.
//                 Both answers vary with the language and the saved choice.
//
// The API endpoints are answered here, before the middleware and outside the page router: they are server
// routes, not pages — no language prefix, no redirect, and nothing that reads the page route tree has to know
// about them. The daily tournament's endpoints (SKATGO-35,
// lib/daily-handler.ts), free play's (SKATGO-40, lib/free-handler.ts) and a private table's admission
// and its referral (SKATGO-61, SKATGO-117, lib/room-handler.ts), the ladder's record (SKATGO-109, lib/tricks-handler.ts)
// and the forum (SKATGO-118, lib/forum-handler.ts). The assistant's /api/ask is gone (SKATGO-130).
export default {
  fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname.startsWith('/api/daily/')) return handleDaily(req)
    if (url.pathname.startsWith('/api/free/')) return handleFree(req)
    if (url.pathname.startsWith('/api/room/')) return handleRoom(req)
    if (url.pathname.startsWith('/api/tricks/')) return handleTricks(req)
    if (url.pathname.startsWith('/api/forum/')) return handleForum(req)
    if (url.pathname.startsWith('/api/card/')) return handleCard(req)
    const moved = movedTo(url.pathname, url.search)
    // Keep the public scheme when TLS terminates at the reverse proxy.
    if (moved) return Promise.resolve(new Response(null, { status: 301, headers: { location: moved } }))
    if (url.pathname === '/sitemap-forum.xml') return forumSitemap()
    if (url.pathname === '/sitemap.xml') return Promise.resolve(new Response(buildSitemap(), { headers: { 'content-type': 'application/xml; charset=utf-8' } }))
    if (url.pathname === '/') {
      const vary = { vary: 'Accept-Language, Cookie' }
      if (rootLocale({ cookie: req.headers.get('cookie'), acceptLanguage: req.headers.get('accept-language') }) !== 'de')
        return Promise.resolve(new Response(null, { status: 307, headers: { location: `/en${url.search}`, ...vary } }))
      return paraglideMiddleware(req, () => handler.fetch(req)).then((res) => withHeaders(res, vary))
    }
    return paraglideMiddleware(req, () => handler.fetch(req)).then(unavailable)
  },
}

/** A page whose data could not be read (a forum post while the forum does not answer, SKATGO-118) is marked by
 *  its loader; it goes out as a 503, so a crawler comes back instead of dropping it. */
function unavailable(res: Response): Response {
  if (!res.headers.has(UNAVAILABLE)) return res
  const out = new Response(res.body, { status: 503, statusText: 'Service Unavailable', headers: res.headers })
  out.headers.delete(UNAVAILABLE)
  out.headers.set('retry-after', '600')
  return out
}

/** The response with these headers added; a fresh one when its own headers are immutable. */
function withHeaders(res: Response, headers: Record<string, string>): Response {
  const out = new Response(res.body, res)
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v)
  return out
}
