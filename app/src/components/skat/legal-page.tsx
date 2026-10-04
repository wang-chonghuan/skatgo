import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { LEGAL, LEGAL_OPERATOR, LEGAL_UPDATED } from '~/lib/legal'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

function LegalPage({ document }: { document: 'privacy' | 'terms' }) {
  const copy = LEGAL[getLocale()][document]
  const privacy = document === 'privacy'
  return (
    <article data-testid={`legal-${document}`} {...stylex.props(styles.column)}>
      <header {...stylex.props(styles.section)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>
          {privacy ? m.privacy_title() : m.terms_title()}
        </h1>
        <p {...stylex.props(typography.small, styles.date)}>
          {m.legal_updated()} <time dateTime={LEGAL_UPDATED}>{LEGAL_UPDATED}</time>
        </p>
        <p {...stylex.props(typography.body, styles.text)}>{copy.intro}</p>
      </header>
      {copy.sections.map((section) => (
        <section key={section.id} aria-labelledby={`legal-${section.id}`} {...stylex.props(styles.section)}>
          <h2 id={`legal-${section.id}`} {...stylex.props(typography.dialogTitle, styles.title)}>
            {section.title}
          </h2>
          {section.paragraphs.map((text) => (
            <p key={text} {...stylex.props(typography.body, styles.text)}>{text}</p>
          ))}
          {section.contact && (
            <address {...stylex.props(typography.body, styles.contact)}>
              <span>{LEGAL_OPERATOR.name}</span>
              <span>{LEGAL_OPERATOR.address}</span>
              <a href={`mailto:${LEGAL_OPERATOR.email}`} {...stylex.props(typography.link, styles.link)}>
                {LEGAL_OPERATOR.email}
              </a>
              <a href={LEGAL_OPERATOR.phoneHref} {...stylex.props(typography.link, styles.link)}>
                {LEGAL_OPERATOR.phone}
              </a>
            </address>
          )}
        </section>
      ))}
      <nav aria-label={m.legal_links()} {...stylex.props(styles.links)}>
        <Link to={privacy ? '/terms' : '/privacy'} {...stylex.props(typography.link, styles.link)}>
          {privacy ? m.terms_title() : m.privacy_title()}
        </Link>
        <Link to="/" {...stylex.props(typography.link, styles.link)}>{m.nav_home()}</Link>
        <Link to="/course" {...stylex.props(typography.link, styles.link)}>{m.nav_course()}</Link>
      </nav>
    </article>
  )
}

export const PrivacyPage = () => <LegalPage document="privacy" />
export const TermsPage = () => <LegalPage document="terms" />

export function LegalFooter() {
  return (
    <footer data-testid="legal-footer" {...stylex.props(styles.footer)}>
      <nav aria-label={m.legal_links()} {...stylex.props(styles.footerLinks)}>
        <Link to="/privacy" {...stylex.props(typography.link, styles.link)}>{m.privacy_title()}</Link>
        <Link to="/terms" {...stylex.props(typography.link, styles.link)}>{m.terms_title()}</Link>
        <Link to="/terms" hash="legal-operator" {...stylex.props(typography.link, styles.link)}>{m.legal_operator()}</Link>
      </nav>
    </footer>
  )
}

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x32,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    paddingBlock: { default: space.x32, [bp.phone]: space.x24 },
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
    boxSizing: 'border-box',
    overflowWrap: 'anywhere',
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  title: {
    margin: 0,
    color: color.navy,
    scrollMarginBlockStart: { default: dims.landingHeader, [bp.phone]: dims.landingHeaderPhone },
  },
  date: { margin: 0, color: color.slate },
  text: { margin: 0, color: color.text },
  contact: { display: 'flex', flexDirection: 'column', gap: space.x8, fontStyle: 'normal', color: color.text },
  links: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
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
