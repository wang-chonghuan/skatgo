import { createFileRoute, notFound, rootRouteId } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { EXERCISE_TEXT, exerciseById } from '~/lib/skat/tricks/exercises'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// One Skat-Tricks exercise (SKATGO-103). Not a search entry (lib/indexability.ts): the list of all of them is.
export const Route = createFileRoute('/skat-tricks_/$exercise')({
  beforeLoad: ({ params }) => {
    if (!exerciseById(params.exercise)) throw notFound({ routeId: rootRouteId })
  },
  head: ({ params }) => {
    const exercise = exerciseById(params.exercise)
    if (!exercise) return {}
    const words = EXERCISE_TEXT[getLocale()].exercises[exercise.id]
    const path = `/skat-tricks/${exercise.id}`
    return pageHead({
      title: m.tricks_ex_meta_title({ title: words.title }),
      description: words.prompt.replace(/\*\*/g, ''),
      paths: samePath(path),
      image: 'tricks-exercises',
      jsonLd: [breadcrumbs([[m.tricks_title(), '/skat-tricks'], [words.title, path]])],
    })
  },
  component: clientPage('tricksExercise'),
})
