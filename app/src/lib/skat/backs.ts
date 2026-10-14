// The card backs to choose from (SKATGO-102, the human: 「有人嫌牌背不好看」, and of the earlier back: 「我觉得比较搭，
// 因为看起来高端」). `ornament` is that earlier back (SKATGO-66). The others are drawn in its style by the same image
// model, less dense (「不要太细密……但是也不要留白」), each with the SkatGo logo small in its middle in the back's own
// colour (「不要彩色，要和牌背一致，这样低调不夸张」): masters in app/brand/cards/masters/back-*.webp, made by
// app/brand/cards/generate.sh (kind back2), cut to 500×700 WebP in app/public/cards/backs/ by
// .intentfold/tickets/SKATGO-102/make-backs.mjs. All are drawn inside the card's white frame.

export const CARD_BACKS = ['ornament', 'charcoal', 'navy', 'burgundy', 'green'] as const
export type CardBack = (typeof CARD_BACKS)[number]
export const DEFAULT_BACK: CardBack = 'ornament'

/** Where a back's picture is served. */
export const backSrc = (back: CardBack) => (back === 'ornament' ? '/cards/back.webp' : `/cards/backs/${back}.webp`)

/** Whether a stored value is a back there still is: one taken out later falls back to the default. */
export const isCardBack = (v: unknown): v is CardBack => (CARD_BACKS as readonly unknown[]).includes(v)
