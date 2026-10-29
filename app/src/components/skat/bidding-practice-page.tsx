import { SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { BookOpen, ChevronDown, ChevronUp, CircleCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { type Card, sortHand, trumpSequence } from '~/lib/skat/cards'
import { cardLabel, contractName, matadorLabel, roleName } from '~/lib/skat/i18n'
import { type CheatSheet } from '~/lib/skat/bidding/cheat-sheet'
import { CHEAT_SHEET_DE } from '~/lib/skat/bidding/cheat-sheet.de'
import { CHEAT_SHEET_EN } from '~/lib/skat/bidding/cheat-sheet.en'
import {
  type Analysis,
  type Answer,
  type Attempt,
  CONTRACTS,
  type ContractKey,
  PRACTICE_FREE,
  PRACTICE_QUESTIONS,
  type Practice,
  type Valued,
  analysisOf,
  bestSuit,
  mistakesOf,
  practiceHand,
  questionAt,
  questionId,
  rightAttempt,
  sideAces,
  solutionOf,
  tenCardValues,
  valueOptions,
} from '~/lib/skat/bidding/practice'
import { useBiddingRecord } from '~/lib/skat/bidding/record'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Fan } from './card-row'
import { Choice } from './exercises'
import { Btn, Modal, Panel, Rich } from './ui'

const POSITIONS = ['forehand', 'middlehand', 'rearhand'] as const

/** Where this browser has got to (the question's number); nothing stored is the first. */
const STORE = 'skatgo.bidding-practice'
function readNumber(): number {
  try {
    const n = Number(localStorage.getItem(STORE))
    return Number.isInteger(n) && n >= 1 ? n : 1
  } catch {
    return 1
  }
}
function saveNumber(n: number) {
  try {
    localStorage.setItem(STORE, String(n))
  } catch {
    // Private windows and blocked storage: the practice still runs, from the first question next time.
  }
}

/**
 * The bidding practice (SKATGO-149, the human: 「做成一个叫牌练习的东西，只叫牌」): a sub-page like a Skat-Tricks
 * exercise — the title, the question's number, then on a white card the seat and the ten cards and one question, how
 * high do you bid; the first answer counts, then the verdict, the AI's answer with its game's calculation, what the
 * other numbers would have been, and the next question. A guest answers two; the third waits for an account in its
 * place (the human: 「不登录可以练2题」). The number reached is kept in this browser, nothing on the server.
 */
export function BiddingPracticePage() {
  const { questions, account, answer } = useBiddingRecord()
  // A mistake opened again from the list (SKATGO-150): shown in the run's place until "Next question".
  const [redo, setRedo] = useState<number | null>(null)
  // The first question is rendered on the server too, so the page is a search entry with content; this browser's
  // place replaces it once the page runs.
  const [n, setN] = useState(1)
  const [result, setResult] = useState<'right' | 'wrong' | null>(null)
  useEffect(() => setN(readNumber()), [])
  const locked = redo === null && n > PRACTICE_FREE && account === null
  const advance = () => {
    const after = n + 1
    saveNumber(after)
    setN(after)
  }
  const go = () => {
    if (redo === null) advance()
    setRedo(null)
    setResult(null)
  }
  // Leaving an answered question for a mistake moves the run on, so coming back is the next question.
  const open = (k: number) => {
    if (redo === null && result) advance()
    setRedo(k)
    setResult(null)
  }
  const shown = redo ?? n
  const q = questionAt(shown)
  const analysis = analysisOf(questions)
  const mistakes = mistakesOf(questions)
  return (
    <div data-testid="bidding-practice" data-question={shown} data-result={result ?? ''} {...stylex.props(styles.column)}>
      {/* The place in the run beside the title, no line of its own (the human: 「应该是bidding practice 1/300 进度放这里，上面那个单列
          进度的行不要」). */}
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.bidpractice_title()}</h1>
        <span data-testid="bidding-practice-progress" {...stylex.props(typography.landingHeading, styles.progress)}>
          {shown}/{PRACTICE_QUESTIONS.length}
        </span>
      </div>
      {locked ? (
        <Gate />
      ) : (
        <Question
          key={shown}
          q={q}
          onDone={(a) => {
            const right = rightAttempt(q, a)
            answer(questionId(q), a, right)
            track('exercise_finished', { section: 'bidding', number: shown, right })
            setResult(right ? 'right' : 'wrong')
          }}
          result={result}
          onNext={go}
        />
      )}
      {analysis.answered ? <Record a={analysis} mistakes={mistakes} onOpen={open} /> : null}
      {/* The bidding table to look a value up in and the rules, small links under the card, as under the Skat-Tricks. */}
      <nav {...stylex.props(styles.links)}>
        <Link to="/rules/bidding-table" data-testid="bidding-practice-table-link" {...stylex.props(typography.appLink, styles.link)}>
          {m.bidding_title()}
        </Link>
        <Link to="/rules" data-testid="bidding-practice-rules-link" {...stylex.props(typography.appLink, styles.link)}>
          {m.tricks_rules_link()}
        </Link>
      </nav>
      {/* What the page is, in one small line at its foot, for its search entry — not a lead under the title (SKATGO-135:
          「这个副标题删了」). */}
      <p {...stylex.props(typography.bodySmall, styles.lead)}>{m.bidpractice_lead()}</p>
    </div>
  )
}

/**
 * One question in two steps, as a learner thinks (SKATGO-151, the human: 「答题分两步吧，先点什么合约，再点最高叫到几点」): what do
 * you play — every contract offered, Null too (「你还没说null呢」), Pass last on a row of its own — then, unless the AI passes,
 * how high you can bid with the AI's contract, whatever was chosen first, so the counting is practised on every hand it
 * plays. Each step shows right or wrong at once; once both are answered, why, from the hand's facts.
 */
function Question({ q, result, onDone, onNext }: { q: Practice; result: 'right' | 'wrong' | null; onDone: (a: Attempt) => void; onNext: () => void }) {
  const hand = practiceHand(q)
  const sol = solutionOf(q)
  const [contract, setContract] = useState<ContractKey | null>(null)
  const [value, setValue] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const contracts = [...CONTRACTS.slice(1), CONTRACTS[0]]
  const values = valueOptions(q)
  const pickContract = (c: ContractKey) => {
    setContract(c)
    if (sol.value === null) onDone({ contract: c, value: null })
  }
  return (
    <>
      <section {...stylex.props(styles.card)}>
        <div data-testid="bidding-practice-situation" {...stylex.props(styles.situation)}>
          <div {...stylex.props(styles.seatLine)}>
            {/* As the question below it (the human: 「坐哪个位置的那行字，不要小字，要和how high do you bid同一字体」). */}
            <p {...stylex.props(typography.prompt, styles.seat)}>{m.tricks_sit_bidder({ position: roleName(POSITIONS[q.position]) })}</p>
            {/* The cheat sheet, at hand while deciding (the human: 「做成一个卡片弹窗放在叫牌页面，用户点开就能看」). */}
            <button type="button" data-testid="bidding-practice-sheet" onClick={() => setSheet(true)} {...stylex.props(typography.appLink, styles.sheetLink)}>
              <BookOpen aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
              {cheatSheet().title}
            </button>
          </div>
          {/* As big as the hand at the table, in one row (the ladder's, SKATGO-109: 「最好和手牌一样大」). */}
          <Fan testId="bidding-practice-hand" cards={sortHand(hand, null)} size="lg" row />
        </div>
        <div data-testid="bidding-practice-contract">
          <Choice
            step={{ kind: 'choice', prompt: m.bidpractice_prompt_contract(), options: contracts.map(contractLabel), answer: contracts.indexOf(sol.contract), explain: '' }}
            once
            pairs
            onChoose={(i) => pickContract(contracts[i])}
            onSolved={() => {}}
            onMistake={() => {}}
          />
        </div>
        {contract !== null && sol.value !== null ? (
          <div data-testid="bidding-practice-value" {...stylex.props(styles.step)}>
            <Choice
              step={{ kind: 'choice', prompt: m.bidpractice_prompt_value({ game: answerName(sol.answer) }), options: values.map(String), answer: values.indexOf(sol.value), explain: '' }}
              once
              pairs
              onChoose={(i) => {
                setValue(values[i])
                onDone({ contract, value: values[i] })
              }}
              onSolved={() => {}}
              onMistake={() => {}}
            />
          </div>
        ) : null}
      </section>
      {result && contract !== null ? (
        <div data-testid="bidding-practice-result" data-result={result} {...stylex.props(styles.result)}>
          <Panel tone={result === 'right' ? 'good' : 'bad'}>
            <div {...stylex.props(styles.verdict)}>
              {/* A wrong answer has no red cross (the human: 「不要红叉那个图标」); a right one keeps its check. */}
              {result === 'right' ? (
                <span aria-hidden="true" {...stylex.props(styles.verdictIcon, styles.good)}>
                  <CircleCheck size={icon.inline} strokeWidth={icon.outline} />
                </span>
              ) : null}
              <div {...stylex.props(styles.verdictText)}>
                <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{result === 'right' ? m.tricks_ex_right() : m.tricks_ex_wrong()}</p>
                {explanation(q, contract, value).map(([kind, line]) => (
                  <p key={kind} data-testid={`bidding-practice-why-${kind}`} {...stylex.props(typography.body, styles.para)}>
                    <Rich text={line} />
                  </p>
                ))}
              </div>
            </div>
          </Panel>
          <div {...stylex.props(styles.actions)}>
            <Btn testId="bidding-practice-next" tone="go" onClick={onNext}>
              {m.bidpractice_next()}
            </Btn>
          </div>
        </div>
      ) : null}
      {sheet ? <CheatSheetDialog onClose={() => setSheet(false)} /> : null}
    </>
  )
}

const cheatSheet = (): CheatSheet => (getLocale() === 'de' ? CHEAT_SHEET_DE : CHEAT_SHEET_EN)

/** The cheat sheet in the site's dialog: its sections one under another, a table where it counts points. */
function CheatSheetDialog({ onClose }: { onClose: () => void }) {
  const sheet = cheatSheet()
  const lines = (list: string[] | undefined) => list?.map((t, i) => <p key={i} {...stylex.props(typography.appText, styles.para)}><Rich text={t} /></p>)
  const bullets = (list: string[] | undefined) =>
    list ? (
      <ul {...stylex.props(typography.appText, styles.sheetList)}>
        {list.map((t, i) => (
          <li key={i}><Rich text={t} /></li>
        ))}
      </ul>
    ) : null
  return (
    <Modal title={sheet.title} onClose={onClose} testId="bidding-practice-sheet-dialog">
      <div data-testid="bidding-practice-sheet-body" {...stylex.props(styles.sheetBody)}>
        {sheet.sections.map((sec) => (
          <section key={sec.heading} data-testid="bidding-practice-sheet-section" {...stylex.props(styles.sheetSection)}>
            <h3 {...stylex.props(typography.appBtnStrong, styles.verdictTitle)}>{sec.heading}</h3>
            {lines(sec.text)}
            {bullets(sec.list)}
            {sec.table ? (
              <table {...stylex.props(typography.appText, styles.sheetTable)}>
                <tbody>
                  {sec.table.rows.map(([label, points]) => (
                    <tr key={label}>
                      <td {...stylex.props(styles.sheetCell)}><Rich text={label} /></td>
                      <td {...stylex.props(styles.sheetCell, styles.sheetPoints)}>{points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {lines(sec.after)}
            {bullets(sec.afterList)}
          </section>
        ))}
      </div>
    </Modal>
  )
}

/**
 * The player's bidding so far (SKATGO-150, the human: 「超叫还是不敢叫还是叫错等等的分析……最好有个比率分析」, 「不要花哨，
 * 不要垃圾重复文字」): how many answered, then the error rate and, since SKATGO-151, the four kinds of mistake as shares of the
 * first attempts; under them the mistakes not yet put right, by number, each opening its question.
 */
function Record({ a, mistakes, onOpen }: { a: Analysis; mistakes: number[]; onOpen: (n: number) => void }) {
  const pct = new Intl.NumberFormat(getLocale(), { style: 'percent' })
  const shares = sharesOf(a)
  const share = (kind: string) => pct.format(shares[kind] / 100)
  // The error rate first (「用户的错误率」), then where the mistakes went: the human's 不敢叫, 超叫, 叫错, and the counting.
  const rows: [string, string][] = [
    ['wrong', m.bidpractice_stats_wrong()],
    ['passed', m.bidpractice_stats_passed()],
    ['played', m.bidpractice_stats_played()],
    ['game', m.bidpractice_stats_game()],
    ['value', m.bidpractice_stats_value()],
  ]
  return (
    <section data-testid="bidding-practice-record" {...stylex.props(styles.card, styles.record)}>
      <div {...stylex.props(styles.recordHead)}>
        {/* The card's heading in the question's type (the human: 「Your bidding 这个怎么也是小字体呢」). */}
        <h2 {...stylex.props(typography.prompt, styles.verdictTitle)}>{m.bidpractice_stats_title()}</h2>
        <span data-testid="bidding-practice-answered" {...stylex.props(typography.appText, styles.facts)}>{m.bidpractice_stats_answered({ n: a.answered })}</span>
      </div>
      {rows.map(([kind, label]) => (
        <div key={kind} data-testid="bidding-practice-stat" data-kind={kind} {...stylex.props(styles.stat, styles.statLine)}>
          <span {...stylex.props(typography.appText, styles.para)}>{label}</span>
          <span {...stylex.props(typography.appBtnStrong, styles.para)}>{share(kind)}</span>
        </div>
      ))}
      {mistakes.length ? <Mistakes list={mistakes} onOpen={onOpen} /> : null}
    </section>
  )
}

/** Whole percentages that add up: the four kinds share out the rounded error rate by largest remainder, so they never
 *  sum to one more or less than "Wrong". */
function sharesOf(a: Analysis): Record<string, number> {
  const wrong = Math.round(((a.answered - a.right) / a.answered) * 100)
  const kinds = { passed: a.passed, played: a.played, game: a.game, value: a.value }
  const exact = Object.entries(kinds).map(([k, n]) => [k, (n / a.answered) * 100] as const)
  const out: Record<string, number> = { wrong, ...Object.fromEntries(exact.map(([k, x]) => [k, Math.floor(x)])) }
  let left = wrong - exact.reduce((sum, [k]) => sum + out[k], 0)
  for (const [k] of [...exact].sort((x, y) => (y[1] % 1) - (x[1] % 1))) {
    if (left <= 0) break
    if (kinds[k as keyof typeof kinds] === 0) continue
    out[k]++
    left--
  }
  return out
}

/** The mistakes, folded under one line with their count, so a long list stays out of the way (the human: 「mistakes 最好
 *  可以折叠，否则我怕太多」); opened, a button per question number. */
function Mistakes({ list, onOpen }: { list: number[]; onOpen: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <details data-testid="bidding-practice-mistakes" open={open} onToggle={(e) => setOpen(e.currentTarget.open)} {...stylex.props(styles.mistakes)}>
      <summary data-testid="bidding-practice-mistakes-head" {...stylex.props(styles.summary)}>
        <span {...stylex.props(typography.appText, styles.para)}>{m.bidpractice_mistakes()}</span>
        <span {...stylex.props(styles.summaryEnd)}>
          <span {...stylex.props(typography.appBtnStrong, styles.para)}>{list.length}</span>
          <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
        </span>
      </summary>
      <div {...stylex.props(styles.mistakeList)}>
        {list.map((k) => (
          <Btn key={k} testId="bidding-practice-mistake" tone="quiet" size="sm" onClick={() => onOpen(k)}>
            {String(k)}
          </Btn>
        ))}
      </div>
    </details>
  )
}

/** A game's calculation in words: "Hearts ♥", "With 2" (it opens a sentence), game 3, base 10. */
const calc = (g: Valued) => {
  const matadors = matadorLabel(g.with, g.count)
  return { game: contractName(g.contract), matadors: matadors[0].toUpperCase() + matadors.slice(1), level: g.count + 1, base: g.base }
}

const NULL_NAMES = { plain: 'Null', hand: 'Null Hand', ouvert: 'Null ouvert', handOuvert: 'Null ouvert Hand' } as const

/** A contract as offered: the suit's name with its sign, Grand, Null, or Pass. */
function contractLabel(c: ContractKey): string {
  if (c === 'pass') return m.bidpractice_pass()
  if (c === 'G') return 'Grand'
  if (c === 'N') return 'Null'
  return contractName({ kind: 'suit', trump: c })
}

/** The AI's contract by name, a Null by its kind. */
const answerName = (a: Answer) => (a.kind === 'null' ? NULL_NAMES[a.which] : a.kind === 'game' ? contractName(a.game.contract) : '')

const jacksOf = (hand: Card[]) => hand.filter((c) => c.rank === 'J').length

/** "no Ace", "1 Ace", "2 Aces" in words, as the cheat sheet says them. */
const acesWords = (n: number) => (n === 0 ? m.bidpractice_aces_none() : n === 1 ? m.bidpractice_aces_one() : m.bidpractice_aces_many({ n }))

/** The trumps of each suit in one line: "♣ 3 · ♠ 4 · ♥ 3 · ♦ 6". */
const trumpCounts = (hand: Card[]) =>
  tenCardValues(hand)
    .filter((v) => v.contract.kind === 'suit')
    .map((v) => `${v.contract.kind === 'suit' ? contractName(v.contract).split(' ').pop() : ''} ${v.trumps}`)
    .join(' · ')

/** Grand's count from the cheat sheet: a point for each Bube, each Ace, and forehand. */
const grandPoints = (q: Practice, hand: Card[]) => jacksOf(hand) + sideAces(hand) + (q.position === 0 ? 1 : 0)

/** Which rule of the cheat sheet a suit game meets, from its trumps and the Aces beside them — said only as far as the
 *  facts go: where the rules would not have played it, the line says so and that the AI plays it anyway. */
function suitRule(trumps: number, aces: number, jacks: number): string {
  if (trumps >= 6 && aces > 0) return m.bidpractice_rule_good({ trumps })
  if (trumps >= 6) return m.bidpractice_rule_six({ trumps })
  if (trumps === 5 && aces > 0) return m.bidpractice_rule_least()
  return m.bidpractice_rule_thin({ trumps, aces: acesWords(aces), jacks })
}

/** Why the AI passes, by the same rules. */
function passRule(trumps: number, aces: number): string {
  if (trumps <= 4) return m.bidpractice_rule_few({ trumps })
  if (aces === 0) return m.bidpractice_rule_noace({ trumps })
  return m.bidpractice_rule_border({ trumps })
}

/** "♣B missing" / "♣B ♠B held": the run a matador count is made of. */
function runOf(g: Valued): string {
  const run = trumpSequence(g.contract).slice(0, g.count).map(cardLabel).join(' ')
  return g.with ? m.bidpractice_run_held({ run }) : m.bidpractice_run_missing({ run })
}

/**
 * The explanation, as the two steps were asked (SKATGO-151, the human: 「为啥你现在这个解析反而还不如以前详细了？」): why this
 * contract — the trumps of every suit and the cheat sheet's rule it meets; why this bid — the matadors counted card by
 * card, game, the base; then what the player chose instead: the facts of that contract by the same rules, and what that
 * number would have needed.
 */
function explanation(q: Practice, contract: ContractKey, value: number | null): [string, string][] {
  const hand = practiceHand(q)
  const sol = solutionOf(q)
  const a = sol.answer
  const counts = trumpCounts(hand)
  const lines: [string, string][] = []
  if (a.kind === 'pass') {
    const best = bestSuit(hand)
    const trump = best.contract.kind === 'suit' ? best.contract.trump : undefined
    lines.push(['contract', `${m.bidpractice_ex_passes({ counts })} ${passRule(best.trumps, sideAces(hand, trump))}`])
  } else if (a.kind === 'null') {
    lines.push(['contract', `${m.bidpractice_ex_plays({ game: NULL_NAMES[a.which], counts })} ${m.bidpractice_rule_null()}`])
    lines.push(['value', m.bidpractice_ex_null({ game: NULL_NAMES[a.which], value: a.value })])
  } else {
    const g = a.game
    const jacks = jacksOf(hand)
    const rule = g.contract.kind === 'grand' ? m.bidpractice_rule_grand({ points: grandPoints(q, hand) }) : suitRule(g.trumps, sideAces(hand, g.contract.kind === 'suit' ? g.contract.trump : undefined), jacks)
    lines.push(['contract', `${m.bidpractice_ex_plays({ game: contractName(g.contract), counts })} ${rule}`])
    lines.push(['value', m.bidpractice_ex_value({ value: g.value, run: runOf(g), ...calc(g) })])
  }
  if (contract !== sol.contract && contract !== 'pass') {
    if (contract === 'N') lines.push(['yours', m.bidpractice_yours_null()])
    else if (contract === 'G') lines.push(['yours', m.bidpractice_yours_grand({ points: grandPoints(q, hand) })])
    else {
      const v = tenCardValues(hand).find((g) => g.contract.kind === 'suit' && g.contract.trump === contract)!
      const aces = sideAces(hand, contract)
      const verdict = v.trumps <= 4 ? m.bidpractice_rule_few_short() : v.trumps === 5 && aces === 0 ? m.bidpractice_rule_noace_short() : ''
      lines.push(['yours', `${m.bidpractice_yours_game({ game: contractName(v.contract), trumps: v.trumps, aces: acesWords(aces) })}${verdict ? ' ' + verdict : ''}`])
    }
  }
  if (value !== null && value !== sol.value && a.kind === 'game') {
    const level = value / a.game.base
    lines.push(['number', m.bidpractice_ex_number({ chosen: value, level, base: a.game.base, n: level - 1 })])
  }
  return lines
}

/** The third question for a guest (SKATGO-149, as the ladder's gate, SKATGO-112): why, and the way in, Clerk's window
 *  over the page; once signed in, the question is there. */
function Gate() {
  return (
    <section data-testid="bidding-practice-gate" {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.verdictText)}>
        <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{m.tricks_ladder_gate_title()}</p>
        <p {...stylex.props(typography.body, styles.para)}>{m.bidpractice_gate_text()}</p>
      </div>
      <div {...stylex.props(styles.actions)}>
        <SignInButton mode="modal">
          <Btn testId="bidding-practice-sign-in" tone="go" onClick={() => track('sign_in_clicked', { at: 'bidding' })}>
            {m.tricks_ladder_gate_button()}
          </Btn>
        </SignInButton>
      </div>
    </section>
  )
}

const styles = stylex.create({
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
  head: { display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.x12 },
  title: { margin: 0, color: color.navy },
  progress: { color: color.slate },
  seat: { margin: 0, color: color.navy },
  seatLine: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.x12 },
  sheetLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x6,
    padding: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  step: { paddingTop: space.x16, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  sheetBody: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  sheetSection: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  sheetList: { margin: 0, paddingLeft: space.x20, color: color.text },
  sheetTable: { borderCollapse: 'collapse', color: color.text },
  sheetCell: { paddingBlock: space.x2, paddingRight: space.x12, verticalAlign: 'baseline', borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  sheetPoints: { whiteSpace: 'nowrap', textAlign: 'right' },
  lead: { margin: 0, color: color.slate },
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
  result: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  verdict: { display: 'flex', alignItems: 'flex-start', gap: space.x10 },
  verdictIcon: { display: 'flex', flexShrink: 0, paddingTop: space.x2 },
  good: { color: color.good },
  verdictText: { display: 'flex', flexDirection: 'column', gap: space.x8, minWidth: 0 },
  verdictTitle: { margin: 0, color: color.navy },
  para: { margin: 0, color: color.text },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  record: { gap: space.x12 },
  recordHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  stat: { display: 'flex', flexDirection: 'column', gap: space.x2, paddingTop: space.x12, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  statLine: { display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  mistakes: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x12, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  mistakeList: { display: 'flex', flexWrap: 'wrap', gap: space.x8, paddingTop: space.x8 },
  summary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x12,
    cursor: 'pointer',
    listStyleType: 'none',
    color: color.navy,
    '::-webkit-details-marker': { display: 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  summaryEnd: { display: 'inline-flex', alignItems: 'center', gap: space.x8 },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
