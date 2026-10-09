import * as stylex from '@stylexjs/stylex'

// The suits' colours (SKATGO-27): the four-colour tournament colouring of the French-suited deck German
// Skat players use (SKATGO-66 kept it as the only one). Values are the human's.
//
// `card*` colours a card face's pips and corner indices: on white, exactly the suit's colour.
// `text*` colours a suit symbol in running text, which may sit on white or on the dark felt: a suit
// whose colour is black takes the text's own colour instead (`currentColor`), so it stays legible on both.
export const suit = stylex.defineVars({
  // ♣ black, ♥ red, ♠ green, ♦ gold.
  cardClubs: '#000000',
  cardSpades: '#059669',
  cardHearts: '#E02424',
  cardDiamonds: '#D97706',
  textClubs: 'currentColor',
  textSpades: '#059669',
  textHearts: '#E02424',
  textDiamonds: '#D97706',
})
