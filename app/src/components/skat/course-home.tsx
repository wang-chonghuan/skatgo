import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { ArrowRight, GraduationCap } from 'lucide-react'

import { Band } from './frame'
import { lessonIcon } from './lesson-icon'
import { Pill, Stars, linkLook } from './ui'
import { lessons } from '~/lib/skat/lessons/content'
import { type LessonRecord, type Tally, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, pose } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

const NOTHING_DONE: Record<string, LessonRecord> = {}
const NO_GAMES: Tally = { games: 0, won: 0, score: 0 }

/**
 * The course map: every lesson with its state, overall progress, and the way into free play. In the
 * lobby design (SKATGO-26) it is a sub-page: the course's orange band, the course's facts, the lesson
 * to continue as the featured card, and every lesson as an option card.
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
      <Band title={m.home_title()} Icon={GraduationCap} back="/" />
      <div {...stylex.props(styles.column)}>
        <section {...stylex.props(styles.intro)}>
          <p {...stylex.props(typography.appText, styles.lead)}>{m.home_lead({ count: course.length })}</p>
          <div {...stylex.props(styles.pills)}>
            <Pill tone="quiet">{m.home_pill_length({ count: course.length, minutes: totalMinutes })}</Pill>
            <Pill tone="quiet">{m.home_pill_age()}</Pill>
            <Pill tone="quiet">{m.home_pill_saved()}</Pill>
          </div>
        </section>

        {/* The featured card: where the learner is, the lesson to continue, and the table one tap away
            (SKATGO-8). */}
        <section data-testid="skat-progress" {...stylex.props(styles.featured)}>
          <div {...stylex.props(styles.featuredText)}>
            <h2 {...stylex.props(typography.optionTitle, styles.optionTitle)}>
              {current ? (finished === 0 ? m.home_start() : m.home_continue({ id: current.id })) : m.home_graduated()}
            </h2>
            <p {...stylex.props(typography.optionDesc, styles.optionDesc)}>
              {m.home_done({ finished, total: course.length })}
              {tally.games > 0 ? m.home_games({ games: tally.games, won: tally.won }) : ''}
            </p>
            <div {...stylex.props(styles.featuredActions)}>
              <Link to="/play" data-testid="skat-free-play" {...linkLook(current ? 'quiet' : 'go', 'md')}>
                {current ? m.free_play_button() : m.home_graduated()}
              </Link>
            </div>
          </div>
          {current ? (
            <Link to="/lesson/$id" params={{ id: current.id }} data-testid="skat-resume" aria-label={finished === 0 ? m.home_start() : m.home_continue({ id: current.id })} {...stylex.props(styles.arrowDisc)}>
              <ArrowRight size={icon.table} strokeWidth={icon.outline} />
            </Link>
          ) : null}
        </section>

        <ol {...stylex.props(styles.list)}>
          {course.map((l) => {
            // Every lesson opens directly (SKATGO-7). The one "continue" points at is ringed in green,
            // so the map still says where the learner is.
            const record = done[l.id]
            const state = record ? 'done' : l.id === current?.id ? 'next' : 'open'
            return (
              <li key={l.id} {...stylex.props(styles.item)}>
                <Link
                  to="/lesson/$id"
                  params={{ id: l.id }}
                  data-testid="skat-lesson-card"
                  data-lesson={l.id}
                  data-state={state}
                  {...stylex.props(styles.card, state === 'next' && styles.cardNext, state === 'done' && styles.cardDone)}
                >
                  <span {...stylex.props(styles.cardHead)}>
                    <LessonGlyph id={l.id} />
                    <span {...stylex.props(typography.optionTitle, styles.optionTitle)}>{m.lesson_heading({ id: l.id, title: l.title })}</span>
                  </span>
                  <span {...stylex.props(typography.optionDesc, styles.optionDesc)}>{l.promise}</span>
                  <span {...stylex.props(styles.cardEnd)}>
                    {record ? <Stars n={record.stars} /> : <span {...stylex.props(typography.meta, styles.minutes)}>{m.lesson_minutes({ n: l.minutes })}</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

/** A lesson's outline icon, in the option cards' orange. */
function LessonGlyph({ id }: { id: string }) {
  const Icon = lessonIcon(id)
  return (
    <span aria-hidden="true" {...stylex.props(styles.icon)}>
      <Icon size={icon.option} strokeWidth={icon.outline} />
    </span>
  )
}

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.pageColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x48, [bp.phone]: space.x24 },
    paddingBottom: space.x72,
    paddingInline: { default: space.x48, [bp.phone]: space.x12 },
  },
  intro: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  lead: { margin: 0, color: color.slate },
  pills: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  // The featured option card: full width, the deeper shadow, an arrow disc on the right.
  featured: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: space.x24,
    padding: space.x24,
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.optionFeatured,
  },
  featuredText: { display: 'flex', flexDirection: 'column', gap: space.x8, flexGrow: 1, minWidth: 0 },
  featuredActions: { display: 'flex', flexWrap: 'wrap', gap: space.x12, paddingTop: space.x8 },
  arrowDisc: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.arrowDisc,
    height: dims.arrowDisc,
    borderRadius: radii.round,
    backgroundColor: color.page,
    color: color.navy,
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform',
    transitionDuration: timing.tile,
    ...focus,
  },
  optionTitle: { margin: 0, color: color.navy },
  optionDesc: { margin: 0, color: color.slate },
  list: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.cards]: dims.oneColumn },
    // Every lesson card the same height, across rows as well as within one.
    gridAutoRows: dims.equalRows,
    gap: space.x16,
  },
  item: { margin: 0, display: 'flex' },
  // An option card: white, the option shadow, icon and title on one line, the description under it.
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    flexGrow: 1,
    padding: space.x24,
    borderRadius: radii.option,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.surface,
    boxShadow: elev.option,
    color: color.text,
    textDecoration: 'none',
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform, border-color',
    transitionDuration: timing.tile,
    ...focus,
  },
  cardNext: { borderColor: color.go },
  cardDone: { backgroundColor: color.goodSoft },
  cardHead: { display: 'flex', alignItems: 'center', gap: space.x12 },
  icon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.optionIcon,
    height: dims.optionIcon,
    flexShrink: 0,
    color: color.tileOrange,
  },
  cardEnd: { display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' },
  minutes: { color: color.slate, whiteSpace: 'nowrap' },
})
