import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// The legal links under every header page (SKATGO-46). Its own file, apart from the legal pages' text, so
// every page's code does not carry the privacy policy and the terms (SKATGO-107). It also links the Skat-Tricks and
// the forum (SKATGO-118), About SkatGo and the rules (SKATGO-134).

export function LegalFooter() {
  return (
    <footer data-testid="legal-footer" {...stylex.props(styles.footer)}>
      <nav aria-label={m.legal_links()} {...stylex.props(styles.footerLinks)}>
        <Link to="/privacy" {...stylex.props(typography.link, styles.link)}>{m.privacy_title()}</Link>
        <Link to="/terms" {...stylex.props(typography.link, styles.link)}>{m.terms_title()}</Link>
        <Link to="/terms" hash="legal-operator" {...stylex.props(typography.link, styles.link)}>{m.legal_operator()}</Link>
        <Link to="/skat-tricks" {...stylex.props(typography.link, styles.link)}>{m.tricks_title()}</Link>
        <Link to="/forum" {...stylex.props(typography.link, styles.link)}>{m.forum_title()}</Link>
        {/* SKATGO-134: what the game pages no longer explain, and the rules, from every page. */}
        <Link to="/about" {...stylex.props(typography.link, styles.link)}>{m.about_title()}</Link>
        <Link to="/rules" {...stylex.props(typography.link, styles.link)}>{m.nav_rules()}</Link>
      </nav>
    </footer>
  )
}

const styles = stylex.create({
  link: {
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  footer: {
    backgroundColor: color.surface,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  footerLinks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: space.x20,
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    paddingBlock: space.x20,
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
    boxSizing: 'border-box',
  },
})
