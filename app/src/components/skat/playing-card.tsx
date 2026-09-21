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
import type { ComponentType, SVGProps } from 'react'

import { type Card, cardId } from '~/lib/skat/cards'
import { spokenCard } from '~/lib/skat/i18n'
import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'

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

/** The library names a card by suit letter plus lower-case rank: `Cj`, `H10`, `Sa`. */
function faceOf(card: Card): Face {
  return FACES[`${card.suit}${card.rank.toLowerCase()}`]
}

export type CardSize = 'xs' | 'sm' | 'md' | 'lg'

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
  // a face-down card is most of what the learner sees of their opponents.
  const body = faceDown ? (
    <span {...stylex.props(styles.back)} />
  ) : (
    <Face {...stylex.props(styles.face)} aria-hidden="true" focusable="false" />
  )
  // `clickable` first: it sets the resting and hover transform, and `selected` must win over both.
  const look = stylex.props(
    styles.card,
    sizes[size],
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
    aspectRatio: '5 / 7',
    padding: 0,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: skat.white,
    boxShadow: `0 2px 6px ${skat.shadow}`,
    overflow: 'hidden',
    transitionProperty: 'transform, box-shadow, opacity, filter',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease-out',
  },
  face: { display: 'block', width: '100%', height: '100%' },
  back: {
    display: 'block',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    borderWidth: 3,
    borderStyle: 'solid',
    borderColor: skat.white,
    borderRadius: 'inherit',
    backgroundColor: skat.red,
    backgroundImage: `repeating-linear-gradient(45deg, ${skat.shadowSoft} 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, ${skat.shadowSoft} 0 4px, transparent 4px 8px)`,
  },
  clickable: {
    cursor: 'pointer',
    transform: { default: 'translateY(0)', ':hover': 'translateY(-6px)' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: 3,
    outlineColor: skat.brass,
    outlineOffset: 2,
  },
  selected: {
    transform: { default: 'translateY(-16px)', ':hover': 'translateY(-16px)' },
    boxShadow: `0 10px 18px ${skat.shadow}, 0 0 0 3px ${skat.brass}`,
  },
  dimmed: { filter: 'brightness(0.62) saturate(0.7)' },
  glow: { boxShadow: `0 0 0 3px ${skat.brass}, 0 0 18px 4px ${skat.glow}` },
  good: { boxShadow: `0 0 0 4px ${skat.good}` },
  bad: { boxShadow: `0 0 0 4px ${skat.bad}` },
})

const sizes = stylex.create({
  xs: { width: 34, borderRadius: 4 },
  sm: { width: 52, borderRadius: 6 },
  md: { width: { default: 72, '@media (max-width: 480px)': 58 } },
  lg: { width: { default: 96, '@media (max-width: 480px)': 72 } },
})
