import * as stylex from '@stylexjs/stylex'
import { ClientOnly } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { CourseHome } from './course-home'
import { EntryPage } from './entry-page'

// How the routes reach the course's pages — the only way they may (engineering.md, redline 4).
//
// Lessons and the table render in the browser only, from one lazily loaded chunk: they are all
// client state — progress in localStorage, random drills, a random deal — so there is nothing to
// render before the browser has it, and a brief "dealing the cards…" shows meanwhile.
//
// The front page and the course map are the exceptions (SKATGO-1, SKATGO-23): they are rendered on
// the server, so search engines read each language's sections, lessons, titles and promises. They
// apply the learner's progress themselves, after mount — see course-home.tsx and entry-page.tsx.
const pages = () => import('./pages')
const LessonPage = lazy(() => pages().then((mod) => ({ default: mod.LessonPage })))
const FreePlay = lazy(() => pages().then((mod) => ({ default: mod.FreePlay })))

const PAGES = { lesson: LessonPage, play: FreePlay }

export function ClientPage({ page }: { page: 'entry' | 'course' | keyof typeof PAGES }) {
  if (page === 'entry') return <EntryPage />
  if (page === 'course') return <CourseHome />
  const Page = PAGES[page]
  const loading = <p {...stylex.props(typography.loading, styles.loading)}>{m.loading()}</p>
  return (
    <ClientOnly fallback={loading}>
      <Suspense fallback={loading}>
        <Page />
      </Suspense>
    </ClientOnly>
  )
}

const styles = stylex.create({
  loading: { margin: 0, paddingBlock: space.x80, textAlign: 'center', color: color.slate },
})
