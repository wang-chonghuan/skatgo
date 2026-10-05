import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { contractName } from '~/lib/skat/i18n'
import type { Seat } from '~/lib/skat/game'
import { type DealSummary, PLAYER, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

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

/** The seat's part in a deal, as a word under its score. */
function roleOf(d: DealSummary): string {
  if (d.declarer === null) return m.daily_passed_in_short()
  return d.declarer === PLAYER ? m.daily_role_declarer() : m.daily_role_defender()
}

/** What happened on one side of a deal, as one line: declarer and game, the outcome, the seat's side. */
function storyOf(d: DealSummary, own: string, side: (points: number) => string): string {
  if (d.declarer === null || !d.declaration) return m.daily_passed_in_short()
  const decl = d.declaration
  const who = d.declarer === PLAYER ? own : NAMES[d.declarer as Seat]()
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
  parts.push(m.daily_value({ value: x.value }))
  if (decl.contract.kind !== 'null') parts.push(side(d.declarer === PLAYER ? x.declarerPoints : x.defenderPoints))
  return parts.join(' · ')
}

/** The running comparison: one foldable row per finished deal, the player against the AI, and the
 *  totals. `openLatest` opens the newest row — after a deal, and on the day's page while it runs. */
export function VsAiTable({ deals, benchmarks, openLatest = false }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; openLatest?: boolean }) {
  const latest = deals.length - 1
  const [open, setOpen] = useState<number[]>(openLatest ? [latest] : [])
  useEffect(() => {
    if (openLatest) setOpen([latest])
  }, [openLatest, latest])
  if (deals.length === 0) return null
  const ai = deals.map((_, i) => benchmarks?.[i] ?? null)
  const you = totals(deals)[PLAYER]
  const aiTotal = ai.every((b) => b) ? totals(ai as DealSummary[])[PLAYER] : null
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((j) => j !== i) : [...o, i]))
  return (
    <div data-testid="daily-vs-ai" data-rows={deals.length} {...stylex.props(styles.table)}>
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
          return (
            <li key={i} data-testid="daily-vs-ai-row" data-you={d.scores[PLAYER]} data-ai={b?.scores[PLAYER] ?? ''} data-diff={diff ?? ''} {...stylex.props(styles.item)}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                aria-label={m.daily_show_deal({ n: i + 1 })}
                data-testid="daily-vs-ai-toggle"
                onClick={() => toggle(i)}
                {...stylex.props(styles.grid, styles.row)}
              >
                <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
                <Score score={d.scores[PLAYER]} role={roleOf(d)} />
                {b ? <Score score={b.scores[PLAYER]} role={roleOf(b)} /> : <span {...stylex.props(typography.small, styles.muted)}>–</span>}
                <span {...stylex.props(styles.diff)}>
                  <span {...stylex.props(typography.appBtnStrong)}>{diff === null ? '–' : signed(diff)}</span>
                  {isOpen ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />}
                </span>
              </button>
              {isOpen ? (
                <div id={id} data-testid="daily-vs-ai-detail" {...stylex.props(styles.detail)}>
                  <p data-side="you" {...stylex.props(styles.line)}>
                    <span {...stylex.props(typography.smallBold, styles.who)}>{m.name_you()}</span>
                    <span {...stylex.props(typography.note)}>{storyOf(d, m.name_you(), (points) => m.daily_side_you({ points }))}</span>
                  </p>
                  {b ? (
                    <p data-side="ai" {...stylex.props(styles.line)}>
                      <span {...stylex.props(typography.smallBold, styles.who)}>{m.daily_ai()}</span>
                      <span {...stylex.props(typography.note)}>{storyOf(b, m.daily_ai(), (points) => m.daily_side_ai({ points }))}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div data-testid="daily-vs-ai-total" data-you={you} data-ai={aiTotal ?? ''} data-diff={aiTotal === null ? '' : you - aiTotal} {...stylex.props(styles.grid, styles.total)}>
        <span {...stylex.props(typography.smallBold)}>{m.daily_total()}</span>
        <span {...stylex.props(typography.appBtnStrong)}>{signed(you)}</span>
        <span {...stylex.props(typography.appBtnStrong)}>{aiTotal === null ? '–' : signed(aiTotal)}</span>
        <span {...stylex.props(typography.appBtnStrong, styles.end)}>{aiTotal === null ? '–' : signed(you - aiTotal)}</span>
      </div>
    </div>
  )
}

function Score({ score, role }: { score: number; role: string }) {
  return (
    <span {...stylex.props(styles.cell)}>
      <span {...stylex.props(typography.appBtnStrong)}>{signed(score)}</span>
      <span {...stylex.props(typography.micro, styles.muted)}>{role}</span>
    </span>
  )
}

const styles = stylex.create({
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
  cell: { display: 'flex', flexDirection: 'column', minWidth: 0 },
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
