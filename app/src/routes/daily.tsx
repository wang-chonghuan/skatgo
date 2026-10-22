import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { DAILY_DEALS } from '~/lib/daily'
import { readAnnouncement } from '~/lib/forum-api'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'
import { localizedUrl } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/daily')({
  // The forum's newest announcement, as a line on the page (SKATGO-118).
  loader: () => readAnnouncement(),
  head: () =>
    pageHead({
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
