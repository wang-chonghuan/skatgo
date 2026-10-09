import * as stylex from '@stylexjs/stylex'

import { type Card, type Rank, type Suit, cardId } from '~/lib/skat/cards'
import { spokenCard } from '~/lib/skat/i18n'
import { m } from '~/paraglide/messages'
import { type Deck, useDeck } from '~/lib/skat/settings'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { move, timing } from '../../theme/effects.stylex'
import { elev, fill } from '../../theme/elevation.stylex'
import { border } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { stage } from '../../theme/table.stylex'
import { suit } from '../../theme/suits.stylex'
import { CAP, GLYPHS } from './card-glyphs'

// One playing card, by default in the Turnierblatt German Skat tournaments use (SKATGO-66): French suits in
// the four German colours (the suit's colour from theme/suits.stylex.ts), the court figures drawn for skatgo
// (app/brand/cards, PROVENANCE.md) and served from /cards. The corner letters are the tournament deck's
// B / D / K / A, or J / Q / K / A when the learner chose that deck in the settings. The settings also
// offer the German-suited deck (Eichel, Grün, Herz, Schellen; Unter, Ober, König, Daus): the same layout
// with the German suit symbols as pips, its own courts and the Daus pictures, and K / O / U / A.
//
// The face is one SVG in a 500 × 700 box, drawn here: the corner index (the rank as Bebas Neue outlines
// over the suit pip, top left and turned bottom right), then the pips of 7–10 in their traditional places,
// the ace's single large pip, or a court's double-headed figure inside a frame notched for the index.
// The index is paths, never text: SVG text is page text, and a search engine reads it (SKATGO-29).

const W = 500
const H = 700

/** The pips, each in a 100 × 100 box, filled with the suit's colour. */
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
const PIPS: Record<Suit, string> = {
  H: 'M50 94C34 78 2 58 2 30C2 13 15 2 29 2C39 2 46 8 50 17C54 8 61 2 71 2C85 2 98 13 98 30C98 58 66 78 50 94Z',
  D: 'M50 0C60 18 74 36 90 50C74 64 60 82 50 100C40 82 26 64 10 50C26 36 40 18 50 0Z',
  S: 'M50 2C62 22 98 40 98 64C98 79 87 88 74 88C64 88 57 83 53 76C54 87 59 94 68 100H32C41 94 46 87 47 76C43 83 36 88 26 88C13 88 2 79 2 64C2 40 38 22 50 2Z',
  C: `${circle(50, 27, 23)}${circle(25, 60, 23)}${circle(75, 60, 23)}M50 34L30 62H70ZM47 58C47 78 42 91 32 100H68C58 91 53 78 53 58Z`,
}

/** What the corner says for each rank in each deck: official Skat's B / D / K / A, J / Q / K / A, or
 *  the German deck's Unter, Ober, König and Daus. */
const LETTERS: Record<Deck, Partial<Record<Rank, string>>> = {
  tournament: { J: 'B', Q: 'D', K: 'K', A: 'A' },
  german: { J: 'U', Q: 'O', K: 'K', A: 'A' },
  jqk: { J: 'J', Q: 'Q', K: 'K', A: 'A' },
}
/** The German deck's court pictures are named by its own ranks. */
const GERMAN_COURT: Partial<Record<Rank, string>> = { J: 'U', Q: 'O', K: 'K' }
export function indexOf(rank: Rank, deck: Deck): string {
  return LETTERS[deck][rank] ?? rank
}

// The index: its letters LETTER tall from the top, the pip under them, centred on INDEX_X.
const LETTER = 84
const INDEX_X = 46
const INDEX_TOP = 28
const INDEX_PIP = 50
/** The corner the index keeps to itself: the court frame steps around it. */
const NOTCH_W = 96
const NOTCH_H = INDEX_TOP + LETTER + 14 + INDEX_PIP + 14
/** The court frame and the half of it each figure fills (the court images are cut to this shape). */
const FRAME = { x: 26, y: 26, w: 448, h: 648 }
/** The frame's hairline, in the face's units: it scales with the card like the rest of the drawing. */
const FRAME_LINE = 2

/** A pip: the French suit's path in the suit's colour, or the German deck's own symbol picture. */
function Pip({ s, x, y, size, turned, german }: { s: Suit; x: number; y: number; size: number; turned?: boolean; german?: boolean }) {
  const turn = turned ? ` rotate(180 ${x} ${y})` : ''
  if (german) return <image href={`/cards/german/sym-${s}.webp`} x={x - size / 2} y={y - size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" transform={turn.trim() || undefined} />
  const k = size / 100
  return <path d={PIPS[s]} transform={`translate(${x} ${y})${turned ? ' rotate(180)' : ''} scale(${k}) translate(-50 -50)`} />
}

function Index({ letters, s, german }: { letters: string; s: Suit; german: boolean }) {
  const k = LETTER / CAP
  const width = [...letters].reduce((n, ch) => n + GLYPHS[ch].w, 0)
  let x = INDEX_X / k - width / 2
  return (
    <g>
      <g transform={`translate(0 ${INDEX_TOP}) scale(${k})`}>
        {[...letters].map((ch) => {
          const at = x
          x += GLYPHS[ch].w
          return <path key={at} d={GLYPHS[ch].d} transform={`translate(${at} 0)`} />
        })}
      </g>
      <Pip s={s} x={INDEX_X} y={INDEX_TOP + LETTER + 14 + INDEX_PIP / 2} size={INDEX_PIP} german={german} />
    </g>
  )
}

// The pips' places on 7–10, as (x, y) of each pip's centre; a pip below the middle is turned, as printed.
const L = 160
const R = 340
const C = 250
const ROWS3 = [118, 350, 582]
const ROWS4 = [118, 273, 427, 582]
const LAYOUT: Partial<Record<Rank, [number, number][]>> = {
  '7': [...ROWS3.flatMap((y): [number, number][] => [[L, y], [R, y]]), [C, 234]],
  '8': [...ROWS3.flatMap((y): [number, number][] => [[L, y], [R, y]]), [C, 234], [C, 466]],
  '9': [...ROWS4.flatMap((y): [number, number][] => [[L, y], [R, y]]), [C, 350]],
  '10': [...ROWS4.flatMap((y): [number, number][] => [[L, y], [R, y]]), [C, 196], [C, 504]],
}
const PIP = 84
/** The German symbols are pictures with a margin of their own: drawn a little larger to look the same. */
const GERMAN_PIP = 96
const ACE = 230
/** Where the German Daus picture sits, clear of the two indices. */
const DAUS = { x: 70, y: 80, w: 360, h: 540 }

/** The court frame: the card's inside, less the two corners the index keeps. */
const FRAME_PATH = [
  `M${NOTCH_W} ${FRAME.y}H${FRAME.x + FRAME.w}V${H - NOTCH_H}H${W - NOTCH_W}V${FRAME.y + FRAME.h}`,
  `H${FRAME.x}V${NOTCH_H}H${NOTCH_W}Z`,
].join('')

function Court({ c, german }: { c: Card; german: boolean }) {
  const id = `court-${german ? 'german' : 'french'}-${c.suit}${c.rank}`
  const href = german ? `/cards/german/${c.suit}-${GERMAN_COURT[c.rank]}.webp` : `/cards/french/${c.suit}-${c.rank}.webp`
  const half = FRAME.h / 2
  // Each half reaches a unit past the middle, so no seam shows where they meet.
  const top = <image href={href} x={FRAME.x} y={FRAME.y} width={FRAME.w} height={half + 1} preserveAspectRatio="xMidYMax meet" />
  return (
    <g>
      <clipPath id={id}>
        <path d={FRAME_PATH} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        {top}
        <g transform={`rotate(180 ${W / 2} ${H / 2})`}>{top}</g>
      </g>
      <path d={FRAME_PATH} strokeWidth={FRAME_LINE} {...stylex.props(styles.frame)} />
    </g>
  )
}

/** The face of `c`: index, then pips, the ace (the German Daus picture), or the court. The letters and a
 *  French pip take the card's colour (`currentColor`). */
function Face({ c, letters, german }: { c: Card; letters: string; german: boolean }) {
  const places = LAYOUT[c.rank]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" fill="currentColor" {...stylex.props(styles.face)}>
      {places ? places.map(([x, y]) => <Pip key={`${x}-${y}`} s={c.suit} x={x} y={y} size={german ? GERMAN_PIP : PIP} turned={y > H / 2} german={german} />) : null}
      {c.rank === 'A' && german ? <image href={`/cards/german/${c.suit}-A.webp`} x={DAUS.x} y={DAUS.y} width={DAUS.w} height={DAUS.h} preserveAspectRatio="xMidYMid meet" /> : null}
      {c.rank === 'A' && !german ? <Pip s={c.suit} x={W / 2} y={H / 2} size={ACE} /> : null}
      {places || c.rank === 'A' ? null : <Court c={c} german={german} />}
      <Index letters={letters} s={c.suit} german={german} />
      <g transform={`rotate(180 ${W / 2} ${H / 2})`}>
        <Index letters={letters} s={c.suit} german={german} />
      </g>
    </svg>
  )
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
  const deckChoice = useDeck()
  const german = deckChoice === 'german'
  const letters = indexOf(card.rank, deckChoice)
  // The back is skatgo's own (SKATGO-66): a charcoal and white ornament inside a white frame.
  const body = faceDown ? (
    <span {...stylex.props(styles.back)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false" {...stylex.props(styles.face)}>
        <image href="/cards/back.webp" width={W} height={H} preserveAspectRatio="xMidYMid slice" />
      </svg>
    </span>
  ) : (
    <Face c={card} letters={letters} german={german} />
  )
  const deck = faceDown ? undefined : { 'data-deck': german ? 'german' : 'french', 'data-index': letters }
  // `clickable` first: it sets the resting and hover transform, and `selected` must win over both.
  const look = stylex.props(
    styles.card,
    sizes[size],
    // The suit's colour, which the face's pips and index take as `currentColor`.
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
      <div data-card={faceDown ? 'back' : cardId(card)} {...deck} role="img" aria-label={faceDown ? m.card_back() : spokenCard(card)} {...look}>
        {body}
      </div>
    )
  }
  return (
    <button
      type="button"
      data-card={cardId(card)}
      {...deck}
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
    transitionDuration: { default: timing.card, [bp.reducedMotion]: timing.instant },
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
    overflow: 'hidden',
  },
  // The court frame's hairline.
  frame: { fill: 'none', stroke: color.slate },
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

// Each suit's colour on a card face (theme/suits.stylex.ts).
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
  /** The hand along the bottom of the card table: the stage's card (SKATGO-34), scaled with the felt. */
  table: { width: stage.handCard },
})
