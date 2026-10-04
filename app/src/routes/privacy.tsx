import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/privacy')({
  head: () => pageHead({
    title: m.privacy_meta_title(),
    description: m.privacy_meta_description(),
    paths: samePath('/privacy'),
    image: 'home',
    jsonLd: [
      { '@type': 'WebPage', name: m.privacy_title(), description: m.privacy_meta_description(), url: localizedUrl('/privacy', getLocale()), inLanguage: getLocale() },
      breadcrumbs([[m.privacy_title(), '/privacy']]),
    ],
  }),
  component: () => <ClientPage page="privacy" />,
})
