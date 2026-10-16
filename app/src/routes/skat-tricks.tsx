import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// The Skat-Tricks section (SKATGO-82): since SKATGO-103 its page is the exercises, by kind; the first
// article has its own address under it.
export const Route = createFileRoute('/skat-tricks')({
  head: () =>
    pageHead({
      title: m.tricks_hub_meta_title(),
      description: m.tricks_hub_meta_description(),
      paths: samePath('/skat-tricks'),
      image: 'tricks-exercises',
      jsonLd: [breadcrumbs([[m.tricks_title(), '/skat-tricks']])],
    }),
  component: clientPage('tricks'),
})
