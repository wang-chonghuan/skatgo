import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { dailyReview } from '~/lib/daily-api'
import { type Card, pointsOf } from '~/lib/skat/cards'
import type { Game } from '~/lib/skat/game'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import { type DailyStatus, type DealReview, type DealSummary, PLAYER, dailySize, saldo, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Btn, Panel, Rich } from './ui'

// The day against the AI (SKATGO-42, SKATGO-48): every deal the player has finished, beside the same deal
// played by the computer in the player's seat against the same two computers — worked out when the day
// was dealt, and shown only once the player has finished that deal.
//
// Since SKATGO-79 every comparison is a score sheet: all three seats' Seeger-Fabian scores, the player's
// deal over the AI's, and each side's Saldo — how far that seat is ahead of the two opponents — because a
// seat's own score says nothing about how it did against the table. The player is navy and the AI orange,
// two of the theme's own colours (the human: 「当前的主题色就是：橙色，红色，海军蓝，绿色」), so the two
// lines are told apart at a glance; neither colour judges. A day's row gives both Saldo and opens to its
// sheet; the rows fold so the table fits a phone without scrolling sideways.

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

/** Whose line it is: the player in navy, the AI in orange (SKATGO-79). */
function Who({ side }: { side: Side }) {
  return (
    <span data-who={side} {...stylex.props(typography.badge, styles.whoTag, side === 'you' ? styles.whoYou : styles.whoAi)}>
      {side === 'you' ? m.name_you() : m.daily_ai()}
    </span>
  )
}

/**
 * A score sheet (SKATGO-79): the three seats' Seeger-Fabian scores — of one deal, or a tournament's totals
 * — the player's line over the AI's, with each line's Saldo, the number that says how they did against the
 * table, largest. `lines` puts what the deal was under each row; what Saldo means opens from its heading.
 * The AI's line is missing on days dealt before it played them.
 */
export function ScoreSheet({ mine, ai, lines, testId }: { mine: Scores; ai: Scores | null; lines?: { you: string; ai: string | null }; testId: string }) {
  const [why, setWhy] = useState(false)
  const seats = [m.daily_col_seat(), m.name_lina(), m.name_max()]
  const rows: [Side, Scores, string | null][] = [['you', mine, lines?.you ?? null], ...(ai ? [['ai', ai, lines?.ai ?? null] as [Side, Scores, string | null]] : [])]
  return (
    <div {...stylex.props(styles.sheet)}>
      <table data-testid={testId} {...stylex.props(styles.scores)}>
        <thead>
          <tr>
            <td />
            {seats.map((name, seat) => (
              <th key={name} scope="col" {...stylex.props(typography.small, styles.scoreHead, seat === PLAYER && styles.own)}>{name}</th>
            ))}
            <th scope="col" {...stylex.props(styles.scoreHead, styles.saldo)}>
              <button type="button" aria-expanded={why} data-testid="daily-saldo-why" onClick={() => setWhy((w) => !w)} {...stylex.props(typography.smallBold, styles.saldoWhy)}>
                {m.daily_saldo()} ?
              </button>
            </th>
          </tr>
        </thead>
        {rows.map(([side, scores, line]) => (
          <tbody key={side} data-row={side} data-scores={scores.join(',')} data-saldo={saldo(scores)}>
            <tr>
              <th scope="row" {...stylex.props(styles.scoreLabel)}><Who side={side} /></th>
              {scores.map((v, seat) => (
                <td key={seat} data-seat={seat} {...stylex.props(typography.appBtnStrong, styles.scoreCell, seat === PLAYER && styles.own)}>{signed(v)}</td>
              ))}
              <td data-testid="daily-saldo" {...stylex.props(typography.dialogTitle, styles.scoreCell, styles.saldo)}>{signed(saldo(scores))}</td>
            </tr>
            {line ? (
              <tr>
                <td colSpan={seats.length + 2} data-testid="daily-game-line" {...stylex.props(typography.micro, styles.gameLine)}><Rich text={line} /></td>
              </tr>
            ) : null}
          </tbody>
        ))}
      </table>
      {why ? <p data-testid="daily-saldo-note" {...stylex.props(typography.micro, styles.muted, styles.sheetNote)}>{m.daily_saldo_note()}</p> : null}
    </div>
  )
}

/**
 * A deal replayed trick by trick (SKATGO-79, the human: 「10墩，每墩谁出了什么（有时序）然后谁赢了，一个10行的
 * 表格」): each trick's three cards in the order they were played, each under its player's name, and who
 * took it with how many card points. The player's own cards are bold; `highlight` marks a trick (the
 * worst card's). Tricks a claim or a concession left unplayed are not rows, only a line under them.
 */
export function TrickReplay({ tricks, names, skat, highlight = null, early = null }: { tricks: Game['tricks']; names: string[]; skat?: Card[]; highlight?: number | null; early?: Game['early'] | null }) {
  const played = early ? tricks.slice(0, early.from) : tricks
  return (
    <div {...stylex.props(styles.replay)}>
      <table data-testid="daily-replay" data-tricks={played.length} {...stylex.props(styles.replayTable)}>
        <thead>
          <tr>
            <th scope="col" {...stylex.props(typography.micro, styles.replayHead)}>{m.daily_replay_trick()}</th>
            {[1, 2, 3].map((n) => <th key={n} scope="col" {...stylex.props(typography.micro, styles.replayHead)}>{n}.</th>)}
            <th scope="col" {...stylex.props(typography.micro, styles.replayHead, styles.end)}>{m.daily_replay_winner()}</th>
          </tr>
        </thead>
        <tbody>
          {played.map((t, i) => (
            <tr key={i} data-trick={i + 1} data-winner={t.winner} data-highlight={highlight === i + 1 ? 'true' : undefined} {...stylex.props(styles.replayRow, highlight === i + 1 && styles.replayMarked)}>
              <td {...stylex.props(typography.small, styles.muted, styles.replayCell)}>{i + 1}</td>
              {t.cards.map((p, k) => (
                <td key={k} data-seat={p.seat} {...stylex.props(styles.replayCell)}>
                  <span {...stylex.props(typography.micro, styles.muted, styles.replayName)}>{names[p.seat]}</span>
                  <span {...stylex.props(p.seat === PLAYER ? typography.smallBold : typography.small, styles.replayCard)}><Rich text={cardLabel(p.card)} /></span>
                </td>
              ))}
              <td {...stylex.props(typography.small, styles.replayCell, styles.end)}>{m.daily_replay_points({ name: names[t.winner], points: pointsOf(t.cards.map((p) => p.card)) })}</td>
            </tr>
          ))}
        </tbody>
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

/** A review as it comes back: the deal trick by trick and its worst card, and the model's sentences when
 *  they were asked for and could be had. */
export type Reviewed = { review: DealReview; text: string | null }

/** Fetches a finished deal's review, with the model's explanation (`explain`) or without it. */
export type AskReview = (explain: boolean) => Promise<Reviewed | { error: string }>

/** A deal of one of today's tournaments, reviewed through /api/daily. */
export const dailyAsk = (size: number, deal: number): AskReview => (explain) => dailyReview(dailySize(size), deal, explain)

/** What this page already fetched, so reopening a deal does not ask again: explained reviews, and the
 *  deals fetched for their replay alone. */
const reviewed = new Map<string, Reviewed>()
const replays = new Map<string, Pick<DealReview, 'tricks' | 'skat' | 'early'>>()

/**
 * A finished deal's play record, open (SKATGO-79, the human: 「本次牌谱要显示出来，不要折叠，用专业名词说
 * 这个牌谱」): the way to the deal's turning point — the player's worst card — on top, only when asked
 * (「做成一个按钮，不用每次自动显示」); then the deal trick by trick, that card's trick marked once it is
 * known, the skat, and `footer` (free play's sum). `deal` is the deal when the page has it (the
 * settlement); otherwise it is fetched, without asking the model.
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
  deal?: Pick<DealReview, 'tricks' | 'skat' | 'early'>
  names?: string[]
  ask: AskReview
  cacheKey?: string
  footer?: ReactNode
}

function AnalysisBody({ deal, names, ask, cacheKey, footer }: AnalysisProps) {
  // The explanation is in the page's language: one fetched in another stays with that language.
  const said = cacheKey ? `${cacheKey}|${getLocale()}` : undefined
  const [got, setGot] = useState<Reviewed | null>(said ? (reviewed.get(said) ?? null) : null)
  const [shown, setShown] = useState(deal ?? (cacheKey ? replays.get(cacheKey) : undefined) ?? got?.review ?? null)
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    if (shown) return
    void ask(false).then((r) => {
      if ('error' in r) return setUnavailable(true)
      if (cacheKey) replays.set(cacheKey, r.review)
      setShown(r.review)
    })
    // Once, when the record is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  async function explain() {
    setState('loading')
    const r = await ask(true)
    if ('error' in r) return setState('failed')
    if (said) reviewed.set(said, r)
    setGot(r)
    setShown((s) => s ?? r.review)
  }
  const w = got?.review.worst ?? null
  return (
    <div {...stylex.props(styles.analysis)}>
      {got ? (
        <div
          data-testid="daily-review-result"
          data-trick={w?.trick ?? ''}
          data-played={w ? `${w.played.suit}${w.played.rank}` : ''}
          data-best={w ? `${w.best.suit}${w.best.rank}` : ''}
          {...stylex.props(styles.review)}
        >
          <p {...stylex.props(typography.note, styles.reviewLine)}>
            <Rich text={w ? m.daily_review_card({ trick: w.trick, played: cardLabel(w.played), best: cardLabel(w.best) }) : m.daily_review_clean()} />
          </p>
          {/* How near the rest came, with no line drawn: the plays that were the AI's own, and the others
              ranked (SKATGO-79). */}
          {w ? (
            <p data-testid="daily-review-agreed" data-agreed={got.review.agreed} data-choices={got.review.choices} {...stylex.props(typography.note, styles.muted)}>
              {m.daily_review_agreed({ agreed: got.review.agreed, choices: got.review.choices })}
              {got.review.differs.length > 1 ? ` ${m.daily_review_differs({ list: [...got.review.differs].sort((x, y) => x - y).join(', '), worst: w.trick })}` : ''}
            </p>
          ) : null}
          {w ? (
            got.text ? (
              <p data-testid="daily-review-text" {...stylex.props(typography.note, styles.reviewText)}>
                <span {...stylex.props(typography.smallBold, styles.reviewLabel)}>{m.daily_review_ai()}</span> {got.text}
              </p>
            ) : (
              <p {...stylex.props(typography.note, styles.muted)}>{m.daily_review_no_text()}</p>
            )
          ) : null}
        </div>
      ) : state === 'loading' ? (
        <p data-testid="daily-review-loading" {...stylex.props(typography.loading, styles.muted)}>{m.daily_review_loading()}</p>
      ) : (
        <div {...stylex.props(styles.reviewAsk)}>
          <Btn testId="daily-review" tone="quiet" size="sm" onClick={() => void explain()}>{m.daily_review()}</Btn>
          {state === 'failed' ? <p role="alert" {...stylex.props(typography.note, styles.muted)}>{m.daily_review_failed()}</p> : null}
        </div>
      )}
      {shown ? (
        <TrickReplay tricks={shown.tricks} names={names ?? youNames()} skat={shown.skat} highlight={w?.trick ?? null} early={shown.early} />
      ) : (
        <p {...stylex.props(typography.note, styles.muted)}>{unavailable ? m.daily_review_failed() : m.loading()}</p>
      )}
      {footer}
    </div>
  )
}

/**
 * One deal, the player against the AI (SKATGO-57, a score sheet since SKATGO-79): the three seats' scores
 * in the player's deal over the AI's, each with its Saldo and, under it, what the deal was. What happened
 * trick by trick is the analysis beside it (`DealAnalysis`).
 */
export function DealVsAi({ mine, ai }: { mine: DealSummary; ai: DealSummary | null }) {
  return (
    <section
      data-testid="daily-deal-vs-ai"
      data-you={mine.scores[PLAYER]}
      data-ai={ai ? ai.scores[PLAYER] : ''}
      data-saldo-you={saldo(mine.scores)}
      data-saldo-ai={ai ? saldo(ai.scores) : ''}
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
          analysis={status ? { size: of, day: status.day } : undefined}
          openLatest
        />
      </section>
    </Panel>
  )
}

/** The running comparison on /daily: one foldable row per finished deal, the player's Saldo against the
 *  AI's (SKATGO-79), opening to that deal's score sheet and its analysis; under the rows the score sheet
 *  of the whole tournament so far. `openLatest` opens the newest row, on the day's page while it runs.
 *  `of` (SKATGO-63): the day's number of deals; those not finished follow as rows of their number and
 *  whether they are `current` or still to play — nothing of their cards, which every player shares.
 *  `analysis`: the tournament and day whose finished deals can be gone through. */
export function VsAiTable({ deals, benchmarks, openLatest = false, of, current = null, analysis }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; openLatest?: boolean; of?: number; current?: number | null; analysis?: { size: number; day: string } }) {
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
        <span {...stylex.props(styles.headWho)}><Who side="you" /><span {...stylex.props(typography.micro)}>{m.daily_saldo()}</span></span>
        <span {...stylex.props(styles.headWho)}><Who side="ai" /><span {...stylex.props(typography.micro)}>{m.daily_saldo()}</span></span>
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
              <Score score={saldo(d.scores)} role={roleOf(d)} />
              {b ? <Score score={saldo(b.scores)} role={roleOf(b)} /> : <span {...stylex.props(typography.small, styles.muted)}>–</span>}
              <span {...stylex.props(styles.chevron)}>{chevron}</span>
            </>
          )
          return (
            <li key={i} data-testid="daily-vs-ai-row" data-you={saldo(d.scores)} data-ai={b ? saldo(b.scores) : ''} {...stylex.props(styles.item)}>
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
                    <DealAnalysis ask={dailyAsk(analysis.size, i)} cacheKey={`${analysis.day}|${analysis.size}|${i}`} />
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
        <div data-testid="daily-vs-ai-total" data-you={saldo(totals(deals))} data-ai={aiTotals ? saldo(aiTotals) : ''} {...stylex.props(styles.total)}>
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
  // All three seats, the player's deal over the AI's, the difference under them.
  scores: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  scoreHead: { paddingBottom: space.x4, textAlign: 'center', color: color.slate },
  scoreLabel: { paddingInlineEnd: space.x8, textAlign: 'start', color: color.slate, whiteSpace: 'nowrap' },
  scoreCell: { paddingBlock: space.x4, textAlign: 'center' },
  // The player's seat is the one the comparison is about.
  own: { backgroundColor: color.page },
  // Saldo, set off from the seats: the number the sheet is read for.
  saldo: { paddingInlineStart: space.x8, borderInlineStartWidth: border.hair, borderInlineStartStyle: 'solid', borderInlineStartColor: color.hairline, textAlign: 'end' },
  sheet: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  sheetNote: { margin: 0 },
  // What the deal was, under its row: quiet, one line, never wider than the sheet.
  gameLine: { paddingBottom: space.x6, color: color.slate, overflowWrap: 'anywhere' },
  // The Saldo heading opens what Saldo means.
  saldoWhy: {
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.slate,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  analysis: { display: 'flex', flexDirection: 'column', gap: space.x10 },
  record: { display: 'flex', flexDirection: 'column', gap: space.x8, paddingTop: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  recordTitle: { margin: 0, color: color.navy },
  replay: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  replayTable: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  replayHead: { paddingBottom: space.x4, textAlign: 'start', color: color.slate },
  replayRow: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  // The trick of the move most worth improving: the row the explanation talks about, on the app's pink
  // (the human: 「那一行标红背景，就是本app常用那种粉红的背景」).
  replayMarked: { backgroundColor: color.badSoft },
  replayCell: { paddingBlock: space.x4, paddingInlineEnd: space.x6, verticalAlign: 'top' },
  replayName: { display: 'block' },
  replayCard: { display: 'block', color: color.navy },
  whoTag: { display: 'inline-block', paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill, color: color.onColor },
  whoYou: { backgroundColor: color.navy },
  whoAi: { backgroundColor: color.tileOrange },
  review: { display: 'flex', flexDirection: 'column', gap: space.x6, padding: space.x10, borderRadius: radii.column, backgroundColor: color.page },
  reviewLine: { margin: 0, color: color.navy },
  reviewText: { margin: 0, color: color.text },
  reviewLabel: { color: color.navy },
  reviewAsk: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x6 },
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
  headWho: { display: 'flex', alignItems: 'center', gap: space.x6 },
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
