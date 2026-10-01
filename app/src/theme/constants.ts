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

/** lucide icon sizes in px. */
export const icon = {
  launcher: 20,
  launcherStroke: 2.2,
  header: 18,
  sendStroke: 2.5,
  // SKATGO-26: the rail's and the tab bar's icons, a lobby tile's icon, the band's, and the table's
  // floating controls — outline icons at the design's sizes (reference.md).
  rail: 28,
  tab: 24,
  tile: 48,
  band: 28,
  bandNav: 20,
  option: 40,
  table: 24,
  outline: 1.75,
  /** An icon inside a button or beside a line of text; the finish screen's icon. */
  inline: 20,
  finish: 48,
}

/** A lesson step slides in from the right and out to the left. */
export const stepSlide = { offset: 28, duration: 0.2 }

/** Cards dealt into a fan, one after another. */
export const deal = { rise: 24, duration: 0.22, stagger: 0.025, staggerCap: 12 }

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
