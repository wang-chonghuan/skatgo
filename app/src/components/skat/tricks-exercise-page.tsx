import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useParams } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, CircleCheck, CircleX, Lock } from 'lucide-react'
import { useState } from 'react'

import { type Card, sortHand } from '~/lib/skat/cards'
import { cardLabel, contractName, roleName, suitName } from '~/lib/skat/i18n'
import type { CardRow, ChoiceStep, PickStep, PlayStep } from '~/lib/skat/lessons/types'
import { EXERCISE_TEXT, exerciseById, exercisesOf, nextExercise } from '~/lib/skat/tricks/exercises'
import type { Endgame } from '~/lib/skat/tricks/exercises/endgame'
import { LADDER_FREE } from '~/lib/skat/tricks/exercises/ladder'
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
import { CardRowView, Fan } from './card-row'
import { type OpenMistake, OpenTable } from './open-endgame'
import type { OpenEndgame } from '~/lib/skat/tricks/exercises/open'
import { PlayingCard } from './playing-card'
import { Choice, Pick, Play } from './exercises'
import { Btn, Panel, Pill, Rich, linkLook } from './ui'

/**
 * One Skat-Tricks exercise (SKATGO-103): the way back to all of them, the kind and number, the title; then on
 * a white card what the learner knows of the game, the cards on show and the question, in the course's own
 * widgets. The first answer counts: then the verdict, the right answer, why it is right and the trick it
 * practises, and the way on. The page is not a search entry (lib/indexability.ts). Only the ladder's answers are
 * recorded (SKATGO-109, ladder-progress.ts), and from its third step on it needs an account: a guest sees why
 * and the way to sign in in the step's place.
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
  // An open-card endgame's wrong card: where it was played (SKATGO-110).
  const [miss, setMiss] = useState<OpenMistake | null>(null)
  const ladder = useLadder()
  if (!exercise) return null
  const locale = getLocale()
  const text = EXERCISE_TEXT[locale]
  const words = text.exercises[exercise.id]
  const siblings = exercisesOf(exercise.type)
  const n = siblings.findIndex((e) => e.id === exercise.id) + 1
  // The exercises the site shows are recorded and, from the third on, need an account (SKATGO-109; since SKATGO-110
  // the open-card endgames).
  const record = exercise.type === 'offenes-endspiel'
  // The human: 「前2题不登录可以做，第三题必须登录才可以做」.
  const locked = record && n > LADDER_FREE
  // The ladder climbs within itself (SKATGO-108): after its last step, back to the list.
  const after = nextExercise(exercise.id)
  const following = record && after?.type !== exercise.type ? undefined : after
  const callbacks = {
    once: true,
    onSolved: () => {
      setResult('right')
      if (record) ladder.answer(exercise.id, true)
    },
    onMistake: () => {
      setResult('wrong')
      if (record) ladder.answer(exercise.id, false)
    },
  }
  const again = () => {
    setResult(null)
    setMiss(null)
    setAttempt((a) => a + 1)
  }
  const missedLater = miss && !miss.first ? miss.at : null
  return (
    <div data-testid="tricks-exercise" data-exercise={exercise.id} data-result={result ?? ''} {...stylex.props(styles.root)}>
      {/* An open-card endgame keeps its table on the screen: the page's spacing closes up round it (SKATGO-111). */}
      <div {...stylex.props(styles.column, exercise.open && styles.columnTight)}>
        <nav {...stylex.props(styles.top)}>
          <Link to="/skat-tricks" hash={exercise.type} data-testid="tricks-exercise-back" {...linkLook('quiet', 'sm')}>
            <span {...stylex.props(styles.backInner)}>
              <ChevronLeft aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
              {m.tricks_ex_back()}
            </span>
          </Link>
          {/* A ladder step's kicker is short, so it shares the back button's line on a phone (SKATGO-109). */}
          <Pill>{exercise.endgame || exercise.open ? m.tricks_ladder_kicker({ n, count: siblings.length }) : m.tricks_ex_kicker({ type: text.types[exercise.type].title, n, count: siblings.length })}</Pill>
        </nav>
        {/* Every ladder step has the same heading; the step itself is on the felt (SKATGO-109, the human:
            「标题就要continue this deal之类的，统一」). */}
        {/* An open-card endgame says only what is played and which side the learner is on (SKATGO-111, the human:
            「乱七八糟的文字太多」); the rest is on the table. */}
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{exercise.open ? openTitle(exercise.open) : exercise.endgame ? m.tricks_ladder_heading() : words.title}</h1>

        {locked && ladder.account === undefined ? (
          <section {...stylex.props(styles.card)}>
            <p data-testid="tricks-ladder-waiting" {...stylex.props(typography.loading, styles.para)}>{m.loading()}</p>
          </section>
        ) : locked && ladder.account === null ? (
          <LadderGate />
        ) : exercise.open ? (
          // The game's own table, every hand open (SKATGO-110), and nothing else: the goal, the marks and the result
          // are on it (SKATGO-111).
          <section key={attempt} data-testid="tricks-open" {...stylex.props(styles.openStack)}>
            <OpenTable
              e={exercise.open}
              onSolved={callbacks.onSolved}
              onMistake={(at) => {
                setMiss(at)
                callbacks.onMistake()
              }}
              after={result ? <OpenResult e={exercise.open} result={result} miss={miss} explain={words.explain} following={following?.id} onAgain={again} /> : undefined}
            />
          </section>
        ) : (
          <section {...stylex.props(styles.card)}>
            <SituationView situation={exercise.situation} />
            <div key={attempt}>
              {exercise.ask.kind === 'choice' ? <Choice step={choiceStep(exercise, words)} {...callbacks} /> : null}
              {exercise.ask.kind === 'pick' ? <Pick step={pickStep(exercise, words)} {...callbacks} /> : null}
              {exercise.ask.kind === 'play' && exercise.endgame ? (
                <Play step={{ ...playStep(exercise, words), prompt: '' }} table={<LadderTable e={exercise.endgame} />} handLabel={m.tricks_row_cards()} {...callbacks} />
              ) : exercise.ask.kind === 'play' ? (
                <Play step={playStep(exercise, words)} {...callbacks} />
              ) : null}
            </div>
          </section>
        )}

        {result && !exercise.open ? (
          <div data-testid="tricks-exercise-result" data-result={result} {...stylex.props(styles.result)}>
            <Panel tone={result === 'right' ? 'good' : 'bad'}>
              <div {...stylex.props(styles.verdict)}>
                <span aria-hidden="true" {...stylex.props(styles.verdictIcon, result === 'right' ? styles.good : styles.bad)}>
                  {result === 'right' ? <CircleCheck size={icon.inline} strokeWidth={icon.outline} /> : <CircleX size={icon.inline} strokeWidth={icon.outline} />}
                </span>
                <div {...stylex.props(styles.verdictText)}>
                  <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{result === 'right' ? m.tricks_ex_right() : m.tricks_ex_wrong()}</p>
                  {result === 'wrong' && !missedLater ? (
                    <p data-testid="tricks-exercise-answer" {...stylex.props(typography.body, styles.para)}>
                      <Rich text={m.tricks_ex_answer({ answer: `**${answerLabel(exercise, words)}**` })} />
                    </p>
                  ) : null}
                  {/* A wrong card after right ones (SKATGO-110): what would have won at that turn, and where each card
                      leaves the declarer. */}
                  <p data-testid="tricks-exercise-explain" {...stylex.props(typography.body, styles.para)}>
                    <Rich
                      text={
                        missedLater
                          ? m.tricks_open_later({
                              answer: missedLater.win.map((c) => `**${cardLabel(c)}**`).join(' / '),
                              values: missedLater.values.map((v) => `${cardLabel(v.card)} ${v.points}`).join(', '),
                            })
                          : words.explain
                      }
                    />
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

/** A ladder step a guest may not answer (SKATGO-109): in its place, why — and the way in, Clerk's window over
 *  the page; once signed in, the step is there. */
function LadderGate() {
  return (
    <section data-testid="tricks-ladder-gate" {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.verdict)}>
        <span aria-hidden="true" {...stylex.props(styles.verdictIcon, styles.gateIcon)}>
          <Lock size={icon.inline} strokeWidth={icon.outline} />
        </span>
        <div {...stylex.props(styles.verdictText)}>
          <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{m.tricks_ladder_gate_title()}</p>
          <p {...stylex.props(typography.body, styles.para)}>{m.tricks_ladder_gate_text({ n: LADDER_FREE })}</p>
        </div>
      </div>
      <div {...stylex.props(styles.actions)}>
        <SignInButton mode="modal">
          <Btn testId="tricks-ladder-sign-in" tone="go">
            {m.tricks_ladder_gate_button()}
          </Btn>
        </SignInButton>
      </div>
    </section>
  )
}

/** What is played and the learner's side, in one line: "Karo · du bist Alleinspieler". */
const openTitle = (e: OpenEndgame) =>
  e.role === 'declarer' ? m.tricks_open_title_declarer({ game: contractName(e.game.declaration!.contract) }) : m.tricks_open_title_defender({ game: contractName(e.game.declaration!.contract) })

/**
 * An open-card endgame's result, over the table (SKATGO-111): solved or not, the card that mattered — the one that
 * wins, or at a later turn the one that would have — and the way on. Why, only when asked.
 */
function OpenResult({ e, result, miss, explain, following, onAgain }: { e: OpenEndgame; result: 'right' | 'wrong'; miss: OpenMistake | null; explain: string; following?: string; onAgain: () => void }) {
  const [why, setWhy] = useState(false)
  const later = miss && !miss.first ? miss.at : null
  const cards = (later ?? e.play).win.map((c) => `**${cardLabel(c)}**`).join(' / ')
  const line = result === 'right' ? m.tricks_open_key({ card: cards }) : later ? m.tricks_open_here({ answer: cards }) : m.tricks_ex_answer({ answer: cards })
  return (
    <div data-testid="tricks-exercise-result" data-result={result} {...stylex.props(styles.openResult)}>
      <div {...stylex.props(styles.verdict)}>
        <span aria-hidden="true" {...stylex.props(styles.verdictIcon, result === 'right' ? styles.good : styles.bad)}>
          {result === 'right' ? <CircleCheck size={icon.inline} strokeWidth={icon.outline} /> : <CircleX size={icon.inline} strokeWidth={icon.outline} />}
        </span>
        <p {...stylex.props(typography.dialogTitle, styles.verdictTitle)}>{result === 'right' ? m.tricks_open_solved() : m.tricks_open_failed()}</p>
      </div>
      <p data-testid="tricks-exercise-answer" {...stylex.props(typography.body, styles.para)}>
        <Rich text={line} />
      </p>
      {why ? (
        <p data-testid="tricks-exercise-explain" {...stylex.props(typography.bodySmall, styles.para)}>
          <Rich
            text={
              later
                ? m.tricks_open_later({ answer: cards, values: later.values.map((v) => `${cardLabel(v.card)} ${v.points}`).join(', ') })
                : explain
            }
          />
        </p>
      ) : null}
      <div {...stylex.props(styles.actions)}>
        {following ? (
          <Link to="/skat-tricks/$exercise" params={{ exercise: following }} data-testid="tricks-exercise-next" {...linkLook('go', 'md')}>
            {m.tricks_ex_next()}
          </Link>
        ) : (
          <Link to="/skat-tricks" data-testid="tricks-exercise-done" {...linkLook('go', 'md')}>
            {m.tricks_ex_done()}
          </Link>
        )}
        {why ? null : (
          <Btn testId="tricks-open-why" tone="quiet" onClick={() => setWhy(true)}>
            {m.tricks_open_why()}
          </Btn>
        )}
        <Btn testId="tricks-exercise-again" tone="quiet" onClick={onAgain}>
          {m.tricks_ex_again()}
        </Btn>
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
 * A ladder step's table (SKATGO-109, the human: 「从用户角度……能不能马上想到你是要干啥」): in plain sentences,
 * the cards the opponents still hold — sorted, so they do not tell whose they are — and what the play has
 * shown about them; your cards are the hand under it.
 */
function LadderTable({ e }: { e: Endgame }) {
  const out = sortHand([...e.left, ...e.right], e.contract)
  // Each opponent's known gaps, the same three rows on every step (the human: 「要标准显示：合约是啥，左边的特点，右边的特点」).
  const known = (side: 'left' | 'right') => {
    const parts = e.voids.filter((v) => v.side === side).map((v) => (v.suit === 'T' ? m.tricks_ladder_part_trump() : m.tricks_ladder_part_suit({ suit: suitName(v.suit) })))
    return parts.length ? parts.join(', ') : m.tricks_ladder_nothing()
  }
  const rows: [string, string, string][] = [
    // Who you are, said with the game (the human asked: 「我都是庄家吗」).
    ['contract', m.tricks_ladder_contract(), m.tricks_ladder_contract_value({ contract: contractName(e.contract) })],
    // The goal on the felt too (the human: 「目标也写在绿色上面，目标分数，要打几张」).
    ['goal', m.tricks_ladder_goal(), m.tricks_ladder_goal_value({ need: e.need, n: e.hand.length })],
    ['left', m.tricks_ladder_left(), known('left')],
    ['right', m.tricks_ladder_right(), known('right')],
  ]
  return (
    <div data-testid="tricks-ladder-table" {...stylex.props(styles.ladderTable)}>
      {/* A table, so the three values line up whatever the labels' widths. */}
      <table data-testid="tricks-ladder-facts" {...stylex.props(styles.factsTable)}>
        <tbody>
          {rows.map(([key, label, value]) => (
            <tr key={key} data-fact={key}>
              <th scope="row" {...stylex.props(typography.label, styles.onFeltSoft, styles.factLabel)}>{label}</th>
              <td {...stylex.props(typography.bodySmall, styles.onFelt, styles.factValue)}>
                <Rich text={value} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div {...stylex.props(styles.outBlock)}>
        <p {...stylex.props(typography.label, styles.onFeltSoft, styles.center)}>{m.tricks_ladder_out({ n: out.length })}</p>
        {/* As big as your own cards (the human: 「剩的牌大一点，最好和手牌一样大」), held like a hand. */}
        <Fan testId="tricks-ladder-out" cards={out} size="lg" row />
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
      <span {...stylex.props(typography.label, styles.onFeltSoft)}>{m.tricks_an_line()}</span>
      {shown.map((t, i) => {
        if (t.winner === 'you') running += t.points
        const done = t.winner === 'you' && running >= e.need
        return (
          <div key={i} {...stylex.props(styles.lineRow)}>
            <span {...stylex.props(typography.label, styles.onFeltSoft)}>{i + 1}.</span>
            {t.cards.map((c) => (
              <PlayingCard key={cardLabel(c.card)} card={c.card} size="xs" glow={c.side === 'you'} />
            ))}
            <span {...stylex.props(typography.smallBold, styles.onFelt, styles.lineEnd)}>
              {t.winner === 'you' ? `${m.tricks_line_you({ n: t.points })}${done ? ' ✓' : ''}` : t.winner === 'left' ? m.tricks_ladder_left() : m.tricks_ladder_right()}
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
  factsTable: { borderCollapse: 'collapse' },
  factLabel: { textAlign: 'left', verticalAlign: 'baseline', paddingBlock: space.x2, paddingRight: space.x16, whiteSpace: 'nowrap' },
  factValue: { verticalAlign: 'baseline', paddingBlock: space.x2 },
  outBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    paddingTop: space.x12,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.boardLine,
  },
  center: { textAlign: 'center' },
  onFelt: { margin: 0, color: color.onColor },
  onFeltSoft: { margin: 0, color: color.amber },
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
  openStack: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  columnTight: { gap: { default: space.x6, [bp.phone]: space.x8 }, paddingTop: { default: space.x4, [bp.phone]: space.x8 } },
  openResult: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  verdict: { display: 'flex', alignItems: 'flex-start', gap: space.x10 },
  verdictIcon: { display: 'flex', flexShrink: 0, paddingTop: space.x2 },
  good: { color: color.good },
  bad: { color: color.bad },
  gateIcon: { color: color.slate },
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
