import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// SkatGo as an alternative to Skat Palast (SKATGO-226): a search entry for people who look for that name. Every
// statement about Skat Palast is from its own website, checked on the date the page names.
export const Route = createFileRoute('/skat-palast-alternative')({
  head: () => pageHead({
    title: m.palast_meta_title(),
    description: m.palast_meta_description(),
    paths: samePath('/skat-palast-alternative'),
    image: 'home',
    jsonLd: [
      { '@type': 'WebPage', name: m.palast_title(), description: m.palast_meta_description(), url: localizedUrl('/skat-palast-alternative', getLocale()), inLanguage: getLocale() },
      breadcrumbs([[m.palast_title(), '/skat-palast-alternative']]),
    ],
  }),
  component: clientPage('palast'),
})
