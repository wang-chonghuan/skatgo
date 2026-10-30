import { SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { CircleCheck, LayoutGrid } from 'lucide-react'
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
  type GameKey,
  type Practice,
  type Valued,
  analysisOf,
  bestSuit,
  mistakesOf,
  practiceHand,
  questionAt,
  questionId,
  rightAttempt,
  routineOf,
  sideAces,
  solutionOf,
  tenCardValues,
  valuedOf,
  valueOptions,
} from '~/lib/skat/bidding/practice'
import { forgetOld, useBiddingRecord } from '~/lib/skat/bidding/record'
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

/** Where this browser has got to (the question's number); nothing stored is the first. Since SKATGO-159 a new name: the
 *  questions started over. */
const STORE = 'skatgo.bidding-practice.v2'
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
  useEffect(() => {
    forgetOld()
    setN(readNumber())
  }, [])
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
  // The questions in order (SKATGO-156, the human: 「最好不要让用户能选择后面的题，要从1题开始按顺序做，但是能回到之前的题」):
  // the run's own question and any before it can be opened, none after. Leaving an answered question moves the run on,
  // so coming back is the next question.
  const reached = redo === null && result ? n + 1 : n
  const open = (k: number) => {
    setList(false)
    if (k > reached) return
    if (redo === null && result) advance()
    setRedo(k === reached ? null : k)
    setResult(null)
  }
  const [list, setList] = useState(false)
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
        {/* Every question by number, beside the place in the run (SKATGO-156): the header's round white button. */}
        <button type="button" aria-label={m.bidpractice_all()} title={m.bidpractice_all()} data-testid="bidding-practice-all" onClick={() => setList(true)} {...stylex.props(styles.round)}>
          <LayoutGrid size={icon.gear} strokeWidth={icon.outline} />
        </button>
      </div>
      {list ? <AllQuestions shown={shown} reached={reached} wrong={mistakes} onOpen={open} onClose={() => setList(false)} /> : null}
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
      {analysis.answered ? <Record a={analysis} /> : null}
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
            {/* No icon, on the seat's line on a phone too (SKATGO-156, the human: 「bidding cheat sheet前面的图标去掉，要和you sit
                in forehand在同一行」). */}
            <button type="button" data-testid="bidding-practice-sheet" aria-label={cheatSheet().title} onClick={() => setSheet(true)} {...stylex.props(typography.appLink, styles.sheetLink)}>
              {/* A phone has room for the short name beside the seat; the dialog keeps the full one. */}
              <span {...stylex.props(styles.wide)}>{cheatSheet().title}</span>
              <span {...stylex.props(styles.narrow)}>{m.bidpractice_sheet_short()}</span>
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
 * 不要垃圾重复文字」): how many answered, then right, the contract wrong and the bid wrong as shares of the first attempts
 * (SKATGO-154); under them the mistakes not yet put right, by number, each opening its question.
 */
function Record({ a }: { a: Analysis }) {
  // Three rows, one per outcome of the two steps (SKATGO-154, the human: 「问题是item太多了，名字莫名其妙，百分比倒没啥」):
  // right, the contract wrong (step 1: played, passed or the wrong game), the bid wrong (step 2), as shares that add up.
  const pct = new Intl.NumberFormat(getLocale(), { style: 'percent' })
  const shares = sharesOf([a.right, a.passed + a.played + a.game, a.value], a.answered)
  const rows: [string, string, number][] = [
    ['right', m.bidpractice_stats_right(), shares[0]],
    ['contract', m.bidpractice_stats_contract(), shares[1]],
    ['value', m.bidpractice_stats_value(), shares[2]],
  ]
  return (
    <section data-testid="bidding-practice-record" {...stylex.props(styles.card, styles.record)}>
      <div {...stylex.props(styles.recordHead)}>
        {/* The card's heading in the question's type (the human: 「Your bidding 这个怎么也是小字体呢」). */}
        <h2 {...stylex.props(typography.prompt, styles.verdictTitle)}>{m.bidpractice_stats_title()}</h2>
        <span data-testid="bidding-practice-answered" {...stylex.props(typography.appText, styles.facts)}>{m.bidpractice_stats_answered({ n: a.answered })}</span>
      </div>
      {rows.map(([kind, label, share]) => (
        <div key={kind} data-testid="bidding-practice-stat" data-kind={kind} {...stylex.props(styles.stat, styles.statLine)}>
          <span {...stylex.props(typography.appText, styles.para)}>{label}</span>
          <span {...stylex.props(typography.appBtnStrong, styles.para)}>{pct.format(share / 100)}</span>
        </div>
      ))}
    </section>
  )
}

/** Whole percentages of `total` that add up to 100, by largest remainder. */
function sharesOf(counts: number[], total: number): number[] {
  const exact = counts.map((n) => (n / total) * 100)
  const out = exact.map(Math.floor)
  let left = 100 - out.reduce((x, y) => x + y, 0)
  for (const i of exact.map((x, i) => [x % 1, i] as const).sort((x, y) => y[0] - x[0]).map(([, i]) => i)) {
    if (left <= 0) break
    out[i]++
    left--
  }
  return out
}

/**
 * Every question by number, in the site's dialog as the cheat sheet (SKATGO-156, the human: 「x/600 旁边要有一个小的图标按钮，
 * 点击后弹modal窗，显示所有的题的id，做错的显示为红色。点id了可以进入那一题」): the Skat-Tricks levels' tiles — the one
 * shown ringed `go`, a mistake not yet put right on `badSoft` in `bad`, the ones not reached yet faded and shut; the list
 * scrolls inside the dialog. It replaces the folded "Mistakes" (SKATGO-150).
 */
function AllQuestions({ shown, reached, wrong, onOpen, onClose }: { shown: number; reached: number; wrong: number[]; onOpen: (n: number) => void; onClose: () => void }) {
  const mistakes = new Set(wrong)
  return (
    <Modal title={m.bidpractice_all()} onClose={onClose} testId="bidding-practice-all-dialog">
      <ol data-testid="bidding-practice-all-list" {...stylex.props(styles.grid)}>
        {PRACTICE_QUESTIONS.map((_, i) => {
          const k = i + 1
          const shut = k > reached
          const missed = mistakes.has(k)
          return (
            <li key={k} {...stylex.props(styles.level)}>
              <button
                type="button"
                data-testid="bidding-practice-number"
                data-number={k}
                data-mark={missed ? 'missed' : undefined}
                aria-current={k === shown ? 'step' : undefined}
                disabled={shut}
                onClick={() => onOpen(k)}
                {...stylex.props(typography.smallBold, styles.levelTile, missed && styles.levelMissed, shut && styles.levelShut, k === shown && styles.levelNext)}
              >
                {k}
              </button>
            </li>
          )
        })}
      </ol>
    </Modal>
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
function suitRule(trumps: number, aces: number): string {
  if (trumps >= 6 && aces > 0) return m.bidpractice_rule_good({ trumps })
  if (trumps >= 6) return m.bidpractice_rule_six({ trumps })
  if (trumps === 5 && aces > 0) return m.bidpractice_rule_least()
  return m.bidpractice_rule_thin({ trumps, aces: acesWords(aces) })
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

/** The routine's game by name, for the explanation: "Spades ♠". */
const keyName = (k: GameKey) => (k === 'G' ? 'Grand' : contractName({ kind: 'suit', trump: k }))

/** The AI's chance at each number offered, and at the bid right above a stop below the count: "24 — 70% · 27 — 58% ·
 *  48 — 47% · 60 — 4%". */
const oddsLine = (q: Practice) =>
  [...(q.options ?? []).map((o, i): [number, number] => [o, q.odds?.[i] ?? 0]), ...(q.above && !q.options?.includes(q.above[0]) ? [q.above] : [])]
    .sort((a, b) => a[0] - b[0])
    .map(([o, p]) => `${o} — ${p}%`)
    .join(' · ')

/**
 * The explanation, as the two steps were asked (SKATGO-151, the human: 「为啥你现在这个解析反而还不如以前详细了？」): why this
 * contract — the trumps of every suit and the cheat sheet's rule it meets; why this bid — the matadors counted card by
 * card, game, the base; then what the player chose instead: the facts of that contract by the same rules, and what that
 * number would have needed. Since SKATGO-159 where the rules of thumb fail the AI's own chances say why (the human
 * agreed to 「AI 在各价位的胜率」; never by SkatZero's name, SKATGO-146): of the routine's game when it passes, of the longest suit when it plays another, of
 * each number offered when it stops below the count.
 */
function explanation(q: Practice, contract: ContractKey, value: number | null): [string, string][] {
  const hand = practiceHand(q)
  const sol = solutionOf(q)
  const a = sol.answer
  const counts = trumpCounts(hand)
  const routine = routineOf(hand)
  const at = q.bid || 18
  const lines: [string, string][] = []
  if (a.kind === 'pass') {
    const best = bestSuit(hand)
    const trump = best.contract.kind === 'suit' ? best.contract.trump : undefined
    const rk = routine.contract
    const why =
      rk !== 'pass' && rk !== 'N' && q.games?.[rk] !== undefined
        ? m.bidpractice_rule_routine_pass({ game: keyName(rk), chance: q.games[rk]! })
        : passRule(best.trumps, sideAces(hand, trump))
    lines.push(['contract', `${m.bidpractice_ex_passes({ counts })} ${why}`])
  } else if (a.kind === 'null') {
    lines.push(['contract', `${m.bidpractice_ex_plays({ game: NULL_NAMES[a.which], counts })} ${m.bidpractice_rule_null()}`])
    lines.push(['value', m.bidpractice_ex_null({ game: NULL_NAMES[a.which], value: a.value })])
  } else {
    const g = a.game
    const key = sol.contract as GameKey
    const rule = g.contract.kind === 'grand' ? m.bidpractice_rule_grand({ points: grandPoints(q, hand) }) : suitRule(g.trumps, sideAces(hand, g.contract.kind === 'suit' ? g.contract.trump : undefined))
    // The AI's own chance is in the line of chances below; here only the longest suit's beside it, when it plays another.
    const rk = routine.contract
    const longest = rk !== 'pass' && rk !== 'N' && rk !== key && q.games?.[rk] !== undefined ? ` ${m.bidpractice_longest_at({ game: keyName(rk), bid: at, chance: q.games[rk]! })}` : ''
    lines.push(['contract', `${m.bidpractice_ex_plays({ game: contractName(g.contract), counts })} ${rule}${longest}`])
    if (q.bid === g.value) lines.push(['value', m.bidpractice_ex_value({ value: g.value, run: runOf(g), ...calc(g) })])
    else {
      // The AI stops below the count — a pickup game is never bid past it, only a Hand game, which is not asked — and
      // only ever on a "without" hand, whose run a Bube in the skat shortens.
      const step = q.above ? m.bidpractice_ex_under({ bid: q.bid }) : m.bidpractice_ex_border()
      lines.push(['value', `${step} ${m.bidpractice_ex_count({ value: g.value, run: runOf(g), ...calc(g) })}`])
    }
    if (q.odds) lines.push(['odds', m.bidpractice_ex_odds({ game: contractName(g.contract), odds: oddsLine(q) })])
  }
  if (contract !== sol.contract && contract !== 'pass') {
    const chance = contract !== 'N' && q.games?.[contract] !== undefined ? ` ${m.bidpractice_chance_at({ bid: at, chance: q.games[contract]! })}` : ''
    if (contract === 'N') lines.push(['yours', m.bidpractice_yours_null()])
    else if (contract === 'G') lines.push(['yours', `${m.bidpractice_yours_grand({ points: grandPoints(q, hand) })}${chance}`])
    else {
      const v = valuedOf(hand, contract)
      const aces = sideAces(hand, contract)
      const verdict = v.trumps <= 4 ? m.bidpractice_rule_few_short() : v.trumps === 5 && aces === 0 ? m.bidpractice_rule_noace_short() : ''
      lines.push(['yours', `${m.bidpractice_yours_game({ game: contractName(v.contract), trumps: v.trumps, aces: acesWords(aces) })}${verdict ? ' ' + verdict : ''}${chance}`])
    }
  }
  // A wrong number for a game bid at its count is what that number would have needed; away from the count, the
  // chances above already say it.
  if (value !== null && value !== sol.value && a.kind === 'game' && q.bid === a.game.value && value % a.game.base === 0) {
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
  seat: { margin: 0, minWidth: 0, color: color.navy },
  wide: { display: { default: 'inline', [bp.phone]: 'none' } },
  narrow: { display: { default: 'none', [bp.phone]: 'inline' } },
  seatLine: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x8 },
  sheetLink: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    whiteSpace: 'nowrap',
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
  // The header's round white button (frame.tsx's gear), beside the place in the run (SKATGO-156).
  round: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexShrink: 0,
    width: { default: dims.control, [bp.phone]: space.x32 },
    height: { default: dims.control, [bp.phone]: space.x32 },
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: color.surface,
    color: color.navy,
    boxShadow: elev.option,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  // Every question as the Skat-Tricks levels' tiles (tricks-page.tsx), in the dialog (SKATGO-156).
  grid: { listStyleType: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: dims.backChoices, gap: space.x8 },
  level: { margin: 0 },
  levelTile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: dims.iconButton,
    boxSizing: 'border-box',
    borderRadius: radii.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: { default: color.hairline, ':hover': color.go },
    backgroundColor: color.page,
    color: color.navy,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  levelMissed: { backgroundColor: color.badSoft, borderColor: color.badSoft, color: color.bad },
  levelShut: { color: color.slate, borderColor: color.hairline, cursor: 'default' },
  levelNext: { borderColor: color.go },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
