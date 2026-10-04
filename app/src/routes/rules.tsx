import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'
import { localizedUrl } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/rules')({
  head: () =>
    pageHead({
      title: m.rules_meta_title(),
      description: m.rules_meta_description(),
      paths: samePath('/rules'),
      image: 'rules',
      jsonLd: [
        { '@type': 'WebPage', name: m.rules_title(), description: m.rules_meta_description(), url: localizedUrl('/rules', getLocale()), inLanguage: getLocale() },
        breadcrumbs([[m.rules_title(), '/rules']]),
      ],
    }),
  component: () => <ClientPage page="rules" />,
})
