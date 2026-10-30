import { MotionConfig } from 'motion/react'
import type { ComponentProps } from 'react'

import { DailyEntry as Entry, DailyTable as Daily } from './daily-table'
import { DealOfDay as OfDay } from './deal-of-day'
import { FreeTable as Table } from './free-table'
import { LessonPlayer as Player } from './lesson-player'
import { PrivateTable as Private, RoomCards as Cards } from './table-room'

// The browser-only parts of the course, behind one module so the pages load them as a single lazy chunk:
// the lesson player, the free-play table, the daily tournament's table and button (SKATGO-35), and a
// private table with the form that opens one (SKATGO-61). Everything around them — titles, text, links — is rendered
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

export const DailyTable = ({ size }: ComponentProps<typeof Daily>) => (
  <MotionConfig reducedMotion="user">
    <Daily size={size} />
  </MotionConfig>
)

export const DailyEntry = Entry

// The deal of the day's side of /daily (SKATGO-131).
export const DealOfDay = OfDay

export const RoomCards = Cards

export const PrivateTable = () => (
  <MotionConfig reducedMotion="user">
    <Private />
  </MotionConfig>
)
