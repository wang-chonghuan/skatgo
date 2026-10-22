import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData } from '@tanstack/react-router'

import { DAILY_DEALS } from '~/lib/daily'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, DailyEntry, DailyTable } from './client-part'
import { DayDeals } from './daily-comparison'
import { AnnouncementLine } from './forum-announcement'
import { GameReading } from './game-reading'
import { linkLook } from './ui'
import { TableLoading } from './table-loading'

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title and lead, the day's deals and the way to
 * play — start, continue, or, once it is played, its result — and its board. One tournament of six deals since
 * SKATGO-119 (the twelve-deal one of SKATGO-77 is gone). Rendered on the server; where the visitor stands today
 * is the browser's to ask.
 */
export function DailyPage() {
  const announcement = useLoaderData({ from: '/daily' })
  // What the server renders in place of the visitor's own day (SKATGO-63): the way in, its own width so it
  // reads as a button, over all of the tournament's deals, none played yet. The browser shows the same
  // until it knows where the visitor stands.
  const start = (
    <div {...stylex.props(styles.stack)}>
      <div {...stylex.props(styles.action)}>
        <Link to="/daily/play" {...linkLook('go', 'lg', 'landing')}>{m.daily_cta()}</Link>
      </div>
      <DayDeals of={DAILY_DEALS} />
    </div>
  )
  return (
    <div data-testid="daily" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.daily_title({ n: DAILY_DEALS })}</h1>
        <p data-testid="daily-lead" {...stylex.props(typography.landingBody, styles.lead)}>{m.daily_static_lead()}</p>
        <AnnouncementLine announcement={announcement} />
        <ClientPart fallback={start}>
          <DailyEntry waiting={start} />
        </ClientPart>
      </section>
      <GameReading />
    </div>
  )
}

/**
 * The tournament's table (SKATGO-35): the day's current deal, the whole screen, as free play's table is.
 * Its title is a heading for screen readers only. The table renders in the browser; until it arrives,
 * the logo turns on the felt (SKATGO-93).
 */
export function DailyPlay() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.daily_play_title()}</h1>
      <ClientPart fallback={<TableLoading />}>
        <DailyTable />
      </ClientPart>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  hidden: {
    position: 'absolute',
    width: dims.visuallyHidden,
    height: dims.visuallyHidden,
    margin: 0,
    overflow: 'hidden',
    clipPath: dims.visuallyHiddenClip,
    whiteSpace: 'nowrap',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  // A row of its own, so the button keeps its width instead of stretching across the column.
  action: { display: 'flex' },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
})
