import * as stylex from '@stylexjs/stylex'
import { ClientOnly } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

import { skat } from '../../theme/skat.stylex'

// Every page of the course renders in the browser only, from one lazily loaded chunk.
//
// The course is all client state — progress in localStorage, random drills, a random deal — so
// there is nothing to render before the browser has it. The lazy chunk and the brief "正在发牌……"
// are kept as they are on parrottoon.com/skat, where this component came from: the two sites are
// meant to behave identically, down to what shows while the course loads.
const pages = () => import('./pages')
const CourseHome = lazy(() => pages().then((m) => ({ default: m.CourseHome })))
const LessonPage = lazy(() => pages().then((m) => ({ default: m.LessonPage })))
const FreePlay = lazy(() => pages().then((m) => ({ default: m.FreePlay })))

const PAGES = { home: CourseHome, lesson: LessonPage, play: FreePlay }

export function ClientPage({ page }: { page: keyof typeof PAGES }) {
  const Page = PAGES[page]
  const loading = <p {...stylex.props(styles.loading)}>正在发牌……</p>
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
