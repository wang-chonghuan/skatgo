import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { BID_LADDER } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/rules_/bidding-table')({
  head: () => {
    const description = m.bidding_meta_description({ min: BID_LADDER[0], max: BID_LADDER[BID_LADDER.length - 1] })
    return pageHead({
      title: m.bidding_meta_title(),
      description,
      paths: samePath('/rules/bidding-table'),
      image: 'bidding-table',
      jsonLd: [
        { '@type': 'WebPage', name: m.bidding_title(), description, url: localizedUrl('/rules/bidding-table', getLocale()), inLanguage: getLocale() },
        breadcrumbs([[m.rules_title(), '/rules'], [m.bidding_title(), '/rules/bidding-table']]),
      ],
    })
  },
  component: () => <ClientPage page="biddingTable" />,
})
