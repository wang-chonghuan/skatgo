import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { DAILY_DEALS } from '~/lib/daily'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, DailyEntry, DailyTable } from './client-part'
import { DayDeals } from './daily-comparison'
import { GameReading } from './game-reading'
import { linkLook } from './ui'

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title and lead, the day's deals, and the
 * way to play — start, continue, or, once the day is played, its result. Rendered on the server; where the
 * visitor stands today is the browser's to ask.
 */
export function DailyPage() {
  // What the server renders in place of the visitor's own day (SKATGO-63): all of the day's deals, none
  // played yet, and the way in. The browser shows the same until it knows where the visitor stands.
  const start = (
    <div {...stylex.props(styles.stack)}>
      <DayDeals of={DAILY_DEALS} />
      <Link to="/daily/play" {...linkLook('go', 'lg', 'landing')}>{m.daily_cta()}</Link>
    </div>
  )
  return (
    <div data-testid="daily" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.daily_title({ deals: DAILY_DEALS })}</h1>
        <p data-testid="daily-lead" {...stylex.props(typography.landingBody, styles.lead)}>{m.daily_static_lead()}</p>
        <ClientPart fallback={start}>
          <DailyEntry waiting={start} />
        </ClientPart>
      </section>
      <GameReading daily />
    </div>
  )
}

/**
 * The tournament's table (SKATGO-35): the day's current deal, the whole screen, as free play's table is.
 * Its title is a heading for screen readers only. The table renders in the browser; until it arrives,
 * bare felt holds its place.
 */
export function DailyPlay() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.daily_play_title()}</h1>
      <ClientPart fallback={<div aria-hidden="true" {...stylex.props(styles.feltHold)} />}>
        <DailyTable />
      </ClientPart>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  feltHold: { minHeight: dims.screenDynamic, backgroundImage: fill.felt },
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
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
})
