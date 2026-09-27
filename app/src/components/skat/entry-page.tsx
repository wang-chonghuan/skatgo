import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import type { Card } from '~/lib/skat/cards'
import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { move, shadow, texture, timing } from '../../theme/effects.stylex'
import { border, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'
import { PlayingCard } from './playing-card'
import { Pill, linkLook } from './ui'

const NOTHING_DONE: Record<string, LessonRecord> = {}

// The front page (SKATGO-23): four ways into Skat. Course and Play open what already exists; Duplicate
// and Puzzles are announced but not open, so they are not links and cannot be focused or clicked.
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
      <header {...stylex.props(styles.intro)}>
        <h1 {...stylex.props(typography.hero, styles.title)}>{m.entry_title()}</h1>
        <p {...stylex.props(typography.body, styles.lead)}>{m.entry_lead()}</p>
      </header>

      <div {...stylex.props(styles.grid)}>
        <Link to="/course" data-testid="entry-card" data-section="course" {...stylex.props(styles.card, styles.open)}>
          <Art>
            <Fan cards={JACKS} />
          </Art>
          <Body title={m.entry_course_title()} text={m.entry_course_desc({ count: course.length })}>
            <span {...linkLook('primary', 'md')}>{finished === 0 ? m.entry_course_start() : m.entry_course_continue()}</span>
            <span {...stylex.props(typography.small, styles.aside)}>{m.home_done({ finished, total: course.length })}</span>
          </Body>
        </Link>

        <Link to="/play" data-testid="entry-card" data-section="play" {...stylex.props(styles.card, styles.open)}>
          <Art>
            <div {...stylex.props(styles.trick)}>
              <PlayingCard card={ACE} faceDown size="sm" />
              <div {...stylex.props(styles.led)}>
                <PlayingCard card={ACE} size="sm" />
              </div>
              <PlayingCard card={ACE} faceDown size="sm" />
            </div>
          </Art>
          <Body title={m.entry_play_title()} text={m.entry_play_desc()}>
            <span {...linkLook('felt', 'md')}>{m.entry_play_cta()}</span>
          </Body>
        </Link>

        <Soon section="duplicate" title={m.entry_duplicate_title()} text={m.entry_duplicate_desc()}>
          <div {...stylex.props(styles.pair)}>
            <Fan cards={DEAL} />
            <Fan cards={DEAL} />
          </div>
        </Soon>

        <Soon section="puzzles" title={m.entry_puzzles_title()} text={m.entry_puzzles_desc()}>
          <div {...stylex.props(styles.puzzle)}>
            <PlayingCard card={ACE} faceDown size="sm" />
            <span {...stylex.props(typography.badge, styles.question)}>?</span>
          </div>
        </Soon>
      </div>
    </div>
  )
}

// The art is made of the course's own cards: the four Jacks are the first thing the course teaches as
// trumps; a trick shows a table; the same deal twice is Duplicate; an unseen card with a question is a
// puzzle.
const JACKS: Card[] = [
  { suit: 'C', rank: 'J' },
  { suit: 'S', rank: 'J' },
  { suit: 'H', rank: 'J' },
]
const DEAL: Card[] = [
  { suit: 'C', rank: 'A' },
  { suit: 'S', rank: '10' },
  { suit: 'H', rank: 'K' },
]
const ACE: Card = { suit: 'H', rank: 'A' }

/** The felt band at the top of a card. */
function Art({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return (
    <div aria-hidden="true" {...stylex.props(styles.art)}>
      <div {...stylex.props(styles.artInner, dim && styles.dimmed)}>{children}</div>
    </div>
  )
}

/** Three cards held as a small fan: the outer two tilt away. */
function Fan({ cards }: { cards: Card[] }) {
  return (
    <div {...stylex.props(styles.fan)}>
      {cards.map((c, i) => (
        <div key={i} {...stylex.props(styles.fanCard, i === 0 && styles.tiltLeft, i > 0 && styles.overlap, i === cards.length - 1 && styles.tiltRight)}>
          <PlayingCard card={c} size="sm" />
        </div>
      ))}
    </div>
  )
}

function Body({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.body)}>
      <h2 {...stylex.props(typography.pageTitle, styles.cardTitle)}>{title}</h2>
      <p {...stylex.props(typography.note, styles.text)}>{text}</p>
      <div {...stylex.props(styles.foot)}>{children}</div>
    </div>
  )
}

/** A section that is announced but not open: no link, no focus, nothing to click. */
function Soon({ section, title, text, children }: { section: string; title: string; text: string; children: ReactNode }) {
  return (
    <div aria-disabled="true" data-testid="entry-card" data-section={section} data-state="soon" {...stylex.props(styles.card)}>
      <Art dim>{children}</Art>
      <Body title={title} text={text}>
        <Pill tone="ink">{m.entry_soon()}</Pill>
      </Body>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  intro: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  title: { margin: 0, color: skat.ink },
  lead: { margin: 0, color: skat.inkSoft },
  grid: { display: 'grid', gridTemplateColumns: { default: size.twoColumns, [bp.phone]: size.oneColumn }, gap: space.x16 },
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: radius.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    textDecoration: 'none',
  },
  open: {
    borderColor: { default: skat.paperEdge, ':hover': skat.brass },
    boxShadow: { default: 'none', ':hover': shadow.lift },
    transform: { default: move.rest, ':hover': move.lift },
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: timing.tile,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: skat.brass,
    outlineOffset: border.focusOffset,
  },
  art: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: size.entryArt,
    backgroundColor: skat.felt,
    backgroundImage: texture.feltDrill,
    flexShrink: 0,
  },
  artInner: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dimmed: { filter: texture.dimmed },
  fan: { display: 'flex', alignItems: 'center' },
  fanCard: { flexShrink: 0 },
  overlap: { marginLeft: size.entryFanOverlap },
  tiltLeft: { transform: move.tiltLeft },
  tiltRight: { transform: move.tiltRight },
  trick: { display: 'flex', alignItems: 'center', gap: space.x8 },
  led: { transform: move.lift },
  pair: { display: 'flex', alignItems: 'center', gap: space.x24 },
  puzzle: { position: 'relative' },
  question: {
    position: 'absolute',
    top: size.badgeOffsetTop,
    right: size.badgeOffsetLeft,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: size.badge,
    height: size.badge,
    borderRadius: radius.round,
    backgroundColor: skat.brass,
    color: skat.ink,
    boxShadow: shadow.badge,
  },
  body: { display: 'flex', flexDirection: 'column', gap: space.x6, flexGrow: 1, padding: { default: space.x16, [bp.phone]: space.x14 } },
  cardTitle: { margin: 0, color: skat.ink },
  text: { margin: 0, color: skat.inkSoft },
  foot: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x10, marginTop: 'auto', paddingTop: space.x8 },
  aside: { color: skat.inkSoft },
})
