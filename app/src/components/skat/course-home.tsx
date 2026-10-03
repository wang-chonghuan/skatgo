import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { Pill, Stars, linkLook } from './ui'
import { track } from '~/lib/analytics'
import { lessons } from '~/lib/skat/lessons/content'
import { GUIDES } from '~/lib/skat/lessons/guide'
import { type LessonRecord, type Tally, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { timing } from '../../theme/effects.stylex'
import { elev, pose } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

const NOTHING_DONE: Record<string, LessonRecord> = {}
const NO_GAMES: Tally = { games: 0, won: 0, score: 0 }

/**
 * The course page: what the course is, the way to start or continue, every lesson with its state, and
 * once it is all done, the way to the table. In the lobby design (SKATGO-26) it is a sub-page under the
 * front page's header (SKATGO-43): the course's title, the course's facts, the progress as the featured card, and every lesson as an
 * option card. Its title, lead and buttons are the landing copy of SKATGO-29.
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
  const guides = GUIDES[getLocale()]

  return (
    <div data-testid="skat-home" {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.course_title()}</h1>
        <section {...stylex.props(styles.intro)}>
          <p {...stylex.props(typography.appText, styles.lead)}>{m.course_lead({ count: course.length })}</p>
          <div {...stylex.props(styles.pills)}>
            <Pill tone="quiet">{m.home_pill_length({ count: course.length, minutes: totalMinutes })}</Pill>
            <Pill tone="quiet">{m.home_pill_age()}</Pill>
            <Pill tone="quiet">{m.home_pill_saved()}</Pill>
          </div>
        </section>

        {/* The featured card: where the learner is and the one way on — the lesson to take next, or, once
            the course is done, the table (SKATGO-8, SKATGO-29). */}
        <section data-testid="skat-progress" {...stylex.props(styles.featured)}>
          <div {...stylex.props(styles.featuredText)}>
            <h2 {...stylex.props(typography.optionTitle, styles.optionTitle)}>
              {current ? m.home_done({ finished, total: course.length }) : m.course_ready_title()}
            </h2>
            {current && tally.games === 0 ? null : (
              <p {...stylex.props(typography.optionDesc, styles.optionDesc)}>{current ? m.home_games({ games: tally.games, won: tally.won }) : m.entry_game_text()}</p>
            )}
            <div {...stylex.props(styles.featuredActions)}>
              {current ? (
                <>
                  <Link to="/course/$slug" params={{ slug: guides[current.id].slug }} data-testid="skat-resume" {...linkLook('go', 'md')}>
                    {finished === 0 ? m.course_start() : m.course_continue({ n: current.id })}
                  </Link>
                  <Link to="/play" data-testid="skat-free-play" {...linkLook('quiet', 'md')}>
                    {m.entry_game_cta()}
                  </Link>
                </>
              ) : (
                <Link to="/play" data-testid="skat-free-play" onClick={() => track('course_complete_cta_click')} {...linkLook('go', 'md')}>
                  {m.entry_game_cta()}
                </Link>
              )}
            </div>
          </div>
        </section>

        <h2 {...stylex.props(typography.optionTitle, styles.listTitle)}>{m.course_list_title()}</h2>
        <ol {...stylex.props(styles.list)}>
          {course.map((l) => {
            // Every lesson opens directly (SKATGO-7). The one "continue" points at is ringed in green,
            // so the map still says where the learner is.
            const record = done[l.id]
            const state = record ? 'done' : l.id === current?.id ? 'next' : 'open'
            return (
              <li key={l.id} {...stylex.props(styles.item)}>
                <Link
                  to="/course/$slug"
                  params={{ slug: guides[l.id].slug }}
                  data-testid="skat-lesson-card"
                  data-lesson={l.id}
                  data-state={state}
                  {...stylex.props(styles.card, state === 'next' && styles.cardNext, state === 'done' && styles.cardDone)}
                >
                  <span {...stylex.props(typography.optionTitle, styles.optionTitle)}>{m.lesson_heading({ id: l.id, title: l.title })}</span>
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
  title: { margin: 0, color: color.navy },
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
  listTitle: { margin: 0, color: color.navy },

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
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    ...focus,
  },
  cardNext: { borderColor: color.go },
  cardDone: { backgroundColor: color.goodSoft },
  cardEnd: { display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' },
  minutes: { color: color.slate, whiteSpace: 'nowrap' },
})
