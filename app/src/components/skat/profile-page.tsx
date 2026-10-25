import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Btn, Panel, linkLook } from './ui'
import { dailyProfile, isError } from '~/lib/daily-api'
import { type ProfileDay, type ProfileDeal, daysOf, trendOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { profileChart } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/**
 * A player's record of play (SKATGO-128, the human: 「每个用户的打牌档案页面，每天打了几副牌，就按deal算，而且每个deal都要算和ai的
 * 差值，做成一个曲线」): every deal they played against the AI on the same cards — the daily tournament's and free
 * play's — judged against the whole table and compared with the AI's game of the same cards (`lib/skat/profile.ts`):
 * a curve of the average per deal, day by day, whether the last day was better than before, and the days.
 * Personal, never indexed; its title and lead render on the server, the record in the browser for an account.
 */
export function ProfilePage() {
  const account = useAccount()
  const [deals, setDeals] = useState<ProfileDeal[] | 'error' | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void dailyProfile().then((r) => { if (live) setDeals(isError(r) ? 'error' : r.deals) })
    return () => { live = false }
  }, [account])

  return (
    <div data-testid="profile" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.profile_title()}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead)}>{m.profile_lead()}</p>
        {account === null ? (
          <div data-testid="profile-sign-in">
            <SignInButton mode="modal">
              <Btn testId="profile-sign-in-go" size="lg">{m.profile_sign_in()}</Btn>
            </SignInButton>
          </div>
        ) : account === undefined || deals === null ? (
          <p {...stylex.props(typography.appText, styles.quiet)}>{m.loading()}</p>
        ) : deals === 'error' ? (
          <Panel tone="bad"><p {...stylex.props(typography.appText, styles.text)}>{m.profile_unavailable()}</p></Panel>
        ) : deals.length === 0 ? (
          <Panel>
            <div {...stylex.props(styles.stack)}>
              <p {...stylex.props(typography.appText, styles.text)}>{m.profile_empty()}</p>
              <div {...stylex.props(styles.actions)}>
                <Link to="/daily" {...linkLook('go', 'md')}>{m.nav_daily()}</Link>
                <Link to="/play" {...linkLook('quiet', 'md')}>{m.nav_header_free()}</Link>
              </div>
            </div>
          </Panel>
        ) : (
          <Record deals={deals} />
        )}
      </section>
    </div>
  )
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Record({ deals }: { deals: ProfileDeal[] }) {
  const days = daysOf(deals)
  const trend = trendOf(deals)
  const date = new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  const dayName = (day: string) => date.format(new Date(`${day}T00:00:00Z`))
  return (
    <>
      <div {...stylex.props(styles.stackTight)}>
        <p data-testid="profile-summary" {...stylex.props(typography.appText, styles.text)}>
          {m.profile_summary({ deals: deals.length, days: days.length })}
        </p>
        {trend ? (
          <p data-testid="profile-trend" data-verdict={trend.verdict} {...stylex.props(typography.appText, styles.lead)}>
            {(trend.verdict === 'up' ? m.profile_trend_up : trend.verdict === 'down' ? m.profile_trend_down : m.profile_trend_same)({ last: signed(trend.last), before: signed(trend.before) })}
          </p>
        ) : null}
      </div>
      <Panel>
        <div {...stylex.props(styles.stack)}>
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_curve_title()}</h2>
          <Curve days={days} dayName={dayName} />
          <p {...stylex.props(typography.meta, styles.quiet)}>{m.profile_curve_note()}</p>
        </div>
      </Panel>
      <Panel>
        <div {...stylex.props(styles.stack)}>
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_days_title()}</h2>
          <ol data-testid="profile-days" {...stylex.props(styles.days)}>
            {[...days].reverse().map((d) => (
              <li key={d.day} data-testid="profile-day" data-day={d.day} data-deals={d.deals} {...stylex.props(styles.day)}>
                <span {...stylex.props(typography.appText, styles.date)}>{dayName(d.day)}</span>
                <span {...stylex.props(typography.appText, styles.quiet)}>{m.profile_day_deals({ count: d.deals })}</span>
                <span {...stylex.props(typography.appText, styles.figure)}>{d.perDeal === null ? '–' : m.profile_day_against({ diff: signed(d.perDeal) })}</span>
              </li>
            ))}
          </ol>
        </div>
      </Panel>
    </>
  )
}

/** One point per day, oldest on the left: the day's average per deal against the AI, on a line; a zero line, and
 *  the first and the last day's date under it. A day with no deal the AI played has no point. */
function Curve({ days, dayName }: { days: ProfileDay[]; dayName: (day: string) => string }) {
  const { width, height, pad, dot, line } = profileChart
  const known = days.flatMap((d) => (d.perDeal === null ? [] : [d.perDeal]))
  const top = Math.max(0, ...known)
  const bottom = Math.min(0, ...known)
  const span = top - bottom || 1
  const x = (i: number) => pad + (days.length > 1 ? (i * (width - 2 * pad)) / (days.length - 1) : (width - 2 * pad) / 2)
  const y = (v: number) => pad + ((top - v) * (height - 2 * pad)) / span
  const points = days.flatMap((d, i) => (d.perDeal === null ? [] : [{ i, d }]))
  return (
    <div {...stylex.props(styles.stackTight)}>
      <div {...stylex.props(styles.chart)}>
        <div aria-hidden {...stylex.props(typography.meta, styles.scale)}>
          <span>{signed(top)}</span>
          <span>{signed(bottom)}</span>
        </div>
        <svg data-testid="profile-curve" role="img" aria-label={m.profile_curve_title()} viewBox={`0 0 ${width} ${height}`} {...stylex.props(styles.svg)}>
          <line x1={pad} x2={width - pad} y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" {...stylex.props(styles.zero)} />
          <polyline points={points.map((p) => `${x(p.i)},${y(p.d.perDeal!)}`).join(' ')} strokeWidth={line} vectorEffect="non-scaling-stroke" {...stylex.props(styles.curve)} />
          {points.map((p) => (
            <circle key={p.d.day} data-testid="profile-point" data-day={p.d.day} data-per-deal={p.d.perDeal} cx={x(p.i)} cy={y(p.d.perDeal!)} r={dot} {...stylex.props(styles.point)}>
              <title>{m.profile_point({ date: dayName(p.d.day), diff: signed(p.d.perDeal!), count: p.d.deals })}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div aria-hidden {...stylex.props(typography.meta, styles.axis)}>
        <span>{dayName(days[0].day)}</span>
        {days.length > 1 ? <span>{dayName(days[days.length - 1].day)}</span> : null}
      </div>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  quiet: { margin: 0, color: color.slate },
  date: { margin: 0, color: color.text, flexGrow: 1 },
  figure: { margin: 0, color: color.navy, textAlign: 'end' },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  stackTight: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  axis: { display: 'flex', justifyContent: 'space-between', color: color.slate },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  chart: { display: 'flex', alignItems: 'stretch', gap: space.x8 },
  scale: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: color.slate, textAlign: 'end' },
  svg: { display: 'block', flexGrow: 1, minWidth: 0, width: '100%', height: 'auto', overflow: 'visible' },
  zero: { stroke: color.slate },
  curve: { fill: 'none', stroke: color.info, strokeLinejoin: 'round' },
  point: { fill: color.info },
  days: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  day: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: space.x12,
    alignItems: 'baseline',
    paddingBlock: space.x8,
    borderTopWidth: { default: 0, ':not(:first-child)': border.hair },
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
})
