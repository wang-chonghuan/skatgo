import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { type Card, type Contract, SUITS, cardId, effectiveSuit, sameCard, sortHand } from '~/lib/skat/cards'
import { bidHint, declareHint, discardHint, playHint, skatHint } from '~/lib/skat/hints'
import { useTableSnapshot } from '~/lib/skat/table-snapshot'
import { visibleTable } from '~/lib/skat/table-view'
import { cardLabel, contractName, ledName, partLabel, roleName, settleReason } from '~/lib/skat/i18n'
import {
  type Game,
  type Move,
  type Seat,
  actor,
  adviceFor,
  aiBid,
  aiDeclare,
  applyMove,
  bidAction,
  claimLine,
  collectTrick,
  deal,
  legalFor,
  next,
  playCard,
  normalise,
  roleOf,
  runningPoints,
  trickWinner,
} from '~/lib/skat/game'
import { type Auction, type DealSummary, seegerFabian } from '~/lib/skat/tournament'
import { type Declaration, expectedValue, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, GraduationCap, Lightbulb, Settings, Spade, X } from 'lucide-react'

import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { confettiBurst, drawer, icon, pinnedQuery, tapHint, trick } from '../../theme/constants'
import { layerHint, move, timing } from '../../theme/effects.stylex'
import { elev, fill, pose } from '../../theme/elevation.stylex'
import { border, layer, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { stage } from '../../theme/table.stylex'
import { typography } from '../../theme/type'
import { Fan, flightId } from './card-row'
import { DealVsAi, Fold, VsAiTable } from './daily-comparison'
import { SettingsDialog } from './frame'
import { PlayingCard } from './playing-card'
import { Btn, Panel, Pill, Rich, linkLook } from './ui'

// A whole game of Skat against two computer players. All rules live in ~/lib/skat/game; this file
// renders a state and dispatches the learner's moves, and lets the computers move on a timer so the
// learner can follow what happened.
//
// SKATGO-26, the lobby design's card table (reference.md), laid out for Skat's three players:
//   the felt     — a radial green under a fine grain; both opponents' hands in the learner's card size,
//                  sideways and running off the left and right edges; a gold frame in the centre holding
//                  the skat, the trick, or the action box (Reizen, the skat, the contract picker), with
//                  the seat plates on its edges; the hint tab on the left edge; the learner's hand in a
//                  row along the bottom;
//   the panel    — on grey: the game tab, the Reizen history in dark columns, the contract and the
//                  count, and the red leave button. On a wide screen it is pinned beside the felt and
//                  the table scales to the width it leaves (SKATGO-34, as Funbridge's); narrower, it is
//                  a drawer parked off the right edge. A white tab folds it either way;
//   the dialogs  — the settlement and a passed-in deal, white on a scrim.
// Inside a lesson the same table is embedded: the panel stacks under the felt and there is no leave.
// Free play and lesson 11 (SKATGO-40) play a server game the same way, with hints and the assistant.
// In the daily tournament (SKATGO-35) the server owns the deal: the table draws what it is sent and
// sends the learner's moves, and offers no hints.
//
// Every thing on the felt is sized and placed in the stage's unit (theme/table.stylex.ts), which
// follows the felt's size: the table scales as one, and nothing on it can cover anything else.

const ME: Seat = 0
/** A seat's name in the current language — read at render, so it is always the page's language. */
const defaultName = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()
/** The names at this table: a private table's nicknames (SKATGO-61), or null for You, Lina and Max. */
const Names = createContext<[string, string, string] | null>(null)
function useNameOf() {
  const names = useContext(Names)
  return (seat: Seat) => (names ? names[seat] : defaultName(seat))
}

export const BOT_DELAY = 850

/** A deal the server owns (the daily tournament, SKATGO-35). Nobody at this table plays for the
 *  computers, and there are no hints: the learner's moves go to `send`, and `game` is what came back. */
export type Tournament = {
  game: Game
  /** A move is on its way, or the computers' replies are still being shown one by one. */
  busy: boolean
  send: (move: Move) => void
  /** A finished trick stays on the table until the player taps it away (SKATGO-72). */
  collect: () => void
  /** After a deal: on to the next one, or to the day's result after the last. */
  next: () => void
  /** The deal on the table, 0-based, of `of`. */
  deal: number
  of: number
  /** Seeger-Fabian totals per seat over the day's finished deals. */
  totals: [number, number, number]
  /** The day's finished deals and, for each, the AI's result in the player's seat (SKATGO-42). */
  deals?: DealSummary[]
  benchmarks?: (DealSummary | null)[]
  /** Each finished deal's auction, the player's and the AI's (SKATGO-57). */
  auctions?: Auction[]
  benchmarkAuctions?: (Auction | null)[]
}

/** What the settlement shows in the tournament (SKATGO-57): this deal against the AI first, the day so far
 *  folded away under it. */
type DailyAfter = { compare: ReactNode; day: ReactNode }

/** A game the server owns, as free play and lesson 11 play it (SKATGO-40): the learner's moves go to
 *  `send`, `game` is what came back; hints and the assistant are as at the local table. */
export type ServerGame = Pick<Tournament, 'game' | 'busy' | 'send' | 'collect' | 'next'> & {
  /** The server could not be reached or refused: said plainly, with a way on (SKATGO-40 Q6). */
  problem?: { text: string; retry?: () => void; fresh: () => void } | null
}

/** A private table (SKATGO-61): the room's deal turned so the viewer is seat 0, the people's
 *  nicknames, and the running Seeger-Fabian totals. `next` deals the next one. No hints and no
 *  assistant: the others at the table get none either. */
export type RoomTable = Pick<Tournament, 'game' | 'busy' | 'send' | 'collect' | 'next' | 'totals'> & {
  names: [string, string, string]
  /** Under the result: this deal's scores and the running totals. */
  standings: ReactNode
}

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
  /** Free play: the table fills the screen and offers a way out. A lesson embeds it instead. */
  fullScreen?: boolean
  /** Play the server's deal instead of dealing one here. */
  tournament?: Tournament
  /** Play a server game with hints and the assistant (free play, lesson 11). */
  server?: ServerGame
  /** Play at a private table (SKATGO-61). */
  room?: RoomTable
}

export function GameTable(props: Props) {
  return (
    <Names.Provider value={props.room?.names ?? null}>
      <Table {...props} />
    </Names.Provider>
  )
}

function Table({ onSettled, fullScreen = false, tournament, server, room }: Props) {
  const nameOf = useNameOf()
  const [dealer, setDealer] = useState<Seat>(2)
  const [localGame, setGame] = useState<Game>(() => deal(2))
  const remote = tournament ?? server ?? room
  // The learner's own card goes on the table the moment it is tapped (SKATGO-73); the server's answer,
  // with the computers' replies, replaces it when it comes. Until then the table shows `pending`.
  const [pending, setPending] = useState<{ from: Game; game: Game } | null>(null)
  const game = remote ? (pending && pending.from === remote.game ? pending.game : remote.game) : localGame
  // A card tapped while a finished trick waits: the trick goes, and the card follows at once if the
  // learner is on lead (SKATGO-73).
  const [intent, setIntent] = useState<Card | null>(null)
  const hints = !tournament && !room
  const [scores, setScores] = useState<[number, number, number]>([0, 0, 0])
  const [picked, setPicked] = useState<Card[]>([])
  // The trick's cards that have landed (SKATGO-41). A card flies in on a layer of its own under a
  // will-change hint, and such a layer keeps the scale it was drawn at during the flight: a card at rest
  // on it looks slightly soft (measured). So once it has landed, the flying box — which paints nothing
  // itself — gives up its hint, and the card's face takes a layer of its own drawn at its final size.
  // The card stays off the felt's layer, so nothing under it is painted again.
  const [landed, setLanded] = useState<string[]>([])
  const [hint, setHint] = useState<{ card?: Card; cards?: Card[]; text: string } | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [draft, setDraft] = useState<Declaration | null>(null)
  const settledFor = useRef<Game | null>(null)

  const who = actor(game)
  const contract = game.declaration?.contract ?? null
  const myTurn = who === ME

  // A finished trick waits on the table for the player's tap (SKATGO-72).
  const collect = remote ? remote.collect : () => setGame((g) => (g.phase === 'trickEnd' ? collectTrick(g) : g))

  // The computers move on a timer. The updater re-checks the state it is handed, so a timer that
  // fires late (or twice, under StrictMode) cannot move for the wrong player. A tournament's computers
  // play at the server.
  useEffect(() => {
    if (remote || game.phase === 'trickEnd') return
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
  }, [game, who, remote])

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
  // change and withdrawn when the table leaves the page. Not in the tournament: its answer would be the
  // hint the tournament does not give.
  const publish = useTableSnapshot((s) => s.publish)
  useEffect(() => {
    publish(tournament || room ? null : visibleTable(game, scores))
  }, [game, scores, publish, tournament, room])
  useEffect(() => () => publish(null), [publish])

  /** The learner's move: to the server for a server game, through the engine here otherwise. */
  function dispatch(move: Move) {
    if (!remote) return setGame((g) => applyMove(g, move))
    if (remote.busy) return
    if (move.type === 'play') setPending({ from: remote.game, game: playCard(remote.game, move.card) })
    remote.send(move)
  }

  // A move the server answered without a new state (refused, or not reached): the card goes back.
  const remoteBusy = remote?.busy ?? false
  useEffect(() => {
    if (pending && remote && !remoteBusy && pending.from === remote.game) setPending(null)
  }, [pending, remote, remoteBusy])

  /** A tap while a finished trick waits: on a card in the hand, that card is played next if it can be. */
  function onCollect(card: Card | null) {
    setIntent(card)
    collect()
  }

  function newGame() {
    if (remote) return remote.next()
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
    dispatch({ type: 'play', card })
  }

  // The card tapped while the trick waited is played once the trick has gone — if the learner is on
  // lead then; otherwise it is forgotten (SKATGO-73).
  useEffect(() => {
    if (!intent || game.phase === 'trickEnd') return
    setIntent(null)
    if (myTurn && legal?.some((c) => sameCard(c, intent))) onCard(intent)
    // Only when the table moves on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game])

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

  // The side panel (SKATGO-34): pinned open beside the felt on a wide screen, a closed drawer otherwise —
  // and either way the learner can fold it (SKATGO-29). Crossing the width puts it back to its default.
  // Free play's table is browser-only (client-part.tsx), so the query can be read at once; a lesson's
  // table has no side panel to pin.
  const [pinned, setPinned] = useState(() => fullScreen && window.matchMedia(pinnedQuery).matches)
  const [panelOpen, setPanelOpen] = useState(pinned)
  useEffect(() => {
    if (!fullScreen) return
    const query = window.matchMedia(pinnedQuery)
    const change = () => {
      setPinned(query.matches)
      setPanelOpen(query.matches)
    }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [fullScreen])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const inFrameActions = game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'declare'
  const acting = inFrameActions && myTurn
  const dialog = game.phase === 'passedIn' || game.phase === 'done'
  // With the panel pinned open, the learner's move is made in the panel, as Funbridge's bidding box is
  // (SKATGO-34): nothing then lies over the table. Otherwise it is the drawer over the felt.
  const movesInPanel = fullScreen && pinned && panelOpen
  // In the tournament, after each deal (SKATGO-57): the deal just played against the AI, then the day so
  // far, folded (SKATGO-42, SKATGO-48). The deal on the table is the one the server just recorded.
  const finished = tournament?.deals?.[tournament.deal]
  const dailyAfter: DailyAfter | null = tournament?.deals
    ? {
        compare: finished ? (
          <DealVsAi
            mine={finished}
            ai={tournament.benchmarks?.[tournament.deal] ?? null}
            mineAuction={tournament.auctions?.[tournament.deal]}
            aiAuction={tournament.benchmarkAuctions?.[tournament.deal] ?? null}
          />
        ) : null,
        day: (
          <Fold label={m.daily_day_fold({ n: tournament.deals.length, of: tournament.of })} testId="daily-day-fold">
            <VsAiTable flat deals={tournament.deals} benchmarks={tournament.benchmarks} auctions={tournament.auctions} benchmarkAuctions={tournament.benchmarkAuctions} />
          </Fold>
        ),
      }
    : null

  return (
    <div data-testid="skat-table" data-phase={game.phase} data-layout={fullScreen ? 'full' : 'embedded'} {...stylex.props(styles.table, fullScreen ? styles.tableFull : styles.tableEmbedded)}>
      <div data-testid="skat-felt" {...stylex.props(styles.felt, fullScreen && styles.feltFull)}>
        {/* The felt's cloth on a layer of its own (SKATGO-41): the noise and the gradient are painted
            once, and cards moving over them never paint them again. */}
        <div aria-hidden="true" data-testid="skat-felt-bg" {...stylex.props(styles.feltBackdrop)} />
        {/* The top of the felt (SKATGO-32): the info board, and right under it the table's messages —
            what happens in the play (whose move, who is thinking, who took the trick), a hint the
            learner asked for, or why a card was refused, each until it is closed. The stage keeps this
            band clear (SKATGO-34): nothing on the table reaches into it. */}
        <div data-testid="skat-top" {...stylex.props(styles.top)}>
          <InfoBoard game={game} scores={tournament?.totals ?? room?.totals ?? scores} points={points} />
          {!acting && !dialog ? (
            <div data-testid="skat-words" {...stylex.props(styles.wordsLine)}>
              {game.phase === 'trickEnd' && winner !== null ? (
                <Pill tone="amber">{winner === ME ? m.table_trick_you() : m.table_trick_other({ name: nameOf(winner) })}</Pill>
              ) : (
                <div data-testid="skat-actions" {...stylex.props(styles.words)}>
                  <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} />
                </div>
              )}
            </div>
          ) : null}
          {refusal || hint || server?.problem ? (
            <div data-testid="skat-messages" {...stylex.props(styles.messages)}>
              {server?.problem ? (
                <Panel tone="bad">
                  <div data-testid="server-problem" role="alert" {...stylex.props(styles.message)}>
                    <p {...stylex.props(typography.appText, styles.note, styles.messageText)}>{server.problem.text}</p>
                  </div>
                  <Row>
                    {server.problem.retry ? <Btn testId="server-retry" size="sm" onClick={server.problem.retry}>{m.daily_retry()}</Btn> : null}
                    <Btn testId="server-new-game" tone="quiet" size="sm" onClick={server.problem.fresh}>{m.free_new_game()}</Btn>
                  </Row>
                </Panel>
              ) : null}
              {refusal ? (
                <Message tone="bad" onClose={() => setRefusal(null)}>
                  <Rich text={refusal} />
                </Message>
              ) : null}
              {hint ? (
                <Message tone="tip" testId="skat-hint-text" onClose={() => setHint(null)}>
                  <Rich text={hint.text} />
                </Message>
              ) : null}
            </div>
          ) : null}
        </div>
        {/* Both opponents' hands: the same cards as the learner's, turned sideways and stacked down the
            left and right edges, running off the felt so only part of each shows (SKATGO-26). */}
        {([1, 2] as Seat[]).map((seat) => (
          <Stack key={seat} seat={seat} game={game} />
        ))}

        <div data-testid="skat-frame" {...stylex.props(styles.frame, styles.framePlay)}>
          {/* The pile is on the table until somebody picks it up; after that the two cards are in a hand. */}
          {(game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'passedIn') && game.skat.length > 0 ? (
            <div {...stylex.props(styles.skatPile)}>
              {/* The skat lies in the frame like a played card: as big as a card in the hand (SKATGO-68). */}
              <div {...stylex.props(styles.skatCards)}>
                {game.skat.map((c, i) => (
                  <span key={i} {...stylex.props(styles.frameCard)}>
                    <PlayingCard card={c} faceDown size="fill" />
                  </span>
                ))}
              </div>
              <span {...stylex.props(typography.tricksLabel, styles.goldLabel)}>{m.table_skat()}</span>
            </div>
          ) : null}

          {(
            <>
              <AnimatePresence onExitComplete={() => setLanded([])}>
                {game.trick.map((p) => (
                  <motion.div
                    key={cardId(p.card)}
                    layoutId={p.seat === ME ? flightId(p.card) : undefined}
                    initial={p.seat === ME ? false : { scale: trick.fromScale, ...trick.from[p.seat as keyof typeof trick.from] }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: trick.exitScale, transition: { duration: trick.exitDuration } }}
                    transition={{ ...trick.flight, layout: trick.flight }}
                    onAnimationComplete={() => setLanded((l) => (l.includes(cardId(p.card)) ? l : [...l, cardId(p.card)]))}
                    onLayoutAnimationComplete={() => setLanded((l) => (l.includes(cardId(p.card)) ? l : [...l, cardId(p.card)]))}
                    {...stylex.props(styles.trickCard, !landed.includes(cardId(p.card)) && styles.layered, positions[p.seat])}
                  >
                    <div {...stylex.props(styles.trickFace, landed.includes(cardId(p.card)) && styles.trickFaceLanded)}>
                      <PlayingCard card={p.card} size="fill" glow={game.phase === 'trickEnd' && winner === p.seat} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

          {/* A finished trick stays until the player taps it away (SKATGO-72): anywhere on the screen
              will do, and a hand in the frame's bottom-right corner says so. */}
          {game.phase === 'trickEnd' ? <Collect hand={myHand} onCollect={onCollect} /> : null}

          {/* The seat plates lie on the frame's edges: the opponents' along the left and right, the
              learner's under the bottom edge, all alike (SKATGO-72). */}
          {([1, 2] as Seat[]).map((seat) => (
            <div key={seat} data-testid={`skat-seat-${seat}`} {...stylex.props(styles.plateSlot, seat === 1 ? styles.plateSlotLeft : styles.plateSlotRight)}>
              <Plate seat={seat} game={game} active={who === seat} />
            </div>
          ))}
          <div data-testid="skat-seat-0" {...stylex.props(styles.plateSlot, styles.plateSlotBottom)}>
            <Plate seat={ME} game={game} mine active={myTurn} />
          </div>

          {/* What each opponent last said in Reizen, in the frame's corner on their side. */}
          {([1, 2] as Seat[]).map((seat) => {
            const said = game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null
            return said ? (
              <span key={seat} data-testid={`skat-said-${seat}`} {...stylex.props(typography.bidChip, styles.chip, styles.saidChip, seat === 1 ? styles.saidLeft : styles.saidRight, said === m.bid_pass() ? styles.chipPass : styles.chipBid)}>
                {said}
              </span>
            ) : null
          })}
        </div>

        {/* The learner's move — Reizen, the skat, the discard, the contract — in a drawer that rises from
            the bottom of the table and stops above the hand, which the discard still needs. */}
        <AnimatePresence>
          {acting && !movesInPanel ? (
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="false"
              data-testid="skat-actions"
              initial={{ opacity: 0, y: drawer.rise }}
              animate={{ opacity: 1, y: 0 }}
              // It leaves at once: fading out, it would lie over the words that follow it.
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: drawer.duration }}
              {...stylex.props(styles.drawer)}
            >
              <span aria-hidden="true" {...stylex.props(styles.drawerHandle)} />
              <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* The hint: a tab on the felt's left edge, while it is the learner's card to play. */}
        {hints && game.phase === 'play' && myTurn ? (
          <button type="button" data-testid="skat-hint" aria-label={m.play_hint_button()} title={m.play_hint_button()} onClick={showPlayHint} {...stylex.props(styles.hintTab)}>
            <Lightbulb size={icon.table} strokeWidth={icon.outline} />
          </button>
        ) : null}

        {/* The tab that folds the side panel away and brings it back, mirroring the hint tab on the right
            edge (SKATGO-29). It lives on the felt, so it keeps the hint tab's height at any size; over a
            drawer that is open it sits at the drawer's edge. */}
        {fullScreen ? (
          <button
            type="button"
            aria-label={m.table_panel_toggle()}
            aria-expanded={panelOpen}
            data-testid="skat-panel-toggle"
            onClick={() => setPanelOpen((o) => !o)}
            {...stylex.props(styles.panelTab, panelOpen && !pinned && styles.panelTabOnDrawer)}
          >
            {panelOpen ? <ChevronRight size={icon.inline} strokeWidth={icon.outline} /> : <ChevronLeft size={icon.inline} strokeWidth={icon.outline} />}
          </button>
        ) : null}

        <div {...stylex.props(styles.mine)}>
          <Fan
            flight
            testId="skat-hand"
            cards={myHand}
            size="table"
            row
            onPick={onCard}
            selected={picked}
            legal={legal}
            glow={hint?.card ? [hint.card] : hint?.cards ?? []}
          />
        </div>
      </div>

      <aside
        data-testid="skat-panel"
        data-open={String(panelOpen)}
        data-pinned={String(fullScreen && pinned)}
        {...stylex.props(styles.panel, fullScreen && styles.panelFull, fullScreen && panelOpen && styles.panelOpen, fullScreen && !panelOpen && styles.panelShut)}
      >
        <div {...stylex.props(styles.panelBody, fullScreen && styles.panelBodyFull)}>
          {fullScreen ? (
            <div {...stylex.props(styles.tabs)}>
              <span data-state="active" {...stylex.props(styles.tab)}>
                <span {...stylex.props(styles.tabTile, styles.tabTileActive)}><Spade size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.table_game_tab()}</span>
              </span>
              <Link to="/course" {...stylex.props(styles.tab, styles.tabLink)}>
                <span {...stylex.props(styles.tabTile)}><GraduationCap size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.nav_course()}</span>
              </Link>
              <button type="button" data-testid="settings-open-table" onClick={() => setSettingsOpen(true)} {...stylex.props(typography.control, styles.tab, styles.tabLink, styles.tabButton)}>
                <span {...stylex.props(styles.tabTile)}><Settings size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.settings_open()}</span>
              </button>
            </div>
          ) : null}

          {acting && movesInPanel ? (
            <section data-testid="skat-actions" aria-label={m.table_your_move()} {...stylex.props(styles.panelMoves)}>
              <ActionsFor compact game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} />
            </section>
          ) : null}

          <section data-testid="skat-history" {...stylex.props(styles.history)}>
            <h2 {...stylex.props(typography.panelLabel, styles.panelTitle)}>{m.table_history()}</h2>
            <div {...stylex.props(styles.auction)}>
              {([1, ME, 2] as Seat[]).map((seat) => (
                <div key={seat} {...stylex.props(styles.auctionCol)}>
                  <span {...stylex.props(typography.auctionHead, styles.auctionHead)}>{nameOf(seat)}</span>
                  {/* Where the seat sits this deal, so the order of the bids reads (SKATGO-29). */}
                  <span data-testid="skat-history-role" {...stylex.props(typography.infoSub, styles.auctionRole)}>{roleName(roleOf(seat, game.dealer))}</span>
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
            {tournament ? (
              <Pill tone="dark">
                <span data-testid="daily-progress" data-deal={tournament.deal + 1}>{m.daily_deal_of({ n: tournament.deal + 1, of: tournament.of, total: tournament.totals[ME] })}</span>
              </Pill>
            ) : null}
            {contract ? <Pill tone="amber">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : null}
            {game.declarer !== null ? <Pill tone="quiet">{m.table_declarer({ name: nameOf(game.declarer), bid: game.bid })}</Pill> : null}
            {game.phase === 'play' || game.phase === 'trickEnd' ? (
              <>
                <Pill tone="quiet">{m.info_tricks({ n: Math.min(10, game.tricks.length + 1) })}</Pill>
                <Pill tone="quiet">{m.table_points({ declarer: points.declarer, defenders: points.defenders })}</Pill>
              </>
            ) : null}
          </div>

          <div {...stylex.props(styles.panelFoot)}>
            {fullScreen && tournament ? (
              <Link to="/daily" data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            ) : fullScreen && room ? (
              <Link to="/with-friends" data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            ) : fullScreen ? (
              <Link to="/" data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            ) : null}
          </div>
        </div>
      </aside>

      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}

      {/* The settlement and a passed-in deal are dialogs over the whole table, outside the panel, which
          on a phone is a drawer that slides. */}
      {dialog ? (
        <div data-testid="skat-actions">
          <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} />
        </div>
      ) : null}
    </div>
  )
}

/** Every move the learner can make now, wired to the game. */
function ActionsFor({
  compact,
  game,
  picked,
  draft,
  setDraft,
  dispatch,
  setPicked,
  setHint,
  onNewGame,
  hints,
  dealScore,
  last,
  daily,
  roomAfter,
}: {
  game: Game
  picked: Card[]
  draft: Declaration | null
  setDraft: (d: Declaration | null) => void
  dispatch: (move: Move) => void
  setPicked: (cards: Card[]) => void
  setHint: (h: { card?: Card; cards?: Card[]; text: string } | null) => void
  onNewGame: () => void
  /** In the pinned panel: narrower than the drawer, so the contracts take two rows. */
  compact?: boolean
  /** Whether the hint buttons are offered (not in the tournament). */
  hints: boolean
  /** In the tournament: the deal's Seeger-Fabian score for the learner, shown in the settlement. */
  dealScore: number | null
  /** In the tournament: this is the day's last deal. */
  last: boolean
  /** In the tournament: the AI's result and the running table, shown once the deal is over. */
  daily?: DailyAfter | null
  /** At a private table: the deal's scores and the running totals, shown once it is over. */
  roomAfter?: ReactNode
}) {
  return (
    <Actions
      roomAfter={roomAfter}
      compact={compact}
      game={game}
      picked={picked}
      draft={draft}
      setDraft={setDraft}
      hints={hints}
      dealScore={dealScore}
      last={last}
      daily={daily}
      onBid={(a) => dispatch({ type: 'bid', value: a })}
      onPickUp={() => dispatch({ type: 'pickup' })}
      onHand={() => dispatch({ type: 'hand' })}
      onDiscard={() => {
        dispatch({ type: 'discard', cards: picked })
        setPicked([])
      }}
      onDeclare={(d) => {
        dispatch({ type: 'declare', declaration: d })
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
      onClaim={() => dispatch({ type: 'claim' })}
      onNewGame={onNewGame}
    />
  )
}

/** An opponent's hand: the same card as the learner's, turned sideways, stacked down the felt's edge
 *  and running off it — face up for an Ouvert declarer, face down otherwise. */
function Stack({ seat, game }: { seat: Seat; game: Game }) {
  const open = game.declarer === seat && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd')
  const cards = open ? sortHand(game.hands[seat], game.declaration!.contract) : game.hands[seat]
  return (
    <div data-testid={`skat-stack-${seat}`} aria-hidden={open ? undefined : 'true'} {...stylex.props(styles.stack, seat === 1 ? styles.stackLeft : styles.stackRight)}>
      {cards.map((c, i) => (
        <div key={open ? cardId(c) : i} {...stylex.props(styles.sideSlot)}>
          <span {...stylex.props(styles.sideCard)}>
            <PlayingCard card={c} faceDown={!open} size="fill" />
          </span>
        </div>
      ))}
    </div>
  )
}

/** The tap that takes a finished trick off the table (SKATGO-72): a tap anywhere on the screen, said
 *  by a blinking hand in the frame's corner — still for a player who asked for less motion. */
function Collect({ hand, onCollect }: { hand: Card[]; onCollect: (card: Card | null) => void }) {
  const still = useReducedMotion()
  // The tap lands on the cover; a card of the learner's under it is found by where it landed.
  const tapped = (x: number, y: number) => {
    const id = document.elementsFromPoint(x, y).find((el) => el.closest('[data-testid=skat-hand]') && el.closest('[data-card]'))?.closest('[data-card]')?.getAttribute('data-card')
    return hand.find((c) => cardId(c) === id) ?? null
  }
  return (
    <>
      <motion.svg
        aria-hidden="true"
        data-testid="skat-collect-hand"
        viewBox={tapHint.view}
        animate={still ? undefined : tapHint.blink}
        transition={tapHint.transition}
        {...stylex.props(styles.collectHand)}
      >
        <path d={tapHint.hand} strokeWidth={tapHint.stroke} strokeLinejoin="round" {...stylex.props(styles.collectSkin)} />
        {tapHint.lines.map((d) => (
          <path key={d} d={d} fill="none" strokeWidth={tapHint.stroke} strokeLinecap="round" {...stylex.props(styles.collectLine)} />
        ))}
      </motion.svg>
      {createPortal(
        <button type="button" data-testid="skat-collect" aria-label={m.table_collect()} onClick={(e) => onCollect(tapped(e.clientX, e.clientY))} {...stylex.props(styles.collect)} />,
        document.body,
      )}
    </>
  )
}

/** A seat plate: the role tag and the name — nothing else, so it never has to be cut short. Scores,
 *  the contract and the count are on the info board at the top of the felt. The learner's looks like
 *  the others' (SKATGO-72). */
function Plate({ seat, game, mine, active }: { seat: Seat; game: Game; mine?: boolean; active: boolean }) {
  const nameOf = useNameOf()
  const role = roleName(roleOf(seat, game.dealer))
  // The declarer's tag turns red once the auction has made them declarer (SKATGO-72).
  const declarer = game.declarer === seat
  return (
    <div data-testid={mine ? 'skat-plate-me' : undefined} data-active={String(active)} title={role} {...stylex.props(styles.plate, active && styles.plateActive)}>
      <span aria-hidden="true" data-declarer={String(declarer)} {...stylex.props(typography.roleTag, styles.roleTag, declarer && styles.roleTagDeclarer)}>{role.slice(0, 1).toUpperCase()}</span>
      <span {...stylex.props(typography.plateName, styles.plateText)}>{nameOf(seat)}</span>
    </div>
  )
}

/** The info board across the top of the felt: what is being played, by whom, how the hand stands, and
 *  the running totals — each a small label over its value, divided by fine rules. */
function InfoBoard({ game, scores, points }: { game: Game; scores: [number, number, number]; points: { declarer: number; defenders: number } }) {
  const nameOf = useNameOf()
  const contract = game.declaration?.contract ?? null
  const playing = game.phase === 'play' || game.phase === 'trickEnd'
  const extras = `${game.declaration?.hand ? ' · Hand' : ''}${game.declaration?.ouvert ? ' · Ouvert' : ''}`
  return (
    <section data-testid="skat-info" aria-label={m.info_label()} {...stylex.props(styles.board)}>
      <div data-testid="skat-info-contract" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{contract ? m.info_contract() : m.info_bid()}</span>
        {contract ? (
          <span {...stylex.props(typography.infoValue, styles.boardValue)}><Rich text={contractName(contract)} />{extras}</span>
        ) : (
          <span {...stylex.props(typography.infoNumber, styles.boardValue)}>{game.bidding.value > 0 ? game.bidding.value : '—'}</span>
        )}
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{!contract && game.declarer === null ? m.table_bidding() : ''}</span>
      </div>
      <div {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_declarer()}</span>
        <span {...stylex.props(typography.infoValue, styles.boardValue)}>{game.declarer === null ? '—' : nameOf(game.declarer)}</span>
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{game.declarer === null ? '' : m.info_bid() + ' ' + game.bid}</span>
      </div>
      <div data-testid="skat-info-points" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_points()}</span>
        <span {...stylex.props(typography.infoNumber, styles.boardValue)}>{playing ? `${points.declarer} : ${points.defenders}` : '—'}</span>
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{playing ? m.info_tricks({ n: Math.min(10, game.tricks.length + 1) }) : ''}</span>
      </div>
      <div data-testid="skat-info-totals" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_totals()}</span>
        <div {...stylex.props(styles.totals)}>
          {([1, ME, 2] as Seat[]).map((seat) => (
            <span key={seat} {...stylex.props(styles.total)}>
              <span {...stylex.props(typography.infoNumber, styles.boardValue, seat === ME && styles.boardMine)}>{scores[seat]}</span>
              <span {...stylex.props(typography.infoSub, styles.boardSub)}>{nameOf(seat)}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

type ActionsProps = {
  compact?: boolean
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
  onClaim: () => void
  onNewGame: () => void
  hints: boolean
  dealScore: number | null
  last: boolean
  daily?: DailyAfter | null
  roomAfter?: ReactNode
}

function Actions(p: ActionsProps) {
  const nameOf = useNameOf()
  const { game } = p
  const who = actor(game)

  if (game.phase === 'passedIn') {
    return (
      <Dialog>
        <Say>{p.dealScore === null ? m.table_passed_in() : m.daily_passed_in()}</Say>
        {p.daily?.compare}
        {p.daily?.day}
        {p.roomAfter}
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={p.onNewGame}>
          {p.roomAfter ? m.daily_next_deal() : p.dealScore === null ? m.table_redeal() : p.last ? m.daily_see_result() : m.daily_next_deal()}
        </Btn>
      </Dialog>
    )
  }

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    return <Result game={game} onNewGame={p.onNewGame} dealScore={p.dealScore} last={p.last} daily={p.daily} roomAfter={p.roomAfter} />
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
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}>{m.bid_take_18()}</Btn>
          <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn> : null}
        </Row>
      )
    }
    if (b.awaiting === 'speaker') {
      const value = nextBid(b.value)
      return (
        <Row>
          <Say>{m.bid_your_turn({ name: nameOf(b.listener) })}</Say>
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}>{m.bid_button({ value: value ?? '' })}</Btn>
          <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn> : null}
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.bid_asked({ name: nameOf(b.speaker), value: b.value })}</Say>
        <Btn testId="skat-hold" shape="block" size="lg" onClick={() => p.onBid('hold')}>{m.bid_hold_button({ value: b.value })}</Btn>
        <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
        {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn> : null}
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
          {p.hints ? <Btn testId="skat-skat-hint" tone="info" shape="block" size="lg" onClick={p.onSkatHint}>{m.skat_hint_button()}</Btn> : null}
        </Row>
      )
    }
    return (
      <Row>
        <Say>{m.skat_discard_prompt()}</Say>
        <Btn testId="skat-discard" shape="block" size="lg" disabled={p.picked.length !== 2} onClick={p.onDiscard}>{m.skat_discard_button({ n: p.picked.length })}</Btn>
        {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onDiscardHint}>{m.skat_discard_hint_button()}</Btn> : null}
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker compact={p.compact} game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} onHint={p.hints ? p.onDeclareHint : undefined} />
  }

  // The declarer on lead who sees the rest is theirs may show it and end the deal (SKATGO-59).
  return (
    <Row>
      <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say>
      {game.declarer === ME && claimLine(game) ? <Btn testId="skat-claim" shape="block" onClick={p.onClaim}>{m.play_claim()}</Btn> : null}
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({
  compact,
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
  /** The hint button's action; no button without one. */
  onHint?: () => void
  compact?: boolean
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
      <div {...stylex.props(styles.contractGrid, compact && styles.contractGridCompact)}>
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
        {onHint ? <Btn testId="skat-declare-hint" tone="info" shape="block" size="lg" onClick={onHint}>{m.declare_hint_button()}</Btn> : null}
      </Row>
    </div>
  )
}

function Result({ game, onNewGame, dealScore, last, daily, roomAfter }: { game: Game; onNewGame: () => void; dealScore: number | null; last: boolean; daily?: DailyAfter | null; roomAfter?: ReactNode }) {
  const nameOf = useNameOf()
  const named = useContext(Names) !== null
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
  // How the game was settled, line by line: the whole settlement in free play, the details in the
  // tournament, where the deal against the AI comes first (SKATGO-57).
  const early = game.early ? (
    <p data-testid="skat-result-early" data-early={game.early.kind} {...stylex.props(typography.note, styles.note)}>
      {earlyLine(declarer, game.early, nameOf, named)}
    </p>
  ) : null
  const settlement = (
    <>
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
        <Rich text={scoreLine(declarer, r.won, r.score > 0 ? `+${r.score}` : String(r.score), nameOf)} />
      </p>
      <div {...stylex.props(styles.resultSkat)}>
        <span {...stylex.props(typography.smallBold, styles.inkLabel)}>{m.result_skat()}</span>
        {game.skat.map((c) => <PlayingCard key={cardId(c)} card={c} size="xs" />)}
      </div>
    </>
  )
  return (
    <Dialog>
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      {daily ? (
        // The dialog is the card: nothing inside it is boxed again (SKATGO-57).
        <div {...stylex.props(styles.resultBody)}>
          {early}
          {daily.compare}
          <Fold label={m.daily_details()} testId="daily-details-fold">{settlement}</Fold>
          {daily.day}
        </div>
      ) : (
        <Panel tone={humanWon ? 'good' : 'bad'}>
          <div {...stylex.props(styles.resultBody)}>
            <h3 {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
            {early}
            {settlement}
            {roomAfter}
          </div>
        </Panel>
      )}
      <Row>
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={onNewGame}>
          {roomAfter ? m.daily_next_deal() : dealScore === null ? m.result_new_game() : last ? m.daily_see_result() : m.daily_next_deal()}
        </Btn>
      </Row>
    </div>
    </Dialog>
  )
}

/** How a deal decided before its last card ended (SKATGO-59): the rest shown, or a Null given up. Lina
 *  and Max have their own lines; at a private table (`named`) anyone's line is the same. */
function earlyLine(declarer: Seat, early: NonNullable<Game['early']>, nameOf: (seat: Seat) => string, named: boolean): string {
  const name = nameOf(declarer)
  if (early.kind === 'claim') {
    const n = 10 - early.from
    if (declarer === ME) return m.result_early_claim_you({ n })
    if (named) return m.result_early_claim_named({ name, n })
    return declarer === 1 ? m.result_early_claim_1({ name, n }) : m.result_early_claim_2({ name, n })
  }
  if (named) return declarer === ME ? m.result_early_null_you_named() : m.result_early_null_named({ name })
  if (declarer === ME) return m.result_early_concede_you({ a: nameOf(1), b: nameOf(2) })
  return declarer === 1 ? m.result_early_null_1({ name }) : m.result_early_null_2({ name })
}

/** "You score +30." — who wrote down what, and why it is doubled when it is. */
function scoreLine(declarer: Seat, won: boolean, score: string, nameOf: (seat: Seat) => string): string {
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
/** A message at the top of the felt (SKATGO-32): a hint or a refusal, with a way to close it. */
function Message({ tone, testId, onClose, children }: { tone: 'tip' | 'bad'; testId?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Panel tone={tone}>
      <div data-testid={testId} {...stylex.props(styles.message)}>
        <p {...stylex.props(typography.appText, styles.note, styles.messageText)}>{children}</p>
        <button type="button" aria-label={m.message_close()} onClick={onClose} {...stylex.props(styles.messageClose)}>
          <X size={icon.inline} strokeWidth={icon.outline} />
        </button>
      </div>
    </Panel>
  )
}

const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(typography.appText, styles.say)}>{children}</p>

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
  // Clipped, not hidden (SKATGO-32): a hidden overflow can still be scrolled by focus or scrollIntoView,
  // which slid the whole felt sideways; a clipped one cannot scroll at all.
  table: { position: 'relative', display: 'grid', backgroundColor: color.page, overflow: 'clip' },
  // Free play: the felt fills the screen; on a wide screen the panel is pinned beside it (SKATGO-34),
  // narrower it is a drawer over it (SKATGO-29).
  tableFull: { gridTemplateColumns: { default: dims.oneColumn, [bp.pinned]: dims.feltAndPanel }, height: dims.screenDynamic },
  // Inside a lesson: the panel stacks under the felt.
  tableEmbedded: { gridTemplateColumns: dims.oneColumn, borderRadius: radii.panel },

  // The felt is the stage's size container (SKATGO-34): everything on it is measured in its unit, so it
  // needs a height of its own — the screen in free play, a fixed one inside a lesson.
  felt: {
    position: 'relative',
    isolation: 'isolate',
    height: dims.tableEmbedded,
    containerType: 'size',
    overflow: 'clip',
    color: color.onColor,
  },
  feltBackdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: layer.backdrop,
    backgroundImage: fill.felt,
    willChange: layerHint.moving,
    pointerEvents: 'none',
  },
  feltFull: { height: dims.screenDynamic },

  // An opponent's hand down an edge, only partly on the felt.
  stack: {
    position: 'absolute',
    top: stage.stackCentre,
    display: 'flex',
    flexDirection: 'column',
    transform: pose.centreY,
  },
  stackLeft: { left: stage.stackInset },
  stackRight: { right: stage.stackInset },
  sideSlot: {
    position: 'relative',
    flexShrink: 0,
    width: stage.stackSlotWidth,
    height: stage.stackSlotHeight,
    marginTop: { default: stage.stackStep, ':first-child': 0 },
  },
  sideCard: { position: 'absolute', top: dims.half, left: dims.half, display: 'block', width: stage.stackCard, transform: pose.sideways },

  frame: {
    position: 'absolute',
    top: stage.frameCentre,
    left: dims.half,
    transform: pose.centre,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    borderColor: color.gold,
  },
  framePlay: { width: stage.frame, aspectRatio: dims.square, borderWidth: dims.frameBorderPlay },

  plateSlot: { position: 'absolute', display: 'flex' },
  plateSlotLeft: { left: 0, top: dims.half, transform: pose.plateLeft },
  plateSlotRight: { right: 0, top: dims.half, transform: pose.plateRight },
  plateSlotBottom: { left: dims.half, bottom: 0, transform: pose.plateBottom },
  plate: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x6,
    minHeight: dims.plateHeight,
    boxSizing: 'border-box',
    paddingRight: space.x12,
    borderRadius: radii.tag,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.plate,
    color: color.onColor,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
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
  roleTagDeclarer: { backgroundColor: color.tileRed },
  plateText: { whiteSpace: 'nowrap' },

  // The whole screen takes the tap; the hand only shows where (SKATGO-72).
  collect: {
    position: 'fixed',
    inset: 0,
    zIndex: layer.window,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  collectHand: {
    position: 'absolute',
    right: space.x4,
    bottom: space.x4,
    width: dims.tapHand,
    height: dims.tapHand,
    overflow: 'visible',
    pointerEvents: 'none',
  },
  collectSkin: { fill: color.tapSkin, stroke: color.navy },
  collectLine: { stroke: color.navy },

  // In the frame's top corners (SKATGO-34): the action drawer rises from the bottom.
  saidChip: { position: 'absolute', top: space.x12 },
  saidLeft: { left: space.x12 },
  saidRight: { right: space.x12 },

  // The info board hangs from the felt's top edge (SKATGO-29): square on top, rounded below.
  // The top of the felt: the board, then the messages, centred; empty space in it lets taps through.
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: layer.launcher,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x8,
    pointerEvents: 'none',
  },
  // The line under the board for what happens in the play: inside the stage's band.
  wordsLine: { display: 'flex', justifyContent: 'center', maxWidth: dims.tipWidth },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    width: dims.tipWidth,
    pointerEvents: 'auto',
  },
  message: { display: 'flex', alignItems: 'flex-start', gap: space.x8 },
  messageText: { flexGrow: 1, minWidth: 0 },
  messageClose: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.slate,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
  },
  board: {
    pointerEvents: 'auto',
    display: 'grid',
    gridTemplateColumns: { default: dims.boardColumnsWide, [bp.portrait]: dims.boardColumns },
    justifyContent: 'center',
    width: { default: 'auto', [bp.portrait]: dims.boardWidthPhone },
    maxWidth: { default: dims.boardWidthWide, [bp.portrait]: 'none' },
    boxSizing: 'border-box',
    borderBottomLeftRadius: radii.panel,
    borderBottomRightRadius: radii.panel,
    backgroundColor: color.board,
    color: color.onColor,
  },
  boardCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    minWidth: 0,
    paddingBlock: { default: space.x10, [bp.phone]: space.x8 },
    paddingInline: { default: space.x16, [bp.phone]: space.x8 },
    // One row of four in landscape: a rule between the cells. Two rows of two in portrait: a rule
    // between the columns and one between the rows.
    borderLeftWidth: {
      default: border.hair,
      ':first-child': 0,
      [bp.portrait]: { default: border.hair, ':nth-child(odd)': 0 },
    },
    borderLeftStyle: 'solid',
    borderLeftColor: color.boardLine,
    borderTopWidth: { default: 0, [bp.portrait]: { default: 0, ':nth-child(n+3)': border.hair } },
    borderTopStyle: 'solid',
    borderTopColor: color.boardLine,
    textAlign: 'center',
  },
  boardLabel: { color: color.amber, whiteSpace: 'nowrap' },
  boardValue: { color: color.onColor, whiteSpace: 'nowrap' },
  boardMine: { color: color.amber },
  boardSub: { color: color.onColorSoft, whiteSpace: 'nowrap', minHeight: space.x12 },
  totals: { display: 'flex', gap: space.x12 },
  total: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x2 },

  // The skat and its label, in the frame's middle.
  skatPile: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6, width: '100%' },
  skatCards: { display: 'flex', justifyContent: 'center', gap: space.x6, width: '100%' },
  // A card lying in the frame — the skat or a played card — is as big as a card in the hand (SKATGO-68).
  frameCard: { display: 'block', width: stage.handCard },
  goldLabel: { color: color.amber },
  trickCard: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', width: stage.handCard },
  // A card in the trick (SKATGO-41): the flying box is a layer of its own until the card lands, then
  // the face is.
  layered: { willChange: layerHint.moving },
  trickFace: { display: 'block', width: '100%' },
  trickFaceLanded: { transform: move.ownLayer },
  words: {
    paddingBlock: space.x6,
    paddingInline: space.x16,
    borderRadius: radii.pill,
    backgroundColor: color.board,
    color: color.onColor,
    textAlign: 'center',
    // The band above is click-through; the line takes clicks again for the claim button (SKATGO-59).
    pointerEvents: 'auto',
  },

  // The action drawer: white, rounded at the top, over the felt and just above the hand.
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginInline: 'auto',
    bottom: stage.drawerBottom,
    zIndex: layer.window,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    width: dims.drawerWidth,
    maxHeight: stage.drawerMaxHeight,
    overflowY: 'auto',
    boxSizing: 'border-box',
    paddingTop: space.x8,
    paddingBottom: space.x16,
    paddingInline: space.x16,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.navy,
    // It rises over the felt: a layer of its own (SKATGO-41).
    willChange: layerHint.moving,
  },
  drawerHandle: {
    alignSelf: 'center',
    flexShrink: 0,
    width: dims.drawerHandle,
    height: dims.drawerHandleHeight,
    borderRadius: radii.round,
    backgroundColor: color.hairline,
  },

  hintTab: {
    position: 'absolute',
    left: 0,
    bottom: stage.tabBottom,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.hintTabWidth,
    height: dims.hintTabHeight,
    padding: 0,
    borderWidth: 0,
    borderTopRightRadius: radii.panel,
    borderBottomRightRadius: radii.panel,
    backgroundColor: color.hintTab,
    color: color.onColor,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.gold,
  },

  // The learner's hand: a row along the bottom, every card whole.
  mine: { position: 'absolute', left: 0, right: 0, bottom: stage.handBottom, display: 'flex', justifyContent: 'center', paddingInline: { default: space.x16, [bp.phone]: space.x6 }, boxSizing: 'border-box' },

  panel: { position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: color.page, color: color.text },
  // Pinned beside the felt on a wide screen (SKATGO-34): in the table's grid, so the felt — and the
  // stage with it — takes the width it leaves; folded, it gives that width back. Narrower, a drawer over
  // the felt's right side, over the whole screen on a phone.
  panelFull: {
    position: { default: 'absolute', [bp.phone]: 'fixed', [bp.pinned]: 'relative' },
    top: 0,
    right: 0,
    bottom: { default: 0, [bp.phone]: 'auto' },
    zIndex: { default: layer.window, [bp.pinned]: 'auto' },
    width: { default: dims.sidePanel, [bp.phone]: dims.panelPhone, [bp.pinned]: dims.sidePanelPinned },
    height: { default: 'auto', [bp.phone]: dims.screenDynamic },
    overflow: 'hidden',
    transform: { default: pose.offRight, [bp.pinned]: pose.onScreen },
    transitionProperty: { default: 'transform', [bp.pinned]: 'width' },
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    borderTopLeftRadius: { default: radii.panel, [bp.pinned]: 0 },
    borderBottomLeftRadius: { default: radii.panel, [bp.pinned]: 0 },
    boxShadow: { default: elev.panel, [bp.pinned]: 'none' },
  },
  panelOpen: { transform: pose.onScreen },
  panelShut: { width: { default: dims.sidePanel, [bp.phone]: dims.panelPhone, [bp.pinned]: 0 } },
  // The white tab that folds the panel away and brings it back, at any width. It mirrors the hint tab
  // (SKATGO-29): the same height from the bottom, on the felt's right edge — a slim tab, so it never
  // competes with the table. Over an open drawer it moves to the drawer's edge.
  panelTab: {
    display: 'flex',
    position: 'absolute',
    bottom: stage.tabBottom,
    right: 0,
    zIndex: layer.window,
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.panelTab,
    height: dims.panelTabHeight,
    padding: 0,
    borderWidth: 0,
    borderTopLeftRadius: radii.panel,
    borderBottomLeftRadius: radii.panel,
    backgroundColor: color.surface,
    color: color.navy,
    boxShadow: elev.panel,
    cursor: 'pointer',
  },
  panelTabOnDrawer: { right: { default: dims.sidePanel, [bp.phone]: dims.panelPhone } },
  panelBody: { display: 'flex', flexDirection: 'column', gap: space.x16, flexGrow: 1, padding: space.x16, overflowY: 'auto', boxSizing: 'border-box' },
  // The body keeps its width while a pinned panel folds, so nothing inside reflows on the way.
  panelBodyFull: { width: { default: '100%', [bp.pinned]: dims.sidePanelPinned }, height: '100%' },
  // Pinned, the panel's top right corner is under the assistant's launcher: the tabs leave it room.
  tabs: { display: 'flex', justifyContent: 'space-around', paddingBottom: space.x16, paddingRight: { default: 0, [bp.pinned]: dims.launcherRoom }, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  tab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4, color: color.slateDeep, textDecoration: 'none' },
  tabLink: { outlineStyle: { default: 'none', ':focus-visible': 'solid' }, outlineWidth: border.focus, outlineColor: color.info },
  tabTile: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: dims.tabTile, height: dims.tabTile, borderRadius: radii.panel, backgroundColor: color.hairline, color: color.navy },
  tabTileActive: { backgroundColor: color.tabActive },
  tabButton: { padding: 0, borderWidth: 0, backgroundColor: 'transparent', cursor: 'pointer' },
  history: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  // The learner's move in the pinned panel: first under the tabs, on white like the drawer.
  panelMoves: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    flexShrink: 0,
    padding: space.x16,
    borderRadius: radii.panel,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
    color: color.navy,
  },
  panelTitle: { margin: 0, color: color.navy, textAlign: 'center' },
  auction: { display: 'grid', gridTemplateColumns: dims.auctionColumns, gap: space.x8 },
  auctionCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6 },
  auctionHead: { color: color.auctionHead, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },
  auctionRole: { color: color.slate, textTransform: 'capitalize', whiteSpace: 'nowrap' },
  // A column of bids is as wide as its bids (SKATGO-29), never narrower than one.
  auctionCells: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.x4,
    minWidth: dims.auctionCell,
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
  panelFoot: { display: 'flex', flexDirection: 'column', gap: space.x12, marginTop: 'auto' },

  // A row of moves is centred under what is asked, in the drawer and in a dialog alike.
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.x10 },
  // A line said takes the colour of where it is said: navy in the drawer, white over the felt.
  say: { margin: 0, flexBasis: '100%', color: 'inherit', textAlign: 'center' },
  note: { margin: 0, color: color.text },
  declare: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  contractGrid: { display: 'grid', gridTemplateColumns: { default: dims.contractColumns, [bp.contracts]: dims.contractColumnsPhone }, gap: space.x8 },
  contractGridCompact: { gridTemplateColumns: dims.contractColumnsPanel },
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
    width: dims.dialogWidth,
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

// The three places a played card lands in the frame (SKATGO-68): as big as the hand's cards, so they
// overlap, each toward who played it — Lina's on the left, the learner's in the middle, Max's on the right
// — and each one step higher than the card to its left, so its top-left number and suit show above that
// card's top edge. Cards enter in play order, so a later one lies on top, and whatever was played last,
// every card's top-left number and suit stay in the open.
const positions = stylex.create({
  0: { left: 0, right: 0, marginInline: 'auto', top: stage.trickSecond },
  1: { left: dims.trickSideInset, top: stage.trickThird },
  2: { right: dims.trickSideInset, top: stage.trickFirst },
})
