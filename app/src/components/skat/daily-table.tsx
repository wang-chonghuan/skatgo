import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { type DailyError, dailyAct, dailyState, isError } from '~/lib/daily-api'
import { contractName } from '~/lib/skat/i18n'
import type { Move, Seat } from '~/lib/skat/game'
import { type DailyReply, type DailyStatus, PLAYER, type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { BOT_DELAY, GameTable, TRICK_DELAY } from './game-table'
import { Btn, Panel, Rich, linkLook } from './ui'

// The daily tournament in the browser (SKATGO-35): the button on /daily that starts or continues the
// day, the day's result once all 12 deals are played, and the table for a deal the server owns. The
// server answers each move with every state the table passed through — the learner's move, then each
// computer move and trick — and the table shows them one by one on its own beats, as if the computers
// were thinking here.

const nameOf = (seat: Seat) => [m.name_you, m.name_lina, m.name_max][seat]()
const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** The start / continue link to the table, or the day's result once it is played. */
export function DailyEntry() {
  const [status, setStatus] = useState<DailyStatus | DailyError | null>(null)
  useEffect(() => {
    void dailyState(false).then((r) => setStatus(isError(r) ? r : r.status))
  }, [])
  if (!status) return null
  if ('error' in status) return <p data-testid="daily-unavailable" {...stylex.props(typography.appText, styles.text)}>{m.daily_unavailable()}</p>
  if (status.finished) return <DailyResult status={status} />
  return (
    <div>
      <Link to="/daily/play" data-testid="daily-cta" {...linkLook('go', 'lg', 'landing')}>
        {status.started ? m.daily_continue({ n: status.deal + 1, of: status.of }) : m.daily_cta()}
      </Link>
    </div>
  )
}

/** The day's 12 deals and the total, as the server recorded them. */
function DailyResult({ status }: { status: DailyStatus }) {
  return (
    <Panel>
      <section data-testid="daily-result" data-total={status.totals[PLAYER]} {...stylex.props(styles.result)}>
        <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.daily_result_title()}</h2>
        <ol {...stylex.props(styles.rows)}>
          {status.deals.map((d, i) => (
            <li key={i} data-testid="daily-result-deal" data-score={d.scores[PLAYER]} {...stylex.props(typography.appText, styles.row)}>
              <span {...stylex.props(styles.muted)}>{m.daily_deal_n({ n: i + 1 })}</span>
              <span {...stylex.props(styles.what)}>
                {d.declarer === null || !d.declaration ? (
                  m.daily_passed_in_short()
                ) : (
                  <Rich text={`${contractName(d.declaration.contract)} · ${nameOf(d.declarer)}`} />
                )}
              </span>
              <span {...stylex.props(styles.score)}>{signed(d.scores[PLAYER])}</span>
            </li>
          ))}
        </ol>
        <p data-testid="daily-result-total" {...stylex.props(typography.panelLabel, styles.total)}>
          <span>{m.daily_total()}</span>
          <span>{signed(status.totals[PLAYER])}</span>
        </p>
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
      }}
    />
  )
}

const styles = stylex.create({
  text: { margin: 0, color: color.navy },
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
  total: { display: 'flex', justifyContent: 'space-between', margin: 0, color: color.navy },
})
