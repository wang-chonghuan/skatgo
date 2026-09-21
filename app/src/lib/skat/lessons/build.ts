import type { Step } from './types'

// The two helpers every language's course file builds its drills with.

type Concrete = Exclude<Step, { kind: 'generated' }>

/** A drill made fresh (random cards) each time the lesson is opened. */
export const gen = (make: () => Concrete): Step => ({ kind: 'generated', make })
export const times = (n: number, make: () => Concrete): Step[] => Array.from({ length: n }, () => gen(make))
