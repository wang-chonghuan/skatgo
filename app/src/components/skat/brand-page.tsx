import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { type Brand, brandOf } from '~/lib/brands'
import { COLUMNS, type Column, SITES } from '~/lib/compare'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { linkLook } from './ui'

/**
 * One big Skat brand's page (SKATGO-229), under the comparison of Skat sites: the brand in our own words from its own
 * pages, what it offers, it and SkatGo side by side, the questions asked about it, and a box at the top and the end
 * leading to SkatGo's front page — free, no sign-up. Laid out as the comparison is; nothing links away to the brand,
 * and the way back is the comparison itself.
 */
function BrandPage({ id }: { id: Brand['id'] }) {
  const locale = getLocale()
  const brand = brandOf(id)
  const them = SITES.find((s) => s.id === id)
  const us = SITES.find((s) => s.id === 'skatgo')
  const columns: Record<Column, string> = {
    special: m.compare_col_special(),
    opponents: m.compare_col_opponents(),
    platforms: m.compare_col_platforms(),
    rules: m.compare_col_rules(),
    compete: m.compare_col_compete(),
    learn: m.compare_col_learn(),
  }
  const subject = brand.subject[locale]
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1)
  const rows = COLUMNS.filter((c) => them?.cells[c].mark === 'yes')

  const cta = (testId: string) => (
    <aside data-testid={testId} {...stylex.props(styles.cta)}>
      <div {...stylex.props(styles.ctaText)}>
        <p {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_cta_title()}</p>
        <p {...stylex.props(typography.body, styles.text)}>{m.compare_cta_text()}</p>
      </div>
      <Link to="/" data-testid={`${testId}-play`} {...linkLook('go', 'lg')}>{m.compare_cta()}</Link>
    </aside>
  )

  return (
    <div data-testid="brand" data-brand={id} {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <Link to="/skat-sites-compared" data-testid="brand-back-top" {...stylex.props(typography.link, styles.link)}>{m.brand_back()}</Link>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{brand.heading[locale]}</h1>
        <p data-testid="brand-intro" {...stylex.props(typography.body, styles.text)}>{brand.intro[locale]}</p>
        {cta('brand-cta-top')}

        <section data-testid="brand-offers" aria-labelledby="brand-offers-title" {...stylex.props(styles.section)}>
          <h2 id="brand-offers-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.brand_offers_title({ subject })}</h2>
          <ul {...stylex.props(styles.offers)}>
            {brand.offers.map((o) => <li key={o.text.en} {...stylex.props(typography.body, styles.text, styles.offer)}>{o.text[locale]}</li>)}
          </ul>
        </section>

        {them && us ? (
          <section data-testid="brand-compare" aria-labelledby="brand-compare-title" {...stylex.props(styles.section)}>
            <h2 id="brand-compare-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.brand_compare_title({ subject: Subject })}</h2>
            <div role="region" aria-label={m.brand_compare_title({ subject: Subject })} tabIndex={0} {...stylex.props(styles.scroll)}>
              <table {...stylex.props(styles.table)}>
                <thead>
                  <tr>
                    <td {...stylex.props(styles.head)} />
                    <th scope="col" {...stylex.props(typography.panelLabel, styles.head)}>{brand.name}</th>
                    <th scope="col" {...stylex.props(typography.panelLabel, styles.head, styles.ours)}>SkatGo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c}>
                      <th scope="row" {...stylex.props(typography.bodySmall, typography.emphasis, styles.cell, styles.label)}>{columns[c]}</th>
                      <td {...stylex.props(typography.bodySmall, styles.cell)}>{them.cells[c].text[locale]}</td>
                      <td {...stylex.props(typography.bodySmall, styles.cell, styles.ours)}>{us.cells[c].text[locale]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section data-testid="brand-faq" aria-labelledby="brand-faq-title" {...stylex.props(styles.section)}>
          <h2 id="brand-faq-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.brand_faq_title({ about: brand.about[locale] })}</h2>
          <dl {...stylex.props(styles.faq)}>
            {brand.faq.map(({ q, a }) => (
              <div key={q.en} {...stylex.props(styles.faqItem)}>
                <dt {...stylex.props(typography.body, typography.emphasis, styles.title)}>{q[locale]}</dt>
                <dd {...stylex.props(typography.body, styles.text)}>{a[locale]}</dd>
              </div>
            ))}
          </dl>
        </section>

        {cta('brand-cta-end')}
        <Link to="/skat-sites-compared" data-testid="brand-back" {...stylex.props(typography.link, styles.link)}>{m.brand_back()}</Link>
        <div data-testid="brand-note" {...stylex.props(styles.notes)}>
          <p {...stylex.props(typography.note, styles.muted)}>{m.brand_note({ name: brand.name })}</p>
          <p {...stylex.props(typography.note, styles.muted)}>
            {m.compare_fix()}{' '}
            <Link to="/terms" hash="legal-operator" {...stylex.props(typography.note, styles.link)}>{m.legal_operator()}</Link>
          </p>
        </div>
      </article>
    </div>
  )
}

export const BrandSkatPalastPage = () => <BrandPage id="skat-palast" />
export const BrandSkatstubePage = () => <BrandPage id="skatstube" />
export const BrandEuroskatPage = () => <BrandPage id="euroskat" />
export const BrandSkatOnlinePage = () => <BrandPage id="skat-online" />

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  title: { margin: 0, color: color.navy, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  muted: { margin: 0, color: color.slate },
  notes: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  cta: {
    display: 'flex',
    flexDirection: { default: 'row', [bp.phone]: 'column' },
    alignItems: { default: 'center', [bp.phone]: 'flex-start' },
    justifyContent: 'space-between',
    gap: space.x16,
    padding: { default: space.x20, [bp.phone]: space.x16 },
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
  },
  ctaText: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  offers: {
    display: 'grid',
    gridTemplateColumns: { default: dims.boardColumns, [bp.phone]: dims.oneColumn },
    gap: space.x8,
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  offer: {
    padding: space.x12,
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
  },
  scroll: {
    overflowX: 'auto',
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
  },
  table: { borderCollapse: 'separate', borderSpacing: 0, width: '100%' },
  head: {
    paddingBlock: space.x8,
    paddingInline: space.x12,
    textAlign: 'start',
    color: color.navy,
    backgroundColor: color.surface,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  cell: {
    paddingBlock: space.x10,
    paddingInline: space.x12,
    textAlign: 'start',
    verticalAlign: 'top',
    color: color.text,
    backgroundColor: color.surface,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  label: { color: color.navy },
  ours: { backgroundColor: color.goodSoft },
  link: {
    alignSelf: 'flex-start',
    color: color.info,
    textDecoration: { default: 'underline', ':hover': 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  faq: { display: 'flex', flexDirection: 'column', gap: space.x16, margin: 0 },
  faqItem: { display: 'flex', flexDirection: 'column', gap: space.x4 },
})
