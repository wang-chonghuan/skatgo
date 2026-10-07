import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'
import { Download } from 'lucide-react'

import { PRINTABLES, type Printable } from '~/lib/printables'
import { m } from '~/paraglide/messages'
import type { Locale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { linkLook } from './ui'

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

/** A page's PDF download: its one main action, a green button with the download icon beside the page's
 *  title — every download looks like this. A plain link, so it works without script. Not printed. */
export function PdfLink({ href, label }: { href: string; label: string }) {
  return (
    <span {...stylex.props(styles.download)}>
      <a href={href} download data-testid="pdf-download" {...linkLook('go', 'md')}>
        <Download aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
        {label}
      </a>
    </span>
  )
}

/** A printable's title with its download beside it; the download moves under the title when there is no
 *  room. */
export function TitleWithDownload({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div {...stylex.props(styles.titleRow)}>
      <h1 {...stylex.props(typography.landingHeading, styles.h1)}>{title}</h1>
      <PdfLink href={href} label={label} />
    </div>
  )
}

const styles = stylex.create({
  titleRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: space.x24, rowGap: space.x12 },
  h1: { margin: 0, color: color.navy },
  download: { display: { default: 'inline-flex', [bp.print]: 'none' } },
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
