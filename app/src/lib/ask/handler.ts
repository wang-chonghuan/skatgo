import { clerkClient } from '@clerk/tanstack-react-start/server'

import { askModel, type ChatMessage } from './azure'
import { type AskPage, TABLE_CHARS, buildSystemPrompt, isLocale } from './context'
import { LIMITS, admit } from './limits'
import { SITE_URL } from '~/lib/site'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

// POST /api/ask — the assistant popup's only endpoint (SKATGO-9). It is the one server-side route of
// the site: the model key must not reach the browser, so the browser sends the question and which
// page it is on, and this handler builds the context, applies the limits and forwards to the model.
// The request and the answer are not stored anywhere. Anyone may ask, signed in or not (SKATGO-13):
// the session is read only to count a signed-in learner's questions by account rather than by address;
// it never decides whether a question is answered.
//
// It is wired in src/server.ts, before Paraglide's middleware and outside the page router — it is not
// a page: it has no language form of its own, and anything that walks the app's route manifest for
// pages (the sitemap, the post-deploy check) must not meet it.
//
// Body, as deep-chat sends it plus `additionalBodyProps`:
//   { messages: [{ role: 'user' | 'ai', text }], locale, page: 'home' | 'lesson' | 'play', lessonId?, table? }
// Reply, as deep-chat reads it: { text } or { error }.

type Body = { messages?: unknown; locale?: unknown; page?: unknown; lessonId?: unknown; table?: unknown }

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const refuse = (status: number, locale: Locale, text: string) => json(status, { error: text })

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
 * so it gets exactly those two and the body stays this handler's. A failure at Clerk counts as signed
 * out: signing in gates nothing, so it must not be able to break asking either.
 */
async function signedInUser(request: Request): Promise<string | null> {
  try {
    const credentials = new Request(request.url, { headers: request.headers })
    const state = await clerkClient().authenticateRequest(credentials, { authorizedParties: authorizedParties(request) })
    return state.toAuth()?.userId ?? null
  } catch {
    return null
  }
}

/** The visitor's address, as the platform's proxy passes it on. */
function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

export async function handleAsk(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'POST only' })

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return json(400, { error: 'bad request' })
  }
  const locale: Locale = isLocale(body.locale) ? body.locale : 'en'
  const opts = { locale }


  let page: AskPage | null = null
  if (body.page === 'home') page = { kind: 'home' }
  else if (body.page === 'lesson' && typeof body.lessonId === 'string') page = { kind: 'lesson', lessonId: body.lessonId }
  else if (body.page === 'play' && typeof body.table === 'string') {
    if (body.table.length > TABLE_CHARS) return refuse(413, locale, m.ask_error({}, opts))
    page = { kind: 'play', table: body.table }
  }
  if (!page) return refuse(400, locale, m.ask_error({}, opts))
  const system = buildSystemPrompt(locale, page)
  if (!system) return refuse(404, locale, m.ask_error({}, opts))

  if (!Array.isArray(body.messages) || body.messages.length === 0) return refuse(400, locale, m.ask_error({}, opts))
  const messages: ChatMessage[] = []
  for (const item of body.messages.slice(-LIMITS.messages)) {
    const { role, text } = (item ?? {}) as { role?: unknown; text?: unknown }
    if (typeof text !== 'string' || text.trim() === '') continue
    if (text.length > LIMITS.questionChars) return refuse(413, locale, m.ask_too_long({ n: LIMITS.questionChars }, opts))
    messages.push({ role: role === 'ai' ? 'assistant' : 'user', content: text })
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return refuse(400, locale, m.ask_error({}, opts))

  // Who is asking, for the rate: the account when signed in (a school or household behind one address
  // does not share one allowance), otherwise the address.
  const userId = await signedInUser(request)
  const refusal = admit(userId ? `user:${userId}` : `ip:${clientIp(request)}`)
  if (refusal === 'rate') return refuse(429, locale, m.ask_rate_limited({}, opts))
  if (refusal === 'daily') return refuse(429, locale, m.ask_daily_limited({}, opts))

  const result = await askModel(system, messages)
  if (result.ok) return json(200, { text: result.text })
  if (result.status === 'unconfigured') return refuse(503, locale, m.ask_unavailable({}, opts))
  return refuse(502, locale, m.ask_error({}, opts))
}
