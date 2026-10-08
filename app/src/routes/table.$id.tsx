import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// A private table (SKATGO-61): one person's page, never indexed (lib/indexability.ts).
export const Route = createFileRoute('/table/$id')({
  head: ({ params }) =>
    pageHead({
      title: m.table_meta_title(),
      description: m.table_meta_description(),
      paths: samePath(`/table/${params.id}`),
      image: 'play',
      jsonLd: [],
    }),
  component: () => <ClientPage page="table" />,
})
