import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { Club, Diamond, Heart, Spade } from 'lucide-react'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'

import type { Card } from '~/lib/skat/cards'
import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, fill, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PlayingCard } from './playing-card'
import { Pill, linkLook } from './ui'

const NOTHING_DONE: Record<string, LessonRecord> = {}

// The front page, in the lobby design (SKATGO-26, reference.md): the public site's hero — the headline,
// the lead, one green call to action, a picture, and a strip of facts — then the four ways into Skat as
// the app's colour tiles, one suit each in Skat order (SKATGO-23): ♣ Course, ♠ Play, ♥ Duplicate,
// ♦ Puzzles. Course and Play open what exists; Duplicate and Puzzles are announced and are not links.
//
// Every picture here is skatgo's own: the public-domain deck the course plays with, fanned on felt, and
// the suits as outline icons. Rendered on the server; the learner's progress is applied after mount.
export function EntryPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const storedDone = useProgress((s) => s.done)
  const done = mounted ? storedDone : NOTHING_DONE
  const course = lessons()
  const finished = course.filter((l) => l.id in done).length

  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      <section data-testid="entry-hero" {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroText)}>
          <div {...stylex.props(styles.eyebrow)}>
            <Pill tone="go">{m.entry_eyebrow()}</Pill>
            <span aria-hidden="true" {...stylex.props(styles.suits)}>
              {SUITS.map((suit) => (
                <span key={suit} {...stylex.props(typography.markGlyph, RED.includes(suit) ? styles.suitRed : styles.suitInk)}>
                  {suit}
                </span>
              ))}
            </span>
          </div>
          <h1 {...stylex.props(typography.landingTitle, styles.title)}>{m.entry_title()}</h1>
          <p {...stylex.props(typography.landingLead, styles.lead)}>{m.entry_lead()}</p>
          <div>
            <Link to="/play" data-testid="entry-cta" {...linkLook('go', 'lg', 'landing')}>
              {m.entry_cta()}
            </Link>
          </div>
        </div>
        <HeroArt />
        <ul data-testid="entry-points" {...stylex.props(styles.points)}>
          {[m.entry_point_ready(), m.entry_point_browser(), m.entry_point_languages()].map((point) => (
            <li key={point} {...stylex.props(typography.landingBody, styles.point)}>
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* One grid for both groups, so all four tiles share one height (shape.stylex.ts, lobbyRows). */}
      <div data-testid="entry-sections" {...stylex.props(styles.lobby)}>
        <h2 {...stylex.props(typography.sectionTitle, styles.groupTitle, area.ta)}>{m.entry_section_start()}</h2>
        <Link to="/course" data-testid="entry-card" data-section="course" {...stylex.props(styles.tile, styles.tileOpen, tileTones.course, area.c)}>
          <Face Icon={Club} art={COURSE_ART} title={m.entry_course_title()} text={m.entry_course_desc({ count: course.length })}>
            <Pill tone="quiet">{finished === 0 ? m.entry_course_start() : m.entry_course_continue()}</Pill>
            <span {...stylex.props(typography.tileSub, styles.aside)}>{m.home_done({ finished, total: course.length })}</span>
          </Face>
        </Link>
        <Link to="/play" data-testid="entry-card" data-section="play" {...stylex.props(styles.tile, styles.tileOpen, tileTones.play, area.p)}>
          <Face Icon={Spade} art={PLAY_ART} title={m.entry_play_title()} text={m.entry_play_desc()}>
            <Pill tone="quiet">{m.entry_play_cta()}</Pill>
          </Face>
        </Link>
        <h2 {...stylex.props(typography.sectionTitle, styles.groupTitle, styles.laterTitle, area.tb)}>{m.entry_section_soon()}</h2>
        <div aria-disabled="true" data-testid="entry-card" data-section="duplicate" data-state="soon" {...stylex.props(styles.tile, tileTones.soon, area.d)}>
          <Face Icon={Heart} art={DUPLICATE_ART} soon title={m.entry_duplicate_title()} text={m.entry_duplicate_desc()}>
            <Pill tone="quiet">{m.entry_soon()}</Pill>
          </Face>
        </div>
        <div aria-disabled="true" data-testid="entry-card" data-section="puzzles" data-state="soon" {...stylex.props(styles.tile, tileTones.soon, area.z)}>
          <Face Icon={Diamond} art={PUZZLES_ART} soon title={m.entry_puzzles_title()} text={m.entry_puzzles_desc()}>
            <Pill tone="quiet">{m.entry_soon()}</Pill>
          </Face>
        </div>
      </div>
    </div>
  )
}

type Suit = '♣' | '♠' | '♥' | '♦'
const SUITS: Suit[] = ['♣', '♠', '♥', '♦']
const RED: Suit[] = ['♥', '♦']

const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const DUPLICATE_ART = [card('H', 'A'), card('H', '10'), card('H', 'K')]
const PUZZLES_ART = [card('D', '7'), card('D', 'Q'), card('D', 'A')]
const HERO_HAND = [card('C', 'J'), card('S', 'J'), card('H', 'J'), card('D', 'J'), card('C', 'A')]
const FAN = ['fanFarLeft', 'fanLeft', 'fanMid', 'fanRight', 'fanFarRight'] as const

/** The hero's picture: a hand of skatgo's own cards fanned on the table's felt. */
function HeroArt() {
  return (
    <div aria-hidden="true" data-testid="entry-art" {...stylex.props(styles.heroArt)}>
      <div {...stylex.props(styles.heroFan)}>
        {HERO_HAND.map((c, i) => (
          <span key={i} {...stylex.props(styles.heroCard, fanPose[FAN[i]])}>
            <PlayingCard card={c} size="lg" />
          </span>
        ))}
      </div>
    </div>
  )
}

/** A tile's face: its suit icon at the top left, three of skatgo's cards in the corner under the tile's
 *  colour, and the title, one line and the foot at the bottom left. */
function Face({ Icon, art, soon, title, text, children }: { Icon: ComponentType<{ size?: number; strokeWidth?: number }>; art: Card[]; soon?: boolean; title: string; text: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(styles.art)}>
        {art.map((c, i) => (
          <span key={i} {...stylex.props(styles.artCard, fanPose[FAN[i + 1]])}>
            <PlayingCard card={c} size="lg" />
          </span>
        ))}
      </span>
      <span aria-hidden="true" {...stylex.props(styles.veil, soon && styles.veilSoon)} />
      <span aria-hidden="true" {...stylex.props(styles.icon)}>
        <Icon size={icon.tile} strokeWidth={icon.outline} />
      </span>
      <div {...stylex.props(styles.body)}>
        <h3 {...stylex.props(typography.tileTitle, styles.tileTitle)}>{title}</h3>
        <p {...stylex.props(typography.tileSub, styles.tileText)}>{text}</p>
        <div {...stylex.props(styles.foot)}>{children}</div>
      </div>
    </>
  )
}

const fanPose = stylex.create({
  fanFarLeft: { transform: pose.fanFarLeft },
  fanLeft: { transform: pose.fanLeft },
  fanMid: { transform: pose.fanMid },
  fanRight: { transform: pose.fanRight },
  fanFarRight: { transform: pose.fanFarRight },
})

// Where each piece sits in the sections grid (lobbyAreas).
const area = stylex.create({
  ta: { gridArea: 'ta' },
  tb: { gridArea: 'tb' },
  c: { gridArea: 'c' },
  p: { gridArea: 'p' },
  d: { gridArea: 'd' },
  z: { gridArea: 'z' },
})

const tileTones = stylex.create({
  course: { backgroundColor: color.tileOrange, boxShadow: elev.tileOrange },
  play: { backgroundColor: color.tileGreen, boxShadow: elev.tileGreen },
  soon: { backgroundColor: color.tileSoon, boxShadow: elev.tileSoon },
})

const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: space.x48, [bp.phone]: space.x32 },
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x32 },
    paddingBottom: space.x72,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: { default: dims.heroColumns, [bp.hero]: dims.oneColumn },
    alignItems: 'center',
    gap: { default: space.x32, [bp.phone]: space.x24 },
  },
  heroText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: { default: space.x24, [bp.phone]: space.x16 } },
  eyebrow: { display: 'flex', alignItems: 'center', gap: space.x12 },
  suits: { display: 'flex', alignItems: 'center', gap: space.x6 },
  suitInk: { color: color.navy },
  suitRed: { color: color.suitRed },
  // Colour is stated, not inherited: the theme colours headings and paragraphs itself.
  title: { margin: 0, color: color.navy, textWrap: 'balance' },
  lead: { margin: 0, color: color.slate },
  heroArt: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: { default: dims.heroArtHeight, [bp.phone]: dims.heroArtHeightPhone },
    borderRadius: radii.tile,
    backgroundImage: fill.felt,
    boxShadow: elev.eventCard,
    overflow: 'hidden',
  },
  heroFan: { display: 'flex', alignItems: 'flex-end' },
  heroCard: { display: 'block', marginInline: dims.fanRowOverlap, transformOrigin: 'bottom center' },
  // The strip of facts under the hero, in the public site's navy.
  points: {
    gridColumn: dims.fullRow,
    display: 'grid',
    gridTemplateColumns: { default: dims.threeColumns, [bp.phone]: dims.oneColumn },
    gap: space.x16,
    margin: 0,
    paddingBlock: space.x20,
    paddingInline: space.x24,
    listStyleType: 'none',
    borderRadius: radii.landingBtn,
    backgroundColor: color.navy,
  },
  point: { margin: 0, color: color.onColor, textAlign: { default: 'center', [bp.phone]: 'left' } },

  lobby: {
    display: 'grid',
    gridTemplateColumns: { default: dims.lobbyGridColumns, [bp.mid]: dims.lobbyGridColumnsMid, [bp.phone]: dims.oneColumn },
    gridTemplateAreas: { default: dims.lobbyAreas, [bp.mid]: dims.lobbyAreasMid, [bp.phone]: dims.lobbyAreasPhone },
    gridTemplateRows: { default: dims.lobbyRows, [bp.mid]: dims.lobbyRowsMid, [bp.phone]: dims.lobbyRowsPhone },
    columnGap: space.x15,
    rowGap: space.x15,
  },
  groupTitle: { margin: 0, color: color.navy, alignSelf: 'end' },
  // Stacked groups keep the room between them that side-by-side groups have.
  laterTitle: { marginTop: { default: 0, [bp.mid]: space.x32, [bp.phone]: space.x32 } },
  // A lobby tile: its colour over its art, a shadow in its own colour, content at the bottom left.
  tile: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    minHeight: dims.tileHeight,
    boxSizing: 'border-box',
    padding: space.x27,
    overflow: 'hidden',
    borderRadius: radii.tile,
    color: color.onColor,
    textDecoration: 'none',
  },
  tileOpen: {
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform',
    transitionDuration: timing.tile,
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
  veilSoon: { opacity: veil.soon },
  icon: { position: 'absolute', top: space.x27, left: space.x27, display: 'flex', color: color.onColor },
  body: { position: 'relative', display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: dims.tileIcon },
  tileTitle: { margin: 0, color: color.onColor },
  tileText: { margin: 0, color: color.onColor },
  foot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x12, paddingTop: space.x8 },
  aside: { color: color.onColor },
})
