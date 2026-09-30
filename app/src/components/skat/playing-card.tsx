import * as stylex from '@stylexjs/stylex'
import {
  C7,
  C8,
  C9,
  C10,
  Cj,
  Cq,
  Ck,
  Ca,
  S7,
  S8,
  S9,
  S10,
  Sj,
  Sq,
  Sk,
  Sa,
  H7,
  H8,
  H9,
  H10,
  Hj,
  Hq,
  Hk,
  Ha,
  D7,
  D8,
  D9,
  D10,
  Dj,
  Dq,
  Dk,
  Da,
} from '@letele/playing-cards'
import { Children, type ComponentType, type ReactNode, type SVGProps, cloneElement, isValidElement } from 'react'

import { type Card, cardId } from '~/lib/skat/cards'
import { spokenCard } from '~/lib/skat/i18n'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { move, timing } from '../../theme/effects.stylex'
import { elev, fill } from '../../theme/elevation.stylex'
import { border } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { suit } from '../../theme/suits.stylex'

// One playing card. The faces are Adrian Kennard's public-domain SVG deck (via
// @letele/playing-cards) — a learner who is about to sit down with real people should practise on
// cards that look like the ones they will be dealt, court figures and all.

type Face = ComponentType<SVGProps<SVGSVGElement>>
// Named imports, not the namespace: the package also carries 2–6 and the jokers, which a Skat deck
// never uses, and importing the namespace would ship all of them.
const FACES: Record<string, Face> = {
  C7,
  C8,
  C9,
  C10,
  Cj,
  Cq,
  Ck,
  Ca,
  S7,
  S8,
  S9,
  S10,
  Sj,
  Sq,
  Sk,
  Sa,
  H7,
  H8,
  H9,
  H10,
  Hj,
  Hq,
  Hk,
  Ha,
  D7,
  D8,
  D9,
  D10,
  Dj,
  Dq,
  Dk,
  Da,
}

const COURT: readonly string[] = ['J', 'Q', 'K']

// SKATGO-27: a face's suit symbols and corner index take the card's suit colour; nothing else changes.
// The deck (surveyed card by card) draws them as symbols: on 7-10 and the ace, symbols `a` and `b`
// are all there is — the index and the pips; on a court, `a` is the pip and `h` the corner letter,
// while the figure is other symbols (`b` gold, `c` red, `d` blue, `e` its outline). The face is
// rendered with those two symbols' fill and stroke set to `currentColor`, which the card's `color`
// (its suit, from theme/suits.stylex.ts) supplies. Done on the element tree, not by a stylesheet:
// a selector cannot reach the copies a <use> renders, and a tree rewrite is the same on the server
// and in the browser.
const INK_PIP = ['a', 'b']
const INK_COURT = ['a', 'h']

function inked(node: ReactNode, keys: string[], within: boolean): ReactNode {
  if (!isValidElement(node)) return node
  // The deck's Ace of Spades carries its maker's address as SVG text ("www.me.uk /cards/"). SVG text is
  // page text — a search engine read it into the front page (SKATGO-29). The deck is CC0, so no credit
  // is owed; no face draws any other text.
  if (node.type === 'text') return null
  const props = node.props as { id?: unknown; fill?: unknown; stroke?: unknown; children?: ReactNode }
  const here = within || (node.type === 'symbol' && typeof props.id === 'string' && keys.some((k) => (props.id as string).endsWith(`_svg__${k}`)))
  const change: Record<string, unknown> = {}
  // The deck frames every face with a black-stroked rect; clipped by the card's rounded corners it reads
  // as an uneven black edge. The card's white face and its shadow already draw the edge.
  if (node.type === 'rect' && props.stroke) change.stroke = 'none'
  if (here && node.type === 'path') {
    if (props.fill !== 'none') change.fill = 'currentColor'
    if (props.stroke) change.stroke = 'currentColor'
  }
  if (props.children !== undefined) change.children = Children.map(props.children, (c) => inked(c, keys, here))
  return cloneElement(node, change)
}

/** The deck's face with its suit symbols and corner index in the card's colour. */
function InkedFace({ face, court, ...rest }: { face: Face; court: boolean } & SVGProps<SVGSVGElement>) {
  // The deck's faces are plain function components (svgr output, no hooks), so calling one yields its
  // element tree to rewrite.
  const draw = face as (p: SVGProps<SVGSVGElement>) => ReactNode
  const drawn = draw({ ...rest, 'aria-hidden': true, focusable: 'false' })
  return <>{inked(drawn, court ? INK_COURT : INK_PIP, false)}</>
}

/** The library names a card by suit letter plus lower-case rank: `Cj`, `H10`, `Sa`. */
function faceOf(card: Card): Face {
  return FACES[`${card.suit}${card.rank.toLowerCase()}`]
}

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'table' | 'trick' | 'fill'

type Props = {
  card: Card
  faceDown?: boolean
  size?: CardSize
  /** Raised out of the hand: chosen for a discard, or an answer being built. */
  selected?: boolean
  /** Greyed: not playable right now. Still clickable, so the table can explain why. */
  dimmed?: boolean
  /** Ringed in brass: the hint, or the card that took the trick. */
  glow?: boolean
  /** Judged: a drill marks the learner's picks right or wrong. */
  verdict?: 'good' | 'bad'
  legal?: boolean
  /** Extra data-* attributes: how a scripted check finds the expected answer without re-deriving the rules. */
  data?: Record<string, string>
  onClick?: () => void
}

export function PlayingCard({ card, faceDown, size = 'md', selected, dimmed, glow, verdict, legal, data, onClick }: Props) {
  const Face = faceOf(card)
  // The back is drawn here rather than taken from the deck: the library's back is a flat grey, and
  // a face-down card is most of what the learner sees of their opponents. It is skatgo's own design
  // (SKATGO-26): a fine light lattice on charcoal inside a white frame.
  const body = faceDown ? (
    <span {...stylex.props(styles.back)} />
  ) : (
    <InkedFace face={Face} court={COURT.includes(card.rank)} {...stylex.props(styles.face)} />
  )
  // `clickable` first: it sets the resting and hover transform, and `selected` must win over both.
  const look = stylex.props(
    styles.card,
    sizes[size],
    // The suit's colour, which app.css hands to the face's pips and indices (SKATGO-27).
    !faceDown && suitInk[card.suit],
    onClick ? styles.clickable : null,
    selected && styles.selected,
    dimmed && styles.dimmed,
    glow && styles.glow,
    verdict === 'good' && styles.good,
    verdict === 'bad' && styles.bad,
  )
  if (!onClick) {
    return (
      <div data-card={faceDown ? 'back' : cardId(card)} role="img" aria-label={faceDown ? m.card_back() : spokenCard(card)} {...look}>
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      data-card={cardId(card)}
      data-legal={legal === undefined ? undefined : String(legal)}
      data-selected={selected ? 'true' : undefined}
      aria-label={spokenCard(card)}
      aria-pressed={selected}
      onClick={onClick}
      {...data}
      {...look}
    >
      {body}
    </button>
  )
}

const styles = stylex.create({
  card: {
    display: 'block',
    flexShrink: 0,
    aspectRatio: dims.cardAspect,
    padding: 0,
    borderWidth: 0,
    borderRadius: radii.card,
    backgroundColor: color.surface,
    boxShadow: elev.card,
    overflow: 'hidden',
    transitionProperty: 'transform, box-shadow, opacity, filter',
    transitionDuration: timing.card,
    transitionTimingFunction: timing.easeOut,
  },
  face: { display: 'block', width: '100%', height: '100%' },
  back: {
    display: 'block',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    borderWidth: border.frame,
    borderStyle: 'solid',
    borderColor: color.surface,
    borderRadius: 'inherit',
    backgroundColor: color.cardBack,
    backgroundImage: fill.cardBack,
  },
  clickable: {
    cursor: 'pointer',
    transform: { default: move.rest, ':hover': move.cardHover },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.gold,
    outlineOffset: border.focusOffset,
  },
  selected: {
    transform: { default: move.cardRaised, ':hover': move.cardRaised },
    boxShadow: elev.cardRaised,
  },
  dimmed: { filter: fill.dimmed },
  glow: { boxShadow: elev.cardGlow },
  good: { boxShadow: elev.verdictGood },
  bad: { boxShadow: elev.verdictBad },
})

// Each suit's colour on a card face, from the chosen scheme (theme/suits.stylex.ts).
const suitInk = stylex.create({
  C: { color: suit.cardClubs },
  S: { color: suit.cardSpades },
  H: { color: suit.cardHearts },
  D: { color: suit.cardDiamonds },
})

const sizes = stylex.create({
  xs: { width: dims.cardXs, borderRadius: radii.cardXs },
  sm: { width: dims.cardSm, borderRadius: radii.cardSm },
  md: { width: { default: dims.cardMd, [bp.phone]: dims.cardMdPhone } },
  lg: { width: { default: dims.cardLg, [bp.phone]: dims.cardLgPhone } },
  /** A card played into the trick in the table's frame. */
  trick: { width: { default: dims.cardLg, [bp.phone]: dims.cardMdPhone } },
  /** As wide as its box: the trick's cards take their size from the frame. */
  fill: { width: '100%' },
  /** The hand along the bottom of the card table. */
  table: { width: { default: dims.cardTable, [bp.phone]: dims.cardTablePhone } },
})
