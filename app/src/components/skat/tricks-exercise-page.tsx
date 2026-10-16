import { Link, useParams } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, CircleCheck, CircleX } from 'lucide-react'
import { useState } from 'react'

import type { Card } from '~/lib/skat/cards'
import type { Game } from '~/lib/skat/game'
import { cardLabel, contractName, roleName, suitName } from '~/lib/skat/i18n'
import type { CardRow, ChoiceStep, PickStep, PlayStep } from '~/lib/skat/lessons/types'
import { EXERCISE_TEXT, exerciseById, exercisesOf, nextExercise } from '~/lib/skat/tricks/exercises'
import type { Endgame, Side, Trick } from '~/lib/skat/tricks/exercises/endgame'
import type { Exercise, ExerciseText, Option, ShownRow, Situation, Who } from '~/lib/skat/tricks/exercises/types'
import { useLadder } from '~/lib/skat/tricks/ladder-progress'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { TrickReplay } from './daily-comparison'
import { Choice, Pick, Play } from './exercises'
import { Btn, Panel, Pill, Rich, linkLook } from './ui'

/**
 * One Skat-Tricks exercise (SKATGO-103): the way back to all of them, the kind and number, the title; then on
 * a white card what the learner knows of the game, the cards on show and the question, in the course's own
 * widgets. The first answer counts: then the verdict, the right answer, why it is right and the trick it
 * practises, and the way on. Nothing is saved, and the page is not a search entry (lib/indexability.ts).
 */
export function TricksExercisePage() {
  const { exercise: id } = useParams({ from: '/skat-tricks_/$exercise' })
  // Each exercise starts unanswered, also when "next" keeps the page and changes only the address.
  return <ExerciseView key={id} id={id} />
}

function ExerciseView({ id }: { id: string }) {
  const exercise = exerciseById(id)
  // A fresh attempt is a fresh widget.
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<'right' | 'wrong' | null>(null)
  const solve = useLadder((s) => s.solve)
  if (!exercise) return null
  const locale = getLocale()
  const text = EXERCISE_TEXT[locale]
  const words = text.exercises[exercise.id]
  const siblings = exercisesOf(exercise.type)
  const n = siblings.findIndex((e) => e.id === exercise.id) + 1
  // The ladder climbs within itself (SKATGO-108): after its last step, back to the list.
  const after = nextExercise(exercise.id)
  const following = exercise.type === 'sieg-sichern' && after?.type !== exercise.type ? undefined : after
  const callbacks = {
    once: true,
    onSolved: () => {
      setResult('right')
      if (exercise.type === 'sieg-sichern') solve(exercise.id)
    },
    onMistake: () => setResult('wrong'),
  }
  const again = () => {
    setResult(null)
    setAttempt((a) => a + 1)
  }
  return (
    <div data-testid="tricks-exercise" data-exercise={exercise.id} data-result={result ?? ''} {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>
        <nav {...stylex.props(styles.top)}>
          <Link to="/skat-tricks" hash={exercise.type} data-testid="tricks-exercise-back" {...linkLook('quiet', 'sm')}>
            <span {...stylex.props(styles.backInner)}>
              <ChevronLeft aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
              {m.tricks_ex_back()}
            </span>
          </Link>
          <Pill>{m.tricks_ex_kicker({ type: text.types[exercise.type].title, n, count: siblings.length })}</Pill>
        </nav>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{words.title}</h1>

        <section {...stylex.props(styles.card)}>
          <SituationView situation={exercise.situation} />
          <div key={attempt}>
            {exercise.ask.kind === 'choice' ? <Choice step={choiceStep(exercise, words)} {...callbacks} /> : null}
            {exercise.ask.kind === 'pick' ? <Pick step={pickStep(exercise, words)} {...callbacks} /> : null}
            {exercise.ask.kind === 'play' ? <Play step={playStep(exercise, words)} {...callbacks} /> : null}
          </div>
        </section>

        {result ? (
          <div data-testid="tricks-exercise-result" data-result={result} {...stylex.props(styles.result)}>
            <Panel tone={result === 'right' ? 'good' : 'bad'}>
              <div {...stylex.props(styles.verdict)}>
                <span aria-hidden="true" {...stylex.props(styles.verdictIcon, result === 'right' ? styles.good : styles.bad)}>
                  {result === 'right' ? <CircleCheck size={icon.inline} strokeWidth={icon.outline} /> : <CircleX size={icon.inline} strokeWidth={icon.outline} />}
                </span>
                <div {...stylex.props(styles.verdictText)}>
                  <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{result === 'right' ? m.tricks_ex_right() : m.tricks_ex_wrong()}</p>
                  {result === 'wrong' ? (
                    <p data-testid="tricks-exercise-answer" {...stylex.props(typography.body, styles.para)}>
                      <Rich text={m.tricks_ex_answer({ answer: `**${answerLabel(exercise, words)}**` })} />
                    </p>
                  ) : null}
                  <p data-testid="tricks-exercise-explain" {...stylex.props(typography.body, styles.para)}>
                    <Rich text={words.explain} />
                  </p>
                </div>
              </div>
            </Panel>
            {exercise.endgame ? <EndgameAnalysis e={exercise.endgame} /> : null}
            <div {...stylex.props(styles.actions)}>
              {following ? (
                <Link to="/skat-tricks/$exercise" params={{ exercise: following.id }} data-testid="tricks-exercise-next" {...linkLook('go', 'md')}>
                  {m.tricks_ex_next()}
                </Link>
              ) : (
                <Link to="/skat-tricks" data-testid="tricks-exercise-done" {...linkLook('go', 'md')}>
                  {m.tricks_ex_done()}
                </Link>
              )}
              <Btn testId="tricks-exercise-again" tone="quiet" onClick={again}>
                {m.tricks_ex_again()}
              </Btn>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const whoName = (who: Who): string =>
  ({ you: m.tricks_who_you, partner: m.tricks_who_partner, declarer: m.tricks_who_declarer, left: m.tricks_who_left, right: m.tricks_who_right })[who]()

/** The game in one line, then the rows of cards the question shows. */
function SituationView({ situation: s }: { situation: Situation }) {
  const game = s.contract
    ? [s.contract.kind === 'null' && s.ouvert ? m.tricks_game_null_ouvert() : contractName(s.contract), s.hand ? m.tricks_sit_hand() : null].filter(Boolean).join(' ')
    : null
  const seat =
    s.role === 'declarer' && s.position
      ? m.tricks_sit_declarer({ position: roleName(s.position) })
      : s.role === 'defender' && s.position && s.declarer
        ? m.tricks_sit_defender({ position: roleName(s.position), declarer: roleName(s.declarer) })
        : s.position
          ? m.tricks_sit_bidder({ position: roleName(s.position) })
          : null
  const facts = [
    game,
    seat,
    s.bid ? m.tricks_sit_bid({ bid: s.bid }) : null,
    s.trickNo ? m.tricks_row_trick({ n: s.trickNo }) : null,
    s.points !== undefined ? m.tricks_sit_points({ n: s.points }) : null,
    s.need !== undefined ? m.tricks_sit_need({ n: s.need }) : null,
    s.tricksLeft !== undefined ? m.tricks_sit_left({ n: s.tricksLeft }) : null,
  ].filter(Boolean)
  return (
    <div data-testid="tricks-situation" {...stylex.props(styles.situation)}>
      {facts.length ? <p {...stylex.props(typography.panelLabel, styles.facts)}>{facts.join(' · ')}</p> : null}
      {s.rows.map((row, i) => (
        <RowView key={i} row={row} />
      ))}
    </div>
  )
}

const SEAT_OF: Record<Side, 0 | 1 | 2> = { you: 0, left: 1, right: 2 }
const replayNames = () => [m.tricks_who_you(), m.tricks_who_left(), m.tricks_who_right()]
/** Tricks in the play record's own shape: the declarer — the learner — in seat 0, left 1, right 2. */
const asReplay = (tricks: { cards: { who: Who; card: Card }[]; winner: Who }[]): Game['tricks'] =>
  tricks.map((t) => ({ cards: t.cards.map((c) => ({ seat: SEAT_OF[c.who as Side], card: c.card })), winner: SEAT_OF[t.winner as Side] }))

/** A row the question shows: the play so far as the play record (SKATGO-108), the voids as a line, else cards. */
function RowView({ row }: { row: ShownRow }) {
  if (row.kind === 'history') {
    return (
      <div data-testid="tricks-history" {...stylex.props(styles.history)}>
        <p {...stylex.props(typography.meta, styles.facts)}>{m.tricks_row_history()}</p>
        <TrickReplay tricks={asReplay(row.tricks)} names={replayNames()} />
      </div>
    )
  }
  if (row.kind === 'voids') {
    return (
      <p data-testid="tricks-voids" {...stylex.props(typography.meta, styles.facts)}>
        {row.voids.map((v) => (v.suit === 'T' ? m.tricks_void_trump({ who: whoName(v.who) }) : m.tricks_void_suit({ who: whoName(v.who), suit: suitName(v.suit) }))).join(' · ')}
      </p>
    )
  }
  return <CardRowView row={cardRow(row)} />
}

/**
 * After a ladder step is answered (SKATGO-108): the opponents' cards turned over, the sure way through this
 * deal trick by trick, and each other card with a split of the opponents' cards in which it loses.
 */
function EndgameAnalysis({ e }: { e: Endgame }) {
  const list = (cs: Card[]) => cs.map(cardLabel).join(' ')
  const replay = (ts: Trick[]) => asReplay(ts.map((t) => ({ cards: t.cards.map((c) => ({ who: c.side, card: c.card })), winner: t.winner })))
  return (
    <section data-testid="tricks-analysis" {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.analysisPart)}>
        <h2 {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{m.tricks_an_hands()}</h2>
        <CardRowView row={{ label: m.tricks_who_left(), cards: e.left }} />
        <CardRowView row={{ label: m.tricks_who_right(), cards: e.right }} />
      </div>
      <div data-testid="tricks-analysis-line" {...stylex.props(styles.analysisPart)}>
        <h2 {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{m.tricks_an_line()}</h2>
        <TrickReplay tricks={replay(e.line)} names={replayNames()} />
      </div>
      <div data-testid="tricks-analysis-traps" {...stylex.props(styles.analysisPart)}>
        <h2 {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{m.tricks_an_traps()}</h2>
        {e.traps.map((x) => (
          <p key={cardLabel(x.card)} {...stylex.props(typography.body, styles.para)}>
            <Rich text={m.tricks_an_trap({ card: `**${cardLabel(x.card)}**`, left: list(x.left), right: list(x.right) })} />
          </p>
        ))}
      </div>
    </section>
  )
}

function cardRow(row: Exclude<ShownRow, { kind: 'history' } | { kind: 'voids' }>): CardRow {
  switch (row.kind) {
    case 'skat':
      return { label: m.tricks_row_skat(), cards: row.cards }
    case 'trick':
      return { label: m.tricks_row_trick({ n: row.n }), cards: row.plays.map((p) => p.card), captions: row.plays.map((p) => whoName(p.who)) }
    case 'hand':
      return { label: row.who === 'you' ? m.tricks_row_cards() : m.tricks_row_hand({ who: whoName(row.who) }), cards: row.cards }
    case 'outstanding':
      return { label: m.tricks_row_outstanding(), cards: row.cards }
    case 'hand12':
      return { label: m.tricks_row_hand12(), cards: row.cards }
  }
}

function optionLabel(o: Option, words: ExerciseText, i: number): string {
  switch (o.kind) {
    case 'number':
      return String(o.n)
    case 'percent':
      return new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(o.p / 100)
    case 'game':
      if (o.game === 'NO') return m.tricks_game_null_ouvert()
      if (o.game === 'G') return contractName({ kind: 'grand' })
      if (o.game === 'N') return contractName({ kind: 'null' })
      return contractName({ kind: 'suit', trump: o.game })
    case 'text':
      return words.options?.[i] ?? ''
  }
}

function answerLabel(e: Exercise, words: ExerciseText): string {
  const a = e.ask
  if (a.kind === 'choice') return optionLabel(a.options[a.answer], words, a.answer)
  if (a.kind === 'pick') return a.correct.map(cardLabel).join(' ')
  return a.best.map(cardLabel).join(' / ')
}

// The widgets explain nothing themselves in an exercise (`once`): the page does, under them.
function choiceStep(e: Exercise, words: ExerciseText): ChoiceStep {
  const a = e.ask as Extract<Exercise['ask'], { kind: 'choice' }>
  return { kind: 'choice', prompt: words.prompt, options: a.options.map((o, i) => optionLabel(o, words, i)), answer: a.answer, explain: '' }
}

function pickStep(e: Exercise, words: ExerciseText): PickStep {
  const a = e.ask as Extract<Exercise['ask'], { kind: 'pick' }>
  return { kind: 'pick', prompt: words.prompt, cards: a.cards, correct: a.correct, explain: '' }
}

function playStep(e: Exercise, words: ExerciseText): PlayStep {
  const a = e.ask as Extract<Exercise['ask'], { kind: 'play' }>
  return { kind: 'play', prompt: words.prompt, contract: a.contract, hand: a.hand, trick: a.trick.map((t) => t.card), trickBy: a.trick.map((t) => whoName(t.who)), best: a.best, explain: '' }
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x20,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x16 },
    paddingBottom: space.x72,
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.x12 },
  backInner: { display: 'inline-flex', alignItems: 'center', gap: space.x4 },
  title: { margin: 0, color: color.navy },
  // The lesson's step card (lesson-player.tsx): white, the option shadow.
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x20,
    padding: { default: space.x24, [bp.phone]: space.x16 },
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.option,
  },
  situation: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    paddingBottom: space.x16,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  facts: { margin: 0, color: color.slate },
  history: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  analysisPart: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  result: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  verdict: { display: 'flex', alignItems: 'flex-start', gap: space.x10 },
  verdictIcon: { display: 'flex', flexShrink: 0, paddingTop: space.x2 },
  good: { color: color.good },
  bad: { color: color.bad },
  verdictText: { display: 'flex', flexDirection: 'column', gap: space.x8, minWidth: 0 },
  verdictTitle: { margin: 0, color: color.navy },
  para: { margin: 0, color: color.text },
  link: {
    alignSelf: 'flex-start',
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
})
