import { createFileRoute, notFound, redirect, rootRouteId } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead } from '~/lib/head'
import { ADVANCED_GUIDES, advancedBySlug, advancedPath } from '~/lib/skat/lessons/advanced'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, locales } from '~/paraglide/runtime'

// An advanced lesson (SKATGO-234), its slug in its page's language as a course lesson's is: a slug from the other
// language goes to the same lesson's own; an unknown slug is a missing page.
export const Route = createFileRoute('/advanced-course/$slug')({
  beforeLoad: ({ params }) => {
    const found = advancedBySlug(params.slug)
    if (!found) throw notFound({ routeId: rootRouteId })
    const locale = getLocale()
    if (found.locale !== locale) throw redirect({ to: '/advanced-course/$slug', params: { slug: ADVANCED_GUIDES[locale][found.id].slug }, statusCode: 301 })
    return { lessonId: found.id }
  },
  head: ({ params }) => {
    const found = advancedBySlug(params.slug)
    if (!found) return {}
    const locale = getLocale()
    const guide = ADVANCED_GUIDES[locale][found.id]
    const paths = Object.fromEntries(locales.map((l) => [l, advancedPath(found.id, l)])) as Record<Locale, string>
    return pageHead({
      title: m.advanced_lesson_meta_title({ question: guide.question }),
      description: guide.description,
      paths,
      image: `advanced-${found.id}`,
      jsonLd: [breadcrumbs([[m.advanced_title(), '/advanced-course'], [guide.h1, paths[locale]]])],
    })
  },
  component: clientPage('advancedLesson'),
})
