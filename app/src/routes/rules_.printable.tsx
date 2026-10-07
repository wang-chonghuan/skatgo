import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/rules_/printable')({
  head: () =>
    pageHead({
      title: m.summary_meta_title(),
      description: m.summary_meta_description(),
      paths: samePath('/rules/printable'),
      image: 'rules-printable',
      jsonLd: [
        { '@type': 'WebPage', name: m.summary_title(), description: m.summary_meta_description(), url: localizedUrl('/rules/printable', getLocale()), inLanguage: getLocale() },
        breadcrumbs([[m.rules_title(), '/rules'], [m.summary_title(), '/rules/printable']]),
      ],
    }),
  component: () => <ClientPage page="rulesSummary" />,
})
