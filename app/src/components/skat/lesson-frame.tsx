import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ProgressBar } from './ui'

/**
 * A lesson's screen (SKATGO-26): the progress row, the step on a white card, and the sticky bar with the
 * table's block buttons. Shared by the player (lesson-player.tsx) and by the lesson page, which renders the
 * lesson's first teaching card in it on the server (SKATGO-161) — so a crawler reads the lesson itself, and
 * the page does not move when the player takes over in the browser.
 */
export function LessonFrame({ index, total, kind, testId, children, foot }: {
  index: number
  total: number
  kind: string
  testId: string
  children: ReactNode
  foot: ReactNode
}) {
  return (
    <div data-testid={testId} data-step={index} data-step-kind={kind} {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.bar)}>
          <ProgressBar value={index / total} label={m.lesson_progress()} />
        </div>
        <span data-testid="skat-step-count" {...stylex.props(typography.smallBold, styles.count)}>{index + 1} / {total}</span>
      </div>
      {children}
      <div {...stylex.props(styles.foot)}>{foot}</div>
    </div>
  )
}

/** The white card a step stands on; `kicker` names the lesson's final challenge over it. */
export function StepCard({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.card)}>
      {kicker ? <p data-testid="skat-challenge" {...stylex.props(typography.panelLabel, styles.kicker)}>{kicker}</p> : null}
      {children}
    </div>
  )
}

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x18,
    // A step slides in from the side (stepSlide); on a phone that slide must not widen the page.
    overflowX: 'clip',
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  head: { display: 'flex', alignItems: 'center', gap: space.x12 },
  bar: { flexGrow: 1 },
  count: { color: color.slate, whiteSpace: 'nowrap' },
  // The step on a white option card.
  card: {
    padding: { default: space.x24, [bp.phone]: space.x16 },
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.option,
  },
  kicker: { margin: 0, marginBottom: space.x12, color: color.slate },
  // The sticky bar: the table's full-width block buttons on the page's grey.
  foot: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x10,
    position: 'sticky',
    bottom: 0,
    paddingBlock: space.x12,
    backgroundColor: color.page,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
})
