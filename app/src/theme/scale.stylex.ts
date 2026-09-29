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
  // The lobby design's steps (SKATGO-26, reference.md): the gap between lobby tiles, a tile's inner
  // padding, the space above a section's grid, a tall control, and the grid's inset from the rail.
  x15: '15px',
  x27: '27.28px',
  x32: '32px',
  x48: '48px',
  x72: '72px',
  /** Vertical breathing room of the finish screen. */
  x40: '40px',
  /** Vertical breathing room of the loading line. */
  x80: '80px',
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

// Corner radii and component dimensions live in shape.stylex.ts (SKATGO-26).

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
