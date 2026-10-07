import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { type DailyError, dailyAct, dailyBoard, dailyName, dailyState, isError } from '~/lib/daily-api'
import type { Move } from '~/lib/skat/game'
import { type DailyBoard, type DailyReply, type DailyStatus, PLAYER, type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { elev } from '../../theme/elevation.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { VsAiTable } from './daily-comparison'
import { BOT_DELAY, GameTable, TRICK_DELAY } from './game-table'
import { Btn, Panel, linkLook } from './ui'

// The daily tournament in the browser (SKATGO-35, SKATGO-36): the button on /daily that starts or
// continues the day, the day's result once all 12 deals are played with the nickname that puts it on
// the leaderboard, the leaderboard itself, and the table for a deal the server owns. The
// server answers each move with every state the table passed through — the learner's move, then each
// computer move and trick — and the table shows them one by one on its own beats, as if the computers
// were thinking here.

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

type Which = 'today' | 'yesterday'

/** The start / continue link to the table, or the day's result once it is played; then the board. */
export function DailyEntry() {
  const [status, setStatus] = useState<DailyStatus | DailyError | null>(null)
  const [which, setWhich] = useState<Which>('today')
  const [boards, setBoards] = useState<Partial<Record<Which, DailyBoard | DailyError>>>({})
  const loadBoard = (w: Which) => void dailyBoard(w).then((b) => setBoards((all) => ({ ...all, [w]: b })))
  useEffect(() => {
    void dailyState(false).then((r) => setStatus(isError(r) ? r : r.status))
    loadBoard('today')
  }, [])
  function show(w: Which) {
    setWhich(w)
    if (!boards[w]) loadBoard(w)
  }
  if (!status) return null
  if ('error' in status) return <p data-testid="daily-unavailable" {...stylex.props(typography.appText, styles.text)}>{m.daily_unavailable()}</p>
  const today = boards.today && !isError(boards.today) ? boards.today : null
  return (
    <div {...stylex.props(styles.stack)}>
      {status.finished ? (
        <DailyResult status={status} board={today} onNamed={() => loadBoard('today')} />
      ) : (
        <div {...stylex.props(styles.stack)}>
          {/* The day so far against the AI (SKATGO-42), so a reload shows it at once. */}
          {status.deals.length > 0 ? (
            <Panel>
              <section data-testid="daily-so-far" {...stylex.props(styles.result)}>
                <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_vs_ai_title()}</h2>
                <VsAiTable deals={status.deals} benchmarks={status.benchmarks} auctions={status.auctions} benchmarkAuctions={status.benchmarkAuctions} openLatest />
              </section>
            </Panel>
          ) : null}
          <Link to="/daily/play" data-testid="daily-cta" {...linkLook('go', 'lg', 'landing')}>
            {status.started ? m.daily_continue({ n: status.deal + 1, of: status.of }) : m.daily_cta()}
          </Link>
        </div>
      )}
      <Leaderboard which={which} board={boards[which] ?? null} onShow={show} />
    </div>
  )
}

/** A day's leaderboard: nicknames and totals, the player's own row marked; today's or yesterday's. */
function Leaderboard({ which, board, onShow }: { which: Which; board: DailyBoard | DailyError | null; onShow: (w: Which) => void }) {
  const rows = board && !isError(board) ? board.rows : []
  return (
    <Panel>
      <section data-testid="daily-board" data-day={board && !isError(board) ? board.day : undefined} {...stylex.props(styles.result)}>
        <div {...stylex.props(styles.boardHead)}>
          <h2 {...stylex.props(typography.panelLabel, styles.text, styles.what)}>{m.daily_board_title()}</h2>
          {(['today', 'yesterday'] as Which[]).map((w) => (
            <button
              key={w}
              type="button"
              data-testid={`daily-board-${w}`}
              aria-pressed={which === w}
              onClick={() => onShow(w)}
              {...stylex.props(typography.toggle, styles.switch, which === w && styles.switchOn)}
            >
              {w === 'today' ? m.daily_board_today() : m.daily_board_yesterday()}
            </button>
          ))}
        </div>
        {board === null ? null : isError(board) ? (
          <p {...stylex.props(typography.appText, styles.muted)}>{m.daily_unavailable()}</p>
        ) : rows.length === 0 ? (
          <p data-testid="daily-board-empty" {...stylex.props(typography.appText, styles.muted)}>
            {which === 'today' ? m.daily_board_empty_today() : m.daily_board_empty_yesterday()}
          </p>
        ) : (
          <ol {...stylex.props(styles.rows)}>
            {[...rows, ...(board.own ? [board.own] : [])].map((r, i) => (
              <li
                key={i}
                data-testid="daily-board-row"
                data-rank={r.rank}
                data-total={r.total}
                data-me={r.me ? 'true' : undefined}
                {...stylex.props(typography.appText, styles.row, styles.boardRow, i === rows.length && styles.gap, r.me && styles.mine)}
              >
                <span {...stylex.props(styles.muted, styles.rank)}>{r.rank}</span>
                <span data-testid="daily-board-name" {...stylex.props(styles.what)}>{r.nickname}</span>
                <span {...stylex.props(styles.score)}>{signed(r.total)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Panel>
  )
}

/** The nickname that puts a finished day on the board: offered, shown, or changed until midnight. */
function Nickname({ board, onNamed }: { board: DailyBoard; onNamed: () => void }) {
  const me = board.me
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(me?.nickname ?? board.lastNickname ?? '')
  const [refused, setRefused] = useState(false)
  const [saving, setSaving] = useState(false)
  const id = useId()
  if (!me?.finished) return null
  async function save() {
    setSaving(true)
    const r = await dailyName(value)
    setSaving(false)
    if (isError(r)) return setRefused(true)
    setRefused(false)
    setEditing(false)
    onNamed()
  }
  if (me.nickname && !editing) {
    return (
      <div data-testid="daily-nickname-set" {...stylex.props(styles.nickRow)}>
        <p {...stylex.props(typography.appText, styles.text, styles.what)}>{m.daily_nick_on({ name: me.nickname })}</p>
        <Btn testId="daily-nickname-change" tone="quiet" size="sm" onClick={() => setEditing(true)}>{m.daily_nick_change()}</Btn>
      </div>
    )
  }
  return (
    <div {...stylex.props(styles.nickForm)}>
      {me.nickname ? null : (
        <p data-testid="daily-would-be" data-rank={me.rank ?? undefined} {...stylex.props(typography.appText, styles.text)}>
          {m.daily_would_be({ total: signed(me.total), rank: me.rank ?? 1 })}
        </p>
      )}
      <label htmlFor={id} {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_nick_label()}</label>
      <div {...stylex.props(styles.nickRow)}>
        <input
          id={id}
          data-testid="daily-nickname"
          type="text"
          autoComplete="nickname"
          value={value}
          aria-invalid={refused}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) void save()
          }}
          {...stylex.props(typography.appText, typography.control, styles.input)}
        />
        <Btn testId="daily-nickname-save" disabled={saving || value.trim() === ''} onClick={() => void save()}>
          {me.nickname ? m.daily_nick_save() : m.daily_nick_join()}
        </Btn>
      </div>
      {refused ? <p data-testid="daily-nickname-refused" role="alert" {...stylex.props(typography.appText, styles.refused)}>{m.daily_nick_refused()}</p> : null}
    </div>
  )
}

/** The day's 12 deals and the total, as the server recorded them, and the nickname for the board. */
function DailyResult({ status, board, onNamed }: { status: DailyStatus; board: DailyBoard | null; onNamed: () => void }) {
  return (
    <Panel>
      <section data-testid="daily-result" data-total={status.totals[PLAYER]} {...stylex.props(styles.result)}>
        <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_result_title()}</h2>
        <VsAiTable deals={status.deals} benchmarks={status.benchmarks} auctions={status.auctions} benchmarkAuctions={status.benchmarkAuctions} />
        {board ? <Nickname key={board.me?.nickname ?? ''} board={board} onNamed={onNamed} /> : null}
      </section>
    </Panel>
  )
}

/** The table for the day's current deal. After the last deal, or when the day is over, back to /daily. */
export function DailyTable() {
  const navigate = useNavigate()
  const onLeave = () => void navigate({ to: '/daily' })
  const [reply, setReply] = useState<DailyReply | null>(null)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  /** The deal on the table: it stays put while its settlement is shown, after the server moved on. */
  const [deal, setDeal] = useState(0)
  /** Totals as they stood before the move whose steps are still being shown. */
  const before = useRef<[number, number, number]>([0, 0, 0])

  async function load() {
    const r = await dailyState(true)
    if (isError(r)) return setFailed(true)
    if (r.status.finished || !r.view) return onLeave()
    setFailed(false)
    setReply(r)
    setShown(r.view)
    setQueue([])
    setDeal(r.status.deal)
  }
  useEffect(() => {
    void load()
    // Once, when the table opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The computers' moves arrive all at once; show them one by one, a trick lingering as at the table.
  useEffect(() => {
    if (queue.length === 0) return
    const t = setTimeout(() => {
      setShown(queue[0])
      setQueue((q) => q.slice(1))
    }, shown?.phase === 'trickEnd' ? TRICK_DELAY : BOT_DELAY)
    return () => clearTimeout(t)
  }, [queue, shown])

  async function send(move: Move) {
    if (!reply) return
    setSending(true)
    before.current = reply.status.totals
    const r = await dailyAct({ day: reply.status.day, deal, revision: reply.revision }, move)
    setSending(false)
    // Refused — a new day began, or this page is behind another tab: take the server's word for where
    // things stand. A deal never restarts; the same cards come back as they were left.
    if (isError(r)) return r.error === 'day_over' ? onLeave() : void load()
    if (!r.steps?.length) return void load()
    setReply(r)
    setShown(r.steps[0])
    setQueue(r.steps.slice(1))
  }

  const game = useMemo(() => (shown ? gameFromView(shown) : null), [shown])
  if (failed) {
    return (
      <Panel tone="bad">
        <p data-testid="daily-unavailable" {...stylex.props(typography.appText, styles.text)}>{m.daily_unavailable()}</p>
        <Btn testId="daily-retry" onClick={() => void load()}>{m.daily_retry()}</Btn>
      </Panel>
    )
  }
  if (!reply || !game) return null
  const busy = sending || queue.length > 0
  return (
    <GameTable
      fullScreen
      tournament={{
        game,
        busy,
        send: (move) => void send(move),
        next: () => (reply.status.finished ? onLeave() : void load()),
        deal,
        of: reply.status.of,
        totals: busy ? before.current : reply.status.totals,
        deals: reply.status.deals,
        benchmarks: reply.status.benchmarks,
        auctions: reply.status.auctions,
        benchmarkAuctions: reply.status.benchmarkAuctions,
      }}
    />
  )
}

const styles = stylex.create({
  text: { margin: 0, color: color.navy },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  boardHead: { display: 'flex', alignItems: 'center', gap: space.x8 },
  switch: {
    minHeight: dims.control,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
    color: color.navy,
    borderRadius: radii.pill,
    paddingInline: space.x16,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  switchOn: { backgroundColor: color.goodSoft, borderColor: color.go },
  rank: { minWidth: space.x24 },
  boardRow: { paddingInline: space.x8 },
  mine: { backgroundColor: color.goodSoft, borderRadius: radii.column },
  gap: { marginTop: space.x16 },
  nickForm: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x8 },
  nickRow: { display: 'flex', alignItems: 'center', gap: space.x10, flexWrap: 'wrap' },
  input: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: dims.control,
    boxSizing: 'border-box',
    paddingBlock: space.x10,
    paddingInline: space.x12,
    color: color.text,
    backgroundColor: color.surface,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: { default: color.hairline, ':focus': color.info },
    borderRadius: radii.panel,
    outlineStyle: 'none',
    boxShadow: { default: 'none', ':focus': elev.focus },
  },
  refused: { margin: 0, color: color.bad },
  result: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  rows: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: space.x12,
    paddingBlock: space.x8,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  muted: { color: color.slate, flexShrink: 0 },
  what: { flexGrow: 1 },
  score: { flexShrink: 0 },
})
