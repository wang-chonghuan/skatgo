import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { DAILY_DEALS, dailyDate, untilNextDeals } from '~/lib/daily'
import { LANG_TAG } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, DailyEntry, DailyTable } from './client-part'
import { Band } from './frame'

/**
 * The daily Skat tournament's page (SKATGO-29, SKATGO-35): its title, today's date and the time until
 * the next deals, and the way to play — start, continue, or, once the day is played, its result. Rendered
 * on the server; the date and the countdown depend on the moment, so they are filled in after mount
 * rather than disagreeing with the server's, and where the visitor stands today is the browser's to ask.
 */
export function DailyPage() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])
  const left = now ? untilNextDeals(now) : null
  return (
    <div data-testid="daily" {...stylex.props(styles.root)}>
      <Band title={m.daily_title({ deals: DAILY_DEALS })} back="/" />
      <section {...stylex.props(styles.column)}>
        <p data-testid="daily-lead" {...stylex.props(typography.landingBody, styles.lead)}>
          {m.daily_lead({ date: now ? dailyDate(now, LANG_TAG[getLocale()]) : '…', countdown: left ? m.daily_countdown(left) : '…' })}
        </p>
        <ClientPart fallback={null}>
          <DailyEntry />
        </ClientPart>
      </section>
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
  lead: { margin: 0, color: color.navy },
})
