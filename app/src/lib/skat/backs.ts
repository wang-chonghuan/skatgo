// The card backs to choose from (SKATGO-102, the human: 「有人嫌牌背不好看……搜一下流行的免费可以商用的，我选一下」,
// then 「默认选k5，但是中间的花色，要换成我的logo……其他的保留，我再选选，给用户切换的机会」). The default is Kenney's
// blue framed back with the SkatGo logo in the middle. Each is a 500×700 WebP in app/public/cards/backs/, made by
// .intentfold/tickets/SKATGO-102/make-backs.mjs; their sources and licences are in app/public/cards/backs/LICENSES.txt.
// `ornament` is the earlier back (SKATGO-66), the only one drawn inside the card's white frame.

export const CARD_BACKS = [
  'k5-logo',
  'kenney-blue-1', 'kenney-blue-2', 'kenney-blue-3', 'kenney-blue-4', 'kenney-blue-5', 'kenney-red-1', 'kenney-green-3',
  'bdr-1-blue', 'bdr-2-blue', 'bdr-3-blue', 'bdr-1-red', 'bdr-2-red', 'bdr-3-red', 'bdr-2-green', 'bdr-3-black',
  'sylly-blue-1', 'sylly-blue-2', 'sylly-red-1', 'sylly-red-2', 'sylly-grey-1', 'sylly-grey-2',
  'jeff-black', 'jeff-blue', 'jeff-green', 'jeff-orange', 'jeff-purple',
  'itch-1', 'itch-2', 'itch-3', 'itch-4', 'itch-5', 'itch-6',
  'ornament',
] as const
export type CardBack = (typeof CARD_BACKS)[number]
export const DEFAULT_BACK: CardBack = 'k5-logo'

/** Where a back's picture is served. */
export const backSrc = (back: CardBack) => (back === 'ornament' ? '/cards/back.webp' : `/cards/backs/${back}.webp`)

/** Whether a stored value is a back there still is: one taken out later falls back to the default. */
export const isCardBack = (v: unknown): v is CardBack => (CARD_BACKS as readonly unknown[]).includes(v)
