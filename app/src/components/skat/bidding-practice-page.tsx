import { SignInButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp, CircleCheck, CircleX } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type Card, sortHand } from '~/lib/skat/cards'
import { contractName, matadorLabel, roleName } from '~/lib/skat/i18n'
import { type Analysis, type Answer, PRACTICE_FREE, PRACTICE_QUESTIONS, type Valued, analysisOf, answerOf, gameOf, mistakesOf, optionsOf, practiceHand, questionAt, questionId, rightAnswer, tenCardValues } from '~/lib/skat/bidding/practice'
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
import { Btn, Panel, Rich } from './ui'

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
          hand={practiceHand(q)}
          position={POSITIONS[q.position]}
          bid={q.bid}
          onChoose={(chosen) => answer(questionId(q), chosen, chosen === rightAnswer(q))}
          onAnswer={setResult}
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

function Question({ hand, position, bid, result, onChoose, onAnswer, onNext }: { hand: Card[]; position: (typeof POSITIONS)[number]; bid: number; result: 'right' | 'wrong' | null; onChoose: (chosen: number) => void; onAnswer: (r: 'right' | 'wrong') => void; onNext: () => void }) {
  const options = optionsOf(hand, bid)
  const answer = answerOf(hand, bid)!
  const best = tenCardValues(hand).filter((v) => v.contract.kind === 'suit').sort((a, b) => b.trumps - a.trumps)[0]
  return (
    <>
      <section {...stylex.props(styles.card)}>
        <div data-testid="bidding-practice-situation" {...stylex.props(styles.situation)}>
          {/* As the question below it (the human: 「坐哪个位置的那行字，不要小字，要和how high do you bid同一字体」). */}
          <p {...stylex.props(typography.prompt, styles.seat)}>{m.tricks_sit_bidder({ position: roleName(position) })}</p>
          {/* As big as the hand at the table, in one row (the ladder's, SKATGO-109: 「最好和手牌一样大」). */}
          <Fan testId="bidding-practice-hand" cards={sortHand(hand, null)} size="lg" row />
        </div>
        <Choice
          step={{ kind: 'choice', prompt: m.bidpractice_prompt(), options: options.map((v) => (v === 0 ? m.bidpractice_pass() : String(v))), answer: options.indexOf(bid < 18 ? 0 : bid), explain: '' }}
          once
          onChoose={(i) => onChoose(options[i])}
          onSolved={() => onAnswer('right')}
          onMistake={() => onAnswer('wrong')}
        />
      </section>
      {result ? (
        <div data-testid="bidding-practice-result" data-result={result} {...stylex.props(styles.result)}>
          <Panel tone={result === 'right' ? 'good' : 'bad'}>
            <div {...stylex.props(styles.verdict)}>
              <span aria-hidden="true" {...stylex.props(styles.verdictIcon, result === 'right' ? styles.good : styles.bad)}>
                {result === 'right' ? <CircleCheck size={icon.inline} strokeWidth={icon.outline} /> : <CircleX size={icon.inline} strokeWidth={icon.outline} />}
              </span>
              <div {...stylex.props(styles.verdictText)}>
                <p {...stylex.props(typography.optionTitle, styles.verdictTitle)}>{result === 'right' ? m.tricks_ex_right() : m.tricks_ex_wrong()}</p>
                <p data-testid="bidding-practice-answer" {...stylex.props(typography.body, styles.para)}>
                  <Rich text={answerLine(answer, best)} />
                </p>
                {options
                  .filter((v) => v !== 0 && v !== bid)
                  .map((v) => {
                    const g = gameOf(hand, v)
                    return g ? (
                      <p key={v} data-testid="bidding-practice-option" {...stylex.props(typography.body, styles.para)}>
                        <Rich text={m.bidpractice_option({ value: v, ...calc(g) })} />
                      </p>
                    ) : null
                  })}
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
    </>
  )
}

/**
 * The player's bidding so far (SKATGO-150, the human: 「超叫还是不敢叫还是叫错等等的分析……最好有个比率分析」, 「不要花哨，
 * 不要垃圾重复文字」): how many answered, then the error rate, overbid and underbid as shares of the first answers, each kind of
 * mistake with its two causes counted; under them the mistakes not yet put right, by number, each opening its question.
 */
/** A wrong kind's causes that happened, each with its count: "Game too high: 3". */
const causes = (...parts: [number, (p: { n: number }) => string][]) =>
  parts
    .filter(([n]) => n > 0)
    .map(([n, say]) => say({ n }))
    .join(' · ') || null

function Record({ a, mistakes, onOpen }: { a: Analysis; mistakes: number[]; onOpen: (n: number) => void }) {
  const pct = new Intl.NumberFormat(getLocale(), { style: 'percent' })
  const share = (k: number) => pct.format(k / a.answered)
  const rows: [string, string, number, string | null][] = [
    // The error rate first (「用户的错误率」), then where the mistakes went.
    ['wrong', m.bidpractice_stats_wrong(), a.answered - a.right, null],
    ['over', m.bidpractice_stats_over(), a.over.pass + a.over.game, causes([a.over.pass, m.bidpractice_cause_bid], [a.over.game, m.bidpractice_cause_high])],
    ['under', m.bidpractice_stats_under(), a.under.pass + a.under.game, causes([a.under.pass, m.bidpractice_cause_pass], [a.under.game, m.bidpractice_cause_low])],
  ]
  return (
    <section data-testid="bidding-practice-record" {...stylex.props(styles.card, styles.record)}>
      <div {...stylex.props(styles.recordHead)}>
        {/* The card's heading in the question's type (the human: 「Your bidding 这个怎么也是小字体呢」). */}
        <h2 {...stylex.props(typography.prompt, styles.verdictTitle)}>{m.bidpractice_stats_title()}</h2>
        <span data-testid="bidding-practice-answered" {...stylex.props(typography.appText, styles.facts)}>{m.bidpractice_stats_answered({ n: a.answered })}</span>
      </div>
      {rows.map(([kind, label, count, detail]) => (
        <div key={kind} data-testid="bidding-practice-stat" data-kind={kind} {...stylex.props(styles.stat)}>
          <div {...stylex.props(styles.statLine)}>
            <span {...stylex.props(typography.appText, styles.para)}>{label}</span>
            <span {...stylex.props(typography.appBtnStrong, styles.para)}>{share(count)}</span>
          </div>
          {detail ? <span {...stylex.props(typography.appText, styles.facts)}>{detail}</span> : null}
        </div>
      ))}
      {mistakes.length ? <Mistakes list={mistakes} onOpen={onOpen} /> : null}
    </section>
  )
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

/** A game's calculation in words: "Hearts ♥", how many trumps the ten cards hold in it, "with 2", game 3, base 10. */
const calc = (g: Valued) => ({ game: contractName(g.contract), trumps: g.trumps, matadors: matadorLabel(g.with, g.count), level: g.count + 1, base: g.base })

const NULL_NAMES = { plain: 'Null', hand: 'Null Hand', ouvert: 'Null ouvert', handOuvert: 'Null ouvert Hand' } as const

/** The AI's answer and why it is that number; a pass names the hand's best trump suit and how short it is. */
function answerLine(a: Answer, best: Valued): string {
  if (a.kind === 'pass') return m.bidpractice_answer_pass({ game: contractName(best.contract), trumps: best.trumps })
  if (a.kind === 'null') return m.bidpractice_answer_null({ value: a.value, game: NULL_NAMES[a.which] })
  return m.bidpractice_answer_game({ value: a.game.value, ...calc(a.game) })
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
          <Btn testId="bidding-practice-sign-in" tone="go">
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
  bad: { color: color.bad },
  verdictText: { display: 'flex', flexDirection: 'column', gap: space.x8, minWidth: 0 },
  verdictTitle: { margin: 0, color: color.navy },
  para: { margin: 0, color: color.text },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  record: { gap: space.x12 },
  recordHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  stat: { display: 'flex', flexDirection: 'column', gap: space.x2, paddingTop: space.x12, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  statLine: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
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
