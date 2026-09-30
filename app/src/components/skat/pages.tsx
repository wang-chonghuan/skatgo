import { MotionConfig } from 'motion/react'
import type { ComponentProps } from 'react'

import { FreeTable as Table } from './free-table'
import { LessonPlayer as Player } from './lesson-player'

// The browser-only parts of the course, behind one module so the pages load them as a single lazy chunk:
// the lesson player and the free-play table. Everything around them — titles, text, links — is rendered
// on the server by the pages themselves (see ./client-page.tsx).
//
// Everything that animates lives in here, so this is where it learns the visitor's motion setting: a
// visitor who asked for less motion gets no movement (SKATGO-29).
export const FreeTable = () => (
  <MotionConfig reducedMotion="user">
    <Table />
  </MotionConfig>
)

export const LessonPlayer = (props: ComponentProps<typeof Player>) => (
  <MotionConfig reducedMotion="user">
    <Player {...props} />
  </MotionConfig>
)
