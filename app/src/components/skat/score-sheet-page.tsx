import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { SEEGER_FABIAN } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PrintLinks, TitleWithDownload, pdfOf } from './print-links'

/** A series at a three-player table, as clubs play it (DSkV): 36 games. */
export const SERIES_GAMES = 36
const PLAYERS = [1, 2, 3]
/** The columns before the players': the game's number, the game, its value. */
const LEAD = [m.score_col_no, m.score_col_game, m.score_col_value]
const ROWS = Array.from({ length: SERIES_GAMES }, (_, i) => i + 1)

/**
 * The printable score sheet (SKATGO-53): a Skatliste for three players and one series, and the
 * Seeger-Fabian settlement under it with the engine's bonuses (tournament.ts). Rendered on the server; on
 * paper only the title and the two tables remain, on one A4 page.
 */
export function ScoreSheetPage() {
  const locale = getLocale()
  const settle = [
    m.score_sf_points(),
    m.score_sf_won({ bonus: SEEGER_FABIAN.won }),
    m.score_sf_lost({ bonus: SEEGER_FABIAN.lost }),
    m.score_sf_others({ bonus: SEEGER_FABIAN.defender }),
    m.score_sf_total(),
  ]
  return (
    <div data-testid="score-sheet" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <TitleWithDownload title={m.score_title()} href={pdfOf('scoreSheet', locale)} label={m.printables_download()} />
        <div {...stylex.props(styles.intro)}>
          <p {...stylex.props(typography.landingBody, styles.lead)}>{m.score_lead({ games: SERIES_GAMES })}</p>
          <p {...stylex.props(typography.appText, styles.text)}>{m.score_how()}</p>
        </div>

        <table data-testid="score-list" {...stylex.props(styles.table)}>
          <thead>
            <tr>
              {LEAD.map((label, i) => (
                <th key={i} scope="col" {...stylex.props(typography.panelLabel, styles.cell, styles.head, i === 0 && styles.no)}>{label()}</th>
              ))}
              {PLAYERS.map((n) => (
                <th key={n} scope="col" {...stylex.props(typography.panelLabel, styles.cell, styles.head)}>{m.score_col_player({ n })}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((n) => (
              <tr key={n} data-row={n}>
                <th scope="row" {...stylex.props(typography.small, styles.cell, styles.no)}>{n}</th>
                {[...LEAD.slice(1), ...PLAYERS].map((_, c) => (
                  <td key={c} {...stylex.props(styles.cell)} />
                ))}
              </tr>
            ))}
          </tbody>
          {/* The settlement shares the players' columns, so it needs no second header (SKATGO-53: one A4 page). */}
          <tfoot data-testid="score-settle">
            <tr>
              <th colSpan={LEAD.length + PLAYERS.length} scope="colgroup" {...stylex.props(typography.panelLabel, styles.cell, styles.head, styles.settleTitle)}>{m.score_sf_title()}</th>
            </tr>
            {settle.map((label) => (
              <tr key={label}>
                <th colSpan={LEAD.length} scope="row" {...stylex.props(typography.small, styles.cell, styles.label)}>{label}</th>
                {PLAYERS.map((n) => (
                  <td key={n} {...stylex.props(styles.cell)} />
                ))}
              </tr>
            ))}
          </tfoot>
        </table>

        <div {...stylex.props(styles.ways)}>
          <PrintLinks except="scoreSheet" />
          <Link to="/rules" {...stylex.props(typography.appBtnStrong, styles.link)}>{m.summary_full_rules()}</Link>
        </div>
      </article>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: space.x20, [bp.print]: space.x8 },
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16, [bp.print]: 0 },
    // On paper the table's outer border needs its own room at the page's edge.
    paddingInline: { default: space.x24, [bp.phone]: space.x12, [bp.print]: space.x2 },
  },
  // On paper only the title and the tables (SKATGO-53).
  intro: { display: { default: 'flex', [bp.print]: 'none' }, flexDirection: 'column', alignItems: 'flex-start', gap: space.x12 },
  ways: { display: { default: 'flex', [bp.print]: 'none' }, flexDirection: 'column', alignItems: 'flex-start', gap: space.x12 },
  lead: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  table: { borderCollapse: 'collapse', width: '100%', backgroundColor: color.surface },
  head: { textAlign: 'start' },
  settleTitle: { borderTopWidth: border.focus },
  cell: {
    height: dims.scoreRow,
    paddingBlock: 0,
    paddingInline: space.x6,
    color: color.slate,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.slate,
  },
  no: { textAlign: 'end' },
  label: { textAlign: 'start', color: color.text },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
