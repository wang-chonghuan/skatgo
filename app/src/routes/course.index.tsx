import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, organization, pageHead, samePath } from '~/lib/head'
import { localizedUrl } from '~/lib/site'
import { lessons } from '~/lib/skat/lessons/content'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/course/')({
  head: () => {
    const course = lessons()
    const minutes = course.reduce((n, l) => n + l.minutes, 0)
    return pageHead({
      title: m.course_meta_title(),
      description: m.course_meta_description({ count: course.length }),
      paths: samePath('/course'),
      image: 'course',
      jsonLd: [
        {
          '@type': 'Course',
          name: m.course_title(),
          description: m.course_meta_description({ count: course.length }),
          url: localizedUrl('/course', getLocale()),
          inLanguage: getLocale(),
          isAccessibleForFree: true,
          provider: organization(),
          offers: { '@type': 'Offer', category: 'Free', price: 0, priceCurrency: 'EUR' },
          hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: `PT${minutes}M` },
        },
        breadcrumbs([[m.course_title(), '/course']]),
      ],
    })
  },
  component: () => <ClientPage page="course" />,
})
