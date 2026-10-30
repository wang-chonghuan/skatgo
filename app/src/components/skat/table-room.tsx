import * as stylex from '@stylexjs/stylex'
import { SignInButton } from '@clerk/tanstack-react-start'
import type { Room } from '@colyseus/sdk'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { track } from '~/lib/analytics'
import {
  PASSING, type RoomAction, type TableError, type TableState, enterRoom, findRoom, myRoom, openRoom, readState, sayBrought, sendAction,
} from '~/lib/room-client'
import { ROOM_CODE, ROOM_DIGITS } from '~/lib/room-code'
import type { Seat } from '~/lib/skat/game'
import { roomGame, roomSeat } from '~/lib/skat/room-view'
import { seegerFabian } from '~/lib/skat/tournament'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { elev, fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { GameTable } from './game-table'
import { Btn, Panel, Pill, TextField, linkLook } from './ui'

// A private room in the browser (SKATGO-61; rooms since SKATGO-163): the friends page's cards — a new room, a room
// to come into by its number, or the way back to one's own — and the room itself. The room lives in the multiplayer
// service (lib/room-client.ts); this file only draws what it publishes and sends this seat's moves. Every seat is an
// account's, so a signed-out visitor signs in first. A lost connection keeps trying to come back for two minutes
// before it says so.

/** How long a lost room keeps trying to come back, and the waits between tries (then every 10 s). */
const RETRY_FOR = 2 * 60 * 1000
const WAITS = [1000, 2000, 4000, 8000]

const errorText = (e: TableError) =>
  ({
    room_full: m.room_err_full,
    room_not_found: m.room_err_not_found,
    room_capacity: m.table_err_room_capacity,
    slow_down: m.table_err_slow_down,
    too_many_tries: m.room_err_too_many_tries,
    sign_in_required: m.room_sign_in,
    already_in_room: m.room_err_elsewhere,
    not_ready: m.table_err_not_ready,
    unreachable: m.table_err_unreachable,
  })[e]()

/** A room's number as it is read out: two groups of three. */
export const spaced = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`

/**
 * The friends page's cards (SKATGO-163, the human: 「私人桌进入后，两张卡片，新建房间，加入房间。如果已经在了一个房间，则显示回到
 * 房间」): a new room, played at once beside two computers, and a room to come into by its number — or, while the
 * account is in a room, only the way back to it. A signed-out visitor's tap opens Clerk's window first, and what
 * they tapped goes on once they are signed in.
 */
export function RoomCards() {
  const navigate = useNavigate()
  const account = useAccount()
  const [mine, setMine] = useState<string | null | undefined>(undefined)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'new' | 'join' | null>(null)
  const [error, setError] = useState<{ card: 'new' | 'join'; text: string } | null>(null)
  /** What a signed-out visitor tapped, to do once they are signed in. */
  const [wanted, setWanted] = useState<'new' | 'join' | null>(null)
  const codeId = useId()

  useEffect(() => {
    if (!account) return setMine(account === null ? null : undefined)
    let live = true
    void myRoom().then((r) => {
      if (live) setMine(r === null || ROOM_CODE.test(r) ? r : null)
    })
    return () => {
      live = false
    }
  }, [account])

  async function open() {
    setBusy('new')
    setError(null)
    const r = await openRoom()
    if (typeof r === 'string') {
      setBusy(null)
      return setError({ card: 'new', text: errorText(r) })
    }
    track('room_created')
    // The room's page takes the room over: this connection is let go, the seat stays the account's.
    const id = r.roomId
    await r.leave(true)
    void navigate({ to: '/table/$id', params: { id } })
  }

  async function join() {
    if (!ROOM_CODE.test(code)) return setError({ card: 'join', text: m.room_err_not_found() })
    setBusy('join')
    setError(null)
    const r = await findRoom(code)
    setBusy(null)
    if (r !== true) return setError({ card: 'join', text: errorText(r) })
    void navigate({ to: '/table/$id', params: { id: code } })
  }

  // Signed in after tapping a card: what was tapped goes on.
  useEffect(() => {
    if (!account || !wanted || mine === undefined) return
    const go = wanted
    setWanted(null)
    if (mine) return
    if (go === 'new') void open()
    else void join()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, wanted, mine])

  if (account === undefined || (account && mine === undefined)) return null
  if (mine) {
    return (
      <section data-testid="rooms-back" data-room={mine} {...stylex.props(styles.card)}>
        <h2 {...stylex.props(typography.optionTitle, styles.ink)}>{m.room_back_title({ code: spaced(mine) })}</h2>
        <div {...stylex.props(styles.row)}>
          <Link to="/table/$id" params={{ id: mine }} data-testid="rooms-back-go" {...linkLook('go', 'md')}>{m.room_back()}</Link>
        </div>
      </section>
    )
  }
  /** A card's button: for a signed-out visitor, Clerk's window first. */
  const button = (card: 'new' | 'join', tone: 'go' | 'quiet', label: string, run: () => void) => {
    const disabled = busy !== null || (card === 'join' && account !== null && code.length !== ROOM_DIGITS)
    if (account) return <Btn testId={`rooms-${card}-go`} tone={tone} disabled={disabled} onClick={run}>{label}</Btn>
    return (
      <SignInButton mode="modal">
        <Btn testId={`rooms-${card}-go`} tone={tone} onClick={() => {
          setWanted(card)
          track('sign_in_clicked', { at: 'table_open' })
        }}>{label}</Btn>
      </SignInButton>
    )
  }
  return (
    <div {...stylex.props(styles.cards)}>
      <section data-testid="rooms-new" {...stylex.props(styles.card)}>
        <h2 {...stylex.props(typography.optionTitle, styles.ink)}>{m.room_new_title()}</h2>
        <p {...stylex.props(typography.optionDesc, styles.slate)}>{m.room_new_text()}</p>
        <div {...stylex.props(styles.row)}>{button('new', 'go', m.room_new(), () => void open())}</div>
        {error?.card === 'new' ? <p role="alert" data-testid="rooms-new-error" {...stylex.props(typography.appText, styles.bad)}>{error.text}</p> : null}
      </section>
      <section data-testid="rooms-join" {...stylex.props(styles.card)}>
        <h2 {...stylex.props(typography.optionTitle, styles.ink)}>{m.room_join_title()}</h2>
        <label htmlFor={codeId} {...stylex.props(typography.optionDesc, styles.slate)}>{m.room_join_text()}</label>
        <div {...stylex.props(styles.row)}>
          <TextField id={codeId} testId="rooms-join-code" digits={ROOM_DIGITS} autoComplete="off" value={code} invalid={error?.card === 'join'}
            onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, ROOM_DIGITS))} onEnter={() => account && void join()} />
          {button('join', 'quiet', m.room_join(), () => void join())}
        </div>
        {error?.card === 'join' ? <p role="alert" data-testid="rooms-join-error" {...stylex.props(typography.appText, styles.bad)}>{error.text}</p> : null}
      </section>
    </div>
  )
}

/** Why a room let this page go (SKATGO-163). */
type Gone = 'kicked' | 'left' | 'elsewhere' | 'closed'
/** `again`: the room kept trying to come back and gave up; the person may try once more. */
type Stage =
  | { kind: 'connecting' }
  | { kind: 'signIn' }
  | { kind: 'error'; error: TableError; again?: boolean }
  | { kind: 'gone'; why: Gone }
  | { kind: 'seated' }

/** A private room by its number: the account's own seat, or a new one — a signed-out visitor signs in first. */
export function PrivateTable() {
  const { id } = useParams({ from: '/table/$id' })
  const navigate = useNavigate()
  const account = useAccount()
  const [stage, setStage] = useState<Stage>({ kind: 'connecting' })
  const [shown, setShown] = useState<TableState | null>(null)
  const [queue, setQueue] = useState<TableState[]>([])
  /** The player has tapped the finished trick away (SKATGO-72) — perhaps before its state arrived, the
   *  player's own card being shown at once (SKATGO-73). Until then the states after it wait, on this
   *  screen only. */
  const [release, setRelease] = useState(false)
  const [sending, setSending] = useState(false)
  /** The connection dropped and the SDK is getting it back: the table stays, with a line over it. */
  const [dropped, setDropped] = useState(false)
  /** The room the account is in instead, when this one could not be entered for it. */
  const [elsewhere, setElsewhere] = useState<string | null>(null)
  const latest = useRef<TableState | null>(null)
  const room = useRef<Room | null>(null)
  const leaving = useRef(false)
  /** The way back's tries so far, while it keeps trying. */
  const back = useRef<{ since: number; tries: number; timer?: ReturnType<typeof setTimeout> } | null>(null)
  const trying = useRef(false)
  const told = useRef(false)

  function attach(r: Room) {
    room.current = r
    // Nothing sent before is still on its way: a receipt for it will never come on this connection.
    setSending(false)
    setDropped(false)
    setStage({ kind: 'seated' })
    r.onStateChange(() => {
      const next = readState(r)
      if (!next) return
      latest.current = next
      setQueue((q) => [...q, next])
    })
    r.onMessage('receipt', () => setSending(false))
    // Taken out by the host, left, opened on another device, or the room closed: this page lets the room go.
    r.onMessage('dismissed', (d: { why?: Gone }) => {
      leaving.current = true
      if (d?.why === 'left') return void navigate({ to: '/with-friends' })
      setStage({ kind: 'gone', why: d?.why ?? 'closed' })
    })
    // A lost connection: the SDK's own reconnection first, with the table kept on screen; when that gives up, the
    // account comes back to its seat by the room's number (a computer has kept it warm meanwhile), trying again until
    // the service is back.
    r.onDrop(() => setDropped(true))
    r.onReconnect(() => {
      setDropped(false)
      setSending(false)
    })
    r.onLeave(() => {
      room.current = null
      setSending(false)
      setDropped(false)
      if (leaving.current) return
      setStage({ kind: 'connecting' })
      later()
    })
  }

  /** The next try at coming back, later each time; after RETRY_FOR the person is told and may try again. */
  function later(error: TableError = 'unreachable') {
    const b = back.current ?? (back.current = { since: Date.now(), tries: 0 })
    if (Date.now() - b.since >= RETRY_FOR) {
      back.current = null
      return setStage({ kind: 'error', error, again: true })
    }
    clearTimeout(b.timer)
    b.timer = setTimeout(() => void comeIn(), WAITS[b.tries] ?? 10_000)
    b.tries++
  }

  /** Whether the browser is still at this room's address: on the way to another page the router may draw this one once
   *  more, and it must not take a seat again on its way out (after leaving, it would put the person straight back). */
  const here = () => window.location.pathname.endsWith(`/${id}`)

  async function comeIn() {
    if (trying.current || !here()) return
    trying.current = true
    leaving.current = false
    clearTimeout(back.current?.timer)
    const r = await enterRoom(id)
    trying.current = false
    if (leaving.current) {
      if (typeof r !== 'string') void r.leave(true)
      return
    }
    if (typeof r !== 'string') {
      back.current = null
      return attach(r)
    }
    if (PASSING.has(r)) return later(r)
    back.current = null
    if (r === 'already_in_room') {
      const other = await myRoom()
      setElsewhere(typeof other === 'string' && ROOM_CODE.test(other) ? other : null)
    }
    setStage({ kind: 'error', error: r })
  }

  useEffect(() => {
    if (account === undefined) return
    if (account === null) return setStage({ kind: 'signIn' })
    if (!ROOM_CODE.test(id)) return setStage({ kind: 'error', error: 'room_not_found' })
    setStage({ kind: 'connecting' })
    void comeIn()
    // A phone back in front, or the network back: the next try is now rather than after its wait.
    const now = () => {
      if (back.current && document.visibilityState === 'visible') void comeIn()
    }
    document.addEventListener('visibilitychange', now)
    window.addEventListener('online', now)
    return () => {
      leaving.current = true
      clearTimeout(back.current?.timer)
      document.removeEventListener('visibilitychange', now)
      window.removeEventListener('online', now)
      void room.current?.leave(true)
    }
    // Once, for this room and account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, account])

  // A newcomer who signed up to come in here: whose room it was is recorded (SKATGO-117); whether the account is
  // new enough to count, and not the host, is the service's to decide.
  useEffect(() => {
    if (told.current || stage.kind !== 'seated' || !shown) return
    told.current = true
    if (!shown.pub.seats[shown.mine.seat].host) sayBrought(id)
  }, [stage.kind, shown, id])

  // States arrive as they happen; a finished trick stays on this screen until it is tapped away.
  useEffect(() => {
    if (queue.length === 0) return
    const held = shown?.pub.phase === 'trickEnd'
    if (held && !release) return
    if (held) setRelease(false)
    setShown(queue[0])
    setQueue((q) => q.slice(1))
  }, [queue, shown, release])

  const send = (action: RoomAction) => {
    const r = room.current
    const at = latest.current
    if (!r || !at || sending) return
    setSending(true)
    sendAction(r, at.pub.revision, action)
  }

  if (stage.kind === 'signIn') {
    return (
      <Shell>
        <p data-testid="table-sign-in" {...stylex.props(typography.landingBody, styles.ink)}>{m.room_sign_in_to({ code: spaced(id) })}</p>
        <div {...stylex.props(styles.row)}>
          <SignInButton mode="modal">
            <Btn testId="table-sign-in-go" onClick={() => track('sign_in_clicked', { at: 'table_open' })}>{m.room_sign_in_go()}</Btn>
          </SignInButton>
        </div>
      </Shell>
    )
  }
  if (stage.kind === 'gone') {
    const text = { kicked: m.room_gone_kicked, left: m.room_gone_closed, elsewhere: m.room_gone_elsewhere, closed: m.room_gone_closed }[stage.why]()
    return (
      <Notice
        text={text}
        onAgain={stage.why === 'kicked' || stage.why === 'elsewhere' ? () => {
          setStage({ kind: 'connecting' })
          void comeIn()
        } : undefined}
        again={stage.why === 'kicked' ? m.room_come_back() : undefined}
      />
    )
  }
  if (stage.kind === 'error') {
    return (
      <Notice
        text={errorText(stage.error)}
        back={elsewhere}
        onAgain={stage.again ? () => {
          setStage({ kind: 'connecting' })
          void comeIn()
        } : undefined}
      />
    )
  }
  if (!shown) return <Notice text={m.loading()} quiet />
  // While the connection comes back — the SDK's own reconnection, or the tries after it — the table stays on screen
  // under one line, and takes no moves. A newcomer is told when they start.
  const away = dropped || stage.kind !== 'seated'
  const waiting = shown.pub.seats[shown.mine.seat].joining
  const notice = away
    ? <span data-testid="table-reconnecting"><Pill tone="dark">{m.table_reconnecting()}</Pill></span>
    : waiting ? <span data-testid="table-joining"><Pill tone="dark">{m.room_joining()}</Pill></span> : null
  return (
    <Playing
      state={shown}
      busy={sending || away || queue.length > 0}
      send={send}
      collect={() => setRelease(true)}
      notice={notice}
    />
  )
}

/** A seat's name as the viewer reads it: a person's nickname (the viewer is "you"), Lina or Noah for a computer's
 *  seat — the first computer in seat order Lina, the other Noah — marked when a computer plays it, for good or for
 *  someone away. */
function seatNames(state: TableState): [string, string, string] {
  const me = state.mine.seat
  const computers = state.pub.seats.filter((s) => s.kind === 'ai').map((s) => s.seat)
  return [0, 1, 2].map((view) => {
    const s = state.pub.seats[roomSeat(view, me)]
    const name = view === 0 ? m.name_you() : s.nickname ?? (computers.indexOf(s.seat) === 0 ? m.name_lina() : m.name_max())
    // A person waiting for their first game is named as themselves, though a computer finishes this one for them.
    return s.control === 'ai' && !s.joining ? m.table_computer({ name }) : name
  }) as [string, string, string]
}

function Playing({ state, busy, send, collect, notice }: { state: TableState; busy: boolean; send: (a: RoomAction) => void; collect: () => void; notice: ReactNode }) {
  const game = useMemo(() => roomGame(state.pub, state.mine), [state])
  const names = seatNames(state)
  const me = state.mine.seat
  const totals = [0, 1, 2].map((v) => state.pub.scores[roomSeat(v, me)]) as [number, number, number]
  if (!game) return null
  const list = (scores: number[]) => names.map((name, v) => `${name} ${scores[v] > 0 ? '+' : ''}${scores[v]}`).join(' · ')
  const ended = game.phase === 'done' || game.phase === 'passedIn'
  const standings = ended ? (
    <div data-testid="table-standings" data-totals={totals.join(',')} data-deal-scores={seegerFabian(game).join(',')} {...stylex.props(styles.standings)}>
      <p {...stylex.props(typography.note, styles.ink)}>{m.table_deal_scores({ list: list(seegerFabian(game)) })}</p>
      <p {...stylex.props(typography.note, styles.ink)}>{m.table_totals({ list: list(totals) })}</p>
    </div>
  ) : null
  // The host may take out any other person; the names as this viewer reads them, without the computer's mark.
  const host = state.pub.seats[me].host
  const people = host
    ? state.pub.seats.filter((s) => s.kind === 'human' && s.seat !== me).map((s) => ({ seat: s.seat, name: s.nickname ?? '' }))
    : []
  return (
    <div data-testid="table-room" data-room={state.pub.roomId} data-seat={me} data-revision={state.pub.revision} data-deals={state.pub.deals} data-dealer={state.pub.dealer} data-phase={state.pub.phase} data-controls={state.pub.seats.map((x) => x.control).join(',')} data-host={String(host)} {...stylex.props(styles.play)}>
      <GameTable
        fullScreen
        room={{
          game, busy, send: (move) => send(move), collect, next: () => send({ type: 'next' }), names, totals, standings, notice,
          code: state.pub.roomId, leave: () => send({ type: 'leave' }), people, kick: (seat: Seat) => send({ type: 'kick', seat }),
        }}
      />
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.column)}>
        <Panel>
          <div {...stylex.props(styles.form)}>{children}</div>
        </Panel>
      </div>
    </div>
  )
}

/** A line instead of the table: loading or coming back (`quiet`), or why not — with the way to the friends page,
 *  to the account's own room (`back`), and, when coming back gave up or the person was taken out, one more try. */
function Notice({ text, quiet = false, onAgain, again, back }: { text: string; quiet?: boolean; onAgain?: () => void; again?: string; back?: string | null }) {
  const navigate = useNavigate()
  return (
    <Shell>
      <p role={quiet ? undefined : 'alert'} data-testid="table-notice" {...stylex.props(typography.appText, quiet ? styles.ink : styles.bad)}>{text}</p>
      {quiet ? null : (
        <div {...stylex.props(styles.row)}>
          {onAgain ? <Btn testId="table-again" onClick={onAgain}>{again ?? m.table_again()}</Btn> : null}
          {back ? <Link to="/table/$id" params={{ id: back }} data-testid="table-own-room" {...linkLook('go', 'md')}>{m.room_back_title({ code: spaced(back) })}</Link> : null}
          <Btn testId="table-new" tone="quiet" onClick={() => void navigate({ to: '/with-friends' })}>{m.room_to_friends()}</Btn>
        </div>
      )}
    </Shell>
  )
}

const styles = stylex.create({
  page: { minHeight: dims.screenDynamic, backgroundImage: fill.felt, boxSizing: 'border-box', paddingBlock: { default: space.x32, [bp.phone]: space.x16 } },
  column: { width: '100%', maxWidth: dims.readingColumn, marginInline: 'auto', boxSizing: 'border-box', paddingInline: { default: space.x24, [bp.phone]: space.x12 } },
  form: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  row: { display: 'flex', alignItems: 'center', gap: space.x10, flexWrap: 'wrap' },
  ink: { margin: 0, color: color.navy },
  slate: { margin: 0, color: color.slate },
  bad: { margin: 0, color: color.bad },
  // The friends page's cards: option cards, one under the other (ui.md "Option card").
  cards: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    padding: { default: space.x24, [bp.phone]: space.x16 },
    borderRadius: radii.option,
    backgroundColor: color.surface,
    boxShadow: elev.option,
  },
  standings: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
})
