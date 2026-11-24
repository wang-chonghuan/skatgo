import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { useEffect, useState } from 'react'

import { Stars } from './ui'
import { ADVANCED_GUIDES, advancedLessons } from '~/lib/skat/lessons/advanced'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
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

/**
 * The advanced course's page, /advanced-course (SKATGO-234, the human: 「新增一个进阶课程，或者高级课程之类的，用来放之前就规划的那个
 * 书上的专题等」): its title, one line on whom it is for, and its lessons as the course's option cards — each its topic, its
 * promise, and its stars once done. Rendered on the server for search engines; the stars, which are this browser's,
 * after mount, as the course's are.
 */
export function AdvancedCoursePage() {
  const storedDone = useProgress((s) => s.done)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const done = mounted ? storedDone : NOTHING_DONE
  const guides = ADVANCED_GUIDES[getLocale()]
  return (
    <div data-testid="advanced-course" {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.advanced_title()}</h1>
        <p {...stylex.props(typography.appText, styles.lead)}>{m.advanced_lead()}</p>
        <p {...stylex.props(typography.appText, styles.text)}>{m.advanced_intro()}</p>
        <ol {...stylex.props(styles.list)}>
          {advancedLessons().map((l) => {
            const record = done[l.id]
            return (
              <li key={l.id} {...stylex.props(styles.item)}>
                <Link
                  to="/advanced-course/$slug"
                  params={{ slug: guides[l.id].slug }}
                  data-testid="advanced-lesson-card"
                  data-lesson={l.id}
                  data-state={record ? 'done' : 'open'}
                  {...stylex.props(styles.card, record && styles.cardDone)}
                >
                  <span {...stylex.props(typography.optionTitle, styles.optionTitle)}>{l.title}</span>
                  <span {...stylex.props(typography.optionDesc, styles.optionDesc)}>{l.promise}</span>
                  <span {...stylex.props(styles.cardEnd)}>
                    {record ? <Stars n={record.stars} /> : <span {...stylex.props(typography.meta, styles.minutes)}>{m.lesson_minutes({ n: l.minutes })}</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
        {/* The ways on: the course for who does not know the rules yet, the Skat Tricks to practise. */}
        <nav {...stylex.props(styles.links)}>
          <Link to="/course" data-testid="advanced-to-course" {...stylex.props(typography.appLink, styles.link)}>{m.advanced_to_course()}</Link>
          <Link to="/skat-tricks" data-testid="advanced-to-tricks" {...stylex.props(typography.appLink, styles.link)}>{m.advanced_to_tricks()}</Link>
        </nav>
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

// The course page's column and option cards (course-home.tsx).
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
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
    paddingInline: { default: space.x48, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.slate },
  text: { margin: 0, color: color.text },
  links: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x12 },
  link: { color: color.info },
  optionTitle: { margin: 0, color: color.navy },
  optionDesc: { margin: 0, color: color.slate },
  list: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.cards]: dims.oneColumn },
    gridAutoRows: dims.equalRows,
    gap: space.x16,
  },
  item: { margin: 0, display: 'flex' },
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
  cardDone: { backgroundColor: color.goodSoft },
  cardEnd: { display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' },
  minutes: { color: color.slate, whiteSpace: 'nowrap' },
})
