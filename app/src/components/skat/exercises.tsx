import * as stylex from '@stylexjs/stylex'
import { motion, useAnimate } from 'motion/react'
import { CircleCheck, CircleX } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { type Card, cardId, effectiveSuit, legalPlays, pointsOf, sameCard, sortHand } from '~/lib/skat/cards'
import type { Role } from '~/lib/skat/game'
import { contractName, ledName } from '~/lib/skat/i18n'
import { after, auction } from '~/lib/skat/lessons/auction'
import { DEAL_PACKETS, sameSet } from '~/lib/skat/lessons/drills'
import type { BidStep, ChoiceStep, DealStep, OrderStep, PickStep, PlayStep, SumStep, TeachStep } from '~/lib/skat/lessons/types'
import { expectedValue } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon, playIn, shake } from '../../theme/constants'
import { elev, fill } from '../../theme/elevation.stylex'
import { border, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView, Fan } from './card-row'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Rich, Tip } from './ui'

// One component per kind of step. Each asks, judges with the rules engine, and reports back through
// two callbacks: `onMistake` (counted towards the lesson's stars) and `onSolved` (unlocks
// "continue"). A wrong answer never advances and never ends the step — the learner tries again with
// the reason in front of them.

// `solvedBefore`: the learner already solved this step and has come back to it (SKATGO-3). It opens in
// its solved state — the right answer and the explanation showing — so looking again costs nothing
// and cannot add a mistake. It is read once, as the initial state.
//
// `once`: a Skat-Tricks exercise (SKATGO-103) — the first answer is the answer. A wrong one is judged, the
// right answer is shown beside it, and the step takes no other; the page around it says what was right
// and why, so the step shows no feedback panel of its own. A card the rules forbid is still refused with
// the reason, and is not an answer.
export type StepCallbacks = { onSolved: () => void; onMistake: () => void; solvedBefore?: boolean; once?: boolean }

export function Teach({ step }: { step: TeachStep }) {
  return (
    <div {...stylex.props(styles.stack)}>
      <h2 {...stylex.props(typography.optionTitle, styles.title)}>{step.title}</h2>
      {step.body.map((p, i) => (
        <p key={i} {...stylex.props(typography.body, styles.para)}><Rich text={p} /></p>
      ))}
      {step.rows?.map((row, i) => <CardRowView key={i} row={row} />)}
      {step.tip ? (
        <Tip><p {...stylex.props(typography.body, styles.para)}><Rich text={step.tip} /></p></Tip>
      ) : null}
    </div>
  )
}

/** Shakes its children each time `nonce` changes — the wordless "no" after a wrong answer. */
function Shake({ nonce, children }: { nonce: number; children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (nonce > 0) void animate(scope.current, { x: shake.x }, { duration: shake.duration })
  }, [nonce, animate, scope])
  return <div ref={scope}>{children}</div>
}

function Feedback({ state, good, bad }: { state: 'idle' | 'wrong' | 'right'; good: string; bad: string }) {
  if (state === 'idle') return null
  const Mark = state === 'right' ? CircleCheck : CircleX
  return (
    <Panel tone={state === 'right' ? 'good' : 'bad'}>
      <div {...stylex.props(styles.verdict)}>
        <span aria-hidden="true" {...stylex.props(styles.verdictIcon, state === 'right' ? styles.verdictGood : styles.verdictBad)}>
          <Mark size={icon.inline} strokeWidth={icon.outline} />
        </span>
        <p data-testid={state === 'right' ? 'skat-feedback-right' : 'skat-feedback-wrong'} {...stylex.props(typography.body, styles.para)}>
          <Rich text={state === 'right' ? good : bad} />
        </p>
      </div>
    </Panel>
  )
}

/** `onChoose` hears which option was taken, before the verdict (the bidding practice records it, SKATGO-150); `pairs`
 *  keeps short options two by two on a phone too (its seven contracts, SKATGO-151). */
export function Choice({ step, onSolved, onMistake, solvedBefore, once, onChoose, pairs }: { step: ChoiceStep; onChoose?: (i: number) => void; pairs?: boolean } & StepCallbacks) {
  const [wrong, setWrong] = useState<number[]>([])
  const [right, setRight] = useState(!!solvedBefore)
  const [nonce, setNonce] = useState(0)
  const over = right || (!!once && wrong.length > 0)

  function choose(i: number) {
    if (over) return
    onChoose?.(i)
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
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
      {step.rows?.map((row, i) => <CardRowView key={i} row={row} />)}
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.options, pairs && styles.optionPairs)}>
          {step.options.map((o, i) => (
            <button
              key={i}
              type="button"
              data-testid="skat-option"
              data-correct={String(i === step.answer)}
              disabled={over || wrong.includes(i)}
              onClick={() => choose(i)}
              {...stylex.props(typography.option, styles.option, over && i === step.answer && styles.optionRight, wrong.includes(i) && styles.optionWrong)}
            >
              <Rich text={o} />
            </button>
          ))}
        </div>
      </Shake>
      {once ? null : <Feedback state={right ? 'right' : wrong.length ? 'wrong' : 'idle'} good={step.explain} bad={step.hint ?? m.ex_choice_wrong()} />}
    </div>
  )
}

export function Pick({ step, onSolved, onMistake, solvedBefore, once }: { step: PickStep } & StepCallbacks) {
  const [chosen, setChosen] = useState<Card[]>([])
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [nonce, setNonce] = useState(0)
  const has = (list: Card[], c: Card) => list.some((d) => sameCard(c, d))
  const over = state === 'right' || (!!once && state === 'wrong')

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
    if (over) return
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
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
      {step.context ? <p {...stylex.props(typography.context, styles.context)}><Rich text={step.context} /></p> : null}
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.felt)}>
          <Fan testId="skat-pick" cards={step.cards} size="lg" onPick={tap} answer={step.correct} selected={over ? [] : chosen} verdicts={verdicts} glow={over ? step.correct : []} />
        </div>
      </Shake>
      {step.single ? null : (
        <div {...stylex.props(styles.centerRow)}>
          <Btn testId="skat-check" tone="info" shape="block" disabled={chosen.length === 0 || over} onClick={() => judge(chosen)}>
            {m.ex_pick_check({ n: chosen.length })}
          </Btn>
        </div>
      )}
      {once ? null : (
        <Feedback
          state={state}
          good={step.explain}
          bad={step.hint ?? (step.single ? m.ex_pick_wrong_single() : m.ex_pick_wrong_multi())}
        />
      )}
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
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
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

/** `table`: what else lies on the felt, above the trick — a ladder step's opponents' cards and what is known
 *  of them; `handLabel`: a line right over the hand (SKATGO-109). */
export function Play({ step, onSolved, onMistake, solvedBefore, once, table, handLabel }: { step: PlayStep; table?: ReactNode; handLabel?: string } & StepCallbacks) {
  const legal = legalPlays(step.hand, step.trick, step.contract)
  const [played, setPlayed] = useState<Card | null>(solvedBefore ? (step.best ?? legal)[0] : null)
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [why, setWhy] = useState('')
  const [nonce, setNonce] = useState(0)
  const hand = sortHand(step.hand, step.contract).filter((c) => !played || !sameCard(c, played))

  const over = state === 'right' || (!!once && state === 'wrong' && played !== null)

  function tap(card: Card) {
    if (over) return
    const isLegal = legal.some((c) => sameCard(c, card))
    if (!isLegal) {
      const led = effectiveSuit(step.trick[0], step.contract)
      setWhy(m.ex_play_illegal({ led: ledName(led) }) + (card.rank === 'J' && step.contract.kind !== 'null' ? m.ex_play_illegal_jack() : ''))
    } else if (step.best && !step.best.some((c) => sameCard(c, card))) {
      setWhy(step.whyNot ?? m.ex_play_not_best())
      // Played once and for all: the card goes to the table, judged, and the right one lights up in the hand.
      if (once) setPlayed(card)
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
      {step.prompt ? <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p> : null}
      <div {...stylex.props(styles.felt)}>
        {table}
        {/* With a ladder's table above it, the empty trick is not shown until a card is played (SKATGO-109). */}
        <div {...stylex.props(styles.trickRow, !!table && !played && styles.trickHidden)}>
          <span {...stylex.props(typography.label, styles.feltLabel)}>{m.ex_on_table({ contract: contractName(step.contract) })}</span>
          <div {...stylex.props(styles.trickCards)}>
            {step.trick.length === 0 && !played && !table ? <span {...stylex.props(typography.label, styles.feltLabel)}>{m.ex_you_lead()}</span> : null}
            {step.trick.map((c, i) => (
              <div key={cardId(c)} {...stylex.props(styles.trickCell)}>
                <PlayingCard card={c} size="md" />
                <span {...stylex.props(typography.label, styles.feltLabel)}>{step.trickBy?.[i] ?? ''}</span>
              </div>
            ))}
            {played ? (
              <motion.div initial={{ opacity: 0, y: playIn.rise }} animate={{ opacity: 1, y: 0 }} {...stylex.props(styles.trickCell)}>
                <PlayingCard card={played} size="md" glow={state === 'right'} verdict={state === 'wrong' ? 'bad' : undefined} />
                <span {...stylex.props(typography.label, styles.feltLabel)}>{m.name_you()}</span>
              </motion.div>
            ) : null}
          </div>
        </div>
        {handLabel ? <span {...stylex.props(typography.label, styles.feltLabel, styles.handLabel)}>{handLabel}</span> : null}
        <Shake nonce={nonce}>
          <Fan testId="skat-play-hand" cards={hand} size="lg" onPick={tap} legal={over ? undefined : legal} answer={step.best ?? legal} glow={over && state === 'wrong' ? step.best ?? [] : []} />
        </Shake>
      </div>
      {once && over ? null : <Feedback state={state} good={step.explain} bad={why} />}
    </div>
  )
}

/** Any `size` of `cards` that make `target` card points together, for scripted checks (`data-answer`). */
function oneSum(cards: Card[], size: number, target: number, from = 0): Card[] | null {
  if (size === 0) return target === 0 ? [] : null
  for (let i = from; i < cards.length; i++) {
    const rest = oneSum(cards, size - 1, target - pointsOf([cards[i]]), i + 1)
    if (rest) return [cards[i], ...rest]
  }
  return null
}

/** Tap cards worth exactly the target together (SKATGO-161): judged by their sum, so every way to make it is right. */
export function Sum({ step, onSolved, onMistake, solvedBefore }: { step: SumStep } & StepCallbacks) {
  const [chosen, setChosen] = useState<Card[]>([])
  const [state, setState] = useState<'idle' | 'wrong' | 'right'>(solvedBefore ? 'right' : 'idle')
  const [made, setMade] = useState(0)
  const [nonce, setNonce] = useState(0)
  const answer = useMemo(() => oneSum(step.cards, step.size, step.target) ?? [], [step])
  const has = (c: Card) => chosen.some((d) => sameCard(c, d))
  const over = state === 'right'

  function tap(card: Card) {
    if (over) return
    setState('idle')
    setChosen((c) => (has(card) ? c.filter((d) => !sameCard(d, card)) : c.length < step.size ? [...c, card] : c))
  }

  function check() {
    const sum = pointsOf(chosen)
    if (sum === step.target) {
      setState('right')
      onSolved()
      return
    }
    setMade(sum)
    setState('wrong')
    setNonce((n) => n + 1)
    onMistake()
  }

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
      <Shake nonce={nonce}>
        <div {...stylex.props(styles.felt)}>
          <Fan testId="skat-sum" cards={step.cards} size="lg" onPick={tap} answer={answer} selected={chosen} glow={over ? chosen : []} />
        </div>
      </Shake>
      <div {...stylex.props(styles.centerRow)}>
        <Btn testId="skat-check" tone="info" shape="block" disabled={chosen.length !== step.size || over} onClick={check}>
          {m.ex_sum_check()}
        </Btn>
      </div>
      <Feedback state={state} good={step.explain} bad={`${m.ex_sum_wrong({ sum: made, target: step.target })} ${step.hint}`} />
    </div>
  )
}

type Place = (typeof DEAL_PACKETS)[number]['to']

/**
 * Lesson 1's deal (SKATGO-161): the learner is the dealer and taps where each packet goes; a wrong place is
 * refused with the right one named. Dealt out, their own ten cards turn face up.
 */
export function Deal({ step, onSolved, onMistake, solvedBefore }: { step: DealStep } & StepCallbacks) {
  const [dealt, setDealt] = useState(solvedBefore ? DEAL_PACKETS.length : 0)
  const [why, setWhy] = useState('')
  const [nonce, setNonce] = useState(0)
  const done = dealt === DEAL_PACKETS.length
  const held: Record<Place, Card[]> = { left: [], right: [], you: [], skat: [] }
  let top = 0
  DEAL_PACKETS.slice(0, dealt).forEach((p) => {
    held[p.to].push(...step.cards.slice(top, top + p.n))
    top += p.n
  })
  const names: Record<Place, string> = { left: m.name_lina(), right: m.name_max(), you: m.name_you(), skat: m.lesson_deal_skat() }

  function tap(place: Place) {
    if (done) return
    const packet = DEAL_PACKETS[dealt]
    if (place === packet.to) {
      setWhy('')
      setDealt(dealt + 1)
      if (dealt + 1 === DEAL_PACKETS.length) onSolved()
      return
    }
    setWhy(
      packet.to === 'skat'
        ? m.lesson_deal_wrong_skat({ n: packet.n })
        : m.lesson_deal_wrong_seat({ n: packet.n, name: packet.to === 'you' ? m.lesson_deal_to_you() : names[packet.to] }),
    )
    setNonce((n) => n + 1)
    onMistake()
  }

  const zone = (place: Place) => (
    <button
      type="button"
      data-testid="skat-deal-place"
      data-place={place}
      data-next={String(!done && DEAL_PACKETS[dealt].to === place)}
      disabled={done}
      onClick={() => tap(place)}
      {...stylex.props(styles.place)}
    >
      <span {...stylex.props(typography.label, styles.feltLabel)}>{m.lesson_deal_zone({ name: names[place], n: held[place].length })}</span>
      <span {...stylex.props(styles.placeCards)}>
        {held[place].length > 0 ? <PlayingCard card={held[place][0]} faceDown size="sm" /> : null}
      </span>
    </button>
  )

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
      <Shake nonce={nonce}>
        <div data-testid="skat-deal" data-dealt={dealt} {...stylex.props(styles.felt, styles.dealTable)}>
          <div {...stylex.props(styles.dealRow)}>
            {zone('left')}
            {zone('right')}
          </div>
          <div {...stylex.props(styles.dealRow, styles.dealMiddle)}>
            <span {...stylex.props(styles.place, styles.deck)}>
              <span {...stylex.props(typography.label, styles.feltLabel)}>{m.lesson_deal_deck({ n: step.cards.length - top })}</span>
              <span {...stylex.props(styles.placeCards)}>
                {done ? null : <PlayingCard card={step.cards[top]} faceDown size="sm" />}
              </span>
            </span>
            {zone('skat')}
          </div>
          <div {...stylex.props(styles.dealRow, styles.dealMiddle)}>{zone('you')}</div>
        </div>
      </Shake>
      {done ? <CardRowView row={{ label: m.lesson_deal_your_cards(), cards: sortHand(held.you, null) }} /> : null}
      <Feedback state={done ? 'right' : why ? 'wrong' : 'idle'} good={step.explain} bad={why} />
    </div>
  )
}

/**
 * Lesson 7's auction (SKATGO-161): the calls of the whole auction appear one by one; at each of the
 * learner's, they choose — the next number or pass, yes or pass — with the table's own words. Their limit is
 * the engine's value of the game they would play; any other call than the right one is refused with why.
 */
export function Bid({ step, onSolved, onMistake, solvedBefore }: { step: BidStep } & StepCallbacks) {
  const limit = expectedValue({ contract: step.contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false }, step.hand)
  const [first, second] = after(step.seat)
  const result = useMemo(
    () => auction({ [step.seat]: limit, [first]: step.limits[0], [second]: step.limits[1] } as Record<Role, number>),
    [step, limit, first, second],
  )
  const mine = (i: number) => result.calls[i]?.role === step.seat
  /** The calls shown: everything up to the learner's next call. */
  const upTo = (from: number) => {
    let i = from
    while (i < result.calls.length && !mine(i)) i++
    return i
  }
  const [shown, setShown] = useState(() => (solvedBefore ? result.calls.length : upTo(0)))
  const [why, setWhy] = useState('')
  const [nonce, setNonce] = useState(0)
  const done = shown >= result.calls.length
  // The log grows with every call; after each of the learner's, the page follows it down to their next turn
  // (or to the verdict), so on a phone the buttons never slip out of sight.
  const turn = useRef<HTMLDivElement>(null)
  const answered = useRef(false)
  useEffect(() => {
    if (answered.current) turn.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [shown])
  const nameOf = (r: Role) => (r === step.seat ? m.name_you() : r === first ? m.name_lina() : m.name_max())
  const roles: Record<Role, string> = { forehand: m.role_forehand(), middlehand: m.role_middlehand(), rearhand: m.role_rearhand() }

  function choose(go: boolean) {
    if (done) return
    const call = result.calls[shown]
    const right = call.say !== 'pass'
    if (go === right) {
      setWhy('')
      answered.current = true
      const next = upTo(shown + 1)
      setShown(next)
      if (next >= result.calls.length) onSolved()
      return
    }
    setWhy(right ? m.lesson_bid_go_on({ limit, value: call.value }) : m.lesson_bid_too_high({ limit, value: call.value }))
    setNonce((n) => n + 1)
    onMistake()
  }

  const said = (call: (typeof result.calls)[number]) =>
    call.say === 'bid' ? m.bid_said({ value: call.value }) : call.say === 'hold' ? m.bid_hold_said({ value: call.value }) : m.bid_pass()
  const current = done ? null : result.calls[shown]

  return (
    <div {...stylex.props(styles.stack)}>
      <p {...stylex.props(typography.prompt, styles.prompt)}><Rich text={step.prompt} /></p>
      <CardRowView row={{ label: m.lesson_bid_hand({ contract: contractName(step.contract) }), cards: sortHand(step.hand, step.contract) }} />
      <ol data-testid="skat-bid-log" {...stylex.props(styles.bidLog)}>
        {result.calls.slice(0, shown).map((call, i) => (
          <motion.li key={i} initial={{ opacity: 0, y: playIn.rise }} animate={{ opacity: 1, y: 0 }} {...stylex.props(styles.bidLine)}>
            <span {...stylex.props(typography.smallBold, styles.context)}>{m.lesson_bid_line({ name: nameOf(call.role), role: roles[call.role] })}</span>
            <span {...stylex.props(typography.body, styles.prompt)}>{said(call)}</span>
          </motion.li>
        ))}
      </ol>
      <div ref={turn} {...stylex.props(styles.bidActions)}>
        {current ? (
          <Shake nonce={nonce}>
            <div {...stylex.props(styles.bidActions)}>
              <p {...stylex.props(typography.body, styles.para)}>
                {current.turn === 'alone'
                  ? m.bid_forehand_alone()
                  : current.turn === 'answer'
                    ? m.bid_asked({ name: nameOf(current.to as Role), value: current.value })
                    : m.lesson_bid_your_turn({ name: nameOf(current.to as Role) })}
              </p>
              <div {...stylex.props(styles.centerRow, styles.bidButtons)}>
                <Btn testId="skat-bid-go" tone="info" shape="block" onClick={() => choose(true)}>
                  {current.turn === 'alone' ? m.bid_take_18() : current.turn === 'answer' ? m.bid_hold_button({ value: current.value }) : m.bid_button({ value: current.value })}
                </Btn>
                <Btn testId="skat-bid-pass" tone="quiet" shape="block" onClick={() => choose(false)}>{m.bid_pass()}</Btn>
              </div>
            </div>
          </Shake>
        ) : null}
        <Feedback state={done ? 'right' : why ? 'wrong' : 'idle'} good={step.explain} bad={why} />
      </div>
    </div>
  )
}

// SKATGO-26: the lobby design. Text is navy and slate on the white step card; an answer option is an
// option card that rings green on hover; a drill's cards lie on the table's felt, with its gold frame.
const styles = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  title: { margin: 0, color: color.navy },
  para: { margin: 0, color: color.text },
  prompt: { margin: 0, color: color.navy },
  context: { margin: 0, color: color.slate },
  options: { display: 'grid', gridTemplateColumns: { default: dims.twoColumns, [bp.phone]: dims.oneColumn }, gap: space.x12 },
  optionPairs: { gridTemplateColumns: dims.twoColumns },
  option: {
    textAlign: 'left',
    paddingBlock: space.x16,
    paddingInline: space.x16,
    borderRadius: radii.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: { default: color.hairline, ':hover': color.go },
    backgroundColor: color.surface,
    color: color.navy,
    cursor: 'pointer',
    boxShadow: elev.option,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  optionRight: { borderColor: color.good, backgroundColor: color.goodSoft, opacity: 1 },
  optionWrong: { borderColor: color.bad, backgroundColor: color.badSoft, opacity: opacity.spent, cursor: 'not-allowed' },
  felt: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    padding: { default: space.x16, [bp.phone]: space.x8 },
    borderRadius: radii.panel,
    borderWidth: dims.frameBorderPlay,
    borderStyle: 'solid',
    borderColor: color.gold,
    backgroundImage: fill.felt,
    color: color.onColor,
  },
  feltLabel: { color: color.amber },
  trickRow: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x8, paddingTop: space.x4 },
  trickCards: { display: 'flex', gap: space.x12, alignItems: 'flex-start', justifyContent: 'center', minHeight: dims.cardSlotRow },
  trickHidden: { display: 'none' },
  handLabel: { textAlign: 'center' },
  trickCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4 },
  centerRow: { display: 'flex', justifyContent: 'center' },
  verdict: { display: 'flex', alignItems: 'flex-start', gap: space.x10 },
  verdictIcon: { display: 'flex', flexShrink: 0, paddingTop: space.x2 },
  verdictGood: { color: color.good },
  verdictBad: { color: color.bad },
  // The deal (SKATGO-161): Lina and Noah across the top, the deck and the skat in the middle, the learner below,
  // each place a tappable frame on the felt.
  dealTable: { gap: space.x12 },
  dealRow: { display: 'flex', justifyContent: 'space-between', gap: space.x12 },
  dealMiddle: { justifyContent: 'center' },
  place: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    padding: space.x8,
    borderRadius: radii.panel,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: { default: color.gold, ':hover': color.amber },
    backgroundColor: 'transparent',
    cursor: { default: 'pointer', ':disabled': 'default' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  deck: { borderStyle: 'none', cursor: 'default' },
  placeCards: { display: 'flex', minHeight: dims.cardSlotRow },
  // The auction (SKATGO-161): one line per call, then the learner's two buttons.
  bidLog: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, padding: 0, listStyle: 'none' },
  bidLine: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12, paddingBlock: space.x4, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  bidActions: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  bidButtons: { flexWrap: 'wrap', gap: space.x10 },
})
