import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

/** Which competition's table (SKATGO-131): the deal of the day with `size=1`, the six-deal tournament without. */
export type DailyPlaySearch = { size?: 1 }

export const Route = createFileRoute('/daily_/play')({
  validateSearch: (search: Record<string, unknown>): DailyPlaySearch => (Number(search.size) === 1 ? { size: 1 } : {}),
  head: () =>
    pageHead({
      title: m.daily_play_meta_title(),
      description: m.daily_play_description(),
      paths: samePath('/daily/play'),
      image: 'daily',
      jsonLd: [breadcrumbs([[m.nav_daily(), '/daily'], [m.daily_play_title(), '/daily/play']])],
    }),
  component: clientPage('dailyPlay'),
})
