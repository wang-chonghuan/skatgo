import * as stylex from '@stylexjs/stylex'

import { contractName } from '~/lib/skat/i18n'
import type { Seat } from '~/lib/skat/game'
import { type DealSummary, PLAYER, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Rich } from './ui'

// The day against the AI (SKATGO-42): every deal the player has finished, beside the same deal played
// by the computer in the player's seat against the same two computers — worked out when the day was
// dealt, and shown only once the player has finished that deal. The table grows a row per deal: in
// the result after each deal, on /daily while the day is under way, and on the day's result.

const signed = (n: number) => (n > 0 ? `+${n}` : String(n))

/** Who played the deal, from one side: seat 0 is "you" in the player's column and "AI" in the AI's. */
function gameOf(d: DealSummary, own: string): string {
  if (d.declarer === null || !d.declaration) return m.daily_passed_in_short()
  const who = d.declarer === PLAYER ? own : [m.name_you, m.name_lina, m.name_max][d.declarer as Seat]()
  return `${contractName(d.declaration.contract)} · ${who}`
}

/** One line: what the AI did with the deal just played — contract, declarer and its score. */
export function AiThisDeal({ ai }: { ai: DealSummary | null | undefined }) {
  if (!ai) return null
  return (
    <p data-testid="daily-ai-deal" data-score={ai.scores[PLAYER]} {...stylex.props(typography.note, styles.note)}>
      <Rich text={m.daily_ai_deal({ game: gameOf(ai, m.daily_ai()), score: signed(ai.scores[PLAYER]) })} />
    </p>
  )
}

/** The running table: one row per finished deal, the player against the AI, and both totals. */
export function VsAiTable({ deals, benchmarks }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[] }) {
  if (deals.length === 0) return null
  const ai = deals.map((_, i) => benchmarks?.[i] ?? null)
  const aiTotal = ai.every((b) => b) ? totals(ai as DealSummary[])[PLAYER] : null
  return (
    <div data-testid="daily-vs-ai" data-rows={deals.length} role="table" aria-label={m.daily_vs_ai_title()} {...stylex.props(styles.table)}>
      <div role="row" {...stylex.props(styles.row, styles.head)}>
        <span role="columnheader" {...stylex.props(typography.small)}>{m.daily_col_deal()}</span>
        <span role="columnheader" {...stylex.props(typography.small)}>{m.name_you()}</span>
        <span role="columnheader" {...stylex.props(typography.small)}>{m.daily_ai()}</span>
      </div>
      {deals.map((d, i) => (
        <div key={i} role="row" data-testid="daily-vs-ai-row" data-you={d.scores[PLAYER]} data-ai={ai[i]?.scores[PLAYER] ?? ''} {...stylex.props(styles.row)}>
          <span role="cell" {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
          <Side d={d} own={m.name_you()} />
          {ai[i] ? <Side d={ai[i]!} own={m.daily_ai()} /> : <span role="cell" {...stylex.props(typography.small, styles.muted)}>–</span>}
        </div>
      ))}
      <div role="row" data-testid="daily-vs-ai-total" {...stylex.props(styles.row, styles.totalRow)}>
        <span role="cell" {...stylex.props(typography.smallBold)}>{m.daily_total()}</span>
        <span role="cell" {...stylex.props(typography.smallBold)}>{signed(totals(deals)[PLAYER])}</span>
        <span role="cell" {...stylex.props(typography.smallBold)}>{aiTotal === null ? '–' : signed(aiTotal)}</span>
      </div>
    </div>
  )
}

function Side({ d, own }: { d: DealSummary; own: string }) {
  return (
    <span role="cell" {...stylex.props(styles.cell)}>
      <span {...stylex.props(typography.smallBold)}>{signed(d.scores[PLAYER])}</span>
      <span {...stylex.props(typography.small, styles.muted)}>{gameOf(d, own)}</span>
    </span>
  )
}

const styles = stylex.create({
  note: { margin: 0, color: color.text },
  table: { display: 'flex', flexDirection: 'column', color: color.navy },
  row: {
    display: 'grid',
    gridTemplateColumns: dims.vsAiColumns,
    alignItems: 'baseline',
    columnGap: space.x12,
    paddingBlock: space.x6,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  head: { color: color.slate },
  totalRow: { borderBottomWidth: 0 },
  cell: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  muted: { color: color.slate },
})
