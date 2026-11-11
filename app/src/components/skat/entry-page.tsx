import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { CalendarDays, ChartLine, Gavel, GraduationCap, Swords, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { dailyProfile, isError } from '~/lib/daily-api'
import type { Card } from '~/lib/skat/cards'
import type { ProfileDeal } from '~/lib/skat/profile'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { DealLines } from './deal-history'
import { XpBoard } from './xp-board'
import { PlayingCard } from './playing-card'
import { Btn } from './ui'

// The front page (SKATGO-135, after the human's two pictures: 「topbar下，先显示slogan，然后显示下面的四个卡片……长卡片做两个，
// 一个是my progress……一个是 elo ranking」): the slogan, then the ways in — four colour cards two by two, each a link
// with its icon over its title (the deal of the day, free play, the course, the bidding practice since SKATGO-149), and beside them two long
// white cards: the XP board (SKATGO-172, where SKATGO-123's Elo board stood, on top since), and the player's
// progress — the player's games, each its cards and the difference to the AI (SKATGO-182) — leading to the record of play. Under `bp.cards` the four stay two by two and the long cards follow, the whole width. No
// hero buttons, no lead, no link row: the cards are the page. Rendered on the server; the games in the browser.
export function EntryPage() {
  const { xp } = useLoaderData({ from: '/' })
  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.entry_title()}</h1>
      <div data-testid="entry-sections" {...stylex.props(styles.ways)}>
        {/* The deal of the day stays "1 deal today" once played (SKATGO-135, the human: 「这个按钮文字不变」). */}
        <Way to="/daily" section="daily" tone="daily" Icon={CalendarDays} art={DAILY_ART} title={m.home_daily()} onClick={() => heroClick('primary')} />
        <Way to="/play" section="play" tone="play" Icon={Swords} art={PLAY_ART} title={m.home_free()} onClick={() => heroClick('free')} />
        <Way to="/course" section="course" tone="course" Icon={GraduationCap} art={COURSE_ART} title={m.home_learn()} />
        {/* The bidding practice (SKATGO-149, the human: 「practice卡片的位置，做成一个叫牌练习的东西」): an auction's hammer; its
            title one line, "Bidding" (SKATGO-151). */}
        <Way to="/bidding-practice" section="bidding" tone="practice" Icon={Gavel} art={PRACTICE_ART} title={m.home_bidding()} />
        {/* The XP board first, the player's progress under it (SKATGO-172, the human asked which goes on top: 「你建议？」). */}
        <div data-testid="entry-card" data-section="xp" {...stylex.props(styles.long, styles.board)}>
          {xp ? (
            <XpBoard board={xp} fill />
          ) : (
            <div {...stylex.props(styles.white, styles.boardEmpty)}>
              <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.xp_title()}</h2>
            </div>
          )}
        </div>
        <ProgressCard />
      </div>
      {/* Under them the rest, as picture cards (SKATGO-135, the human: 「私人牌桌和论坛，用卡片的形式，继续放到下面」): a private
          table with the illustration the hero once had (SKATGO-33), and the forum with the human's picture of people at a
          card table (`forum-card.webp`, cropped to the card), then the exercises (SKATGO-149). */}
      <div data-testid="entry-more" {...stylex.props(styles.more)}>
        <Link to="/with-friends" data-testid="entry-card" data-section="friends" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <span {...stylex.props(styles.pictureDim)}><img src="/hero-table.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage, styles.pictureMultiply)} /></span>
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_friends_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_friends_text()}</span>
          </span>
        </Link>
        <Link to="/forum" data-testid="entry-card" data-section="forum" {...stylex.props(styles.white, styles.picture, styles.lift)}>
          <span {...stylex.props(styles.pictureDim)}><img src="/forum-card.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage, styles.pictureMultiply)} /></span>
          <span {...stylex.props(styles.pictureBody)}>
            <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_forum_title()}</h2>
            <span {...stylex.props(typography.optionDesc, styles.pictureText)}>{m.home_forum_text()}</span>
          </span>
        </Link>
        {/* The exercises after the forum (SKATGO-149, the human: 「把practice放到forum下面」, cover B of three drawn for it):
            straight to them (SKATGO-105); the article is only for search engines. */}
        <Link to="/skat-tricks" data-testid="entry-card" data-section="tricks" {...stylex.props(styles.white, styles.picture, styles.lift, styles.third)}>
          <span {...stylex.props(styles.pictureDim)}><img src="/practice-card.webp" alt="" loading="lazy" {...stylex.props(styles.pictureTop, styles.pictureImage, styles.pictureMultiply)} /></span>
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

/** The progress card (SKATGO-182, the human: 「每一行显示用户拿到了啥牌，以及和ai差几分，不管是否登录，这个my progress卡片都显示这个，
 *  想点击，必须登录」): whoever has played sees their games, newest first, each its ten cards and the difference to the AI. For an
 *  account the card is the link to the record of play; a guest's games open Clerk's sign-in first, then the record, and
 *  the sign-in stands beside the title too. A guest who has not played sees what signing in keeps, and the sign-in in the
 *  middle (the human: 「progress如果用户没登录，就要显示登录后保存你的表现记录以及ai分析，中间放个登录按钮」). */
function ProgressCard() {
  const account = useAccount()
  const navigate = useNavigate()
  const [games, setGames] = useState<ProfileDeal[] | null>(null)
  /** A guest tapped their games: once signed in, and the record read — which takes the device's games in — the record. */
  const [wanted, setWanted] = useState(false)
  useEffect(() => {
    if (account === undefined) return
    let live = true
    setGames(null)
    void dailyProfile().then((r) => { if (live && !isError(r)) setGames(r.deals) })
    return () => { live = false }
  }, [account])
  useEffect(() => {
    if (account && wanted && games) void navigate({ to: '/profile' })
  }, [account, wanted, games])
  // As the XP board's title beside it, with the record of play's icon from the account menu (SKATGO-128).
  const head = (
    <span {...stylex.props(styles.whiteHead)}>
      <h2 {...stylex.props(typography.homeCardTitle, styles.whiteTitle)}>{m.home_progress()}</h2>
      <ChartLine aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.whiteIcon)} />
    </span>
  )
  const list = games?.length ? <DealLines deals={[...games].reverse().slice(0, HOME_GAMES)} /> : null
  if (account) {
    return (
      <Link to="/profile" data-testid="entry-card" data-section="progress" data-games={games?.length ?? 0} {...stylex.props(styles.long, styles.white, styles.lift, styles.progress, styles.listed)}>
        {head}
        <div {...stylex.props(styles.history)}>{list}</div>
      </Link>
    )
  }
  if (account === null && games?.length) {
    return (
      <div data-testid="entry-card" data-section="progress" data-guest="true" data-games={games.length} {...stylex.props(styles.long, styles.white, styles.progress, styles.listed)}>
        <div {...stylex.props(styles.guestHead)}>
          {head}
          <SignInButton mode="modal">
            <Btn testId="entry-progress-sign-in" size="lg" onClick={() => track('sign_in_clicked', { at: 'home' })}>{m.auth_sign_in()}</Btn>
          </SignInButton>
        </div>
        <SignInButton mode="modal">
          <div role="button" tabIndex={0} data-testid="entry-progress-games" onClick={() => {
            setWanted(true)
            track('sign_in_clicked', { at: 'home' })
          }} onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.currentTarget.click()
            }
          }} {...stylex.props(styles.history, styles.games)}>
            {list}
          </div>
        </SignInButton>
      </div>
    )
  }
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

/** How many games the card lists, scrolling inside it. */
const HOME_GAMES = 20

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
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    // Close under the top bar (SKATGO-175, the human: 「top margin偏大」; 32px before).
    paddingTop: space.x16,
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  // Colour is stated, not inherited: the theme colours headings itself.
  // The sub-pages' H1 (`landingHeading`, as "Daily Skat: 1 deal or a tournament of 6"), 16px above and below
  // (SKATGO-175, the human: 「改成这个字token如何？下面的margin要改」).
  title: { margin: 0, marginBottom: space.x16, color: color.navy, textWrap: 'balance' },
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
  progress: { gridRow: { default: dims.homeRowSecond, [bp.cards]: dims.homeRowAuto } },
  // On PC the XP board (the Elo board's place and size until SKATGO-172) is as tall as the cards beside it, its list scrolling inside (SKATGO-144, the human: 「高度不能超过它相邻
  // 卡片的高度，所以可以滚动，要一致」): no height of its own to size the row by, then the whole row's.
  board: {
    gridRow: { default: dims.homeRowFirst, [bp.cards]: dims.homeRowAuto },
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
  boardEmpty: { flexGrow: 1 },
  // A guest's progress card: the line and the sign-in in the middle of what the card has left.
  guest: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: space.x12, flexGrow: 1, textAlign: 'center' },
  guestText: { margin: 0, color: color.slate, textWrap: 'balance' },
  // A guest's games on the card (SKATGO-182): as the XP board's list, the first five in one column and the rest scrolling.
  history: { flexGrow: 1, minHeight: 0, maxHeight: { default: null, [bp.cards]: dims.xpListNarrow }, overflowY: 'auto' },
  guestHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.x12, flexShrink: 0 },
  // The games, the link to the record: no look of a link of their own, the focus ring when reached by keyboard.
  games: {
    cursor: 'pointer',
    textDecoration: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  // The card with a guest's games takes the row's height as the XP board does, its list scrolling, never sizing the row.
  listed: { height: { default: 0, [bp.cards]: 'auto' }, minHeight: { default: '100%', [bp.cards]: 0 } },
  more: {
    marginTop: { default: space.x32, [bp.phone]: space.x24 },
    display: 'grid',
    // The ways in's columns, so each picture card stands under a colour card.
    gridTemplateColumns: { default: dims.homeWays, [bp.cards]: dims.homeWaysNarrow },
    gap: { default: space.x24, [bp.phone]: space.x12 },
  },
  // A picture card: no padding of its own, the picture to its edges at the top, rounded with the card.
  picture: { padding: 0, gap: 0, overflow: 'hidden' },
  pictureTop: { display: 'block', width: '100%', aspectRatio: dims.homePicture },
  pictureImage: { objectFit: 'cover' },
  // A picture's white ground dimmed at night (SKATGO-184): multiplied with `color.imageDim`, which is white by day.
  pictureDim: { display: 'block', backgroundColor: color.imageDim, isolation: 'isolate' },
  pictureMultiply: { mixBlendMode: 'multiply' },
  pictureBody: { display: 'flex', flexDirection: 'column', gap: space.x8, padding: { default: space.x20, [bp.phone]: space.x16 } },
  pictureText: { margin: 0, color: color.slate },
  // The third picture card on PC: in the wide third column, half of it — as wide as one colour card (both a quarter of
  // the row less its gaps); under `bp.cards` it takes the next free place.
  third: { gridColumn: { default: dims.homeLongColumn, [bp.cards]: 'auto' }, width: { default: dims.half, [bp.cards]: 'auto' } },
})
