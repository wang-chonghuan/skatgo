import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { DAILY_DEALS, DAILY_LENGTHS, DAILY_SIZES, type DailySize } from '~/lib/daily'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, DailyEntry, DailyTable } from './client-part'
import { DayDeals } from './daily-comparison'
import { GameReading } from './game-reading'
import { linkLook } from './ui'

/** The search that names one of the day's tournaments; the six-deal one is the page without any. */
export const sizeSearch = (size: DailySize) => (size === DAILY_DEALS ? {} : { deals: size })

/** A choice that is on or off, as a pill: the day's tournaments, and the board's today or yesterday. */
export function Toggle({ pressed, onClick, testId, children }: { pressed: boolean; onClick: () => void; testId: string; children: ReactNode }) {
  return (
    <button type="button" data-testid={testId} aria-pressed={pressed} onClick={onClick} {...stylex.props(typography.toggle, styles.switch, pressed && styles.switchOn)}>
      {children}
    </button>
  )
}

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title and lead, the choice of the day's two
 * tournaments (SKATGO-77: six deals, shown first, or twelve), and for the chosen one its deals and the way
 * to play — start, continue, or, once it is played, its result — and its board. Rendered on the server;
 * where the visitor stands today is the browser's to ask.
 */
export function DailyPage() {
  const size = useSearch({ from: '/daily' }).deals ?? DAILY_DEALS
  const navigate = useNavigate()
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
  sizes: { display: 'flex', alignItems: 'center', gap: space.x8 },
  switch: {
    minHeight: dims.control,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
    color: color.navy,
    borderRadius: radii.pill,
    paddingInline: space.x16,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  switchOn: { backgroundColor: color.goodSoft, borderColor: color.go },
  // A row of its own, so the button keeps its width instead of stretching across the column.
  action: { display: 'flex' },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
})
