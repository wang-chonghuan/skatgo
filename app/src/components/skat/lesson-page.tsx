import { Link, useParams } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { lessonById, lessons } from '~/lib/skat/lessons/content'
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
import { Rich } from './ui'

/**
 * The page behind /course/$slug. Every lesson opens directly, whatever the learner has done before
 * (SKATGO-7). Rendered on the server around the player (SKATGO-29): the lesson's question as its title,
 * a short explanation of the idea — what a search engine and a first-time visitor read — then the
 * interactive lesson, which only the browser renders, and the ways on: the next lesson, the section
 * of the rules it teaches, and the course's list of lessons. The route has already sent an unknown or foreign slug elsewhere.
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
      <section data-testid="lesson-intro" {...stylex.props(styles.intro)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{guide.h1}</h1>
        <p {...stylex.props(typography.panelLabel, styles.kicker)}>{m.lesson_kicker({ n: lesson.id, count: course.length, minutes: lesson.minutes })}</p>
        {guide.intro.map((text) => (
          <p key={text} {...stylex.props(typography.appText, styles.text)}>
            <Rich text={text} />
          </p>
        ))}
      </section>
      <ClientPart>
        <LessonPlayer key={lesson.id} lesson={lesson} />
      </ClientPart>
      <nav data-testid="lesson-links" {...stylex.props(styles.links)}>
        {following ? (
          <Link to="/course/$slug" params={{ slug: GUIDES[locale][following.id].slug }} data-testid="lesson-next" {...stylex.props(typography.appBtnStrong, styles.link)}>
            {m.lesson_next({ title: following.title })}
          </Link>
        ) : null}
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

// One reading column, the lesson player's (lesson-player.tsx).
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
  text: { margin: 0, color: color.text },
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
