import * as stylex from '@stylexjs/stylex'
import { motion, useAnimate } from 'motion/react'
import { type ReactNode, useEffect, useState } from 'react'

import { type Card, cardId, effectiveSuit, legalPlays, sameCard, sortHand } from '~/lib/skat/cards'
import { contractName, ledName } from '~/lib/skat/i18n'
import { sameSet } from '~/lib/skat/lessons/drills'
import type { ChoiceStep, OrderStep, PickStep, PlayStep, TeachStep } from '~/lib/skat/lessons/types'
import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'
import { CardRowView, Fan } from './card-row'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Rich } from './ui'

// One component per kind of step. Each asks, judges with the rules engine, and reports back through
// two callbacks: `onMistake` (counted towards the lesson's stars) and `onSolved` (unlocks
// "continue"). A wrong answer never advances and never ends the step — the learner tries again with
// the reason in front of them.

// `solvedBefore`: the learner already solved this step and has come back to it (SKATGO-3). It opens in
// its solved state — the right answer and the explanation showing — so looking again costs nothing
// and cannot add a mistake. It is read once, as the initial state.
export type StepCallbacks = { onSolved: () => void; onMistake: () => void; solvedBefore?: boolean }

export function Teach({ step }: { step: TeachStep }) {
  return (
    <div {...stylex.props(styles.stack)}>
      <h2 {...stylex.props(styles.title)}>{step.title}</h2>
      {step.body.map((p, i) => (
        <p key={i} {...stylex.props(styles.para)}><Rich text={p} /></p>
      ))}
      {step.rows?.map((row, i) => <CardRowView key={i} row={row} />)}
      {step.tip ? (
        <Panel tone="tip"><p {...stylex.props(styles.para)}>💡 <Rich text={step.tip} /></p></Panel>
      ) : null}
    </div>
  )
}

/** Shakes its children each time `nonce` changes — the wordless "no" after a wrong answer. */
function Shake({ nonce, children }: { nonce: number; children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (nonce > 0) void animate(scope.current, { x: [0, -9, 9, -6, 6, 0] }, { duration: 0.35 })
  }, [nonce, animate, scope])
  return <div ref={scope}>{children}</div>
}

function Feedback({ state, good, bad }: { state: 'idle' | 'wrong' | 'right'; good: string; bad: string }) {
  if (state === 'idle') return null
  return (
    <Panel tone={state === 'right' ? 'good' : 'bad'}>
      <p data-testid={state === 'right' ? 'skat-feedback-right' : 'skat-feedback-wrong'} {...stylex.props(styles.para)}>
        {state === 'right' ? '✅ ' : '❌ '}
        <Rich text={state === 'right' ? good : bad} />
      </p>
    </Panel>
  )
}

export function Choice({ step, onSolved, onMistake, solvedBefore }: { step: ChoiceStep } & StepCallbacks) {
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState(!!solvedBefore)
  const [nonce, setNonce] = useState(0)

  function choose(i: number) {
    if (right) return
    if (i === step.answer) {
      setRight(true)
      onSolved()
      return
    }
    if (!wrong.includes(i)) setWrong([...wrong, i])
    setNonce((n) => n + 1)
    onMistake()
  }

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(styles.prompt)}><Rich text={step.prompt} /></p>
      {step.rows?.map((row, i) => <CardRowView key={i} row={row} />)}
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.options)}>
          {step.options.map((o, i) => (
            <button
              key={i}
              type="button"
              data-testid="skat-option"
              data-correct={String(i === step.answer)}
              disabled={right || wrong.includes(i)}
              onClick={() => choose(i)}
              {...stylex.props(styles.option, right && i === step.answer && styles.optionRight, wrong.includes(i) && styles.optionWrong)}
            >
              <Rich text={o} />
            </button>
          ))}
        </div>
      </Shake>
      <Feedback state={right ? 'right' : wrong.length ? 'wrong' : 'idle'} good={step.explain} bad={step.hint ?? m.ex_choice_wrong()} />
    </div>
  )
}

export function Pick({ step, onSolved, onMistake, solvedBefore }: { step: PickStep } & StepCallbacks) {
  const [chosen, setChosen] = useState<Card[]>([])
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [nonce, setNonce] = useState(0)
  const has = (list: Card[], c: Card) => list.some((d) => sameCard(c, d))

  function judge(selection: Card[]) {
    if (sameSet(selection, step.correct)) {
      setState('right')
      onSolved()
    } else {
      setState('wrong')
      setNonce((n) => n + 1)
      onMistake()
    }
  }

  function tap(card: Card) {
    if (state === 'right') return
    if (step.single) {
      setChosen([card])
      judge([card])
      return
    }
    setState('idle')
    setChosen((c) => (has(c, card) ? c.filter((d) => !sameCard(d, card)) : [...c, card]))
  }

  const verdicts =
    state === 'idle'
      ? []
      : chosen.map((card) => ({ card, verdict: has(step.correct, card) ? ('good' as const) : ('bad' as const) }))

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(styles.prompt)}><Rich text={step.prompt} /></p>
      {step.context ? <p {...stylex.props(styles.context)}><Rich text={step.context} /></p> : null}
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.felt)}>
          <Fan testId="skat-pick" cards={step.cards} size="lg" onPick={tap} answer={step.correct} selected={state === 'right' ? [] : chosen} verdicts={verdicts} glow={state === 'right' ? step.correct : []} />
        </div>
      </Shake>
      {step.single ? null : (
        <div {...stylex.props(styles.centerRow)}>
          <Btn testId="skat-check" tone="felt" disabled={chosen.length === 0 || state === 'right'} onClick={() => judge(chosen)}>
            {m.ex_pick_check({ n: chosen.length })}
          </Btn>
        </div>
      )}
      <Feedback
        state={state}
        good={step.explain}
        bad={step.hint ?? (step.single ? m.ex_pick_wrong_single() : m.ex_pick_wrong_multi())}
      />
    </div>
  )
}

export function Order({ step, onSolved, onMistake, solvedBefore }: { step: OrderStep } & StepCallbacks) {
  const [picked, setPicked] = useState<Card[]>(solvedBefore ? step.correct : [])
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [nonce, setNonce] = useState(0)

  function tap(card: Card) {
    if (state === 'right' || picked.some((c) => sameCard(c, card))) return
    const expected = step.correct[picked.length]
    if (!sameCard(expected, card)) {
      // A wrong tap is refused on the spot and the sequence so far stands: the learner is corrected
      // at the exact card they got wrong, not after five taps with no idea which one it was.
      setState('wrong')
      setNonce((n) => n + 1)
      onMistake()
      return
    }
    const nextPicked = [...picked, card]
    setPicked(nextPicked)
    if (nextPicked.length === step.correct.length) {
      setState('right')
      onSolved()
    } else setState('idle')
  }

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(styles.prompt)}><Rich text={step.prompt} /></p>
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.felt)}>
          <Fan
            testId="skat-order"
            cards={step.cards}
            sequence={step.correct}
            size="lg"
            onPick={tap}
            selected={picked}
            badges={picked.map((card, i) => ({ card, text: String(i + 1) }))}
          />
        </div>
      </Shake>
      <Feedback state={state} good={step.explain} bad={`${m.ex_order_wrong({ n: picked.length + 1 })}${step.hint}`} />
    </div>
  )
}

export function Play({ step, onSolved, onMistake, solvedBefore }: { step: PlayStep } & StepCallbacks) {
  const legal = legalPlays(step.hand, step.trick, step.contract)
  const [played, setPlayed] = useState<Card | null>(solvedBefore ? (step.best ?? legal)[0] : null)
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [why, setWhy] = useState('')
  const [nonce, setNonce] = useState(0)
  const hand = sortHand(step.hand, step.contract).filter((c) => !played || !sameCard(c, played))

  function tap(card: Card) {
    if (state === 'right') return
    const isLegal = legal.some((c) => sameCard(c, card))
    if (!isLegal) {
      const led = effectiveSuit(step.trick[0], step.contract)
      setWhy(m.ex_play_illegal({ led: ledName(led) }) + (card.rank === 'J' && step.contract.kind !== 'null' ? m.ex_play_illegal_jack() : ''))
    } else if (step.best && !step.best.some((c) => sameCard(c, card))) {
      setWhy(step.whyNot ?? m.ex_play_not_best())
    } else {
      setPlayed(card)
      setState('right')
      onSolved()
      return
    }
    setState('wrong')
    setNonce((n) => n + 1)
    onMistake()
  }

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(styles.prompt)}><Rich text={step.prompt} /></p>
      <div {...stylex.props(styles.felt)}>
        <div {...stylex.props(styles.trickRow)}>
          <span {...stylex.props(styles.feltLabel)}>{m.ex_on_table({ contract: contractName(step.contract) })}</span>
          <div {...stylex.props(styles.trickCards)}>
            {step.trick.length === 0 && !played ? <span {...stylex.props(styles.feltLabel)}>{m.ex_you_lead()}</span> : null}
            {step.trick.map((c, i) => (
              <div key={cardId(c)} {...stylex.props(styles.trickCell)}>
                <PlayingCard card={c} size="md" />
                <span {...stylex.props(styles.feltLabel)}>{step.trickBy?.[i] ?? ''}</span>
              </div>
            ))}
            {played ? (
              <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} {...stylex.props(styles.trickCell)}>
                <PlayingCard card={played} size="md" glow />
                <span {...stylex.props(styles.feltLabel)}>{m.name_you()}</span>
              </motion.div>
            ) : null}
          </div>
        </div>
        <Shake nonce={nonce}>
          <Fan testId="skat-play-hand" cards={hand} size="lg" onPick={tap} legal={state === 'right' ? undefined : legal} answer={step.best ?? legal} />
        </Shake>
      </div>
      <Feedback state={state} good={step.explain} bad={why} />
    </div>
  )
}

const styles = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', gap: 16 },
  title: { margin: 0, fontSize: { default: 26, '@media (max-width: 480px)': 22 }, fontWeight: 800, lineHeight: 1.25, color: skat.ink, fontFamily: '"Fraunces", "Songti SC", "Noto Serif SC", serif' },
  para: { margin: 0, fontSize: 16, lineHeight: 1.75, color: skat.ink },
  prompt: { margin: 0, fontSize: { default: 19, '@media (max-width: 480px)': 17 }, lineHeight: 1.6, fontWeight: 600, color: skat.ink },
  context: { margin: 0, fontSize: 14, color: skat.inkSoft },
  options: { display: 'grid', gridTemplateColumns: { default: '1fr 1fr', '@media (max-width: 480px)': '1fr' }, gap: 10 },
  option: {
    textAlign: 'left',
    paddingBlock: 14,
    paddingInline: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: { default: skat.paperEdge, ':hover': skat.brass },
    backgroundColor: skat.white,
    color: skat.ink,
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.4,
    cursor: 'pointer',
    boxShadow: `0 2px 0 ${skat.paperEdge}`,
  },
  optionRight: { borderColor: skat.good, backgroundColor: skat.goodSoft, opacity: 1 },
  optionWrong: { borderColor: skat.bad, backgroundColor: skat.badSoft, opacity: 0.6, cursor: 'not-allowed' },
  felt: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: { default: 16, '@media (max-width: 480px)': 8 },
    borderRadius: 20,
    backgroundColor: skat.felt,
    backgroundImage: `radial-gradient(ellipse at 50% 30%, ${skat.feltLight} 0%, ${skat.felt} 60%, ${skat.feltDeep} 100%)`,
    boxShadow: `inset 0 0 0 3px ${skat.feltDeep}`,
    color: skat.white,
  },
  feltLabel: { fontSize: 12, fontWeight: 700, opacity: 0.9, color: skat.white },
  trickRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 },
  trickCards: { display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'center', minHeight: 110 },
  trickCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  centerRow: { display: 'flex', justifyContent: 'center' },
})
