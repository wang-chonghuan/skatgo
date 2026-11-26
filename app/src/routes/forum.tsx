import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { FORUM_SORTS, QUERY_MAX, type ForumSort } from '~/lib/forum'
import { readForumList } from '~/lib/forum-api'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

/** `section` is only ever undefined: the lists were one since SKATGO-247, and an old `?section=` link is named here so
 *  it is dropped (below). */
export type ForumSearch = { section?: undefined; page?: number; q?: string; sort?: ForumSort }

// The forum (SKATGO-118): its posts, in whatever language they were written, under this language's words — read on the server so search engines see the list. A later
// page or a search is a view of the same list, never indexed.
export const Route = createFileRoute('/forum')({
  validateSearch: (search: Record<string, unknown>): ForumSearch => {
    const page = Number(search.page)
    // A page that is not one, and any section — the forum has one list since SKATGO-247, so an old `?section=news` or
    // `?section=talk` opens it — is named undefined, not left out: the router keeps a search key the validation drops,
    // and it would still reach the list and fail it.
    // The words searched for and the order (SKATGO-231): a view of the list, like a page; "new" is the default.
    const q = typeof search.q === 'string' ? search.q.trim().slice(0, QUERY_MAX) || undefined : undefined
    const sort = FORUM_SORTS.find((s) => s === search.sort && s !== 'new')
    return { section: undefined, page: Number.isInteger(page) && page > 1 && page <= 1000 ? page : undefined, q, sort }
  },
  loaderDeps: ({ search }) => ({ page: search.page, q: search.q, sort: search.sort }),
  loader: ({ deps }) => readForumList(deps),
  head: ({ match }) => {
    const locale = getLocale()
    const { page, q, sort } = match.search
    const query = new URLSearchParams({
      ...(page ? { page: String(page) } : {}), ...(q ? { q } : {}), ...(sort ? { sort } : {}),
    }).toString()
    return pageHead({
      title: m.forum_meta_title(),
      description: m.forum_meta_description(),
      paths: samePath('/forum'),
      image: 'forum',
      search: query ? `?${query}` : undefined,
      jsonLd: [
        { '@type': 'WebPage', name: m.forum_title(), description: m.forum_meta_description(), url: localizedUrl('/forum', locale), inLanguage: locale },
        breadcrumbs([[m.forum_title(), '/forum']]),
      ],
    })
  },
  component: clientPage('forum'),
})
