import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DAILY_DEALS, dailyDate, untilNextDeals } from '~/lib/daily'
import { LANG_TAG } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Band } from './frame'
import { linkLook } from './ui'

/**
 * The daily Skat tournament's page (SKATGO-29): its title, today's date and the time until the next
 * deals, and the way to play. The copy leads the tournament itself (the human, 2026-09-30: 「文案先行」):
 * until it exists, "play" opens a free game. Rendered on the server; the date and the countdown depend
 * on the moment, so they are filled in after mount rather than disagreeing with the server's.
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
      <Band title={m.daily_title({ deals: DAILY_DEALS })} Icon={CalendarDays} back="/" />
      <section {...stylex.props(styles.column)}>
        <p data-testid="daily-lead" {...stylex.props(typography.landingBody, styles.lead)}>
          {m.daily_lead({ date: now ? dailyDate(now, LANG_TAG[getLocale()]) : '…', countdown: left ? m.daily_countdown(left) : '…' })}
        </p>
        <div>
          <Link to="/play" data-testid="daily-cta" {...linkLook('go', 'lg', 'landing')}>
            {m.daily_cta()}
          </Link>
        </div>
      </section>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
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
