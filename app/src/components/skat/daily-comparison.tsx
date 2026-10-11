import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { dailyReview, isError } from '~/lib/daily-api'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import { type Auction, type DailyStatus, type DealReview, type DealSummary, PLAYER, dailySize, saldo, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
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

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

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

/** A deal's auction as one line (SKATGO-57): each seat's highest number, or pass; the declarer bold. */
function auctionLine(a: Auction, d: DealSummary, names: string[]): string {
  if (d.declarer === null) return m.daily_all_passed()
  return a.map((s, seat) => {
    const said = `${names[seat]} ${s.value > 0 ? s.value : m.daily_pass()}`
    return seat === d.declarer ? `**${said}**` : said
  }).join(' · ')
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
 * table, largest. The AI's line is missing on days dealt before it played them.
 */
export function ScoreSheet({ mine, ai, testId }: { mine: Scores; ai: Scores | null; testId: string }) {
  const seats = [m.daily_col_seat(), m.name_lina(), m.name_max()]
  const lines: [Side, Scores][] = ai ? [['you', mine], ['ai', ai]] : [['you', mine]]
  return (
    <div {...stylex.props(styles.sheet)}>
      <table data-testid={testId} {...stylex.props(styles.scores)}>
        <thead>
          <tr>
            <td />
            {seats.map((name, seat) => (
              <th key={name} scope="col" {...stylex.props(typography.small, styles.scoreHead, seat === PLAYER && styles.own)}>{name}</th>
            ))}
            <th scope="col" {...stylex.props(typography.smallBold, styles.scoreHead, styles.saldo)}>{m.daily_saldo()}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(([side, scores]) => (
            <tr key={side} data-row={side} data-scores={scores.join(',')} data-saldo={saldo(scores)}>
              <th scope="row" {...stylex.props(styles.scoreLabel)}><Who side={side} /></th>
              {scores.map((v, seat) => (
                <td key={seat} data-seat={seat} {...stylex.props(typography.appBtnStrong, styles.scoreCell, seat === PLAYER && styles.own)}>{signed(v)}</td>
              ))}
              <td data-testid="daily-saldo" {...stylex.props(typography.dialogTitle, styles.scoreCell, styles.saldo)}>{signed(saldo(scores))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p {...stylex.props(typography.micro, styles.muted, styles.sheetNote)}>{m.daily_saldo_note()}</p>
    </div>
  )
}

/** Where a finished deal's review is asked for: the tournament and the deal, on the day it was played. */
export type ReviewOf = { size: number; deal: number; day: string }

/** Reviews already fetched on this page, so reopening a deal does not ask again. */
const reviewed = new Map<string, { review: DealReview; text: string | null }>()

/**
 * The player's worst card in a finished deal, only when asked (SKATGO-79, the human: 「做成一个按钮，不用
 * 每次自动显示」): the trick, the card played and SkatZero's, and the assistant's model's few sentences on
 * why — or the word that every card was SkatZero's own choice.
 */
export function DealReviewButton({ size, deal, day }: ReviewOf) {
  const key = `${day}|${size}|${deal}`
  const [got, setGot] = useState(reviewed.get(key) ?? null)
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')
  async function ask() {
    setState('loading')
    const r = await dailyReview(dailySize(size), deal)
    if (isError(r)) return setState('failed')
    reviewed.set(key, r)
    setGot(r)
  }
  if (got) {
    const w = got.review.worst
    return (
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
    )
  }
  if (state === 'loading') return <p data-testid="daily-review-loading" {...stylex.props(typography.loading, styles.muted)}>{m.daily_review_loading()}</p>
  return (
    <div {...stylex.props(styles.reviewAsk)}>
      <Btn testId="daily-review" tone="quiet" size="sm" onClick={() => void ask()}>{m.daily_review()}</Btn>
      {state === 'failed' ? <p role="alert" {...stylex.props(typography.note, styles.muted)}>{m.daily_review_failed()}</p> : null}
    </div>
  )
}

/**
 * One deal, the player against the AI (SKATGO-57, a score sheet since SKATGO-79) — what the settlement
 * leads with: the three seats' scores in the player's deal over the AI's and each Saldo; then each side's
 * auction and game, so the player sees at once how they did and why; then, when the deal is a finished
 * one of today's, the way to its worst card. The sides sit side by side on a wide screen, one above the
 * other on a phone; no cards inside the settlement, which is one already.
 */
export function DealVsAi({ mine, ai, mineAuction, aiAuction, review }: { mine: DealSummary; ai: DealSummary | null; mineAuction?: Auction; aiAuction?: Auction | null; review?: ReviewOf }) {
  const played = mine.declarer !== null
  return (
    <section
      data-testid="daily-deal-vs-ai"
      data-you={mine.scores[PLAYER]}
      data-ai={ai ? ai.scores[PLAYER] : ''}
      data-saldo-you={saldo(mine.scores)}
      data-saldo-ai={ai ? saldo(ai.scores) : ''}
      {...stylex.props(styles.deal)}
    >
      <ScoreSheet testId="daily-deal-scores" mine={mine.scores} ai={ai ? ai.scores : null} />
      <div {...stylex.props(styles.sides)}>
        <SideStory side="you" d={mine} a={mineAuction} names={youNames()} />
        {ai ? <SideStory side="ai" d={ai} a={aiAuction ?? undefined} names={aiNames()} /> : null}
      </div>
      {review && played ? <DealReviewButton {...review} /> : null}
    </section>
  )
}

function SideStory({ side, d, a, names }: { side: Side; d: DealSummary; a?: Auction; names: string[] }) {
  const lines: [string, string][] = [
    [m.daily_line_bidding(), a ? auctionLine(a, d, names) : '–'],
    [m.daily_line_game(), d.declarer === null || !d.declaration ? m.daily_passed_in_short() : playedParts(d, names[d.declarer]).join(' · ')],
  ]
  return (
    <div data-testid="daily-deal-side" data-side={side} {...stylex.props(styles.side)}>
      <span><Who side={side} /></span>
      {lines.map(([label, text]) => (
        <p key={label} {...stylex.props(styles.sideLine)}>
          <span {...stylex.props(typography.micro, styles.muted)}>{label}</span>
          <span {...stylex.props(typography.note, styles.sideText)}><Rich text={text} /></span>
        </p>
      ))}
    </div>
  )
}

/** A part of the settlement that opens on a tap (SKATGO-57): the deal's details, the day so far. */
export function Fold({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div data-testid={testId} data-open={open} {...stylex.props(styles.fold)}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} {...stylex.props(typography.smallBold, styles.foldButton)}>
        <span>{label}</span>
        {open ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />}
      </button>
      {open ? <div {...stylex.props(styles.foldBody)}>{children}</div> : null}
    </div>
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
          auctions={status?.auctions}
          benchmarkAuctions={status?.benchmarkAuctions}
          of={of}
          current={status?.started ? status.deal : null}
          review={status ? { size: of, day: status.day } : undefined}
          openLatest
        />
      </section>
    </Panel>
  )
}

/** The running comparison: one foldable row per finished deal, the player's Saldo against the AI's
 *  (SKATGO-79), opening to that deal's score sheet; under the rows the score sheet of the whole
 *  tournament so far. `openLatest` opens the newest row — after a deal, and on the day's page while it
 *  runs. `flat` (inside the settlement's fold, SKATGO-57): rows that do not fold again — folds never nest.
 *  `of` (SKATGO-63): the day's number of deals; those not finished follow as rows of their number and
 *  whether they are `current` or still to play — nothing of their cards, which every player shares.
 *  `review`: the tournament and day whose finished deals may be reviewed. */
export function VsAiTable({ deals, benchmarks, auctions, benchmarkAuctions, openLatest = false, flat = false, of, current = null, review }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; auctions?: Auction[]; benchmarkAuctions?: (Auction | null)[]; openLatest?: boolean; flat?: boolean; of?: number; current?: number | null; review?: Omit<ReviewOf, 'deal'> }) {
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
              {flat ? (
                <div {...stylex.props(styles.grid, styles.flatRow)}>{cells(null)}</div>
              ) : (
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
              )}
              {isOpen && !flat ? (
                <div id={id} data-testid="daily-vs-ai-detail" {...stylex.props(styles.detail)}>
                  <DealVsAi mine={d} ai={b} mineAuction={auctions?.[i]} aiAuction={benchmarkAuctions?.[i] ?? null} review={review ? { ...review, deal: i } : undefined} />
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
  whoTag: { display: 'inline-block', paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill, color: color.onColor },
  whoYou: { backgroundColor: color.navy },
  whoAi: { backgroundColor: color.tileOrange },
  review: { display: 'flex', flexDirection: 'column', gap: space.x6, padding: space.x10, borderRadius: radii.column, backgroundColor: color.page },
  reviewLine: { margin: 0, color: color.navy },
  reviewText: { margin: 0, color: color.text },
  reviewLabel: { color: color.navy },
  reviewAsk: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x6 },
  sides: { display: 'flex', flexDirection: { default: 'row', [bp.phone]: 'column' }, gap: { default: space.x24, [bp.phone]: space.x12 } },
  side: { display: 'flex', flexDirection: 'column', gap: space.x6, flexGrow: 1, flexBasis: 0, minWidth: 0 },
  sideLine: { display: 'flex', flexDirection: 'column', margin: 0 },
  sideText: { color: color.text, overflowWrap: 'anywhere' },
  fold: { display: 'flex', flexDirection: 'column', borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  foldButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBlock: space.x8,
    paddingInline: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.slate,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  foldBody: { display: 'flex', flexDirection: 'column', gap: space.x6, paddingBottom: space.x8 },
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
