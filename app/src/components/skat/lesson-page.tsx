import { Link, useParams } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { lessonById, lessons } from '~/lib/skat/lessons/content'
import type { Lesson } from '~/lib/skat/lessons/types'
import { GUIDES, lessonBySlug } from '~/lib/skat/lessons/guide'
import { RULES } from '~/lib/skat/rules'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, LessonPlayer } from './client-part'
import { Teach } from './exercises'
import { LessonFrame, StepCard } from './lesson-frame'
import { Btn } from './ui'

/**
 * The page behind /course/$slug. Every lesson opens directly, whatever the learner has done before
 * (SKATGO-7). Rendered on the server around the player (SKATGO-29): the lesson's title and its one-line
 * promise, then at once the interactive lesson, which only the browser runs; the server renders its first
 * teaching card in the player's own frame, which is what a search engine reads (SKATGO-161 removed the
 * explanation that stood below the lesson, SKATGO-52). Then the ways on: the next lesson, the section of the
 * rules it teaches, and the course's list of lessons. The route has already sent an unknown or foreign slug
 * elsewhere.
 */
export function LessonPage() {
  const { slug } = useParams({ from: '/course/$slug' })
  const found = lessonBySlug(slug)
  const lesson = found ? lessonById(found.id) : undefined
  if (!lesson) return null
  const locale = getLocale()
  const guide = GUIDES[locale][lesson.id]
  const course = lessons()
  const following = course[course.findIndex((l) => l.id === lesson.id) + 1]
  const section = RULES[locale].sections.find((s) => s.id === guide.rule)
  return (
    <>
      <section data-testid="lesson-head" {...stylex.props(styles.intro)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{guide.h1}</h1>
        <p {...stylex.props(typography.panelLabel, styles.kicker)}>{m.lesson_kicker({ n: lesson.id, count: course.length, minutes: lesson.minutes })}</p>
        <p data-testid="lesson-promise" {...stylex.props(typography.appText, styles.promise)}>{lesson.promise}</p>
      </section>
      <ClientPart fallback={<FirstCard steps={lesson.steps} />}>
        <LessonPlayer key={lesson.id} lesson={lesson} />
      </ClientPart>
      <nav data-testid="lesson-links" {...stylex.props(styles.links)}>
        {following ? (
          <Link to="/course/$slug" params={{ slug: GUIDES[locale][following.id].slug }} data-testid="lesson-next" {...stylex.props(typography.appBtnStrong, styles.link)}>
            {m.lesson_next({ title: following.title })}
          </Link>
        ) : (
          // After the last lesson's game: the same game with friends (SKATGO-61).
          <Link to="/with-friends" data-testid="lesson-friends" {...stylex.props(typography.appBtnStrong, styles.link)}>
            {m.friends_link()}
          </Link>
        )}
        {section ? (
          <Link to="/rules" hash={section.anchor} data-testid="lesson-rules" {...stylex.props(typography.appBtnStrong, styles.link)}>
            {m.lesson_rules_link({ section: section.title })}
          </Link>
        ) : null}
        <Link to="/course" data-testid="lesson-all" {...stylex.props(typography.appBtnStrong, styles.link)}>
          {m.lesson_all()}
        </Link>
      </nav>
    </>
  )
}

/** The lesson's first screen as the player opens it — its first step, a teaching card — for the server. */
function FirstCard({ steps }: { steps: Lesson['steps'] }) {
  const first = steps[0]
  if (first.kind !== 'teach') return null
  return (
    <LessonFrame
      testId="skat-lesson-first"
      index={0}
      total={steps.length}
      kind={first.kind}
      foot={
        <>
          <Btn tone="quiet" shape="block" size="lg" disabled>{m.lesson_back()}</Btn>
          <Btn shape="block" size="lg" grow>{m.lesson_continue()}</Btn>
        </>
      }
    >
      <StepCard>
        <Teach step={first} />
      </StepCard>
    </LessonFrame>
  )
}

// One reading column, the lesson player's (lesson-frame.tsx).
const styles = stylex.create({
  intro: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  kicker: { margin: 0, color: color.slate },
  promise: { margin: 0, color: color.navy },
  // Two plain links, one per line: a lesson's title can be long, and a link wraps where a button cannot.
  links: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: space.x12,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: space.x32,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
