// Design values for code that cannot read a CSS variable: `motion` and `canvas-confetti` take numbers,
// lucide icons take a pixel size, `matchMedia` takes a query string, and the `theme-color` meta takes a
// colour. They belong to the design system like the `.stylex.ts` registries beside this file, and
// product code names them instead of writing its own (check-design-tokens.mjs).

/** The phone step as a `matchMedia` query — the same width as `bp.phone` in breakpoints.stylex.ts. */
export const phoneQuery = '(max-width: 480px)'

/** The browser's toolbar colour on phones: the header's felt (`skat.feltDeep`), which a meta tag
 *  cannot read as a variable. */
export const themeColor = '#134A35'

/** lucide icon sizes in px. */
export const icon = { launcher: 24, launcherStroke: 2.2, header: 18, sendStroke: 2.5 }

/** A lesson step slides in from the right and out to the left. */
export const stepSlide = { offset: 28, duration: 0.2 }

/** Cards dealt into a fan, one after another. */
export const deal = { rise: 24, duration: 0.22, stagger: 0.025, staggerCap: 12 }

/** The learner's card rising onto the table in a play drill. */
export const playIn = { rise: 60 }

/** A card played into the whole-game trick: from its player's side, on a spring. */
export const trick = {
  spring: { type: 'spring', stiffness: 380, damping: 28 },
  fromScale: 0.7,
  exitScale: 0.6,
  exitDuration: 0.25,
  from: { 0: { x: 0, y: 90 }, 1: { x: -120, y: -40 }, 2: { x: 120, y: -40 } },
} as const

/** The finish screen's emoji springing in. */
export const finish = { spring: { type: 'spring', stiffness: 260, damping: 16 }, fromScale: 0.4 } as const

/** The wordless "no" after a wrong answer. */
export const shake = { x: [0, -9, 9, -6, 6, 0], duration: 0.35 }

/** Celebration: finishing a lesson, and winning a game — nowhere else. */
export const confettiBurst = {
  lesson: { particleCount: 140, spread: 80, origin: { y: 0.6 } },
  game: { particleCount: 90, spread: 70, origin: { y: 0.7 } },
}
