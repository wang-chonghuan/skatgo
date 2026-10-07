import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/rules_/score-sheet')({
  head: () =>
    pageHead({
      title: m.score_meta_title(),
      description: m.score_meta_description(),
      paths: samePath('/rules/score-sheet'),
      image: 'score-sheet',
      jsonLd: [
        { '@type': 'WebPage', name: m.score_title(), description: m.score_meta_description(), url: localizedUrl('/rules/score-sheet', getLocale()), inLanguage: getLocale() },
        breadcrumbs([[m.rules_title(), '/rules'], [m.score_title(), '/rules/score-sheet']]),
      ],
    }),
  component: () => <ClientPage page="scoreSheet" />,
})
