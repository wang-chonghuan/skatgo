import * as stylex from '@stylexjs/stylex'
import { motion } from 'motion/react'

import { type Card, cardId, sameCard } from '~/lib/skat/cards'
import type { CardRow } from '~/lib/skat/lessons/types'
import { skat } from '../../theme/skat.stylex'
import { type CardSize, PlayingCard } from './playing-card'

/** A labelled row of cards for a teaching step. Wraps rather than overlaps: these are to be read. */
export function CardRowView({ row }: { row: CardRow }) {
  return (
    <figure {...stylex.props(styles.figure)}>
      {row.label ? <figcaption {...stylex.props(styles.label)}>{row.label}</figcaption> : null}
      <div {...stylex.props(styles.row)}>
        {row.cards.map((c, i) => (
          <div key={cardId(c) + i} {...stylex.props(styles.cell)}>
            <PlayingCard card={c} faceDown={row.faceDown} size={row.cards.length > 8 ? 'sm' : 'md'} />
            {row.captions?.[i] !== undefined ? <span {...stylex.props(styles.caption)}>{row.captions[i]}</span> : null}
          </div>
        ))}
      </div>
    </figure>
  )
}

type FanProps = {
  cards: Card[]
  size?: CardSize
  onPick?: (card: Card) => void
  selected?: Card[]
  legal?: Card[]
  glow?: Card[]
  verdicts?: { card: Card; verdict: 'good' | 'bad' }[]
  /** Badge over a card: the order it was tapped in. */
  badges?: { card: Card; text: string }[]
  /** The expected picks (`data-answer`) or the expected sequence (`data-order`), for scripted checks. */
  answer?: Card[]
  sequence?: Card[]
  testId?: string
}

/**
 * A hand held as a fan. Each card sits in a slot that may shrink below the card's width while the
 * card itself does not — so ten cards overlap to fit a phone and spread out on a desk, with no
 * arithmetic on the count.
 */
export function Fan({ cards, size = 'lg', onPick, selected = [], legal, glow = [], verdicts = [], badges = [], answer, sequence, testId }: FanProps) {
  const has = (list: Card[], c: Card) => list.some((d) => sameCard(c, d))
  // More than six cards are held as two rows on a phone. At 375px a single row of ten leaves each
  // card a 25px sliver, which a finger cannot hit reliably (measured: a tap on a card's centre landed
  // on its neighbour); two rows of five leave about 55px each. On a wide screen the two groups
  // dissolve (`display: contents`) and the fan is one row again.
  const half = cards.length > 6 ? Math.ceil(cards.length / 2) : cards.length
  const groups = [cards.slice(0, half), cards.slice(half)].filter((g) => g.length > 0)
  let index = 0
  return (
    <div data-testid={testId} {...stylex.props(styles.fan)}>
      {groups.map((group, g) => (
        <div key={g} {...stylex.props(styles.group, g > 0 && styles.lowerGroup)}>
          {group.map((c, j) => {
            const i = index++
            const isLegal = legal ? has(legal, c) : undefined
            const badge = badges.find((b) => sameCard(b.card, c))
            return (
              // `layout` lets the fan close up smoothly when a card leaves it. The motion transform
              // lives on the slot, never on the card, whose own transform (hover, raised) is StyleX's.
              <motion.div
                key={cardId(c)}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i, 12) * 0.025 }}
                {...stylex.props(
                  styles.slot,
                  slotSizes[size],
                  j === group.length - 1 && styles.groupLastSlot,
                  i === cards.length - 1 && styles.lastSlot,
                )}
              >
                <PlayingCard
                  card={c}
                  size={size}
                  onClick={onPick ? () => onPick(c) : undefined}
                  selected={has(selected, c)}
                  legal={isLegal}
                  dimmed={isLegal === false}
                  glow={has(glow, c)}
                  verdict={verdicts.find((v) => sameCard(v.card, c))?.verdict}
                  data={{
                    ...(answer ? { 'data-answer': String(has(answer, c)) } : {}),
                    ...(sequence ? { 'data-order': String(sequence.findIndex((d) => sameCard(c, d)) + 1) } : {}),
                  }}
                />
                {badge ? <span {...stylex.props(styles.badge)}>{badge.text}</span> : null}
              </motion.div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

const styles = stylex.create({
  figure: { margin: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: 600, color: skat.inkSoft },
  row: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  cell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  caption: { fontSize: 13, fontWeight: 700, color: skat.brassDeep },
  fan: {
    display: 'flex',
    flexDirection: { default: 'row', '@media (max-width: 480px)': 'column' },
    justifyContent: 'center',
    width: '100%',
    // Room for a raised (selected) card and its shadow, so the fan never clips its own cards.
    paddingTop: 20,
    paddingBottom: 6,
    paddingInline: 4,
    boxSizing: 'border-box',
  },
  group: { display: { default: 'contents', '@media (max-width: 480px)': 'flex' }, justifyContent: 'center', width: '100%' },
  // The lower row tucks under the upper one, the way a held hand overlaps — and it saves height.
  lowerGroup: { marginTop: { default: 0, '@media (max-width: 480px)': -34 } },
  slot: { position: 'relative', flexGrow: 0, flexShrink: 1, minWidth: 22 },
  // The last card of a row is never overlapped, so its slot must keep the card's full width. On a
  // wide screen only the fan's very last card is "last"; on a phone each row has its own.
  groupLastSlot: { flexShrink: { default: 1, '@media (max-width: 480px)': 0 } },
  lastSlot: { flexShrink: 0 },
  badge: {
    position: 'absolute',
    top: -8,
    left: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: skat.brass,
    color: skat.ink,
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 1px 3px ${skat.shadow}`,
    pointerEvents: 'none',
  },
})

// A slot is as wide as its card plus a breath; it shrinks when the row runs out of room.
const slotSizes = stylex.create({
  xs: { flexBasis: 38 },
  sm: { flexBasis: 58 },
  md: { flexBasis: { default: 80, '@media (max-width: 480px)': 64 } },
  lg: { flexBasis: { default: 104, '@media (max-width: 480px)': 78 } },
})
