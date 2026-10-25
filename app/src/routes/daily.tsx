import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { DAILY_DEALS } from '~/lib/daily'
import { readAnnouncement } from '~/lib/forum-api'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'
import { localizedUrl } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

/** Which side of the page (SKATGO-131): the deal of the day by default, the six-deal tournament with `t=6`. */
export type DailySearch = { t?: 6 }

export const Route = createFileRoute('/daily')({
  validateSearch: (search: Record<string, unknown>): DailySearch => (Number(search.t) === 6 ? { t: 6 } : {}),
  // The forum's newest announcement, as a line on the page (SKATGO-118).
  loader: () => readAnnouncement(),
  // The tournament's side (`?t=6`) is the same page turned to the other competition: not a search entry of its own.
  head: ({ match }) =>
    pageHead({
      search: match.search.t ? `?t=${match.search.t}` : undefined,
      title: m.daily_meta_title(),
      description: m.daily_meta_description({ n: DAILY_DEALS }),
      paths: samePath('/daily'),
      image: 'daily',
      jsonLd: [
        { '@type': 'WebPage', name: m.daily_title({ n: DAILY_DEALS }), description: m.daily_meta_description({ n: DAILY_DEALS }), url: localizedUrl('/daily', getLocale()), inLanguage: getLocale(), isAccessibleForFree: true },
        breadcrumbs([[m.nav_daily(), '/daily']]),
      ],
    }),
  component: clientPage('daily'),
})
