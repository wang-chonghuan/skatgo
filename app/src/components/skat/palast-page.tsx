import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { linkLook } from './ui'

/**
 * SkatGo as an alternative to Skat Palast (SKATGO-226): a search entry for people who look for Skat Palast. It compares
 * only what Skat Palast's own website says (checked 2026-11-22, the page names the month), names Skat Palast's strengths
 * as plainly as SkatGo's, uses none of its pictures, and says SkatGo has no connection with it (UWG §6). Laid out as
 * About SkatGo is; rendered on the server.
 */
export function PalastPage() {
  const rows = [
    { topic: m.palast_row_opponents(), us: m.palast_row_opponents_us(), them: m.palast_row_opponents_them() },
    { topic: m.palast_row_cost(), us: m.palast_row_cost_us(), them: m.palast_row_cost_them() },
    { topic: m.palast_row_account(), us: m.palast_row_account_us(), them: m.palast_row_account_them() },
    { topic: m.palast_row_learn(), us: m.palast_row_learn_us(), them: m.palast_row_learn_them() },
    { topic: m.palast_row_compete(), us: m.palast_row_compete_us(), them: m.palast_row_compete_them() },
  ]
  const why = [m.palast_why_1(), m.palast_why_2(), m.palast_why_3(), m.palast_why_4()]
  return (
    <div data-testid="palast" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.palast_title()}</h1>
        <p {...stylex.props(typography.body, styles.text)}>{m.palast_lead()}</p>

        <section data-testid="palast-compare" aria-labelledby="palast-compare-title" {...stylex.props(styles.section)}>
          <h2 id="palast-compare-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.palast_compare_title()}</h2>
          <div {...stylex.props(styles.rows)}>
            {rows.map((row) => (
              <div key={row.topic} {...stylex.props(styles.row)}>
                <h3 {...stylex.props(typography.body, typography.emphasis, styles.title)}>{row.topic}</h3>
                <div {...stylex.props(styles.pair)}>
                  <p {...stylex.props(typography.body, styles.text, styles.cell)}>
                    <span {...stylex.props(typography.emphasis, styles.brand)}>SkatGo</span>
                    {row.us}
                  </p>
                  <p {...stylex.props(typography.body, styles.text, styles.cell)}>
                    <span {...stylex.props(typography.emphasis, styles.brand)}>Skat Palast</span>
                    {row.them}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="palast-why" aria-labelledby="palast-why-title" {...stylex.props(styles.section)}>
          <h2 id="palast-why-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.palast_why_title()}</h2>
          <ul {...stylex.props(styles.list)}>
            {why.map((line) => <li key={line} {...stylex.props(typography.body, styles.text)}>{line}</li>)}
          </ul>
        </section>

        <section data-testid="palast-choose" aria-labelledby="palast-choose-title" {...stylex.props(styles.section)}>
          <h2 id="palast-choose-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.palast_choose_title()}</h2>
          <p {...stylex.props(typography.body, styles.text)}>{m.palast_choose_text()}</p>
          <div {...stylex.props(styles.actions)}>
            <Link to="/play" data-testid="palast-play" {...linkLook('go', 'md')}>{m.palast_cta()}</Link>
            <Link to="/course" {...stylex.props(typography.link, styles.link)}>{m.palast_course()}</Link>
          </div>
        </section>

        <p data-testid="palast-note" {...stylex.props(typography.note, styles.muted)}>{m.palast_note()}</p>
      </article>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x32,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  title: { margin: 0, color: color.navy, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  muted: { margin: 0, color: color.slate },
  rows: { display: 'flex', flexDirection: 'column', gap: space.x16 },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBlockEnd: space.x16,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  // Side by side where there is room, one under the other on a phone.
  pair: {
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.phone]: dims.oneColumn },
    gap: { default: space.x16, [bp.phone]: space.x8 },
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x4,
    padding: space.x12,
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
  },
  brand: { color: color.navy },
  list: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, paddingInlineStart: space.x20, listStyleType: 'disc' },
  actions: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x16 },
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
