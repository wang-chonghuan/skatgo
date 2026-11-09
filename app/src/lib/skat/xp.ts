// Experience points (SKATGO-172, the human: 「看和ai的得分差距，比ai高了x分，一样了y分，低了z分，都加分，但是根据差值换算，作为
// 经验值，可以每周重置」, then 「那就不要平均值」): every deal against the AI earns XP, more the better it went against the AI's
// own game on the same cards in the same seat; a player's XP is the sum over all their deals, never starting again
// (SKATGO-179, the human: 「把weekly去掉，不要每周刷新一次」). Pure: the multiplayer service sums the deals with it, and the
// page states the same tiers.

/** The five tiers of a deal by its Seeger-Fabian difference to the AI's: far below, below, the same, above, far above. */
export type XpTier = 'farBelow' | 'below' | 'same' | 'above' | 'farAbove'

/** What each tier earns. */
export const XP: Record<XpTier, number> = { farBelow: 4, below: 6, same: 10, above: 14, farAbove: 20 }

/** From this difference on a deal is far above or below the AI's. */
export const XP_FAR = 50

/** A deal's tier from the player's score minus the AI's; a deal without the AI's result counts as the same. */
export function xpTier(diff: number | null): XpTier {
  if (diff === null || diff === 0) return 'same'
  if (diff >= XP_FAR) return 'farAbove'
  if (diff > 0) return 'above'
  return diff <= -XP_FAR ? 'farBelow' : 'below'
}

/** What a deal earns on top of its tier when the player declared it, won or lost: taking a game is never worse for XP
 *  than passing it by (SKATGO-172 — on the regulars' 941 deals the declared ones earned 8.13 a deal, the rest 9.50; 2
 *  evens that out without making a lost game nearly free, as 4 did; the human: 「改成+2」). */
export const XP_OWN_GAME = 2

/** A deal's XP: its tier, and the own game's extra when the player declared. */
export const xpOf = (diff: number | null, declared = false) => XP[xpTier(diff)] + (declared ? XP_OWN_GAME : 0)

/** The board as the service answers it: every account with XP, the most first, equal XP sharing a rank; its win rate
 *  over all its deals as the record of play counts it (`recordOf`, SKATGO-178), a whole percent, null when no deal had
 *  a declarer; `you` on the asker's own row. Names only, never a player id. */
export type XpBoard = { rows: { rank: number; nickname: string; xp: number; winRate: number | null; you?: true }[] }
