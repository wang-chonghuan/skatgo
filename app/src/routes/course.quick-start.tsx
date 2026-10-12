import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { QUICK_START } from '~/lib/skat/quickstart'
import { localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// Skat in 5 Minuten (SKATGO-89): the quick start, under the course. A static segment, so it is never
// taken for a lesson's slug.
export const Route = createFileRoute('/course/quick-start')({
  head: () => {
    const locale = getLocale()
    const page = QUICK_START[locale]
    return pageHead({
      title: page.metaTitle,
      description: page.metaDescription,
      paths: samePath('/course/quick-start'),
      image: 'quick-start',
      jsonLd: [
        { '@type': 'WebPage', name: page.h1, description: page.metaDescription, url: localizedUrl('/course/quick-start', locale), inLanguage: locale },
        breadcrumbs([[m.course_title(), '/course'], [page.h1, '/course/quick-start']]),
      ],
    })
  },
  component: () => <ClientPage page="quickStart" />,
})
