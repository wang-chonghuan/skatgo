import * as stylex from '@stylexjs/stylex'
import { ClientOnly } from '@tanstack/react-router'
import { type ReactNode, Suspense, lazy } from 'react'

import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

// The interactive parts of a page — a lesson's player, the free-play table, the daily tournament — render in the browser
// only, from one lazily loaded chunk (./pages.ts): they are all client state (progress in localStorage,
// random drills, a random deal), so there is nothing to render before the browser has it. The page
// around them is rendered on the server (SKATGO-29), so crawlers read its title and text.
const pages = () => import('./pages')
export const LessonPlayer = lazy(() => pages().then((mod) => ({ default: mod.LessonPlayer })))
export const FreeTable = lazy(() => pages().then((mod) => ({ default: mod.FreeTable })))
export const DailyTable = lazy(() => pages().then((mod) => ({ default: mod.DailyTable })))
export const DailyEntry = lazy(() => pages().then((mod) => ({ default: mod.DailyEntry })))

/** Renders `children` in the browser only; `fallback` (or "dealing the cards…") until then. */
export function ClientPart({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const loading = fallback ?? <p {...stylex.props(typography.loading, styles.loading)}>{m.loading()}</p>
  return (
    <ClientOnly fallback={loading}>
      <Suspense fallback={loading}>{children}</Suspense>
    </ClientOnly>
  )
}

const styles = stylex.create({
  loading: { margin: 0, paddingBlock: space.x80, textAlign: 'center', color: color.slate },
})
