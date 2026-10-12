import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { type Card, type Contract, POINTS, RANKS, type Suit, strength, trumpSequence } from '~/lib/skat/cards'
import type { CardRow } from '~/lib/skat/lessons/types'
import { QUICK_START, type QuickCards } from '~/lib/skat/quickstart'
import { getLocale } from '~/paraglide/runtime'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { CardRowView } from './card-row'
import { Panel, Rich, linkLook } from './ui'

const GRAND: Contract = { kind: 'grand' }
const NULL: Contract = { kind: 'null' }

/** A suit's cards, strongest first, by the rules engine's own order in `contract`. */
const ordered = (suit: Suit, contract: Contract, ranks = RANKS): Card[] =>
  ranks.map((rank) => ({ suit, rank })).sort((a, b) => strength(b, contract) - strength(a, contract))

/** The cards beside a rule — every card, order and number the rules engine's, so the picture cannot say
 *  something the table does not do. */
function rowOf(cards: QuickCards): CardRow {
  switch (cards) {
    case 'points': {
      const counted = ordered('H', GRAND, RANKS.filter((r) => POINTS[r] > 0 && r !== 'J')).concat({ suit: 'H', rank: 'J' })
      return { cards: counted, captions: counted.map((c) => String(POINTS[c.rank])) }
    }
    case 'suitOrder':
      return { cards: ordered('S', GRAND, RANKS.filter((r) => r !== 'J')) }
    case 'jacks':
      return { cards: trumpSequence(GRAND) }
    case 'nullOrder':
      return { cards: ordered('H', NULL) }
  }
}

/**
 * Skat in 5 Minuten (SKATGO-89): the twelve rules a beginner needs to sit down at SkatGo's table, one
 * page under the course — the human's own twelve, numbered, the points and orders shown with the
 * engine's cards — then the way to the table, and the course and the rules for more. Rendered on the
 * server, like the rules, so it reads without JavaScript.
 */
export function QuickStartPage() {
  const page = QUICK_START[getLocale()]
  return (
    <div data-testid="quick-start" {...stylex.props(styles.root)}>
      <article {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{page.h1}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead)}>{page.lead}</p>
        <ol {...stylex.props(styles.rules)}>
          {page.rules.map((rule, i) => (
            <li key={i} data-testid="quick-rule" data-rule={i + 1} {...stylex.props(styles.rule)}>
              <span aria-hidden="true" {...stylex.props(typography.appBtnStrong, styles.number)}>{i + 1}</span>
              <div {...stylex.props(styles.body)}>
                <p {...stylex.props(typography.appText, styles.text)}>
                  <Rich text={rule.text} />
                </p>
                {rule.cards ? (
                  <div data-testid="quick-cards" data-cards={rule.cards} {...stylex.props(styles.cards)}>
                    <CardRowView row={rowOf(rule.cards)} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        {/* The one main action: straight to the table, where the hint and the assistant help on. */}
        <Panel tone="tip">
          <div {...stylex.props(styles.play)}>
            <p {...stylex.props(typography.appText, styles.text)}>{page.play.text}</p>
            <div {...stylex.props(styles.action)}>
              <Link to="/play" data-testid="quick-play" {...linkLook('go', 'md')}>{page.play.button}</Link>
            </div>
          </div>
        </Panel>
        <nav data-testid="quick-further" {...stylex.props(styles.further)}>
          <Link to="/course" {...stylex.props(typography.appLink, styles.link)}>{page.further.course}</Link>
          <Link to="/rules" {...stylex.props(typography.appLink, styles.link)}>{page.further.rules}</Link>
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
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
  rules: { display: 'flex', flexDirection: 'column', gap: space.x12, margin: 0, padding: 0, listStyleType: 'none' },
  // Each rule on its own line, its number ahead of it, the cards under its text.
  rule: {
    display: 'flex',
    gap: space.x12,
    paddingBottom: space.x12,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
  number: { flexShrink: 0, minWidth: space.x24, color: color.navy },
  body: { display: 'flex', flexDirection: 'column', gap: space.x10, minWidth: 0, flexGrow: 1 },
  text: { margin: 0, color: color.text },
  cards: { alignSelf: 'flex-start' },
  play: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  // A row of its own, so the button keeps its width instead of stretching across the panel.
  action: { display: 'flex' },
  further: { display: 'flex', flexWrap: 'wrap', gap: space.x16 },
  link: {
    color: color.info,
    textDecoration: { default: 'none', ':hover': 'underline' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
})
