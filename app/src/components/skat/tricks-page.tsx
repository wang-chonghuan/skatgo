import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronRight, ChevronUp, CircleCheck, CircleX, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EXERCISE_TEXT, EXERCISE_TYPES, exercisesOf } from '~/lib/skat/tricks/exercises'
import { LADDER_FREE } from '~/lib/skat/tricks/exercises/ladder'
import type { ExerciseType } from '~/lib/skat/tricks/exercises/types'
import { useLadder } from '~/lib/skat/tricks/ladder-progress'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, pose } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Pill } from './ui'

/**
 * The Skat-Tricks section's page (SKATGO-103, before it the first article of SKATGO-82): the twelve kinds
 * of exercise as option cards, each opening to its three exercises, and under them the way to the article.
 * Each card is a native <details>: closed, its exercises are still in the page a search engine reads (the
 * human: 「题目页要收录……很好的引流材料」). A card named in the address (#druecken, from a trick of the
 * article) opens by itself.
 *
 * The first card is the "Sieg sichern" ladder (SKATGO-108, SKATGO-109), featured: 29 steps in rising order,
 * the ones answered right checked, the ones answered wrong and not yet right crossed, each step's wrong answers
 * counted under its number, and the next one marked; for a guest, the steps that need an account carry a lock.
 * The record is the account's, or for a guest this browser's (ladder-progress.ts), applied after mount. The
 * other kinds remember nothing.
 */
export function TricksPage() {
  const text = EXERCISE_TEXT[getLocale()]
  const [open, setOpen] = useState<ReadonlySet<ExerciseType>>(() => new Set())
  const { steps, account } = useLadder()
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if ((EXERCISE_TYPES as readonly string[]).includes(hash)) setOpen(new Set([hash as ExerciseType]))
  }, [])
  const toggle = (type: ExerciseType, isOpen: boolean) =>
    setOpen((s) => {
      if (s.has(type) === isOpen) return s
      const next = new Set(s)
      if (isOpen) next.add(type)
      else next.delete(type)
      return next
    })
  return (
    <div data-testid="tricks" {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>
        <header {...stylex.props(styles.intro)}>
          <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.tricks_hub_h1()}</h1>
          <p {...stylex.props(typography.landingBody, styles.lead)}>{m.tricks_hub_lead()}</p>
        </header>
        <ol {...stylex.props(styles.list)}>
          {EXERCISE_TYPES.map((type, i) => {
            const isOpen = open.has(type)
            const exercises = exercisesOf(type)
            const ladder = type === 'sieg-sichern'
            const nextUp = ladder ? exercises.find((e) => !steps[e.id]?.solved)?.id : undefined
            const Chevron = isOpen ? ChevronUp : ChevronDown
            return (
              <li key={type} id={type} {...stylex.props(styles.item)}>
                <details
                  open={isOpen}
                  onToggle={(e) => toggle(type, e.currentTarget.open)}
                  data-testid="tricks-type"
                  data-type={type}
                  {...stylex.props(styles.card, isOpen && styles.cardOpen, ladder && styles.cardFeatured)}
                >
                  <summary data-testid="tricks-type-head" {...stylex.props(styles.summary)}>
                    <span aria-hidden="true" {...stylex.props(typography.smallBold, styles.number)}>{i + 1}</span>
                    <span {...stylex.props(styles.heading)}>
                      <span {...stylex.props(typography.optionTitle, styles.optionTitle)}>{text.types[type].title}</span>
                      <span {...stylex.props(typography.optionDesc, styles.optionDesc)}>{text.types[type].blurb}</span>
                    </span>
                    <span data-testid={ladder ? 'tricks-ladder-progress' : undefined} {...stylex.props(typography.meta, styles.count, ladder && styles.countShown)}>
                      {ladder ? m.tricks_ladder_progress({ n: exercises.filter((e) => steps[e.id]?.solved).length, count: exercises.length }) : m.tricks_hub_count({ n: exercises.length })}
                    </span>
                    <span {...stylex.props(styles.chevron)}>
                      <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
                    </span>
                  </summary>
                  <ol {...stylex.props(styles.tasks)}>
                    {exercises.map((e, k) => {
                      const record = ladder ? steps[e.id] : undefined
                      const misses = record?.misses ?? 0
                      const mark = record?.solved ? 'solved' : misses ? 'missed' : ladder && account === null && k >= LADDER_FREE ? 'locked' : undefined
                      return (
                        <li key={e.id} {...stylex.props(styles.task)}>
                          <Link
                            to="/skat-tricks/$exercise"
                            params={{ exercise: e.id }}
                            data-testid="tricks-exercise-link"
                            data-mark={mark}
                            data-misses={ladder ? misses : undefined}
                            {...stylex.props(styles.taskLink)}
                          >
                            <span {...stylex.props(styles.taskText)}>
                              <span {...stylex.props(typography.meta, styles.taskNumber)}>
                                {/* The wrong answers stay counted, also once the step is solved (the human: 「要记下来哪题错了」). */}
                                {misses ? `${m.tricks_hub_task({ n: k + 1 })} · ${m.tricks_ladder_misses({ n: misses })}` : m.tricks_hub_task({ n: k + 1 })}
                              </span>
                              <span {...stylex.props(typography.appBtnStrong, styles.taskTitle)}>{text.exercises[e.id].title}</span>
                            </span>
                            {mark === 'solved' ? (
                              <span data-testid="tricks-ladder-solved" aria-label={m.tricks_ladder_solved()} {...stylex.props(styles.mark, styles.solved)}>
                                <CircleCheck aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
                              </span>
                            ) : mark === 'missed' ? (
                              <span data-testid="tricks-ladder-missed" aria-label={m.tricks_ladder_missed()} {...stylex.props(styles.mark, styles.missed)}>
                                <CircleX aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
                              </span>
                            ) : mark === 'locked' ? (
                              <span data-testid="tricks-ladder-locked" aria-label={m.tricks_ladder_locked()} {...stylex.props(styles.mark, styles.locked)}>
                                <Lock aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
                              </span>
                            ) : null}
                            {e.id === nextUp ? <Pill tone="go">{m.tricks_ladder_next()}</Pill> : null}
                            <ChevronRight aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.taskArrow)} />
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                </details>
              </li>
            )
          })}
        </ol>
        {/* The article that was this page before (SKATGO-82), now at its own address, and the rules to look a
            point up in: small links under the cards. */}
        <nav {...stylex.props(styles.links)}>
          <Link to="/skat-tricks/12-tricks" data-testid="tricks-article-link" {...stylex.props(typography.appLink, styles.articleLink)}>
            {m.tricks_article_link()}
          </Link>
          <Link to="/rules" data-testid="tricks-rules-link" {...stylex.props(typography.appLink, styles.articleLink)}>
            {m.tricks_rules_link()}
          </Link>
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

// The course's page column and option cards (course-home.tsx), one card to a row.
const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x48, [bp.phone]: space.x24 },
    paddingBottom: space.x72,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  intro: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.slate },
  list: { listStyleType: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: space.x12 },
  item: { margin: 0 },
  card: {
    borderRadius: radii.option,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.surface,
    boxShadow: elev.option,
    overflow: 'hidden',
  },
  cardOpen: { borderColor: color.go },
  // The ladder (SKATGO-108): the featured card's deeper shadow, ringed in the action green.
  cardFeatured: { borderColor: color.go, boxShadow: elev.optionFeatured },
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x16,
    padding: { default: space.x20, [bp.phone]: space.x16 },
    cursor: 'pointer',
    listStyleType: 'none',
    color: color.navy,
    '::-webkit-details-marker': { display: 'none' },
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    ...focus,
  },
  number: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.control,
    height: dims.control,
    borderRadius: radii.round,
    backgroundColor: color.page,
    color: color.navy,
  },
  heading: { display: 'flex', flexDirection: 'column', gap: space.x4, flexGrow: 1, minWidth: 0 },
  optionTitle: { margin: 0, color: color.navy },
  optionDesc: { margin: 0, color: color.slate },
  count: { flexShrink: 0, color: color.slate, whiteSpace: 'nowrap', display: { default: 'block', [bp.phone]: 'none' } },
  chevron: { display: 'flex', flexShrink: 0, color: color.slate },
  // The ladder's progress shows on a phone too.
  countShown: { display: 'block' },
  mark: { display: 'flex', flexShrink: 0 },
  solved: { color: color.good },
  missed: { color: color.bad },
  locked: { color: color.slate },
  tasks: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  task: {
    margin: 0,
    borderBottomWidth: { default: border.hair, ':last-child': 0 },
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  taskLink: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x12,
    paddingBlock: space.x16,
    paddingInline: { default: space.x20, [bp.phone]: space.x16 },
    color: color.navy,
    textDecoration: 'none',
    backgroundColor: { default: color.surface, ':hover': color.page },
    ...focus,
  },
  taskText: { display: 'flex', flexDirection: 'column', gap: space.x2, flexGrow: 1, minWidth: 0 },
  taskNumber: { color: color.slate },
  taskTitle: { color: color.navy },
  taskArrow: { flexShrink: 0, color: color.go },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  articleLink: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    ...focus,
  },
})
