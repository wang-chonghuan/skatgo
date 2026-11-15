import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { FRIENDS } from '~/lib/friends'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// The legal links under every header page (SKATGO-46). Its own file, apart from the legal pages' text, so
// every page's code does not carry the privacy policy and the terms (SKATGO-107). It also links the Skat-Tricks and
// the forum (SKATGO-118), About SkatGo and the rules (SKATGO-134). Under them the sites SkatGo recommends, each with its
// own picture, in a new tab (SKATGO-198).

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
      <section aria-labelledby="footer-friends" {...stylex.props(styles.footerLinks, styles.friends)}>
        <h2 id="footer-friends" {...stylex.props(typography.label, styles.friendsHead)}>{m.footer_friends()}</h2>
        <ul {...stylex.props(styles.friendList)}>
          {FRIENDS.map((friend) => (
            <li key={friend.name}>
              <a href={friend.href(getLocale())} target="_blank" rel="noopener" {...stylex.props(typography.link, styles.link, styles.friend)}>
                <img src={friend.logo} alt="" loading="lazy" {...stylex.props(styles.logo)} />
                {friend.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
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
  friends: {
    flexDirection: 'column',
    gap: space.x12,
    paddingBlockStart: 0,
  },
  friendsHead: {
    margin: 0,
    color: color.slate,
  },
  friendList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: { default: space.x24, [bp.phone]: space.x16 },
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  friend: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x8,
  },
  logo: {
    flexShrink: 0,
    width: dims.control,
    height: dims.control,
    borderRadius: radii.tag,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    // The pictures have white or clear grounds: on `imageDim`, white by day and a soft grey at night (SKATGO-184).
    backgroundColor: color.imageDim,
    objectFit: 'contain',
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
