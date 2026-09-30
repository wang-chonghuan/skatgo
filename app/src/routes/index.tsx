import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { faq } from '~/lib/faq'
import { organization, pageHead, samePath } from '~/lib/head'
import { SITE_URL, localizedUrl } from '~/lib/site'
import { lessons } from '~/lib/skat/lessons/content'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/')({
  head: () =>
    pageHead({
      title: m.home_meta_title(),
      description: m.home_meta_description({ count: lessons().length }),
      paths: samePath('/'),
      image: 'home',
      jsonLd: [
        { '@type': 'WebSite', name: m.site_name(), url: localizedUrl('/', getLocale()), inLanguage: getLocale(), publisher: { '@id': `${SITE_URL}/#organization` } },
        { ...organization(), '@id': `${SITE_URL}/#organization` },
        {
          '@type': 'FAQPage',
          mainEntity: faq().map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
      ],
    }),
  component: () => <ClientPage page="entry" />,
})
