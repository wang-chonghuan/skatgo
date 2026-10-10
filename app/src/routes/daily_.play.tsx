import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { DAILY_DEALS, type DailySize, dailySize } from '~/lib/daily'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/daily_/play')({
  // Which of the day's tournaments is played (SKATGO-77); the six-deal one needs no parameter.
  validateSearch: (search: Record<string, unknown>): { deals?: DailySize } => {
    const deals = dailySize(search.deals)
    return deals === DAILY_DEALS ? {} : { deals }
  },
  head: () =>
    pageHead({
      title: m.daily_play_meta_title(),
      description: m.daily_play_description(),
      paths: samePath('/daily/play'),
      image: 'daily',
      jsonLd: [breadcrumbs([[m.nav_daily(), '/daily'], [m.daily_play_title(), '/daily/play']])],
    }),
  component: () => <ClientPage page="dailyPlay" />,
})
