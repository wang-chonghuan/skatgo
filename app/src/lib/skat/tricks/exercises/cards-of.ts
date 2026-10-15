import type { Card } from '../../cards'

/** "CJ HA H10" → cards: suit letter, then rank (J Q K A 10 9 8 7). How the exercises write their cards. */
export const cards = (s: string): Card[] => s.split(' ').map((x) => ({ suit: x[0] as Card['suit'], rank: x.slice(1) as Card['rank'] }))
