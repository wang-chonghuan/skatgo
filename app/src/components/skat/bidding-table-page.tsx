import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { SUIT_SYMBOL, type Suit } from '~/lib/skat/cards'
import { contractName, suitName } from '~/lib/skat/i18n'
import { lessonById } from '~/lib/skat/lessons/content'
import { GUIDES } from '~/lib/skat/lessons/guide'
import { RULES } from '~/lib/skat/rules'
import { BID_LADDER, GRAND_BASE, MAX_MULTIPLIER, MIN_MULTIPLIER, NULL_VALUES, SUIT_BASE } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Rich, linkLook } from './ui'

const SUIT_ORDER: Suit[] = ['D', 'H', 'S', 'C']
const LEVELS = Array.from({ length: MAX_MULTIPLIER.suit - MIN_MULTIPLIER + 1 }, (_, i) => MIN_MULTIPLIER + i)
/** The bidding lesson: where the rules page's bidding section sends the learner. */
const BIDDING = 'bidding'

/**
 * The bidding table (SKATGO-50): every value a game can be worth, as the multiplier × game grid German
 * players know as the Reiztabelle, the Null values, and the order bids are called in. Every number is
 * the rules engine's (value.ts). Rendered on the server; on paper only the title and the tables remain.
 */
export function BiddingTablePage() {
  const locale = getLocale()
  const section = RULES[locale].sections.find((s) => s.id === BIDDING)
  const lesson = section ? lessonById(section.lesson) : undefined
  const games = [
    ...SUIT_ORDER.map((s) => ({ key: s, name: contractName({ kind: 'suit', trump: s }), short: SUIT_SYMBOL[s], label: suitName(s), base: SUIT_BASE[s], max: MAX_MULTIPLIER.suit })),
    { key: 'G', name: 'Grand', short: 'Grand', label: 'Grand', base: GRAND_BASE, max: MAX_MULTIPLIER.grand },
  ]
  const plain = { game: contractName({ kind: 'suit', trump: 'S' }), n: 2, base: SUIT_BASE.S }
  const hand = { game: 'Grand', n: 2, base: GRAND_BASE }
  return (
    <div data-testid="bidding-table" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.bidding_title()}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead, styles.screenOnly)}>{m.bidding_lead()}</p>

        <figure {...stylex.props(styles.figure)}>
          <figcaption {...stylex.props(typography.panelLabel, styles.caption)}>{m.bidding_matrix_caption()}</figcaption>
          <table data-testid="bidding-matrix" {...stylex.props(styles.table)}>
            <thead>
              <tr>
                <th scope="col" {...stylex.props(typography.panelLabel, styles.head)}>{m.bidding_col_level()}</th>
                {games.map((g) => (
                  <th key={g.key} scope="col" aria-label={g.label} {...stylex.props(typography.panelLabel, styles.head, styles.number)}>
                    <span {...stylex.props(styles.wide)}><Rich text={g.name} /></span>
                    <span aria-hidden {...stylex.props(styles.narrow)}><Rich text={g.short} /></span>
                  </th>
                ))}
              </tr>
              <tr>
                <th scope="row" {...stylex.props(typography.panelLabel, styles.head)}>{m.bidding_row_base()}</th>
                {games.map((g) => (
                  <td key={g.key} data-base={g.base} {...stylex.props(typography.panelLabel, styles.head, styles.number)}>{g.base}</td>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((level) => (
                <tr key={level} data-level={level}>
                  <th scope="row" {...stylex.props(typography.panelLabel, styles.cell, styles.level)}>{level}</th>
                  {games.map((g) => (
                    <td key={g.key} data-game={g.key} {...stylex.props(typography.appText, styles.cell, styles.number)}>
                      {level <= g.max ? g.base * level : m.bidding_none()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>

        <figure {...stylex.props(styles.figure)}>
          <figcaption {...stylex.props(typography.panelLabel, styles.caption)}>{m.bidding_null_caption()}</figcaption>
          <table data-testid="bidding-null" {...stylex.props(styles.table, styles.narrowTable)}>
            <tbody>
              {[
                [m.rules_null(), NULL_VALUES.plain],
                [m.rules_null_hand(), NULL_VALUES.hand],
                [m.rules_null_ouvert(), NULL_VALUES.ouvert],
                [m.rules_null_hand_ouvert(), NULL_VALUES.handOuvert],
              ].map(([name, value]) => (
                <tr key={name}>
                  <th scope="row" {...stylex.props(typography.appText, styles.cell, styles.start)}>{name}</th>
                  <td {...stylex.props(typography.appBtnStrong, styles.cell, styles.number)}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>

        <figure {...stylex.props(styles.figure)}>
          <figcaption {...stylex.props(typography.panelLabel, styles.caption)}>{m.rules_ladder_caption()}</figcaption>
          <p {...stylex.props(typography.appText, styles.text, styles.screenOnly)}>{m.bidding_ladder_note({ min: BID_LADDER[0] })}</p>
          <p data-testid="bidding-ladder" {...stylex.props(typography.appText, styles.text, styles.ladder)}>
            {BID_LADDER.join(', ')}
          </p>
        </figure>

        <section {...stylex.props(styles.section, styles.screenOnly)}>
          <h2 {...stylex.props(typography.optionTitle, styles.title)}>{m.bidding_how_title()}</h2>
          <p {...stylex.props(typography.appText, styles.text)}>
            <Rich text={m.bidding_how_text({ suit: MAX_MULTIPLIER.suit, grand: MAX_MULTIPLIER.grand })} />
          </p>
          <ul {...stylex.props(styles.list)}>
            <li {...stylex.props(typography.appText, styles.text)}>
              <Rich text={m.bidding_example_plain({ ...plain, level: plain.n + 1, value: plain.base * (plain.n + 1) })} />
            </li>
            <li {...stylex.props(typography.appText, styles.text)}>
              <Rich text={m.bidding_example_hand({ ...hand, level: hand.n + 2, value: hand.base * (hand.n + 2) })} />
            </li>
          </ul>
        </section>

        <nav aria-labelledby="bidding-more" data-testid="bidding-more" {...stylex.props(styles.section, styles.screenOnly)}>
          <h2 id="bidding-more" {...stylex.props(typography.optionTitle, styles.title)}>{m.bidding_more_title()}</h2>
          {section ? (
            <Link to="/rules" hash={section.anchor} data-testid="bidding-rules" {...stylex.props(typography.appBtnStrong, styles.link)}>
              {m.lesson_rules_link({ section: section.title })}
            </Link>
          ) : null}
          {lesson ? (
            <Link to="/course/$slug" params={{ slug: GUIDES[locale][lesson.id].slug }} data-testid="bidding-lesson" {...stylex.props(typography.appBtnStrong, styles.link)}>
              {m.rules_lesson_link({ n: lesson.id, title: lesson.title })}
            </Link>
          ) : null}
          <div {...stylex.props(styles.ways)}>
            <Link to="/play" {...linkLook('go', 'md')}>{m.entry_game_cta()}</Link>
          </div>
        </nav>
      </article>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x20,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  // On paper only the title and the tables remain (SKATGO-50).
  screenOnly: { display: { default: 'flex', [bp.print]: 'none' } },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  section: { flexDirection: 'column', gap: space.x12 },
  text: { margin: 0, color: color.text },
  list: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0, paddingInlineStart: space.x20 },
  figure: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0 },
  caption: { color: color.slate },
  ladder: { overflowWrap: 'anywhere' },
  table: { borderCollapse: 'collapse', width: '100%' },
  narrowTable: { maxWidth: dims.rulesTable },
  head: {
    paddingBlock: space.x8,
    paddingInline: { default: space.x12, [bp.phone]: space.x6 },
    textAlign: 'start',
    color: color.slate,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  cell: {
    paddingBlock: { default: space.x6, [bp.phone]: space.x4 },
    paddingInline: { default: space.x12, [bp.phone]: space.x6 },
    color: color.text,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  level: { textAlign: 'start', color: color.navy },
  start: { textAlign: 'start' },
  number: { textAlign: 'end' },
  // A suit's name on a wide screen, its symbol on a phone, so the six columns fit.
  wide: { display: { default: 'inline', [bp.phone]: 'none' } },
  narrow: { display: { default: 'none', [bp.phone]: 'inline' } },
  ways: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  link: {
    alignSelf: 'flex-start',
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
