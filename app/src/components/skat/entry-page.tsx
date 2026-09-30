import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { DAILY_EST_MINUTES } from '~/lib/daily'
import { faq } from '~/lib/faq'
import type { Card } from '~/lib/skat/cards'
import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { timing } from '../../theme/effects.stylex'
import { elev, pose, veil } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PlayingCard } from './playing-card'
import { linkLook } from './ui'

const NOTHING_DONE: Record<string, LessonRecord> = {}

// The front page, in the lobby design (SKATGO-26, reference.md): the public site's hero — the daily Skat
// tournament as the headline, its green call to action with the way in for beginners beside it, a
// picture, and a strip of facts — then the two other ways into Skat as the app's colour tiles, one suit
// each (♣ the course, ♠ free play), and the questions people ask (SKATGO-29). The hero's copy leads the
// tournament itself (the human, 2026-09-30: 「文案先行」).
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
  const next = course.find((l) => !(l.id in done))?.id ?? course[course.length - 1].id

  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      <section data-testid="entry-hero" {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroText)}>
          <h1 {...stylex.props(typography.landingHero, styles.title)}>{m.entry_title()}</h1>
          <p {...stylex.props(typography.landingHeroLead, styles.lead)}>{m.entry_lead()}</p>
          <div {...stylex.props(styles.actions)}>
            <Link to="/daily" data-testid="entry-cta" onClick={() => heroClick('primary')} {...linkLook('go', 'lg', 'landing')}>
              {m.entry_cta()}
            </Link>
            <Link to="/course" data-testid="entry-cta-learn" onClick={() => heroClick('secondary')} {...linkLook('quiet', 'lg', 'landing')}>
              {m.entry_cta_learn()}
            </Link>
          </div>
        </div>
        <HeroArt />
        <ul data-testid="entry-points" {...stylex.props(styles.points)}>
          {[m.entry_point_midnight(), m.entry_point_minutes({ minutes: DAILY_EST_MINUTES }), m.entry_point_signup()].map((point) => (
            <li key={point} {...stylex.props(typography.landingBody, styles.point)}>
              {point}
            </li>
          ))}
        </ul>
      </section>

      <div data-testid="entry-sections" {...stylex.props(styles.ways)}>
        <section data-testid="entry-card" data-section="course" {...stylex.props(styles.tile, tileTones.course)}>
          <Face art={COURSE_ART} title={m.entry_new_title()} text={m.entry_new_text({ count: course.length })}>
            <Link to="/course" data-testid="entry-course" {...linkLook('quiet', 'md', 'landing')}>
              {finished === 0 ? m.entry_new_cta() : m.course_continue({ n: next })}
            </Link>
            {finished > 0 ? <span {...stylex.props(typography.tileSub, styles.aside)}>{m.home_done({ finished, total: course.length })}</span> : null}
          </Face>
        </section>
        <section data-testid="entry-card" data-section="play" {...stylex.props(styles.tile, tileTones.play)}>
          <Face art={PLAY_ART} title={m.entry_game_title()} text={m.entry_game_text()}>
            <Link to="/play" data-testid="entry-play" {...linkLook('quiet', 'md', 'landing')}>
              {m.entry_game_cta()}
            </Link>
          </Face>
        </section>
      </div>

      <section data-testid="entry-faq" aria-labelledby="faq-title" {...stylex.props(styles.faq)}>
        <h2 id="faq-title" {...stylex.props(typography.landingHeading, styles.faqTitle)}>{m.faq_title()}</h2>
        <dl {...stylex.props(styles.faqList)}>
          {faq().map(({ q, a }) => (
            <div key={q} {...stylex.props(styles.faqItem)}>
              <dt {...stylex.props(typography.optionTitle, styles.faqQ)}>{q}</dt>
              <dd {...stylex.props(typography.landingBody, styles.faqA)}>{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

/** The hero is always in its first state until Duplicate exists (SKATGO-29, grill Q1), with one headline. */
const heroClick = (button: 'primary' | 'secondary') => track('hero_cta_click', { state: 'A', variant: 'default', button })


const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const FAN = ['fanFarLeft', 'fanLeft', 'fanMid', 'fanRight', 'fanFarRight'] as const

/** The hero's picture: a game at skatgo's own table (a screenshot of free play, SKATGO-29), shown whole. */
function HeroArt() {
  return (
    <div data-testid="entry-art" {...stylex.props(styles.heroArt)}>
      <img src="/hero-table.webp" alt={m.entry_art_alt()} {...stylex.props(styles.heroImage)} />
    </div>
  )
}

/** A tile's face: three of skatgo's cards in the corner under the tile's colour, and the title, one line
 *  and the foot at the bottom left. */
function Face({ art, title, text, children }: { art: Card[]; title: string; text: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(styles.art)}>
        {art.map((c, i) => (
          <span key={i} {...stylex.props(styles.artCard, fanPose[FAN[i + 1]])}>
            <PlayingCard card={c} size="lg" />
          </span>
        ))}
      </span>
      <span aria-hidden="true" {...stylex.props(styles.veil)} />
      <div {...stylex.props(styles.body)}>
        <h2 {...stylex.props(typography.tileTitle, styles.tileTitle)}>{title}</h2>
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

const tileTones = stylex.create({
  course: { backgroundColor: color.tileOrange, boxShadow: elev.tileOrange },
  play: { backgroundColor: color.tileGreen, boxShadow: elev.tileGreen },
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
    // The headline's first line starts level with the top of the picture (SKATGO-29).
    alignItems: 'start',
    gap: { default: space.x32, [bp.phone]: space.x24 },
  },
  heroText: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, gap: { default: space.x24, [bp.phone]: space.x16 } },
  // Colour is stated, not inherited: the theme colours headings and paragraphs itself.
  title: { margin: 0, color: color.navy, textWrap: 'balance' },
  lead: { margin: 0, color: color.slate },
  heroArt: {
    aspectRatio: dims.heroArtRatio,
    borderRadius: radii.tile,
    boxShadow: elev.eventCard,
    overflow: 'hidden',
  },
  // The whole screenshot, never cropped: the box has its proportions.
  heroImage: { display: 'block', width: '100%', height: '100%', objectFit: 'contain' },
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

  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  // The two ways in, side by side; stacked on a phone.
  ways: {
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.phone]: dims.oneColumn },
    columnGap: space.x15,
    rowGap: space.x15,
  },
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
  body: { position: 'relative', display: 'flex', flexDirection: 'column', gap: space.x8 },
  tileTitle: { margin: 0, color: color.onColor },
  tileText: { margin: 0, color: color.onColor },
  foot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x12, paddingTop: space.x8 },
  aside: { color: color.onColor },

  faq: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  faqTitle: { margin: 0, color: color.navy },
  faqList: { display: 'flex', flexDirection: 'column', margin: 0 },
  faqItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBlock: space.x20,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  faqQ: { margin: 0, color: color.navy },
  faqA: { margin: 0, color: color.slate },
})
