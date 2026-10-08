import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/with-friends')({
  head: () =>
    pageHead({
      title: m.friends_meta_title(),
      description: m.friends_meta_description(),
      paths: samePath('/with-friends'),
      image: 'play',
      jsonLd: [breadcrumbs([[m.friends_title(), '/with-friends']])],
    }),
  component: () => <ClientPage page="friends" />,
})
