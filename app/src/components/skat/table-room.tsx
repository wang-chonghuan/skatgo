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
import { BOT_DELAY, GameTable, useRoomLink } from './game-table'
import { Btn, Panel, Pill, TextField, linkLook } from './ui'

// A private room in the browser (SKATGO-61; rooms since SKATGO-163): the friends page's cards — a new room, a room
// to come into by its number, or the way back to one's own — and the room itself: waiting for its players, then the
// table. The room lives in the multiplayer
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
 * 房间」): a new room, and a room to come into by its number — or, while the
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
  /** The revision this seat's move made, until the state carrying it arrives (SKATGO-164). */
  const awaiting = useRef<number | null>(null)
  /** When the last change to the game was put on the table, for the next one's beat. */
  const lastMove = useRef(0)

  function attach(r: Room) {
    room.current = r
    // Nothing sent before is still on its way: a receipt for it will never come on this connection.
    awaiting.current = null
    setSending(false)
    setDropped(false)
    setStage({ kind: 'seated' })
    r.onStateChange(() => {
      const next = readState(r)
      if (!next) return
      latest.current = next
      setQueue((q) => [...q, next])
      if (awaiting.current !== null && next.pub.revision >= awaiting.current) {
        awaiting.current = null
        setSending(false)
      }
    })
    // A move taken stays on its way until the state it made is here (SKATGO-164): the receipt comes first, and a table
    // no longer busy on the state before would put the card just played back in the hand for that moment.
    r.onMessage('receipt', (receipt: { ok?: boolean; revision?: number }) => {
      if (receipt?.ok && typeof receipt.revision === 'number' && receipt.revision > (latest.current?.pub.revision ?? 0)) {
        awaiting.current = receipt.revision
      } else setSending(false)
    })
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
      awaiting.current = null
      setSending(false)
    })
    r.onLeave(() => {
      room.current = null
      awaiting.current = null
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

  // States arrive as they happen, and go on the table as free play shows its steps (SKATGO-164, the human: 「我希望体验和free
  // play一样，有顺序，有节奏，的出牌」): a change to the game a beat (BOT_DELAY) after the one before, and the answer to this
  // seat's own move at once, its card being on the table already. A state that changes nothing in the game — someone's
  // connection, a seat — goes on at once, or, with a later state behind it, which carries it too, not at all; while a
  // move is on its way it waits. A finished trick stays on this screen until it is tapped away.
  useEffect(() => {
    if (queue.length === 0) return
    const held = shown?.pub.phase === 'trickEnd'
    if (held && !release) return
    const next = queue[0]
    const moved = !shown || next.pub.played !== shown.pub.played
    if (!moved && queue.length > 1) return setQueue((q) => q.slice(1))
    if (!moved && sending) return
    const own = !!shown && shown.pub.actor === shown.mine.seat
    const wait = held || !moved || own ? 0 : Math.max(0, lastMove.current + BOT_DELAY - Date.now())
    const t = setTimeout(() => {
      if (held) setRelease(false)
      if (moved) lastMove.current = Date.now()
      setShown(next)
      setQueue((q) => q.slice(1))
    }, wait)
    return () => clearTimeout(t)
  }, [queue, shown, release, sending])

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
  if (shown.pub.deals === 0) return <Waiting state={shown} busy={sending || dropped || stage.kind !== 'seated'} send={send} />
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

/** A room seat's own name: a person's nickname (the viewer is "you"), Lina or Noah for a computer's seat — the first
 *  computer in seat order Lina, the other Noah. */
function seatName(state: TableState, seat: number): string {
  const s = state.pub.seats[seat]
  const computers = state.pub.seats.filter((x) => x.kind === 'ai').map((x) => x.seat)
  return seat === state.mine.seat ? m.name_you() : s.nickname ?? (computers.indexOf(seat) === 0 ? m.name_lina() : m.name_max())
}

/**
 * A room before its first deal (SKATGO-163, the human: 「房间建好后，房主点进去，应该有个等待的页面，显示口令，复制按钮，然后等待拿到
 * 口令的人加入（或者设置为AI），点开始游戏」): its number with its link to copy, and the three seats — a person, the AI, or
 * waiting for someone with the number. The host gives a waiting seat to the AI or takes it back, may take a person out,
 * and starts once every seat is taken; the others wait for them. Anyone may leave.
 */
function Waiting({ state, busy, send }: { state: TableState; busy: boolean; send: (a: RoomAction) => void }) {
  const code = state.pub.roomId
  const me = state.mine.seat
  const seats = state.pub.seats
  const host = seats[me].host
  const ready = seats.every((s) => s.kind !== 'empty')
  const [copied, copy] = useRoomLink(code)
  /** The host's way with a seat: an empty one to the AI, the AI's back, a person out. */
  const action = (seat: number) => {
    const s = seats[seat]
    if (!host || seat === me) return null
    if (s.kind === 'empty') return <Btn testId="room-seat-ai" tone="quiet" size="sm" disabled={busy} onClick={() => send({ type: 'computer', seat, on: true })}>{m.room_seat_ai()}</Btn>
    if (s.kind === 'ai') return <Btn testId="room-seat-free" tone="quiet" size="sm" disabled={busy} onClick={() => send({ type: 'computer', seat, on: false })}>{m.room_seat_free()}</Btn>
    return <Btn testId="room-seat-kick" tone="quiet" size="sm" disabled={busy} onClick={() => send({ type: 'kick', seat })}>{m.room_kick_yes()}</Btn>
  }
  return (
    <Shell>
      <div data-testid="room-waiting" data-room={code} data-seat={me} data-host={String(host)} data-seats={seats.map((s) => s.kind).join(',')} {...stylex.props(styles.form)}>
        <h1 {...stylex.props(typography.optionTitle, styles.ink)}>{m.room_waiting_title()}</h1>
        <div {...stylex.props(styles.number)}>
          <span {...stylex.props(typography.infoLabel, styles.slate)}>{m.room_join_text()}</span>
          <div {...stylex.props(styles.row)}>
            <span data-testid="room-code" {...stylex.props(typography.landingHeading, styles.ink)}>{spaced(code)}</span>
            <Btn testId="room-copy" tone="quiet" onClick={copy}>{copied ? m.room_link_copied() : m.room_copy_link()}</Btn>
          </div>
          <p {...stylex.props(typography.appText, styles.slate)}>{m.room_waiting_lead()}</p>
        </div>
        <ul {...stylex.props(styles.seats)}>
          {seats.map((s) => (
            <li key={s.seat} data-testid="room-seat" data-kind={s.kind} {...stylex.props(styles.seat)}>
              <span {...stylex.props(typography.appText, s.kind === 'empty' ? styles.slate : styles.ink)}>
                {s.kind === 'empty' ? m.room_seat_empty() : s.kind === 'ai' ? m.table_computer({ name: seatName(state, s.seat) }) : seatName(state, s.seat)}
              </span>
              {s.host ? <Pill>{m.room_host()}</Pill> : null}
              <span {...stylex.props(styles.seatAction)}>{action(s.seat)}</span>
            </li>
          ))}
        </ul>
        {host ? (
          <>
            <Btn testId="room-start" shape="block" size="lg" disabled={!ready || busy} onClick={() => send({ type: 'start' })}>{m.room_start()}</Btn>
            {ready ? null : <p {...stylex.props(typography.note, styles.slate)}>{m.room_start_wait()}</p>}
          </>
        ) : (
          <p data-testid="room-wait-host" {...stylex.props(typography.appText, styles.ink)}>{m.room_wait_host({ name: seats.find((s) => s.host)?.nickname ?? '' })}</p>
        )}
        <Btn testId="room-leave" tone="quiet" shape="block" disabled={busy} onClick={() => send({ type: 'leave' })}>{m.room_leave()}</Btn>
      </div>
    </Shell>
  )
}

/** A seat's name at the table: its own name, marked when a computer plays it, for good or for someone away. */
function seatNames(state: TableState): [string, string, string] {
  const me = state.mine.seat
  return [0, 1, 2].map((view) => {
    const s = state.pub.seats[roomSeat(view, me)]
    const name = seatName(state, s.seat)
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
  // The waiting room: the number, then the seats, one row each.
  number: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  seats: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, padding: 0, listStyle: 'none' },
  seat: {
    display: 'flex',
    alignItems: 'center',
    gap: space.x10,
    // A row with the host's small button in it is as tall as one without.
    minHeight: space.x48,
    boxSizing: 'border-box',
    paddingBlock: space.x8,
    paddingInline: space.x12,
    borderRadius: radii.panel,
    backgroundColor: color.page,
  },
  seatAction: { marginInlineStart: 'auto' },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
})
