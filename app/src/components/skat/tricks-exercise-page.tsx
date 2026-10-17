import { Link, useParams } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, CircleCheck, CircleX } from 'lucide-react'
import { useState } from 'react'

import { type Card, SUIT_SYMBOL, sortHand } from '~/lib/skat/cards'
import { cardLabel, contractName, roleName } from '~/lib/skat/i18n'
import type { CardRow, ChoiceStep, PickStep, PlayStep } from '~/lib/skat/lessons/types'
import { EXERCISE_TEXT, exerciseById, exercisesOf, nextExercise } from '~/lib/skat/tricks/exercises'
import type { Endgame } from '~/lib/skat/tricks/exercises/endgame'
import type { Exercise, ExerciseText, Option, ShownRow, Situation, Who } from '~/lib/skat/tricks/exercises/types'
import { useLadder } from '~/lib/skat/tricks/ladder-progress'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev, fill } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { PlayingCard } from './playing-card'
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
            {exercise.ask.kind === 'play' ? <Play step={playStep(exercise, words)} table={exercise.endgame ? <LadderTable e={exercise.endgame} /> : undefined} {...callbacks} /> : null}
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
                  {words.trap ? (
                    <p data-testid="tricks-exercise-trap" {...stylex.props(typography.body, styles.trap)}>
                      <Rich text={words.trap} />
                    </p>
                  ) : null}
                </div>
              </div>
            </Panel>
            {exercise.endgame ? <LadderLine e={exercise.endgame} /> : null}
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
  ].filter(Boolean)
  // A ladder step says it all in its title and on its table (SKATGO-109).
  if (!facts.length && !s.rows.length) return null
  return (
    <div data-testid="tricks-situation" {...stylex.props(styles.situation)}>
      {facts.length ? <p {...stylex.props(typography.panelLabel, styles.facts)}>{facts.join(' · ')}</p> : null}
      {s.rows.map((row, i) => (
        <CardRowView key={i} row={cardRow(row)} />
      ))}
    </div>
  )
}

/**
 * A ladder step's table (SKATGO-109, the human: 「太复杂了」): everything the step needs at one glance — the two
 * opponents with their cards face down and the voids they showed, and the cards still out, sorted so they do
 * not tell whose they are. Your cards are the hand under it.
 */
function LadderTable({ e }: { e: Endgame }) {
  const seat = (side: 'left' | 'right', cards: Card[]) => {
    const voids = e.voids.filter((v) => v.side === side)
    return (
      <div data-testid={`tricks-ladder-${side}`} {...stylex.props(styles.seat, side === 'right' && styles.seatRight)}>
        <span {...stylex.props(typography.label, styles.onFelt)}>{side === 'left' ? m.tricks_who_left() : m.tricks_who_right()}</span>
        <span {...stylex.props(styles.backs)}>
          {cards.map((c) => (
            <PlayingCard key={cardLabel(c)} card={c} size="xs" faceDown />
          ))}
        </span>
        {voids.length ? (
          <span {...stylex.props(styles.chips, side === 'right' && styles.chipsRight)}>
            {voids.map((v) => (
              <Pill key={v.suit} tone="dark">
                <Rich text={v.suit === 'T' ? m.tricks_chip_trump() : m.tricks_chip_suit({ suit: SUIT_SYMBOL[v.suit] })} />
              </Pill>
            ))}
          </span>
        ) : null}
      </div>
    )
  }
  return (
    <div data-testid="tricks-ladder-table" {...stylex.props(styles.ladderTable)}>
      <div {...stylex.props(styles.seats)}>
        {seat('left', e.left)}
        {seat('right', e.right)}
      </div>
      <div {...stylex.props(styles.out)}>
        <span {...stylex.props(typography.label, styles.onFelt)}>{m.tricks_out()}</span>
        <span data-testid="tricks-ladder-out" {...stylex.props(styles.outCards)}>
          {sortHand([...e.left, ...e.right], e.contract).map((c) => (
            <PlayingCard key={cardLabel(c)} card={c} size="xs" />
          ))}
        </span>
      </div>
    </div>
  )
}

/** After a ladder step (SKATGO-109): the sure way, trick by trick on the felt, until the points are in. */
function LadderLine({ e }: { e: Endgame }) {
  let total = 0
  const shown: Endgame['line'] = []
  for (const t of e.line) {
    if (total >= e.need) break
    shown.push(t)
    if (t.winner === 'you') total += t.points
  }
  let running = 0
  return (
    <div data-testid="tricks-ladder-line" {...stylex.props(styles.lineFelt)}>
      <span {...stylex.props(typography.label, styles.onFelt)}>{m.tricks_an_line()}</span>
      {shown.map((t, i) => {
        if (t.winner === 'you') running += t.points
        const done = t.winner === 'you' && running >= e.need
        return (
          <div key={i} {...stylex.props(styles.lineRow)}>
            <span {...stylex.props(typography.label, styles.onFelt)}>{i + 1}.</span>
            {t.cards.map((c) => (
              <PlayingCard key={cardLabel(c.card)} card={c.card} size="xs" glow={c.side === 'you'} />
            ))}
            <span {...stylex.props(typography.smallBold, styles.onFelt, styles.lineEnd)}>
              {t.winner === 'you' ? `${m.tricks_line_you({ n: t.points })}${done ? ' ✓' : ''}` : t.winner === 'left' ? m.tricks_who_left() : m.tricks_who_right()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function cardRow(row: ShownRow): CardRow {
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
  trap: { margin: 0, color: color.bad },
  // A ladder step's table and line (SKATGO-109), on the drill's felt.
  ladderTable: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  seats: { display: 'flex', justifyContent: 'space-between', gap: space.x12 },
  seat: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x4 },
  seatRight: { alignItems: 'flex-end' },
  backs: { display: 'flex', gap: space.x2 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: space.x4 },
  chipsRight: { justifyContent: 'flex-end' },
  out: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4 },
  outCards: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: space.x4 },
  onFelt: { color: color.amber },
  lineFelt: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    padding: { default: space.x16, [bp.phone]: space.x12 },
    borderRadius: radii.panel,
    borderWidth: dims.frameBorderPlay,
    borderStyle: 'solid',
    borderColor: color.gold,
    backgroundImage: fill.felt,
  },
  lineRow: { display: 'flex', alignItems: 'center', gap: space.x6 },
  lineEnd: { marginLeft: 'auto' },
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
