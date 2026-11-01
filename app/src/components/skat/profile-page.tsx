import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Who } from './daily-comparison'
import { ForumBody } from './forum-body'
import { Btn, Panel, linkLook } from './ui'
import { track } from '~/lib/analytics'
import { dailyProfile, isError } from '~/lib/daily-api'
import { type ProfileDay, type ProfileDeal, type ProfileNote, type ProfileWeek, daysOf, trendOf, versusAi, weeksOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon, profileChart } from '../../theme/constants'
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
  const [record, setRecord] = useState<{ deals: ProfileDeal[]; notes: ProfileNote[] } | 'error' | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void dailyProfile().then((r) => { if (live) setRecord(isError(r) ? 'error' : r) })
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
              <Btn testId="profile-sign-in-go" size="lg" onClick={() => track('sign_in_clicked', { at: 'profile' })}>{m.profile_sign_in()}</Btn>
            </SignInButton>
          </div>
        ) : account === undefined || record === null ? (
          <p {...stylex.props(typography.appText, styles.quiet)}>{m.loading()}</p>
        ) : record === 'error' ? (
          <Panel tone="bad"><p {...stylex.props(typography.appText, styles.text)}>{m.profile_unavailable()}</p></Panel>
        ) : record.deals.length === 0 ? (
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
          <Record deals={record.deals} notes={record.notes} />
        )}
      </section>
    </div>
  )
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Record({ deals, notes }: { deals: ProfileDeal[]; notes: ProfileNote[] }) {
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
      <VersusAi deals={deals} />
      <Panel>
        <div {...stylex.props(styles.stack)}>
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_curve_title()}</h2>
          <Curve days={days} dayName={dayName} />
          <p {...stylex.props(typography.meta, styles.quiet)}>{m.profile_curve_note()}</p>
        </div>
      </Panel>
      <Weeks weeks={weeksOf(deals)} notes={notes} />
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

/** The player against the AI on the same cards (SKATGO-169, the human: 「profile里应该显示你这个表格，然后对手就是AI」): win rate, as
 *  declarer, how often declarer, as defender, each with what it counts under it, and the points per deal. */
function VersusAi({ deals }: { deals: ProfileDeal[] }) {
  const versus = versusAi(deals)
  if (!versus) return null
  const { you, ai } = versus
  const share = (k: number, n: number) => ({ value: n ? `${Math.round((100 * k) / n)}%` : '–', count: `${k}/${n}` })
  const rows = [
    { key: 'win', label: m.profile_vs_win(), you: share(you.won, you.played), ai: share(ai.won, ai.played) },
    { key: 'declarer', label: m.profile_vs_declarer(), you: share(you.declaredWon, you.declared), ai: share(ai.declaredWon, ai.declared) },
    { key: 'declares', label: m.profile_vs_declares(), you: share(you.declared, you.played), ai: share(ai.declared, ai.played) },
    { key: 'defender', label: m.profile_vs_defender(), you: share(you.defendedWon, you.defended), ai: share(ai.defendedWon, ai.defended) },
    { key: 'points', label: m.profile_vs_points(), you: { value: signed(Math.round(you.perDeal)), count: null }, ai: { value: signed(Math.round(ai.perDeal)), count: null } },
  ]
  const cell = (c: { value: string; count: string | null }, side: string) => (
    <td data-side={side} data-value={c.value} {...stylex.props(styles.vsCell, styles.vsRule)}>
      <span {...stylex.props(typography.appBtnStrong, styles.vsValue)}>{c.value}</span>
      {c.count ? <span {...stylex.props(typography.meta, styles.vsCount)}>{c.count}</span> : null}
    </td>
  )
  return (
    <Panel>
      <div {...stylex.props(styles.stack)}>
        <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_vs_title()}</h2>
        <table data-testid="profile-vs" {...stylex.props(styles.vsTable)}>
          <thead {...stylex.props(styles.vsRows)}>
            <tr {...stylex.props(styles.vsRows)}>
              <td />
              <th scope="col" {...stylex.props(styles.vsHead)}><Who side="you" /></th>
              <th scope="col" {...stylex.props(styles.vsHead)}><Who side="ai" /></th>
            </tr>
          </thead>
          <tbody {...stylex.props(styles.vsRows)}>
            {rows.map((r) => (
              <tr key={r.key} data-row={r.key} {...stylex.props(styles.vsRows)}>
                <th scope="row" {...stylex.props(typography.appText, styles.vsLabel, styles.vsRule)}>{r.label}</th>
                {cell(r.you, 'you')}
                {cell(r.ai, 'ai')}
              </tr>
            ))}
          </tbody>
        </table>
        <p {...stylex.props(typography.meta, styles.quiet)}>{m.profile_vs_note()}</p>
      </div>
    </Panel>
  )
}

/** The weeks' analyses, one card a week, newest first (the human: 「本周ai分析加上到档案页，每周一个」, then 「不一定是四条吧，为啥
 *  这么死板」 and 「挑重点……可以手动做」): what mattered that week, written by hand for the player, in the page's language
 *  (English where there is none in it). A week without one has no card; with none at all, the section is left out. */
function Weeks({ weeks, notes }: { weeks: ProfileWeek[]; notes: ProfileNote[] }) {
  const [more, setMore] = useState(false)
  const lang = getLocale()
  const date = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const noted = weeks.flatMap((w) => {
    const note = notes.find((n) => n.week === w.week && n.lang === lang) ?? notes.find((n) => n.week === w.week && n.lang === 'en')
    return note ? [{ w, body: note.body }] : []
  })
  if (!noted.length) return null
  const card = ({ w, body }: (typeof noted)[number]) => (
    <Panel key={w.week}>
      <div data-testid="profile-week" data-week={w.week} {...stylex.props(styles.stack)}>
        <div {...stylex.props(styles.stackTight)}>
          <h3 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_week_title({ date: date.format(new Date(`${w.week}T00:00:00Z`)) })}</h3>
          <p {...stylex.props(typography.appText, styles.quiet)}>
            {w.perDeal === null ? m.profile_day_deals({ count: w.deals }) : m.profile_week_meta({ deals: w.deals, diff: signed(w.perDeal) })}
          </p>
        </div>
        <ForumBody text={body} official />
      </div>
    </Panel>
  )
  const [newest, ...earlier] = noted
  const Chevron = more ? ChevronUp : ChevronDown
  return (
    <section data-testid="profile-weeks" {...stylex.props(styles.stack)}>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.profile_weeks_title()}</h2>
      {card(newest)}
      {/* The newest open, the rest folded (SKATGO-169, the human: 「每周简评，只显示第一个，剩下的折叠」). */}
      {earlier.length ? (
        <Panel>
          <button type="button" data-testid="profile-weeks-more" aria-expanded={more} onClick={() => setMore(!more)} {...stylex.props(typography.appBtnStrong, styles.more)}>
            <span>{m.profile_weeks_more({ count: earlier.length })}</span>
            <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
        </Panel>
      ) : null}
      {more ? earlier.map(card) : null}
    </section>
  )
}

/** Which of a date's two screens it shows on: a computer's, a phone's, both or neither. */
const shownOn = (pc: boolean, phone: boolean) =>
  pc && phone ? null : pc ? styles.hiddenPhone : phone ? styles.hiddenPc : styles.hidden

/** One point per day, oldest on the left: the day's average per deal against the AI, on a line; a zero line, and
 *  each day's date under its point — every second, third … when there are more days than fit, fewer on a phone. A
 *  day with no deal the AI played has no point. */
function Curve({ days, dayName }: { days: ProfileDay[]; dayName: (day: string) => string }) {
  const { width, height, pad, dot, line, dates, datesPhone } = profileChart
  const short = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'numeric', timeZone: 'UTC' })
  const every = Math.ceil(days.length / dates)
  const everyPhone = Math.ceil(days.length / datesPhone)
  const known = days.flatMap((d) => (d.perDeal === null ? [] : [d.perDeal]))
  const top = Math.max(0, ...known)
  const bottom = Math.min(0, ...known)
  const span = top - bottom || 1
  // The first and the last day at the curve's edges, so the dates under it stand under their points.
  const x = (i: number) => (days.length > 1 ? (i * width) / (days.length - 1) : width / 2)
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
            // A dot of the same size on every screen, however far the curve is scaled: a round end of a line of no
            // length, whose stroke does not scale.
            <line key={p.d.day} data-testid="profile-point" data-day={p.d.day} data-per-deal={p.d.perDeal} x1={x(p.i)} x2={x(p.i)} y1={y(p.d.perDeal!)} y2={y(p.d.perDeal!)} strokeWidth={dot * 2} strokeLinecap="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.point)}>
              <title>{m.profile_point({ date: dayName(p.d.day), diff: signed(p.d.perDeal!), count: p.d.deals })}</title>
            </line>
          ))}
        </svg>
      </div>
      <div {...stylex.props(styles.chart)}>
        {/* As wide as the scale beside the curve, so the dates start where the curve does. */}
        <div aria-hidden {...stylex.props(typography.meta, styles.scale, styles.scaleGhost)}>
          <span>{signed(top)}</span>
          <span>{signed(bottom)}</span>
        </div>
        <div aria-hidden data-testid="profile-dates" {...stylex.props(typography.meta, styles.dates, days.length === 1 && styles.datesOne)}>
          {days.map((d, i) => (
            <span key={d.day} {...stylex.props(styles.date0)}>
              <span data-testid="profile-date" {...stylex.props(styles.dateText, shownOn(i % every === 0, i % everyPhone === 0))}>
                {short.format(new Date(`${d.day}T00:00:00Z`))}
              </span>
            </span>
          ))}
        </div>
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
  // The scale's twin under the curve: its width, nothing to see.
  scaleGhost: { height: 0, overflow: 'hidden', visibility: 'hidden' },
  dates: { display: 'flex', flexGrow: 1, minWidth: 0, justifyContent: 'space-between', color: color.slate },
  datesOne: { justifyContent: 'center' },
  // Each date in a slot of no width at its point, the text centred on it.
  date0: { display: 'flex', justifyContent: 'center', width: 0 },
  dateText: { whiteSpace: 'nowrap' },
  hidden: { visibility: 'hidden' },
  hiddenPc: { visibility: { default: 'hidden', [bp.phone]: 'visible' } },
  hiddenPhone: { visibility: { default: 'visible', [bp.phone]: 'hidden' } },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  chart: { display: 'flex', alignItems: 'stretch', gap: space.x8 },
  scale: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: color.slate, textAlign: 'end' },
  svg: { display: 'block', flexGrow: 1, minWidth: 0, width: '100%', height: 'auto', overflow: 'visible' },
  zero: { stroke: color.slate },
  curve: { fill: 'none', stroke: color.info, strokeLinejoin: 'round' },
  point: { stroke: color.info },
  // The line that opens the earlier weeks (SKATGO-169): the white card's whole width, nothing of a button's look.
  more: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x12,
    width: '100%',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.navy,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
  },
  // The player against the AI (SKATGO-169): a grid, the row's name taking what the two figures leave; its rows only its cells.
  vsTable: { display: 'grid', gridTemplateColumns: dims.versusColumns, width: '100%' },
  vsRows: { display: 'contents' },
  vsHead: { paddingBottom: space.x6, textAlign: 'end' },
  vsLabel: { alignSelf: 'stretch', paddingBlock: space.x8, paddingInlineEnd: space.x8, textAlign: 'start', color: color.text },
  vsCell: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingBlock: space.x8 },
  vsRule: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  vsValue: { color: color.navy, fontVariantNumeric: 'tabular-nums' },
  vsCount: { color: color.slate, fontVariantNumeric: 'tabular-nums' },
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
