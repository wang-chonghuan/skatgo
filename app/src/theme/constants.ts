// Design values for code that cannot read a CSS variable: `motion` and `canvas-confetti` take numbers,
// lucide icons take a pixel size, `matchMedia` takes a query string, and the `theme-color` meta takes a
// colour. They belong to the design system like the `.stylex.ts` registries beside this file, and
// product code names them instead of writing its own (check-design-tokens.mjs).

/** The phone step as a `matchMedia` query — the same width as `bp.phone` in breakpoints.stylex.ts. */
export const phoneQuery = '(max-width: 480px)'
/** The table's pinned side panel as a `matchMedia` query — the same width as `bp.pinned`. */
export const pinnedQuery = '(min-width: 900px)'

/** The browser's toolbar colour on phones: the page's white surface (`color.surface`), which a meta tag
 *  cannot read as a variable. */
export const themeColor = '#FFFFFF'
/** The same at night (SKATGO-184): `color.surface`'s night value. */
export const themeColorDark = '#19212B'
/** The colour `CSS.supports` is asked about to learn whether this browser can show the night at all (SKATGO-184): the
 *  same test as the palette's `@supports` (color.stylex.ts). */
export const nightProbe = 'light-dark(#000, #fff)'

/** lucide icon sizes in px. */
export const icon = {
  /** The table's round buttons' icons (the way out), the size the assistant's launcher had. */
  launcher: 20,
  launcherStroke: 2.2,
  header: 18,
  // SKATGO-26: outline icons at the design's sizes (reference.md) — the header's menu and close
  // buttons, its settings gear, and the table's floating controls.
  menu: 24,
  gear: 20,
  table: 24,
  outline: 1.75,
  /** An icon inside a button or beside a line of text; the finish screen's icon. */
  inline: 20,
  /** The icon at the top of a front-page card (SKATGO-135, the human's pictures: a large outline icon over the title). */
  tile: 36,
}

/** A lesson step slides in from the right and out to the left. */
export const stepSlide = { offset: 28, duration: 0.2 }

/** Cards dealt into a fan, one after another. */
export const deal = { rise: 24, duration: 0.22, stagger: 0.025, staggerCap: 12 }

/** The cards' sounds at the table (SKATGO-101): their loudness (Web Audio gain, 0 to 1) and the shortest
 *  gap in milliseconds between two of one kind, so a burst of moves does not stack into noise; and how long
 *  a sound asked for before the audio was ready may still play late (SKATGO-106), so a deal is heard while
 *  it is being dealt and never long after. */
export const sound = { volume: 0.45, gap: 80, late: 1200 }

/** A card face's corner index — the rank's figures and letters — is a stroked line in the deck's
 *  1000-unit symbol box, drawn 80 wide by the deck. SKATGO-47 draws it bolder (an SVG attribute, so not
 *  a CSS variable). */
export const cardIndex = { stroke: 112 }

/** The learner's card rising onto the table in a play drill. */
export const playIn = { rise: 60 }

/** A card played into the whole-game trick (SKATGO-34). The learner's card flies from its own place in
 *  the hand (a shared layout animation); an opponent's comes in from their side of the table. Always
 *  opaque, a short ease-out, no bounce: the eye follows one card the whole way. */
export const trick = {
  flight: { type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  fromScale: 0.85,
  exitScale: 0.6,
  exitDuration: 0.25,
  from: { 1: { x: -170, y: 0 }, 2: { x: 170, y: 0 } },
} as const

/** The hand that says a finished trick waits for the player's tap (SKATGO-72): drawn after the human's
 *  pick (Flaticon's "Tap" by Kiranshastry, redrawn here, not copied) — a skin-coloured hand pointing up,
 *  an arc over the fingertip, blinking, as the human asked (「照着png画个svg吧」「闪烁即可」). */
export const tapHint = {
  view: '-12 -12 536 536',
  stroke: 17,
  /** The hand's silhouette, filled. */
  hand: 'M178.5 303.5 V79 A32 32 0 0 1 242.5 79 V215 A33 33 0 0 1 308.5 215 V226 A32.5 32.5 0 0 1 373.5 226 V243.5 A32.5 32.5 0 0 1 438.5 243.5 V410 C438.5 461 400 503 356 503 H236 C205 503 180 485 166 456 L70 273 C88 256 102 251 115 251 C130 252 141 259 151 271 Z',
  /** The lines between the fingers, and the arc over the fingertip. */
  lines: ['M242.5 215 V276', 'M308.5 226 V271', 'M373.5 243.5 V266', 'M142 76 A68 68 0 0 1 278 76'],
  blink: { opacity: [1, 0.25, 1] },
  transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const },
}

/** The gold cup on the front page's League tile (SKATGO-221, the human: 「奖杯改成金色带高光的还会闪的」), drawn here in
 *  lucide's 24-unit box so it stands where the outline `Trophy` stood, a step larger than the tiles' outline icons
 *  (`icon.tile`) so its highlight, star and passing light read at a glance: a bowl under a lit rim, two handles, a foot
 *  on a plate with an engraved line, a star engraved in the bowl and a highlight down its left; the light band that
 *  passes over it (clipped to bowl and foot); and two four-pointed sparkles beside it, outside the box. */
export const goldTrophy = {
  view: '0 0 24 24',
  /** Its size in px on the tile. */
  size: 44,
  /** Where the gold turns from light to gold to deep, along each shape's diagonal. */
  stops: { light: 0, gold: 0.45, deep: 1 },
  bowl: 'M6 3 H18 V8.5 C18 12.1 15.4 14.6 12 14.6 C8.6 14.6 6 12.1 6 8.5 Z',
  rim: 'M5.2 2 H18.8 A0.8 0.8 0 0 1 18.8 3.6 H5.2 A0.8 0.8 0 0 1 5.2 2 Z',
  foot: 'M10.7 14.4 H13.3 V16.9 L15 18.8 H17.2 A0.8 0.8 0 0 1 18 19.6 V21.2 A0.8 0.8 0 0 1 17.2 22 H6.8 A0.8 0.8 0 0 1 6 21.2 V19.6 A0.8 0.8 0 0 1 6.8 18.8 H9 L10.7 16.9 Z',
  handles: ['M6 4.8 H4.6 A2.4 2.4 0 0 0 4.6 9.6 H6.4', 'M18 4.8 H19.4 A2.4 2.4 0 0 1 19.4 9.6 H17.6'],
  handle: 1.6,
  plaque: 'M8.6 20.4 H15.4',
  plaqueLine: 0.8,
  star: 'M12.5 5.9 L13.06 7.43 L14.69 7.49 L13.4 8.49 L13.85 10.06 L12.5 9.15 L11.15 10.06 L11.6 8.49 L10.31 7.49 L11.94 7.43 Z',
  highlight: 'M8.3 4.8 C8.2 7.6 8.7 10 10.2 11.9',
  highlightLine: 1.2,
  /** The light band, slanted, standing left of the cup until it moves (`shine` in effects.stylex.ts). */
  band: 'M-5 -2 H0 L-6 26 H-11 Z',
  sparkles: [
    'M22.6 -3 Q22.6 0.4 26 0.4 Q22.6 0.4 22.6 3.8 Q22.6 0.4 19.2 0.4 Q22.6 0.4 22.6 -3 Z',
    'M1.4 11.6 Q1.4 14.2 4 14.2 Q1.4 14.2 1.4 16.8 Q1.4 14.2 -1.2 14.2 Q1.4 14.2 1.4 11.6 Z',
  ],
}

/** The finish screen's emoji springing in. */
export const finish = { spring: { type: 'spring', stiffness: 260, damping: 16 }, fromScale: 0.4 } as const

/** The wordless "no" after a wrong answer. */
export const shake = { x: [0, -9, 9, -6, 6, 0], duration: 0.35 }

/** The action drawer rising from the bottom of the table when it is the learner's move (SKATGO-26). */
export const drawer = { rise: 48, duration: 0.22 }

/** Celebration: finishing a lesson, and winning a game — nowhere else. */
// A visitor who asked for less motion gets none (SKATGO-29).
export const confettiBurst = {
  lesson: { particleCount: 140, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true },
  game: { particleCount: 90, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true },
}

// SKATGO-128: the record of play's curve, drawn in SVG user units — its box (the curve's own width; the page scales
// it to the card), the room kept above and below the furthest point, a day's dot (radius in pixels, the same on every
// screen; large enough to read as a point, the human: 「一天一个点，为啥你的图上没显示几个点呢」) and the stroke of the line between them; and how many
// days may carry their date under the curve on a computer and on a phone before only every second, third … does.
// The human asked for the curve (「做成一个曲线」), which is this registry's approval.
export const profileChart = { width: 640, height: 200, pad: 12, dot: 4, line: 2, dates: 14, datesPhone: 6 }
/** The front page's progress card's curve (SKATGO-136, the human: 「我希望平缓的，粗一点的」; SKATGO-137: 「再粗一点」, SKATGO-138: 「线稍微细一点」): 5px,
 *  and the one day's dot when there is only one. */
export const progressCurve = { line: 5, dot: 6 }
