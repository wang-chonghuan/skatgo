import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { lessons } from '~/lib/skat/lessons/content'
import type { Lesson, Step } from '~/lib/skat/lessons/types'
import { type LessonRecord, useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { confettiBurst, finish, stepSlide } from '../../theme/constants'
import { move } from '../../theme/effects.stylex'
import { border, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'
import { Choice, Order, Pick, Play, Teach } from './exercises'
import { GameTable } from './game-table'
import { Btn, Panel, ProgressBar, Rich, Stars, linkLook } from './ui'

type Concrete = Exclude<Step, { kind: 'generated' }>

/**
 * Plays one lesson, step by step. Generated drills are materialised here, once, after mount: they
 * use Math.random, and doing it during render would hand the server and the browser two different
 * questions.
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

  function advance() {
    if (!canContinue) return
    if (isLast) {
      setRecord(complete(lesson.id, mistakes))
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

  return (
    <div data-testid="skat-lesson" data-step={index} data-step-kind={step.kind} {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <Link to="/course" aria-label={m.lesson_close()} {...stylex.props(typography.closeGlyph, styles.close)}>✕</Link>
        <div {...stylex.props(styles.bar)}>
          <ProgressBar value={index / steps.length} label={m.lesson_progress()} />
        </div>
        <span data-testid="skat-step-count" {...stylex.props(typography.smallBold, styles.count)}>{index + 1} / {steps.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: stepSlide.offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -stepSlide.offset }}
          transition={{ duration: stepSlide.duration }}
          {...stylex.props(styles.body)}
        >
          {step.kind === 'teach' ? <Teach step={step} /> : null}
          {step.kind === 'choice' ? <Choice step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'pick' ? <Pick step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'order' ? <Order step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'play' ? <Play step={step} solvedBefore={solved} onSolved={onSolved} onMistake={onMistake} /> : null}
          {step.kind === 'game' ? (
            <div {...stylex.props(styles.gameStep)}>
              <h2 {...stylex.props(typography.pageTitle, styles.gameTitle)}>{step.title}</h2>
              {step.body.map((p, i) => <p key={i} {...stylex.props(typography.bodySmall, styles.gamePara)}><Rich text={p} /></p>)}
              <GameTable
                onSettled={({ humanWon, humanScore }) => {
                  recordGame(humanWon, humanScore)
                  onSolved()
                }}
              />
              {solved ? <Panel tone="good"><p {...stylex.props(typography.bodySmall, styles.gamePara)}>{m.lesson_game_done()}</p></Panel> : null}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div {...stylex.props(styles.foot)}>
        <Btn testId="skat-back" tone="quiet" disabled={index === 0} onClick={back}>
          {m.lesson_back()}
        </Btn>
        <Btn testId="skat-continue" size="lg" grow disabled={!canContinue} onClick={advance}>
          {isLast ? (step.kind === 'game' ? m.lesson_graduate() : m.lesson_finish()) : m.lesson_continue()}
        </Btn>
      </div>
    </div>
  )
}

function Finished({ lesson, record }: { lesson: Lesson; record: LessonRecord }) {
  const course = lessons()
  const i = course.findIndex((l) => l.id === lesson.id)
  const following = course[i + 1]
  return (
    <div data-testid="skat-lesson-done" {...stylex.props(styles.done)}>
      <motion.div initial={{ scale: finish.fromScale, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={finish.spring} {...stylex.props(typography.celebrate)}>
        {following ? lesson.emoji : '🏅'}
      </motion.div>
      <h2 {...stylex.props(typography.finishTitle, styles.doneTitle)}>{following ? m.done_title({ id: lesson.id }) : m.done_graduated()}</h2>
      <div {...stylex.props(styles.doneStars)}><Stars n={record.stars} /></div>
      <p {...stylex.props(typography.body, styles.doneNote)}>
        {record.mistakes === 0 ? m.done_perfect() : m.done_mistakes({ n: record.mistakes })}
      </p>
      {following ? null : (
        <p {...stylex.props(typography.body, styles.doneNote)}>{m.done_next_steps()}</p>
      )}
      <div {...stylex.props(styles.doneActions)}>
        {following ? (
          <Link to="/lesson/$id" params={{ id: following.id }} data-testid="skat-next-lesson" {...linkLook('primary', 'lg')}>
            {m.done_next_lesson({ title: following.title })}
          </Link>
        ) : (
          <Link to="/play" {...linkLook('primary', 'lg')}>{m.done_free_play()}</Link>
        )}
        <Link to="/course" data-testid="skat-back-home" {...linkLook('quiet', 'lg')}>{m.done_back()}</Link>
      </div>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: space.x18, minHeight: '100%' },
  head: { display: 'flex', alignItems: 'center', gap: space.x12 },
  close: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: size.closeButton,
    height: size.closeButton,
    borderRadius: radius.round,
    color: skat.inkSoft,
    backgroundColor: { default: 'transparent', ':hover': skat.paperDeep },
    textDecoration: 'none',
    flexShrink: 0,
  },
  bar: { flexGrow: 1 },
  count: { color: skat.inkSoft, whiteSpace: 'nowrap' },
  body: { flexGrow: 1 },
  foot: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x10,
    position: 'sticky',
    bottom: 0,
    paddingBlock: space.x12,
    backgroundColor: skat.paper,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: skat.paperEdge,
  },
  gameStep: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  gameTitle: { margin: 0, color: skat.ink },
  gamePara: { margin: 0, color: skat.ink },
  done: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: space.x14, paddingBlock: space.x40 },
  doneTitle: { margin: 0, color: skat.ink },
  doneStars: { transform: move.starsBig, marginBlock: space.x8 },
  doneNote: { margin: 0, color: skat.inkSoft, maxWidth: size.proseNarrow },
  doneActions: { display: 'flex', flexWrap: 'wrap', gap: space.x12, justifyContent: 'center', marginTop: space.x8 },
})
