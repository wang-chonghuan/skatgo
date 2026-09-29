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
import { Link } from '@tanstack/react-router'
import { ChevronUp, GraduationCap, Spade } from 'lucide-react'

import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { confettiBurst, icon, trick } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev, fill, pose } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Fan } from './card-row'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Pill, Rich, linkLook } from './ui'

// A whole game of Skat against two computer players. All rules live in ~/lib/skat/game; this file
// renders a state and dispatches the learner's moves, and lets the computers move on a timer so the
// learner can follow what happened.
//
// SKATGO-26, the lobby design's card table (reference.md), laid out for Skat's three players:
//   the felt     — a radial green; the opponents' seat plates and face-down stacks down the left and
//                  right edges; a gold frame in the centre holding the skat, the trick, or the action
//                  box (Reizen, the skat, the contract picker); the learner's amber plate and hand
//                  along the bottom;
//   the panel    — 450 wide on grey: the game tab, the Reizen history in dark columns, the contract
//                  and the count, notes and hints, and the block buttons (blue hint, red leave). On a
//                  phone it is a bottom sheet that opens from one summary line;
//   the dialogs  — the settlement and a passed-in deal, white on a scrim.
// Inside a lesson the same table is embedded: the panel stacks under the felt and there is no leave.

const ME: Seat = 0
/** A seat's name in the current language — read at render, so it is always the page's language. */
const nameOf = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()
const FACES: Record<Seat, string> = { 0: '🙂', 1: '👩‍🦰', 2: '🧔' }

const BOT_DELAY = 850
const TRICK_DELAY = 1300

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
  /** Free play: the table fills the screen and offers a way out. A lesson embeds it instead. */
  fullScreen?: boolean
}

export function GameTable({ onSettled, fullScreen = false }: Props) {
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

  const [sheetOpen, setSheetOpen] = useState(false)
  const inFrameActions = game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'declare'
  const status = who === null ? null : who === ME ? (game.phase === 'play' ? m.table_your_turn() : m.table_your_move()) : m.table_whose_turn({ name: nameOf(who) })

  return (
    <div data-testid="skat-table" data-phase={game.phase} data-layout={fullScreen ? 'full' : 'embedded'} {...stylex.props(styles.table, fullScreen ? styles.tableFull : styles.tableEmbedded)}>
      <div data-testid="skat-felt" {...stylex.props(styles.felt, fullScreen && styles.feltFull)}>
        {([1, 2] as Seat[]).map((seat) => (
          <SeatSide
            key={seat}
            seat={seat}
            game={game}
            active={who === seat}
            said={game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null}
            score={scores[seat]}
          />
        ))}

        <div data-testid="skat-frame" data-mode={inFrameActions && myTurn ? 'action' : 'trick'} {...stylex.props(styles.frame, inFrameActions && myTurn ? styles.frameAction : styles.framePlay)}>
          {/* The pile is on the table until somebody picks it up; after that the two cards are in a hand. */}
          {(game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'passedIn') && game.skat.length > 0 ? (
            <div {...stylex.props(styles.skatPile)}>
              <div {...stylex.props(styles.skatCards)}>
                {game.skat.map((c, i) => (
                  <PlayingCard key={i} card={c} faceDown size="sm" />
                ))}
              </div>
              <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{m.table_skat()}</span>
            </div>
          ) : null}

          {inFrameActions && myTurn ? (
            <div data-testid="skat-actions" {...stylex.props(styles.actionBox)}>
              {hint ? <Panel tone="tip"><p {...stylex.props(typography.appText, styles.note)}>💡 <Rich text={hint.text} /></p></Panel> : null}
              <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} setGame={setGame} setPicked={setPicked} setHint={setHint} onNewGame={newGame} />
            </div>
          ) : (
            <>
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
                    <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{nameOf(p.seat)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {game.phase === 'trickEnd' && winner !== null ? (
                <div {...stylex.props(styles.trickNote)}>
                  <Pill tone="amber">{winner === ME ? m.table_trick_you() : m.table_trick_other({ name: nameOf(winner) })}</Pill>
                </div>
              ) : status && game.trick.length === 0 ? (
                <p data-testid="skat-status" {...stylex.props(typography.tableStatus, styles.status)}>{status}</p>
              ) : null}
              {game.phase === 'play' || game.phase === 'trickEnd' ? (
                <>
                  <span {...stylex.props(styles.countLeft)}>
                    <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{roleName(roleOf(game.declarer ?? ME, game.dealer))}</span>
                    <span {...stylex.props(typography.tricksLabel, styles.countValue)}>{points.declarer}</span>
                  </span>
                  <span {...stylex.props(styles.countRight)}>
                    <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{m.table_defender_word()}</span>
                    <span {...stylex.props(typography.tricksLabel, styles.countValue)}>{points.defenders}</span>
                  </span>
                </>
              ) : null}
            </>
          )}
        </div>

        <div {...stylex.props(styles.mine)}>
          <Plate seat={ME} game={game} mine active={myTurn} score={scores[ME]} />
          <Fan
            testId="skat-hand"
            cards={myHand}
            size="table"
            onPick={onCard}
            selected={picked}
            legal={legal}
            glow={hint?.card ? [hint.card] : hint?.cards ?? []}
          />
        </div>
      </div>

      <aside data-testid="skat-panel" data-open={String(sheetOpen)} {...stylex.props(styles.panel, fullScreen && styles.panelFull, fullScreen && !sheetOpen && styles.panelCollapsed)}>
        {fullScreen ? (
          <button type="button" aria-label={m.table_panel_toggle()} aria-expanded={sheetOpen} data-testid="skat-panel-toggle" onClick={() => setSheetOpen((o) => !o)} {...stylex.props(styles.sheetHandle)}>
            <span {...stylex.props(typography.panelLabel, styles.sheetSummary)}>
              {contract ? contractName(contract) : game.declarer === null ? m.table_bidding() : m.table_awaiting_contract()}
              {status ? ` · ${status}` : ''}
            </span>
            <span {...stylex.props(styles.sheetChevron, sheetOpen && styles.sheetChevronOpen)}>
              <ChevronUp size={icon.table} strokeWidth={icon.outline} />
            </span>
          </button>
        ) : null}

        <div {...stylex.props(styles.panelBody)}>
          {fullScreen ? (
            <div {...stylex.props(styles.tabs)}>
              <span data-state="active" {...stylex.props(styles.tab)}>
                <span {...stylex.props(styles.tabTile, styles.tabTileActive)}><Spade size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.railLabel)}>{m.table_game_tab()}</span>
              </span>
              <Link to="/course" {...stylex.props(styles.tab, styles.tabLink)}>
                <span {...stylex.props(styles.tabTile)}><GraduationCap size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.railLabel)}>{m.nav_course()}</span>
              </Link>
            </div>
          ) : null}

          <section data-testid="skat-history" {...stylex.props(styles.history)}>
            <h2 {...stylex.props(typography.panelLabel, styles.panelTitle)}>{m.table_history()}</h2>
            <div {...stylex.props(styles.auction)}>
              {([1, ME, 2] as Seat[]).map((seat) => (
                <div key={seat} {...stylex.props(styles.auctionCol)}>
                  <span {...stylex.props(typography.auctionHead, styles.auctionHead)}>{nameOf(seat)}</span>
                  <div {...stylex.props(styles.auctionCells)}>
                    {game.bidding.log
                      .filter((e) => e.seat === seat)
                      .map((e, i) => (
                        <span key={i} {...stylex.props(typography.bidChip, styles.chip, e.say === 'pass' ? styles.chipPass : styles.chipBid)}>
                          {e.say === 'pass' ? m.bid_pass() : e.value}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div data-testid="skat-strip" {...stylex.props(styles.strip)}>
            {contract ? <Pill tone="amber">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : <Pill tone="dark">{game.declarer === null ? m.table_bidding() : m.table_awaiting_contract()}</Pill>}
            {game.declarer !== null ? <Pill tone="quiet">{m.table_declarer({ name: nameOf(game.declarer), bid: game.bid })}</Pill> : null}
            {game.phase === 'play' || game.phase === 'trickEnd' ? (
              <Pill tone="quiet">{m.table_trick_count({ n: Math.min(10, game.tricks.length + 1), declarer: points.declarer, defenders: points.defenders })}</Pill>
            ) : null}
          </div>

          {!inFrameActions || !myTurn ? (
            <div data-testid={inFrameActions ? undefined : 'skat-actions'} {...stylex.props(styles.panelNotes)}>
              {refusal ? <Panel tone="bad"><p {...stylex.props(typography.appText, styles.note)}><Rich text={refusal} /></p></Panel> : null}
              {hint ? <Panel tone="tip"><p {...stylex.props(typography.appText, styles.note)}>💡 <Rich text={hint.text} /></p></Panel> : null}
              {inFrameActions ? null : <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} setGame={setGame} setPicked={setPicked} setHint={setHint} onNewGame={newGame} />}
            </div>
          ) : refusal ? (
            <Panel tone="bad"><p {...stylex.props(typography.appText, styles.note)}><Rich text={refusal} /></p></Panel>
          ) : null}

          <div {...stylex.props(styles.panelFoot)}>
            {game.phase === 'play' && myTurn ? (
              <Btn testId="skat-hint" tone="info" shape="block" size="md" grow onClick={showPlayHint}>{m.play_hint_button()}</Btn>
            ) : null}
            {fullScreen ? (
              <Link to="/" data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}

/** Every move the learner can make now, wired to the game. */
function ActionsFor({
  game,
  picked,
  draft,
  setDraft,
  setGame,
  setPicked,
  setHint,
  onNewGame,
}: {
  game: Game
  picked: Card[]
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  setGame: (update: (g: Game) => Game) => void
  setPicked: (cards: Card[]) => void
  setHint: (h: { card?: Card; cards?: Card[]; text: string } | null) => void
  onNewGame: () => void
}) {
  return (
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
      onPlayHint={() => {
        const h = playHint(game)
        if (h) setHint(h)
      }}
      onNewGame={onNewGame}
    />
  )
}

/** An opponent's side of the felt: the seat plate, the last thing said in Reizen, and the stack of
 *  face-down cards down the edge — face up for an Ouvert declarer. */
function SeatSide({ seat, game, active, said, score }: { seat: Seat; game: Game; active: boolean; said: string | null; score: number }) {
  const isDeclarer = game.declarer === seat
  const open = isDeclarer && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd')
  return (
    <div data-testid={`skat-seat-${seat}`} {...stylex.props(styles.side, seat === 1 ? styles.sideLeft : styles.sideRight)}>
      <Plate seat={seat} game={game} active={active} score={score} />
      {said ? <span {...stylex.props(typography.bidChip, styles.chip, said === m.bid_pass() ? styles.chipPass : styles.chipBid)}>{said}</span> : null}
      <div {...stylex.props(styles.stack)}>
        {open
          ? sortHand(game.hands[seat], game.declaration!.contract).map((c) => <div key={cardId(c)} {...stylex.props(styles.stackSlot)}><PlayingCard card={c} size="sm" /></div>)
          : game.hands[seat].map((c, i) => <div key={i} {...stylex.props(styles.stackSlot)}><PlayingCard card={c} faceDown size="sm" /></div>)}
      </div>
    </div>
  )
}

/** A seat plate: the role tag, the face and name, and the seat's running total. The learner's is amber. */
function Plate({ seat, game, mine, active, score }: { seat: Seat; game: Game; mine?: boolean; active: boolean; score: number }) {
  const role = roleName(roleOf(seat, game.dealer))
  const isDeclarer = game.declarer === seat
  return (
    <div data-testid={mine ? 'skat-plate-me' : undefined} data-active={String(active)} {...stylex.props(styles.plate, mine && styles.plateMine, active && styles.plateActive)}>
      <span aria-hidden="true" {...stylex.props(typography.roleTag, styles.roleTag)}>{role.slice(0, 1).toUpperCase()}</span>
      <span {...stylex.props(typography.plateName, styles.plateText)}>
        <span {...stylex.props(!mine && styles.wideOnly)}>{FACES[seat]} </span>
        {nameOf(seat)}
        <span {...stylex.props(!mine && styles.wideOnly)}>
          {' · '}
          {role}
          {isDeclarer ? ` · ${m.table_declarer_word()}` : game.declarer !== null && mine ? ` · ${m.table_defender_word()}` : ''}
        </span>
      </span>
      <span {...stylex.props(typography.plateName, styles.plateScore, !mine && styles.wideOnly)}>{mine ? m.table_total({ n: score }) : m.table_seat_score({ n: score })}</span>
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
      <Dialog>
        <Say>{m.table_passed_in()}</Say>
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={p.onNewGame}>{m.table_redeal()}</Btn>
      </Dialog>
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
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}><span {...stylex.props(typography.bidChip)}>{m.bid_take_18()}</span></Btn>
          <Pass onClick={() => p.onBid('pass')} />
          <Btn tone="info" shape="block" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    if (b.awaiting === 'speaker') {
      const value = nextBid(b.value)
      return (
        <Row>
          <Say>{m.bid_your_turn({ name: nameOf(b.listener) })}</Say>
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}><span {...stylex.props(typography.bidChip)}>{m.bid_button({ value: value ?? '' })}</span></Btn>
          <Pass onClick={() => p.onBid('pass')} />
          <Btn tone="info" shape="block" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.bid_asked({ name: nameOf(b.speaker), value: b.value })}</Say>
        <Btn testId="skat-hold" shape="block" size="lg" onClick={() => p.onBid('hold')}><span {...stylex.props(typography.bidChip)}>{m.bid_hold_button({ value: b.value })}</span></Btn>
        <Pass onClick={() => p.onBid('pass')} />
        <Btn tone="info" shape="block" size="sm" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'skat') {
    if (!game.pickedUp) {
      return (
        <Row>
          <Say>{m.skat_won_bid({ bid: game.bid })}</Say>
          <Btn testId="skat-pickup" shape="block" size="lg" onClick={p.onPickUp}>{m.skat_pick_up()}</Btn>
          <Btn testId="skat-hand-game" tone="quiet" shape="block" size="lg" onClick={p.onHand}>{m.skat_play_hand()}</Btn>
          <Btn testId="skat-skat-hint" tone="info" shape="block" size="sm" onClick={p.onSkatHint}>{m.skat_hint_button()}</Btn>
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.skat_discard_prompt()}</Say>
        <Btn testId="skat-discard" shape="block" size="lg" disabled={p.picked.length !== 2} onClick={p.onDiscard}>{m.skat_discard_button({ n: p.picked.length })}</Btn>
        <Btn tone="info" shape="block" size="sm" onClick={p.onDiscardHint}>{m.skat_discard_hint_button()}</Btn>
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} onHint={p.onDeclareHint} />
  }

  return (
    <Row>
      <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say>
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
              {...stylex.props(typography.contractTile, styles.contractBtn, contractTint[tintOf(c)], chosen && styles.contractChosen, v < game.bid && styles.contractShort)}
            >
              <span><Rich text={contractName(c)} /></span>
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
        <Btn testId="skat-declare" shape="block" size="lg" grow disabled={!draft} onClick={() => draft && onDeclare(draft)}>{m.declare_go()}</Btn>
        <Btn testId="skat-declare-hint" tone="info" shape="block" size="sm" onClick={onHint}>{m.declare_hint_button()}</Btn>
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
    <Dialog>
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      <Panel tone={humanWon ? 'good' : 'bad'}>
        <div {...stylex.props(styles.resultBody)}>
          <h3 {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
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
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={onNewGame}>{m.result_new_game()}</Btn>
      </Row>
    </div>
    </Dialog>
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
const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(typography.appText, styles.say)}>{children}</p>

/** "Passe": the wide green button, set in the condensed numerals face. */
function Pass({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" data-testid="skat-pass" onClick={onClick} {...stylex.props(typography.passBig, styles.pass)}>
      {m.bid_pass()}
    </button>
  )
}

/** A dialog over the table: white, on the scrim, one full-width green action inside. */
function Dialog({ children }: { children: ReactNode }) {
  return (
    <div data-testid="skat-dialog" {...stylex.props(styles.scrim)}>
      <div role="dialog" aria-modal="false" {...stylex.props(styles.dialog)}>
        {children}
      </div>
    </div>
  )
}

type Tint = 'C' | 'S' | 'H' | 'D' | 'grand' | 'null'
const tintOf = (c: Contract): Tint => (c.kind === 'suit' ? c.trump : c.kind)


const styles = stylex.create({
  table: {
    position: 'relative',
    display: 'grid',
    backgroundColor: color.page,
    overflow: 'hidden',
  },
  // Free play: the felt fills the screen beside the 450-wide panel; on a phone the panel is a sheet.
  tableFull: {
    gridTemplateColumns: { default: dims.tableColumns, [bp.phone]: dims.oneColumn },
    minHeight: dims.screenDynamic,
  },
  // Inside a lesson: the panel stacks under the felt.
  tableEmbedded: { gridTemplateColumns: dims.oneColumn, borderRadius: radii.panel },

  felt: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: { default: dims.feltColumns, [bp.phone]: dims.feltColumnsPhone },
    gridTemplateRows: dims.feltRows,
    alignItems: 'center',
    justifyItems: 'center',
    gap: space.x12,
    minHeight: dims.tableEmbedded,
    paddingBlock: space.x16,
    paddingInline: { default: space.x16, [bp.phone]: space.x6 },
    boxSizing: 'border-box',
    backgroundImage: fill.felt,
    color: color.onColor,
  },
  feltFull: { minHeight: { default: dims.screenDynamic, [bp.phone]: dims.screenDynamic }, paddingBottom: { default: space.x16, [bp.phone]: dims.sheetCollapsed } },

  side: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x8, alignSelf: 'stretch', justifyContent: 'center', minWidth: 0 },
  sideLeft: { gridColumn: 1, gridRow: 1 },
  sideRight: { gridColumn: dims.column3, gridRow: 1 },
  stack: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  stackSlot: { marginTop: { default: dims.backOverlap, [bp.phone]: dims.backOverlapPhone, ':first-child': 0 } },

  plate: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x6,
    width: { default: dims.plateWidth, [bp.phone]: dims.plateWidthPhone },
    maxWidth: '100%',
    minHeight: dims.plateHeight,
    boxSizing: 'border-box',
    paddingRight: space.x8,
    borderRadius: radii.tag,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.plate,
    color: color.onColor,
    overflow: 'hidden',
  },
  plateMine: { backgroundColor: color.amber, color: color.plate },
  plateActive: { borderColor: color.gold },
  roleTag: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.roleTag,
    height: dims.roleTag,
    borderRadius: radii.tag,
    backgroundColor: color.roleTag,
    color: color.onColor,
  },
  plateText: { flexGrow: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  plateScore: { flexShrink: 0, opacity: opacity.meta },
  // An opponent's plate on a phone keeps the role tag and the name; the rest is in the panel.
  wideOnly: { display: { default: 'inline', [bp.phone]: 'none' } },

  frame: {
    gridColumn: dims.column2,
    gridRow: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderColor: color.gold,
  },
  framePlay: {
    width: { default: dims.framePlay, [bp.phone]: dims.framePhone },
    aspectRatio: dims.square,
    borderWidth: dims.frameBorderPlay,
  },
  frameAction: { width: dims.frameAction, minHeight: dims.frameBid, padding: space.x16, borderWidth: dims.frameBorderBid },
  skatPile: { position: 'absolute', top: space.x12, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6 },
  skatCards: { display: 'flex', gap: space.x6 },
  goldLabel: { color: color.amber },
  status: { margin: 0, color: color.onColor, textAlign: 'center', paddingInline: space.x12 },
  countLeft: { position: 'absolute', left: space.x8, bottom: space.x8, display: 'flex', flexDirection: 'column' },
  countRight: { position: 'absolute', right: space.x8, bottom: space.x8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  countValue: { color: color.onColor },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4 },
  trickNote: { position: 'absolute', left: 0, right: 0, top: space.x8, display: 'flex', justifyContent: 'center' },

  // The action box inside the frame: white, like the reference's bid box.
  actionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    width: '100%',
    marginTop: dims.actionOffset,
    padding: space.x16,
    boxSizing: 'border-box',
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.text,
  },

  mine: { gridColumn: dims.fullRow, gridRow: dims.row2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x8, width: '100%' },

  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: color.page,
    color: color.text,
  },
  panelFull: {
    position: { default: 'relative', [bp.phone]: 'fixed' },
    insetInline: { default: 'auto', [bp.phone]: 0 },
    bottom: { default: 'auto', [bp.phone]: 0 },
    zIndex: { default: 'auto', [bp.phone]: layer.launcher },
    width: { default: dims.sidePanel, [bp.phone]: '100%' },
    maxHeight: { default: 'none', [bp.phone]: dims.sheetMax },
    borderTopLeftRadius: radii.panel,
    borderBottomLeftRadius: { default: radii.panel, [bp.phone]: 0 },
    borderTopRightRadius: { default: 0, [bp.phone]: radii.panel },
    boxShadow: elev.panel,
  },
  panelCollapsed: { maxHeight: { default: 'none', [bp.phone]: dims.sheetCollapsed } },
  sheetHandle: {
    display: { default: 'none', [bp.phone]: 'flex' },
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x8,
    minHeight: dims.sheetCollapsed,
    flexShrink: 0,
    paddingInline: space.x16,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.navy,
    cursor: 'pointer',
  },
  sheetSummary: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sheetChevron: { display: 'flex', transitionProperty: 'transform', transitionDuration: timing.tile },
  sheetChevronOpen: { transform: pose.flip },
  panelBody: { display: 'flex', flexDirection: 'column', gap: space.x16, flexGrow: 1, padding: space.x16, overflowY: 'auto' },
  tabs: { display: 'flex', justifyContent: 'space-around', paddingBottom: space.x16, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  tab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4, color: color.slateDeep, textDecoration: 'none' },
  tabLink: { outlineStyle: { default: 'none', ':focus-visible': 'solid' }, outlineWidth: border.focus, outlineColor: color.info },
  tabTile: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: dims.tabTile, height: dims.tabTile, borderRadius: radii.panel, backgroundColor: color.hairline, color: color.navy },
  tabTileActive: { backgroundColor: color.tabActive },
  history: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  panelTitle: { margin: 0, color: color.navy, textAlign: 'center' },
  auction: { display: 'grid', gridTemplateColumns: dims.auctionColumns, gap: space.x8 },
  auctionCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6 },
  auctionHead: { color: color.auctionHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  auctionCells: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    width: '100%',
    minHeight: dims.auctionHeight,
    padding: space.x6,
    boxSizing: 'border-box',
    borderRadius: radii.column,
    backgroundColor: color.plate,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: dims.roleTag,
    paddingBlock: space.x6,
    paddingInline: space.x8,
    borderRadius: radii.tag,
  },
  chipPass: { backgroundColor: color.go, color: color.onColor },
  chipBid: { backgroundColor: color.tintHearts, color: color.plate },
  strip: { display: 'flex', flexWrap: 'wrap', gap: space.x6, justifyContent: 'center' },
  panelNotes: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  panelFoot: { display: 'flex', flexDirection: 'column', gap: space.x12, marginTop: 'auto' },

  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x10 },
  say: { margin: 0, flexBasis: '100%', color: color.navy },
  note: { margin: 0, color: color.text },
  pass: {
    flexGrow: 1,
    minHeight: space.x48,
    paddingInline: space.x24,
    borderWidth: 0,
    borderRadius: radii.panel,
    backgroundColor: color.go,
    color: color.onColor,
    boxShadow: elev.btnGo,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  declare: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: dims.contractColumns, [bp.contracts]: dims.contractColumnsPhone }, gap: space.x8 },
  contractBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x2,
    paddingBlock: space.x12,
    paddingInline: space.x4,
    borderRadius: radii.column,
    borderWidth: border.frame,
    borderStyle: 'solid',
    borderColor: 'transparent',
    color: color.plate,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  contractChosen: { borderColor: color.navy },
  contractShort: { opacity: opacity.spent },
  contractValue: { color: color.slateDeep },
  toggles: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  toggle: {
    minHeight: dims.control,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
    color: color.navy,
    borderRadius: radii.pill,
    paddingInline: space.x16,
    cursor: 'pointer',
  },
  toggleOn: { backgroundColor: color.goodSoft, borderColor: color.go },
  resultBody: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  resultTitle: { margin: 0, color: color.navy },
  resultSkat: { display: 'flex', alignItems: 'center', gap: space.x6 },
  inkLabel: { color: color.slate },

  scrim: {
    position: 'absolute',
    inset: 0,
    zIndex: layer.window,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.x16,
    backgroundColor: color.scrim,
  },
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.frameAction,
    maxHeight: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: space.x24,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
  },
})

// One tint per game, as the reference tints its bid box by strain (Grand and Null derived).
const contractTint = stylex.create({
  C: { backgroundColor: color.tintClubs },
  S: { backgroundColor: color.tintSpades },
  H: { backgroundColor: color.tintHearts },
  D: { backgroundColor: color.tintDiamonds },
  grand: { backgroundColor: color.tintGrand },
  null: { backgroundColor: color.tintNull },
})

// The three places a played card lands in the frame: in front of whoever played it.
const positions = stylex.create({
  0: { left: dims.half, bottom: space.x12, marginLeft: dims.trickHalf },
  1: { left: space.x12, top: space.x48 },
  2: { right: space.x12, top: space.x48 },
})
