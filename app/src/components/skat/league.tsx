import * as stylex from '@stylexjs/stylex'
import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronDown, ChevronUp, Coins, Trophy } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { checkInOnce } from '~/lib/checkin'
import { type LeagueError, type LeagueState, PASSING_LEAGUE, enterLeague, leagueReview, leagueState, playLeague } from '~/lib/league-api'
import { BRONZE_FLOOR, CHECKIN_COINS, FEES, LEGEND, MATCH_WAIT_MS, PROMOTE_AT, RELEGATE_AT, TIERS, type BoardRow, type LeagueBoard, type LeagueResult } from '~/lib/skat/league'
import { roomGame, roomSeat } from '~/lib/skat/room-view'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale, localizeHref } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who, signed } from './daily-comparison'
import { GameTable } from './game-table'
import { Tiers, leagueName, tierName } from './league-tiers'
import { Shell, seatNames, useSeat } from './table-room'
import { Btn, Panel, Pill, ProgressBar, linkLook } from './ui'
import type { TableState } from '~/lib/room-client'
import type { LeagueMe } from '~/lib/skat/league'

// The League in the browser (SKATGO-204): the League page's own part — the player's tier, points and coins with the one
// way to play, the tiers, the League's board — and the League table. A seat is asked for on the League page, which waits
// there while players are found (up to five seconds), then goes to the table; the table only ever comes back to the
// account's own table, so a reload never starts another one.

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

/** The League page's own part: for an account its card, the tiers with its own marked and the League's board; for a guest
 *  the tiers, the board and the way to sign in. */
export function LeagueHome() {
  const account = useAccount()
  const navigate = useNavigate()
  const [state, setState] = useState<LeagueState | null>(null)
  /** When the wait for a table began; null while not waiting. */
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    fromLeague = true
    void navigate({ to: '/league/play' })
  }

  const me = state?.me ?? null
  const fee = me ? FEES[me.tier] : 0
  return (
    <div {...stylex.props(styles.stack)}>
      <About />
      {account === null ? (
        <Panel>
          <section data-testid="league-guest" {...stylex.props(styles.card)}>
            <p {...stylex.props(typography.appText, styles.ink)}>{m.league_guest()}</p>
            <div {...stylex.props(styles.row)}>
              <SignInButton mode="modal">
                <Btn testId="league-sign-in" size="lg">{m.auth_sign_in()}</Btn>
              </SignInButton>
            </div>
            <p data-testid="league-opponents" {...stylex.props(typography.appText, styles.slate)}>{m.league_opponents()}</p>
          </section>
        </Panel>
      ) : me ? (
        <MeCard me={me} fee={fee} busy={busy} error={error} onPlay={() => void play()} />
      ) : null}
      <Tiers mine={me ? me.tier : null} />
      {/* The League's board once anyone has played. */}
      {state?.board.rows.length ? <Board board={state.board} /> : null}
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
function MeCard({ me, fee, busy, error, onPlay }: { me: LeagueMe; fee: number; busy: number | null; error: string | null; onPlay: () => void }) {
  // From the tier's floor — the relegation line, in Bronze 0 (SKATGO-207) — to the promotion line; Legend has no promotion,
  // so no bar.
  const floor = me.tier === 0 ? BRONZE_FLOOR : RELEGATE_AT
  const progress = me.tier < LEGEND ? (me.points - floor) / (PROMOTE_AT - floor) : null
  // How far to move up and down, where there is a move: none up from Legend, none down from Bronze.
  const moves = [
    me.tier < LEGEND ? m.league_to_up({ n: PROMOTE_AT - me.points }) : null,
    me.tier > 0 ? m.league_to_down({ n: me.points - RELEGATE_AT }) : null,
  ].filter(Boolean).join(' · ')
  return (
    <div {...stylex.props(styles.hero)}>
      <section data-testid="league-me" data-tier={me.tier} data-points={me.points} data-coins={me.coins} data-today={String(me.today)} {...stylex.props(styles.card)}>
        <span {...stylex.props(styles.titleRow)}>
          <Trophy aria-hidden="true" size={icon.tile} strokeWidth={icon.outline} {...stylex.props(styles.onColor)} />
          <h2 {...stylex.props(typography.homeTileTitle, styles.onColor)}>{leagueName(me.tier)}</h2>
        </span>
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
            <Link to="/league/play" data-testid="league-back" onClick={() => { fromLeague = true }} {...linkLook('go', 'lg')}>{m.league_back()}</Link>
          ) : (
            // While players are found, the button says so (up to five seconds).
            <Btn testId="league-play" size="lg" disabled={busy !== null || me.coins < fee} onClick={onPlay}>{busy !== null ? <Finding since={busy} /> : m.league_play({ fee })}</Btn>
          )}
        </div>
        <p data-testid="league-opponents" {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_opponents()}</p>
        {busy === null && !me.table && me.coins < fee ? <p data-testid="league-poor" {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_poor()}</p> : null}
        {error ? <p role="alert" data-testid="league-error" {...stylex.props(typography.appText, styles.onColor)}>{error}</p> : null}
      </section>
    </div>
  )
}

/** What the League is and how it works (the human: 「改成一个折叠卡片，默认折叠，标题是，什么是League以及它为什么好玩……必须
 *  精简，要考虑到大部分玩家没耐心。可以用bullets」, then 「用蓝色链接字就行，不用单独做大卡片」 and 「放到页面标题的下面得了，别放那个
 *  卡片里了」): a blue link line under the page's title, closed until tapped, its chevron after it, then four short lines —
 *  the tiers, each deal's points, up and down, the coins. */
function About() {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <details data-testid="league-about" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary data-testid="league-about-head" {...stylex.props(typography.appLink, styles.aboutLink)}>
        <span {...stylex.props(styles.aboutText)}>{m.league_about()}</span>
        <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} {...stylex.props(styles.chevron)} />
      </summary>
      <ul data-testid="league-about-text" {...stylex.props(styles.bullets)}>
        {[m.league_about_tiers(), m.league_about_deal(), m.league_about_move(), m.league_about_coins()].map((t) => (
          <li key={t} {...stylex.props(typography.appText, styles.ink)}>{t}</li>
        ))}
      </ul>
    </details>
  )
}

/** The League's board (SKATGO-206, the human: 「这个榜单就放在liga页面下方，每个人名旁边都要有一个联赛的logo，最右边是分数。最左边是
 *  总排名」): everyone who played a deal, by tier, then points; the player's own row marked, and after a "…" when it is
 *  further down than the board shows. */
function Board({ board }: { board: LeagueBoard }) {
  return (
    <Panel>
      <section data-testid="league-board" aria-labelledby="league-board-title" {...stylex.props(styles.card)}>
        <h2 id="league-board-title" {...stylex.props(typography.optionTitle, styles.ink)}>{m.league_board()}</h2>
        <ol {...stylex.props(styles.rows)}>
          {board.rows.map((r, i) => <BoardLine key={i} row={r} />)}
          {board.me ? (
            <>
              <li aria-hidden="true" data-testid="league-board-gap" {...stylex.props(typography.appText, styles.slate, styles.gap)}>…</li>
              <BoardLine row={board.me} />
            </>
          ) : null}
        </ol>
      </section>
    </Panel>
  )
}

/** A row of the board: the rank, the tier's badge (its picture's emblem) by the name, the points at the right. */
function BoardLine({ row: r }: { row: BoardRow }) {
  return (
    <li data-testid="league-board-row" data-rank={r.rank} data-tier={TIERS[r.tier]} data-points={r.points} data-you={r.you ? 'true' : undefined} {...stylex.props(typography.appText, styles.boardRow, r.you && styles.own)}>
      <span {...stylex.props(styles.slate, styles.rank)}>{r.rank}</span>
      <img data-testid="league-board-badge" src={`/league/badge/${TIERS[r.tier]}.webp`} alt={tierName(r.tier)} loading="lazy" {...stylex.props(styles.badge)} />
      <span {...stylex.props(styles.name)}>
        {r.nickname}
        {r.you ? <span {...stylex.props(styles.tag)}><Who side="you" /></span> : null}
      </span>
      <span {...stylex.props(typography.appBtnStrong, styles.number)}>{signed(r.points)}</span>
    </li>
  )
}

/** The table was opened from the League page in this visit, so the entry before it in the browser's history is that page. */
let fromLeague = false

/** The League page's address in this page's language, to tell whether the browser is still on the table. */
const tablePath = () => localizeHref('/league/play', { locale: getLocale() })

/**
 * A League sitting's table (SKATGO-204, a deal at a time since SKATGO-205): the account's own seat, kept and come back to as
 * a private table's is; deal after deal, each with its League points first in its result, then its XP and the AI's game as
 * free play's. Leaving is the menu's: the deal on the table is played out for the seat and counts, and no other is dealt to
 * it. A player who moved to another tier or cannot pay the next deal goes back to the League from the result.
 */
export function LeagueTable() {
  const account = useAccount()
  const navigate = useNavigate()
  const router = useRouter()
  // Back to the League page without the table staying in the browser's history (SKATGO-209, the human: 「点返回按钮，跳到 this
  // table has closed. 页面……特别影响体验」): the way back when the table was opened from it, else in the table's place.
  const went = useRef(false)
  const toLeague = () => {
    // Once: leaving is followed by the room's own word that the seat was let go.
    if (went.current) return
    went.current = true
    if (fromLeague) router.history.back()
    else void navigate({ to: '/league', replace: true })
    fromLeague = false
  }
  useEffect(() => () => { fromLeague = false }, [])
  const seat = useSeat<LeagueError>({
    enter: enterLeague,
    passing: PASSING_LEAGUE,
    here: () => window.location.pathname === tablePath(),
    active: !!account,
    // Let go of the table — having left, the sitting over, or the seat opened on another device: back to the League page.
    dismissed: () => {
      toLeague()
      return true
    },
  })
  const { stage, shown } = seat
  useEffect(() => {
    if (account === null) seat.setStage({ kind: 'signIn' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])
  // No table to come to — it closed, or the browser came to its address again after leaving it: the League page, with no
  // "table closed" page.
  const none = stage.kind === 'gone' || (stage.kind === 'error' && stage.error === 'no_table')
  useEffect(() => {
    if (none) toLeague()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [none])
  const leave = () => {
    seat.send({ type: 'leave' })
    toLeague()
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
  if (none) return <Notice text={m.loading()} />
  if (stage.kind === 'error') {
    const text = errorText(stage.error)
    return (
      <Notice text={text} alert>
        {stage.again ? <Btn testId="table-again" onClick={seat.again}>{m.table_again()}</Btn> : null}
      </Notice>
    )
  }
  if (!shown || !shown.pub.league) return <Notice text={m.loading()} />
  const notice = seat.away ? <span data-testid="table-reconnecting"><Pill tone="dark">{m.table_reconnecting()}</Pill></span> : null
  return <LeaguePlaying state={shown} busy={seat.busy} send={seat.send} collect={seat.collect} notice={notice} leave={leave} />
}

function LeaguePlaying({ state, busy, send, collect, notice, leave }: {
  state: TableState; busy: boolean; send: ReturnType<typeof useSeat>['send']; collect: () => void; notice: ReactNode; leave: () => void
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
  // This deal's own result, once it is scored: the last result is this deal's.
  const mine = ended && league.last && league.last.deal === deal - 1 ? league.last.seats[me] : null
  const sitsOn = !mine || mine.canPay
  return (
    <div data-testid="league-table" data-room={state.pub.roomId} data-match={league.match} data-seat={me} data-deals={deal} data-dealer={state.pub.dealer} data-phase={state.pub.phase} data-controls={state.pub.seats.map((x) => x.control).join(',')} data-kinds={state.pub.seats.map((x) => x.kind).join(',')} {...stylex.props(styles.play)}>
      <GameTable
        fullScreen
        room={{
          game, busy, send: (move) => send(move), collect, next: () => send({ type: 'next' }), names: seatNames(state), totals, notice, deal,
          stats: null, waiting, code: state.pub.roomId, leave, people: [], kick: () => {},
          league: {
            review,
            line: mine ? <DealLine result={mine} declared={state.pub.declarer === me} /> : undefined,
            done: sitsOn ? undefined : <Btn testId="league-to-league" shape="block" size="lg" grow onClick={leave}>{m.league_to_page()}</Btn>,
          },
        }}
      />
    </div>
  )
}

/** A deal's League points (SKATGO-205), the result's first line: the points as a pill, as the XP's under it — green won,
 *  red lost — and why beside it: the player's own game won or lost, the declarer beaten or not, all passed; when it moved
 *  them, the new League; when they cannot pay the next deal here, that (the human: 「让玩家觉得打一个deal就有一个获得感」). */
function DealLine({ result, declared }: { result: NonNullable<LeagueResult['seats'][number]>; declared: boolean }) {
  const why = {
    won: declared ? m.league_deal_won() : m.league_deal_beat(),
    lost: m.league_deal_lost(),
    defended: m.league_deal_defended(),
    passed: m.league_deal_passed(),
    // Left during it, or away a minute (SKATGO-206): the deal lost.
    leftDeclaring: m.league_deal_left(),
    left: m.league_deal_left(),
  }[result.outcome]
  const then = result.moved === 1 ? m.league_result_up({ league: leagueName(result.standing.tier) })
    : result.moved === -1 ? m.league_result_down({ league: leagueName(result.standing.tier) })
      : !result.canPay ? m.league_poor() : null
  return (
    <div data-testid="league-deal-line" data-points={result.points} data-outcome={result.outcome} data-moved={result.moved} {...stylex.props(styles.dealLine)}>
      <span {...stylex.props(typography.appBtnStrong, styles.dealPill, result.points > 0 ? styles.dealPlus : result.points < 0 ? styles.dealMinus : styles.dealNone)}>
        {m.league_points({ points: signed(result.points) })}
      </span>
      <span {...stylex.props(typography.appText, styles.dealWhy)}>{then ? `${why} · ${then}` : why}</span>
    </div>
  )
}

/** A line instead of the table — loading, or why not — with the way back to the League. */
function Notice({ text, alert = false, children }: { text: string; alert?: boolean; children?: ReactNode }) {
  return (
    <Shell>
      <p role={alert ? 'alert' : undefined} data-testid="table-notice" {...stylex.props(typography.appText, alert ? styles.bad : styles.ink)}>{text}</p>
      <div {...stylex.props(styles.row)}>
        {children}
        <Link to="/league" replace data-testid="league-to-page" {...linkLook('quiet', 'md')}>{m.league_to_page()}</Link>
      </div>
    </Shell>
  )
}

const styles = stylex.create({
  // The deal's League points as the XP line under it is laid out (xp-earned.tsx): the pill at the left, why beside it.
  dealLine: { display: 'flex', alignItems: 'center', gap: space.x10 },
  dealPill: { flexShrink: 0, paddingBlock: space.x2, paddingInline: space.x10, borderRadius: radii.pill, whiteSpace: 'nowrap' },
  dealPlus: { color: color.go, backgroundColor: color.goodSoft },
  dealMinus: { color: color.bad, backgroundColor: color.badSoft },
  dealNone: { color: color.slate, backgroundColor: color.page },
  dealWhy: { flexGrow: 1, minWidth: 0, color: color.navy },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  card: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  row: { display: 'flex', alignItems: 'center', gap: space.x10, flexWrap: 'wrap' },
  ink: { margin: 0, color: color.navy },
  slate: { margin: 0, color: color.slate },
  bad: { margin: 0, color: color.bad },
  // The About link (a details' summary): its words underlined, the chevron after them, no marker.
  aboutLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x4,
    cursor: 'pointer',
    listStyleType: 'none',
    '::-webkit-details-marker': { display: 'none' },
    color: color.info,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  aboutText: { textDecoration: 'underline' },
  chevron: { flexShrink: 0 },
  // The space above the bullets is theirs, so the closed card is only its title line.
  bullets: { display: 'flex', flexDirection: 'column', gap: space.x6, marginBlock: 0, marginTop: space.x12, paddingInlineStart: space.x20, listStyleType: 'disc' },
  rows: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  boardRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x12,
    paddingBlock: space.x6,
    paddingInline: space.x8,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  own: { backgroundColor: color.goodSoft },
  // Wide enough for three figures, so the badges and names stay in one column past the hundredth.
  rank: { flexShrink: 0, minWidth: space.x32, fontVariantNumeric: 'tabular-nums' },
  // The tier's badge, square, its corners a tag's.
  badge: { display: 'block', flexShrink: 0, width: dims.badge, height: dims.badge, borderRadius: radii.tag },
  // The "…" before the player's own row when it is further down than the board.
  gap: { paddingBlock: space.x6, paddingInline: space.x8 },
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
