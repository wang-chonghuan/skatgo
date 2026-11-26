import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// Hard hands (SKATGO-248): the kinds of hand, each a run of deals from the easiest; a search entry.
export const Route = createFileRoute('/hard-hands')({
  head: () =>
    pageHead({
      title: m.challenge_meta_title(),
      description: m.challenge_meta_description(),
      paths: samePath('/hard-hands'),
      image: 'hard-hands',
      jsonLd: [
        { '@type': 'WebPage', name: m.challenge_title(), description: m.challenge_meta_description(), url: localizedUrl('/hard-hands', getLocale()), inLanguage: getLocale() },
        breadcrumbs([[m.challenge_title(), '/hard-hands']]),
      ],
    }),
  component: clientPage('hardHands'),
})
