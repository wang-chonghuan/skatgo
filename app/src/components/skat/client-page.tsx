import * as stylex from '@stylexjs/stylex'
import { ClientOnly } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'
import { CourseHome } from './course-home'

// How the routes reach the course's pages — the only way they may (engineering.md, redline 4).
//
// Lessons and the table render in the browser only, from one lazily loaded chunk: they are all
// client state — progress in localStorage, random drills, a random deal — so there is nothing to
// render before the browser has it, and a brief "dealing the cards…" shows meanwhile.
//
// The course map is the exception (SKATGO-1): it is rendered on the server, so search engines read
// each language's lessons, titles and promises. It applies the learner's progress itself, after
// mount — see course-home.tsx.
const pages = () => import('./pages')
const LessonPage = lazy(() => pages().then((mod) => ({ default: mod.LessonPage })))
const FreePlay = lazy(() => pages().then((mod) => ({ default: mod.FreePlay })))

const PAGES = { lesson: LessonPage, play: FreePlay }

export function ClientPage({ page }: { page: 'home' | keyof typeof PAGES }) {
  if (page === 'home') return <CourseHome />
  const Page = PAGES[page]
  const loading = <p {...stylex.props(styles.loading)}>{m.loading()}</p>
  return (
    <ClientOnly fallback={loading}>
      <Suspense fallback={loading}>
        <Page />
      </Suspense>
    </ClientOnly>
  )
}

const styles = stylex.create({
  loading: { margin: 0, paddingBlock: 80, textAlign: 'center', fontSize: 16, color: skat.inkSoft },
})
