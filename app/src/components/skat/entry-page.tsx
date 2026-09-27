import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { move, shadow, texture, timing } from '../../theme/effects.stylex'
import { border, opacity, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'
import { Pill, linkLook } from './ui'

const NOTHING_DONE: Record<string, LessonRecord> = {}

// The front page (SKATGO-23): four ways into Skat, one per suit in Skat order — ♣ Course, ♠ Play,
// ♥ Duplicate, ♦ Puzzles. Each card is a piece of felt with its suit pressed into it. Course and Play
// open what already exists; Duplicate and Puzzles are announced but not open, so they are not links and
// cannot be focused or clicked.
//
// Rendered on the server like the course map: the text is the same for everyone. The learner's
// progress lives in localStorage, so it is applied right after mount, as course-home.tsx does.
export function EntryPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const storedDone = useProgress((s) => s.done)
  const done = mounted ? storedDone : NOTHING_DONE
  const course = lessons()
  const finished = course.filter((l) => l.id in done).length

  return (
    <div data-testid="entry" {...stylex.props(styles.root)}>
      {/* SkatGo is modern Skat, not a course (the human, SKATGO-23): the hero says the game is always
          there, and its one call to action sits the learner down at a table. */}
      <section data-testid="entry-hero" {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.eyebrow)}>
          <Pill tone="brass">{m.entry_eyebrow()}</Pill>
        </div>
        <h1 {...stylex.props(typography.hero, styles.title)}>{m.entry_title()}</h1>
        <p {...stylex.props(typography.body, styles.lead)}>{m.entry_lead()}</p>
        <div {...stylex.props(styles.heroFoot)}>
          <Link to="/play" data-testid="entry-cta" {...linkLook('primary', 'lg')}>
            {m.entry_cta()}
          </Link>
          <div {...stylex.props(styles.points)}>
            <Pill tone="felt">{m.entry_point_ready()}</Pill>
            <Pill tone="felt">{m.entry_point_browser()}</Pill>
            <Pill tone="felt">{m.entry_point_languages()}</Pill>
          </div>
        </div>
      </section>

      <div {...stylex.props(styles.grid)}>
        <Link to="/course" data-testid="entry-card" data-section="course" {...stylex.props(styles.card, styles.open)}>
          <Face suit="♣" title={m.entry_course_title()} text={m.entry_course_desc({ count: course.length })}>
            <span {...linkLook('quiet', 'md')}>{finished === 0 ? m.entry_course_start() : m.entry_course_continue()}</span>
            <span {...stylex.props(typography.small, styles.aside)}>{m.home_done({ finished, total: course.length })}</span>
          </Face>
        </Link>

        <Link to="/play" data-testid="entry-card" data-section="play" {...stylex.props(styles.card, styles.open)}>
          <Face suit="♠" title={m.entry_play_title()} text={m.entry_play_desc()}>
            <span {...linkLook('quiet', 'md')}>{m.entry_play_cta()}</span>
          </Face>
        </Link>

        <div aria-disabled="true" data-testid="entry-card" data-section="duplicate" data-state="soon" {...stylex.props(styles.card, styles.soon)}>
          <Face suit="♥" soon title={m.entry_duplicate_title()} text={m.entry_duplicate_desc()}>
            <Pill tone="ink">{m.entry_soon()}</Pill>
          </Face>
        </div>

        <div aria-disabled="true" data-testid="entry-card" data-section="puzzles" data-state="soon" {...stylex.props(styles.card, styles.soon)}>
          <Face suit="♦" soon title={m.entry_puzzles_title()} text={m.entry_puzzles_desc()}>
            <Pill tone="ink">{m.entry_soon()}</Pill>
          </Face>
        </div>
      </div>
    </div>
  )
}

type Suit = '♣' | '♠' | '♥' | '♦'
const RED: Suit[] = ['♥', '♦']

/**
 * What every card shows: its suit pressed large into the felt behind everything, and in front a corner
 * index (the suit on a paper chip, as a playing card's corner has it), the title, one line, and the foot.
 */
function Face({ suit, soon, title, text, children }: { suit: Suit; soon?: boolean; title: string; text: string; children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(typography.watermark, styles.watermark, soon && styles.watermarkSoon)}>
        {suit}
      </span>
      <div {...stylex.props(styles.body)}>
        <div {...stylex.props(styles.head)}>
          <span aria-hidden="true" {...stylex.props(typography.markGlyph, styles.index, RED.includes(suit) && styles.indexRed)}>
            {suit}
          </span>
          <h2 {...stylex.props(typography.pageTitle, styles.cardTitle)}>{title}</h2>
        </div>
        <p {...stylex.props(typography.note, styles.text)}>{text}</p>
        <div {...stylex.props(styles.foot)}>{children}</div>
      </div>
    </>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    padding: { default: space.x28, [bp.phone]: space.x18 },
    borderRadius: radius.stage,
    backgroundColor: skat.felt,
    backgroundImage: texture.feltHero,
    color: skat.white,
  },
  eyebrow: { display: 'flex' },
  // Colour is stated, not inherited: the theme colours headings and paragraphs itself.
  title: { margin: 0, color: skat.white },
  lead: { margin: 0, color: skat.white, opacity: opacity.lead, maxWidth: size.column },
  heroFoot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x14, marginTop: space.x4 },
  points: { display: 'flex', flexWrap: 'wrap', gap: space.x6 },
  grid: { display: 'grid', gridTemplateColumns: { default: size.twoColumns, [bp.phone]: size.oneColumn }, gap: space.x16 },
  card: {
    position: 'relative',
    display: 'flex',
    minHeight: size.entryCard,
    overflow: 'hidden',
    borderRadius: radius.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: skat.feltDeep,
    backgroundColor: skat.felt,
    backgroundImage: texture.feltDrill,
    color: skat.white,
    textDecoration: 'none',
  },
  open: {
    borderColor: { default: skat.feltDeep, ':hover': skat.brass },
    boxShadow: { default: 'none', ':hover': shadow.lift },
    transform: { default: move.rest, ':hover': move.lift },
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: timing.tile,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffset,
  },
  // Not open yet: the deep felt, without the light.
  soon: { backgroundColor: skat.feltDeep, backgroundImage: 'none' },
  watermark: {
    position: 'absolute',
    right: size.watermarkInset,
    bottom: size.watermarkInset,
    color: skat.felt,
    textShadow: shadow.emboss,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  watermarkSoon: { color: skat.feltDeep, opacity: opacity.meta },
  body: { position: 'relative', display: 'flex', flexDirection: 'column', gap: space.x8, flexGrow: 1, padding: { default: space.x20, [bp.phone]: space.x16 } },
  head: { display: 'flex', alignItems: 'center', gap: space.x10 },
  index: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size.brandMark,
    height: size.brandMark,
    borderRadius: radius.card,
    backgroundColor: skat.paper,
    color: skat.ink,
    boxShadow: shadow.card,
    flexShrink: 0,
  },
  indexRed: { color: skat.red },
  cardTitle: { margin: 0, color: skat.white },
  text: { margin: 0, color: skat.white, opacity: opacity.lead },
  foot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x10, marginTop: 'auto', paddingTop: space.x8 },
  aside: { color: skat.white, opacity: opacity.meta },
})
