import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { Pill, Stars, linkLook } from './ui'
import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, type Tally, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'

const NOTHING_DONE: Record<string, LessonRecord> = {}
const NO_GAMES: Tally = { games: 0, won: 0, score: 0 }

/**
 * The course map: every lesson with its state, overall progress, and the way into free play.
 *
 * The one page of the course rendered on the server (SKATGO-1, for search engines): its lessons,
 * titles and promises are the same for every visitor. The learner's progress lives in localStorage,
 * so the server renders the map of someone who has done nothing, the browser's first render matches
 * it, and the progress is applied right after mount.
 */
export function CourseHome() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const storedDone = useProgress((s) => s.done)
  const storedTally = useProgress((s) => s.tally)
  const done = mounted ? storedDone : NOTHING_DONE
  const tally = mounted ? storedTally : NO_GAMES
  const course = lessons()
  const finished = course.filter((l) => l.id in done).length
  const current = course.find((l) => !(l.id in done))
  const totalMinutes = course.reduce((n, l) => n + l.minutes, 0)

  return (
    <div data-testid="skat-home" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.heroText)}>
          <h1 {...stylex.props(styles.h1)}>{m.home_title()}</h1>
          <p {...stylex.props(styles.lead)}>{m.home_lead({ count: course.length })}</p>
          <div {...stylex.props(styles.heroMeta)}>
            <Pill tone="felt">{m.home_pill_length({ count: course.length, minutes: totalMinutes })}</Pill>
            <Pill tone="felt">{m.home_pill_age()}</Pill>
            <Pill tone="felt">{m.home_pill_saved()}</Pill>
          </div>
        </div>
        {/* The table sits where the progress bar was (SKATGO-8): the way to play is always one tap
            away; the note keeps the count of lessons and games, and "continue" keeps its place. */}
        <div {...stylex.props(styles.progress)}>
          <Link to="/play" data-testid="skat-free-play" {...linkLook(current ? 'felt' : 'primary', 'lg')}>
            {current ? m.free_play_button() : m.home_graduated()}
          </Link>
          <span {...stylex.props(styles.progressNote)}>
            {m.home_done({ finished, total: course.length })}
            {tally.games > 0 ? m.home_games({ games: tally.games, won: tally.won }) : ''}
          </span>
          {current ? (
            <Link to="/lesson/$id" params={{ id: current.id }} data-testid="skat-resume" {...linkLook('primary', 'lg')}>
              {finished === 0 ? m.home_start() : m.home_continue({ id: current.id })}
            </Link>
          ) : null}
        </div>
      </section>

      <ol {...stylex.props(styles.list)}>
        {course.map((l) => {
          // Every lesson opens directly (SKATGO-7). The one "continue" points at keeps the brass outline,
          // so the map still says where the learner is.
          const record = done[l.id]
          const state = record ? 'done' : l.id === current?.id ? 'next' : 'open'
          const inner = (
            <>
              <span {...stylex.props(styles.emoji)}>{l.emoji}</span>
              <span {...stylex.props(styles.lessonText)}>
                <span {...stylex.props(styles.lessonTitle)}>{m.lesson_heading({ id: l.id, title: l.title })}</span>
                <span {...stylex.props(styles.lessonPromise)}>{l.promise}</span>
              </span>
              <span {...stylex.props(styles.lessonEnd)}>
                {record ? <Stars n={record.stars} /> : <span {...stylex.props(styles.minutes)}>{m.lesson_minutes({ n: l.minutes })}</span>}
              </span>
            </>
          )
          return (
            <li key={l.id} {...stylex.props(styles.item)}>
              <Link
                to="/lesson/$id"
                params={{ id: l.id }}
                data-testid="skat-lesson-card"
                data-lesson={l.id}
                data-state={state}
                {...stylex.props(styles.card, state === 'done' && styles.cardDone, state === 'next' && styles.cardNext, state === 'open' && styles.cardOpen)}
              >
                {inner}
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: 24 },
  hero: {
    display: 'grid',
    gridTemplateColumns: { default: '1.3fr 1fr', '@media (max-width: 720px)': '1fr' },
    gap: 20,
    padding: { default: 28, '@media (max-width: 480px)': 18 },
    borderRadius: 24,
    backgroundColor: skat.felt,
    backgroundImage: `radial-gradient(ellipse at 20% 0%, ${skat.feltLight} 0%, ${skat.felt} 50%, ${skat.feltDeep} 100%)`,
    color: skat.white,
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: 12 },
  h1: { margin: 0, fontSize: { default: 36, '@media (max-width: 480px)': 28 }, lineHeight: 1.2, fontWeight: 800, color: skat.white, fontFamily: '"Fraunces", "Songti SC", "Noto Serif SC", serif' },
  // Colour is stated, not inherited: the app's reset gives headings and paragraphs the theme's text
  // colour, which on this felt is dark on dark.
  lead: { margin: 0, fontSize: 16, lineHeight: 1.75, color: skat.white, opacity: 0.95 },
  heroMeta: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  progress: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: skat.paper,
    color: skat.ink,
    alignSelf: 'start',
  },
  progressNote: { fontSize: 13, color: skat.inkSoft },
  list: { listStyleType: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  item: { margin: 0 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: { default: 16, '@media (max-width: 480px)': 12 },
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    textDecoration: 'none',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: '140ms',
  },
  cardNext: {
    borderColor: { default: skat.brass, ':hover': skat.brassDeep },
    boxShadow: { default: `0 3px 0 ${skat.brass}`, ':hover': `0 6px 14px ${skat.shadowSoft}` },
    transform: { default: 'translateY(0)', ':hover': 'translateY(-2px)' },
  },
  cardOpen: {
    borderColor: { default: skat.paperEdge, ':hover': skat.brass },
    boxShadow: { default: 'none', ':hover': `0 6px 14px ${skat.shadowSoft}` },
    transform: { default: 'translateY(0)', ':hover': 'translateY(-2px)' },
  },
  cardDone: { borderColor: { default: skat.good, ':hover': skat.good }, backgroundColor: skat.goodSoft },
  emoji: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: skat.brassSoft,
    fontSize: 28,
    flexShrink: 0,
  },
  lessonText: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 },
  lessonTitle: { fontSize: 17, fontWeight: 800 },
  lessonPromise: { fontSize: 14, lineHeight: 1.5, color: skat.inkSoft },
  lessonEnd: { flexShrink: 0 },
  minutes: { fontSize: 13, fontWeight: 600, color: skat.inkFaint, whiteSpace: 'nowrap' },
})
