import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { PRINTABLES, type Printable } from '~/lib/printables'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

/** A printable's PDF in one language (lib/printables.ts). */
export const pdfOf = (printable: Printable, locale: Locale): string => PRINTABLES[printable].pdf[locale]

/** The ways to the printables (SKATGO-53): on the rules, the bidding table and the course. Not printed. */
export function PrintLinks({ except }: { except?: Printable }) {
  return (
    <nav aria-label={m.printables_title()} data-testid="print-links" {...stylex.props(styles.root)}>
      <span {...stylex.props(typography.panelLabel, styles.title)}>{m.printables_title()}</span>
      {except === 'scoreSheet' ? null : (
        <Link to="/rules/score-sheet" data-testid="print-score-sheet" {...stylex.props(typography.appBtnStrong, styles.link)}>{m.printables_score()}</Link>
      )}
      {except === 'summary' ? null : (
        <Link to="/rules/printable" data-testid="print-summary" {...stylex.props(typography.appBtnStrong, styles.link)}>{m.printables_summary()}</Link>
      )}
    </nav>
  )
}

/** A PDF download, as a plain link: it needs no script to work. Not printed. */
export function PdfLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} download data-testid="pdf-download" {...stylex.props(typography.appBtnStrong, styles.link)}>
      {label}
    </a>
  )
}

const styles = stylex.create({
  root: { display: { default: 'flex', [bp.print]: 'none' }, flexWrap: 'wrap', alignItems: 'baseline', columnGap: space.x16, rowGap: space.x6 },
  title: { color: color.slate },
  link: {
    display: { default: 'inline', [bp.print]: 'none' },
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
