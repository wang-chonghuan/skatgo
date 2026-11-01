import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useLoaderData } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { CalendarDays, ChartLine, Gavel, GraduationCap, Swords, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { dailyProfile, isError } from '~/lib/daily-api'
import type { Card } from '~/lib/skat/cards'
import { type ProfileDeal, rollingOf, standingOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon, profileChart, progressCurve } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { EloBoard } from './elo-board'
import { PlayingCard } from './playing-card'
import { Btn } from './ui'

// The front page (SKATGO-135, after the human's two pictures: 「topbar下，先显示slogan，然后显示下面的四个卡片……长卡片做两个，
// 一个是my progress……一个是 elo ranking」): the slogan, then the ways in — four colour cards two by two, each a link
// with its icon over its title (the deal of the day, free play, the course, the bidding practice since SKATGO-149), and beside them two long
// white cards: the player's progress, its curve when there is one, leading to the record of play, and the tournament's
// Elo board (SKATGO-123). Under `bp.cards` the four stay two by two and the long cards follow, the whole width. No
// hero buttons, no lead, no link row: the cards are the page. Rendered on the server; the curve in the browser.
export function EntryPage() {
  const { elo } = useLoaderData({ from: '/' })
  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      <h1 {...stylex.props(typography.landingHero, styles.title)}>{m.entry_title()}</h1>
      <div data-testid="entry-sections" {...stylex.props(styles.ways)}>
        {/* The deal of the day stays "1 deal today" once played (SKATGO-135, the human: 「这个按钮文字不变」). */}
        <Way to="/daily" section="daily" tone="daily" Icon={CalendarDays} art={DAILY_ART} title={m.home_daily()} onClick={() => heroClick('primary')} />
        <Way to="/play" section="play" tone="play" Icon={Swords} art={PLAY_ART} title={m.home_free()} onClick={() => heroClick('free')} />
        <Way to="/course" section="course" tone="course" Icon={GraduationCap} art={COURSE_ART} title={m.home_learn()} />
        {/* The bidding practice (SKATGO-149, the human: 「practice卡片的位置，做成一个叫牌练习的东西」): an auction's hammer; its
            title one line, "Bidding" (SKATGO-151). */}
        <Way to="/bidding-practice" section="bidding" tone="practice" Icon={Gavel} art={PRACTICE_ART} title={m.home_bidding()} />
        <ProgressCard />
        <div data-testid="entry-card" data-section="elo" {...stylex.props(styles.long, styles.elo)}>
          {elo ? (
            <EloBoard board={elo} fill />
          ) : (
            <div {...stylex.props(styles.white, styles.eloEmpty)}>
              <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.elo_title()}</h2>
            </div>
          )}
        </div>
      </div>
      {/* Under them the rest, as picture cards (SKATGO-135, the human: 「私人牌桌和论坛，用卡片的形式，继续放到下面」): a private
          table with the illustration the hero once had (SKATGO-33), and the forum with the human's picture of people at a
          card table (`forum-card.webp`, cropped to the card), then the exercises (SKATGO-149). */}
      <div data-testid="entry-more" {...stylex.props(styles.more)}>
        <Link to="/with-friends" data-testid="entry-card" data-section="friends" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <img src="/hero-table.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage)} />
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_friends_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_friends_text()}</span>
          </span>
        </Link>
        <Link to="/forum" data-testid="entry-card" data-section="forum" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <img src="/forum-card.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage)} />
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_forum_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_forum_text()}</span>
          </span>
        </Link>
        {/* The exercises after the forum (SKATGO-149, the human: 「把practice放到forum下面」, cover B of three drawn for it):
            straight to them (SKATGO-105); the article is only for search engines. */}
        <Link to="/skat-tricks" data-testid="entry-card" data-section="tricks" {...stylex.props(styles.white, styles.picture, styles.lift, styles.third)}>
          <img src="/practice-card.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage)} />
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_practice()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_practice_text()}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}

/** The hero's ways in as they are counted (SKATGO-29; renamed by SKATGO-74's tracking plan): the deal of the day, free play. */
const heroClick = (button: 'primary' | 'free') => track('home_cta_clicked', { button })

/** A colour card: its icon at the top, its title at the bottom, three of skatgo's cards in the corner under its colour. */
function Way({ to, section, tone, Icon, art, title, onClick }: { to: '/daily' | '/play' | '/course' | '/bidding-practice'; section: string; tone: keyof typeof tileTones; Icon: LucideIcon; art: Card[]; title: string; onClick?: () => void }) {
  return (
    <Link to={to} data-testid="entry-card" data-section={section} onClick={onClick} {...stylex.props(styles.tile, styles.lift, tileTones[tone])}>
      <span aria-hidden="true" {...stylex.props(styles.art)}>
        {art.map((c, i) => (
          <span key={i} {...stylex.props(styles.artCard, fanPose[FAN[i + 1]])}>
            <PlayingCard card={c} size="lg" />
          </span>
        ))}
      </span>
      <span aria-hidden="true" {...stylex.props(styles.veil)} />
      <span {...stylex.props(styles.body)}>
        <Icon aria-hidden="true" size={icon.tile} strokeWidth={icon.outline} />
        <h2 {...stylex.props(typography.homeTileTitle, styles.tileTitle)}>{title}</h2>
      </span>
    </Link>
  )
}

/** The progress card: for an account a link to the record of play with its curve; for a guest what signing in
 *  keeps, and the sign-in in the middle (the human: 「progress如果用户没登录，就要显示登录后保存你的表现记录以及ai分析，中间放个
 *  登录按钮」). */
function ProgressCard() {
  const account = useAccount()
  // As the Elo board's title beside it, with the record of play's icon from the account menu (SKATGO-128).
  const head = (
    <span {...stylex.props(styles.whiteHead)}>
      <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_progress()}</h2>
      <ChartLine aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.whiteIcon)} />
    </span>
  )
  if (account === null) {
    return (
      <div data-testid="entry-card" data-section="progress" data-guest="true" {...stylex.props(styles.long, styles.white, styles.progress)}>
        {head}
        <div {...stylex.props(styles.guest)}>
          <p {...stylex.props(typography.appText, styles.guestText)}>{m.home_progress_guest()}</p>
          <SignInButton mode="modal">
            <Btn testId="entry-progress-sign-in" size="lg" onClick={() => track('sign_in_clicked', { at: 'home' })}>{m.auth_sign_in()}</Btn>
          </SignInButton>
        </div>
      </div>
    )
  }
  return (
    <Link to="/profile" data-testid="entry-card" data-section="progress" {...stylex.props(styles.long, styles.white, styles.lift, styles.progress)}>
      {head}
      <Progress account={account} />
    </Link>
  )
}

/** A number with its sign, a true minus. */
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** The player's standing on the progress card (SKATGO-169, the human: 「home页面上，显示胜率的曲线？或者更好的数值？」): over the latest
 *  deals, the win rate — plain to read, but on real records no measure of a player: it swings, and players of quite different
 *  results stand alike — and the average per deal against the AI, which tells them apart, as the curve under them, without
 *  scale. An account's only, read in the browser; nothing for a guest or before the first deal. */
function Progress({ account }: { account: string | undefined }) {
  const [deals, setDeals] = useState<ProfileDeal[] | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void dailyProfile().then((r) => { if (live && !isError(r)) setDeals(r.deals) })
    return () => { live = false }
  }, [account])
  const standing = deals && standingOf(deals)
  if (!deals || !standing) return null
  const known = rollingOf(deals)
  const { width, height, pad } = profileChart
  const top = Math.max(0, ...known.map((p) => p.perDeal))
  const bottom = Math.min(0, ...known.map((p) => p.perDeal))
  const span = top - bottom || 1
  const x = (i: number) => (known.length > 1 ? pad + (i * (width - 2 * pad)) / (known.length - 1) : width / 2)
  const y = (v: number) => pad + ((top - v) * (height - 2 * pad)) / span
  const points = known.map((p, i) => ({ x: x(i), y: y(p.perDeal) }))
  const first = known[0].day
  const last = known[known.length - 1].day
  return (
    <div {...stylex.props(styles.chart)}>
      <div data-testid="entry-progress-figures" data-deals={standing.deals} {...stylex.props(styles.figures)}>
        <span {...stylex.props(styles.figure)}>
          <span data-testid="entry-progress-win" {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{standing.winRate === null ? '–' : `${standing.winRate}%`}</span>
          <span {...stylex.props(typography.meta, styles.figureLabel)}>{m.home_progress_win()}</span>
        </span>
        <span {...stylex.props(styles.figure)}>
          <span data-testid="entry-progress-ai" {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{signed(standing.perDeal)}</span>
          <span {...stylex.props(typography.meta, styles.figureLabel)}>{m.home_progress_ai()}</span>
        </span>
      </div>
      <div {...stylex.props(styles.drawing)}>
      <div {...stylex.props(styles.plotRow)}>
        <span {...stylex.props(styles.plot)}>
        <svg data-testid="entry-progress-curve" aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...stylex.props(styles.curve)}>
      <line x1={0} x2={width} y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" {...stylex.props(styles.zero)} />
      {points.length > 1 ? (
        <path data-testid="entry-progress-line" d={smoothPath(points)} strokeWidth={progressCurve.line} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.line)} />
      ) : (
        // One day: its point alone, a round end of a line of no length.
        <line data-testid="entry-progress-dot" x1={points[0].x} x2={points[0].x} y1={points[0].y} y2={points[0].y} strokeWidth={progressCurve.dot * 2} strokeLinecap="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.point)} />
      )}
        </svg>
        </span>
      </div>
      <div data-testid="entry-progress-dates" {...stylex.props(typography.meta, styles.dates, first === last && standing.deals === 1 && styles.datesOne)}>
        <span>{shortDay(first)}</span>
        {/* How many deals the figures and each point count; nothing to say of one. */}
        {standing.deals > 1 ? <span data-testid="entry-progress-window">{m.home_progress_recent({ count: standing.deals })}</span> : null}
        {first === last ? null : <span>{shortDay(last)}</span>}
      </div>
      </div>
    </div>
  )
}

/** A day as the curve's dates show it: "12 Oct" / "12. Okt.". */
const shortDay = (day: string) => new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

/** A smooth line through the days' points (SKATGO-136, the human: 「我希望平缓的」): a monotone cubic (Fritsch–Carlson), so
 *  between two days it never rises above or falls below them, and every day's point is on it. */
function smoothPath(points: { x: number; y: number }[]): string {
  const n = points.length
  const d = points.slice(1).map((p, i) => (p.y - points[i].y) / (p.x - points[i].x))
  const m = points.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / d[i]
    const b = m[i + 1] / d[i]
    const r = a * a + b * b
    if (r > 9) {
      m[i] = (3 / Math.sqrt(r)) * a * d[i]
      m[i + 1] = (3 / Math.sqrt(r)) * b * d[i]
    }
  }
  return points.reduce((path, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const q = points[i - 1]
    const h = (p.x - q.x) / 3
    return `${path} C${q.x + h},${q.y + m[i - 1] * h} ${p.x - h},${p.y - m[i] * h} ${p.x},${p.y}`
  }, '')
}

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const DAILY_ART = [card('H', 'A'), card('H', '10'), card('H', 'K')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PRACTICE_ART = [card('D', 'A'), card('D', '10'), card('D', 'K')]
const FAN = ['fanFarLeft', 'fanLeft', 'fanMid', 'fanRight', 'fanFarRight'] as const

const fanPose = stylex.create({
  fanFarLeft: { transform: pose.fanFarLeft },
  fanLeft: { transform: pose.fanLeft },
  fanMid: { transform: pose.fanMid },
  fanRight: { transform: pose.fanRight },
  fanFarRight: { transform: pose.fanFarRight },
})

// The deal of the day green, the site's colour of what to do now; free play red, now that the friends' tile is gone;
// the course orange and the exercises navy as before.
const tileTones = stylex.create({
  daily: { backgroundColor: color.tileGreen, boxShadow: elev.tileGreen },
  play: { backgroundColor: color.tileRed, boxShadow: elev.tileRed },
  course: { backgroundColor: color.tileOrange, boxShadow: elev.tileOrange },
  practice: { backgroundColor: color.tileNavy, boxShadow: elev.tileNavy },
})

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: space.x32, [bp.phone]: space.x24 },
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: space.x32,
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  // Colour is stated, not inherited: the theme colours headings itself.
  title: { margin: 0, color: color.navy, textWrap: 'balance' },
  ways: {
    display: 'grid',
    gridTemplateColumns: { default: dims.homeWays, [bp.cards]: dims.homeWaysNarrow },
    gap: { default: space.x24, [bp.phone]: space.x12 },
  },
  // A colour card, as the lobby's tiles: its colour over its art, a shadow in its own colour.
  tile: {
    position: 'relative',
    display: 'flex',
    aspectRatio: dims.homeCard,
    // Its shape, never its words, sets its height: a title wider type wraps once more must not make one card taller than
    // its neighbour (SKATGO-151, the human: 「和左边的learn卡片，上下没对齐」).
    minHeight: 0,
    boxSizing: 'border-box',
    padding: { default: space.x24, [bp.phone]: space.x16 },
    overflow: 'hidden',
    borderRadius: radii.tile,
    color: color.onColor,
    textDecoration: 'none',
  },
  // The whole card is the link: it rises on hover and shows the focus ring, as a course card does.
  lift: {
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  art: {
    position: 'absolute',
    right: dims.tileArtRight,
    bottom: dims.tileArtBottom,
    display: 'flex',
    transform: pose.tileArt,
    pointerEvents: 'none',
  },
  artCard: { display: 'block', marginInline: dims.fanRowOverlap, transformOrigin: 'bottom center' },
  veil: { position: 'absolute', inset: 0, backgroundColor: 'inherit', opacity: veil.tile, pointerEvents: 'none' },
  // The icon at the top, the title at the bottom.
  body: { position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 },
  tileTitle: { margin: 0, color: color.onColor },
  // A long card: on PC in the third column, one row tall; under `bp.cards` the whole width.
  long: { gridColumn: { default: dims.homeLongColumn, [bp.cards]: dims.homeFullWidth }, minWidth: 0, minHeight: 0 },
  progress: { gridRow: { default: dims.homeRowFirst, [bp.cards]: dims.homeRowAuto } },
  // On PC the Elo board is as tall as the cards beside it, its list scrolling inside (SKATGO-144, the human: 「高度不能超过它相邻
  // 卡片的高度，所以可以滚动，要一致」): no height of its own to size the row by, then the whole row's.
  elo: {
    gridRow: { default: dims.homeRowSecond, [bp.cards]: dims.homeRowAuto },
    display: 'flex',
    flexDirection: 'column',
    height: { default: 0, [bp.cards]: 'auto' },
    minHeight: { default: '100%', [bp.cards]: 0 },
  },
  white: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    boxSizing: 'border-box',
    padding: { default: space.x24, [bp.phone]: space.x16 },
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.option,
    textDecoration: 'none',
  },
  whiteHead: { display: 'flex', alignItems: 'center', gap: space.x8 },
  whiteIcon: { flexShrink: 0, color: color.info },
  whiteTitle: { margin: 0, color: color.navy },
  eloEmpty: { flexGrow: 1 },
  // A guest's progress card: the line and the sign-in in the middle of what the card has left.
  guest: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: space.x12, flexGrow: 1, textAlign: 'center' },
  guestText: { margin: 0, color: color.slate, textWrap: 'balance' },
  more: {
    display: 'grid',
    // The ways in's columns, so each picture card stands under a colour card.
    gridTemplateColumns: { default: dims.homeWays, [bp.cards]: dims.homeWaysNarrow },
    gap: { default: space.x24, [bp.phone]: space.x12 },
  },
  // A picture card: no padding of its own, the picture to its edges at the top, rounded with the card.
  picture: { padding: 0, gap: 0, overflow: 'hidden' },
  pictureTop: { display: 'block', width: '100%', aspectRatio: dims.homePicture },
  pictureImage: { objectFit: 'cover' },
  pictureBody: { display: 'flex', flexDirection: 'column', gap: space.x8, padding: { default: space.x20, [bp.phone]: space.x16 } },
  pictureText: { margin: 0, color: color.slate },
  // The third picture card on PC: in the wide third column, half of it — as wide as one colour card (both a quarter of
  // the row less its gaps); under `bp.cards` it takes the next free place.
  third: { gridColumn: { default: dims.homeLongColumn, [bp.cards]: 'auto' }, width: { default: dims.half, [bp.cards]: 'auto' } },
  // The curve takes what the card has left, never sizing the card itself: no taller than the colour cards' row on PC.
  // The curve and its frame take what the card has left, never sizing the card: no taller than the colour cards' row on
  // PC, `homeCurve` at the least where the card is as tall as its content.
  // The figures beside the curve in the card's fixed height, over it on a phone, where the card takes the height it needs
  // (SKATGO-169).
  chart: { display: 'flex', flexDirection: { default: 'row', [bp.phone]: 'column' }, gap: { default: space.x24, [bp.phone]: space.x12 }, flexGrow: 1, minHeight: dims.homeCurve },
  figures: { display: 'flex', flexDirection: { default: 'column', [bp.phone]: 'row' }, justifyContent: { default: 'center', [bp.phone]: 'flex-start' }, flexShrink: 0, gap: { default: space.x8, [bp.phone]: space.x24 } },
  figure: { display: 'flex', flexDirection: 'column' },
  figureLabel: { color: color.slate },
  drawing: { display: 'flex', flexDirection: 'column', gap: space.x4, flexGrow: 1, minWidth: 0 },
  plotRow: { display: 'flex', gap: space.x8, flexGrow: 1, minHeight: { default: 0, [bp.phone]: dims.homeCurve } },
  // The drawing fills its box and has no size of its own, so the box, not the drawing's proportions, sets the height.
  plot: { position: 'relative', flexGrow: 1, minWidth: 0 },
  curve: { position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' },
  dates: { display: 'flex', justifyContent: 'space-between', color: color.slate },
  datesOne: { justifyContent: 'center' },
  zero: { stroke: color.hairline },
  line: { fill: 'none', stroke: color.info },
  point: { stroke: color.info },
})
