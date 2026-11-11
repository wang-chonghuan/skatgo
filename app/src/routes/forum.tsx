import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { FORUM_SECTIONS, type ForumSection } from '~/lib/forum'
import { readForumList } from '~/lib/forum-api'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export type ForumSearch = { section?: ForumSection; page?: number }

// The forum (SKATGO-118): its posts, in whatever language they were written, under this language's words — read on the server so search engines see the list. A section or
// a later page is a view of the same list, never indexed.
export const Route = createFileRoute('/forum')({
  validateSearch: (search: Record<string, unknown>): ForumSearch => {
    const section = FORUM_SECTIONS.find((s) => s === search.section)
    const page = Number(search.page)
    // A section or page that is not one is named undefined, not left out: the router keeps a search key the validation
    // drops, so an old `?section=talk` (SKATGO-186 removed the section) would still reach the list and fail it.
    return { section, page: Number.isInteger(page) && page > 1 && page <= 1000 ? page : undefined }
  },
  loaderDeps: ({ search }) => ({ section: search.section, page: search.page }),
  loader: ({ deps }) => readForumList(deps),
  head: ({ match }) => {
    const locale = getLocale()
    const { section, page } = match.search
    const query = new URLSearchParams({ ...(section ? { section } : {}), ...(page ? { page: String(page) } : {}) }).toString()
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
