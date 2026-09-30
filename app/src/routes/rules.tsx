import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/rules')({
  head: () =>
    pageHead({
      title: m.rules_meta_title(),
      description: m.rules_meta_description(),
      paths: samePath('/rules'),
      image: 'rules',
      jsonLd: [breadcrumbs([[m.rules_title(), '/rules']])],
    }),
  component: () => <ClientPage page="rules" />,
})
