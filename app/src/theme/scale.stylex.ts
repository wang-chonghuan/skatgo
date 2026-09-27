import * as stylex from '@stylexjs/stylex'

// The course's structural scales: spacing, corner radius, border width, component dimensions, opacity
// and stacking. Product code names these; it never writes a size of its own (check-design-tokens.mjs).
// Changing a value here restyles every use of it — that is the point, and ui.md Redline 1 governs it.

/** Spacing steps for padding, gap and margin. Named by their size in px. */
export const space = stylex.defineVars({
  x2: '2px',
  x4: '4px',
  x6: '6px',
  x8: '8px',
  x10: '10px',
  x12: '12px',
  x14: '14px',
  x16: '16px',
  x18: '18px',
  x20: '20px',
  x24: '24px',
  x28: '28px',
  /** Vertical breathing room of the finish screen. */
  x40: '40px',
  /** Vertical breathing room of the loading line. */
  x80: '80px',
})

/** Corner radius, by what the thing is. */
export const radius = stylex.defineVars({
  /** Fully round: buttons, pills, toggles, round icon buttons, the progress bar. */
  round: '999px',
  /** The big felt surfaces: the course map's hero, the game table. */
  stage: '24px',
  /** A drill's felt. */
  felt: '20px',
  /** Panels, lesson cards, the progress box, the table's action area. */
  panel: '18px',
  /** The assistant window. */
  window: '16px',
  /** Answer options, contract buttons, seats, the emoji tile, chat bubbles and input. */
  tile: '14px',
  /** A bid bubble; Clerk's windows. */
  control: '12px',
  /** A playing card (md, lg) and the brand mark. */
  card: '8px',
  cardSm: '6px',
  cardXs: '4px',
})

export const border = stylex.defineVars({
  /** Panels, the assistant window, toggles, chat input. */
  hair: '1px',
  /** Interactive tiles: lesson card, option, contract button, seat. */
  tile: '2px',
  /** The white frame of a card back. */
  frame: '3px',
  /** Focus ring on buttons, cards and the launcher. */
  focus: '3px',
  /** Focus ring on the small controls in a header. */
  focusSm: '2px',
  focusOffset: '2px',
  focusOffsetSm: '1px',
})

/** Component dimensions and geometry. */
export const size = stylex.defineVars({
  /** The reading column. */
  column: '860px',
  /** The notes on the finish screen. */
  proseNarrow: '460px',
  screen: '100vh',
  screenDynamic: '100dvh',
  half: '50%',

  brandMark: '30px',
  emojiTile: '52px',
  closeButton: '36px',
  iconButton: '34px',
  launcher: '56px',
  /** How far the launcher and the window sit above the bottom edge on a desk. */
  launcherLift: '48px',
  badge: '22px',
  progressTrack: '10px',

  cardXs: '34px',
  cardSm: '52px',
  cardMd: '72px',
  cardMdPhone: '58px',
  cardLg: '96px',
  cardLgPhone: '72px',
  cardAspect: '5 / 7',

  /** A fan slot is its card's width plus a breath; it shrinks when the row runs out of room. */
  slotXs: '38px',
  slotSm: '58px',
  slotMd: '80px',
  slotMdPhone: '64px',
  slotLg: '104px',
  slotLgPhone: '78px',
  slotMin: '22px',
  /** The lower row of a two-row hand tucks under the upper one. */
  fanRowOverlap: '-34px',
  badgeOffsetTop: '-8px',
  badgeOffsetLeft: '-4px',

  /** An opponent's face-down hand: each card's visible sliver, and the last card's full reach. */
  backSlot: '22px',
  backSlotMin: '8px',
  backsTail: '22px',
  backsRow: '48px',

  /** The least height of an entry-page card, so its suit watermark has room. */
  entryCard: '200px',
  /** How far an entry-page card's suit watermark reaches past the card's edge (it is cut off there). */
  watermarkInset: '-24px',

  tableCentre: '230px',
  tableCentrePhone: '190px',
  trickRow: '110px',
  trickTop: '22px',
  trickSide: '22%',
  trickSidePhone: '10%',
  /** Half an md card, to centre the learner's played card. */
  trickHalfCard: '-36px',
  trickHalfCardPhone: '-29px',

  heroColumns: '1.3fr 1fr',
  oneColumn: '1fr',
  twoColumns: '1fr 1fr',
  contractColumns: 'repeat(6, 1fr)',
  contractColumnsPhone: 'repeat(3, 1fr)',

  windowWidth: 'min(480px, calc(100vw - 48px))',
  windowHeight: 'min(576px, calc(100dvh - 96px))',
  chatInputWidth: 'calc(100% - 32px)',
  chatBubbleMax: '88%',
  /** The three loading dots are one 0.45em element with a pseudo-element 0.7em either side, in a 1em
   *  box; this padding leaves the same gap on both sides (SKATGO-11). */
  chatLoadingPadding: '10px 1.08em 10px 1.63em',
  chatButton: '36px',
  chatIcon: '18px',
  chatStopIcon: '12px',
  chatStopRadius: '2px',
})

export const opacity = stylex.defineVars({
  /** The lead paragraph on felt. */
  lead: '0.95',
  /** Labels under cards on felt. */
  label: '0.9',
  /** Secondary lines on felt: seat meta, the window's page title. */
  meta: '0.85',
  /** A wrong option already tried; a contract that does not cover the bid. */
  spent: '0.6',
  /** A disabled button. */
  disabled: '0.45',
  /** A disabled round icon button. */
  iconDisabled: '0.4',
})

/** Stacking order of what floats over the page. */
export const layer = stylex.defineVars({
  launcher: '40',
  window: '41',
})
