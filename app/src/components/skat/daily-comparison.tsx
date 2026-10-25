import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { dailyReview } from '~/lib/daily-api'
import { type Card, pointsOf, sameCard } from '~/lib/skat/cards'
import type { Game } from '~/lib/skat/game'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import { type DailySize, type DailyStatus, type DealReview, type DealSummary, type Differ, PLAYER, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Panel, Rich } from './ui'

// The day against the AI (SKATGO-42, SKATGO-48): every deal the player has finished, beside the same deal
// played by the computer in the player's seat against the same two computers — worked out when the day
// was dealt, and shown only once the player has finished that deal.
//
// Since SKATGO-79 every comparison is a score sheet: all three seats' Seeger-Fabian scores, the player's
// deal over the AI's. What is compared and ranked is the player's own Seeger-Fabian score, the standard
// German players know (SKATGO-81, the human: 「按他们习惯的标准来」, and of Saldo: 「saldo都移除吧」). The player is navy and the AI the
// app's blue, its one "AI" tag wherever the AI is named (SKATGO-80, the human: 「AI标志都用app里那个蓝色的
// Ai标志」), so the two lines are told apart at a glance; neither colour judges. A day's row gives both
// scores and opens to its sheet; the rows fold so the table fits a phone without scrolling sideways.

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** The seats' names in the player's deal, and in the AI's, where the AI sits in the player's seat. */
const youNames = () => [m.name_you(), m.name_lina(), m.name_max()]
const aiNames = () => [m.daily_ai(), m.name_lina(), m.name_max()]

/** The seat's part in a deal, as a word under its score. */
function roleOf(d: DealSummary): string {
  if (d.declarer === null) return m.daily_passed_in_short()
  return d.declarer === PLAYER ? m.daily_role_declarer() : m.daily_role_defender()
}

/** The declarer and the game, the outcome with its card points, and what made it big or lost it. */
function playedParts(d: DealSummary, who: string): string[] {
  const decl = d.declaration!
  const game = [
    contractName(decl.contract),
    decl.hand ? 'Hand' : null,
    decl.schneiderAnnounced ? m.announced_schneider() : null,
    decl.schwarzAnnounced ? m.announced_schwarz() : null,
    decl.ouvert ? 'Ouvert' : null,
  ].filter(Boolean).join(' ')
  const parts = [`${who}: ${game}`]
  const outcome = d.won ? m.daily_won() : m.daily_lost()
  const x = d.detail!
  // Null is decided by tricks, not card points.
  parts.push(decl.contract.kind === 'null' ? outcome : `${outcome} ${x.declarerPoints}:${x.defenderPoints}`)
  if (x.schwarz) parts.push('Schwarz')
  else if (x.schneider) parts.push('Schneider')
  if (x.overbid) parts.push(m.daily_overbid())
  return parts
}

/** What a deal was, as the line under its row in a score sheet (SKATGO-79): the declarer, the game and
 *  the bid, won or lost with the card points, and what made it big or lost it — or that all passed. */
export function gameLine(d: DealSummary, names: string[]): string {
  if (d.declarer === null || !d.declaration) return m.daily_passed_in_short()
  const [head, ...rest] = playedParts(d, names[d.declarer])
  return [`${head} (${d.bid})`, ...rest].join(' · ')
}

type Scores = readonly [number, number, number]
type Side = 'you' | 'ai'

/** Whose line it is: the player in navy, the AI in the app's blue (SKATGO-79, SKATGO-80) — the one tag
 *  for the AI in a score sheet, the play record and on the leaderboard. */
export function Who({ side }: { side: Side }) {
  return (
    <span data-who={side} {...stylex.props(typography.badge, styles.whoTag, side === 'you' ? styles.whoYou : styles.whoAi)}>
      {side === 'you' ? m.name_you() : m.daily_ai()}
    </span>
  )
}

/**
 * A score sheet (SKATGO-79): the three seats' Seeger-Fabian scores — of one deal, or a tournament's totals
 * — the player's line over the AI's, the player's own seat marked. `lines` puts what the deal was under
 * each row. The AI's line is missing on days dealt before it played them.
 */
export function ScoreSheet({ mine, ai, lines, testId }: { mine: Scores; ai: Scores | null; lines?: { you: string; ai: string | null }; testId: string }) {
  const seats = [m.daily_col_seat(), m.name_lina(), m.name_max()]
  const rows: [Side, Scores, string | null][] = [['you', mine, lines?.you ?? null], ...(ai ? [['ai', ai, lines?.ai ?? null] as [Side, Scores, string | null]] : [])]
  return (
    <table data-testid={testId} {...stylex.props(styles.scores)}>
        <thead>
          {/* The own seat's shading starts under its name, which stays readable (SKATGO-93, the human: 「your seat 这个字不要被灰色阴影遮住」). */}
          <tr>
            <td />
            {seats.map((name, seat) => (
              <th key={name} scope="col" {...stylex.props(typography.small, styles.scoreHead)}>{name}</th>
            ))}
          </tr>
        </thead>
        {rows.map(([side, scores, line]) => (
          <tbody key={side} data-row={side} data-scores={scores.join(',')}>
            <tr>
              <th scope="row" {...stylex.props(styles.scoreLabel)}><Who side={side} /></th>
              {scores.map((v, seat) => (
                <td key={seat} data-seat={seat} {...stylex.props(typography.appBtnStrong, styles.scoreCell, seat === PLAYER && styles.own)}>{signed(v)}</td>
              ))}
            </tr>
            {line ? (
              <tr>
                <td colSpan={seats.length + 1} data-testid="daily-game-line" {...stylex.props(typography.micro, styles.gameLine)}><Rich text={line} /></td>
              </tr>
            ) : null}
          </tbody>
        ))}
    </table>
  )
}

/**
 * A deal replayed trick by trick (SKATGO-79, the human: 「10墩，每墩谁出了什么（有时序）然后谁赢了，一个10行的
 * 表格」): each trick's three cards in the order they were played, each under its player's name, and who
 * took it with how many card points; under each trick, the player's hand as it was before it (「每trick都要
 * 显示打这个trick前我手里的牌」). The player's own cards are bold. `differs` puts the AI's card under the
 * player's wherever it would have played another — card first, so the column stays cards (the human:
 * 「AI和AI打的牌，换个位置，这样纵向就都是牌了」) — and marks the trick of the furthest. Tricks a claim or a
 * concession left unplayed are not rows, only a line under them.
 */
export function TrickReplay({ tricks, names, skat, hand, differs = null, early = null }: { tricks: Game['tricks']; names: string[]; skat?: Card[]; hand?: Card[]; differs?: Differ[] | null; early?: Game['early'] | null }) {
  const played = early ? tricks.slice(0, early.from) : tricks
  const worst = differs?.[0]?.trick ?? null
  const ai = new Map((differs ?? []).map((d) => [d.trick, d.best]))
  // What the player held before a trick: the hand they began with, less the cards of the tricks before.
  const before = (i: number) => (hand ?? []).filter((c) => !tricks.slice(0, i).some((t) => t.cards.some((p) => p.seat === PLAYER && sameCard(p.card, c))))
  // That hand is shown for one trick at a time, the one tapped; a tap anywhere else folds it away (SKATGO-100, the
  // human: 「只有用户点击那一行时，才显示出来，而且点击别处就折叠回去，只能显示一个」). No icon says so.
  const [shown, setShown] = useState<number | null>(null)
  const rows = useRef<HTMLTableElement>(null)
  useEffect(() => {
    if (shown === null) return
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('[data-trick]') || !rows.current?.contains(e.target as Node)) setShown(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [shown])
  return (
    <div {...stylex.props(styles.replay)}>
      <table ref={rows} data-testid="daily-replay" data-tricks={played.length} {...stylex.props(styles.replayTable)}>
        <thead>
          <tr>
            <th scope="col" {...stylex.props(typography.micro, styles.replayHead)}>{m.daily_replay_trick()}</th>
            {[1, 2, 3].map((n) => <th key={n} scope="col" {...stylex.props(typography.micro, styles.replayHead)}>{n}.</th>)}
            <th scope="col" {...stylex.props(typography.micro, styles.replayHead, styles.end)}>{m.daily_replay_winner()}</th>
          </tr>
        </thead>
        {played.map((t, i) => {
          const n = i + 1
          const marked = worst === n
          const best = ai.get(n)
          const held = before(i)
          return (
            <tbody
              key={i}
              data-trick={n}
              data-highlight={marked ? 'true' : undefined}
              aria-expanded={held.length ? shown === n : undefined}
              onClick={held.length ? () => setShown((s) => (s === n ? null : n)) : undefined}
              {...stylex.props(styles.replayRow, marked && styles.replayMarked, held.length > 0 && styles.replayTap)}
            >
              <tr data-winner={t.winner}>
                <td {...stylex.props(typography.small, styles.muted, styles.replayCell)}>{n}</td>
                {t.cards.map((p, k) => (
                  <td key={k} data-seat={p.seat} {...stylex.props(styles.replayCell)}>
                    <span {...stylex.props(typography.micro, styles.muted, styles.replayName)}>{names[p.seat]}</span>
                    <span {...stylex.props(p.seat === PLAYER ? typography.smallBold : typography.small, styles.replayCard)}><Rich text={cardLabel(p.card)} /></span>
                    {p.seat === PLAYER && best ? (
                      <span data-testid="daily-replay-ai" data-card={`${best.suit}${best.rank}`} {...stylex.props(typography.small, styles.replayAi)}>
                        <Rich text={cardLabel(best)} />
                        <Who side="ai" />
                      </span>
                    ) : null}
                  </td>
                ))}
                <td {...stylex.props(typography.small, styles.replayCell, styles.end)}>{m.daily_replay_points({ name: names[t.winner], points: pointsOf(t.cards.map((p) => p.card)) })}</td>
              </tr>
              {held.length && shown === n ? (
                <tr>
                  <td />
                  <td colSpan={t.cards.length + 1} data-testid="daily-replay-hand" data-cards={held.length} {...stylex.props(typography.micro, styles.replayHand)}>
                    <span {...stylex.props(styles.muted)}>{m.daily_replay_hand()}</span> <Rich text={held.map(cardLabel).join(' ')} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          )
        })}
      </table>
      {early ? <p {...stylex.props(typography.micro, styles.muted, styles.sheetNote)}>{m.daily_replay_rest({ n: 10 - early.from })}</p> : null}
      {skat?.length ? (
        <p {...stylex.props(typography.small, styles.sheetNote)}>
          <span {...stylex.props(styles.muted)}>{m.result_skat()}</span> <Rich text={skat.map(cardLabel).join(' ')} />
        </p>
      ) : null}
    </div>
  )
}

/** Fetches a finished deal's review: the deal trick by trick, and where the player's cards were not the AI's. */
export type AskReview = () => Promise<DealReview | { error: string }>

/** A deal of one of today's tournaments, reviewed through /api/daily. */
export const dailyAsk = (deal: number, size?: DailySize): AskReview => () => dailyReview(deal, size)

/** What this page already fetched, so reopening a deal does not ask again. */
const reviews = new Map<string, DealReview>()

/**
 * A finished deal's play record, open (SKATGO-79, the human: 「本次牌谱要显示出来，不要折叠，用专业名词说
 * 这个牌谱」): the move most worth improving in one line on top, then the deal trick by trick with the
 * player's hand before each and the AI's card wherever it would have played another — at once, with no
 * button (the human: 「不需要按钮就直接打开」) — and the skat. Every word of it is
 * SkatZero's choice and the rules engine's record; no model explains it (the human: 「解读太麻烦了」). `deal`
 * is the deal when the page has it (the settlement), shown while the AI's cards are fetched.
 */
export function DealAnalysis({ testId = 'daily-play-record', ...rest }: AnalysisProps & { testId?: string }) {
  return (
    <section data-testid={testId} {...stylex.props(styles.record)}>
      <h3 {...stylex.props(typography.panelLabel, styles.recordTitle)}>{m.daily_replay()}</h3>
      <AnalysisBody {...rest} />
    </section>
  )
}

type AnalysisProps = {
  deal?: Pick<DealReview, 'tricks' | 'skat' | 'early' | 'hand'>
  names?: string[]
  ask: AskReview
  cacheKey?: string
}

function AnalysisBody({ deal, names, ask, cacheKey }: AnalysisProps) {
  const [review, setReview] = useState<DealReview | null>(cacheKey ? (reviews.get(cacheKey) ?? null) : null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (review) return
    void ask().then((r) => {
      if ('error' in r) return setFailed(true)
      if (cacheKey) reviews.set(cacheKey, r)
      setReview(r)
    })
    // Once, when the record is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const record = deal ?? review
  const differs = review?.differs ?? null
  const w = differs?.[0] ?? null
  return (
    <div {...stylex.props(styles.analysis)}>
      {differs ? (
        <div
          data-testid="daily-review-result"
          data-trick={w?.trick ?? ''}
          data-played={w ? `${w.played.suit}${w.played.rank}` : ''}
          data-best={w ? `${w.best.suit}${w.best.rank}` : ''}
          data-differs={differs.length}
          {...stylex.props(styles.review)}
        >
          <p {...stylex.props(typography.note, styles.reviewLine)}>
            <Rich text={w ? m.daily_review_card({ trick: w.trick, played: cardLabel(w.played), best: cardLabel(w.best) }) : m.daily_review_clean()} />
          </p>
          {w ? <p {...stylex.props(typography.micro, styles.muted, styles.sheetNote)}>{m.daily_review_marks()}</p> : null}
          {/* Where to practise it (SKATGO-82; the exercises since SKATGO-103): in a new tab, so a table or a game
              stays where it is. */}
          <Link to="/skat-tricks" target="_blank" rel="noopener" data-testid="tricks-more-link" {...stylex.props(typography.note, styles.tricksLink)}>
            {m.tricks_more_link()}
          </Link>
        </div>
      ) : failed ? (
        <p role="alert" {...stylex.props(typography.note, styles.muted)}>{m.daily_review_failed()}</p>
      ) : null}
      {record ? (
        <TrickReplay tricks={record.tricks} names={names ?? youNames()} skat={record.skat} hand={record.hand} differs={differs} early={record.early} />
      ) : failed ? null : (
        <p {...stylex.props(typography.note, styles.muted)}>{m.loading()}</p>
      )}
    </div>
  )
}

/**
 * One deal, the player against the AI (SKATGO-57, a score sheet since SKATGO-79): the three seats' scores
 * in the player's deal over the AI's, and under each what the deal was. What happened
 * trick by trick is the analysis beside it (`DealAnalysis`).
 */
/**
 * A finished free game against the AI (SKATGO-86): the same score sheet as a daily deal's, the player's
 * deal at once and the AI's from the player's seat once the review that works it out arrives. `ask` is the
 * game's review, asked once; the play record shares it.
 */
export function FreeVsAi({ mine, ask }: { mine: DealSummary; ask: AskReview }) {
  const [ai, setAi] = useState<DealSummary | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    void ask().then((r) => ('error' in r || !r.ai ? setFailed(true) : setAi(r.ai)))
    // Once, when the result is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div data-testid="free-vs-ai" data-state={ai ? 'ready' : failed ? 'failed' : 'loading'} {...stylex.props(styles.analysis)}>
      <DealVsAi mine={mine} ai={ai} />
      {ai ? null : (
        <p role={failed ? 'alert' : undefined} {...stylex.props(typography.note, styles.muted)}>{failed ? m.free_ai_failed() : m.free_ai_loading()}</p>
      )}
    </div>
  )
}

export function DealVsAi({ mine, ai }: { mine: DealSummary; ai: DealSummary | null }) {
  return (
    <section
      data-testid="daily-deal-vs-ai"
      data-you={mine.scores[PLAYER]}
      data-ai={ai ? ai.scores[PLAYER] : ''}
      {...stylex.props(styles.deal)}
    >
      <ScoreSheet testId="daily-deal-scores" mine={mine.scores} ai={ai ? ai.scores : null} lines={{ you: gameLine(mine, youNames()), ai: ai ? gameLine(ai, aiNames()) : null }} />
    </section>
  )
}

/**
 * The day's deals on /daily while the day runs (SKATGO-63): every one of them, so a visitor sees at a
 * glance how many there are — the finished ones against the AI, the rest by number only. Without a
 * status (on the server, and while it loads) every deal is still to play.
 */
export function DayDeals({ of, status }: { of: number; status?: DailyStatus }) {
  return (
    <Panel>
      <section data-testid="daily-so-far" {...stylex.props(styles.day)}>
        <h2 {...stylex.props(typography.panelLabel, styles.dayTitle)}>{m.daily_play_title()}</h2>
        <VsAiTable
          deals={status?.deals ?? []}
          benchmarks={status?.benchmarks}
          of={of}
          current={status?.started ? status.deal : null}
          analysis={status ? { day: status.day } : undefined}
          openLatest
        />
      </section>
    </Panel>
  )
}

/** The running comparison on /daily: one foldable row per finished deal, the player's Seeger-Fabian score
 *  against the AI's in their seat (SKATGO-81), opening to that deal's score sheet and its analysis; under the rows the score sheet
 *  of the whole tournament so far. `openLatest` opens the newest row, on the day's page while it runs.
 *  `of` (SKATGO-63): the day's number of deals; those not finished follow as rows of their number and
 *  whether they are `current` or still to play — nothing of their cards, which every player shares.
 *  `analysis`: the tournament and day whose finished deals can be gone through. */
export function VsAiTable({ deals, benchmarks, openLatest = false, of, current = null, analysis }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; openLatest?: boolean; of?: number; current?: number | null; analysis?: { day: string; size?: DailySize } }) {
  const latest = deals.length - 1
  const [open, setOpen] = useState<number[]>(openLatest ? [latest] : [])
  useEffect(() => {
    if (openLatest) setOpen([latest])
  }, [openLatest, latest])
  if (deals.length === 0 && !of) return null
  const ahead = Array.from({ length: Math.max(0, (of ?? 0) - deals.length) }, (_, k) => deals.length + k)
  const ai = deals.map((_, i) => benchmarks?.[i] ?? null)
  const aiTotals = ai.every((b) => b) ? totals(ai as DealSummary[]) : null
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((j) => j !== i) : [...o, i]))
  return (
    <div data-testid="daily-vs-ai" data-rows={deals.length} data-of={of ?? deals.length} {...stylex.props(styles.table)}>
      <div aria-hidden="true" {...stylex.props(styles.grid, styles.head)}>
        <span {...stylex.props(typography.small)}>{m.daily_col_deal()}</span>
        <span {...stylex.props(styles.headWho)}><Who side="you" /><span {...stylex.props(typography.micro)}>{m.daily_points()}</span></span>
        <span {...stylex.props(styles.headWho)}><Who side="ai" /><span {...stylex.props(typography.micro)}>{m.daily_points()}</span></span>
        <span />
      </div>
      <ol {...stylex.props(styles.list)}>
        {deals.map((d, i) => {
          const b = ai[i]
          const isOpen = open.includes(i)
          const id = `daily-deal-${i}`
          // The row's four columns; a foldable row's last one carries its chevron.
          const cells = (chevron: ReactNode) => (
            <>
              <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
              <Score score={d.scores[PLAYER]} role={roleOf(d)} />
              {b ? <Score score={b.scores[PLAYER]} role={roleOf(b)} /> : <span {...stylex.props(typography.small, styles.muted)}>–</span>}
              <span {...stylex.props(styles.chevron)}>{chevron}</span>
            </>
          )
          return (
            <li key={i} data-testid="daily-vs-ai-row" data-you={d.scores[PLAYER]} data-ai={b ? b.scores[PLAYER] : ''} {...stylex.props(styles.item)}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                aria-label={m.daily_show_deal({ n: i + 1 })}
                data-testid="daily-vs-ai-toggle"
                onClick={() => toggle(i)}
                {...stylex.props(styles.grid, styles.row)}
              >
                {cells(isOpen ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />)}
              </button>
              {isOpen ? (
                <div id={id} data-testid="daily-vs-ai-detail" {...stylex.props(styles.detail)}>
                  <DealVsAi mine={d} ai={b} />
                  {analysis && d.declarer !== null ? (
                    <DealAnalysis ask={dailyAsk(i, analysis.size)} cacheKey={`${analysis.day}|${analysis.size ?? 6}|${i}`} />
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
        {ahead.map((i) => (
          <li key={i} data-testid="daily-vs-ai-ahead" data-state={i === current ? 'current' : 'open'} {...stylex.props(styles.item)}>
            <div {...stylex.props(styles.grid, styles.flatRow)}>
              <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
              <span {...stylex.props(typography.small, styles.muted)}>{i === current ? m.daily_deal_current() : m.daily_deal_open()}</span>
              <span {...stylex.props(typography.small, styles.muted)}>–</span>
              <span />
            </div>
          </li>
        ))}
      </ol>
      {deals.length === 0 ? null : (
        <div data-testid="daily-vs-ai-total" data-you={totals(deals)[PLAYER]} data-ai={aiTotals ? aiTotals[PLAYER] : ''} {...stylex.props(styles.total)}>
          <span {...stylex.props(typography.smallBold)}>{m.daily_total()}</span>
          <ScoreSheet testId="daily-total-scores" mine={totals(deals)} ai={aiTotals} />
        </div>
      )}
    </div>
  )
}

function Score({ score, role }: { score: number; role: string }) {
  return (
    <span {...stylex.props(styles.cell)}>
      <span {...stylex.props(typography.appBtnStrong)}>{signed(score)}</span>
      <span {...stylex.props(typography.micro, styles.muted, styles.role)}>{role}</span>
    </span>
  )
}

const styles = stylex.create({
  day: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  dayTitle: { margin: 0, color: color.navy },
  deal: { display: 'flex', flexDirection: 'column', gap: space.x12, color: color.navy },
  // All three seats, the player's deal over the AI's.
  scores: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  scoreHead: { paddingBottom: space.x4, textAlign: 'center', color: color.slate },
  scoreLabel: { paddingInlineEnd: space.x8, textAlign: 'start', color: color.slate, whiteSpace: 'nowrap' },
  scoreCell: { paddingBlock: space.x4, textAlign: 'center' },
  // The player's seat is the one the comparison is about.
  own: { backgroundColor: color.page },
  sheetNote: { margin: 0 },
  // What the deal was, under its row: quiet, one line, never wider than the sheet.
  gameLine: { paddingBottom: space.x6, color: color.slate, overflowWrap: 'anywhere' },
  analysis: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  record: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  recordTitle: { margin: 0, color: color.navy },
  replay: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  replayTable: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  replayHead: { paddingBottom: space.x4, textAlign: 'start', color: color.slate },
  replayRow: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  // The trick of the move most worth improving, on the app's pink (the human: 「那一行标红背景，就是本app常用
  // 那种粉红的背景」).
  replayMarked: { backgroundColor: color.badSoft },
  replayTap: { cursor: 'pointer' },
  replayCell: { paddingBlock: space.x4, paddingInlineEnd: space.x6, verticalAlign: 'top' },
  replayName: { display: 'block' },
  replayCard: { display: 'block', color: color.navy },
  // The AI's card under the player's, its tag after it.
  replayAi: { display: 'flex', alignItems: 'center', gap: space.x4, marginTop: space.x2, color: color.navy, whiteSpace: 'nowrap' },
  // The hand before the trick, quiet under its row.
  replayHand: { paddingBottom: space.x6, color: color.navy, overflowWrap: 'anywhere' },
  whoTag: { display: 'inline-block', paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill, color: color.onColor },
  whoYou: { backgroundColor: color.navy },
  whoAi: { backgroundColor: color.info },
  review: { display: 'flex', flexDirection: 'column', gap: space.x6, padding: space.x10, borderRadius: radii.column, backgroundColor: color.page },
  reviewLine: { margin: 0, color: color.navy },
  tricksLink: {
    alignSelf: 'flex-start',
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  table: { display: 'flex', flexDirection: 'column', color: color.navy },
  // Deal, you, the AI, the difference: the same columns in the header, every row and the total.
  grid: {
    display: 'grid',
    gridTemplateColumns: dims.vsAiColumns,
    alignItems: 'center',
    columnGap: { default: space.x12, [bp.phone]: space.x8 },
    paddingInline: space.x8,
  },
  head: { paddingBottom: space.x6, color: color.slate },
  list: { margin: 0, padding: 0, listStyleType: 'none' },
  item: {
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  row: {
    width: '100%',
    paddingBlock: space.x8,
    borderWidth: 0,
    borderRadius: radii.column,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.navy,
    textAlign: 'start',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  flatRow: { paddingBlock: space.x8 },
  cell: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  // A narrow column (the table inside the settlement on a phone) shortens the role, never overlaps it.
  role: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  // On a phone a column is too narrow for the tag and its word side by side: the word goes under it (SKATGO-119).
  headWho: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: space.x6, rowGap: space.x2, minWidth: 0 },
  end: { textAlign: 'end' },
  muted: { color: color.slate },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    marginBottom: space.x8,
    padding: space.x10,
    borderRadius: radii.column,
    backgroundColor: color.page,
  },
  total: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    paddingTop: space.x8,
    borderTopWidth: border.tile,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
})
