import { RELAY_PATH } from './analytics'
import { clientIp } from './free-handler'

// The way product analytics reaches PostHog Cloud EU (SKATGO-152): through skatgo.com itself, under a path that
// names nothing, so a blocker that drops requests to PostHog's domains or to the usual proxy paths lets the site's
// own events through. Static scripts come from PostHog's assets host, everything else from its ingestion host; the
// visitor's address goes on as X-Forwarded-For, so PostHog places the visitor and not this server. Nothing but the
// body and what describes it goes on: never the site's cookies, which hold the Clerk session.

const API = 'https://eu.i.posthog.com'
const ASSETS = 'https://eu-assets.i.posthog.com'
const PASSED = ['content-type', 'content-encoding', 'user-agent']

export async function relayAnalytics(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.slice(RELAY_PATH.length) || '/'
  const host = path.startsWith('/static/') || path.startsWith('/array/') ? ASSETS : API
  const headers = new Headers()
  for (const name of PASSED) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('x-forwarded-for', clientIp(request))
  const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer()
  try {
    const res = await fetch(`${host}${path}${url.search}`, { method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(10_000) })
    // fetch has already decoded the body, so its encoding and length no longer describe it.
    const out = new Headers(res.headers)
    for (const name of ['content-encoding', 'content-length', 'set-cookie']) out.delete(name)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out })
  } catch {
    return new Response(null, { status: 502 })
  }
}
