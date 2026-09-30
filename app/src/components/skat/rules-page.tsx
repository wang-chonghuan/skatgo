import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { POINTS, RANKS, type Rank, type Suit } from '~/lib/skat/cards'
import { contractName, rankLetter } from '~/lib/skat/i18n'
import { lessonById } from '~/lib/skat/lessons/content'
import { GUIDES } from '~/lib/skat/lessons/guide'
import { RULES } from '~/lib/skat/rules'
import type { EngineTable, RuleBlock } from '~/lib/skat/rules/types'
import { BID_LADDER, GRAND_BASE, NULL_VALUES, SUIT_BASE } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Band } from './frame'
import { Rich, linkLook } from './ui'

/**
 * The rules reference (SKATGO-29): the whole of Skat on one page, for someone looking a rule up — a
 * contents list, eight sections that each end in the lesson teaching them, and the two ways on (the
 * course, the table). Rendered on the server. The text is lib/skat/rules; every number a reader could
 * check against the game comes from the rules engine itself, so the page cannot disagree with it.
 */
export function RulesPage() {
  const locale = getLocale()
  const rules = RULES[locale]
  return (
    <div data-testid="rules" {...stylex.props(styles.root)}>
      <Band title={m.rules_title()} back="/" />
      <article {...stylex.props(styles.column)}>
        {rules.intro.map((text) => (
          <p key={text} {...stylex.props(typography.landingBody, styles.lead)}>
            <Rich text={text} />
          </p>
        ))}
        <Ways />

        <nav aria-labelledby="rules-contents" data-testid="rules-contents" {...stylex.props(styles.contents)}>
          <h2 id="rules-contents" {...stylex.props(typography.panelLabel, styles.contentsTitle)}>{m.rules_contents()}</h2>
          <ul {...stylex.props(styles.contentsList)}>
            {rules.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.anchor}`} {...stylex.props(typography.appText, styles.contentsLink)}>{s.title}</a>
              </li>
            ))}
          </ul>
        </nav>

        {rules.sections.map((s) => {
          const lesson = lessonById(s.lesson)
          return (
            <section key={s.id} id={s.anchor} data-testid="rules-section" data-section={s.id} {...stylex.props(styles.section)}>
              <h2 {...stylex.props(typography.optionTitle, styles.heading)}>{s.title}</h2>
              {s.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
              {lesson ? (
                <Link to="/course/$slug" params={{ slug: GUIDES[locale][lesson.id].slug }} data-testid="rules-lesson" {...stylex.props(typography.appBtnStrong, styles.lessonLink)}>
                  {m.rules_lesson_link({ n: lesson.id, title: lesson.title })}
                </Link>
              ) : null}
            </section>
          )
        })}

        <Ways />
      </article>
    </div>
  )
}

/** The page's two ways on: the course, and the table. */
function Ways() {
  return (
    <div {...stylex.props(styles.ways)}>
      <Link to="/course" {...linkLook('go', 'md')}>{m.rules_learn()}</Link>
      <Link to="/play" {...linkLook('quiet', 'md')}>{m.entry_game_cta()}</Link>
    </div>
  )
}

function Block({ block }: { block: RuleBlock }) {
  if (block.kind === 'p') {
    return (
      <p {...stylex.props(typography.appText, styles.text)}>
        <Rich text={block.text} />
      </p>
    )
  }
  if (block.kind === 'list') {
    return (
      <ul {...stylex.props(styles.list)}>
        {block.items.map((item) => (
          <li key={item} {...stylex.props(typography.appText, styles.text)}>
            <Rich text={item} />
          </li>
        ))}
      </ul>
    )
  }
  if (block.kind === 'example') {
    return (
      <div {...stylex.props(styles.example)}>
        <p {...stylex.props(typography.appBtnStrong, styles.exampleTitle)}>
          <Rich text={block.title} />
        </p>
        {block.lines.map((line) => (
          <p key={line} {...stylex.props(typography.appText, styles.text)}>
            <Rich text={line} />
          </p>
        ))}
      </div>
    )
  }
  return <EngineTableView table={block.table} />
}

const SUIT_ORDER: Suit[] = ['D', 'H', 'S', 'C']
const POINT_RANKS: Rank[] = [...RANKS].sort((a, b) => POINTS[b] - POINTS[a])

/** A table whose numbers come from the rules engine (value.ts, cards.ts). */
function EngineTableView({ table }: { table: EngineTable }) {
  if (table === 'biddingLadder') {
    return (
      <figure {...stylex.props(styles.figure)}>
        <figcaption {...stylex.props(typography.panelLabel, styles.caption)}>{m.rules_ladder_caption()}</figcaption>
        <p data-testid="rules-ladder" {...stylex.props(typography.appText, styles.ladder)}>
          {BID_LADDER.join(', ')}
        </p>
      </figure>
    )
  }
  const [head, rows]: [string[], (string | number)[][]] =
    table === 'cardPoints'
      ? [[m.rules_col_card(), m.rules_col_points()], POINT_RANKS.map((r) => [rankLetter(r), POINTS[r]])]
      : table === 'baseValues'
        ? [
            [m.rules_col_game(), m.rules_col_base()],
            [...SUIT_ORDER.map((s) => [contractName({ kind: 'suit', trump: s }), SUIT_BASE[s]]), [contractName({ kind: 'grand' }), GRAND_BASE]],
          ]
        : [
            [m.rules_col_game(), m.rules_col_value()],
            [
              [m.rules_null(), NULL_VALUES.plain],
              [m.rules_null_hand(), NULL_VALUES.hand],
              [m.rules_null_ouvert(), NULL_VALUES.ouvert],
              [m.rules_null_hand_ouvert(), NULL_VALUES.handOuvert],
            ],
          ]
  return (
    <table data-testid="rules-table" data-table={table} {...stylex.props(styles.table)}>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} scope="col" {...stylex.props(typography.panelLabel, styles.th, i > 0 && styles.number)}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, value]) => (
          <tr key={String(name)}>
            <th scope="row" {...stylex.props(typography.appText, styles.td)}>
              <Rich text={String(name)} />
            </th>
            <td {...stylex.props(typography.appBtnStrong, styles.td, styles.number)}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
  lead: { margin: 0, color: color.navy },
  ways: { display: 'flex', flexWrap: 'wrap', gap: space.x12 },
  contents: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    paddingBlock: space.x16,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  contentsTitle: { margin: 0, color: color.slate },
  contentsList: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0, paddingInlineStart: space.x20 },
  contentsLink: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  section: { display: 'flex', flexDirection: 'column', gap: space.x12, paddingTop: space.x16 },
  heading: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
  list: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0, paddingInlineStart: space.x20 },
  example: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    paddingBlock: space.x12,
    paddingInline: space.x16,
    borderInlineStartWidth: border.focus,
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: color.amber,
    backgroundColor: color.surface,
    borderRadius: radii.column,
  },
  exampleTitle: { margin: 0, color: color.navy },
  figure: { display: 'flex', flexDirection: 'column', gap: space.x6, margin: 0 },
  caption: { color: color.slate },
  ladder: { margin: 0, color: color.text, overflowWrap: 'anywhere' },
  table: { borderCollapse: 'collapse', width: '100%', maxWidth: dims.rulesTable },
  th: { paddingBlock: space.x8, paddingInline: space.x12, textAlign: 'start', color: color.slate, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  td: { paddingBlock: space.x8, paddingInline: space.x12, textAlign: 'start', color: color.text, borderBottomWidth: border.hair, borderBottomStyle: 'solid', borderBottomColor: color.hairline },
  number: { textAlign: 'end' },
  lessonLink: {
    alignSelf: 'flex-start',
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
