import { createFileRoute, redirect } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead } from '~/lib/head'
import { GUIDES, lessonBySlug, lessonPath } from '~/lib/skat/lessons/guide'
import { m } from '~/paraglide/messages'
import { type Locale, getLocale, locales } from '~/paraglide/runtime'

export const Route = createFileRoute('/course/$slug')({
  // A lesson's slug is in its page's language. A slug from the other language (after switching the
  // language menu on a lesson) goes to the same lesson's own slug; a slug no lesson has, to the course.
  beforeLoad: ({ params }) => {
    const found = lessonBySlug(params.slug)
    if (!found) throw redirect({ to: '/course', statusCode: 301 })
    const locale = getLocale()
    if (found.locale !== locale) throw redirect({ to: '/course/$slug', params: { slug: GUIDES[locale][found.id].slug }, statusCode: 301 })
    return { lessonId: found.id }
  },
  head: ({ params }) => {
    const found = lessonBySlug(params.slug)
    if (!found) return {}
    const locale = getLocale()
    const guide = GUIDES[locale][found.id]
    const paths = Object.fromEntries(locales.map((l) => [l, lessonPath(found.id, l)])) as Record<Locale, string>
    return pageHead({
      title: m.lesson_meta_title({ question: guide.question, n: found.id }),
      description: guide.description,
      paths,
      image: `lesson-${found.id}`,
      jsonLd: [breadcrumbs([[m.course_title(), '/course'], [guide.h1, paths[locale]]])],
    })
  },
  component: () => <ClientPage page="lesson" />,
})
