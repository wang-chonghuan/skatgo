import { readEndgame } from './endgame'
import { ENDGAMES_STORED } from './endgames.data'
import type { Exercise } from './types'

// The "Sieg sichern" ladder (SKATGO-108, simplified in SKATGO-109): ten closed-card endgames from SkatZero's
// games, two or three tricks left, proven by endgame.ts (the tests prove them again from the stored file;
// nothing is worked out in the browser). The exercise is one table: the game and the points still needed in
// its title, the opponents with their cards face down and the voids they showed, the cards still out, and
// your cards — no play record, no counting.

export const ENDGAMES = ENDGAMES_STORED.map(readEndgame)

export const LADDER: Exercise[] = ENDGAMES.map((e) => ({
  id: e.id,
  type: 'sieg-sichern',
  situation: { role: 'declarer', rows: [] },
  ask: { kind: 'play', contract: e.contract, hand: e.hand, trick: [], best: [e.answer] },
  proof: { by: 'solver', note: 'sicher in jeder möglichen Verteilung; jede andere Karte verliert in einer' },
  endgame: e,
}))
