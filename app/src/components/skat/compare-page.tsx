import * as stylex from '@stylexjs/stylex'
import { Link } from '@tanstack/react-router'

import { COLUMNS, type Column, compareFaq, SITES } from '~/lib/compare'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { linkLook } from './ui'

/**
 * The big online Skat sites side by side (SKATGO-228): a search entry for the people who look for them, apart from the
 * app — reached only from the footer (the human: 「可以放到footerlink里……但是别在其他地方乱搞入口」) — that speaks well of
 * every provider and leads to SkatGo's front page (「可以比较，但是都说好话，主要是导流到skatgo首页」): a box at its top
 * and its end says SkatGo is free with no sign-up and opens the front page. The facts are `lib/compare.ts`'s, each from the
 * provider's own pages; no other provider's picture is shown — the pictures are SkatGo's own screens
 * (`scripts/make-compare-shots.mjs`).
 */
export function ComparePage() {
  const locale = getLocale()
  const columns: Record<Column, string> = {
    opponents: m.compare_col_opponents(),
    platforms: m.compare_col_platforms(),
    rules: m.compare_col_rules(),
    compete: m.compare_col_compete(),
    learn: m.compare_col_learn(),
  }
  const shots = [
    { name: 'odds', title: m.compare_shot_odds_title(), text: m.compare_shot_odds_text() },
    { name: 'bidding', title: m.compare_shot_bidding_title(), text: m.compare_shot_bidding_text() },
    { name: 'endgame', title: m.compare_shot_endgame_title(), text: m.compare_shot_endgame_text() },
    { name: 'lesson', title: m.compare_shot_lesson_title(), text: m.compare_shot_lesson_text() },
  ]
  const more = [m.compare_more_1(), m.compare_more_2(), m.compare_more_3(), m.compare_more_4()]
  const guide = [
    { title: m.compare_guide_1_title(), text: m.compare_guide_1_text() },
    { title: m.compare_guide_2_title(), text: m.compare_guide_2_text() },
    { title: m.compare_guide_3_title(), text: m.compare_guide_3_text() },
    { title: m.compare_guide_4_title(), text: m.compare_guide_4_text() },
  ]
  const others = SITES.filter((s) => s.id !== 'skatgo')

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
    <div data-testid="compare" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.compare_title()}</h1>
        <p {...stylex.props(typography.body, styles.text)}>{m.compare_lead()}</p>
        {cta('compare-cta-top')}

        <section data-testid="compare-matrix" aria-labelledby="compare-matrix-title" {...stylex.props(styles.section)}>
          <h2 id="compare-matrix-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_matrix_title()}</h2>
          <p {...stylex.props(typography.note, styles.muted)}>{m.compare_matrix_note()}</p>
          <div role="region" aria-label={m.compare_matrix_title()} tabIndex={0} data-testid="compare-scroll" {...stylex.props(styles.scroll)}>
            <table {...stylex.props(styles.table)}>
              <thead>
                <tr>
                  <th scope="col" {...stylex.props(typography.panelLabel, styles.head, styles.sticky)}>{m.compare_col_site()}</th>
                  {COLUMNS.map((c) => <th key={c} scope="col" {...stylex.props(typography.panelLabel, styles.head)}>{columns[c]}</th>)}
                </tr>
              </thead>
              <tbody>
                {SITES.map((site) => (
                  <tr key={site.id} data-site={site.id}>
                    <th scope="row" {...stylex.props(typography.body, typography.emphasis, styles.cell, styles.sticky, site.id === 'skatgo' && styles.ours)}>
                      <a href={`#${site.id}`} {...stylex.props(styles.rowLink)}>{site.name}</a>
                    </th>
                    {COLUMNS.map((c) => (
                      <td key={c} data-mark={site.cells[c].mark} {...stylex.props(typography.bodySmall, styles.cell, site.id === 'skatgo' && styles.ours)}>
                        {site.cells[c].short[locale]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p aria-hidden {...stylex.props(typography.note, styles.muted, styles.phoneOnly)}>{m.compare_matrix_scroll()}</p>
        </section>

        <section id="skatgo" data-testid="compare-skatgo" aria-labelledby="compare-skatgo-title" {...stylex.props(styles.section, styles.anchor)}>
          <h2 id="compare-skatgo-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_skatgo_title()}</h2>
          <div {...stylex.props(styles.shots)}>
            {shots.map((s) => (
              <figure key={s.name} {...stylex.props(styles.shot)}>
                <img src={`/compare/${s.name}-${locale}.webp`} alt={s.title} loading="lazy" {...stylex.props(styles.shotImage)} />
                <figcaption {...stylex.props(styles.shotText)}>
                  <span {...stylex.props(typography.body, typography.emphasis, styles.title)}>{s.title}</span>
                  <span {...stylex.props(typography.bodySmall, styles.text)}>{s.text}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <ul {...stylex.props(styles.list)}>
            {more.map((line) => <li key={line} {...stylex.props(typography.body, styles.text)}>{line}</li>)}
          </ul>
        </section>

        <section data-testid="compare-guide" aria-labelledby="compare-guide-title" {...stylex.props(styles.section)}>
          <h2 id="compare-guide-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_guide_title()}</h2>
          <div {...stylex.props(styles.sites)}>
            {guide.map((g) => (
              <div key={g.title} {...stylex.props(styles.guide)}>
                <h3 {...stylex.props(typography.body, typography.emphasis, styles.title)}>{g.title}</h3>
                <p {...stylex.props(typography.body, styles.text)}>{g.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="compare-sites" aria-labelledby="compare-sites-title" {...stylex.props(styles.section)}>
          <h2 id="compare-sites-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_sites_title()}</h2>
          <div {...stylex.props(styles.sites)}>
            {others.map((site) => (
              <article key={site.id} id={site.id} data-testid="compare-site" {...stylex.props(styles.site, styles.anchor)}>
                <h3 {...stylex.props(typography.optionTitle, styles.title)}>{site.name}</h3>
                <p {...stylex.props(typography.bodySmall, styles.muted)}>{m.compare_operator()}: {site.operator} · {m.compare_suits()}: {site.suits[locale]}</p>
                <p {...stylex.props(typography.body, styles.text)}>{site.about[locale]}</p>
                <dl {...stylex.props(styles.details)}>
                  {COLUMNS.map((c) => (
                    <div key={c} {...stylex.props(styles.detail)}>
                      <dt {...stylex.props(typography.bodySmall, typography.emphasis, styles.title, styles.inline)}>{columns[c]}:</dt>{' '}
                      <dd {...stylex.props(typography.bodySmall, styles.text, styles.inline)}>{site.cells[c].text[locale]}</dd>
                    </div>
                  ))}
                </dl>
                {site.highlights.length > 0 ? (
                  <ul {...stylex.props(styles.list)}>
                    {site.highlights.map((h) => <li key={h.text.en} {...stylex.props(typography.bodySmall, styles.text)}>{h.text[locale]}</li>)}
                  </ul>
                ) : null}
                <a href={site.url} target="_blank" rel="nofollow noopener" {...stylex.props(typography.link, styles.link)}>{m.compare_visit()}: {site.name}</a>
              </article>
            ))}
          </div>
        </section>

        <section data-testid="compare-faq" aria-labelledby="compare-faq-title" {...stylex.props(styles.section)}>
          <h2 id="compare-faq-title" {...stylex.props(typography.optionTitle, styles.title)}>{m.compare_faq_title()}</h2>
          <dl {...stylex.props(styles.faq)}>
            {compareFaq().map(({ q, a }) => (
              <div key={q} {...stylex.props(styles.faqItem)}>
                <dt {...stylex.props(typography.body, typography.emphasis, styles.title)}>{q}</dt>
                <dd {...stylex.props(typography.body, styles.text)}>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {cta('compare-cta-end')}
        <div data-testid="compare-note" {...stylex.props(styles.notes)}>
          <p {...stylex.props(typography.note, styles.muted)}>{m.compare_note()}</p>
          <p {...stylex.props(typography.note, styles.muted)}>
            {m.compare_fix()}{' '}
            <Link to="/terms" hash="legal-operator" {...stylex.props(typography.note, styles.link)}>{m.legal_operator()}</Link>
          </p>
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
    gap: space.x24,
    width: '100%',
    maxWidth: dims.landingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  anchor: { scrollMarginTop: space.x80 },
  title: { margin: 0, color: color.navy, overflowWrap: 'anywhere' },
  text: { margin: 0, color: color.text },
  muted: { margin: 0, color: color.slate },
  inline: { display: 'inline', margin: 0 },
  phoneOnly: { display: { default: 'none', [bp.phone]: 'block' } },
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
  // The table keeps its own width on a phone and slides inside this box, so the page itself never scrolls sideways.
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
  table: { borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: { default: 0, [bp.phone]: dims.readingColumn } },
  head: {
    paddingBlock: space.x8,
    paddingInline: space.x12,
    textAlign: 'start',
    verticalAlign: 'bottom',
    color: color.slate,
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
  // The provider's name stays in view while the row slides.
  sticky: {
    position: 'sticky',
    insetInlineStart: 0,
    borderInlineEndWidth: border.hair,
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: color.hairline,
  },
  ours: { backgroundColor: color.goodSoft },
  rowLink: { color: color.navy, textDecoration: 'none' },
  shots: {
    display: 'grid',
    gridTemplateColumns: { default: dims.faceChoices, [bp.phone]: dims.boardColumns },
    gap: space.x16,
  },
  shot: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0 },
  shotImage: {
    display: 'block',
    width: '100%',
    height: 'auto',
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
  },
  shotText: { display: 'flex', flexDirection: 'column', gap: space.x4 },
  list: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0, paddingInlineStart: space.x20, listStyleType: 'disc' },
  sites: {
    display: 'grid',
    gridTemplateColumns: { default: dims.boardColumns, [bp.phone]: dims.oneColumn },
    gap: space.x16,
  },
  guide: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  site: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    padding: space.x16,
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
  },
  // Each criterion in full, its name in bold at the start of the line.
  details: { display: 'flex', flexDirection: 'column', gap: space.x4, margin: 0 },
  detail: {
    paddingBlock: space.x4,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
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
