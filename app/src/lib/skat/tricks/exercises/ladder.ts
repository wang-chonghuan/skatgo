import { sortHand } from '../../cards'
import { readEndgame } from './endgame'
import { ENDGAMES_STORED } from './endgames.data'
import type { Exercise, ShownRow } from './types'

// The "Sieg sichern" ladder (SKATGO-108): ten closed-card endgames from SkatZero's games, proven by
// endgame.ts (the tests prove them again from the stored file; nothing is worked out in the browser).
// Level 1 lists the cards still out and the voids shown; level 2 leaves them to be counted from the play;
// level 3 leaves the points to be counted too.

export const ENDGAMES = ENDGAMES_STORED.map(readEndgame)

export const LADDER: Exercise[] = ENDGAMES.map((e) => {
  const rows: ShownRow[] = [{ kind: 'skat', cards: e.skat }]
  if (e.level === 1) {
    // Sorted, so the row does not tell whose cards are whose.
    rows.push({ kind: 'outstanding', cards: sortHand([...e.left, ...e.right], e.contract) })
    if (e.voids.length) rows.push({ kind: 'voids', voids: e.voids.map((v) => ({ who: v.side, suit: v.suit })) })
  }
  rows.push({ kind: 'history', tricks: e.tricks.map((t) => ({ cards: t.cards.map((c) => ({ who: c.side, card: c.card })), winner: t.winner })) })
  return {
    id: e.id,
    type: 'sieg-sichern',
    level: e.level,
    situation: {
      contract: e.contract,
      role: 'declarer',
      position: e.position,
      points: e.level < 3 ? e.have : undefined,
      need: e.level < 3 ? e.need : undefined,
      tricksLeft: e.hand.length,
      rows,
    },
    ask: { kind: 'play', contract: e.contract, hand: e.hand, trick: [], best: [e.answer] },
    proof: { by: 'solver', note: 'sicher in jeder möglichen Verteilung; jede andere Karte verliert in einer' },
    endgame: e,
  }
})
