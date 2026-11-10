import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { Who } from './daily-comparison'
import { DealRows } from './deal-history'
import { ForumBody } from './forum-body'
import { smoothPath } from './smooth-path'
import { Btn, Panel, linkLook } from './ui'
import { track } from '~/lib/analytics'
import { dailyProfile, isError } from '~/lib/daily-api'
import { type ProfileDeal, type ProfileNote, type ProfileWeek, RECENT_DEALS, daysOf, gapOf, rollingByDeal, trendOf, versusAi, weeksOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon, profileChart, progressCurve } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

/**
 * A player's record of play (SKATGO-128, the human: 「每个用户的打牌档案页面，每天打了几副牌，就按deal算，而且每个deal都要算和ai的
 * 差值，做成一个曲线」): every deal they played against the AI on the same cards — the daily tournament's and free
 * play's — judged against the whole table and compared with the AI's game of the same cards (`lib/skat/profile.ts`):
 * a curve of the average per deal, day by day, and whether the last day was better than before. Above it, every game,
 * newest first, each to be played again (SKATGO-182): folded for an account; a guest's games of this device open, the
 * only thing a guest has, with the sign-in that keeps them.
 * Personal, never indexed; its title and lead render on the server, the record in the browser.
 */
export function ProfilePage() {
  const account = useAccount()
  const navigate = useNavigate()
  const [record, setRecord] = useState<{ deals: ProfileDeal[]; notes: ProfileNote[] } | 'error' | null>(null)
  /** The game a guest asked to play again, waiting for their sign-in (the human: 「想点此处的复牌，必须登录」). */
  const [wanted, setWanted] = useState<string | null>(null)
  useEffect(() => {
    if (account === undefined) return
    let live = true
    setRecord(null)
    void dailyProfile().then((r) => { if (live) setRecord(isError(r) ? 'error' : r) })
    return () => { live = false }
  }, [account])
  // Once signed in and the account's record read — which takes this device's games into it — the asked game goes on.
  useEffect(() => {
    if (account && wanted && record && record !== 'error') void navigate({ to: '/replay', search: { deal: wanted } })
  }, [account, wanted, record])
  // Played again from its row: a link under its date (`info`), for a guest Clerk's window first.
  const replay = (d: ProfileDeal) =>
    account ? (
      <Link to="/replay" search={{ deal: d.key }} data-testid="history-replay" {...stylex.props(typography.link, styles.replay)}>{m.history_replay()}</Link>
    ) : (
      <SignInButton mode="modal">
        <button type="button" data-testid="history-replay" onClick={() => {
          setWanted(d.key)
          track('sign_in_clicked', { at: 'history_replay' })
        }} {...stylex.props(typography.link, typography.control, styles.replay, styles.replayButton)}>{m.history_replay()}</button>
      </SignInButton>
    )
  return (
    <div data-testid="profile" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.profile_title()}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead)}>{m.profile_lead()}</p>
        {account === null && record !== null && record !== 'error' && record.deals.length > 0 ? (
          <>
            <History deals={record.deals} guest action={replay} />
            <div data-testid="profile-sign-in" {...stylex.props(styles.stack)}>
              <p {...stylex.props(typography.appText, styles.text)}>{m.history_guest_keep()}</p>
              <div>
                <SignInButton mode="modal">
                  <Btn testId="profile-sign-in-go" size="lg" onClick={() => track('sign_in_clicked', { at: 'profile' })}>{m.auth_sign_in()}</Btn>
                </SignInButton>
              </div>
            </div>
          </>
        ) : account === null && record !== null ? (
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
          <>
            <History deals={record.deals} action={replay} />
            <Record deals={record.deals} notes={record.notes} />
          </>
        )}
      </section>
    </div>
  )
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Record({ deals, notes }: { deals: ProfileDeal[]; notes: ProfileNote[] }) {
  const days = daysOf(deals)
  const trend = trendOf(deals)
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
          <Curve deals={deals} />
          <p {...stylex.props(typography.meta, styles.quiet)}>{m.profile_curve_note({ count: RECENT_DEALS })}</p>
        </div>
      </Panel>
      <Weeks weeks={weeksOf(deals)} notes={notes} />
    </>
  )
}

/** How many games the history shows at first, and more at each ask: an account has hundreds. */
const HISTORY_PAGE = 20

/** Every game, newest first, each with its way to be played again (SKATGO-182, the human: 「历史可以放在打开的页面的顶部，默认
 *  折叠（不登录时，那就不折叠，因为就这一个）」): an account's folded behind one line, as the earlier weeks are; a guest's open. */
function History({ deals, guest = false, action }: { deals: ProfileDeal[]; guest?: boolean; action: (d: ProfileDeal) => ReactNode }) {
  const [open, setOpen] = useState(guest)
  const [shown, setShown] = useState(HISTORY_PAGE)
  const newest = [...deals].reverse()
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <Panel>
      <section data-testid="profile-history" data-open={open} {...stylex.props(styles.stack)}>
        {guest ? (
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.history_title({ count: deals.length })}</h2>
        ) : (
          <button type="button" data-testid="profile-history-toggle" aria-expanded={open} onClick={() => setOpen(!open)} {...stylex.props(typography.optionTitle, styles.more)}>
            <span>{m.history_title({ count: deals.length })}</span>
            <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
        )}
        {open ? <DealRows deals={newest.slice(0, shown)} action={action} /> : null}
        {open && newest.length > shown ? (
          <div>
            <Btn testId="profile-history-more" tone="quiet" onClick={() => setShown(shown + HISTORY_PAGE)}>{m.history_more()}</Btn>
          </div>
        ) : null}
      </section>
    </Panel>
  )
}

/** The player against the AI on the same cards (SKATGO-169, the human: 「profile里应该显示你这个表格，然后对手就是AI」): win rate, as
 *  declarer, how often declarer, as defender, each with what it counts under it, and the points per deal. */
function VersusAi({ deals }: { deals: ProfileDeal[] }) {
  const versus = versusAi(deals)
  if (!versus) return null
  const { you, ai } = versus
  // Where the difference comes from (SKATGO-169): what to practise, under what the table says.
  const { cardPoints, cardDeals, otherGame } = gapOf(deals)
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
        {cardPoints === null && otherGame === null ? null : (
          <div data-testid="profile-gap" {...stylex.props(styles.stackTight)}>
            <h3 {...stylex.props(typography.appBtnStrong, styles.title)}>{m.profile_gap_title()}</h3>
            <dl {...stylex.props(styles.gap)}>
              {cardPoints === null ? null : (
                <div data-row="play" data-value={signed(cardPoints)} data-deals={cardDeals} {...stylex.props(styles.gapRow)}>
                  <dt {...stylex.props(typography.appText, styles.text)}>{m.profile_gap_play()}</dt>
                  <dd {...stylex.props(styles.gapValue)}>
                    <span {...stylex.props(typography.appBtnStrong, styles.vsValue)}>{signed(cardPoints)}</span>
                    <span {...stylex.props(typography.meta, styles.vsCount)}>{m.profile_day_deals({ count: cardDeals })}</span>
                  </dd>
                </div>
              )}
              {otherGame === null ? null : (
                <div data-row="bid" data-value={`${otherGame}%`} {...stylex.props(styles.gapRow)}>
                  <dt {...stylex.props(typography.appText, styles.text)}>{m.profile_gap_bid()}</dt>
                  <dd {...stylex.props(styles.gapValue)}><span {...stylex.props(typography.appBtnStrong, styles.vsValue)}>{otherGame}%</span></dd>
                </div>
              )}
            </dl>
          </div>
        )}
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

/** The curve as the home card's was (SKATGO-182, the human: 「曲线还换成那个平滑曲线」, 「应该是每个deal是一个点，就像本来显示在首页卡片上
 *  的那个chart一样」): a point a deal, the average per deal against the AI over the latest deals up to it (`rollingByDeal`), as
 *  one smooth line without scale over a zero line — a single deal as its dot — the first and the last day under it and how
 *  many deals each point counts. */
function Curve({ deals }: { deals: ProfileDeal[] }) {
  const known = rollingByDeal(deals)
  if (!known.length) return null
  const { width, height, pad } = profileChart
  const top = Math.max(0, ...known.map((p) => p.perDeal))
  const bottom = Math.min(0, ...known.map((p) => p.perDeal))
  const span = top - bottom || 1
  const x = (i: number) => (known.length > 1 ? pad + (i * (width - 2 * pad)) / (known.length - 1) : width / 2)
  const y = (v: number) => pad + ((top - v) * (height - 2 * pad)) / span
  const points = known.map((p, i) => ({ x: x(i), y: y(p.perDeal) }))
  const short = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const day = (d: string) => short.format(new Date(`${d}T00:00:00Z`))
  const first = known[0].day
  const last = known[known.length - 1].day
  const window = Math.min(RECENT_DEALS, known.length)
  return (
    <div {...stylex.props(styles.stackTight)}>
      <svg data-testid="profile-curve" data-points={known.length} role="img" aria-label={m.profile_curve_title()} viewBox={`0 0 ${width} ${height}`} {...stylex.props(styles.svg)}>
        <line x1={0} x2={width} y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" {...stylex.props(styles.zero)} />
        {points.length > 1 ? (
          <path data-testid="profile-line" d={smoothPath(points)} strokeWidth={progressCurve.line} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.curve)} />
        ) : (
          // One deal: its point alone, a round end of a line of no length.
          <line data-testid="profile-point" x1={points[0].x} x2={points[0].x} y1={points[0].y} y2={points[0].y} strokeWidth={progressCurve.dot * 2} strokeLinecap="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.point)} />
        )}
      </svg>
      <div data-testid="profile-dates" {...stylex.props(typography.meta, styles.dates, known.length === 1 && styles.datesOne)}>
        <span>{day(first)}</span>
        {known.length > 1 ? <span>{m.home_progress_recent({ count: window })}</span> : null}
        {first === last ? null : <span>{day(last)}</span>}
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
  zero: { stroke: color.hairline },
  curve: { fill: 'none', stroke: color.info },
  point: { stroke: color.info },
  // A game's way to be played again (SKATGO-182): a link under its date.
  replay: {
    color: color.info,
    textDecoration: 'underline',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focusSm,
    outlineColor: color.info,
  },
  replayButton: { padding: 0, borderWidth: 0, backgroundColor: 'transparent', cursor: 'pointer' },
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
  // Where the difference comes from: the row's words, its figure at the end, a fine rule over each.
  gap: { display: 'flex', flexDirection: 'column', margin: 0 },
  gapRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.x12, paddingBlock: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  gapValue: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, margin: 0 },
})
