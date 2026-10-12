import * as stylex from '@stylexjs/stylex'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react'

import { track } from '~/lib/analytics'
import { type DailyError, dailyAct, dailyBoard, dailyName, dailyState, isError } from '~/lib/daily-api'
import type { Move } from '~/lib/skat/game'
import { BOARD_DAYS, type BoardRow, DAILY_DEALS, DAILY_TIME_ZONE, type DailyBoard, type DailyReply, type DailySize, type DailyStatus, PLAYER, type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, opacity, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { DayDeals, VsAiTable, Who } from './daily-comparison'
import { sizeSearch } from './daily-page'
import { BOT_DELAY, GameTable } from './game-table'
import { Btn, Panel, TextField, linkLook } from './ui'
import { TableLoading } from './table-loading'

// The daily tournament in the browser (SKATGO-35, SKATGO-36): the button on /daily that starts or
// continues the day, the day's result once all its deals are played with the name it stands on the
// leaderboard under (given, and changeable — SKATGO-90), the leaderboard itself, and the table for a deal the server owns. Each is about one of
// the day's tournaments, named by its number of deals (SKATGO-77). The
// server answers each move with every state the table passed through — the learner's move, then each
// computer move and trick — and the table shows them one by one on its own beats, as if the computers
// were thinking here.

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** The day's deals and the start / continue link to the table, or the day's result once it is played;
 *  then the board. `waiting` stands in while the status loads: the server's rendering of the same. */
export function DailyEntry({ size, waiting }: { size: DailySize; waiting?: ReactNode }) {
  const [status, setStatus] = useState<DailyStatus | DailyError | null>(null)
  // The board's day, how many days before today (SKATGO-80: the last `BOARD_DAYS`), and the boards fetched.
  const [back, setBack] = useState(0)
  const [boards, setBoards] = useState<Partial<Record<number, DailyBoard | DailyError>>>({})
  const loadBoard = (b: number) => void dailyBoard(size, b).then((r) => setBoards((all) => ({ ...all, [b]: r })))
  useEffect(() => {
    void dailyState(size, false).then((r) => setStatus(isError(r) ? r : r.status))
    loadBoard(0)
  }, [])
  function show(b: number) {
    setBack(b)
    if (!boards[b]) loadBoard(b)
  }
  if (!status) return waiting ?? null
  if ('error' in status) return <p data-testid="daily-unavailable" {...stylex.props(typography.appText, styles.text)}>{m.daily_unavailable()}</p>
  const today = boards[0] && !isError(boards[0]) ? boards[0] : null
  return (
    <div {...stylex.props(styles.stack)}>
      {status.finished ? (
        <DailyResult size={size} status={status} board={today} onNamed={() => loadBoard(0)} />
      ) : (
        <div {...stylex.props(styles.stack)}>
          {/* The way in first, its own width so it reads as a button (SKATGO-63). */}
          <div {...stylex.props(styles.action)}>
            <Link to="/daily/play" search={sizeSearch(size)} data-testid="daily-cta" onClick={() => { if (!status.started) track('daily_started', { deals: size }) }} {...linkLook('go', 'lg', 'landing')}>
              {status.started ? m.daily_continue({ n: status.deal + 1, of: status.of }) : m.daily_cta()}
            </Link>
          </div>
          {/* Every deal of the day (SKATGO-63), the finished ones against the AI (SKATGO-42), so a reload
              shows the day so far at once. */}
          <DayDeals of={status.of} status={status} />
        </div>
      )}
      <Leaderboard back={back} board={boards[back] ?? null} onShow={show} />
    </div>
  )
}

/** A board line: a player's row, or the AI's total (SKATGO-80). */
type Line = { row: BoardRow } | { ai: number }
const totalOf = (l: Line) => ('ai' in l ? l.ai : l.row.total)

/** The name of the board's day: today, yesterday, or its weekday and date in the page's language. */
function dayName(back: number, day: string | undefined): string {
  if (back === 0) return m.daily_board_today()
  if (back === 1) return m.daily_board_yesterday()
  // Before the board has come, the day counted back in Berlin, where the tournament's days are.
  const date = day ?? new Date(Date.parse(`${new Intl.DateTimeFormat('en-CA', { timeZone: DAILY_TIME_ZONE }).format(new Date())}T00:00:00Z`) - back * 86_400_000).toISOString().slice(0, 10)
  return new Intl.DateTimeFormat(getLocale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

/** A day's leaderboard: nicknames and Seeger-Fabian totals (SKATGO-81), the player's own row marked; today's or one of the six days
 *  before, stepped through with the two arrows beside the day's name (SKATGO-80, the human: 「要保留显示最近
 *  7天的」). The AI stands among the players by its total, after any player with the same, taking no rank
 *  (SKATGO-80); when it falls below the rows shown it follows them, with the player's own row. With nobody
 *  on the board yet it stands there alone, under the line that says so. */
function Leaderboard({ back, board, onShow }: { back: number; board: DailyBoard | DailyError | null; onShow: (back: number) => void }) {
  const shown = board && !isError(board) ? board : null
  const rows = shown?.rows ?? []
  const ai = shown?.ai?.total ?? null
  const cut = rows.length < (shown?.total ?? 0)
  const at = ai === null ? -1 : rows.findIndex((r) => r.total < ai)
  const lines: Line[] = rows.map((row) => ({ row }))
  if (ai !== null && (at >= 0 || !cut)) lines.splice(at >= 0 ? at : lines.length, 0, { ai })
  const below: Line[] = [...(shown?.own ? [{ row: shown.own }] : []), ...(ai !== null && at < 0 && cut ? [{ ai }] : [])]
  below.sort((a, b) => totalOf(b) - totalOf(a) || ('ai' in a ? 1 : 0) - ('ai' in b ? 1 : 0))
  return (
    <Panel>
      <section data-testid="daily-board" data-day={shown?.day} {...stylex.props(styles.result)}>
        <div {...stylex.props(styles.boardHead)}>
          <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_board_title()}</h2>
          <span data-testid="daily-board-day" data-back={back} {...stylex.props(typography.toggle, styles.text, styles.what)}>{dayName(back, shown?.day)}</span>
          {/* Earlier on the left, later on the right; both stay where they are while the day's name changes. */}
          <button type="button" data-testid="daily-board-earlier" aria-label={m.daily_board_earlier()} title={m.daily_board_earlier()} disabled={back >= BOARD_DAYS - 1} onClick={() => onShow(back + 1)} {...stylex.props(styles.step, back >= BOARD_DAYS - 1 && styles.stepOff)}>
            <ChevronLeft aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
          <button type="button" data-testid="daily-board-later" aria-label={m.daily_board_later()} title={m.daily_board_later()} disabled={back === 0} onClick={() => onShow(back - 1)} {...stylex.props(styles.step, back === 0 && styles.stepOff)}>
            <ChevronRight aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
        </div>
        {board === null ? null : isError(board) ? (
          <p {...stylex.props(typography.appText, styles.muted)}>{m.daily_unavailable()}</p>
        ) : (
          <>
            {rows.length === 0 ? (
              <p data-testid="daily-board-empty" {...stylex.props(typography.appText, styles.muted)}>
                {back === 0 ? m.daily_board_empty_today() : back === 1 ? m.daily_board_empty_yesterday() : m.daily_board_empty_day()}
              </p>
            ) : null}
            {lines.length + below.length > 0 ? (
              <ol {...stylex.props(styles.rows)}>
                {/* What the number is: the Seeger-Fabian total, by which the board ranks (SKATGO-81). */}
                <li aria-hidden="true" {...stylex.props(typography.micro, styles.boardHeadRow, styles.muted)}>
                  <span {...stylex.props(styles.what)} />
                  <span>{m.daily_points()}</span>
                </li>
                {[...lines, ...below].map((l, i) => {
                  const apart = i === lines.length
                  return 'ai' in l ? (
                    <li key="ai" data-testid="daily-board-ai" data-total={l.ai} {...stylex.props(typography.appText, styles.row, styles.boardRow, apart && styles.gap)}>
                      <span {...stylex.props(styles.rank)} />
                      <span {...stylex.props(styles.what)}><Who side="ai" /></span>
                      <span {...stylex.props(styles.score)}>{signed(l.ai)}</span>
                    </li>
                  ) : (
                    <li
                      key={i}
                      data-testid="daily-board-row"
                      data-rank={l.row.rank}
                      data-total={l.row.total}
                      data-me={l.row.me ? 'true' : undefined}
                      {...stylex.props(typography.appText, styles.row, styles.boardRow, apart && styles.gap, l.row.me && styles.mine)}
                    >
                      <span {...stylex.props(styles.muted, styles.rank)}>{l.row.rank}</span>
                      <span data-testid="daily-board-name" {...stylex.props(styles.what)}>{l.row.nickname}</span>
                      <span {...stylex.props(styles.score)}>{signed(l.row.total)}</span>
                    </li>
                  )
                })}
              </ol>
            ) : null}
          </>
        )}
      </section>
    </Panel>
  )
}

/** The player's name on the board (SKATGO-90): given when the tournament finished — nothing to fill in —
 *  shown, and changed in place. A change holds from now on and for today's entries, never an earlier day's. */
function Nickname({ board, onNamed }: { board: DailyBoard; onNamed: () => void }) {
  const me = board.me
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(me?.nickname ?? '')
  const [problem, setProblem] = useState<'refused' | 'taken' | null>(null)
  const [saving, setSaving] = useState(false)
  const id = useId()
  if (!me?.finished || !me.nickname) return null
  async function save() {
    setSaving(true)
    const r = await dailyName(value)
    setSaving(false)
    if (isError(r)) return setProblem(r.error === 'nickname_taken' ? 'taken' : 'refused')
    track('daily_nickname_set')
    setProblem(null)
    setEditing(false)
    onNamed()
  }
  if (!editing) {
    return (
      <div data-testid="daily-nickname-set" data-name={me.nickname} {...stylex.props(styles.nickRow)}>
        <p {...stylex.props(typography.appText, styles.text, styles.what)}>{m.daily_nick_on({ name: me.nickname })}</p>
        {/* Green, or it is not seen (SKATGO-97, the human: 「改名字change的按钮改为绿色，否则太不明显」). */}
        <Btn testId="daily-nickname-change" tone="go" size="sm" onClick={() => setEditing(true)}>{m.daily_nick_change()}</Btn>
      </div>
    )
  }
  return (
    <div {...stylex.props(styles.nickForm)}>
      <label htmlFor={id} {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_nick_label()}</label>
      <div {...stylex.props(styles.nickRow)}>
        <TextField id={id} testId="daily-nickname" autoComplete="nickname" value={value} invalid={problem !== null} onChange={setValue} onEnter={() => { if (!saving) void save() }} />
        <Btn testId="daily-nickname-save" disabled={saving || value.trim() === ''} onClick={() => void save()}>{m.daily_nick_save()}</Btn>
      </div>
      {problem ? (
        <p data-testid="daily-nickname-refused" data-problem={problem} role="alert" {...stylex.props(typography.appText, styles.refused)}>
          {problem === 'taken' ? m.daily_nick_taken() : m.daily_nick_refused()}
        </p>
      ) : null}
    </div>
  )
}

/** The tournament's deals and the total, as the server recorded them, and the nickname for the board. */
function DailyResult({ size, status, board, onNamed }: { size: DailySize; status: DailyStatus; board: DailyBoard | null; onNamed: () => void }) {
  return (
    <Panel>
      <section data-testid="daily-result" data-total={status.totals[PLAYER]} {...stylex.props(styles.result)}>
        <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_result_title()}</h2>
        <VsAiTable deals={status.deals} benchmarks={status.benchmarks} analysis={{ size, day: status.day }} />
        {board ? <Nickname key={board.me?.nickname ?? ''} board={board} onNamed={onNamed} /> : null}
      </section>
    </Panel>
  )
}

/** The table for the current deal of one of the day's tournaments. After its last deal, or when the day
 *  is over, back to that tournament on /daily. */
export function DailyTable() {
  const size = useSearch({ from: '/daily_/play' }).deals ?? DAILY_DEALS
  const navigate = useNavigate()
  const onLeave = () => void navigate({ to: '/daily', search: sizeSearch(size) })
  const [reply, setReply] = useState<DailyReply | null>(null)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  /** The player has tapped the finished trick away (SKATGO-72) — perhaps before its state arrived, the
   *  player's own card being shown at once (SKATGO-73). Until then the steps after it wait. */
  const [release, setRelease] = useState(false)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  /** The deal on the table: it stays put while its settlement is shown, after the server moved on. */
  const [deal, setDeal] = useState(0)
  /** Totals as they stood before the move whose steps are still being shown. */
  const before = useRef<[number, number, number]>([0, 0, 0])

  async function load() {
    const r = await dailyState(size, true)
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

  async function send(move: Move) {
    if (!reply) return
    setSending(true)
    before.current = reply.status.totals
    const r = await dailyAct(size, { day: reply.status.day, deal, revision: reply.revision }, move)
    setSending(false)
    // Refused — a new day began, or this page is behind another tab: take the server's word for where
    // things stand. A deal never restarts; the same cards come back as they were left.
    if (isError(r)) return r.error === 'day_over' ? onLeave() : void load()
    if (!r.steps?.length) return void load()
    if (r.status.finished && !reply.status.finished) track('daily_finished', { deals: size, total: r.status.totals[PLAYER] })
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
  // Until the day's deal comes, the turning logo (SKATGO-93).
  if (!reply || !game) return <TableLoading />
  const busy = sending || queue.length > 0
  return (
    <GameTable
      fullScreen
      tournament={{
        game,
        busy,
        send: (move) => void send(move),
        collect: () => setRelease(true),
        next: () => (reply.status.finished ? onLeave() : void load()),
        deal,
        of: reply.status.of,
        day: reply.status.day,
        totals: busy ? before.current : reply.status.totals,
        deals: reply.status.deals,
        benchmarks: reply.status.benchmarks,
      }}
    />
  )
}

const styles = stylex.create({
  text: { margin: 0, color: color.navy },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x24 },
  // A row of its own, so the button keeps its width instead of stretching across the column.
  action: { display: 'flex' },
  boardHead: { display: 'flex', alignItems: 'center', gap: space.x8 },
  // The board's day arrows: round, the size of a control, quiet until hovered; spent at the last day.
  step: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.control,
    height: dims.control,
    padding: 0,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.pill,
    backgroundColor: { default: color.surface, ':hover': color.page },
    color: color.navy,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  stepOff: { opacity: opacity.iconDisabled, cursor: 'not-allowed', backgroundColor: { default: color.surface, ':hover': color.surface } },
  rank: { minWidth: space.x24 },
  boardHeadRow: { display: 'flex', paddingInline: space.x8, paddingBottom: space.x4 },
  boardRow: { paddingInline: space.x8 },
  mine: { backgroundColor: color.goodSoft, borderRadius: radii.column },
  gap: { marginTop: space.x16 },
  nickForm: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x8 },
  nickRow: { display: 'flex', alignItems: 'center', gap: space.x10, flexWrap: 'wrap' },
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
