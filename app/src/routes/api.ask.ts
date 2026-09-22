import { createFileRoute } from '@tanstack/react-router'

import { askModel, type ChatMessage, isConfigured } from '~/lib/ask/azure'
import { type AskPage, TABLE_CHARS, buildSystemPrompt, isLocale } from '~/lib/ask/context'
import { LIMITS, admit } from '~/lib/ask/limits'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'

// POST /api/ask — the assistant popup's only endpoint (SKATGO-9). It is the one server-side route of
// the site: the model key must not reach the browser, so the browser sends the question and which
// page it is on, and this handler builds the context, applies the limits and forwards to the model.
// The request and the answer are not stored anywhere. Paraglide's middleware is told to leave this
// path alone (paraglide.options.ts), or it would redirect it to a language prefix.
//
// Body, as deep-chat sends it plus `additionalBodyProps`:
//   { messages: [{ role: 'user' | 'ai', text }], locale, page: 'home' | 'lesson' | 'play', lessonId?, table? }
// Reply, as deep-chat reads it: { text } or { error }.

type Body = { messages?: unknown; locale?: unknown; page?: unknown; lessonId?: unknown; table?: unknown }

const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

const refuse = (status: number, locale: Locale, text: string) => json(status, { error: text })

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

export const Route = createFileRoute('/api/ask')({
  server: {
    handlers: {
      // A GET says whether the helper is switched on — it is what the post-deploy check in
      // operations.md sees when it walks the route tree, and what a person sees who opens the URL.
      GET: () => json(200, { ok: true, configured: isConfigured() }),
      POST: async ({ request }) => {
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

        const refusal = admit(clientIp(request))
        if (refusal === 'rate') return refuse(429, locale, m.ask_rate_limited({}, opts))
        if (refusal === 'daily') return refuse(429, locale, m.ask_daily_limited({}, opts))

        const result = await askModel(system, messages)
        if (result.ok) return json(200, { text: result.text })
        if (result.status === 'unconfigured') return refuse(503, locale, m.ask_unavailable({}, opts))
        return refuse(502, locale, m.ask_error({}, opts))
      },
    },
  },
})
