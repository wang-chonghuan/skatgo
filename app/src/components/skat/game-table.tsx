import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { bidAdvice, chooseDeclaration } from '~/lib/skat/ai'
import { type Card, type Contract, SUITS, cardId, effectiveSuit, sameCard, sortHand } from '~/lib/skat/cards'
import { adviceReason, cardLabel, contractName, ledName, partLabel, roleName, settleReason } from '~/lib/skat/i18n'
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
import { skat } from '../../theme/skat.stylex'
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
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } })
    }
  }, [game, onSettled])

  // Anything said about the previous state is stale once the state moves on.
  useEffect(() => {
    setHint(null)
    setRefusal(null)
  }, [game])

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
    const advice = adviceFor(game, ME)
    if (advice) setHint({ card: advice.card, text: m.play_hint({ card: cardLabel(advice.card), reason: adviceReason(advice.reason) }) })
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
            <span {...stylex.props(styles.feltLabel)}>{m.table_skat()}</span>
          </div>
        ) : null}

        <AnimatePresence>
          {game.trick.map((p) => (
            <motion.div
              key={cardId(p.card)}
              initial={{ opacity: 0, scale: 0.7, ...FROM[p.seat] }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              {...stylex.props(styles.trickCard, positions[p.seat])}
            >
              <PlayingCard card={p.card} size="md" glow={game.phase === 'trickEnd' && winner === p.seat} />
              <span {...stylex.props(styles.feltLabel)}>{nameOf(p.seat)}</span>
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
        {refusal ? <Panel tone="bad"><p {...stylex.props(styles.note)}><Rich text={refusal} /></p></Panel> : null}
        {hint ? <Panel tone="tip"><p {...stylex.props(styles.note)}>💡 <Rich text={hint.text} /></p></Panel> : null}
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
          onBidHint={() => {
            const a = bidAdvice(game.hands[ME])
            setHint({
              text: a.contract ? m.bid_hint_limit({ contract: contractName(a.contract), limit: a.limit }) : m.bid_hint_pass(),
            })
          }}
          onDiscardHint={() => {
            const plan = chooseDeclaration(game.hands[ME], game.bid)
            setHint({
              cards: plan.discard,
              text: m.skat_hint({ cards: plan.discard.map(cardLabel).join(m.list_and()), contract: contractName(plan.declaration.contract) }),
            })
          }}
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
        <span {...stylex.props(styles.face)}>{FACES[seat]}</span>
        <div {...stylex.props(styles.seatText)}>
          <span {...stylex.props(styles.seatName)}>{nameOf(seat)}</span>
          <span {...stylex.props(styles.seatMeta)}>
            {role}
            {isDeclarer ? ` · ${m.table_declarer_word()}` : ''} · {m.table_seat_score({ n: score })}
          </span>
        </div>
        {said ? <span {...stylex.props(styles.bubble)}>{said}</span> : null}
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
    return <DeclarePicker game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} />
  }

  return (
    <Row>
      <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say>
      <Btn testId="skat-hint" tone="felt" size="sm" onClick={p.onPlayHint}>{m.play_hint_button()}</Btn>
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({ game, draft, setDraft, onDeclare }: { game: Game; draft: Declaration | null; setDraft: (d: Declaration | null) => void; onDeclare: (d: Declaration) => void }) {
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
              {...stylex.props(styles.contractBtn, chosen && styles.contractChosen, v < game.bid && styles.contractShort)}
            >
              <span {...stylex.props(styles.contractName)}><Rich text={contractName(c)} /></span>
              <span {...stylex.props(styles.contractValue)}>{m.declare_worth({ value: v })}{v < game.bid ? m.declare_short() : ''}</span>
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
          <p {...stylex.props(styles.note)}>
            {value >= game.bid
              ? m.declare_covers({ contract: `${contractName(draft.contract)}${draft.hand ? ' Hand' : ''}`, value, bid: game.bid })
              : m.declare_overbid({ contract: contractName(draft.contract), value, bid: game.bid })}
            {isHand && draft.contract.kind !== 'null' ? m.declare_hand_note() : ''}
          </p>
        </Panel>
      ) : null}
      <Row>
        <Btn testId="skat-declare" disabled={!draft} onClick={() => draft && onDeclare(draft)}>{m.declare_go()}</Btn>
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
          <h3 {...stylex.props(styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
          <p {...stylex.props(styles.note)}>
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
            <p data-testid="skat-result-points" {...stylex.props(styles.note)}>
              <Rich text={m.result_points({ declarer: r.declarerPoints, defenders: r.defenderPoints })} />
            </p>
          )}
          <p data-testid="skat-result-formula" {...stylex.props(styles.note)}>{m.result_formula({ formula })}</p>
          <p {...stylex.props(styles.note)}>
            <Rich text={scoreLine(declarer, r.won, r.score > 0 ? `+${r.score}` : String(r.score))} />
          </p>
          <div {...stylex.props(styles.resultSkat)}>
            <span {...stylex.props(styles.inkLabel)}>{m.result_skat()}</span>
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
    <button type="button" aria-pressed={on} onClick={onClick} {...stylex.props(styles.toggle, on && styles.toggleOn)}>
      {on ? '☑' : '☐'} {children}
    </button>
  )
}

const Row = ({ children }: { children: ReactNode }) => <div {...stylex.props(styles.row)}>{children}</div>
const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(styles.say)}>{children}</p>

// Where a card flies in from: each player's side of the table.
const FROM: Record<Seat, { x: number; y: number }> = { 0: { x: 0, y: 90 }, 1: { x: -120, y: -40 }, 2: { x: 120, y: -40 } }

const styles = stylex.create({
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: { default: 16, '@media (max-width: 480px)': 10 },
    borderRadius: 24,
    backgroundColor: skat.felt,
    backgroundImage: `radial-gradient(ellipse at 50% 35%, ${skat.feltLight} 0%, ${skat.felt} 55%, ${skat.feltDeep} 100%)`,
    boxShadow: `inset 0 0 0 3px ${skat.feltDeep}, 0 10px 30px ${skat.shadow}`,
    color: skat.white,
    overflow: 'hidden',
  },
  opponents: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  seat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    borderRadius: 14,
    backgroundColor: skat.feltDeep,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'transparent',
    minWidth: 0,
  },
  seatActive: { borderColor: skat.brass },
  seatHead: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 },
  face: { fontSize: 26, lineHeight: 1 },
  seatText: { display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 },
  seatName: { fontWeight: 800, fontSize: 15 },
  seatMeta: { fontSize: 12, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bubble: {
    backgroundColor: skat.paper,
    color: skat.ink,
    fontWeight: 800,
    fontSize: 14,
    paddingBlock: 4,
    paddingInline: 10,
    borderRadius: 12,
    whiteSpace: 'nowrap',
  },
  backs: { display: 'flex', paddingRight: 22, minHeight: 48 },
  backSlot: { flexBasis: 22, flexShrink: 1, minWidth: 8 },
  centre: { position: 'relative', height: { default: 230, '@media (max-width: 480px)': 190 } },
  skatPile: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skatCards: { display: 'flex', gap: 6 },
  feltLabel: { fontSize: 12, fontWeight: 700, opacity: 0.9 },
  inkLabel: { fontSize: 13, fontWeight: 700, color: skat.inkSoft },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  trickNote: { position: 'absolute', left: 0, right: 0, top: 4, display: 'flex', justifyContent: 'center' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  mine: { display: 'flex', flexDirection: 'column', gap: 2 },
  mineHead: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: { default: 14, '@media (max-width: 480px)': 12 },
    borderRadius: 18,
    backgroundColor: skat.paper,
    color: skat.ink,
  },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  say: { margin: 0, fontSize: 15, lineHeight: 1.5, flexBasis: '100%', color: skat.ink },
  // Colour is stated on every heading and paragraph in the course: the app theme colours `h*` and
  // `p` itself, and in dark mode that colour is a light one — unreadable on this paper.
  note: { margin: 0, fontSize: 14, lineHeight: 1.6, color: skat.ink },
  declare: { display: 'flex', flexDirection: 'column', gap: 10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: 'repeat(6, 1fr)', '@media (max-width: 600px)': 'repeat(3, 1fr)' }, gap: 8 },
  contractBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingBlock: 10,
    paddingInline: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  contractChosen: { borderColor: skat.brassDeep, backgroundColor: skat.brassSoft },
  contractShort: { opacity: 0.6 },
  contractName: { fontSize: 16, fontWeight: 800 },
  contractValue: { fontSize: 12, color: skat.inkSoft },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  toggle: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: skat.paperEdge,
    backgroundColor: skat.white,
    color: skat.ink,
    borderRadius: 999,
    paddingBlock: 6,
    paddingInline: 12,
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleOn: { backgroundColor: skat.brassSoft, borderColor: skat.brassDeep },
  resultBody: { display: 'flex', flexDirection: 'column', gap: 6 },
  resultTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: skat.ink },
  resultSkat: { display: 'flex', alignItems: 'center', gap: 6 },
})

// The three places a played card lands: in front of whoever played it.
const positions = stylex.create({
  0: { left: '50%', bottom: 0, marginLeft: { default: -36, '@media (max-width: 480px)': -29 } },
  1: { left: { default: '22%', '@media (max-width: 480px)': '10%' }, top: 22 },
  2: { right: { default: '22%', '@media (max-width: 480px)': '10%' }, top: 22 },
})
