import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { DAILY_DEALS } from '~/lib/daily'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'
import { localizedUrl } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/daily')({
  head: () =>
    pageHead({
      title: m.daily_meta_title(),
      description: m.daily_meta_description({ deals: DAILY_DEALS }),
      paths: samePath('/daily'),
      image: 'daily',
      jsonLd: [
        { '@type': 'WebPage', name: m.daily_title({ deals: DAILY_DEALS }), description: m.daily_meta_description({ deals: DAILY_DEALS }), url: localizedUrl('/daily', getLocale()), inLanguage: getLocale(), isAccessibleForFree: true },
        breadcrumbs([[m.nav_daily(), '/daily']]),
      ],
    }),
  component: () => <ClientPage page="daily" />,
})
