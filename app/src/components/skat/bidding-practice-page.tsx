import { SignInButton } from '@clerk/tanstack-react-start'
import * as stylex from '@stylexjs/stylex'
import { CircleCheck, CircleX } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type Card, sortHand } from '~/lib/skat/cards'
import { contractName, matadorLabel, roleName } from '~/lib/skat/i18n'
import { type Answer, PRACTICE_FREE, PRACTICE_QUESTIONS, type Valued, answerOf, gameOf, optionsOf, practiceHand, questionAt } from '~/lib/skat/bidding/practice'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { Choice } from './exercises'
import { Btn, Panel, Pill, Rich } from './ui'

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
  const account = useAccount()
  const [n, setN] = useState<number | null>(null)
  const [result, setResult] = useState<'right' | 'wrong' | null>(null)
  useEffect(() => setN(readNumber()), [])
  const locked = n !== null && n > PRACTICE_FREE && account === null
  const go = () => {
    const after = (n ?? 1) + 1
    saveNumber(after)
    setResult(null)
    setN(after)
  }
  const q = n === null ? null : questionAt(n)
  return (
    <div data-testid="bidding-practice" data-question={n ?? ''} data-result={result ?? ''} {...stylex.props(styles.column)}>
      <nav {...stylex.props(styles.top)}>
        <Pill>{m.bidpractice_kicker({ n: n ?? 1, count: PRACTICE_QUESTIONS.length })}</Pill>
      </nav>
      <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.bidpractice_title()}</h1>
      {q === null || account === undefined ? null : locked ? (
        <Gate />
      ) : (
        <Question key={n} hand={practiceHand(q)} position={POSITIONS[q.position]} bid={q.bid} onAnswer={setResult} result={result} onNext={go} />
      )}
    </div>
  )
}

function Question({ hand, position, bid, result, onAnswer, onNext }: { hand: Card[]; position: (typeof POSITIONS)[number]; bid: number; result: 'right' | 'wrong' | null; onAnswer: (r: 'right' | 'wrong') => void; onNext: () => void }) {
  const options = optionsOf(hand, bid)
  const answer = answerOf(hand, bid)!
  return (
    <>
      <section {...stylex.props(styles.card)}>
        <div data-testid="bidding-practice-situation" {...stylex.props(styles.situation)}>
          <p {...stylex.props(typography.panelLabel, styles.facts)}>{m.tricks_sit_bidder({ position: roleName(position) })}</p>
          <CardRowView row={{ label: m.tricks_row_cards(), cards: sortHand(hand, null) }} />
        </div>
        <Choice
          step={{ kind: 'choice', prompt: m.bidpractice_prompt(), options: options.map((v) => (v === 0 ? m.bidpractice_pass() : String(v))), answer: options.indexOf(bid < 18 ? 0 : bid), explain: '' }}
          once
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
                  <Rich text={answerLine(answer)} />
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

/** A game's calculation in words: "Hearts ♥", "with 2", game 3, base 10. */
const calc = (g: Valued) => ({ game: contractName(g.contract), matadors: matadorLabel(g.with, g.count), level: g.count + 1, base: g.base })

const NULL_NAMES = { plain: 'Null', hand: 'Null Hand', ouvert: 'Null ouvert', handOuvert: 'Null ouvert Hand' } as const

/** The AI's answer and why it is that number. */
function answerLine(a: Answer): string {
  if (a.kind === 'pass') return m.bidpractice_answer_pass()
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
        <p {...stylex.props(typography.body, styles.para)}>{m.bidpractice_gate_text({ n: PRACTICE_FREE })}</p>
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
  top: { display: 'flex', alignItems: 'center', gap: space.x12 },
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
  result: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  verdict: { display: 'flex', alignItems: 'flex-start', gap: space.x10 },
  verdictIcon: { display: 'flex', flexShrink: 0, paddingTop: space.x2 },
  good: { color: color.good },
  bad: { color: color.bad },
  verdictText: { display: 'flex', flexDirection: 'column', gap: space.x8, minWidth: 0 },
  verdictTitle: { margin: 0, color: color.navy },
  para: { margin: 0, color: color.text },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
})
