import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// A shared deal played as practice (SKATGO-132): the table, the whole screen. Not a search entry.
export const Route = createFileRoute('/d_/$code/play')({
  head: ({ params }) =>
    pageHead({
      title: m.practice_title(),
      description: m.shared_title(),
      paths: samePath(`/d/${params.code}/play`),
      image: 'daily',
      jsonLd: [],
    }),
  component: clientPage('practice'),
})
