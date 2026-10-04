import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/terms')({
  head: () => pageHead({
    title: m.terms_meta_title(),
    description: m.terms_meta_description(),
    paths: samePath('/terms'),
    image: 'home',
    jsonLd: [
      { '@type': 'WebPage', name: m.terms_title(), description: m.terms_meta_description(), url: localizedUrl('/terms', getLocale()), inLanguage: getLocale() },
      breadcrumbs([[m.terms_title(), '/terms']]),
    ],
  }),
  component: () => <ClientPage page="terms" />,
})
