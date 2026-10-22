import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'

import { DAILY_DEALS, DAILY_LENGTHS, DAILY_SIZES, type DailySize } from '~/lib/daily'
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
import { Toggle, linkLook } from './ui'
import { TableLoading } from './table-loading'

/** The search that names one of the day's tournaments; the six-deal one is the page without any. */
export const sizeSearch = (size: DailySize) => (size === DAILY_DEALS ? {} : { deals: size })

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title and lead, the choice of the day's two
 * tournaments (SKATGO-77: six deals, shown first, or twelve), and for the chosen one its deals and the way
 * to play — start, continue, or, once it is played, its result — and its board. Rendered on the server;
 * where the visitor stands today is the browser's to ask.
 */
export function DailyPage() {
  const size = useSearch({ from: '/daily' }).deals ?? DAILY_DEALS
  const navigate = useNavigate()
  const announcement = useLoaderData({ from: '/daily' })
  const choose = (n: DailySize) => void navigate({ to: '/daily', search: sizeSearch(n), replace: true, resetScroll: false })
  // What the server renders in place of the visitor's own day (SKATGO-63): the way in, its own width so it
  // reads as a button, over all of the tournament's deals, none played yet. The browser shows the same
  // until it knows where the visitor stands.
  const start = (
    <div {...stylex.props(styles.stack)}>
      <div {...stylex.props(styles.action)}>
        <Link to="/daily/play" search={sizeSearch(size)} {...linkLook('go', 'lg', 'landing')}>{m.daily_cta()}</Link>
      </div>
      <DayDeals of={size} />
    </div>
  )
  return (
    <div data-testid="daily" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.daily_title(DAILY_LENGTHS)}</h1>
        <p data-testid="daily-lead" {...stylex.props(typography.landingBody, styles.lead)}>{m.daily_static_lead()}</p>
        <AnnouncementLine announcement={announcement} />
        <div role="group" aria-label={m.daily_sizes()} data-testid="daily-sizes" data-size={size} {...stylex.props(styles.sizes)}>
          {DAILY_SIZES.map((n) => (
            <Toggle key={n} testId={`daily-size-${n}`} pressed={n === size} onClick={() => choose(n)}>{m.daily_size({ n })}</Toggle>
          ))}
        </div>
        <ClientPart fallback={start}>
          <DailyEntry key={size} size={size} waiting={start} />
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
  sizes: { display: 'flex', alignItems: 'center', gap: space.x8 },
  // A row of its own, so the button keeps its width instead of stretching across the column.
  action: { display: 'flex' },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
})
