import * as stylex from '@stylexjs/stylex'
import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useNavigate } from '@tanstack/react-router'
import { CircleHelp, Coins, Trophy } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { checkInOnce } from '~/lib/checkin'
import { type LeagueError, type LeagueState, PASSING_LEAGUE, enterLeague, leagueReview, leagueState, playLeague } from '~/lib/league-api'
import { CHECKIN_COINS, FEES, LEGEND, MATCH_WAIT_MS, PROMOTE_AT, RELEGATE_AT, type LeagueResult } from '~/lib/skat/league'
import { roomGame, roomSeat } from '~/lib/skat/room-view'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale, localizeHref } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who, signed } from './daily-comparison'
import { GameTable } from './game-table'
import { Tiers, leagueName } from './league-tiers'
import { Shell, seatNames, useSeat } from './table-room'
import { Btn, Modal, Panel, Pill, ProgressBar, linkLook } from './ui'
import type { TableState } from '~/lib/room-client'
import type { LeagueMe } from '~/lib/skat/league'

// The League in the browser (SKATGO-204): the League page's own part — the player's tier, points and coins with the one
// way to play, the tiers, the Legend board — and the round's table. A round is asked for on the League page, which waits
// there while players are found (up to five seconds), then goes to the table; the table only ever comes back to the
// account's own round, so a reload never starts another one.

const errorText = (e: LeagueError) =>
  ({
    sign_in_required: m.room_sign_in,
    not_enough_coins: m.league_poor,
    already_in_room: m.league_err_busy,
    no_table: m.league_err_over,
    no_opponents: m.table_err_room_capacity,
    room_capacity: m.table_err_room_capacity,
    room_full: m.league_err_full,
    tier_changed: m.table_err_not_ready,
    slow_down: m.table_err_slow_down,
    not_ready: m.table_err_not_ready,
    unreachable: m.table_err_unreachable,
  })[e]()

/** The League page's own part: for an account its card, the tiers with its own marked and the Legend board; for a guest
 *  the tiers, the board and the way to sign in. */
export function LeagueHome() {
  const account = useAccount()
  const navigate = useNavigate()
  const [state, setState] = useState<LeagueState | null>(null)
  /** When the wait for a round began; null while not waiting. */
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [how, setHow] = useState(false)
  useEffect(() => {
    if (account === undefined) return
    let live = true
    // Today's coins first: the frame's check-in of this page load, which this waits for.
    void (account ? checkInOnce(account) : Promise.resolve())
      .then(() => leagueState())
      .then((s) => { if (live && typeof s !== 'string') setState(s) })
    return () => { live = false }
  }, [account])

  async function play() {
    setBusy(Date.now())
    setError(null)
    const r = await playLeague()
    if (typeof r === 'string') {
      setBusy(null)
      setError(errorText(r))
      // The coins or the table may have changed meanwhile: what the card says is read again.
      void leagueState().then((s) => { if (typeof s !== 'string') setState(s) })
      return
    }
    void navigate({ to: '/league/play' })
  }

  const me = state?.me ?? null
  const fee = me ? FEES[me.tier] : 0
  const helpButton = (
    <button type="button" data-testid="league-how" aria-label={m.league_how()} title={m.league_how()} onClick={() => setHow(true)} {...stylex.props(styles.help)}>
      <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
    </button>
  )
  return (
    <div {...stylex.props(styles.stack)}>
      {account === null ? (
        <Panel>
          <section data-testid="league-guest" {...stylex.props(styles.card)}>
            <div {...stylex.props(styles.head)}>
              <p {...stylex.props(typography.appText, styles.ink)}>{m.league_guest()}</p>
              {helpButton}
            </div>
            <div {...stylex.props(styles.row)}>
              <SignInButton mode="modal">
                <Btn testId="league-sign-in" size="lg">{m.auth_sign_in()}</Btn>
              </SignInButton>
            </div>
          </section>
        </Panel>
      ) : me ? (
        <MeCard me={me} fee={fee} busy={busy} error={error} onHelp={() => setHow(true)} onPlay={() => void play()} />
      ) : null}
      <Tiers mine={me ? me.tier : null} />
      {/* The Legend board once anyone is on it. */}
      {state?.board.rows.length ? <Board state={state} /> : null}
      {how ? <LeagueHow onClose={() => setHow(false)} /> : null}
    </div>
  )
}

/** While players are found (the human: 「等待时要有个倒计时」): the seconds left of the League's wait, counting down from
 *  five; once they are up, the table is being laid and the line keeps no number. */
function Finding({ since }: { since: number }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  const left = Math.ceil((since + MATCH_WAIT_MS - now) / 1000)
  return <span data-testid="league-countdown" data-left={Math.max(0, left)}>{left > 0 ? m.league_finding_in({ s: `${left}` }) : m.league_finding()}</span>
}

/** The player's own League (SKATGO-204) as the front page's League tile is, navy with white words (the human chose this
 *  look, 「我选A」): the League with its cup, then the coins and the League points large — the coins first, the human: 「没显示
 *  该玩家的总金币数」 — how far to promotion and to relegation, the bar between the two lines, and the one way to play. */
function MeCard({ me, fee, busy, error, onHelp, onPlay }: { me: LeagueMe; fee: number; busy: number | null; error: string | null; onHelp: () => void; onPlay: () => void }) {
  // From the relegation line to the promotion line; Legend has no promotion, so no bar.
  const progress = me.tier < LEGEND ? (me.points - RELEGATE_AT) / (PROMOTE_AT - RELEGATE_AT) : null
  // How far to move up and down, where there is a move: none up from Legend, none down from Bronze.
  const moves = [
    me.tier < LEGEND ? m.league_to_up({ n: PROMOTE_AT - me.points }) : null,
    me.tier > 0 ? m.league_to_down({ n: me.points - RELEGATE_AT }) : null,
  ].filter(Boolean).join(' · ')
  return (
    <div {...stylex.props(styles.hero)}>
      <section data-testid="league-me" data-tier={me.tier} data-points={me.points} data-coins={me.coins} data-today={String(me.today)} {...stylex.props(styles.card)}>
        <div {...stylex.props(styles.head)}>
          <span {...stylex.props(styles.titleRow)}>
            <Trophy aria-hidden="true" size={icon.tile} strokeWidth={icon.outline} {...stylex.props(styles.onColor)} />
            <h2 {...stylex.props(typography.homeTileTitle, styles.onColor)}>{leagueName(me.tier)}</h2>
          </span>
          <button type="button" data-testid="league-how" aria-label={m.league_how()} title={m.league_how()} onClick={onHelp} {...stylex.props(styles.help, styles.onColor)}>
            <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
        </div>
        <div {...stylex.props(styles.stats)}>
          <div data-testid="league-coins" {...stylex.props(styles.stat)}>
            <span {...stylex.props(styles.statValue)}>
              <Coins aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.onColor)} />
              <span {...stylex.props(typography.homeCardTitle, styles.onColor)}>{me.coins}</span>
            </span>
            <span {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_coins_label()}</span>
            {me.today ? <span {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_today({ n: CHECKIN_COINS })}</span> : null}
          </div>
          <div data-testid="league-points" {...stylex.props(styles.stat)}>
            <span {...stylex.props(typography.homeCardTitle, styles.onColor)}>{signed(me.points)}</span>
            <span {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_points_label()}</span>
            {moves ? <span {...stylex.props(typography.appText, styles.onColorSoft)}>{moves}</span> : null}
          </div>
        </div>
        {progress !== null ? <ProgressBar value={progress} label={m.league_progress()} /> : null}
        <div {...stylex.props(styles.row)}>
          {me.table ? (
            <Link to="/league/play" data-testid="league-back" {...linkLook('go', 'lg')}>{m.league_back()}</Link>
          ) : (
            // While players are found, the button says so (up to five seconds).
            <Btn testId="league-play" size="lg" disabled={busy !== null || me.coins < fee} onClick={onPlay}>{busy !== null ? <Finding since={busy} /> : m.league_play({ fee })}</Btn>
          )}
        </div>
        {busy === null && !me.table && me.coins < fee ? <p data-testid="league-poor" {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_poor()}</p> : null}
        {error ? <p role="alert" data-testid="league-error" {...stylex.props(typography.appText, styles.onColor)}>{error}</p> : null}
      </section>
    </div>
  )
}

/** How the League goes, in the site's dialog: a round and its points, moving up and down, the coins. */
function LeagueHow({ onClose }: { onClose: () => void }) {
  return (
    <Modal title={m.league_how()} onClose={onClose} testId="league-how-text">
      <div {...stylex.props(styles.stack)}>
        <p {...stylex.props(typography.appText, styles.ink)}>{m.league_how_round()}</p>
        <p {...stylex.props(typography.appText, styles.ink)}>{m.league_how_move()}</p>
        <p {...stylex.props(typography.appText, styles.ink)}>{m.league_how_coins()}</p>
      </div>
    </Modal>
  )
}

/** The Legend board: the accounts in Legend by their points there, the player's own row marked. */
function Board({ state }: { state: LeagueState }) {
  return (
    <Panel>
      <section data-testid="league-board" aria-labelledby="league-board-title" {...stylex.props(styles.card)}>
        <h2 id="league-board-title" {...stylex.props(typography.optionTitle, styles.ink)}>{m.league_board()}</h2>
        <ol {...stylex.props(styles.rows)}>
          {state.board.rows.map((r, i) => (
            <li key={i} data-testid="league-board-row" data-rank={r.rank} data-points={r.points} data-you={r.you ? 'true' : undefined} {...stylex.props(typography.appText, styles.boardRow, r.you && styles.own)}>
              <span {...stylex.props(styles.slate, styles.rank)}>{r.rank}</span>
              <span {...stylex.props(styles.name)}>
                {r.nickname}
                {r.you ? <span {...stylex.props(styles.tag)}><Who side="you" /></span> : null}
              </span>
              <span {...stylex.props(typography.appBtnStrong, styles.number)}>{signed(r.points)}</span>
            </li>
          ))}
        </ol>
      </section>
    </Panel>
  )
}

/** The League page's address in this page's language, to tell whether the browser is still on the table. */
const tablePath = () => localizeHref('/league/play', { locale: getLocale() })

/**
 * A League round's table (SKATGO-204): the account's own round, its seat kept and come back to as a private table's is;
 * three deals, each with its result against the AI and its XP, as free play's; after the third, the round's result.
 */
export function LeagueTable() {
  const account = useAccount()
  const navigate = useNavigate()
  const [result, setResult] = useState(false)
  const [again, setAgain] = useState<{ busy: number | null; error: string | null }>({ busy: null, error: null })
  const seat = useSeat<LeagueError>({
    enter: enterLeague,
    passing: PASSING_LEAGUE,
    here: () => window.location.pathname === tablePath(),
    active: !!account,
  })
  const { stage, shown } = seat
  useEffect(() => {
    if (account === null) seat.setStage({ kind: 'signIn' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  /** Another round in the same tier, from the round's result. */
  async function playAgain() {
    setAgain({ busy: Date.now(), error: null })
    const r = await playLeague()
    if (typeof r === 'string') return setAgain({ busy: null, error: errorText(r) })
    setAgain({ busy: null, error: null })
    setResult(false)
    await seat.reseat()
  }

  if (stage.kind === 'signIn') {
    return (
      <Notice text={m.league_guest()}>
        <SignInButton mode="modal">
          <Btn testId="league-table-sign-in">{m.auth_sign_in()}</Btn>
        </SignInButton>
      </Notice>
    )
  }
  if (stage.kind === 'error' || stage.kind === 'gone') {
    const text = stage.kind === 'error' ? errorText(stage.error) : m.league_err_over()
    return (
      <Notice text={text} alert>
        {stage.kind === 'error' && stage.again ? <Btn testId="table-again" onClick={seat.again}>{m.table_again()}</Btn> : null}
      </Notice>
    )
  }
  if (!shown || !shown.pub.league) return <Notice text={m.loading()} />
  const league = shown.pub.league
  if (result && league.result) {
    return <RoundResult state={shown} result={league.result} again={again} onAgain={() => void playAgain()} onLeave={() => void navigate({ to: '/league' })} />
  }
  const notice = seat.away ? <span data-testid="table-reconnecting"><Pill tone="dark">{m.table_reconnecting()}</Pill></span> : null
  return <LeaguePlaying state={shown} busy={seat.busy} send={seat.send} collect={seat.collect} notice={notice} onResult={() => setResult(true)} />
}

function LeaguePlaying({ state, busy, send, collect, notice, onResult }: {
  state: TableState; busy: boolean; send: ReturnType<typeof useSeat>['send']; collect: () => void; notice: ReactNode; onResult: () => void
}) {
  const game = useMemo(() => roomGame(state.pub, state.mine), [state])
  const me = state.mine.seat
  const league = state.pub.league!
  const deal = state.pub.deals
  // The finished deal's review for this seat — asked once per deal, as free play asks once per game.
  const review = useMemo(() => () => leagueReview(league.match, deal - 1), [league.match, deal])
  if (!game) return null
  const totals = [0, 1, 2].map((v) => state.pub.scores[roomSeat(v, me)]) as [number, number, number]
  const ended = game.phase === 'done' || game.phase === 'passedIn'
  const others = state.pub.seats.filter((s) => s.kind === 'human' && s.connected && !s.ready && s.seat !== me)
  const waiting = ended && state.pub.seats[me].ready && others.length > 0 ? m.room_next_wait({ names: others.map((s) => s.nickname ?? '').join(', ') }) : null
  const last = deal >= league.of && !!league.result
  return (
    <div data-testid="league-table" data-room={state.pub.roomId} data-match={league.match} data-seat={me} data-deals={deal} data-dealer={state.pub.dealer} data-phase={state.pub.phase} data-controls={state.pub.seats.map((x) => x.control).join(',')} data-kinds={state.pub.seats.map((x) => x.kind).join(',')} {...stylex.props(styles.play)}>
      <GameTable
        fullScreen
        room={{
          game, busy, send: (move) => send(move), collect, next: () => send({ type: 'next' }), names: seatNames(state), totals, notice, deal,
          stats: null, waiting, code: state.pub.roomId, leave: () => {}, people: [], kick: () => {},
          league: {
            of: league.of,
            review,
            done: last ? <Btn testId="league-round-result" shape="block" size="lg" grow onClick={onResult}>{m.league_round_result()}</Btn> : undefined,
          },
        }}
      />
    </div>
  )
}

/** The round's result over the felt: the place, the three totals in place order with the player's row marked, the points
 *  it brought and where they stand now — up, down or on — then another round, or back to the League. */
function RoundResult({ state, result, again, onAgain, onLeave }: {
  state: TableState; result: LeagueResult; again: { busy: number | null; error: string | null }; onAgain: () => void; onLeave: () => void
}) {
  const me = state.mine.seat
  const mine = result.seats[me]
  const placeText = [m.league_place_1, m.league_place_2, m.league_place_3][mine.place]()
  const order = [0, 1, 2].sort((a, b) => result.seats[a].place - result.seats[b].place || a - b)
  const standing = mine.standing
  return (
    <Shell>
      <section data-testid="league-result" data-place={mine.place + 1} data-points={mine.points} data-moved={mine.moved} {...stylex.props(styles.card)}>
        <h1 {...stylex.props(typography.dialogTitle, styles.ink)}>{placeText}</h1>
        <ol {...stylex.props(styles.rows)}>
          {order.map((seat) => (
            <li key={seat} data-testid="league-result-row" data-place={result.seats[seat].place + 1} {...stylex.props(typography.appText, styles.boardRow, seat === me && styles.own)}>
              <span {...stylex.props(styles.slate, styles.rank)}>{result.seats[seat].place + 1}</span>
              <span {...stylex.props(styles.name)}>
                {seat === me ? m.name_you() : result.seats[seat].name}
              </span>
              <span {...stylex.props(typography.appBtnStrong, styles.number)}>{signed(result.seats[seat].total)}</span>
            </li>
          ))}
        </ol>
        {/* What the place brought, and where it leaves the player — up, down, or how far from moving up — in one line. */}
        {mine.points !== undefined && standing ? (
          <p data-testid="league-result-standing" {...stylex.props(typography.appText, styles.ink)}>
            <span {...stylex.props(typography.appBtnStrong)}>{m.league_points({ points: signed(mine.points) })}</span>
            {mine.moved === 1 ? ` · ${m.league_result_up({ league: leagueName(standing.tier) })}`
              : mine.moved === -1 ? ` · ${m.league_result_down({ league: leagueName(standing.tier) })}`
                : standing.tier < LEGEND ? ` · ${m.league_to_up({ n: PROMOTE_AT - standing.points })}` : null}
          </p>
        ) : null}
        <div {...stylex.props(styles.row)}>
          <Btn testId="league-again" size="lg" disabled={again.busy !== null} onClick={onAgain}>{again.busy !== null ? <Finding since={again.busy} /> : m.league_again({ fee: FEES[standing?.tier ?? result.tier] })}</Btn>
          <Btn testId="league-leave" tone="quiet" size="lg" onClick={onLeave}>{m.league_to_page()}</Btn>
        </div>
        {again.error ? <p role="alert" data-testid="league-again-error" {...stylex.props(typography.appText, styles.bad)}>{again.error}</p> : null}
      </section>
    </Shell>
  )
}

/** A line instead of the table — loading, or why not — with the way back to the League. */
function Notice({ text, alert = false, children }: { text: string; alert?: boolean; children?: ReactNode }) {
  return (
    <Shell>
      <p role={alert ? 'alert' : undefined} data-testid="table-notice" {...stylex.props(typography.appText, alert ? styles.bad : styles.ink)}>{text}</p>
      <div {...stylex.props(styles.row)}>
        {children}
        <Link to="/league" data-testid="league-to-page" {...linkLook('quiet', 'md')}>{m.league_to_page()}</Link>
      </div>
    </Shell>
  )
}

const styles = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  card: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: space.x12 },
  row: { display: 'flex', alignItems: 'center', gap: space.x10, flexWrap: 'wrap' },
  ink: { margin: 0, color: color.navy },
  slate: { margin: 0, color: color.slate },
  bad: { margin: 0, color: color.bad },
  help: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.info,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  rows: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  boardRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: space.x12,
    paddingBlock: space.x6,
    paddingInline: space.x8,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  own: { backgroundColor: color.goodSoft },
  rank: { minWidth: space.x24 },
  name: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tag: { marginInlineStart: space.x6 },
  number: { flexShrink: 0, textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  // The player's League as the front page's League tile is: its navy, its corners and shadow, white words.
  hero: {
    boxSizing: 'border-box',
    padding: { default: space.x24, [bp.phone]: space.x16 },
    borderRadius: radii.tile,
    backgroundColor: color.tileNavy,
    boxShadow: elev.tileNavy,
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: space.x10, minWidth: 0 },
  stats: { display: 'flex', flexWrap: 'wrap', gap: { default: space.x32, [bp.phone]: space.x24 } },
  stat: { display: 'flex', flexDirection: 'column', gap: space.x2 },
  statValue: { display: 'flex', alignItems: 'center', gap: space.x6 },
  onColor: { margin: 0, color: color.onColor },
  onColorSoft: { margin: 0, color: color.onColorSoft },
})
