import { type Game, type Seat, trickWinner } from './game'

// Lina's and Noah's faces at the table (SKATGO-147, the human: 「谁叫赢了，赢墩了，笑，输墩了，就是不高兴的表情」).

export type Face = 'neutral' | 'laugh' | 'sad'

/** The face a computer seat shows now. The bidding's winner laughs from the end of the auction until the first card;
 *  a finished trick makes the side that took it laugh and the other side sulk, as Skat scores by side, until it is
 *  collected — the other way round in a Null, where the declarer must take no trick (the human: 「null是反过来的」).
 *  Otherwise neutral. */
export function faceOf(g: Game, seat: Seat): Face {
  if (g.declarer === null) return 'neutral'
  if (g.phase === 'trickEnd') {
    const winner = trickWinner(g)
    if (winner === null) return 'neutral'
    const tookIt = (winner === g.declarer) === (seat === g.declarer)
    return tookIt !== (g.declaration?.contract.kind === 'null') ? 'laugh' : 'sad'
  }
  const beforeFirstCard = g.tricks.length === 0 && g.trick.length === 0
  if (seat === g.declarer && beforeFirstCard && (g.phase === 'skat' || g.phase === 'declare' || g.phase === 'play')) return 'laugh'
  return 'neutral'
}
