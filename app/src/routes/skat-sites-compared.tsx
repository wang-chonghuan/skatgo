import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { compareFaq } from '~/lib/compare'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// The big online Skat sites side by side (SKATGO-228). Its questions are the page's FAQPage too.
export const Route = createFileRoute('/skat-sites-compared')({
  head: () => pageHead({
    title: m.compare_meta_title(),
    description: m.compare_meta_description(),
    paths: samePath('/skat-sites-compared'),
    image: 'home',
    jsonLd: [
      { '@type': 'WebPage', name: m.compare_title(), description: m.compare_meta_description(), url: localizedUrl('/skat-sites-compared', getLocale()), inLanguage: getLocale(), dateModified: '2026-11-22' },
      { '@type': 'FAQPage', mainEntity: compareFaq().map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      breadcrumbs([[m.compare_title(), '/skat-sites-compared']]),
    ],
  }),
  component: clientPage('compare'),
})
