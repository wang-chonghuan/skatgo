import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, organization, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { advancedLessons } from '~/lib/skat/lessons/advanced'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// The advanced course (SKATGO-234): its lessons, one topic each, for players who know the rules.
export const Route = createFileRoute('/advanced-course/')({
  head: () => {
    const minutes = advancedLessons().reduce((n, l) => n + l.minutes, 0)
    return pageHead({
      title: m.advanced_meta_title(),
      description: m.advanced_meta_description(),
      paths: samePath('/advanced-course'),
      image: 'advanced-course',
      jsonLd: [
        {
          '@type': 'Course',
          name: m.advanced_title(),
          description: m.advanced_meta_description(),
          url: localizedUrl('/advanced-course', getLocale()),
          inLanguage: getLocale(),
          isAccessibleForFree: true,
          provider: organization(),
          offers: { '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'EUR' },
          hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${minutes}M` },
        },
        breadcrumbs([[m.advanced_title(), '/advanced-course']]),
      ],
    })
  },
  component: clientPage('advancedCourse'),
})
