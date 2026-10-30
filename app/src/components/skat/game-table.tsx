import * as stylex from '@stylexjs/stylex'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { type Card, type Contract, SUITS, SUIT_SYMBOL, cardId, effectiveSuit, sameCard, sortHand } from '~/lib/skat/cards'
import { type Face, faceOf } from '~/lib/skat/face'
import { bidHint, declareHint, discardHint, playHint, skatHint } from '~/lib/skat/hints'
import { playSound } from '~/lib/skat/sounds'
import { useBoardTricks, useFaces, useSettings, useTapToCollect } from '~/lib/skat/settings'
import { type SettlementRow, cardLabel, contractName, ledName, matadorLabel, roleName, settleReason, settlementFormula, settlementRows } from '~/lib/skat/i18n'
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
  mayAnnounce,
  normalise,
  roleOf,
  runningPoints,
  runningTricks,
  trickWinner,
} from '~/lib/skat/game'
import { type DealSummary, seegerFabian, summarize } from '~/lib/skat/tournament'
import { BID_LADDER, type Declaration, NULL_VALUES, baseValue, expectedValue, highestValue, matadors, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { Link } from '@tanstack/react-router'
import { BookOpen, ChevronLeft, ChevronRight, Lightbulb, LogOut, Settings, Spade, X } from 'lucide-react'

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
import { type AskReview, GameTag, SeatScores, VsAiReview, dailyAsk, signed } from './daily-comparison'
import { SettingsDialog } from './frame'
import { PlayingCard } from './playing-card'
import { RulesInPanel } from './rules-page'
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
// Free play and lesson 11 (SKATGO-40) play a server game the same way; only lesson 11 keeps the hints (SKATGO-130).
// In the daily tournament (SKATGO-35) the server owns the deal: the table draws what it is sent and
// sends the learner's moves, and offers no hints.
//
// Every thing on the felt is sized and placed in the stage's unit (theme/table.stylex.ts), which
// follows the felt's size: the table scales as one, and nothing on it can cover anything else.

const ME: Seat = 0
/** A seat's name in the current language — read at render, so it is always the page's language. */
const defaultName = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()
/** The names at this table: a private table's nicknames (SKATGO-61), or null for You, Lina and Noah. */
const Names = createContext<[string, string, string] | null>(null)
function useNameOf() {
  const names = useContext(Names)
  return (seat: Seat) => (names ? names[seat] : defaultName(seat))
}

export const BOT_DELAY = 850
/** How long a finished trick stays before it goes by itself (SKATGO-75): long enough to see who took
 *  it, short enough not to hold up the game — about what online card tables commonly use. */
export const TRICK_PAUSE = 1200

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
  /** The tournament day, so the deal just finished can be reviewed (SKATGO-79). */
  day: string
  /** Seeger-Fabian totals per seat over the day's finished deals. */
  totals: [number, number, number]
  /** The day's finished deals and, for each, the AI's result in the player's seat (SKATGO-42). */
  deals?: DealSummary[]
  benchmarks?: (DealSummary | null)[]
  /** What Lina (1) or Noah (2) just said (SKATGO-142), shown on their side. */
  talk?: { seat: 1 | 2; line: string; id: number } | null
}

/** What the settlement shows in the tournament (SKATGO-57, simplified in SKATGO-79): this deal's score
 *  sheet against the AI, its analysis folded away, and where the tournament stands, in one line. */
type DailyAfter = { ask: AskReview; cacheKey: string }

/** A game the server owns, as free play and lesson 11 play it (SKATGO-40): the learner's moves go to
 *  `send`, `game` is what came back. */
export type ServerGame = Pick<Tournament, 'game' | 'busy' | 'send' | 'collect' | 'next'> & {
  /** Lesson 11 keeps the hints; free play has none, its table the tournament's (SKATGO-130, the human: 「砍掉自由牌局时的
   *  提示，和锦标赛应该一模一样」, 「11课的保留」). */
  hints?: boolean
  /** Free play's round of six deals (SKATGO-88): which deal this is (from 0), of how many, and the
   *  player's Seeger-Fabian total so far. */
  round?: { deal: number; of: number; total: number }
  /** The server could not be reached or refused: said plainly, with a way on (SKATGO-40 Q6). */
  problem?: { text: string; retry?: () => void; fresh: () => void } | null
  /** Free play's review of the finished game (SKATGO-79): its replay, and where the AI would have played another card. */
  review?: AskReview
  /** Free play: give up the round for a new one (SKATGO-96). */
  newRound?: () => void
  /** Free play: what Lina (1) or Noah (2) just said (SKATGO-142), shown on their side. */
  talk?: { seat: 1 | 2; line: string; id: number } | null
}

/** A private table (SKATGO-61): the room's deal turned so the viewer is seat 0, the people's
 *  nicknames, and the running Seeger-Fabian totals. `next` deals the next one. No hints: the others at the table get
 *  none either. */
export type RoomTable = Pick<Tournament, 'game' | 'busy' | 'send' | 'collect' | 'next' | 'totals'> & {
  names: [string, string, string]
  /** Under the result: this deal's scores and the running totals. */
  standings: ReactNode
  /** Over the felt, where the table's messages go: while the connection comes back (SKATGO-117). */
  notice?: ReactNode
}

/** An open-card endgame of the Skat-Tricks (SKATGO-110): a deal stopped a few tricks before its end, every hand
 *  open as at an Ouvert, the learner's cards judged and the others' answers played by the exercise. No hints, no
 *  settlement — and since SKATGO-111 nothing round the felt but the exercise's own: its goal in the
 *  info board's place and its result over the table; no words line, no side panel. */
export type ExerciseTable = Pick<Tournament, 'game' | 'busy' | 'send' | 'collect' | 'next'> & {
  top?: ReactNode
  /** Over the table once the exercise is over. */
  after?: ReactNode
}

type Props = {
  /** Called once per game, when it is settled. */
  onSettled?: (info: { humanWon: boolean; humanScore: number }) => void
  /** Free play: the table fills the screen and offers a way out. A lesson embeds it instead. */
  fullScreen?: boolean
  /** Play the server's deal instead of dealing one here. */
  tournament?: Tournament
  /** Play a server game (free play, lesson 11). */
  server?: ServerGame
  /** Play at a private table (SKATGO-61). */
  room?: RoomTable
  /** Play out an open-card endgame (SKATGO-110). */
  exercise?: ExerciseTable
}

export function GameTable(props: Props) {
  return (
    <Names.Provider value={props.room?.names ?? null}>
      <Table {...props} />
    </Names.Provider>
  )
}

function Table({ onSettled, fullScreen = false, tournament, server, room, exercise }: Props) {
  const nameOf = useNameOf()
  const reducedMotion = useReducedMotion()
  // Lina's or Noah's line at free play or the tournament (SKATGO-142).
  const talk = server?.talk ?? tournament?.talk ?? null
  const [dealer, setDealer] = useState<Seat>(2)
  const [localGame, setGame] = useState<Game>(() => deal(2))
  const remote = tournament ?? server ?? room ?? exercise
  // Which deal of how many (SKATGO-93): the tournament's, free play's round of six, and lesson 11's single
  // deal. A private table counts no deals.
  const dealOf = tournament ? { n: tournament.deal + 1, of: tournament.of } : server?.round ? { n: server.round.deal + 1, of: server.round.of } : server ? { n: 1, of: 1 } : null
  // The learner's own card goes on the table the moment it is tapped (SKATGO-73); the server's answer,
  // with the computers' replies, replaces it when it comes. Until then the table shows `pending`.
  const [pending, setPending] = useState<{ from: Game; game: Game } | null>(null)
  const game = remote ? (pending && pending.from === remote.game ? pending.game : remote.game) : localGame
  useCardSounds(game)
  // A deal decided early (SKATGO-59) first shows everyone's remaining cards, face up, until the learner
  // taps (SKATGO-65): the game they are judged on is `revealed`, then the settlement follows.
  const [revealed, setRevealed] = useState<Game | null>(null)
  const revealing = game.phase === 'done' && !!game.early && revealed !== game
  const rest = revealing ? restHands(game) : null
  // A card tapped while a finished trick waits: the trick goes, and the card follows at once if the
  // learner is on lead (SKATGO-73).
  const [intent, setIntent] = useState<Card | null>(null)
  // Hints at the course's own table and in lesson 11 only (SKATGO-130): never in the tournament, at a private table,
  // in an exercise or in free play.
  const hints = remote ? !!server?.hints : true
  // Free play's bid calculator (SKATGO-157): only there — a round is free play's alone — and while the settings show it.
  // The contract picked stays picked through the deal's bidding: it is kept with the hand it was picked for.
  const bidCalc = useSettings((s) => s.bidCalc)
  const [calcPick, setCalcPick] = useState<{ hand: string; pick: number } | null>(null)
  const handKey = game.hands[ME].map(cardId).join()
  const calc: BidCalcState | null =
    server?.round && bidCalc ? { pick: calcPick?.hand === handKey ? calcPick.pick : null, setPick: (pick) => setCalcPick(pick === null ? null : { hand: handKey, pick }) } : null
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

  // A finished trick goes by itself after a short pause, or — when the learner chose so in the settings —
  // waits for their tap (SKATGO-72, SKATGO-75).
  const collect = remote ? remote.collect : () => setGame((g) => (g.phase === 'trickEnd' ? collectTrick(g) : g))
  const tapToCollect = useTapToCollect()
  const faces = useFaces()
  useEffect(() => {
    if (game.phase !== 'trickEnd' || tapToCollect) return
    const t = setTimeout(collect, TRICK_PAUSE)
    return () => clearTimeout(t)
    // Once per finished trick on the table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, tapToCollect])

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
    if (exercise || game.phase !== 'done' || !game.result || game.declarer === null || settledFor.current === game || revealing) return
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
  }, [game, onSettled, revealing, exercise])

  // A hint or a refusal lies over everything at the table, and a tap anywhere puts it away (SKATGO-75).
  // The listener is added after the tap that opened it, so that tap does not close it again.
  useEffect(() => {
    if (!hint && !refusal) return
    const close = () => {
      setHint(null)
      setRefusal(null)
    }
    const t = setTimeout(() => document.addEventListener('pointerdown', close, true))
    return () => {
      clearTimeout(t)
      document.removeEventListener('pointerdown', close, true)
    }
  }, [hint, refusal])

  // Anything said about the previous state is stale once the state moves on.
  useEffect(() => {
    setHint(null)
    setRefusal(null)
  }, [game])


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
  const tricksTaken = runningTricks(game)
  const boardTricks = useBoardTricks()
  const winner = trickWinner(game)

  function onCard(card: Card) {
    // A card tapped while the trick waits to go takes it at once, and is played if the learner leads.
    if (game.phase === 'trickEnd') return onCollect(card)
    if (game.phase === 'skat' && game.declarer === ME && game.pickedUp) {
      setPicked((p) => (p.some((c) => sameCard(c, card)) ? p.filter((c) => !sameCard(c, card)) : p.length < 2 ? [...p, card] : p))
      return
    }
    if (game.phase !== 'play' || !myTurn || !contract) return
    if (!legal?.some((c) => sameCard(c, card))) {
      const led = ledName(effectiveSuit(game.trick[0].card, contract))
      setRefusal(hints ? m.play_refusal({ led }) : m.play_refusal_short({ led }))
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
  // An exercise's full-screen table has no side panel (SKATGO-111), and is rendered on the server too.
  const panelled = fullScreen && !exercise
  const [pinned, setPinned] = useState(() => panelled && window.matchMedia(pinnedQuery).matches)
  const [panelOpen, setPanelOpen] = useState(pinned)
  useEffect(() => {
    if (!panelled) return
    const query = window.matchMedia(pinnedQuery)
    const change = () => {
      setPinned(query.matches)
      setPanelOpen(query.matches)
    }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [panelled])
  const [settingsOpen, setSettingsOpen] = useState(false)
  // The side panel shows the game, or the rules with a way back (SKATGO-75).
  const [panelView, setPanelView] = useState<'game' | 'rules'>('game')
  const inFrameActions = game.phase === 'bidding' || game.phase === 'skat' || game.phase === 'declare'
  // While a move of the learner's is on its way to the server, the table still shows the state it was made in:
  // its buttons stay away until the answer comes, or they would hang there dead and vanish under the learner's
  // finger — the jump bid's "Höher …" most of all (SKATGO-100, the human: 「跳叫按钮，有时候不能显示，有时候会显示」).
  const waiting = inFrameActions && myTurn && remoteBusy
  const acting = inFrameActions && myTurn && !waiting
  const dialog = !exercise && (game.phase === 'passedIn' || (game.phase === 'done' && !revealing))
  // With the panel pinned open, the learner's move is made in the panel, as Funbridge's bidding box is
  // (SKATGO-34): nothing then lies over the table. Otherwise it is the drawer over the felt.
  const movesInPanel = fullScreen && pinned && panelOpen
  // Lina's or Noah's line (SKATGO-142) waits while the table itself asks for a tap — a claim laid open, a trick to
  // collect — or shows a message: one thing at a time, one hand (SKATGO-143, the human: 「按顺序来显示这些信息」). Shown,
  // the next tap puts it away. It stands beside the speaker's face, level with it, on every screen (SKATGO-157, the human:
  // 「泡泡要始终从头像的同水平线的位置发出去，挨着头像」); with the faces switched off, where the face would be.
  const [talkSeen, setTalkSeen] = useState<number | null>(null)
  const tapAsked = revealing || (game.phase === 'trickEnd' && tapToCollect) || hint !== null || refusal !== null
  const shownTalk = talk && talk.id !== talkSeen && !tapAsked ? talk : null
  useEffect(() => {
    if (!shownTalk) return
    const seen = () => setTalkSeen(shownTalk.id)
    document.addEventListener('pointerdown', seen, true)
    return () => document.removeEventListener('pointerdown', seen, true)
  }, [shownTalk])
  const facesShown = faces && !exercise && !room
  const talkCard = shownTalk ? (
    <p key={shownTalk.id} role="status" data-testid="skat-talk" data-seat={shownTalk.seat} {...stylex.props(typography.appText, styles.talk, shownTalk.seat === 1 ? styles.talkLeft : styles.talkRight, !facesShown && (shownTalk.seat === 1 ? styles.talkBare : styles.talkBareRight))}>
      <span>
        <span {...stylex.props(typography.appBtnStrong)}>{nameOf(shownTalk.seat)}:</span> {shownTalk.line}
      </span>
      <TapHand testId="skat-talk-hand" place={styles.talkHand} still={reducedMotion} />
      {/* The bubble's tail, as in a comic, toward the speaker's face (SKATGO-148, the human: 「table talk应该像漫画一样，用哪种有
          箭头的泡泡，指向说话人」): out of its side, straight at the face beside it. */}
      <span aria-hidden="true" data-testid="skat-talk-tail" {...stylex.props(styles.talkTailSide, shownTalk.seat === 1 ? styles.talkTailSideLeft : styles.talkTailSideRight)} />
    </p>
  ) : null
  // In the tournament, after each deal (SKATGO-145): the deal's result, then its bidding and its trick most worth
  // improving against the AI's, from the review the server works out.
  const dailyAfter: DailyAfter | null = tournament?.deals ? { ask: dailyAsk(tournament.deal), cacheKey: `${tournament.day}|${tournament.deal}` } : null

  return (
    <div data-testid="skat-table" data-phase={game.phase} data-layout={fullScreen ? 'full' : 'embedded'} {...stylex.props(styles.table, fullScreen ? styles.tableFull : styles.tableEmbedded, fullScreen && exercise && styles.tableAlone)}>
      <div data-testid="skat-felt" {...stylex.props(styles.felt, fullScreen && styles.feltFull)}>
        {/* The felt's cloth on a layer of its own (SKATGO-41): the noise and the gradient are painted
            once, and cards moving over them never paint them again. */}
        <div aria-hidden="true" data-testid="skat-felt-bg" {...stylex.props(styles.feltBackdrop)} />
        {/* The top of the felt (SKATGO-32): the info board, and right under it the table's messages —
            what happens in the play (whose move, who is thinking, who took the trick), a hint the
            learner asked for, or why a card was refused, each until it is closed. The stage keeps this
            band clear (SKATGO-34): nothing on the table reaches into it. */}
        <div data-testid="skat-top" {...stylex.props(styles.top, (hint !== null || refusal !== null) && styles.topTip)}>
          {exercise?.top ?? <InfoBoard game={game} scores={tournament?.totals ?? room?.totals ?? scores} points={boardTricks ? tricksTaken : points} tricks={boardTricks} deal={dealOf} />}
          {!acting && !waiting && !dialog ? (
            <div data-testid="skat-words" {...stylex.props(styles.wordsLine)}>
              {game.phase === 'trickEnd' && winner !== null ? (
                <Pill tone="amber">{winner === ME ? m.table_trick_you() : m.table_trick_other({ name: nameOf(winner) })}</Pill>
              ) : exercise ? null : revealing && game.declarer !== null && game.early ? (
                <span data-testid="skat-reveal" data-early={game.early.kind}>
                  <Pill tone="amber">{earlyLine(game.declarer, game.early, nameOf, room !== undefined)}</Pill>
                </span>
              ) : (
                <div data-testid="skat-actions" {...stylex.props(styles.words)}>
                  <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} freeReview={server?.review} roundLast={server?.round ? server.round.deal + 1 >= server.round.of : null} seeger={!!(tournament || server || room)} calc={calc} />
                </div>
              )}
            </div>
          ) : null}
          {refusal || hint || server?.problem || room?.notice ? (
            <div data-testid="skat-messages" {...stylex.props(styles.messages)}>
              {room?.notice}
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
        {/* Lina's and Noah's faces above their stacks (SKATGO-147); not at a private table, where people sit, nor on an
            exercise's open board; and only while the settings show them. Drawn before the stacks, so a hand laid open
            long enough to reach a face on a phone lies over it rather than under it (SKATGO-148). */}
        {facesShown ? ([1, 2] as const).map((seat) => <SeatFace key={seat} seat={seat} game={game} />) : null}
        {/* Both opponents' hands: the same cards as the learner's, turned sideways and stacked down the
            left and right edges, running off the felt so only part of each shows (SKATGO-26). */}
        {([1, 2] as Seat[]).map((seat) => (
          // An exercise shows every hand, as the table shows an Ouvert declarer's (SKATGO-110).
          <Stack key={seat} seat={seat} game={game} shown={exercise ? game.hands[seat] : rest?.[seat]} big={!!exercise} />
        ))}
        <div data-testid="skat-frame" {...stylex.props(styles.frame, styles.framePlay)}>
          {/* The seat plates lie on the frame's edges: the opponents' along the left and right, the
              learner's under the bottom edge, all alike (SKATGO-72). First, with the bid chips, so the skat and the
              trick's cards lie over them: the frame and its plates are only the table's backdrop (SKATGO-158, the human: 「方框只是背景板，
              它可以被任何东西挡住」). */}
          {([1, 2] as Seat[]).map((seat) => (
            <div key={seat} data-testid={`skat-seat-${seat}`} {...stylex.props(styles.plateSlot, seat === 1 ? styles.plateSlotLeft : styles.plateSlotRight)}>
              <Plate seat={seat} game={game} active={who === seat} />
            </div>
          ))}
          <div data-testid="skat-seat-0" {...stylex.props(styles.plateSlot, styles.plateSlotBottom)}>
            <Plate seat={ME} game={game} mine active={myTurn} />
          </div>
          {/* What each opponent last said in Reizen, in the frame's corner on their side: a label of the frame's too, so
              under the skat (SKATGO-158). */}
          {([1, 2] as Seat[]).map((seat) => {
            const said = game.phase === 'bidding' || game.phase === 'passedIn' ? lastBidBy(seat) : null
            return said ? (
              <span key={seat} data-testid={`skat-said-${seat}`} {...stylex.props(typography.bidChip, styles.chip, styles.saidChip, seat === 1 ? styles.saidLeft : styles.saidRight, said === m.bid_pass() ? styles.chipPass : styles.chipBid)}>
                {said}
              </span>
            ) : null
          })}
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
          {game.phase === 'trickEnd' && tapToCollect ? <Collect hand={myHand} onCollect={onCollect} /> : null}
          {revealing ? <Collect hand={[]} onCollect={() => setRevealed(game)} /> : null}

        </div>
        {/* The talk over the stacks and the frame, beside the speaker's face. */}
        {talkCard}

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
              <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} freeReview={server?.review} roundLast={server?.round ? server.round.deal + 1 >= server.round.of : null} seeger={!!(tournament || server || room)} calc={calc} />
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
        {panelled ? (
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
            cards={rest && contract ? sortHand(rest[ME], contract) : myHand}
            size="table"
            row
            onPick={onCard}
            selected={picked}
            legal={legal}
            glow={hint?.card ? [hint.card] : hint?.cards ?? []}
          />
        </div>
      </div>

      {exercise ? null : (
      <aside
        data-testid="skat-panel"
        data-open={String(panelOpen)}
        data-pinned={String(fullScreen && pinned)}
        {...stylex.props(styles.panel, fullScreen && styles.panelFull, fullScreen && panelOpen && styles.panelOpen, fullScreen && !panelOpen && styles.panelShut)}
      >
        {fullScreen && panelView === 'rules' ? (
          <div key="rules" data-testid="skat-panel-rules" {...stylex.props(styles.panelBody, styles.panelBodyFull)}>
            <div {...stylex.props(styles.panelBackRow)}>
              <button type="button" data-testid="skat-panel-back" onClick={() => setPanelView('game')} {...stylex.props(typography.appBtnStrong, styles.panelBack)}>
                <ChevronLeft size={icon.inline} strokeWidth={icon.outline} />
                {m.panel_back()}
              </button>
              <h2 {...stylex.props(typography.panelLabel, styles.panelTitle)}>{m.nav_rules()}</h2>
            </div>
            <RulesInPanel />
          </div>
        ) : (
        <div key="game" {...stylex.props(styles.panelBody, fullScreen && styles.panelBodyFull)}>
          {fullScreen ? (
            <div {...stylex.props(styles.tabs)}>
              <span data-state="active" {...stylex.props(styles.tab)}>
                <span {...stylex.props(styles.tabTile, styles.tabTileActive)}><Spade size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.table_game_tab()}</span>
              </span>
              <button type="button" data-testid="skat-panel-rules-open" onClick={() => setPanelView('rules')} {...stylex.props(typography.control, styles.tab, styles.tabLink, styles.tabButton)}>
                <span {...stylex.props(styles.tabTile)}><BookOpen size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.nav_rules()}</span>
              </button>
              <button type="button" data-testid="settings-open-table" onClick={() => setSettingsOpen(true)} {...stylex.props(typography.control, styles.tab, styles.tabLink, styles.tabButton)}>
                <span {...stylex.props(styles.tabTile)}><Settings size={icon.table} strokeWidth={icon.outline} /></span>
                <span {...stylex.props(typography.tabLabel)}>{m.settings_open()}</span>
              </button>
            </div>
          ) : null}

          {acting && movesInPanel ? (
            <section data-testid="skat-actions" aria-label={m.table_your_move()} {...stylex.props(styles.panelMoves)}>
              <ActionsFor compact game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} freeReview={server?.review} roundLast={server?.round ? server.round.deal + 1 >= server.round.of : null} seeger={!!(tournament || server || room)} calc={calc} />
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
            ) : server?.round ? (
              <Pill tone="dark">
                <span data-testid="free-progress" data-deal={server.round.deal + 1} data-total={server.round.total}>{m.daily_deal_of({ n: server.round.deal + 1, of: server.round.of, total: server.round.total })}</span>
              </Pill>
            ) : null}
            {contract ? <Pill tone="amber">{contractName(contract)}{game.declaration?.hand ? ' · Hand' : ''}{game.declaration?.ouvert ? ' · Ouvert' : ''}</Pill> : null}
            {game.declarer !== null ? <Pill tone="quiet">{m.table_declarer({ name: nameOf(game.declarer), bid: game.bid })}</Pill> : null}
            {game.phase === 'play' || game.phase === 'trickEnd' ? (
              <>
                <Pill tone="quiet">{boardTricks ? m.table_tricks({ declarer: tricksTaken.declarer, defenders: tricksTaken.defenders }) : m.table_points({ declarer: points.declarer, defenders: points.defenders })}</Pill>
              </>
            ) : null}
          </div>
        </div>
        )}
      </aside>
      )}

      {/* An exercise's result, over the table (SKATGO-111). */}
      {exercise?.after ? <Dialog>{exercise.after}</Dialog> : null}

      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}

      {/* The settlement and a passed-in deal are dialogs over the whole table, outside the panel, which
          on a phone is a drawer that slides. */}
      {dialog ? (
        <div data-testid="skat-actions">
          <ActionsFor game={game} picked={picked} draft={draft} setDraft={setDraft} dispatch={dispatch} setPicked={setPicked} setHint={setHint} onNewGame={newGame} hints={hints} dealScore={tournament ? seegerFabian(game)[ME] : null} last={tournament ? tournament.deal + 1 >= tournament.of : false} daily={dailyAfter} roomAfter={room?.standings} freeReview={server?.review} roundLast={server?.round ? server.round.deal + 1 >= server.round.of : null} seeger={!!(tournament || server || room)} calc={calc} />
        </div>
      ) : null}

      {/* The way out (SKATGO-96), in the felt's top right corner and over the dialogs on the table, so it can
          always be pressed (SKATGO-100); an open drawer covers the felt, and it with it. */}
      {/* An exercise has no side panel, so its settings wait in the felt's top left corner, across from the way out
          (SKATGO-111, the human: 「设置按钮要放一个地方」). */}
      {fullScreen && exercise ? (
        <div {...stylex.props(styles.settingsCorner)}>
          <button type="button" aria-label={m.settings_open()} title={m.settings_open()} data-testid="settings-open-table" onClick={() => setSettingsOpen(true)} {...stylex.props(styles.menuButton)}>
            <Settings aria-hidden="true" size={icon.launcher} strokeWidth={icon.launcherStroke} />
          </button>
        </div>
      ) : null}
      {fullScreen && (exercise || pinned || !panelOpen) ? <TableMenu leave={exercise ? '/skat-tricks' : tournament ? '/daily' : room ? '/with-friends' : '/'} newRound={server?.newRound} /> : null}
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
  freeReview,
  roundLast,
  seeger,
  calc,
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
  /** Whether this table's totals count Seeger-Fabian — the tournament, free play, a private table — rather than
   *  the game value alone (the course's own game); the calculation ends in the same score (SKATGO-127). */
  seeger: boolean
  /** In the tournament: this is the day's last deal. */
  last: boolean
  /** In the tournament: the AI's result and the running table, shown once the deal is over. */
  daily?: DailyAfter | null
  /** At a private table: the deal's scores and the running totals, shown once it is over. */
  roomAfter?: ReactNode
  /** Free play's review of the finished game (SKATGO-79): its settlement is then the short one. */
  freeReview?: AskReview
  roundLast?: boolean | null
  calc: BidCalcState | null
}) {
  return (
    <Actions
      calc={calc}
      roomAfter={roomAfter}
      freeReview={freeReview}
      roundLast={roundLast}
      seeger={seeger}
      compact={compact}
      game={game}
      picked={picked}
      draft={draft}
      setDraft={setDraft}
      hints={hints}
      dealScore={dealScore}
      last={last}
      daily={daily}
      onBid={(a, to) => dispatch(to === undefined ? { type: 'bid', value: a } : { type: 'bid', value: a, to })}
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
function Stack({ seat, game, shown, big }: { seat: Seat; game: Game; shown?: Card[]; big?: boolean }) {
  // `shown`: the cards this seat held when the deal was decided early, laid open in place (SKATGO-65).
  // On the right, an open card is turned the other way and each covers the top of the one under it,
  // so every card's index is on the part that shows. Open cards — those, or an Ouvert declarer's — are
  // spread wider than a closed hand, so each reads (SKATGO-79, the human: 「ouvert…要像claim时的那种间距」).
  const open = !!shown || (game.declarer === seat && game.declaration?.ouvert && (game.phase === 'play' || game.phase === 'trickEnd'))
  const held = shown ?? game.hands[seat]
  const cards = open && game.declaration ? sortHand(held, game.declaration.contract) : held
  const flip = open && seat === 2
  // `big`: an open endgame's hands, each card as big as the learner's and more of it on the felt (SKATGO-111).
  return (
    <div data-testid={`skat-stack-${seat}`} aria-hidden={open ? undefined : 'true'} {...stylex.props(styles.stack, seat === 1 ? styles.stackLeft : styles.stackRight, flip && styles.stackOpenRight, big && styles.stackBig, big && (seat === 1 ? styles.stackBigLeft : styles.stackBigRight))}>
      {(flip ? [...cards].reverse() : cards).map((c, i) => (
        <div key={open ? cardId(c) : i} {...stylex.props(styles.sideSlot, open && styles.sideSlotSpread, flip && styles.sideSlotOpenRight, flip && styles.sideSlotSpreadRight, big && styles.sideSlotBig, big && flip && styles.sideSlotBigRight)}>
          <span {...stylex.props(styles.sideCard, flip && styles.sideCardOpenRight, big && styles.sideCardBig)}>
            <PlayingCard card={c} faceDown={!open} size="fill" />
          </span>
        </div>
      ))}
    </div>
  )
}

const FACES: readonly Face[] = ['neutral', 'laugh', 'sad']
/** How long a laugh or a sulk stays (SKATGO-148): a moment's reaction, under the human's two seconds. */
const FACE_HOLD = 1500

/** Lina's or Noah's face above their stack (SKATGO-147): neutral, laughing or sulking as the deal goes (`faceOf`). All
 *  three pictures are in the page, so a change of face never waits for a download. */
function SeatFace({ seat, game }: { seat: 1 | 2; game: Game }) {
  const nameOf = useNameOf()
  // A laugh or a sulk lasts FACE_HOLD, then the face is neutral again (SKATGO-148, the human: 「一个表情，最多持续2秒……
  // 就要自动复原，不要一直笑」). The moment it belongs to — the won bidding, a trick, the deal's end — starts it once.
  const felt = faceOf(game, seat)
  const moment = `${felt}|${game.phase === 'trickEnd' ? `trick${game.tricks.length}` : game.phase === 'done' ? 'end' : `bid${game.declarer}`}`
  const [over, setOver] = useState<string | null>(null)
  useEffect(() => {
    if (felt === 'neutral') return
    const t = setTimeout(() => setOver(moment), FACE_HOLD)
    return () => clearTimeout(t)
  }, [moment, felt])
  const face = felt !== 'neutral' && over !== moment ? felt : 'neutral'
  const who = seat === 1 ? 'lina' : 'noah'
  return (
    <div data-testid={`skat-face-${seat}`} data-face={face} {...stylex.props(styles.face, seat === 1 ? styles.faceLeft : styles.faceRight)}>
      {FACES.map((f) => (
        <img key={f} src={`/faces/${who}-${f}.webp`} alt={f === face ? nameOf(seat) : ''} aria-hidden={f === face ? undefined : 'true'} {...stylex.props(styles.faceImage, f !== face && styles.faceHidden)} />
      ))}
    </div>
  )
}

/** Each seat's cards when the deal was decided early (SKATGO-65): the rest was played out by the rules
 *  from trick `early.from` on, so those tricks hold exactly what everyone had left. */
function restHands(g: Game): [Card[], Card[], Card[]] {
  const from = g.early?.from ?? g.tricks.length
  const played = g.tricks.slice(from).flatMap((t) => t.cards)
  return [0, 1, 2].map((seat) => played.filter((p) => p.seat === seat).map((p) => p.card)) as [Card[], Card[], Card[]]
}

/** The tap that takes a finished trick off the table (SKATGO-72): a tap anywhere on the screen, said
 *  by a blinking hand in the frame's corner — still for a player who asked for less motion. */
/** The blinking hand that says "tap" (SKATGO-72): on a finished trick waiting for the tap, and on Lina's or Noah's line
 *  (SKATGO-142), which a tap anywhere puts away. */
function TapHand({ testId, place, still }: { testId: string; place: stylex.StyleXStyles; still: boolean | null }) {
  return (
    <motion.svg aria-hidden="true" data-testid={testId} viewBox={tapHint.view} animate={still ? undefined : tapHint.blink} transition={tapHint.transition} {...stylex.props(place)}>
      <path d={tapHint.hand} strokeWidth={tapHint.stroke} strokeLinejoin="round" {...stylex.props(styles.collectSkin)} />
      {tapHint.lines.map((d) => (
        <path key={d} d={d} fill="none" strokeWidth={tapHint.stroke} strokeLinecap="round" {...stylex.props(styles.collectLine)} />
      ))}
    </motion.svg>
  )
}

function Collect({ hand, onCollect }: { hand: Card[]; onCollect: (card: Card | null) => void }) {
  const still = useReducedMotion()
  // The tap lands on the cover; a card of the learner's under it is found by where it landed.
  const tapped = (x: number, y: number) => {
    const id = document.elementsFromPoint(x, y).find((el) => el.closest('[data-testid=skat-hand]') && el.closest('[data-card]'))?.closest('[data-card]')?.getAttribute('data-card')
    return hand.find((c) => cardId(c) === id) ?? null
  }
  return (
    <>
      <TapHand testId="skat-collect-hand" place={styles.collectHand} still={still} />
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
 *  the running totals — each a small label over its value, divided by fine rules. Under the points, which
 *  deal of how many this is, not which trick (SKATGO-93, the human: 「当前是第几墩，没必要，应该改为显示，当前是第几个deal」). */
function InfoBoard({ game, scores, points, tricks, deal }: { game: Game; scores: [number, number, number]; points: { declarer: number; defenders: number }; tricks: boolean; deal: { n: number; of: number } | null }) {
  const setTricks = useSettings((s) => s.setBoardTricks)
  const nameOf = useNameOf()
  const contract = game.declaration?.contract ?? null
  const playing = game.phase === 'play' || game.phase === 'trickEnd'
  // Hand and Ouvert on the small line under the contract, so the large one never outgrows its cell (SKATGO-100,
  // the human: 「花色hand的时候……左右padding为0了」).
  const extras = [game.declaration?.hand ? 'Hand' : '', game.declaration?.ouvert ? 'Ouvert' : ''].filter(Boolean).join(' · ')
  return (
    <section data-testid="skat-info" aria-label={m.info_label()} {...stylex.props(styles.board)}>
      <div data-testid="skat-info-contract" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{contract ? m.info_contract() : m.info_bid()}</span>
        {contract ? (
          <span {...stylex.props(typography.infoValue, styles.boardValue)}><Rich text={contractName(contract)} /></span>
        ) : (
          <span {...stylex.props(typography.infoNumber, styles.boardNumber)}>{game.bidding.value > 0 ? game.bidding.value : '—'}</span>
        )}
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{contract ? extras : game.declarer === null ? m.table_bidding() : ''}</span>
      </div>
      <div {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_declarer()}</span>
        <span {...stylex.props(typography.infoValue, styles.boardValue)}>{game.declarer === null ? '—' : nameOf(game.declarer)}</span>
        <span {...stylex.props(typography.infoSub, styles.boardSub)}>{game.declarer === null ? '' : m.info_bid() + ' ' + game.bid}</span>
      </div>
      {/* A tap switches it between the card points and the tricks each side has taken, and it stays so (SKATGO-127,
          the human: 「用户可以选择，最好是在这个格子上，用户点一下，就能切换，而且记住」). */}
      <button
        type="button"
        data-testid="skat-info-points"
        data-shows={tricks ? 'tricks' : 'points'}
        aria-pressed={tricks}
        title={tricks ? m.info_show_points() : m.info_show_tricks()}
        onClick={() => setTricks(!tricks)}
        {...stylex.props(styles.boardCell, styles.boardSwitch)}
      >
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{tricks ? m.info_tricks() : m.info_points()}</span>
        {/* The player's side's card points in the board's amber, as the player's total is beside them —
            the declarer's when they declare, the defenders' when they defend — so which number is theirs
            reads at a glance (SKATGO-79, the human: 「我是庄家，则庄家的分显示橙色，我是防家，则防家的分显示橙色」). */}
        <span {...stylex.props(typography.infoNumber, styles.boardNumber)}>
          {playing ? (
            <>
              <span data-testid="skat-info-points-declarer" {...stylex.props(game.declarer === ME && styles.boardMine)}>{points.declarer}</span>
              {' : '}
              <span data-testid="skat-info-points-defenders" {...stylex.props(game.declarer !== ME && styles.boardMine)}>{points.defenders}</span>
            </>
          ) : (
            '—'
          )}
        </span>
        <span data-testid="skat-info-deal" {...stylex.props(typography.infoSub, styles.boardSub)}>{deal ? m.info_deal(deal) : ''}</span>
      </button>
      <div data-testid="skat-info-totals" {...stylex.props(styles.boardCell)}>
        <span {...stylex.props(typography.infoLabel, styles.boardLabel)}>{m.info_totals()}</span>
        <div {...stylex.props(styles.totals)}>
          {([1, ME, 2] as Seat[]).map((seat) => (
            <span key={seat} {...stylex.props(styles.total)}>
              <span {...stylex.props(scores.some((s) => Math.abs(s) >= 1000) ? typography.infoTotalLong : typography.infoTotal, styles.boardNumber, seat === ME && styles.boardMine)}>{scores[seat]}</span>
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
  /** `to`: the number a jump bid names (SKATGO-87). */
  onBid: (a: 'bid' | 'hold' | 'pass', to?: number) => void
  onPickUp: () => void
  onHand: () => void
  onDiscard: () => void
  onDeclare: (d: Declaration) => void
  onBidHint: () => void
  onSkatHint: () => void
  /** In free play's round (SKATGO-88): whether this is its last deal; null outside a round. */
  roundLast?: boolean | null
  onDeclareHint: () => void
  onDiscardHint: () => void
  onPlayHint: () => void
  onClaim: () => void
  onNewGame: () => void
  hints: boolean
  dealScore: number | null
  seeger: boolean
  last: boolean
  daily?: DailyAfter | null
  roomAfter?: ReactNode
  /** Free play's review of the finished game (SKATGO-79): its settlement is then the short one. */
  freeReview?: AskReview
  /** Free play's bid calculator (SKATGO-157), or null where there is none. */
  calc: BidCalcState | null
}

function Actions(p: ActionsProps) {
  const nameOf = useNameOf()
  const { game } = p
  const who = actor(game)
  // The course's tables — its own and lesson 11's, the ones with hints — explain every step; a real table says at most
  // one short line, the buttons say the rest (SKATGO-134, the human: 「我现在特别讨厌游戏页面里那么多垃圾的文字」).
  const course = p.hints

  if (game.phase === 'passedIn') {
    return (
      <Dialog>
        <Say>{p.dealScore === null ? m.table_passed_in() : m.daily_passed_in()}</Say>
        {p.daily ? <VsAiReview ask={p.daily.ask} cacheKey={p.daily.cacheKey} names={[nameOf(0), nameOf(1), nameOf(2)]} /> : null}
        {p.freeReview ? <VsAiReview ask={p.freeReview} names={[nameOf(0), nameOf(1), nameOf(2)]} /> : null}
        {p.roomAfter}
        <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={p.onNewGame}>
          {p.roomAfter ? m.daily_next_deal() : p.roundLast != null ? (p.roundLast ? m.free_round_result() : m.daily_next_deal()) : p.dealScore === null ? m.table_redeal() : p.last ? m.daily_see_result() : m.daily_next_deal()}
        </Btn>
      </Dialog>
    )
  }

  if (game.phase === 'done' && game.result && game.declarer !== null) {
    return <Result game={game} onNewGame={p.onNewGame} dealScore={p.dealScore} last={p.last} daily={p.daily} roomAfter={p.roomAfter} freeReview={p.freeReview} roundLast={p.roundLast} seeger={p.seeger} course={course} />
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
    const calc = p.calc ? <BidCalc hand={game.hands[ME]} {...p.calc} /> : null
    if (b.awaiting === 'forehandAlone') {
      return (
        <Row>
          <Say>{course ? m.bid_forehand_alone() : m.bid_forehand_alone_short()}</Say>
          <Btn testId="skat-bid" shape="block" size="lg" onClick={() => p.onBid('bid')}>{m.bid_take_18()}</Btn>
          <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
          {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn> : null}
          {calc}
        </Row>
      )
    }
    if (b.awaiting === 'speaker') return <SpeakerBid key={b.log.length} value={b.value} listener={nameOf(b.listener)} hints={p.hints} onBid={p.onBid} onBidHint={p.onBidHint} calc={calc} />
    return (
      <Row>
        {/* Who asks and what "yes" commits to, on every table (SKATGO-141, the human: 「叫牌时的文案删除太多，你给我恢复点」). */}
        <Say>{m.bid_asked({ name: nameOf(b.speaker), value: b.value })}</Say>
        <Btn testId="skat-hold" shape="block" size="lg" onClick={() => p.onBid('hold')}>{m.bid_hold_button({ value: b.value })}</Btn>
        <Btn testId="skat-pass" shape="block" size="lg" onClick={() => p.onBid('pass')}>{m.bid_pass()}</Btn>
        {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onBidHint}>{m.bid_hint_button()}</Btn> : null}
        {calc}
      </Row>
    )
  }

  if (game.phase === 'skat') {
    if (!game.pickedUp) {
      return (
        <Row>
          {course ? <Say>{m.skat_won_bid({ bid: game.bid })}</Say> : null}
          <Btn testId="skat-pickup" shape="block" size="lg" onClick={p.onPickUp}>{m.skat_pick_up()}</Btn>
          <Btn testId="skat-hand-game" tone="quiet" shape="block" size="lg" onClick={p.onHand}>{m.skat_play_hand()}</Btn>
          {p.hints ? <Btn testId="skat-skat-hint" tone="info" shape="block" size="lg" onClick={p.onSkatHint}>{m.skat_hint_button()}</Btn> : null}
        </Row>
      )
    }
    return (
      <Row>
        {course ? <Say>{m.skat_discard_prompt()}</Say> : null}
        <Btn testId="skat-discard" shape="block" size="lg" disabled={p.picked.length !== 2} onClick={p.onDiscard}>{m.skat_discard_button({ n: p.picked.length })}</Btn>
        {p.hints ? <Btn tone="info" shape="block" size="lg" onClick={p.onDiscardHint}>{m.skat_discard_hint_button()}</Btn> : null}
      </Row>
    )
  }

  if (game.phase === 'declare') {
    return <DeclarePicker compact={p.compact} course={course} game={game} draft={p.draft} setDraft={p.setDraft} onDeclare={p.onDeclare} onHint={p.hints ? p.onDeclareHint : undefined} />
  }

  // The declarer on lead who sees the rest is theirs may show it and end the deal (SKATGO-59). A real table says
  // nothing while it is the player's card: the playable cards are the bright ones.
  const claim = game.declarer === ME && claimLine(game)
  if (!course && !claim) return null
  return (
    <Row>
      {course ? <Say>{game.trick.length === 0 ? m.play_lead_any() : m.play_tap()}</Say> : null}
      {claim ? <Btn testId="skat-claim" shape="block" onClick={p.onClaim}>{m.play_claim()}</Btn> : null}
    </Row>
  )
}

const CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

function DeclarePicker({
  compact,
  course,
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
  /** The course's table explains each game; a real table only says when the chosen game cannot be played. */
  course: boolean
}) {
  const isHand = !game.pickedUp
  // Matadors are counted over hand plus skat, but in a Hand game the skat is unseen: the learner can
  // only count what they hold, which is exactly the uncertainty the lesson on Hand games describes.
  const known = isHand ? game.hands[ME] : [...game.hands[ME], ...game.skat]
  const make = (contract: Contract, extra: Partial<Declaration> = {}): Declaration =>
    normalise({ contract, hand: isHand, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false, ...extra }, game.pickedUp)
  const value = draft ? expectedValue(draft, known) : null
  const same = (a: Contract, b: Contract) => JSON.stringify(a) === JSON.stringify(b)
  // Only a game that can reach the bid may be announced (ISkO 3.4.2–3.4.4, SKATGO-98, the human: 「明明已经灰了……
  // 但是还能选择」). A tile is open when its game can, at the most it may be announced at; the button when the
  // game as chosen can.
  const open = (c: Contract) => mayAnnounce(game, make(c, { ouvert: isHand || c.kind === 'null' }))
  const lawful = draft !== null && mayAnnounce(game, draft)
  const note = (d: Declaration, v: number): string | null => {
    const name = `${contractName(d.contract)}${d.hand ? ' Hand' : ''}`
    if (!course) {
      // Each game's value is on its tile; a line only where the button cannot say why it is off.
      if (v >= game.bid) return null
      if (!lawful) return m.declare_short_of({ contract: name, bid: game.bid })
      return highestValue(d, known) < game.bid ? m.declare_forced_short({ bid: game.bid }) : null
    }
    if (v >= game.bid) return m.declare_covers({ contract: name, value: v, bid: game.bid })
    if (!lawful) return m.declare_short_of({ contract: name, bid: game.bid })
    if (highestValue(d, known) < game.bid) return m.declare_forced({ bid: game.bid })
    return !d.schneiderAnnounced && v + baseValue(d.contract) >= game.bid
      ? m.declare_needs_schneider({ contract: name, value: v, bid: game.bid })
      : m.declare_needs_schwarz({ contract: name, value: v, bid: game.bid })
  }

  return (
    <div {...stylex.props(styles.declare)}>
      <div {...stylex.props(styles.contractGrid, compact && styles.contractGridCompact)}>
        {CONTRACTS.map((c) => {
          const v = expectedValue(make(c), known)
          const chosen = draft !== null && same(draft.contract, c)
          const allowed = open(c)
          return (
            <button
              key={JSON.stringify(c)}
              type="button"
              data-testid={`skat-contract-${c.kind === 'suit' ? c.trump : c.kind}`}
              data-covers={String(v >= game.bid)}
              data-allowed={String(allowed)}
              disabled={!allowed}
              aria-pressed={chosen}
              onClick={() => setDraft(make(c))}
              {...stylex.props(typography.contractTile, styles.contractBtn, contractTint[tintOf(c)], chosen && styles.contractChosen, !allowed && styles.contractShort)}
            >
              <span><Rich text={contractName(c)} /></span>
              <span {...stylex.props(typography.micro, styles.contractValue)}>{m.declare_worth({ value: v })}{allowed ? '' : m.declare_short()}</span>
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
      {draft && value !== null && note(draft, value) !== null ? (
        <Panel tone={value >= game.bid ? 'good' : 'bad'}>
          <p {...stylex.props(typography.note, styles.note)}>
            {note(draft, value)}
            {course && isHand && draft.contract.kind !== 'null' && lawful ? m.declare_hand_note() : ''}
          </p>
        </Panel>
      ) : null}
      <Row>
        <Btn testId="skat-declare" shape="block" size="lg" grow disabled={!lawful} onClick={() => draft && lawful && onDeclare(draft)}>{m.declare_go()}</Btn>
        {onHint ? <Btn testId="skat-declare-hint" tone="info" shape="block" size="lg" onClick={onHint}>{m.declare_hint_button()}</Btn> : null}
      </Row>
    </div>
  )
}

function Result({ game, onNewGame, dealScore, last, daily, roomAfter, freeReview, roundLast = null, seeger, course }: { game: Game; onNewGame: () => void; dealScore: number | null; last: boolean; daily?: DailyAfter | null; roomAfter?: ReactNode; freeReview?: AskReview; roundLast?: boolean | null; seeger: boolean; course: boolean }) {
  const nameOf = useNameOf()
  const named = useContext(Names) !== null
  const r = game.result!
  const declarer = game.declarer!
  const d = game.declaration!
  const humanWon = declarer === ME ? r.won : !r.won
  const isNull = d.contract.kind === 'null'
  // A free game's review, asked once (SKATGO-86).
  const [reviewed] = useState(() => freeReview?.())
  const vsAi: { ask: AskReview; cacheKey?: string } | null = daily ?? (reviewed ? { ask: () => reviewed } : null)
  // On a phone the settlement opens below the fold; bring it into view, or the game just seems to stop.
  // The dialog is what scrolls into view, not the result inside it: the result is taller than the dialog,
  // so scrolling it in also scrolled the dialog's own content past its top padding (SKATGO-93, the human:
  // 「顶部竟然没有padding，像是被滚动过了一点一样」).
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    panel.current?.closest('[role="dialog"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  const formula = settlementFormula(r, d, game.bid, seeger)
  // The declarer's score as this table counts it: Seeger-Fabian where the totals are, the game value otherwise.
  const declarerScore = seeger ? seegerFabian(game)[declarer] : r.score
  const formulaLine = <p data-testid="skat-result-formula" {...stylex.props(typography.note, styles.note)}>{m.result_formula({ formula })}</p>
  // How the game was settled, line by line: the whole settlement in free play, the details in the
  // tournament, where the deal against the AI comes first (SKATGO-57).
  const early = game.early ? (
    <p data-testid="skat-result-early" data-early={game.early.kind} {...stylex.props(typography.note, styles.note)}>
      {earlyLine(declarer, game.early, nameOf, named)}
    </p>
  ) : null
  const skat = (
    <div {...stylex.props(styles.resultSkat)}>
      <span {...stylex.props(typography.smallBold, styles.inkLabel)}>{m.result_skat()}</span>
      {game.skat.map((c) => <PlayingCard key={cardId(c)} card={c} size="xs" />)}
    </div>
  )
  // A real table's settlement under its title (SKATGO-134): one line of what was played and the card points, one line
  // of the calculation, then the skat.
  const facts = (
    <p data-testid="skat-result-facts" {...stylex.props(typography.note, styles.note)}>
      {isNull
        ? m.result_facts_null({ contract: contractName(d.contract), bid: game.bid })
        : m.result_facts({ contract: contractName(d.contract), bid: game.bid, declarer: r.declarerPoints, defenders: r.defenderPoints })}
    </p>
  )
  const settlement = course ? (
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
      {formulaLine}
      <p {...stylex.props(typography.note, styles.note)}>
        <Rich text={scoreLine(declarer, r.won, declarerScore > 0 ? `+${declarerScore}` : String(declarerScore), nameOf)} />
      </p>
      {skat}
    </>
  ) : (
    <>
      {facts}
      {formulaLine}
      {skat}
    </>
  )
  const next = (
    <Row>
      <Btn testId="skat-new-game" shape="block" size="lg" grow onClick={onNewGame}>
        {roomAfter ? m.daily_next_deal() : roundLast !== null ? (roundLast ? m.free_round_result() : m.daily_next_deal()) : dealScore === null ? m.result_new_game() : last ? m.daily_see_result() : m.daily_next_deal()}
      </Btn>
    </Row>
  )
  return (
    <Dialog foot={vsAi ? next : undefined}>
    <div ref={panel} data-testid="skat-result" data-human-won={String(humanWon)} {...stylex.props(styles.declare)}>
      {vsAi ? (
        // Against the AI (SKATGO-145, the human: 「先显示叫牌和ai的不同，再显示打的和ai最不同……其他不显示」): the result
        // with its calculation, the bidding, the one trick most worth improving, and the way on.
        <>
          <ResultCard won={humanWon} score={seegerFabian(game)[ME]} rows={settlementRows(r, d, game.bid, declarer === ME, nameOf(declarer))} game={<GameTag deal={summarize(game)} names={[nameOf(0), nameOf(1), nameOf(2)]} />} seats={<SeatScores scores={seegerFabian(game)} names={[nameOf(0), nameOf(1), nameOf(2)]} />} />
          <VsAiReview ask={vsAi.ask} cacheKey={vsAi.cacheKey} names={[nameOf(0), nameOf(1), nameOf(2)]} />
        </>
      ) : (
        <>
          <Panel tone={humanWon ? 'good' : 'bad'}>
            <div {...stylex.props(styles.resultBody)}>
              <h3 {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{humanWon ? m.result_won() : m.result_lost()}</h3>
              {early}
              {settlement}
              {roomAfter}
            </div>
          </Panel>
          {next}
        </>
      )}
    </div>
    </Dialog>
  )
}

/**
 * A deal's result against the AI (SKATGO-145, the human: 「计算过程写到浅绿色卡片里，要清晰点，别一坨普通文字，但是符合设计系统，
 * 别太花」): won or lost with the player's score, then the calculation a step a row, its number at the end; light
 * green when the player's side won, the app's pink when it lost. Under the title, whose game it was and which.
 */
function ResultCard({ won, score, rows, game, seats }: { won: boolean; score: number; rows: SettlementRow[]; game: ReactNode; seats: ReactNode }) {
  return (
    <Panel tone={won ? 'good' : 'bad'}>
      <div data-testid="skat-result-card" data-won={String(won)} {...stylex.props(styles.resultBody)}>
        <div {...stylex.props(styles.resultHead)}>
          <h3 {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{won ? m.result_won() : m.result_lost()}</h3>
          <span data-testid="skat-result-score" {...stylex.props(typography.dialogTitle, styles.resultTitle)}>{signed(score)}</span>
        </div>
        {game}
        {seats}
        <dl data-testid="skat-result-rows" data-rows={rows.length} {...stylex.props(styles.calc)}>
          {rows.map((row, i) => {
            const total = i === rows.length - 1
            return (
              <div key={i} {...stylex.props(styles.calcRow, total && styles.calcTotal)}>
                <dt {...stylex.props(total ? typography.appBtnStrong : typography.appText, total ? styles.resultTitle : styles.inkLabel)}><Rich text={row.label} /></dt>
                <dd {...stylex.props(typography.appBtnStrong, styles.calcValue)}>{row.value}</dd>
              </div>
            )
          })}
        </dl>
      </div>
    </Panel>
  )
}

/** How a deal decided before its last card ended (SKATGO-59): the rest shown, or a Null given up. Lina
 *  and Noah have their own lines; at a private table (`named`) anyone's line is the same. */
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

/**
 * The speaker's turn in the auction: the next number, or — opened with "Höher …" — any higher number on
 * the ladder, a jump bid as at a real table (SKATGO-87). The numbers lie in one row that scrolls sideways,
 * so the hand stays in sight on a phone; a number is picked first and named with the main button, so a
 * slip of the finger names nothing.
 */
function SpeakerBid({ value, listener, hints, onBid, onBidHint, calc }: { value: number; listener: string; hints: boolean; onBid: ActionsProps['onBid']; onBidHint: () => void; calc: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const next = nextBid(value)
  const higher = next === null ? [] : BID_LADDER.filter((v) => v > next)
  const named = picked ?? next
  return (
    <Row>
      {/* Whom the bid goes to, on every table (SKATGO-141, back from SKATGO-134's buttons-only). */}
      <Say>{m.bid_your_turn({ name: listener })}</Say>
      <Btn testId="skat-bid" shape="block" size="lg" onClick={() => (picked === null ? onBid('bid') : onBid('bid', picked))}>{m.bid_button({ value: named ?? '' })}</Btn>
      <Btn testId="skat-pass" shape="block" size="lg" onClick={() => onBid('pass')}>{m.bid_pass()}</Btn>
      {higher.length > 0 ? (
        <Btn testId="skat-higher" tone="quiet" shape="block" size="lg" onClick={() => { setOpen((o) => !o); setPicked(null) }}>{m.bid_higher()}</Btn>
      ) : null}
      {open ? (
        <div role="group" aria-label={m.bid_higher_values()} data-testid="skat-jump" {...stylex.props(styles.jumpRow)}>
          {higher.map((v) => (
            <button
              key={v}
              type="button"
              data-testid="skat-jump-value"
              data-value={v}
              aria-pressed={picked === v}
              onClick={() => setPicked((p) => (p === v ? null : v))}
              {...stylex.props(typography.toggle, styles.toggle, styles.jumpValue, picked === v && styles.toggleOn)}
            >
              {v}
            </button>
          ))}
        </div>
      ) : null}
      {hints ? <Btn tone="info" shape="block" size="lg" onClick={onBidHint}>{m.bid_hint_button()}</Btn> : null}
      {calc}
    </Row>
  )
}

type BidCalcState = { pick: number | null; setPick: (pick: number | null) => void }
const CALC_CONTRACTS: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }, { kind: 'null' }]

/**
 * Free play's bid calculator (SKATGO-157, the human: 「减少玩家技术性的负担，但是不减少思维的挑战」): the player picks a
 * contract, and the drawer counts what it is worth with the ten cards in hand — matadors, multiplier, base value, and
 * Hand one step more. Which contract, and how high to go, stay the player's.
 */
function BidCalc({ hand, pick, setPick }: { hand: Card[] } & BidCalcState) {
  const contract = pick === null ? null : CALC_CONTRACTS[pick]
  let line = ''
  if (contract?.kind === 'null') line = m.bidcalc_null({ plain: NULL_VALUES.plain, hand: NULL_VALUES.hand, ouvert: NULL_VALUES.ouvert, handOuvert: NULL_VALUES.handOuvert })
  else if (contract) {
    const t = matadors(hand, contract)
    const base = baseValue(contract)
    line = m.bidcalc_value({ matadors: matadorLabel(t.with, t.count), level: t.count + 1, base, value: base * (t.count + 1), hand: base * (t.count + 2) })
  }
  return (
    <div data-testid="skat-calc" {...stylex.props(styles.bidCalc)}>
      <div role="group" aria-label={m.bidcalc_label()} {...stylex.props(styles.bidCalcRow)}>
        <span {...stylex.props(typography.appText, styles.bidCalcLabel)}>{m.bidcalc_label()}</span>
        {CALC_CONTRACTS.map((c, i) => (
          <button
            key={i}
            type="button"
            data-testid="skat-calc-contract"
            aria-pressed={pick === i}
            aria-label={contractName(c)}
            onClick={() => setPick(pick === i ? null : i)}
            {...stylex.props(typography.toggle, styles.toggle, styles.jumpValue, pick === i && styles.toggleOn)}
          >
            {c.kind === 'suit' ? SUIT_SYMBOL[c.trump] : contractName(c)}
          </button>
        ))}
      </div>
      {line ? (
        <p data-testid="skat-calc-line" {...stylex.props(typography.appText, styles.say)}>
          <Rich text={line} />
        </p>
      ) : null}
    </div>
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

/**
 * The cards' sounds (SKATGO-101): what changed on the table since it was last drawn — a new deal dealt out, a
 * card more on the table (the learner's own at once, as it is shown at once), a trick gathered in. A game taken
 * up in the middle makes no sound for what was already played.
 */
function useCardSounds(game: Game) {
  const seen = useRef<{ deal: string; cards: number; tricks: number } | null>(null)
  const fresh = game.phase === 'bidding' && game.bidding.log.length === 0 && game.tricks.length === 0
  const dealt = `${game.dealer}|${game.hands.map((h) => h.map(cardId).join()).join('|')}|${game.skat.map(cardId).join()}`
  const cards = game.tricks.length * 3 + game.trick.length
  useEffect(() => {
    const before = seen.current
    if (fresh) {
      if (before?.deal !== dealt) playSound('deal')
      seen.current = { deal: dealt, cards, tricks: game.tricks.length }
      return
    }
    if (before && cards > before.cards) playSound('play')
    if (before && game.tricks.length > before.tricks) playSound('collect')
    seen.current = { deal: before?.deal ?? '', cards, tricks: game.tricks.length }
  }, [fresh, dealt, cards, game.tricks.length])
}

/**
 * The table's way out (SKATGO-96, the human: 「退出按钮……放到打牌界面上？」): a round button in the felt's top right
 * corner, across from where the assistant's launcher stood at the top left until SKATGO-130, on every full-screen table. It opens a small menu — keep
 * playing, give up free play's round for a new one (asked once more first), or leave the table. Leaving loses
 * nothing: free play's game waits in this browser, the tournament's on the server, a private table's in its room.
 */
function TableMenu({ leave, newRound }: { leave: '/' | '/daily' | '/with-friends' | '/skat-tricks'; newRound?: () => void }) {
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const close = () => {
    setOpen(false)
    setAsking(false)
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && close()
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])
  return (
    <div ref={box} data-testid="skat-menu" {...stylex.props(styles.menuCorner)}>
      <button
        type="button"
        aria-label={m.table_menu()}
        aria-expanded={open}
        data-testid="skat-menu-button"
        onClick={() => (open ? close() : setOpen(true))}
        {...stylex.props(styles.menuButton)}
      >
        <LogOut aria-hidden="true" size={icon.launcher} strokeWidth={icon.launcherStroke} />
      </button>
      {open ? (
        <div data-testid="skat-menu-list" {...stylex.props(styles.menuList)}>
          {asking ? (
            <>
              <p {...stylex.props(typography.appText, styles.menuAsk)}>{m.free_round_abandon()}</p>
              <Btn testId="skat-menu-new-yes" tone="stop" shape="block" onClick={() => { close(); newRound?.() }}>{m.free_round_abandon_yes()}</Btn>
              <Btn testId="skat-menu-new-no" tone="quiet" shape="block" onClick={close}>{m.table_menu_back()}</Btn>
            </>
          ) : (
            <>
              <Btn testId="skat-menu-continue" tone="go" shape="block" onClick={close}>{m.table_continue()}</Btn>
              {newRound ? <Btn testId="skat-menu-new" tone="quiet" shape="block" onClick={() => setAsking(true)}>{m.free_round_new()}</Btn> : null}
              <Link to={leave} data-testid="skat-leave" {...linkLook('stop', 'md', 'block')}>{m.table_leave()}</Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

const Say = ({ children }: { children: ReactNode }) => <p {...stylex.props(typography.appText, styles.say)}>{children}</p>

/** A dialog over the table: white, on the scrim, one full-width green action inside. With a `foot` (SKATGO-146, the
 *  human: 「modal应该是滚动区域，下面是next deal按钮」), the dialog's body scrolls inside its own box and the foot stays
 *  at its bottom, over the scrolled content. Either way the scrolling part is inset by the dialog's padding, so its scroll
 *  bar stands inside the dialog, never on its edge (SKATGO-156, 「所有的弹窗，都要让滚动条在弹窗内部，而不是贴道外部」). */
function Dialog({ children, foot }: { children: ReactNode; foot?: ReactNode }) {
  return (
    <div data-testid="skat-dialog" {...stylex.props(styles.scrim)}>
      {foot ? (
        <div role="dialog" aria-modal="false" {...stylex.props(styles.dialog, styles.dialogFramed)}>
          <div data-testid="skat-dialog-body" {...stylex.props(styles.dialogBody)}>{children}</div>
          <div data-testid="skat-dialog-foot" {...stylex.props(styles.dialogFoot)}>{foot}</div>
        </div>
      ) : (
        <div role="dialog" aria-modal="false" {...stylex.props(styles.dialog)}>
          <div data-testid="skat-dialog-body" {...stylex.props(styles.dialogInner)}>{children}</div>
        </div>
      )}
    </div>
  )
}

type Tint = 'C' | 'S' | 'H' | 'D' | 'grand' | 'null'
const tintOf = (c: Contract): Tint => (c.kind === 'suit' ? c.trump : c.kind)


const styles = stylex.create({
  // The way out (SKATGO-96): mirrors the room the assistant's launcher had at the felt's top left (gone since SKATGO-130). Placed in the
  // felt's grid area of the table, so it keeps to the felt beside a pinned panel, and over the table's dialogs.
  menuCorner: {
    position: 'absolute',
    gridArea: dims.feltCell,
    top: { default: space.x16, [bp.phone]: space.x8 },
    right: { default: space.x16, [bp.phone]: space.x8 },
    zIndex: layer.tip,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: space.x8,
  },
  // An exercise's settings (SKATGO-111): the way out's mirror, in the felt's top left corner.
  settingsCorner: {
    position: 'absolute',
    gridArea: dims.feltCell,
    top: { default: space.x16, [bp.phone]: space.x8 },
    left: { default: space.x16, [bp.phone]: space.x8 },
    zIndex: layer.tip,
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.launcher,
    height: dims.launcher,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.round,
    backgroundColor: color.surface,
    color: color.navy,
    cursor: 'pointer',
    boxShadow: elev.panel,
    transform: { default: move.rest, ':active': move.press },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    width: dims.tableMenu,
    padding: space.x16,
    boxSizing: 'border-box',
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
  },
  menuAsk: { margin: 0, color: color.navy },
  // Clipped, not hidden (SKATGO-32): a hidden overflow can still be scrolled by focus or scrollIntoView,
  // which slid the whole felt sideways; a clipped one cannot scroll at all.
  table: { position: 'relative', display: 'grid', backgroundColor: color.page, overflow: 'clip' },
  // Free play: the felt fills the screen; on a wide screen the panel is pinned beside it (SKATGO-34),
  // narrower it is a drawer over it (SKATGO-29).
  tableFull: { gridTemplateColumns: { default: dims.oneColumn, [bp.pinned]: dims.feltAndPanel }, height: dims.screenDynamic },
  // Inside a lesson: the panel stacks under the felt.
  tableEmbedded: { gridTemplateColumns: dims.oneColumn, borderRadius: radii.panel },
  // An open-card endgame fills the screen as free play does, with no panel beside it (SKATGO-111).
  tableAlone: { gridTemplateColumns: dims.oneColumn },

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
  // On a square with rounded corners, just as large as the picture (SKATGO-148), dark and see-through like the info board
  // rather than white (SKATGO-155, the human: 「那个头像上的白框不要了，太显眼了」, 「可以做一个暗色透明的阴影方块，尺寸还是那个尺寸」).
  face: {
    position: 'absolute',
    top: stage.faceTop,
    width: stage.face,
    height: stage.face,
    overflow: 'hidden',
    borderRadius: radii.panel,
    backgroundColor: color.board,
    pointerEvents: 'none',
  },
  faceLeft: { left: stage.faceInset },
  faceRight: { right: stage.faceInset },
  faceImage: { position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%' },
  faceHidden: { visibility: 'hidden' },
  stackRight: { right: stage.stackInset },
  sideSlot: {
    position: 'relative',
    flexShrink: 0,
    width: stage.stackSlotWidth,
    height: stage.stackSlotHeight,
    marginTop: { default: stage.stackStep, ':first-child': 0 },
  },
  sideCard: { position: 'absolute', top: dims.half, left: dims.half, display: 'block', width: stage.stackCard, transform: pose.sideways },
  // The right opponent's cards laid open (SKATGO-65): listed bottom-up, each over the top of the one
  // below, turned so the index shows.
  stackOpenRight: { flexDirection: 'column-reverse' },
  sideSlotOpenRight: { marginTop: 0, marginBottom: { default: stage.stackStep, ':first-child': 0 } },
  // Laid open after an early end, the cards are spread wider so each reads (SKATGO-65).
  sideSlotSpread: { marginTop: { default: stage.stackStepOpen, ':first-child': 0 } },
  sideSlotSpreadRight: { marginTop: 0, marginBottom: { default: stage.stackStepOpen, ':first-child': 0 } },
  sideCardOpenRight: { transform: pose.sidewaysOpen },
  // An open endgame's hands (SKATGO-111): cards as big as the learner's, beside the frame's middle — the
  // exercise has no edge tabs for their foot to clear.
  stackBig: { top: stage.frameCentre },
  stackBigLeft: { left: stage.openStackInset },
  stackBigRight: { right: stage.openStackInset },
  sideSlotBig: { width: stage.openStackSlot, height: stage.handCard, marginTop: { default: stage.openStackStep, ':first-child': 0 } },
  sideSlotBigRight: { marginTop: 0, marginBottom: { default: stage.openStackStep, ':first-child': 0 } },
  sideCardBig: { width: stage.handCard },

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

  // Table talk (SKATGO-142, SKATGO-143): a white card as wide as its words, beside the speaker's face and level with it
  // (SKATGO-157).
  talk: {
    position: 'absolute',
    top: stage.faceTop,
    display: 'flex',
    alignItems: 'flex-end',
    gap: space.x8,
    margin: 0,
    width: 'max-content',
    maxWidth: stage.talkMax,
    boxSizing: 'border-box',
    paddingBlock: space.x8,
    paddingInline: space.x12,
    borderRadius: radii.panel,
    backgroundColor: color.surface,
    boxShadow: elev.option,
    color: color.navy,
  },
  // A short triangle out of the bubble's side, level with the top of the face beside it, its point at the face.
  talkTailSide: {
    position: 'absolute',
    top: space.x12,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderTopWidth: space.x8,
    borderBottomWidth: space.x8,
  },
  talkTailSideLeft: { right: '100%', borderLeftWidth: 0, borderRightWidth: space.x8, borderRightColor: color.surface },
  talkTailSideRight: { left: '100%', borderRightWidth: 0, borderLeftWidth: space.x8, borderLeftColor: color.surface },
  talkLeft: { left: stage.talkBeside },
  talkRight: { right: stage.talkBeside },
  talkBare: { left: stage.faceInset, right: 'auto' },
  talkBareRight: { right: stage.faceInset, left: 'auto' },
  talkHand: { flexShrink: 0, width: dims.talkHand, height: dims.talkHand, overflow: 'visible', alignSelf: 'flex-end' },
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
  topTip: { zIndex: layer.tip },
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
  // The card points' cell as a button: the cell's look, nothing of a button's own, the focus ring when focused.
  boardSwitch: {
    margin: 0,
    backgroundColor: 'transparent',
    font: 'inherit',
    color: 'inherit',
    cursor: 'pointer',
    // The cell's own rules are its left and top ones; a button's right and bottom borders go.
    borderRightWidth: 0,
    borderBottomWidth: 0,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  boardCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // 4 under the label, 2 under the value: the line under a value sits level with the names under the totals,
    // which are 2 under their numbers (SKATGO-97, the human: 「deal 6 of 6和……lina, you, noah不在一条水平线上」).
    gap: space.x2,
    minWidth: 0,
    paddingBlock: { default: space.x10, [bp.phone]: space.x8 },
    paddingInline: { default: space.x16, [bp.phone]: space.x6 },
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
  boardLabel: { color: color.amber, whiteSpace: 'nowrap', marginBottom: space.x2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' },
  // What does not fit its cell wraps (a long name) or ends in an ellipsis (a small line), never past the cell's
  // padding (SKATGO-100).
  boardValue: { color: color.onColor, maxWidth: '100%', overflowWrap: 'anywhere', textWrap: 'balance' },
  boardNumber: { color: color.onColor, whiteSpace: 'nowrap' },
  boardMine: { color: color.amber },
  boardSub: { color: color.onColorSoft, whiteSpace: 'nowrap', minHeight: space.x12, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' },
  // Three equal columns: a long name ends in an ellipsis instead of pushing the totals past the cell.
  totals: { display: 'grid', gridTemplateColumns: dims.boardTotals, columnGap: { default: space.x12, [bp.phone]: space.x6 }, width: '100%' },
  total: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x2, minWidth: 0 },

  // The skat and its label, in the frame's middle.
  // Positioned, so it lies over the seat plates drawn before it (SKATGO-158).
  skatPile: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6, width: '100%' },
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
    // A real table says nothing while the player plays (SKATGO-134): no empty pill then (SKATGO-143).
    display: { default: null, ':empty': 'none' },
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
  // Pinned, the panel's top right corner keeps the room the assistant's launcher had (gone since SKATGO-130): the tabs
  // leave it.
  // Three equal columns, each tab centred in its own (SKATGO-75).
  tabs: { display: 'grid', gridTemplateColumns: dims.panelTabs, paddingBottom: space.x16, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  tab: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', gap: space.x4, color: color.slateDeep, textDecoration: 'none' },
  // The rules in the panel (SKATGO-75): a way back to the game above them.
  panelBackRow: { display: 'grid', gridTemplateColumns: dims.panelBackRow, alignItems: 'center', gap: space.x8 },
  panelBack: { display: 'inline-flex', alignItems: 'center', gap: space.x4, padding: 0, borderWidth: 0, backgroundColor: 'transparent', color: color.info, cursor: 'pointer' },
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
  // The higher numbers of a jump bid (SKATGO-87): one row across the panel that scrolls sideways.
  jumpRow: {
    display: 'flex',
    flexWrap: 'nowrap',
    flexBasis: '100%',
    gap: space.x8,
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    paddingBlock: space.x4,
  },
  jumpValue: { flexShrink: 0 },
  // Free play's bid calculator (SKATGO-157): under the bid's buttons, its label and the contracts, wrapping on a phone.
  bidCalc: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x6, flexBasis: '100%' },
  bidCalcRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: space.x8 },
  bidCalcLabel: { flexShrink: 0, color: color.slate },
  resultBody: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  resultTitle: { margin: 0, color: color.navy },
  resultHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  // The calculation, a step a row: what it is at the left, its number at the right; the score under a rule.
  calc: { display: 'flex', flexDirection: 'column', gap: space.x2, margin: 0 },
  calcRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  calcTotal: { marginTop: space.x4, paddingTop: space.x6, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  calcValue: { margin: 0, color: color.navy, whiteSpace: 'nowrap' },
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
    // The way-out button stays over the dialogs (SKATGO-100); the dialog starts below it.
    paddingTop: { default: dims.scrimTop, [bp.phone]: dims.scrimTopPhone },
    backgroundColor: color.scrim,
  },
  dialog: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: dims.dialogWidth,
    maxHeight: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box',
    // The scroll bar 8 from the edge, the content 24 (SKATGO-157, 「滚动条右侧多了一个空白条，不能接受」).
    paddingBlock: space.x24,
    paddingLeft: space.x24,
    paddingRight: space.x8,
    borderRadius: radii.dialog,
    backgroundColor: color.surface,
    boxShadow: elev.panel,
  },
  dialogInner: { display: 'flex', flexDirection: 'column', gap: space.x16, flexGrow: 1, flexShrink: 1, minHeight: 0, overflowY: 'auto', paddingRight: space.x16 },
  dialogFramed: { gap: 0, paddingBlock: 0, paddingLeft: 0, paddingRight: 0 },
  // Its scroll bar clear of the rounded corner: 8 in from the top and the right, the content 24.
  dialogBody: { flexGrow: 1, flexShrink: 1, minHeight: 0, overflowY: 'auto', marginTop: space.x8, marginLeft: space.x24, marginRight: space.x8, paddingTop: space.x16, paddingBottom: space.x24, paddingRight: space.x16 },
  dialogFoot: {
    flexShrink: 0,
    paddingInline: space.x24,
    paddingBlock: space.x16,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    backgroundColor: color.surface,
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
// overlap, each toward who played it — Lina's on the left, the learner's in the middle, Noah's on the right
// — and each one step higher than the card to its left, so its top-left number and suit show above that
// card's top edge. Cards enter in play order, so a later one lies on top, and whatever was played last,
// every card's top-left number and suit stay in the open.
const positions = stylex.create({
  0: { left: 0, right: 0, marginInline: 'auto', top: stage.trickSecond },
  1: { left: dims.trickSideInset, top: stage.trickThird },
  2: { right: dims.trickSideInset, top: stage.trickFirst },
})
