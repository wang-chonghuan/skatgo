import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// The bidding practice (SKATGO-149): ten cards, a seat, how high do you bid. A search entry of its own.
export const Route = createFileRoute('/bidding-practice')({
  head: () =>
    pageHead({
      title: m.bidpractice_meta_title(),
      description: m.bidpractice_meta_description(),
      paths: samePath('/bidding-practice'),
      image: 'tricks-exercises',
      jsonLd: [breadcrumbs([[m.bidpractice_title(), '/bidding-practice']])],
    }),
  component: clientPage('biddingPractice'),
})
