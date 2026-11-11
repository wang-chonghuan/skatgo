import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// The page the service worker shows when the network fails (SKATGO-185, public/sw.js).
export const Route = createFileRoute('/offline')({
  head: () =>
    pageHead({
      title: m.offline_meta_title(),
      description: m.offline_meta_description(),
      paths: samePath('/offline'),
      image: 'home',
      jsonLd: [],
    }),
  component: clientPage('offline'),
})
