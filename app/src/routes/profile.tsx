import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/profile')({
  head: () =>
    pageHead({
      title: m.profile_meta_title(),
      description: m.profile_lead(),
      paths: samePath('/profile'),
      image: 'daily',
      jsonLd: [breadcrumbs([[m.profile_title(), '/profile']])],
    }),
  component: clientPage('profile'),
})
