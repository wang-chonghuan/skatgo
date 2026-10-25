import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { Link as LinkIcon, Share2 } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { track } from '~/lib/analytics'
import { type DailyError, dailyBoard, dailyState, isError } from '~/lib/daily-api'
import { type Platform, cardUrl, platformLinks, shareSheet, shareText, shareUrl } from '~/lib/share'
import { shareCode } from '~/lib/share-api'
import { DAILY_TIME_ZONE, DEAL_OF_DAY, type DailyBoard, type DailyStatus, PLAYER } from '~/lib/skat/tournament'
import { useAccount } from '~/lib/use-account'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { icon } from '../../theme/constants'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { BrandIcon } from './brand-icon'
import { VsAiTable } from './daily-comparison'
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
      {status.finished ? <Result status={status} /> : <DealOfDayWayIn started={status.started} />}
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

function Result({ status }: { status: DailyStatus }) {
  const score = status.totals[PLAYER]
  const ai = status.benchmarks?.[0]?.scores[PLAYER] ?? null
  const [said, setSaid] = useState<'copied' | 'failed' | null>(null)
  // The result's code (SKATGO-132): the link carries it, never the score.
  const [code, setCode] = useState<string | null>(null)
  useEffect(() => {
    void shareCode().then((r) => setCode('error' in r ? null : r.code))
  }, [])
  const locale = getLocale()
  const text = shareText(locale, { day: status.day, score })
  async function onShare(via: Platform) {
    if (!code) return
    const r = await shareSheet(text, shareUrl(locale, code, via))
    track('dod_shared', { how: r === 'shared' ? 'sheet' : r === 'copied' ? 'copy' : 'failed' })
    setSaid(r === 'shared' ? null : r)
  }
  async function onCopy() {
    if (!code) return
    const done = await navigator.clipboard.writeText(`${text} ${shareUrl(locale, code, 'copy')}`).then(() => true, () => false)
    track('dod_shared', { how: done ? 'copy' : 'failed' })
    setSaid(done ? 'copied' : 'failed')
  }
  const links = code ? platformLinks(locale, code, text) : null
  return (
    <Panel>
      <section data-testid="dod-result" data-score={score} data-ai={ai ?? undefined} {...stylex.props(styles.stack)}>
        {/* What is done and what sharing is for — no scores here, the card below has them (the human: 「我不懂你显示这些垃圾
            干什么……你完成了same one deal today, 分享给朋友，看看他们能打几分」). */}
        <div {...stylex.props(styles.head)}>
          <h2 {...stylex.props(typography.dialogTitle, styles.text)}>{m.dod_result_title()}</h2>
          <p {...stylex.props(typography.appText, styles.muted)}>{m.dod_result_lead()}</p>
        </div>
        <div {...stylex.props(styles.action)}>
          <Btn testId="dod-share" size="lg" disabled={!code} onClick={() => void onShare('sheet')}>
            <Share2 aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
            {m.dod_share()}
          </Btn>
        </div>
        {/* Each platform its own way out, with its mark (the human: 「whatsapp, instagram, facebook, telegram, x」, then
            「picture不要了，不分享instagram。全部都要图标」), white, so "share" stays the one green action. */}
        {links ? (
          <div data-testid="dod-platforms" {...stylex.props(styles.platforms)}>
            {(['whatsapp', 'facebook', 'telegram', 'x'] as const).map((p) => (
              <a key={p} href={links[p]} target="_blank" rel="noopener noreferrer" data-testid={`share-${p}`} onClick={() => track('dod_shared', { how: p })} {...linkLook('quiet', 'sm')}>
                <BrandIcon brand={p} />
                {PLATFORM_NAME[p]}
              </a>
            ))}
            <button type="button" data-testid="share-copy" onClick={() => void onCopy()} {...linkLook('quiet', 'sm')}>
              <LinkIcon aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
              {m.share_copy()}
            </button>
          </div>
        ) : null}
        {said ? <p role="status" {...stylex.props(typography.small, styles.muted)}>{said === 'copied' ? m.dod_copied() : m.dod_share_failed()}</p> : null}
        {/* The card the link goes out with, under the buttons, so it is seen before it is sent (the human: 「最好让用户看到待
            显示的卡片，再可以点发送，分享按钮可以在页面上面显示，下面是待分享的卡片」). */}
        {code ? <img data-testid="dod-card" src={cardUrl(locale, code)} alt={m.share_card_alt()} {...stylex.props(styles.card)} /> : null}
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

/** The platforms by their own names, the same in every language. */
const PLATFORM_NAME = { whatsapp: 'WhatsApp', facebook: 'Facebook', telegram: 'Telegram', x: 'X' }

const styles = stylex.create({
  platforms: { display: 'flex', flexWrap: 'wrap', gap: space.x8 },
  stack: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  action: { display: 'flex' },
  text: { margin: 0, color: color.navy },
  muted: { margin: 0, color: color.slate },
  link: { alignSelf: 'flex-start', color: color.info },
  head: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  details: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  card: {
    display: 'block',
    width: '100%',
    maxWidth: dims.shareCard,
    aspectRatio: dims.shareCardRatio,
    boxSizing: 'border-box',
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.panel,
    backgroundColor: color.surface,
  },
  summary: { color: color.info, cursor: 'pointer' },
})
