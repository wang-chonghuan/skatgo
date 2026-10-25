import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useSearch } from '@tanstack/react-router'

import { DAILY_DEALS } from '~/lib/daily'
import { DEAL_OF_DAY } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, DailyEntry, DailyTable, DealOfDay } from './client-part'
import { DayDeals } from './daily-comparison'
import { AnnouncementLine } from './forum-announcement'
import { GameReading } from './game-reading'
import { linkLook, toggleLook } from './ui'
import { TableLoading } from './table-loading'

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title (no lead under it, SKATGO-132), the day's deals and the way to
 * play — start, continue, or, once it is played, its result — and its board. One tournament of six deals since
 * SKATGO-119 (the twelve-deal one of SKATGO-77 is gone). Since SKATGO-131 the page opens on the deal of the day, a
 * toggle at the top leading to the tournament (`?t=6`). Rendered on the server; where the visitor stands today
 * is the browser's to ask.
 */
export function DailyPage() {
  const announcement = useLoaderData({ from: '/daily' })
  const tournament = useSearch({ from: '/daily' }).t === DAILY_DEALS
  // The deal of the day's way in, as the server renders it and the browser shows until it knows the visitor's day.
  const dealStart = (
    <div {...stylex.props(styles.action)}>
      <Link to="/daily/play" search={{ size: DEAL_OF_DAY }} {...linkLook('go', 'lg', 'landing')}>{m.dod_cta()}</Link>
    </div>
  )
  // What the server renders in place of the visitor's own day (SKATGO-63): the way in, its own width so it
  // reads as a button, over all of the tournament's deals, none played yet. The browser shows the same
  // until it knows where the visitor stands.
  const start = (
    <div {...stylex.props(styles.stack)}>
      <div {...stylex.props(styles.action)}>
        <Link to="/daily/play" search={{}} {...linkLook('go', 'lg', 'landing')}>{m.daily_cta()}</Link>
      </div>
      <DayDeals of={DAILY_DEALS} />
    </div>
  )
  return (
    <div data-testid="daily" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.daily_title({ n: DAILY_DEALS })}</h1>
        <AnnouncementLine announcement={announcement} />
        {/* The day's two competitions, each its own (SKATGO-131, the human: 「每日一副就是一副，每日6副就是6副」), as the
            six and twelve deals once stood (SKATGO-77): the deal of the day first. */}
        <nav aria-label={m.dod_toggle_label()} data-testid="daily-toggle" {...stylex.props(styles.toggle)}>
          <Link to="/daily" search={{}} data-testid="daily-toggle-one" aria-current={tournament ? undefined : 'page'} {...toggleLook(!tournament)}>{m.dod_toggle_one()}</Link>
          <Link to="/daily" search={{ t: DAILY_DEALS }} data-testid="daily-toggle-six" aria-current={tournament ? 'page' : undefined} {...toggleLook(tournament)}>{m.dod_toggle_six()}</Link>
        </nav>
        {tournament ? (
          <ClientPart fallback={start}>
            <DailyEntry waiting={start} />
          </ClientPart>
        ) : (
          <ClientPart fallback={dealStart}>
            <DealOfDay waiting={dealStart} />
          </ClientPart>
        )}
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
  // The deal of the day's table with `size=1` (SKATGO-131), the tournament's without.
  const size = useSearch({ from: '/daily_/play' }).size === DEAL_OF_DAY ? DEAL_OF_DAY : DAILY_DEALS
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.daily_play_title()}</h1>
      <ClientPart fallback={<TableLoading />}>
        <DailyTable size={size} />
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
  toggle: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  title: { margin: 0, color: color.navy },
})
