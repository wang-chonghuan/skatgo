import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { DAILY_DEALS, DAILY_LENGTHS, type DailySize, dailySize } from '~/lib/daily'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'
import { localizedUrl } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/daily')({
  // Which of the day's tournaments the page shows (SKATGO-77); the six-deal one needs no parameter.
  validateSearch: (search: Record<string, unknown>): { deals?: DailySize } => {
    const deals = dailySize(search.deals)
    return deals === DAILY_DEALS ? {} : { deals }
  },
  head: () =>
    pageHead({
      title: m.daily_meta_title(),
      description: m.daily_meta_description(DAILY_LENGTHS),
      paths: samePath('/daily'),
      image: 'daily',
      jsonLd: [
        { '@type': 'WebPage', name: m.daily_title(DAILY_LENGTHS), description: m.daily_meta_description(DAILY_LENGTHS), url: localizedUrl('/daily', getLocale()), inLanguage: getLocale(), isAccessibleForFree: true },
        breadcrumbs([[m.nav_daily(), '/daily']]),
      ],
    }),
  component: () => <ClientPage page="daily" />,
})
