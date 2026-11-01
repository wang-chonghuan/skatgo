import { type Game, type Seat, trickWinner } from './game'

// Lina's and Noah's faces at the table (SKATGO-147, the human: 「谁叫赢了，赢墩了，笑，输墩了，就是不高兴的表情」).

export type Face = 'neutral' | 'laugh' | 'sad'

/** The faces a computer seat may wear (SKATGO-167, the human: 「再弄两套头像，一男一女，风格不同，然后设置页面可以看着头像选桌上的
 *  头像，名字暂时可以不变，可以男明用女头像」, then 「画风必须一致」): SKATGO-147's Lina and Noah and four more people in their own
 *  flat sticker style. Each is three pictures, `/faces/<avatar>-<face>.webp`. Lina's seat
 *  wears `lina` and Noah's `noah` until the player chooses otherwise; either may wear any. */
export const AVATARS = ['lina', 'noah', 'woman-indian', 'man-beard', 'woman-office', 'man-cap'] as const
export type Avatar = (typeof AVATARS)[number]
export const isAvatar = (a: unknown): a is Avatar => AVATARS.includes(a as Avatar)
/** The avatar a seat wears by default: Lina's (1) and Noah's (2) own. */
export const DEFAULT_AVATAR: Record<1 | 2, Avatar> = { 1: 'lina', 2: 'noah' }
export const faceSrc = (avatar: Avatar, face: Face) => `/faces/${avatar}-${face}.webp`

/** The face a computer seat shows now. The bidding's winner laughs from the end of the auction until the first card;
 *  a finished trick makes the side that took it laugh and the other side sulk, as Skat scores by side, until it is
 *  collected — the other way round in a Null, where the declarer must take no trick (the human: 「null是反过来的」).
 *  At the deal's end the side that won laughs and the other sulks. Otherwise neutral. */
export function faceOf(g: Game, seat: Seat): Face {
  if (g.declarer === null) return 'neutral'
  // The deal's end: the winning side laughs, the losing side sulks — the declarer against the two defenders (the
  // human: 「最后谁赢了也要笑，和不高兴。分庄家和2个防家」). A Null's `won` is already the declarer's.
  if (g.phase === 'done' && g.result) return (seat === g.declarer) === g.result.won ? 'laugh' : 'sad'
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
