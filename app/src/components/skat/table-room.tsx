import * as stylex from '@stylexjs/stylex'
import { SignInButton, SignUpButton } from '@clerk/tanstack-react-start'
import type { Room } from '@colyseus/sdk'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { track } from '~/lib/analytics'
import { PASSING, type TableError, type TableState, openTable, readState, save, savedSeat, sayBrought, sendAction, sitDown } from '~/lib/room-client'
import type { Move, Seat } from '~/lib/skat/game'
import { roomGame, roomSeat } from '~/lib/skat/room-view'
import { seegerFabian } from '~/lib/skat/tournament'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale, localizeHref } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { border, layer, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { GameTable } from './game-table'
import { Btn, Panel, Pill, TextField, linkLook } from './ui'

// A private table in the browser (SKATGO-61): opening one, the lobby while people arrive, and the
// table itself. The room lives in the multiplayer service (lib/room-client.ts); this file only draws
// what it publishes and sends this seat's moves. Since SKATGO-117 opening one takes an account, a guest who
// signs up at someone's table is recorded as brought by its host, and a lost connection keeps trying to
// come back for two minutes before it says so.

/** How long a lost table keeps trying to come back, and the waits between tries (then every 10 s). A seat
 *  still open elsewhere is waited for only as long as the service takes to notice a dead connection: past
 *  that it is really open in another tab or device, and the person is told. */
const RETRY_FOR = 2 * 60 * 1000
const SEAT_WAIT = 20 * 1000
const WAITS = [1000, 2000, 4000, 8000]

const errorText = (e: TableError) =>
  ({
    room_started: m.table_err_room_started,
    room_full: m.table_err_room_full,
    invite_denied: m.table_err_invite_denied,
    nickname_refused: m.table_err_nickname_refused,
    room_not_found: m.table_err_room_not_found,
    room_capacity: m.table_err_room_capacity,
    slow_down: m.table_err_slow_down,
    sign_in_required: m.table_err_sign_in_required,
    seat_taken: m.table_err_seat_taken,
    not_ready: m.table_err_not_ready,
    unreachable: m.table_err_unreachable,
  })[e]()

/** A name and a button: what a table, new or joined, asks of a person. */
function NameForm({ label, action, busy, error, onSubmit, testId }: { label: string; action: string; busy: boolean; error: string | null; onSubmit: (name: string) => void; testId: string }) {
  const [name, setName] = useState('')
  const id = useId()
  const submit = () => {
    if (!busy && name.trim()) onSubmit(name)
  }
  return (
    <div data-testid={testId} {...stylex.props(styles.form)}>
      <label htmlFor={id} {...stylex.props(typography.panelLabel, styles.ink)}>{label}</label>
      <div {...stylex.props(styles.row)}>
        <TextField id={id} testId={`${testId}-name`} autoComplete="nickname" value={name} invalid={!!error} onChange={setName} onEnter={submit} />
        <Btn testId={`${testId}-go`} disabled={busy || !name.trim()} onClick={submit}>{action}</Btn>
      </div>
      {error ? <p role="alert" data-testid={`${testId}-error`} {...stylex.props(typography.appText, styles.bad)}>{error}</p> : null}
    </div>
  )
}

/** The friends page's form: a name, then a new table with this person as its host. A table needs an
 *  account to open (SKATGO-117): a guest sees why, and the way in — Clerk's window over the page, as the
 *  Tricks' gate does (SKATGO-112), no lock; once signed in, the form is there. */
export function OpenTable() {
  const navigate = useNavigate()
  const account = useAccount()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function open(name: string) {
    setBusy(true)
    const r = await openTable(name)
    setBusy(false)
    if (typeof r === 'string') return setError(errorText(r))
    track('room_created')
    // The page for the table takes over the room: this connection is let go, its seat stays saved.
    const id = r.room.roomId
    await r.room.leave(true)
    void navigate({ to: '/table/$id', params: { id }, hash: r.invite })
  }
  if (account === undefined) return null
  if (account === null) {
    return (
      <div data-testid="table-open-sign-in" {...stylex.props(styles.form)}>
        <p {...stylex.props(typography.appText, styles.ink)}>{m.table_open_sign_in_text()}</p>
        <div {...stylex.props(styles.row)}>
          <SignInButton mode="modal">
            <Btn testId="table-open-sign-in-go">{m.table_open_sign_in()}</Btn>
          </SignInButton>
        </div>
      </div>
    )
  }
  return <NameForm testId="table-open" label={m.table_name_label()} action={m.table_open()} busy={busy} error={error} onSubmit={(name) => void open(name)} />
}

/** `again`: the table kept trying to come back and gave up; the person may try once more. */
type Stage = { kind: 'connecting' } | { kind: 'name'; error: string | null; busy: boolean } | { kind: 'error'; error: TableError; again?: boolean } | { kind: 'seated' }

/** A private table: back in this browser's seat, or a new seat with the invite and a name; then the
 *  lobby until the host starts, then the table. */
export function PrivateTable() {
  const { id } = useParams({ from: '/table/$id' })
  const [invite] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash.slice(1)))
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
  const latest = useRef<TableState | null>(null)
  const room = useRef<Room | null>(null)
  const leaving = useRef(false)
  /** The way back's tries so far, while it keeps trying. */
  const back = useRef<{ since: number; tries: number; timer?: ReturnType<typeof setTimeout> } | null>(null)
  const trying = useRef(false)
  /** The start this seat sent, until its receipt: it counts once it is accepted (SKATGO-117). */
  const starting = useRef<{ id: string; humans: number } | null>(null)
  const account = useAccount()
  const told = useRef(false)
  const [declined, setDeclined] = useState(false)

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
    r.onMessage('receipt', (receipt: { id?: string; ok?: boolean }) => {
      setSending(false)
      if (starting.current && receipt?.id === starting.current.id) {
        if (receipt.ok) track('room_started', { humans: starting.current.humans })
        starting.current = null
      }
    })
    // A lost connection: the SDK's own reconnection first, with the table kept on screen; when that
    // gives up, the seat token brings this person back to the same seat (the computer has kept it warm
    // meanwhile), trying again until the service is back.
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
    if (Date.now() - b.since >= (error === 'seat_taken' ? SEAT_WAIT : RETRY_FOR)) {
      back.current = null
      return setStage({ kind: 'error', error, again: true })
    }
    clearTimeout(b.timer)
    b.timer = setTimeout(() => void comeBack(), WAITS[b.tries] ?? 10_000)
    b.tries++
  }

  async function comeBack() {
    if (trying.current || leaving.current) return
    trying.current = true
    clearTimeout(back.current?.timer)
    const r = await sitDown(id)
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
    setStage({ kind: 'error', error: r })
  }

  async function join(name: string) {
    setStage({ kind: 'name', error: null, busy: true })
    const r = await sitDown(id, { invite, nickname: name })
    if (typeof r === 'string') {
      if (r === 'nickname_refused') return setStage({ kind: 'name', error: errorText(r), busy: false })
      return setStage({ kind: 'error', error: r })
    }
    track('room_joined')
    attach(r)
  }

  useEffect(() => {
    if (savedSeat(id)) void comeBack()
    else if (invite) setStage({ kind: 'name', error: null, busy: false })
    else setStage({ kind: 'error', error: 'invite_denied' })
    // A phone back in front, or the network back: the next try is now rather than after its wait.
    const now = () => {
      if (back.current && document.visibilityState === 'visible') void comeBack()
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
    // Once, for this table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // A guest who signs up here, at someone else's table: whose table it was is recorded (SKATGO-117). A
  // host sits in seat 0; whether the account is new enough to count is the service's to decide.
  const mySeat = shown?.mine.seat
  useEffect(() => {
    if (!account || told.current || stage.kind !== 'seated' || mySeat === undefined || mySeat === 0) return
    told.current = true
    sayBrought(id)
  }, [account, stage.kind, mySeat, id])

  // States arrive as they happen; a finished trick stays on this screen until it is tapped away.
  useEffect(() => {
    if (queue.length === 0) return
    const held = shown?.pub.phase === 'trickEnd'
    if (held && !release) return
    if (held) setRelease(false)
    setShown(queue[0])
    setQueue((q) => q.slice(1))
  }, [queue, shown, release])

  const send = (action: Move | { type: 'start' } | { type: 'next' }) => {
    const r = room.current
    const at = latest.current
    if (!r || !at || sending) return
    setSending(true)
    const sent = sendAction(r, at.pub.revision, action)
    if (action.type === 'start') starting.current = { id: sent, humans: at.pub.seats.filter((s) => s.kind === 'human').length }
  }

  if (stage.kind === 'error') {
    return (
      <Notice
        text={errorText(stage.error)}
        onAgain={stage.again ? () => {
          setStage({ kind: 'connecting' })
          void comeBack()
        } : undefined}
      />
    )
  }
  if (stage.kind === 'name') {
    return (
      <Shell>
        <p {...stylex.props(typography.landingBody, styles.ink)}>{m.table_invited()}</p>
        <NameForm testId="table-join" label={m.table_name_label()} action={m.table_join()} busy={stage.busy} error={stage.error} onSubmit={(name) => void join(name)} />
      </Shell>
    )
  }
  if (!shown) return <Notice text={m.loading()} quiet />
  // While the connection comes back — the SDK's own reconnection, or the seat token's tries after it —
  // the table stays on screen under one line, and takes no moves.
  const away = dropped || stage.kind !== 'seated'
  const reconnecting = away ? (
    <div data-testid="table-reconnecting" {...stylex.props(styles.dropped)}>
      <Pill tone="dark">{m.table_reconnecting()}</Pill>
    </div>
  ) : null
  if (!shown.pub.started) {
    return (
      <>
        {reconnecting}
        <Lobby state={shown} invite={savedSeat(id)?.invite ?? invite} busy={sending || away} onStart={() => send({ type: 'start' })} />
      </>
    )
  }
  // A guest at someone's table is asked once a deal is over, until they turn it away at this table.
  const signUp = account === null && shown.mine.seat !== 0 && !declined && !savedSeat(id)?.noSignUp ? <SignUpLine onNo={() => {
    const saved = savedSeat(id)
    if (saved) save(id, { ...saved, noSignUp: true })
    setDeclined(true)
  }} /> : null
  return (
    <Playing
      state={shown}
      busy={sending || away || queue.length > 0}
      send={send}
      collect={() => setRelease(true)}
      after={signUp}
      notice={away ? <span data-testid="table-reconnecting"><Pill tone="dark">{m.table_reconnecting()}</Pill></span> : null}
    />
  )
}

/** After a deal, for a guest at someone else's table (SKATGO-117): what an account would let them do, the
 *  way to one — Clerk's window — and a way to say no. Neither is the deal's main action. */
function SignUpLine({ onNo }: { onNo: () => void }) {
  return (
    <div data-testid="table-sign-up" {...stylex.props(styles.form)}>
      <p {...stylex.props(typography.note, styles.ink)}>{m.table_sign_up_text()}</p>
      <div {...stylex.props(styles.row)}>
        <SignUpButton mode="modal">
          <Btn testId="table-sign-up-go" tone="quiet" size="sm">{m.table_sign_up()}</Btn>
        </SignUpButton>
        <Btn testId="table-sign-up-no" tone="quiet" size="sm" onClick={onNo}>{m.table_sign_up_no()}</Btn>
      </div>
    </div>
  )
}

/** A seat's name as the viewer reads it: a person's nickname (the viewer is "you"), Lina or Noah for a
 *  computer's seat, marked when a computer plays it. */
function seatNames(state: TableState): [string, string, string] {
  const me = state.mine.seat
  return [0, 1, 2].map((view) => {
    const s = state.pub.seats[roomSeat(view, me)]
    const name = view === 0 ? m.name_you() : s.nickname ?? (s.seat === 1 ? m.name_lina() : m.name_max())
    return s.control === 'ai' ? m.table_computer({ name }) : name
  }) as [string, string, string]
}

function Playing({ state, busy, send, collect, after, notice }: { state: TableState; busy: boolean; send: (a: Move | { type: 'next' }) => void; collect: () => void; after: ReactNode; notice: ReactNode }) {
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
      {after}
    </div>
  ) : null
  return (
    <div data-testid="table-room" data-seat={me} data-revision={state.pub.revision} data-deals={state.pub.deals} data-dealer={state.pub.dealer} data-phase={state.pub.phase} data-controls={state.pub.seats.map((x) => x.control).join(',')} {...stylex.props(styles.play)}>
      <GameTable fullScreen room={{ game, busy, send: (move) => send(move), collect, next: () => send({ type: 'next' }), names, totals, standings, notice }} />
    </div>
  )
}

function Lobby({ state, invite, busy, onStart }: { state: TableState; invite: string; busy: boolean; onStart: () => void }) {
  const host = state.mine.seat === 0
  const [copied, setCopied] = useState(false)
  // The link as this page is served — the site, or a local preview — in the page's language.
  const link = invite ? `${window.location.origin}${localizeHref(`/table/${state.pub.roomId}`, { locale: getLocale() })}#${invite}` : ''
  const hostName = state.pub.seats[0].nickname ?? ''
  return (
    <Shell>
      <h2 {...stylex.props(typography.optionTitle, styles.ink)}>{m.table_seats_title()}</h2>
      <ol data-testid="table-seats" {...stylex.props(styles.seats)}>
        {state.pub.seats.map((s) => (
          <li key={s.seat} data-testid="table-seat" data-kind={s.kind} data-connected={String(s.connected)} {...stylex.props(typography.appText, styles.seat)}>
            {s.kind === 'human' ? (s.seat === state.mine.seat ? `${s.nickname} (${m.name_you()})` : s.nickname) : m.table_seat_empty()}
          </li>
        ))}
      </ol>
      {link ? (
        <section {...stylex.props(styles.form)}>
          <h2 {...stylex.props(typography.panelLabel, styles.ink)}>{m.table_invite_title()}</h2>
          <p {...stylex.props(typography.appText, styles.ink)}>{m.table_invite_hint()}</p>
          <div {...stylex.props(styles.row)}>
            <code data-testid="table-invite" {...stylex.props(typography.appText, styles.link)}>{link}</code>
            <Btn testId="table-copy" tone="quiet" onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => setCopied(true))
            }}>{copied ? m.table_copied() : m.table_copy()}</Btn>
          </div>
        </section>
      ) : null}
      {host ? (
        <Btn testId="table-start" size="lg" disabled={busy} onClick={onStart}>{m.table_start()}</Btn>
      ) : (
        <p data-testid="table-wait" {...stylex.props(typography.appText, styles.ink)}>{m.table_wait_host({ name: hostName })}</p>
      )}
      <Link to="/with-friends" data-testid="skat-leave" {...linkLook('stop', 'md', 'pill')}>{m.table_leave()}</Link>
    </Shell>
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

/** A line instead of the table: loading or coming back (`quiet`), or why not — with a new table, and, when
 *  the way back gave up, one more try. */
function Notice({ text, quiet = false, onAgain }: { text: string; quiet?: boolean; onAgain?: () => void }) {
  const navigate = useNavigate()
  return (
    <Shell>
      <p role={quiet ? undefined : 'alert'} data-testid="table-notice" {...stylex.props(typography.appText, quiet ? styles.ink : styles.bad)}>{text}</p>
      {quiet ? null : (
        <div {...stylex.props(styles.row)}>
          {onAgain ? <Btn testId="table-again" onClick={onAgain}>{m.table_again()}</Btn> : null}
          <Btn testId="table-new" tone="quiet" onClick={() => void navigate({ to: '/with-friends' })}>{m.table_new()}</Btn>
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
  bad: { margin: 0, color: color.bad },
  seats: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, paddingInlineStart: space.x24 },
  seat: { color: color.navy },
  link: { flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere', color: color.slate, borderWidth: border.hair, borderStyle: 'solid', borderColor: color.hairline, padding: space.x8 },
  standings: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  // The lobby's line while the connection comes back: in the middle of the screen, not in the way of a tap.
  // At the table it stands where the table's messages go (GameTable `room.notice`).
  dropped: {
    position: 'fixed',
    inset: 0,
    zIndex: layer.tip,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
})
