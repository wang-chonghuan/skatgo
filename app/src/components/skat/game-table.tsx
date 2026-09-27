import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { type Card, type Contract, SUITS, cardId, effectiveSuit, sameCard, sortHand } from '~/lib/skat/cards'
import { bidHint, declareHint, discardHint, playHint, skatHint } from '~/lib/skat/hints'
import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { visibleTable } from '~/lib/skat/table-view'
import { cardLabel, contractName, ledName, partLabel, roleName, settleReason } from '~/lib/skat/i18n'
import {
  type Game,
  type Seat,
  actor,
  adviceFor,
  aiBid,
  aiDeclare,
  bidAction,
  collectTrick,
  deal,
  declare,
  discard,
  legalFor,
  next,
  pickUpSkat,
  playCard,
  playHand,
  normalise,
  roleOf,
  runningPoints,
  trickWinner,
} from '~/lib/skat/game'
import { type Declaration, expectedValue, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { confettiBurst, trick } from '../../theme/constants'
import { shadow, texture } from '../../theme/effects.stylex'
import { border, opacity, radius, size, space } from '../../theme/scale.stylex'
import { skat } from '../../theme/skat.stylex'
import { typography } from '../../theme/type'
import { Fan } from './card-row'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Pill, Rich } from './ui'

// A whole game of Skat against two computer players. All rules live in ~/lib/skat/game; this file
// renders a state and dispatches the learner's moves, and lets the computers move on a timer so the
// learner can follow what happened.

const ME: Seat = 0
/** A seat's name in the current language — read at render, so it is always the page's language. */
const nameOf = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()
const FACES: Record<Seat, string> = { 0: '🙂', 1: '👩‍🦰', 2: '🧔' }

const BOT_DELAY = 850
const TRICK_DELAY = 1300

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
}

export function GameTable({ onSettled }: Props) {
  const [dealer, setDealer] = useState<Seat>(2)
  const [game, setGame] = useState<Game>(() => deal(2))
  const [scores, setScores] = useState<[number, number, number]>([0, 0, 0])
  const [picked, setPicked] = useState<Card[]>([])
  const [hint, setHint] = useState<{ card?: Card; cards?: Card[]; text: string } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [draft, setDraft] = useState<Declaration | null>(null)
  const settledFor = useRef<Game | null>(null)

  const who = actor(game)
  const contract = game.declaration?.contract ?? null
  const myTurn = who === ME

  // The computers move on a timer. The updater re-checks the state it is handed, so a timer that
  // fires late (or twice, under StrictMode) cannot move for the wrong player.
  useEffect(() => {
    if (game.phase === 'trickEnd') {
      const t = setTimeout(() => setGame((g) => collectTrick(g)), TRICK_DELAY)
      return () => clearTimeout(t)
    }
    if (who === null || who === ME) return
    const t = setTimeout(() => {
      setGame((g) => {
        const a = actor(g)
        if (a === null || a === ME) return g
        if (g.phase === 'bidding') return bidAction(g, aiBid(g))
        if (g.phase === 'skat' || g.phase === 'declare') return aiDeclare(g)
        if (g.phase === 'play') {
          const advice = adviceFor(g, a)
          return advice ? playCard(g, advice.card) : g
        }
        return g
      })
    }, BOT_DELAY)
    return () => clearTimeout(t)
  }, [game, who])

  useEffect(() => {
    if (game.phase !== 'done' || !game.result || game.declarer === null || settledFor.current === game) return
    settledFor.current = game
    const { result, declarer } = game
    setScores((s) => {
      const out: [number, number, number] = [...s]
      out[declarer] += result.score
      return out
    })
    const humanWon = declarer === ME ? result.won : !result.won
    onSettled?.({ humanWon, humanScore: declarer === ME ? result.score : 0 })
    if (humanWon) {
      void confetti(confettiBurst.game)
    }
  }, [game, onSettled])

  // Anything said about the previous state is stale once the state moves on.
  useEffect(() => {
    setHint(null)
    setRefusal(null)
  }, [game])

  // The assistant (SKATGO-9) reads the table through this: the learner's own view, refreshed on every
  // change and withdrawn when the table leaves the page.
  const publish = useTableSnapshot((s) => s.publish)
  useEffect(() => {
    publish(visibleTable(game, scores))
  }, [game, scores, publish])
  useEffect(() => () => publish(null), [publish])

  function newGame() {
    const d = next(dealer)
    setDealer(d)
    setPicked([])
    setDraft(null)
    setGame(deal(d))
  }

  const myHand = useMemo(() => sortHand(game.hands[ME], contract ?? draft?.contract ?? null), [game.hands, contract, draft])
  const legal = game.phase === 'play' && myTurn ? legalFor(game, ME) : undefined
  const points = runningPoints(game)
  const winner = trickWinner(game)

  function onCard(card: Card) {
    if (game.phase === 'skat' && game.declarer === ME && game.pickedUp) {
      setPicked((p) => (p.some((c) => sameCard(c, card)) ? p.filter((c) => !sameCard(c, card)) : p.length < 2 ? [...p, card] : p))
      return
    }
    if (game.phase !== 'play' || !myTurn || !contract) return
    if (!legal?.some((c) => sameCard(c, card))) {
      setRefusal(m.play_refusal({ led: ledName(effectiveSuit(game.trick[0].card, contract)) }))
      return
    }
    setGame((g) => playCard(g, card))
  }

  function showPlayHint() {
    const h = playHint(game)
    if (h) setHint(h)
  }

  const lastBidBy = (seat: Seat) => {
    const events = game.bidding.log.filter((e) => e.seat === seat)
    const e = events[events.length - 1]
    if (!e) return null
    return e.say === 'pass' ? m.bid_pass() : e.say === 'hold' ? m.bid_hold_said({ value: e.value }) : m.bid_said({ value: e.value })
  }

  return (
    <div data-testid="skat-table" data-phase={game.phase} {...stylex.props(styles.table)}>
      <div {...stylex.props(styles.opponents)}>
        {([1, 2] as Seat[]).map((seat) => (
          <SeatBadge
            key={seat}
            seat={seat}
            game={game}
            active={who === seat}
            said={game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null}
            score={scores[seat]}
          />
        ))}
      </div>

      <div {...stylex.props(styles.centre)}>
        {/* The pile is on the table until somebody picks it up; after that the two cards are in a hand. */}
        {(game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'passedIn') && game.skat.length > 0 ? (
          <div {...stylex.props(styles.skatPile)}>
            <div {...stylex.props(styles.skatCards)}>
              {game.skat.map((c, i) => (
                <PlayingCard key={i} card={c} faceDown size="sm" />
              ))}
            </div>
            <span {...stylex.props(typography.label, styles.feltLabel)}>{m.table_skat()}</span>
          </div>
        ) : null}

        <AnimatePresence>
          {game.trick.map((p) => (
            <motion.div
              key={cardId(p.card)}
              initial={{ opacity: 0, scale: trick.fromScale, ...trick.from[p.seat] }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: trick.exitScale, transition: { duration: trick.exitDuration } }}
              transition={trick.spring}
              {...stylex.props(styles.trickCard, positions[p.seat])}
            >
              <PlayingCard card={p.card} size="md" glow={game.phase === 'trickEnd' && winner === p.seat} />
              <span {...stylex.props(typography.label, styles.feltLabel)}>{nameOf(p.seat)}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {game.phase === 'trickEnd' && winner !== null ? (
          <div {...stylex.props(styles.trickNote)}>
            <Pill tone="brass">{winner === ME ? m.table_trick_you() : m.table_trick_other({ name: nameOf(winner) })}</Pill>
          </div>
        ) : null}
      </div>

      <div {...stylex.props(styles.strip)}>
        {contract ? <Pill tone="brass">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : <Pill tone="felt">{game.declarer === null ? m.table_bidding() : m.table_awaiting_contract()}</Pill>}
        {game.declarer !== null ? <Pill tone="felt">{m.table_declarer({ name: nameOf(game.declarer), bid: game.bid })}</Pill> : null}
        {game.phase === 'play' || game.phase === 'trickEnd' ? (
          <Pill tone="felt">{m.table_trick_count({ n: Math.min(10, game.tricks.length + 1), declarer: points.declarer, defenders: points.defenders })}</Pill>
        ) : null}
      </div>

      <div {...stylex.props(styles.mine)}>
        <div {...stylex.props(styles.mineHead)}>
          <Pill tone="felt">
            {FACES[ME]} {nameOf(ME)} · {roleName(roleOf(ME, game.dealer))}
            {game.declarer === ME ? ` · ${m.table_declarer_word()}` : game.declarer !== null ? ` · ${m.table_defender_word()}` : ''}
          </Pill>
          <Pill tone="felt">{m.table_total({ n: scores[ME] })}</Pill>
          {myTurn && game.phase === 'play' ? <Pill tone="brass">{m.table_your_turn()}</Pill> : null}
        </div>
        <Fan
          testId="skat-hand"
          cards={myHand}
          size="lg"
          onPick={onCard}
          selected={picked}
          legal={legal}
          glow={hint?.card ? [hint.card] : hint?.cards ?? []}
        />
      </div>

      <div data-testid="skat-actions" {...stylex.props(styles.actions)}>
        {refusal ? <Panel tone="bad"><p {...stylex.props(typography.note, styles.note)}><Rich text={refusal} /></p></Panel> : null}
        {hint ? <Panel tone="tip"><p {...stylex.props(typography.note, styles.note)}>💡 <Rich text={hint.text} /></p></Panel> : null}
        <Actions
          game={game}
          picked={picked}
          draft={draft}
          setDraft={setDraft}
          onBid={(a) => setGame((g) => bidAction(g, a))}
          onPickUp={() => setGame((g) => pickUpSkat(g))}
          onHand={() => setGame((g) => playHand(g))}
          onDiscard={() => {
            setGame((g) => discard(g, picked))
            setPicked([])
          }}
          onDeclare={(d) => {
            setGame((g) => declare(g, d))
            setDraft(null)
          }}
          onBidHint={() => setHint(bidHint(game))}
          onSkatHint={() => setHint(skatHint(game))}
          onDeclareHint={() => setHint(declareHint(game))}
          onDiscardHint={() => setHint(discardHint(game))}
          onPlayHint={showPlayHint}
          onNewGame={newGame}
        />
      </div>
    </div>
  )
}

function SeatBadge({ seat, game, active, said, score }: { seat: Seat; game: Game; active: boolean; said: string | null; score: number }) {
  const role = roleName(roleOf(seat, game.dealer))
  const isDeclarer = game.declarer === seat
  // An Ouvert declarer plays with the hand face up on the table.
  const open = isDeclarer && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd')
  return (
    <div data-testid={`skat-seat-${seat}`} {...stylex.props(styles.seat, active && styles.seatActive)}>
      <div {...stylex.props(styles.seatHead)}>
        <span {...stylex.props(typography.seatFace)}>{FACES[seat]}</span>
        <div {...stylex.props(styles.seatText)}>
          <span {...stylex.props(typography.name)}>{nameOf(seat)}</span>
          <span {...stylex.props(typography.micro, styles.seatMeta)}>
            {role}
            {isDeclarer ? ` · ${m.table_declarer_word()}` : ''} · {m.table_seat_score({ n: score })}
          </span>
        </div>
        {said ? <span {...stylex.props(typography.bid, styles.bubble)}>{said}</span> : null}
      </div>
      <div {...stylex.props(styles.backs)}>
        {open
          ? sortHand(game.hands[seat], game.declaration!.contract).map((c) => <div key={cardId(c)} {...stylex.props(styles.backSlot)}><PlayingCard card={c} size="xs" /></div>)
          : game.hands[seat].map((c, i) => <div key={i} {...stylex.props(styles.backSlot)}><PlayingCard card={c} faceDown size="xs" /></div>)}
      </div>
    </div>
  )
}

type ActionsProps = {
  game: Game
  picked: Card[]
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  onBid: (a: 'bid' | 'hold' | 'pass') => void
  onPickUp: () => void
  onHand: () => void
  onDiscard: () => void
  onDeclare: (d: Declaration) => void
  onBidHint: () => void
  onSkatHint: () => void
  onDeclareHint: () => void
  onDiscardHint: () => void
  onPlayHint: () => void
  onNewGame: () => void
}

function Actions(p: ActionsProps) {
  const { game } = p
  const who = actor(game)

  if (game.phase === 'passedIn') {
    return (
      <Row>
        <Say>{m.table_passed_in()}</Say>
        <Btn testId="skat-new-game" onClick={p.onNewGame}>{m.table_redeal()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    return <Result game={game} onNewGame={p.onNewGame} />
  }

  if (who !== ME) {
    const name = who === null ? '' : nameOf(who)
    const doing =
      game.phase === 'trickEnd'
        ? m.table_collecting()
        : game.phase === 'bidding'
          ? m.table_thinking_bid({ name })
          : game.phase === 'play'
            ? m.table_thinking_play({ name })
            : m.table_thinking_skat({ name })
    return <Row><Say>{doing}</Say></Row>
  }

  if (game.phase === 'bidding') {
    const b = game.bidding
    if (b.awaiting === 'forehandAlone') {
      return (
        <Row>
          <Say>{m.bid_forehand_alone()}</Say>
          <Btn testId="skat-bid" onClick={() => p.onBid('bid')}>{m.bid_take_18()}</Btn>
          <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          <Btn tone="felt" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    if (b.awaiting === 'speaker') {
      const value = nextBid(b.value)
      return (
        <Row>
          <Say>{m.bid_your_turn({ name: nameOf(b.listener) })}</Say>
          <Btn testId="skat-bid" onClick={() => p.onBid('bid')}>{m.bid_button({ value: value ?? '' })}</Btn>
          <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          <Btn tone="felt" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.bid_asked({ name: nameOf(b.speaker), value: b.value })}</Say>
        <Btn testId="skat-hold" onClick={() => p.onBid('hold')}>{m.bid_hold_button({ value: b.value })}</Btn>
        <Btn testId="skat-pass" tone="quiet" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
        <Btn tone="felt" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'skat') {
    if (!game.pickedUp) {
      return (
        <Row>
          <Say>{m.skat_won_bid({ bid: game.bid })}</Say>
          <Btn testId="skat-pickup" onClick={p.onPickUp}>{m.skat_pick_up()}</Btn>
          <Btn testId="skat-hand-game" tone="quiet" onClick={p.onHand}>{m.skat_play_hand()}</Btn>
          <Btn testId="skat-skat-hint" tone="felt" size="sm" onClick={p.onSkatHint}>{m.skat_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.skat_discard_prompt()}</Say>
        <Btn testId="skat-discard" disabled={p.picked.length !== 2} onClick={p.onDiscard}>{m.skat_discard_button({ n: p.picked.length })}</Btn>
        <Btn tone="felt" size="sm" onClick={p.onDiscardHint}>{m.skat_discard_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} onHint={p.onDeclareHint} />
  }

  return (
    <Row>
      <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say>
      <Btn testId="skat-hint" tone="felt" size="sm" onClick={p.onPlayHint}>{m.play_hint_button()}</Btn>
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({
  game,
  draft,
  setDraft,
  onDeclare,
  onHint,
}: {
  game: Game
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  onDeclare: (d: Declaration) => void
  onHint: () => void
}) {
  const isHand = !game.pickedUp
  // Matadors are counted over hand plus skat, but in a Hand game the skat is unseen: the learner can
  // only count what they hold, which is exactly the uncertainty the lesson on Hand games describes.
  const known = isHand ? game.hands[ME] : [...game.hands[ME], ...game.skat]
  const make = (contract: Contract, extra: Partial<Declaration> = {}): Declaration =>
    normalise({ contract, hand: isHand, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra }, game.pickedUp)
  const value = draft ? expectedValue(draft, known) : null
  const same = (a: Contract, b: Contract) => JSON.stringify(a) === JSON.stringify(b)

  return (
    <div {...stylex.props(styles.declare)}>
      <Say><Rich text={m.declare_prompt({ bid: game.bid })} /></Say>
      <div {...stylex.props(styles.contractGrid)}>
        {CONTRACTS.map((c) => {
          const v = expectedValue(make(c), known)
          const chosen = draft !== null && same(draft.contract, c)
          return (
            <button
              key={JSON.stringify(c)}
              type="button"
              data-testid={`skat-contract-${c.kind === 'suit' ? c.trump : c.kind}`}
              data-covers={String(v >= game.bid)}
              aria-pressed={chosen}
              onClick={() => setDraft(make(c))}
              {...stylex.props(typography.control, styles.contractBtn, chosen && styles.contractChosen, v < game.bid && styles.contractShort)}
            >
              <span {...stylex.props(typography.contract)}><Rich text={contractName(c)} /></span>
              <span {...stylex.props(typography.micro, styles.contractValue)}>{m.declare_worth({ value: v })}{v < game.bid ? m.declare_short() : ''}</span>
            </button>
          )
        })}
      </div>
      {draft ? (
        <div {...stylex.props(styles.toggles)}>
          {draft.contract.kind === 'null' ? (
            <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>{m.declare_null_ouvert()}</Toggle>
          ) : isHand ? (
            <>
              <Toggle on={draft.schneiderAnnounced} onClick={() => setDraft(make(draft.contract, { schneiderAnnounced: !draft.schneiderAnnounced }))}>
                {m.declare_announce_schneider()}
              </Toggle>
              <Toggle on={draft.schwarzAnnounced} onClick={() => setDraft(make(draft.contract, { schwarzAnnounced: !draft.schwarzAnnounced }))}>
                {m.declare_announce_schwarz()}
              </Toggle>
              <Toggle on={draft.ouvert} onClick={() => setDraft(make(draft.contract, { ouvert: !draft.ouvert }))}>Ouvert</Toggle>
            </>
          ) : null}
        </div>
      ) : null}
      {draft && value !== null ? (
        <Panel tone={value >= game.bid ? 'good' : 'bad'}>
          <p {...stylex.props(typography.note, styles.note)}>
            {value >= game.bid
              ? m.declare_covers({ contract: `${contractName(draft.contract)}${draft.hand ? ' Hand' : ''}`, value, bid: game.bid })
              : m.declare_overbid({ contract: contractName(draft.contract), value, bid: game.bid })}
            {isHand && draft.contract.kind !== 'null' ? m.declare_hand_note() : ''}
          </p>
        </Panel>
      ) : null}
      <Row>
        <Btn testId="skat-declare" disabled={!draft} onClick={() => draft && onDeclare(draft)}>{m.declare_go()}</Btn>
        <Btn testId="skat-declare-hint" tone="felt" size="sm" onClick={onHint}>{m.declare_hint_button()}</Btn>
      </Row>
    </div>
  )
}

function Result({ game, onNewGame }: { game: Game; onNewGame: () => void }) {
  const r = game.result!
  const declarer = game.declarer!
  const d = game.declaration!
  const humanWon = declarer === ME ? r.won : !r.won
  const isNull = d.contract.kind === 'null'
  // On a phone the settlement opens below the fold; bring it into view, or the game just seems to stop.
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  const formula = isNull
    ? m.result_null_formula({ contract: `Null${d.hand ? ' Hand' : ''}${d.ouvert ? ' Ouvert' : ''}`, value: r.value })
    : m.result_formula_mult({
        parts: r.parts.map((p, i) => (i === 0 ? partLabel(p, r.matadors) : `${partLabel(p, r.matadors)} 1`)).join(' + '),
        mult: r.multiplier,
        contract: contractName(d.contract),
        base: r.base,
        value: r.base * r.multiplier,
      })
  return (
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      <Panel tone={humanWon ? 'good' : 'bad'}>
        <div {...stylex.props(styles.resultBody)}>
          <h3 {...stylex.props(typography.resultTitle, styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
          <p {...stylex.props(typography.note, styles.note)}>
            <Rich
              text={m.result_line({
                who: declarer === ME ? m.result_you_declared() : m.result_other_declared({ name: nameOf(declarer) }),
                contract: contractName(d.contract),
                bid: game.bid,
                reason: settleReason(r.reason),
              })}
            />
          </p>
          {isNull ? null : (
            <p data-testid="skat-result-points" {...stylex.props(typography.note, styles.note)}>
              <Rich text={m.result_points({ declarer: r.declarerPoints, defenders: r.defenderPoints })} />
            </p>
          )}
          <p data-testid="skat-result-formula" {...stylex.props(typography.note, styles.note)}>{m.result_formula({ formula })}</p>
          <p {...stylex.props(typography.note, styles.note)}>
            <Rich text={scoreLine(declarer, r.won, r.score > 0 ? `+${r.score}` : String(r.score))} />
          </p>
          <div {...stylex.props(styles.resultSkat)}>
            <span {...stylex.props(typography.smallBold, styles.inkLabel)}>{m.result_skat()}</span>
            {game.skat.map((c) => <PlayingCard key={cardId(c)} card={c} size="xs" />)}
          </div>
        </div>
      </Panel>
      <Row>
        <Btn testId="skat-new-game" onClick={onNewGame}>{m.result_new_game()}</Btn>
      </Row>
    </div>
  )
}

/** "You score +30." — who wrote down what, and why it is doubled when it is. */
function scoreLine(declarer: Seat, won: boolean, score: string): string {
  if (declarer === ME) return won ? m.result_score_you({ score }) : m.result_score_lost_you({ score })
  const name = nameOf(declarer)
  return won ? m.result_score({ name, score }) : m.result_score_lost({ name, score })
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} {...stylex.props(typography.toggle, styles.toggle, on && styles.toggleOn)}>
      {on ? '☑' : '☐'} {children}
    </button>
  )
}

const Row = ({ children }: { children: ReactNode }) => <div {...stylex.props(styles.row)}>{children}</div>
const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(typography.say, styles.say)}>{children}</p>


const styles = stylex.create({
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    padding: { default: space.x16, [bp.phone]: space.x10 },
    borderRadius: radius.stage,
    backgroundColor: skat.felt,
    backgroundImage: texture.feltTable,
    boxShadow: shadow.table,
    color: skat.white,
    overflow: 'hidden',
  },
  opponents: { display: 'grid', gridTemplateColumns: size.twoColumns, gap: space.x10 },
  seat: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    padding: space.x8,
    borderRadius: radius.tile,
    backgroundColor: skat.feltDeep,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    minWidth: 0,
  },
  seatActive: { borderColor: skat.brass },
  seatHead: { display: 'flex', alignItems: 'center', gap: space.x8, minWidth: 0 },
  seatText: { display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 },
  // One line on a desk; on a phone it may wrap, because the seat's role ("Mittelhand") is part of what
  // the learner has to read, and next to a bid bubble one line leaves room for only a few letters.
  seatMeta: {
    opacity: opacity.meta,
    whiteSpace: { default: 'nowrap', [bp.phone]: 'normal' },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bubble: {
    backgroundColor: skat.paper,
    color: skat.ink,
    paddingBlock: space.x4,
    paddingInline: space.x10,
    borderRadius: radius.control,
    whiteSpace: 'nowrap',
  },
  backs: { display: 'flex', paddingRight: size.backsTail, minHeight: size.backsRow },
  backSlot: { flexBasis: size.backSlot, flexShrink: 1, minWidth: size.backSlotMin },
  centre: { position: 'relative', height: { default: size.tableCentre, [bp.phone]: size.tableCentrePhone } },
  skatPile: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.x6,
  },
  skatCards: { display: 'flex', gap: space.x6 },
  feltLabel: { opacity: opacity.label },
  inkLabel: { color: skat.inkSoft },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4 },
  trickNote: { position: 'absolute', left: 0, right: 0, top: space.x4, display: 'flex', justifyContent: 'center' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: space.x6, justifyContent: 'center' },
  mine: { display: 'flex', flexDirection: 'column', gap: space.x2 },
  mineHead: { display: 'flex', flexWrap: 'wrap', gap: space.x6, justifyContent: 'center' },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    padding: { default: space.x14, [bp.phone]: space.x12 },
    borderRadius: radius.panel,
    backgroundColor: skat.paper,
    color: skat.ink,
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x10 },
  say: { margin: 0, flexBasis: '100%', color: skat.ink },
  // Colour is stated on every heading and paragraph in the course: the app theme colours `h*` and
  // `p` itself, and in dark mode that colour is a light one — unreadable on this paper.
  note: { margin: 0, color: skat.ink },
  declare: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: size.contractColumns, [bp.contracts]: size.contractColumnsPhone }, gap: space.x8 },
  contractBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x2,
    paddingBlock: space.x10,
    paddingInline: space.x4,
    borderRadius: radius.tile,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    cursor: 'pointer',
  },
  contractChosen: { borderColor: skat.brassDeep, backgroundColor: skat.brassSoft },
  contractShort: { opacity: opacity.spent },
  contractValue: { color: skat.inkSoft },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  toggle: {
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    borderRadius: radius.round,
    paddingBlock: space.x6,
    paddingInline: space.x12,
    cursor: 'pointer',
  },
  toggleOn: { backgroundColor: skat.brassSoft, borderColor: skat.brassDeep },
  resultBody: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  resultTitle: { margin: 0, color: skat.ink },
  resultSkat: { display: 'flex', alignItems: 'center', gap: space.x6 },
})

// The three places a played card lands: in front of whoever played it.
const positions = stylex.create({
  0: { left: size.half, bottom: 0, marginLeft: { default: size.trickHalfCard, [bp.phone]: size.trickHalfCardPhone } },
  1: { left: { default: size.trickSide, [bp.phone]: size.trickSidePhone }, top: size.trickTop },
  2: { right: { default: size.trickSide, [bp.phone]: size.trickSidePhone }, top: size.trickTop },
})
