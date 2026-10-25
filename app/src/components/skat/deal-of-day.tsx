import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { type ReactNode, useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { type DailyError, dailyBoard, dailyState, isError } from '~/lib/daily-api'
import { share, shareText } from '~/lib/share'
import { DAILY_TIME_ZONE, DEAL_OF_DAY, type DailyBoard, type DailyStatus, PLAYER } from '~/lib/skat/tournament'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { VsAiTable, Who, signed } from './daily-comparison'
import { Leaderboard } from './daily-table'
import { Btn, Panel, linkLook } from './ui'

// The deal of the day (SKATGO-131, the human: 「每日一副就是一副，每日6副就是6副」): one deal chosen for everyone, played
// once and done, its own board. Its side of /daily: before it is played the way to its table; after, the result —
// the player's score and the AI's, how many played and the player's place, "share" as the one green action — the
// time until the next, today's board with the AI's row, the deal against the AI folded away, and free play.

/** Where the visitor stands with today's deal, and today's board for it. */
function useDealOfDay() {
  const account = useAccount()
  const [status, setStatus] = useState<DailyStatus | DailyError | null>(null)
  const [board, setBoard] = useState<DailyBoard | DailyError | null>(null)
  useEffect(() => {
    if (account === undefined) return
    void dailyState(false, DEAL_OF_DAY).then((r) => setStatus(isError(r) ? r : r.status))
    void dailyBoard(0, DEAL_OF_DAY).then(setBoard)
  }, [account])
  return { status, board, setBoard }
}

/** The front page's main button (SKATGO-131): today's deal's table for whoever has not played it, its result and
 *  place once played. `fallback` is what the server renders: the way to the table. */
export function DealOfDayButton({ fallback }: { fallback: ReactNode }) {
  const { status, board } = useDealOfDay()
  if (!status || isError(status) || !status.finished) return fallback
  const rank = board && !isError(board) ? board.me?.rank ?? null : null
  return (
    <Link to="/daily" data-testid="entry-cta" data-state="done" onClick={() => track('home_cta_clicked', { button: 'primary' })} {...linkLook('go', 'lg', 'landing')}>
      {rank ? m.dod_hero_done({ rank }) : m.dod_hero_done_unranked()}
    </Link>
  )
}

/** The deal of the day's side of /daily. `waiting` stands in while it loads: the server's rendering of the way in. */
export function DealOfDay({ waiting }: { waiting?: ReactNode }) {
  const { status, board, setBoard } = useDealOfDay()
  const [back, setBack] = useState(0)
  const [boards, setBoards] = useState<Partial<Record<number, DailyBoard | DailyError>>>({})
  const shown = back === 0 ? board : boards[back] ?? null
  function show(b: number) {
    setBack(b)
    if (b === 0) void dailyBoard(0, DEAL_OF_DAY).then(setBoard)
    else if (!boards[b]) void dailyBoard(b, DEAL_OF_DAY).then((r) => setBoards((all) => ({ ...all, [b]: r })))
  }
  if (!status) return waiting ?? null
  if ('error' in status) return <p data-testid="daily-unavailable" {...stylex.props(typography.appText, styles.text)}>{m.daily_unavailable()}</p>
  return (
    <div data-testid="dod" data-finished={status.finished ? 'true' : 'false'} {...stylex.props(styles.stack)}>
      {status.finished ? <Result status={status} board={board} /> : <DealOfDayWayIn started={status.started} />}
      <Leaderboard back={back} board={shown} onShow={show} />
      {/* Under the board, as agreed: how the AI played this deal, folded, only for whoever has played it; then free play. */}
      {status.finished ? (
        <>
          <details data-testid="dod-details" {...stylex.props(styles.details)}>
            <summary {...stylex.props(typography.appLink, styles.summary)}>{m.dod_details()}</summary>
            <VsAiTable deals={status.deals} benchmarks={status.benchmarks} openLatest analysis={{ day: status.day, size: DEAL_OF_DAY }} />
          </details>
          <Link to="/play" data-testid="dod-free" {...stylex.props(typography.appLink, styles.link)}>{m.dod_free()}</Link>
        </>
      ) : null}
    </div>
  )
}

/** The way to today's deal's table: its own width so it reads as a button. */
export function DealOfDayWayIn({ started = false }: { started?: boolean }) {
  return (
    <div {...stylex.props(styles.action)}>
      <Link to="/daily/play" search={{ size: DEAL_OF_DAY }} data-testid="dod-cta" {...linkLook('go', 'lg', 'landing')}>
        {started ? m.dod_continue() : m.dod_cta()}
      </Link>
    </div>
  )
}

function Result({ status, board }: { status: DailyStatus; board: DailyBoard | DailyError | null }) {
  const score = status.totals[PLAYER]
  const ai = status.benchmarks?.[0]?.scores[PLAYER] ?? null
  const ranked = board && !isError(board) ? board : null
  const [said, setSaid] = useState<'copied' | 'failed' | null>(null)
  async function onShare() {
    const r = await share(shareText(getLocale(), { day: status.day, score, ai }))
    track('dod_shared', { how: r })
    setSaid(r === 'shared' ? null : r)
  }
  return (
    <Panel>
      <section data-testid="dod-result" data-score={score} data-ai={ai ?? undefined} {...stylex.props(styles.stack)}>
        <h2 {...stylex.props(typography.panelLabel, styles.text)}>{m.dod_result_title()}</h2>
        <div {...stylex.props(styles.scores)}>
          <div {...stylex.props(styles.score)}>
            <span {...stylex.props(typography.landingHeading, styles.text)}>{signed(score)}</span>
            <span {...stylex.props(typography.appText, styles.muted)}><Who side="you" /></span>
          </div>
          {ai === null ? null : (
            <div {...stylex.props(styles.score)}>
              <span {...stylex.props(typography.landingHeading, styles.text)}>{signed(ai)}</span>
              <span {...stylex.props(typography.appText, styles.muted)}><Who side="ai" /></span>
            </div>
          )}
        </div>
        {ranked?.me?.rank ? (
          <p data-testid="dod-rank" data-rank={ranked.me.rank} data-players={ranked.total} {...stylex.props(typography.appText, styles.text)}>
            {m.dod_rank({ n: ranked.total, rank: ranked.me.rank })}
          </p>
        ) : null}
        <div {...stylex.props(styles.action)}>
          <Btn testId="dod-share" size="lg" onClick={() => void onShare()}>{m.dod_share()}</Btn>
        </div>
        {said ? <p role="status" {...stylex.props(typography.small, styles.muted)}>{said === 'copied' ? m.dod_copied() : m.dod_share_failed()}</p> : null}
        <Countdown />
      </section>
    </Panel>
  )
}

/** How long until the next deal of the day: midnight in Berlin, where the days turn. */
function untilNext(now: number): { h: number; min: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: DAILY_TIME_ZONE, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  const at = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const left = 24 * 60 - (at('hour') * 60 + at('minute'))
  return { h: Math.floor(left / 60), min: left % 60 }
}

function Countdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  const { h, min } = untilNext(now)
  return <p data-testid="dod-next" {...stylex.props(typography.appText, styles.muted)}>{m.dod_next({ h, min })}</p>
}

const styles = stylex.create({
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  action: { display: 'flex' },
  text: { margin: 0, color: color.navy },
  muted: { margin: 0, color: color.slate },
  link: { alignSelf: 'flex-start', color: color.info },
  scores: { display: 'flex', gap: space.x32, alignItems: 'flex-end' },
  score: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  details: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  summary: { color: color.info, cursor: 'pointer' },
})
