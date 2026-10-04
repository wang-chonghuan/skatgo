import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/daily_/play')({
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
