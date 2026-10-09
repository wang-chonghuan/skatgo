import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
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
import { Pill, linkLook } from './ui'

const NOTHING_DONE: Record<string, LessonRecord> = {}

// The front page, in the lobby design (SKATGO-26, reference.md): the public site's hero — the daily Skat
// tournament as the headline and its one green call to action (the way into the course is the header's
// and the course tile's — the human, 2026-10-01), a picture, and a strip of facts — then the two other ways into Skat as the app's colour tiles, one suit
// each (♣ the course, ♠ free play, ♥ a private table with friends — SKATGO-61), and the questions people ask (SKATGO-29). The hero's copy leads the
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
          <div {...stylex.props(styles.cta)}>
            <div {...stylex.props(styles.actions)}>
              <Link to="/daily" data-testid="entry-cta" onClick={() => heroClick('primary')} {...linkLook('go', 'lg', 'landing')}>
                {m.entry_cta()}
              </Link>
            </div>
            {/* What a first-time visitor wants to know before pressing it, quietly (the human, 2026-10-01). */}
            <ul data-testid="entry-points" {...stylex.props(styles.points)}>
              {[m.entry_point_free(), m.entry_point_no_signup(), m.entry_point_midnight()].map((point) => (
                <li key={point} {...stylex.props(typography.appText, styles.point)}>
                  <span aria-hidden="true" {...stylex.props(styles.check)}>✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <HeroArt />
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
        <section data-testid="entry-card" data-section="friends" {...stylex.props(styles.tile, tileTones.friends)}>
          <Face art={FRIENDS_ART} title={m.entry_friends_title()} text={m.entry_friends_text()}>
            <Link to="/with-friends" data-testid="entry-friends" {...linkLook('quiet', 'md', 'landing')}>
              {m.table_open()}
            </Link>
          </Face>
        </section>
        {/* Practice (SKATGO-69): not there yet, so the tile leads nowhere — no link, nothing that reacts
            to the pointer — and says so with a fact, not a button. */}
        <section data-testid="entry-card" data-section="practice" {...stylex.props(styles.tile, tileTones.practice)}>
          <Face art={PRACTICE_ART} title={m.entry_practice_title()} text={m.entry_practice_text()}>
            <Pill tone="quiet">{m.entry_practice_soon()}</Pill>
          </Face>
        </section>
      </div>

      <nav aria-label={m.game_learning_title()} {...stylex.props(styles.actions)}>
        <Link to="/rules" {...stylex.props(typography.link, styles.readingLink)}>{m.rules_title()}</Link>
        <Link to="/course" {...stylex.props(typography.link, styles.readingLink)}>{m.course_title()}</Link>
      </nav>

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
const heroClick = (button: 'primary') => track('hero_cta_click', { state: 'A', variant: 'default', button })


const card = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank })
const COURSE_ART = [card('C', 'J'), card('S', 'J'), card('H', 'J')]
const PLAY_ART = [card('S', 'A'), card('S', '10'), card('S', 'K')]
const FRIENDS_ART = [card('H', 'A'), card('H', '10'), card('H', 'K')]
const PRACTICE_ART = [card('D', 'A'), card('D', '10'), card('D', 'K')]
const FAN = ['fanFarLeft', 'fanLeft', 'fanMid', 'fanRight', 'fanFarRight'] as const

/** The hero's picture: three players at a club-shaped table (the human's illustration, SKATGO-33), shown whole. */
function HeroArt() {
  return (
    <div data-testid="entry-art" {...stylex.props(styles.heroArt)}>
      <img src="/hero-table.webp" alt={m.entry_art_alt()} {...stylex.props(styles.heroImage)} />
    </div>
  )
}

/** A tile's face: three of skatgo's cards in the corner under the tile's colour, the title and its text at
 *  the top left, and the foot at the bottom left. */
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
  friends: { backgroundColor: color.tileRed, boxShadow: elev.tileRed },
  practice: { backgroundColor: color.tileNavy, boxShadow: elev.tileNavy },
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
  // The facts under the call to action: one quiet line that wraps on a phone.
  points: { display: 'flex', flexWrap: 'wrap', columnGap: space.x16, rowGap: space.x4, margin: 0, padding: 0, listStyleType: 'none' },
  point: { display: 'inline-flex', gap: space.x6, margin: 0, color: color.slate },
  check: { color: color.go },

  // The call to action with its facts right under it.
  cta: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  // The two ways in, side by side; stacked on a phone.
  ways: {
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.phone]: dims.oneColumn },
    columnGap: space.x15,
    rowGap: space.x15,
  },
  // A lobby tile: its colour over its art, a shadow in its own colour, its title and text at the top left
  // and its button at the bottom, so tiles side by side line up whatever their text's length (SKATGO-69).
  tile: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
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
  body: { position: 'relative', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: space.x8 },
  tileTitle: { margin: 0, color: color.onColor },
  tileText: { margin: 0, color: color.onColor },
  foot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x12, marginTop: 'auto', paddingTop: space.x8 },
  aside: { color: color.onColor },
  readingLink: { color: color.info, textDecoration: 'underline' },

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
