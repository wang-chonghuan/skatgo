import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { DAILY_DEALS } from '~/lib/daily'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/daily')({
  head: () =>
    pageHead({
      title: m.daily_meta_title(),
      description: m.daily_meta_description({ deals: DAILY_DEALS }),
      paths: samePath('/daily'),
      image: 'daily',
      jsonLd: [breadcrumbs([[m.nav_daily(), '/daily']])],
    }),
  component: () => <ClientPage page="daily" />,
})
