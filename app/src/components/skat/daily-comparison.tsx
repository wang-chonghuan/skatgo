import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { contractName } from '~/lib/skat/i18n'
import type { Seat } from '~/lib/skat/game'
import { type Auction, type DailyStatus, type DealSummary, PLAYER, totals } from '~/lib/skat/tournament'
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
// A row compares the seat's Seeger-Fabian scores and their difference; opened, it says what happened on
// each side — who declared what, won or lost by how many card points, at what game value, and what the
// seat's side took — because a defender's score alone (0 or 40) says nothing about the deal. The rows
// fold so the table fits a phone without scrolling sideways.

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

const NAMES = [m.name_you, m.name_lina, m.name_max] as const
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

/** What happened on one side of a deal, as one line: declarer and game, the outcome, the seat's side. */
function storyOf(d: DealSummary, own: string, side: (points: number) => string): string {
  if (d.declarer === null || !d.declaration) return m.daily_passed_in_short()
  const decl = d.declaration
  const x = d.detail!
  const parts = playedParts(d, d.declarer === PLAYER ? own : NAMES[d.declarer as Seat]())
  parts.push(m.daily_value({ value: x.value }))
  if (decl.contract.kind !== 'null') parts.push(side(d.declarer === PLAYER ? x.declarerPoints : x.defenderPoints))
  return parts.join(' · ')
}

/** A deal's auction as one line (SKATGO-57): each seat's highest number, or pass; the declarer bold. */
function auctionLine(a: Auction, d: DealSummary, names: string[]): string {
  if (d.declarer === null) return m.daily_all_passed()
  return a.map((s, seat) => {
    const said = `${names[seat]} ${s.value > 0 ? s.value : m.daily_pass()}`
    return seat === d.declarer ? `**${said}**` : said
  }).join(' · ')
}

/**
 * One deal, the player against the AI (SKATGO-57) — what the settlement leads with: all three seats'
 * Seeger-Fabian scores in the player's deal over the AI's (the AI in the player's seat), because Skat is
 * played by three; then each side's auction and game, so the player sees at once how they did and why.
 * The two sides sit side by side on a wide screen, one above the other on a phone; no cards inside the
 * settlement, which is one already.
 */
export function DealVsAi({ mine, ai, mineAuction, aiAuction }: { mine: DealSummary; ai: DealSummary | null; mineAuction?: Auction; aiAuction?: Auction | null }) {
  const you = mine.scores[PLAYER]
  const theirs = ai ? ai.scores[PLAYER] : null
  const seats = [m.daily_col_seat(), m.name_lina(), m.name_max()]
  const rows: [string, string, (string | number)[]][] = [
    ['you', m.daily_row_you(), mine.scores.map(signed)],
    ...(ai
      ? ([
          ['ai', m.daily_row_ai(), ai.scores.map(signed)],
        ] as [string, string, string[]][])
      : []),
  ]
  return (
    <section data-testid="daily-deal-vs-ai" data-you={you} data-ai={theirs ?? ''} data-diff={theirs === null ? '' : you - theirs} {...stylex.props(styles.deal)}>
      <table data-testid="daily-deal-scores" {...stylex.props(styles.scores)}>
        <thead>
          <tr>
            <td />
            {seats.map((name, seat) => (
              <th key={name} scope="col" {...stylex.props(typography.small, styles.scoreHead, seat === PLAYER && styles.own)}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, label, values]) => (
            <tr key={key} data-row={key}>
              <th scope="row" {...stylex.props(typography.small, styles.scoreLabel)}>{label}</th>
              {values.map((v, seat) => (
                <td key={seat} data-seat={seat} {...stylex.props(typography.dialogTitle, styles.scoreCell, seat === PLAYER && styles.own)}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div {...stylex.props(styles.sides)}>
        <Side side="you" title={m.daily_row_you()} d={mine} a={mineAuction} names={youNames()} />
        {ai ? <Side side="ai" title={m.daily_row_ai()} d={ai} a={aiAuction ?? undefined} names={aiNames()} /> : null}
      </div>
    </section>
  )
}

function Side({ side, title, d, a, names }: { side: 'you' | 'ai'; title: string; d: DealSummary; a?: Auction; names: string[] }) {
  const lines: [string, string][] = [
    [m.daily_line_bidding(), a ? auctionLine(a, d, names) : '–'],
    [m.daily_line_game(), d.declarer === null || !d.declaration ? m.daily_passed_in_short() : playedParts(d, names[d.declarer]).join(' · ')],
  ]
  return (
    <div data-testid="daily-deal-side" data-side={side} {...stylex.props(styles.side)}>
      <span {...stylex.props(typography.smallBold, styles.sideTitle)}>{title}</span>
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
          openLatest
        />
      </section>
    </Panel>
  )
}

/** The running comparison: one foldable row per finished deal, the player against the AI, and the
 *  totals. `openLatest` opens the newest row — after a deal, and on the day's page while it runs.
 *  `flat` (inside the settlement's fold, SKATGO-57): rows that do not fold again — folds never nest.
 *  `of` (SKATGO-63): the day's number of deals; those not finished follow as rows of their number and
 *  whether they are `current` or still to play — nothing of their cards, which every player shares. */
export function VsAiTable({ deals, benchmarks, auctions, benchmarkAuctions, openLatest = false, flat = false, of, current = null }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; auctions?: Auction[]; benchmarkAuctions?: (Auction | null)[]; openLatest?: boolean; flat?: boolean; of?: number; current?: number | null }) {
  const latest = deals.length - 1
  const [open, setOpen] = useState<number[]>(openLatest ? [latest] : [])
  useEffect(() => {
    if (openLatest) setOpen([latest])
  }, [openLatest, latest])
  if (deals.length === 0 && !of) return null
  const ahead = Array.from({ length: Math.max(0, (of ?? 0) - deals.length) }, (_, k) => deals.length + k)
  const ai = deals.map((_, i) => benchmarks?.[i] ?? null)
  const you = totals(deals)[PLAYER]
  const aiTotal = ai.every((b) => b) ? totals(ai as DealSummary[])[PLAYER] : null
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((j) => j !== i) : [...o, i]))
  return (
    <div data-testid="daily-vs-ai" data-rows={deals.length} data-of={of ?? deals.length} {...stylex.props(styles.table)}>
      <div aria-hidden="true" {...stylex.props(styles.grid, styles.head)}>
        <span {...stylex.props(typography.small)}>{m.daily_col_deal()}</span>
        <span {...stylex.props(typography.small)}>{m.name_you()}</span>
        <span {...stylex.props(typography.small)}>{m.daily_ai()}</span>
        <span {...stylex.props(typography.small, styles.end)}>{m.daily_col_diff()}</span>
      </div>
      <ol {...stylex.props(styles.list)}>
        {deals.map((d, i) => {
          const b = ai[i]
          const diff = b ? d.scores[PLAYER] - b.scores[PLAYER] : null
          const isOpen = open.includes(i)
          const id = `daily-deal-${i}`
          // The row's four columns; a foldable row's last one also carries its chevron.
          const cells = (chevron: ReactNode) => (
            <>
              <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
              <Score score={d.scores[PLAYER]} role={roleOf(d)} />
              {b ? <Score score={b.scores[PLAYER]} role={roleOf(b)} /> : <span {...stylex.props(typography.small, styles.muted)}>–</span>}
              <span {...stylex.props(styles.diff)}>
                <span {...stylex.props(typography.appBtnStrong)}>{diff === null ? '–' : signed(diff)}</span>
                {chevron}
              </span>
            </>
          )
          return (
            <li key={i} data-testid="daily-vs-ai-row" data-you={d.scores[PLAYER]} data-ai={b?.scores[PLAYER] ?? ''} data-diff={diff ?? ''} {...stylex.props(styles.item)}>
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
                  <p data-side="you" {...stylex.props(styles.line)}>
                    <span {...stylex.props(typography.smallBold, styles.who)}>{m.name_you()}</span>
                    <span {...stylex.props(typography.note)}>
                      {storyOf(d, m.name_you(), (points) => m.daily_side_you({ points }))}
                      {auctions?.[i] ? <> · <Rich text={auctionLine(auctions[i], d, youNames())} /></> : null}
                    </span>
                  </p>
                  {b ? (
                    <p data-side="ai" {...stylex.props(styles.line)}>
                      <span {...stylex.props(typography.smallBold, styles.who)}>{m.daily_ai()}</span>
                      <span {...stylex.props(typography.note)}>
                        {storyOf(b, m.daily_ai(), (points) => m.daily_side_ai({ points }))}
                        {benchmarkAuctions?.[i] ? <> · <Rich text={auctionLine(benchmarkAuctions[i]!, b, aiNames())} /></> : null}
                      </span>
                    </p>
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
              <span {...stylex.props(typography.small, styles.muted, styles.end)}>–</span>
            </div>
          </li>
        ))}
      </ol>
      {deals.length === 0 ? null : <div data-testid="daily-vs-ai-total" data-you={you} data-ai={aiTotal ?? ''} data-diff={aiTotal === null ? '' : you - aiTotal} {...stylex.props(styles.grid, styles.total)}>
        <span {...stylex.props(typography.smallBold)}>{m.daily_total()}</span>
        <span {...stylex.props(typography.appBtnStrong)}>{signed(you)}</span>
        <span {...stylex.props(typography.appBtnStrong)}>{aiTotal === null ? '–' : signed(aiTotal)}</span>
        <span {...stylex.props(typography.appBtnStrong, styles.end)}>{aiTotal === null ? '–' : signed(you - aiTotal)}</span>
      </div>}
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
  sides: { display: 'flex', flexDirection: { default: 'row', [bp.phone]: 'column' }, gap: { default: space.x24, [bp.phone]: space.x12 } },
  side: { display: 'flex', flexDirection: 'column', gap: space.x6, flexGrow: 1, flexBasis: 0, minWidth: 0 },
  sideTitle: { color: color.navy },
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
  diff: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: space.x4 },
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
  line: { display: 'flex', gap: space.x8, margin: 0, color: color.text },
  who: { flexShrink: 0, color: color.navy },
  total: {
    paddingTop: space.x8,
    borderTopWidth: border.tile,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
})
