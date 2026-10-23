import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'

import type { ForumAnnouncement, ForumList, ForumReport, ForumSection, ForumThread } from './forum'
import { askForum } from './forum-handler'
import { getLocale } from '~/paraglide/runtime'

// The forum's calls (SKATGO-118). The pages' reads run in their routes' loaders: on the server they ask the
// forum directly, as the request's viewer, so its lists and posts are in the HTML; in the browser they go
// through /api/forum. Writes are the browser's only.

/** The response header a page sets when the data it shows could not be read (src/server.ts). */
export const UNAVAILABLE = 'x-skatgo-unavailable'

export type ForumAnswer<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

const answerOf = <T>(status: number, body: unknown): ForumAnswer<T> =>
  status >= 200 && status < 300 ? { ok: true, data: body as T } : { ok: false, status, error: String((body as { error?: unknown })?.error ?? 'unavailable') }

async function viaApi<T>(op: string, payload: object): Promise<ForumAnswer<T>> {
  try {
    const res = await fetch(`/api/forum/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    return answerOf<T>(res.status, await res.json())
  } catch {
    return { ok: false, status: 503, error: 'unavailable' }
  }
}

/** The announcement line asks on every front page; on the server one answer serves a minute, per language. */
const LATEST_MS = 60_000
const latestSeen = new Map<string, { at: number; answer: ForumAnswer<unknown> }>()

const read = createIsomorphicFn()
  .server(async (op: 'list' | 'post' | 'latest', payload: object): Promise<ForumAnswer<unknown>> => {
    if (op === 'latest') {
      const lang = String((payload as { lang?: unknown }).lang ?? '')
      const seen = latestSeen.get(lang)
      if (seen && Date.now() - seen.at < LATEST_MS) return seen.answer
      const { status, body } = await askForum(op, payload, null)
      const answer = answerOf(status, body)
      latestSeen.set(lang, { at: Date.now(), answer })
      return answer
    }
    const { status, body } = await askForum(op, payload, getRequest())
    // A post the forum could not answer for is not a post that does not exist: the crawler is told to come back
    // (src/server.ts turns this mark into a 503; the router itself answers only 200, 404 or 500). The list stays a
    // page of its own, its lead and sections, with a line saying the posts cannot be read now.
    if (status >= 500 && op === 'post') setResponseHeader(UNAVAILABLE, 'forum')
    return answerOf(status, body)
  })
  .client((op: 'list' | 'post' | 'latest', payload: object): Promise<ForumAnswer<unknown>> => viaApi(op, payload))

// Read in the page's language: what is written in the other comes translated (SKATGO-124).
export const readForumList = (input: { section?: ForumSection; page?: number }) => read('list', { ...input, lang: getLocale() }) as Promise<ForumAnswer<ForumList>>
export const readForumPost = (id: number) => read('post', { id, lang: getLocale() }) as Promise<ForumAnswer<ForumThread>>

/** The newest announcement of the last two weeks, or null — also when the forum does not answer: the line
 *  simply is not there. */
export async function readAnnouncement(): Promise<ForumAnnouncement | null> {
  const answer = (await read('latest', { lang: getLocale() })) as ForumAnswer<{ announcement: ForumAnnouncement | null }>
  return answer.ok ? answer.data.announcement : null
}

export const createPost = (input: { section: ForumSection; title: string; body: string }) =>
  viaApi<{ id: number; title: string }>('create', input)
export const addComment = (post: number, body: string) => viaApi<{ id: number }>('comment', { post, body })
export const deleteOwn = (what: { post: number } | { comment: number }) => viaApi<{ deleted: true }>('delete', what)
export const report = (what: { post: number } | { comment: number }, reason: string) => viaApi<{ reported: true }>('report', { ...what, reason })
export const readReports = () => viaApi<{ reports: ForumReport[] }>('reports', {})
export type Moderation =
  | { action: 'hide'; reason: string; post?: number; comment?: number }
  | { action: 'restore'; post?: number; comment?: number }
  | { action: 'dismiss'; report: number }
  | { action: 'index' | 'unindex'; post: number }
export const moderate = (m: Moderation) => viaApi<{ done: true }>('moderate', m)
