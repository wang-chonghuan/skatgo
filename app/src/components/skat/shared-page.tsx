import * as stylex from '@stylexjs/stylex'
import { Link, useLoaderData, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

import { track } from '~/lib/analytics'
import { type PracticeReply, type Shared, practiceAct, practiceNew, readShared } from '~/lib/share-api'
import type { Move } from '~/lib/skat/game'
import { DEAL_OF_DAY, PLAYER, type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart } from './client-part'
import { Who, signed } from './daily-comparison'
import { BOT_DELAY, GameTable } from './game-table'
import { TableLoading } from './table-loading'
import { Panel, linkLook } from './ui'

// A shared deal of the day (SKATGO-132, the human: 「别人看到，点击就能也打这一副牌」): the result shared — no name — and
// the challenge; on its day the way to that day's deal, ranked; after it the same deal as practice, on no board
// (「过期的牌开放练习」). Rendered on the server from the code, so the messengers' previews read it.

const dateOf = (day: string) => new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

export function SharedPage() {
  const shared = useLoaderData({ from: '/d/$code' })
  const { code } = useParams({ from: '/d/$code' })
  useEffect(() => {
    const via = new URLSearchParams(window.location.search).get('via')
    track('dod_share_opened', { via: via ?? 'direct', today: !!shared?.today })
  }, [shared])
  return (
    <div data-testid="shared" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.shared_title()}</h1>
        {shared ? (
          <>
            <p {...stylex.props(typography.landingBody, styles.lead)}>{m.shared_lead({ date: dateOf(shared.day) })}</p>
            <Panel>
              <div data-testid="shared-result" data-day={shared.day} data-score={shared.score} {...stylex.props(styles.scores)}>
                <div {...stylex.props(styles.score)}>
                  <span {...stylex.props(typography.landingHeading, styles.title)}>{signed(shared.score)}</span>
                  <span {...stylex.props(typography.appText, styles.muted)}>{m.shared_who()}</span>
                </div>
                {shared.ai === null ? null : (
                  <div {...stylex.props(styles.score)}>
                    <span {...stylex.props(typography.landingHeading, styles.title)}>{signed(shared.ai)}</span>
                    <span {...stylex.props(typography.appText, styles.muted)}><Who side="ai" /></span>
                  </div>
                )}
              </div>
            </Panel>
            {shared.today ? (
              <div {...stylex.props(styles.action)}>
                <Link to="/daily/play" search={{ size: DEAL_OF_DAY }} data-testid="shared-play" data-mode="today" {...linkLook('go', 'lg', 'landing')}>{m.dod_hero()}</Link>
              </div>
            ) : (
              <>
                <div {...stylex.props(styles.action)}>
                  <Link to="/d/$code/play" params={{ code }} data-testid="shared-play" data-mode="practice" {...linkLook('go', 'lg', 'landing')}>{m.shared_practice()}</Link>
                </div>
                <p {...stylex.props(typography.appText, styles.muted)}>{m.shared_practice_note({ date: dateOf(shared.day) })}</p>
                <Link to="/daily" {...stylex.props(typography.appLink, styles.link)}>{m.shared_today()}</Link>
              </>
            )}
          </>
        ) : (
          <>
            <p data-testid="shared-missing" {...stylex.props(typography.landingBody, styles.lead)}>{m.shared_missing()}</p>
            <div {...stylex.props(styles.action)}>
              <Link to="/daily" {...linkLook('go', 'lg', 'landing')}>{m.dod_hero()}</Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

/** The practice table's page: the whole screen, the table in the browser. */
export function PracticePage() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.practice_title()}</h1>
      <ClientPart fallback={<TableLoading />}>
        <PracticeTable />
      </ClientPart>
    </div>
  )
}

/** A past day's deal of the day played as practice: dealt anew from a sealed token, nothing kept; at its end the
 *  player's score beside the shared one and the AI's. */
function PracticeTable() {
  const { code } = useParams({ from: '/d_/$code/play' })
  const [shared, setShared] = useState<Shared | null | undefined>(undefined)
  const [reply, setReply] = useState<PracticeReply | null>(null)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  const [release, setRelease] = useState(false)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [over, setOver] = useState(false)
  function take(r: PracticeReply) {
    setReply(r)
    setShown(r.steps[0])
    setQueue(r.steps.slice(1))
  }
  useEffect(() => {
    void readShared(code).then(async (s) => {
      setShared(s)
      if (!s || s.today) return
      const r = await practiceNew(s.day)
      if ('error' in r) return setFailed(true)
      take(r)
    })
  }, [code])
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
  // Once the last trick is shown, the result stands a moment on the felt, then the comparison.
  const done = !!reply?.result && queue.length === 0
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setOver(true), PRACTICE_PAUSE)
    return () => clearTimeout(t)
  }, [done])
  async function send(move: Move) {
    if (!reply) return
    setSending(true)
    const r = await practiceAct(reply.token, reply.revision, move)
    setSending(false)
    if ('error' in r) return setFailed(true)
    take(r)
  }
  const game = useMemo(() => (shown ? gameFromView(shown) : null), [shown])
  if (shared === null || shared?.today || failed) {
    return (
      <div {...stylex.props(styles.summary)}>
        <Panel tone="bad">
          <p role="alert" {...stylex.props(typography.appText, styles.title)}>{shared?.today ? m.shared_today_ranked() : m.shared_missing()}</p>
          <Link to="/daily" {...linkLook('go', 'md')}>{m.dod_hero()}</Link>
        </Panel>
      </div>
    )
  }
  if (over && reply?.result && shared) {
    const mine = reply.result.mine.scores[PLAYER]
    const ai = reply.result.ai?.scores[PLAYER] ?? null
    return (
      <div {...stylex.props(styles.summary)}>
        <Panel>
          <section data-testid="practice-result" data-score={mine} {...stylex.props(styles.stack)}>
            <h2 {...stylex.props(typography.dialogTitle, styles.title)}>{m.practice_result_title()}</h2>
            <div {...stylex.props(styles.scores)}>
              <div {...stylex.props(styles.score)}>
                <span {...stylex.props(typography.landingHeading, styles.title)}>{signed(mine)}</span>
                <span {...stylex.props(typography.appText, styles.muted)}><Who side="you" /></span>
              </div>
              <div {...stylex.props(styles.score)}>
                <span {...stylex.props(typography.landingHeading, styles.title)}>{signed(shared.score)}</span>
                <span {...stylex.props(typography.appText, styles.muted)}>{m.shared_who()}</span>
              </div>
              {ai === null ? null : (
                <div {...stylex.props(styles.score)}>
                  <span {...stylex.props(typography.landingHeading, styles.title)}>{signed(ai)}</span>
                  <span {...stylex.props(typography.appText, styles.muted)}><Who side="ai" /></span>
                </div>
              )}
            </div>
            <div {...stylex.props(styles.actions)}>
              <Link to="/daily" {...linkLook('go', 'md')}>{m.dod_hero()}</Link>
              <Link to="/d/$code" params={{ code }} {...linkLook('quiet', 'md')}>{m.practice_back()}</Link>
            </div>
          </section>
        </Panel>
      </div>
    )
  }
  if (!reply || !game) return <TableLoading />
  return (
    <GameTable
      fullScreen
      server={{
        game,
        busy: sending || queue.length > 0,
        send: (move) => void send(move),
        collect: () => setRelease(true),
        next: () => setOver(true),
      }}
    />
  )
}

/** How long a practice deal's result stands on the felt before the comparison, as the deal of the day's (SKATGO-131). */
const PRACTICE_PAUSE = 1800

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  hidden: {
    position: 'absolute',
    width: dims.visuallyHidden,
    height: dims.visuallyHidden,
    margin: 0,
    overflow: 'hidden',
    clipPath: dims.visuallyHiddenClip,
    whiteSpace: 'nowrap',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  summary: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: space.x16, maxWidth: dims.readingColumn, marginInline: 'auto', width: '100%', boxSizing: 'border-box' },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  action: { display: 'flex' },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  muted: { margin: 0, color: color.slate },
  link: { alignSelf: 'flex-start', color: color.info },
  scores: { display: 'flex', flexWrap: 'wrap', gap: space.x32, alignItems: 'flex-end' },
  score: { display: 'flex', flexDirection: 'column', gap: space.x4 },
})
