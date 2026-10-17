import { readOpen } from './open'
import { OPEN_STORED } from './open-endgames.data'
import type { Exercise, Who } from './types'

// The open-card endgames (SKATGO-110): twenty positions from SkatZero's games, every hand open, proven by open.ts
// (the tests prove them again from the stored file; nothing is worked out in the browser). The page plays them on
// the game's own table; the `ask` below is what the exercises' shared checks read.

export const OPEN = OPEN_STORED.map(readOpen)

const WHO: Record<number, Who> = { 1: 'left', 2: 'right' }

export const OPEN_EXERCISES: Exercise[] = OPEN.map((e) => ({
  id: e.id,
  type: 'offenes-endspiel',
  situation: { role: e.role, rows: [] },
  ask: {
    kind: 'play',
    contract: e.game.declaration!.contract,
    hand: e.game.hands[0],
    trick: e.game.trick.map((p) => ({ who: WHO[p.seat], card: p.card })),
    best: e.play.win,
  },
  proof: { by: 'solver', note: 'mit offenen Karten: nur diese Karte gewinnt, beide Seiten spielen ihr Bestes' },
  open: e,
}))
