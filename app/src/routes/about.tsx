import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { faq } from '~/lib/faq'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// About SkatGo (SKATGO-134): the questions and explanations the game pages no longer carry. The front page's
// FAQPage came with its questions.
export const Route = createFileRoute('/about')({
  head: () => pageHead({
    title: m.about_meta_title(),
    description: m.about_meta_description(),
    paths: samePath('/about'),
    image: 'home',
    jsonLd: [
      { '@type': 'AboutPage', name: m.about_title(), description: m.about_meta_description(), url: localizedUrl('/about', getLocale()), inLanguage: getLocale() },
      { '@type': 'FAQPage', mainEntity: faq().map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      breadcrumbs([[m.about_title(), '/about']]),
    ],
  }),
  component: clientPage('about'),
})
