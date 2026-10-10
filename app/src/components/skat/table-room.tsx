import * as stylex from '@stylexjs/stylex'
import type { Room } from '@colyseus/sdk'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { track } from '~/lib/analytics'
import { type TableError, type TableState, openTable, readState, savedSeat, sendAction, sitDown } from '~/lib/room-client'
import type { Move, Seat } from '~/lib/skat/game'
import { roomGame, roomSeat } from '~/lib/skat/room-view'
import { seegerFabian } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale, localizeHref } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { fill } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { GameTable } from './game-table'
import { Btn, Panel, TextField, linkLook } from './ui'

// A private table in the browser (SKATGO-61): opening one, the lobby while people arrive, and the
// table itself. The room lives in the multiplayer service (lib/room-client.ts); this file only draws
// what it publishes and sends this seat's moves.

const errorText = (e: TableError) =>
  ({
    room_started: m.table_err_room_started,
    room_full: m.table_err_room_full,
    invite_denied: m.table_err_invite_denied,
    nickname_refused: m.table_err_nickname_refused,
    room_not_found: m.table_err_room_not_found,
    room_capacity: m.table_err_room_capacity,
    slow_down: m.table_err_slow_down,
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

/** The friends page's form: a name, then a new table with this person as its host. */
export function OpenTable() {
  const navigate = useNavigate()
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
  return <NameForm testId="table-open" label={m.table_name_label()} action={m.table_open()} busy={busy} error={error} onSubmit={(name) => void open(name)} />
}

type Stage = { kind: 'connecting' } | { kind: 'name'; error: string | null; busy: boolean } | { kind: 'error'; error: TableError } | { kind: 'seated' }

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
  const latest = useRef<TableState | null>(null)
  const room = useRef<Room | null>(null)
  const leaving = useRef(false)

  function attach(r: Room) {
    room.current = r
    setStage({ kind: 'seated' })
    r.onStateChange(() => {
      const next = readState(r)
      if (!next) return
      latest.current = next
      setQueue((q) => [...q, next])
    })
    r.onMessage('receipt', () => setSending(false))
    // A lost connection: the SDK's own reconnection first; when that gives up, the seat token brings
    // this person back to the same seat (the computer has kept it warm meanwhile).
    r.onLeave(() => {
      room.current = null
      if (leaving.current) return
      setStage({ kind: 'connecting' })
      setTimeout(() => void comeBack(), 1000)
    })
  }

  async function comeBack() {
    const r = await sitDown(id)
    if (typeof r === 'string') return setStage({ kind: 'error', error: r })
    attach(r)
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
    return () => {
      leaving.current = true
      void room.current?.leave(true)
    }
    // Once, for this table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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
    sendAction(r, at.pub.revision, action)
  }

  if (stage.kind === 'error') return <Notice text={errorText(stage.error)} />
  if (stage.kind === 'name') {
    return (
      <Shell>
        <p {...stylex.props(typography.landingBody, styles.ink)}>{m.table_invited()}</p>
        <NameForm testId="table-join" label={m.table_name_label()} action={m.table_join()} busy={stage.busy} error={stage.error} onSubmit={(name) => void join(name)} />
      </Shell>
    )
  }
  if (stage.kind === 'connecting' || !shown) return <Notice text={stage.kind === 'connecting' && shown ? m.table_reconnecting() : m.loading()} quiet />
  if (!shown.pub.started) return <Lobby state={shown} invite={savedSeat(id)?.invite ?? invite} onStart={() => {
    track('room_started', { humans: shown.pub.seats.filter((s) => s.kind === 'human').length })
    send({ type: 'start' })
  }} />
  return <Playing state={shown} busy={sending || queue.length > 0} send={send} collect={() => setRelease(true)} />
}

/** A seat's name as the viewer reads it: a person's nickname (the viewer is "you"), Lina or Max for a
 *  computer's seat, marked when a computer plays it. */
function seatNames(state: TableState): [string, string, string] {
  const me = state.mine.seat
  return [0, 1, 2].map((view) => {
    const s = state.pub.seats[roomSeat(view, me)]
    const name = view === 0 ? m.name_you() : s.nickname ?? (s.seat === 1 ? m.name_lina() : m.name_max())
    return s.control === 'ai' ? m.table_computer({ name }) : name
  }) as [string, string, string]
}

function Playing({ state, busy, send, collect }: { state: TableState; busy: boolean; send: (a: Move | { type: 'next' }) => void; collect: () => void }) {
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
  return (
    <div data-testid="table-room" data-seat={me} data-revision={state.pub.revision} data-deals={state.pub.deals} data-dealer={state.pub.dealer} data-phase={state.pub.phase} data-controls={state.pub.seats.map((x) => x.control).join(',')} {...stylex.props(styles.play)}>
      <GameTable fullScreen room={{ game, busy, send: (move) => send(move), collect, next: () => send({ type: 'next' }), names, totals, standings }} />
    </div>
  )
}

function Lobby({ state, invite, onStart }: { state: TableState; invite: string; onStart: () => void }) {
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
        <Btn testId="table-start" size="lg" onClick={onStart}>{m.table_start()}</Btn>
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

function Notice({ text, quiet = false }: { text: string; quiet?: boolean }) {
  const navigate = useNavigate()
  return (
    <Shell>
      <p role={quiet ? undefined : 'alert'} data-testid="table-notice" {...stylex.props(typography.appText, quiet ? styles.ink : styles.bad)}>{text}</p>
      {quiet ? null : <Btn testId="table-new" tone="quiet" onClick={() => void navigate({ to: '/with-friends' })}>{m.table_new()}</Btn>}
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
})
