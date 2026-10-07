import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { SUMMARY } from '~/lib/skat/rules'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PdfLink, PrintLinks, pdfOf } from './print-links'
import { Block } from './rules-page'

/**
 * The printable short version of the rules (SKATGO-53): lib/skat/rules/summary, with the rules page's own
 * blocks, so every table comes from the engine. Rendered on the server; on paper two A4 pages at most,
 * without the lead, the links and the download.
 */
export function RulesSummaryPage() {
  const locale = getLocale()
  return (
    <div data-testid="rules-summary" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.summary_title()}</h1>
        <div {...stylex.props(styles.screenOnly)}>
          <p {...stylex.props(typography.landingBody, styles.lead)}>{m.summary_lead()}</p>
          <PdfLink href={pdfOf('summary', locale)} label={m.summary_download()} />
        </div>
        {SUMMARY[locale].map((section) => (
          <section key={section.title} data-testid="summary-section" {...stylex.props(styles.section)}>
            <h2 {...stylex.props(typography.optionTitle, styles.title)}>{section.title}</h2>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}
        <div {...stylex.props(styles.screenOnly)}>
          <Link to="/rules" {...stylex.props(typography.appBtnStrong, styles.link)}>{m.summary_full_rules()}</Link>
          <PrintLinks except="summary" />
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
    paddingInline: { default: space.x24, [bp.phone]: space.x12, [bp.print]: 0 },
  },
  // On paper only the title and the rules (SKATGO-53).
  screenOnly: { display: { default: 'flex', [bp.print]: 'none' }, flexDirection: 'column', alignItems: 'flex-start', gap: space.x12 },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  section: { display: 'flex', flexDirection: 'column', gap: { default: space.x12, [bp.print]: space.x6 }, breakInside: 'avoid' },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
