import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { track } from '~/lib/analytics'
import { lessons } from '~/lib/skat/lessons/content'
import { GUIDES } from '~/lib/skat/lessons/guide'
import type { Lesson, Step } from '~/lib/skat/lessons/types'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { confettiBurst, stepSlide } from '../../theme/constants'
import { move } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Bid, Choice, Deal, Order, Pick, Play, Sum, Teach } from './exercises'
import { LessonFrame, StepCard } from './lesson-frame'
import { ServerTable } from './server-table'
import { Btn, Panel, Rich, Stars, linkLook } from './ui'

type Concrete = Exclude<Step, { kind: 'generated' }>

/**
 * Plays one lesson, step by step. Generated drills are materialised here, once, after mount: they
 * use Math.random, and doing it during render would hand the server and the browser two different
 * questions.
 *
 * In the lobby design (SKATGO-26) the lesson sits under its title and promise (lesson-page.tsx), in its frame
 * (lesson-frame.tsx). The lesson's last exercise is its final challenge (SKATGO-161), named over it.
 */
export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const steps = useMemo<Concrete[]>(() => lesson.steps.map((s) => (s.kind === 'generated' ? s.make() : s)), [lesson])
  const [index, setIndex] = useState(0)
  // Every step solved so far, not just the current one: a learner may step back to look again, and a
  // step already solved must stay passable — and show its answer — when they come forward over it.
  const [solvedSteps, setSolvedSteps] = useState<ReadonlySet<number>>(() => new Set())
  const [mistakes, setMistakes] = useState(0)
  const [record, setRecord] = useState<LessonRecord | null>(null)
  const complete = useProgress((s) => s.complete)
  const recordGame = useProgress((s) => s.recordGame)

  const step = steps[index]
  const isLast = index === steps.length - 1
  const solved = solvedSteps.has(index)
  const canContinue = step.kind === 'teach' || solved

  const onSolved = useCallback(() => setSolvedSteps((s) => new Set(s).add(index)), [index])
  const onMistake = useCallback(() => setMistakes((m) => m + 1), [])

  // Events (SKATGO-29, SKATGO-74): a lesson started, and a lesson finished, by its number.
  useEffect(() => track('lesson_started', { lesson: Number(lesson.id) }), [lesson.id])

  function advance() {
    if (!canContinue) return
    if (isLast) {
      setRecord(complete(lesson.id, mistakes))
      track('lesson_completed', { lesson: Number(lesson.id) })
      return
    }
    setIndex(index + 1)
  }

  function back() {
    if (index > 0) setIndex(index - 1)
  }

  useEffect(() => {
    if (!record) return
    void confetti(confettiBurst.lesson)
  }, [record])

  if (record) return <Finished lesson={lesson} record={record} />

  const challenge = isLast && step.kind !== 'teach' && step.kind !== 'game' ? m.lesson_challenge() : undefined

  return (
    <LessonFrame
      testId="skat-lesson"
      index={index}
      total={steps.length}
      kind={step.kind}
      foot={
        <>
          <Btn testId="skat-back" tone="quiet" shape="block" size="lg" disabled={index === 0} onClick={back}>
            {m.lesson_back()}
          </Btn>
          <Btn testId="skat-continue" shape="block" size="lg" grow disabled={!canContinue} onClick={advance}>
            {isLast ? (step.kind === 'game' ? m.lesson_graduate() : m.lesson_finish()) : m.lesson_continue()}
          </Btn>
        </>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: stepSlide.offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -stepSlide.offset }}
          transition={{ duration: stepSlide.duration }}
          {...stylex.props(styles.body)}
        >
          <StepCard kicker={challenge}>
          {step.kind === 'teach' ? <Teach step={step} /> : null}
          {step.kind === 'choice' ? <Choice step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'pick' ? <Pick step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'order' ? <Order step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'play' ? <Play step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'sum' ? <Sum step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'deal' ? <Deal step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'bid' ? <Bid step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'game' ? (
            <div {...stylex.props(styles.gameStep)}>
              <h2 {...stylex.props(typography.dialogTitle, styles.gameTitle)}>{step.title}</h2>
              {step.body.map((p, i) => <p key={i} {...stylex.props(typography.bodySmall, styles.gamePara)}><Rich text={p} /></p>)}
              <ServerTable
                mode="lesson"
                onSettled={({ humanWon, humanScore }) => {
                  recordGame(humanWon, humanScore)
                  onSolved()
                }}
              />
              {solved ? <Panel tone="good"><p {...stylex.props(typography.bodySmall, styles.gamePara)}>{m.lesson_game_done()}</p></Panel> : null}
            </div>
          ) : null}
          </StepCard>
        </motion.div>
      </AnimatePresence>
    </LessonFrame>
  )
}

function Finished({ lesson, record }: { lesson: Lesson; record: LessonRecord }) {
  const course = lessons()
  const i = course.findIndex((l) => l.id === lesson.id)
  const following = course[i + 1]
  return (
    <div data-testid="skat-lesson-done" {...stylex.props(styles.done)}>
      <h2 {...stylex.props(typography.optionTitle, styles.doneTitle)}>{following ? m.done_title({ id: lesson.id }) : m.course_ready_title()}</h2>
      <div {...stylex.props(styles.doneStars)}><Stars n={record.stars} /></div>
      <p data-testid="skat-lesson-learned" {...stylex.props(typography.appText, styles.doneLearned)}>{m.done_learned({ learned: lesson.learned })}</p>
      <p {...stylex.props(typography.appText, styles.doneNote)}>
        {record.mistakes === 0 ? m.done_perfect() : m.done_mistakes({ n: record.mistakes })}
      </p>
      {following ? null : (
        <p {...stylex.props(typography.appText, styles.doneNote)}>{m.entry_game_text()}</p>
      )}
      <div {...stylex.props(styles.doneActions)}>
        {following ? (
          <Link to="/course/$slug" params={{ slug: GUIDES[getLocale()][following.id].slug }} data-testid="skat-next-lesson" {...linkLook('go', 'lg', 'block')}>
            {m.done_next_lesson()}
          </Link>
        ) : (
          <Link to="/play" data-testid="skat-course-done-play" onClick={() => track('course_complete_cta_clicked')} {...linkLook('go', 'lg', 'block')}>
            {m.entry_game_cta()}
          </Link>
        )}
        <Link to="/course" data-testid="skat-back-home" {...linkLook('quiet', 'lg', 'block')}>{m.done_back()}</Link>
      </div>
    </div>
  )
}

const styles = stylex.create({
  body: { flexGrow: 1 },
  gameStep: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  gameTitle: { margin: 0, color: color.navy },
  gamePara: { margin: 0, color: color.text },
  done: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: space.x14,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    marginTop: space.x32,
    boxSizing: 'border-box',
    paddingBlock: space.x40,
    paddingInline: space.x24,
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.optionFeatured,
  },
  doneTitle: { margin: 0, color: color.navy },
  doneStars: { transform: move.starsBig, marginBlock: space.x8 },
  doneLearned: { margin: 0, color: color.navy },
  doneNote: { margin: 0, color: color.slate },
  doneActions: { display: 'flex', flexWrap: 'wrap', gap: space.x12, justifyContent: 'center', marginTop: space.x8 },
})
