import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { type GameMode, track } from '~/lib/analytics'
import { type FreeError, freeAct, freeNew, freeResume, freeReview, holdGame, isFreeError, keepGame, keptGame, takeCarriedGame } from '~/lib/free-api'
import { type Move, type Seat, next as nextSeat } from '~/lib/skat/game'
import { type DealReview, type DealSummary, type SeatView, gameFromView, summarize, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { VsAiTable } from './daily-comparison'
import { BOT_DELAY, GameTable } from './game-table'
import { Btn, Panel, linkLook } from './ui'
import { TableLoading } from './table-loading'

// Free play and lesson 11 on the server (SKATGO-40): a game drawn from the server's pool, played
// against SkatZero's computers. The server keeps nothing per game: the page holds the game's token, and free
// play keeps it in this browser with its round, so a reload goes on with the same deal (SKATGO-96); lesson 11
// keeps nothing. The server answers each move with every state
// the table passed through, and the table shows them one by one on its own beats. Hints and the
// assistant work as at the local table: they read only what this seat may see. A game's start and
// finish are its only events (SKATGO-74): never a bid or a card.

type Failure = { text: string; retry?: () => void }

const problemText = (e: FreeError) =>
  e.error === 'slow_down' ? m.free_slow_down() : e.error === 'game_expired' || e.error === 'invalid_game' ? m.free_expired() : m.free_unreachable()

type Settled = { humanWon: boolean; humanScore: number }

/** Free play's round (SKATGO-88): six deals, the deal going round as at a real table, so the player sits
 *  in each position twice; its finished deals, the player's and the AI's from the same seat. Lesson 11 is
 *  one game, not a round. */
const ROUND_DEALS = 6
type Round = { deals: DealSummary[]; ais: (DealSummary | null)[] }
const NO_ROUND: Round = { deals: [], ais: [] }

export function ServerTable({ mode, fullScreen = false, onSettled }: { mode: GameMode; fullScreen?: boolean; onSettled?: (info: Settled) => void }) {
  const [token, setToken] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  /** The player has tapped the finished trick away (SKATGO-72) — perhaps before its state arrived, the
   *  player's own card being shown at once (SKATGO-73). Until then the steps after it wait. */
  const [release, setRelease] = useState(false)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const started = useRef(false)
  const [round, setRound] = useState<Round>(NO_ROUND)
  const [summary, setSummary] = useState(false)
  /** Each finished game's review, asked once (SKATGO-86): the result and the round both read it. */
  const reviews = useRef(new Map<string, Promise<DealReview | FreeError>>())
  const ask = (t: string) => {
    let asked = reviews.current.get(t)
    if (!asked) reviews.current.set(t, (asked = freeReview(t)))
    return asked
  }

  function take(steps: SeatView[], next: { token: string; revision: number }) {
    setToken(next.token)
    setRevision(next.revision)
    setFailure(null)
    setShown(steps[0])
    setQueue(steps.slice(1))
  }

  /** A new game; in a round, dealt by `dealer` (the first deal's dealer is the server's to draw). */
  async function start(dealer?: Seat) {
    setSending(true)
    const r = await freeNew(dealer)
    setSending(false)
    if (isFreeError(r)) return setFailure({ text: problemText(r), retry: () => void start() })
    track('game_started', { mode })
    take(r.steps, r)
  }

  async function send(move: Move) {
    if (!token) return
    setSending(true)
    const r = await freeAct(token, revision, move)
    setSending(false)
    if (isFreeError(r)) {
      // The same move with the same token is safe to send again; an expired game can only start over.
      const lost = r.error === 'game_expired' || r.error === 'invalid_game' || r.error === 'stale_revision'
      return setFailure({ text: problemText(r), retry: lost ? undefined : () => void send(move) })
    }
    take(r.steps, r)
  }

  /** A game carried here across a change of language (SKATGO-79) or kept in this browser (SKATGO-96): taken
   *  up where it was, or, when its token is no longer good, a new one in a new round. */
  async function resume(carried: { token: string; round: string | null }) {
    setSending(true)
    const r = await freeResume(carried.token)
    setSending(false)
    if (isFreeError(r)) return void start()
    if (carried.round) {
      try {
        setRound(JSON.parse(carried.round) as Round)
      } catch {
        // A round that does not read is no round: the game goes on as the first deal of a new one.
      }
    }
    take(r.steps, r)
  }
  // Free play's game goes along when the language changes, with its round (SKATGO-88), and stays in this
  // browser for a reload (SKATGO-96) until the round is over; lesson 11 starts its game again with its step.
  useEffect(() => {
    if (mode !== 'free') return
    holdGame(token, JSON.stringify(round))
    if (summary) keepGame(null)
    else if (token) keepGame(token, JSON.stringify(round))
    return () => holdGame(null)
  }, [mode, token, round, summary])

  /** After a deal of free play's round: it goes into the round, with the AI's deal from the same seat
   *  when its review has it; then the next deal, dealt by the next seat, or after the sixth the round's
   *  result. Lesson 11 just starts its game again. */
  async function nextDeal(finished: NonNullable<typeof game>) {
    if (mode !== 'free' || !token) return void start()
    const r = await ask(token)
    const played: Round = { deals: [...round.deals, summarize(finished)], ais: [...round.ais, 'error' in r ? null : r.ai] }
    setRound(played)
    if (played.deals.length >= ROUND_DEALS) return setSummary(true)
    void start(nextSeat(finished.dealer))
  }
  function newRound() {
    setRound(NO_ROUND)
    setSummary(false)
    void start()
  }
  useEffect(() => {
    if (started.current) return
    started.current = true
    const carried = mode === 'free' ? takeCarriedGame() ?? keptGame() : null
    void (carried ? resume(carried) : start())
    // Once, when the table opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The computers' moves arrive all at once; show them one by one, a finished trick staying until it
  // is tapped away.
  useEffect(() => {
    if (queue.length === 0) return
    const held = shown?.phase === 'trickEnd'
    if (held && !release) return
    const t = setTimeout(() => {
      if (held) setRelease(false)
      setShown(queue[0])
      setQueue((q) => q.slice(1))
    }, held ? 0 : BOT_DELAY)
    return () => clearTimeout(t)
  }, [queue, shown, release])

  const game = useMemo(() => (shown ? gameFromView(shown) : null), [shown])
  if (summary) {
    return (
      <div {...stylex.props(styles.summary)}>
        <Panel>
          <div data-testid="free-round" {...stylex.props(styles.summaryBody)}>
            <h2 {...stylex.props(typography.dialogTitle, styles.text)}>{m.free_round_title()}</h2>
            <VsAiTable deals={round.deals} benchmarks={round.ais} />
            <div {...stylex.props(styles.row)}>
              <Btn testId="free-round-new" onClick={newRound}>{m.free_round_new()}</Btn>
              {/* The table's own way out, as on the felt (free play's leads to the front page). */}
              <Link to="/" data-testid="skat-leave" {...linkLook('quiet', 'md')}>{m.table_leave()}</Link>
            </div>
          </div>
        </Panel>
      </div>
    )
  }
  if (!game) {
    // Until the deal comes, a full-screen table shows the turning logo (SKATGO-93); a lesson's shows nothing.
    if (!failure) return fullScreen ? <TableLoading /> : null
    return (
      <Panel tone="bad">
        <p data-testid="server-problem" role="alert" {...stylex.props(typography.appText, styles.text)}>{failure.text}</p>
        <div {...stylex.props(styles.row)}>
          <Btn testId="server-new-game" onClick={() => void start()}>{m.free_new_game()}</Btn>
        </div>
      </Panel>
    )
  }
  return (
    <GameTable
      fullScreen={fullScreen}
      onSettled={(info: Settled) => {
        track('game_finished', { mode, won: info.humanWon, score: info.humanScore })
        onSettled?.(info)
      }}
      server={{
        game,
        busy: sending || queue.length > 0,
        send: (move) => void send(move),
        collect: () => setRelease(true),
        next: () => void nextDeal(game),
        problem: failure ? { text: failure.text, retry: failure.retry, fresh: () => void start() } : null,
        // A finished game, reviewed on request from its own token (SKATGO-79), with the AI's game from the
        // player's seat (SKATGO-86) — free play and lesson 11 alike, the same table.
        review: token ? () => ask(token) : undefined,
        round: mode === 'free' ? { deal: round.deals.length, of: ROUND_DEALS, total: totals(round.deals)[0] } : undefined,
        // Free play's round can be given up for a new one (SKATGO-96); the table asks first.
        newRound: mode === 'free' ? newRound : undefined,
      }}
    />
  )
}

const styles = stylex.create({
  text: { margin: 0, color: color.navy },
  row: { display: 'flex', gap: space.x10, paddingTop: space.x10 },
  // The round's result (SKATGO-88): one reading column in the middle of the screen.
  summary: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: space.x16, minHeight: dims.screenDynamic, boxSizing: 'border-box' },
  summaryBody: { display: 'flex', flexDirection: 'column', gap: space.x16, width: '100%', maxWidth: dims.readingColumn },
})
