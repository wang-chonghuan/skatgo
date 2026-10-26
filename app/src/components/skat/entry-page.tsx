import { Link, useLoaderData } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { Bot, CalendarDays, ChartLine, GraduationCap, MessagesSquare, Puzzle, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { dailyProfile, isError } from '~/lib/daily-api'
import type { Card } from '~/lib/skat/cards'
import { type ProfileDay, daysOf } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon, profileChart } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { EloBoard } from './elo-board'
import { PlayingCard } from './playing-card'

// The front page (SKATGO-135, after the human's two pictures: 「topbar下，先显示slogan，然后显示下面的四个卡片……长卡片做两个，
// 一个是my progress……一个是 elo ranking」): the slogan, then the ways in — four colour cards two by two, each a link
// with its icon over its title (the deal of the day, free play, the course, the exercises), and beside them two long
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
        <Way to="/play" section="play" tone="play" Icon={Bot} art={PLAY_ART} title={m.home_free()} onClick={() => heroClick('free')} />
        <Way to="/course" section="course" tone="course" Icon={GraduationCap} art={COURSE_ART} title={m.home_learn()} />
        {/* The tricks (SKATGO-82): straight to the exercises (SKATGO-105); the article is only for search engines. */}
        <Way to="/skat-tricks" section="tricks" tone="practice" Icon={Puzzle} art={PRACTICE_ART} title={m.home_practice()} />
        <Link to="/profile" data-testid="entry-card" data-section="progress" {...stylex.props(styles.long, styles.white, styles.lift, styles.progress)}>
          <span {...stylex.props(styles.whiteHead)}>
            {/* As the Elo board's title beside it, with the record of play's icon from the account menu (SKATGO-128). */}
            <h2 {...stylex.props(typography.dialogTitle, styles.whiteTitle)}>{m.home_progress()}</h2>
            <ChartLine aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.whiteIcon)} />
          </span>
          <Progress />
        </Link>
        <div data-testid="entry-card" data-section="elo" {...stylex.props(styles.long, styles.elo)}>
          {elo ? (
            <EloBoard board={elo} fill />
          ) : (
            <div {...stylex.props(styles.white, styles.eloEmpty)}>
              <h2 {...stylex.props(typography.dialogTitle, styles.whiteTitle)}>{m.elo_title()}</h2>
            </div>
          )}
        </div>
      </div>
      {/* Under them the rest, as picture cards (SKATGO-135, the human: 「私人牌桌和论坛，用卡片的形式，继续放到下面」): a private
          table with the illustration the hero once had (SKATGO-33), and the forum with three of skatgo's cards. */}
      <div data-testid="entry-more" {...stylex.props(styles.more)}>
        <Link to="/with-friends" data-testid="entry-card" data-section="friends" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <img src="/hero-table.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage)} />
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.optionTitle, styles.whiteTitle)}>{m.home_friends_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_friends_text()}</span>
          </span>
        </Link>
        <Link to="/forum" data-testid="entry-card" data-section="forum" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <span aria-hidden="true" {...stylex.props(styles.pictureTop, styles.forumPicture)}>
            <MessagesSquare size={icon.tile} strokeWidth={icon.outline} {...stylex.props(styles.forumIcon)} />
            <span {...stylex.props(styles.forumFan)}>
              {FORUM_ART.map((c, i) => (
                <span key={i} {...stylex.props(styles.artCard, fanPose[FAN[i + 1]])}>
                  <PlayingCard card={c} size="lg" />
                </span>
              ))}
            </span>
          </span>
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.optionTitle, styles.whiteTitle)}>{m.home_forum_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_forum_text()}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}

/** The hero's ways in as they are counted (SKATGO-29; renamed by SKATGO-74's tracking plan): the deal of the day, free play. */
const heroClick = (button: 'primary' | 'free') => track('home_cta_clicked', { button })

/** A colour card: its icon at the top, its title at the bottom, three of skatgo's cards in the corner under its colour. */
function Way({ to, section, tone, Icon, art, title, onClick }: { to: '/daily' | '/play' | '/course' | '/skat-tricks'; section: string; tone: keyof typeof tileTones; Icon: LucideIcon; art: Card[]; title: string; onClick?: () => void }) {
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
        <h2 {...stylex.props(typography.tileTitle, styles.tileTitle)}>{title}</h2>
      </span>
    </Link>
  )
}

/** The player's curve on the progress card: the record of play's points, day by day, without dates or scale. An
 *  account's only, read in the browser; nothing for a guest or before the first deal. */
function Progress() {
  const account = useAccount()
  const [days, setDays] = useState<ProfileDay[] | null>(null)
  useEffect(() => {
    if (!account) return
    let live = true
    void dailyProfile().then((r) => { if (live && !isError(r)) setDays(daysOf(r.deals)) })
    return () => { live = false }
  }, [account])
  const known = (days ?? []).flatMap((d, i) => (d.perDeal === null ? [] : [{ i, v: d.perDeal }]))
  if (!days || known.length === 0) return null
  const { width, height, pad, dot, line } = profileChart
  const top = Math.max(0, ...known.map((p) => p.v))
  const bottom = Math.min(0, ...known.map((p) => p.v))
  const span = top - bottom || 1
  const x = (i: number) => (days.length > 1 ? pad + (i * (width - 2 * pad)) / (days.length - 1) : width / 2)
  const y = (v: number) => pad + ((top - v) * (height - 2 * pad)) / span
  return (
    <svg data-testid="entry-progress-curve" aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" {...stylex.props(styles.curve)}>
      <line x1={0} x2={width} y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" {...stylex.props(styles.zero)} />
      <polyline points={known.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} strokeWidth={line} vectorEffect="non-scaling-stroke" {...stylex.props(styles.line)} />
      {known.map((p) => (
        <line key={p.i} x1={x(p.i)} x2={x(p.i)} y1={y(p.v)} y2={y(p.v)} strokeWidth={dot * 2} strokeLinecap="round" vectorEffect="non-scaling-stroke" {...stylex.props(styles.point)} />
      ))}
    </svg>
  )
}

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const DAILY_ART = [card('H', 'A'), card('H', '10'), card('H', 'K')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PRACTICE_ART = [card('D', 'A'), card('D', '10'), card('D', 'K')]
const FORUM_ART = [card('C', 'Q'), card('H', 'Q'), card('S', 'Q')]
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
    paddingBottom: space.x72,
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
  elo: { gridRow: { default: dims.homeRowSecond, [bp.cards]: dims.homeRowAuto }, display: 'flex', flexDirection: 'column' },
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
  forumPicture: { position: 'relative', overflow: 'hidden', backgroundColor: color.info },
  forumIcon: { position: 'absolute', top: space.x16, left: space.x16, color: color.onColor },
  forumFan: { position: 'absolute', right: dims.tileArtRight, bottom: dims.tileArtBottom, display: 'flex', transform: pose.tileArt },
  // The curve takes what the card has left, never sizing the card itself: no taller than the colour cards' row on PC.
  curve: { display: 'block', width: '100%', height: 0, flexGrow: 1, minHeight: dims.homeCurve },
  zero: { stroke: color.hairline },
  line: { fill: 'none', stroke: color.info },
  point: { stroke: color.info },
})
