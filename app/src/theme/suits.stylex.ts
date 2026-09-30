import * as stylex from '@stylexjs/stylex'

// The suits' colours (SKATGO-27), in three schemes the learner chooses between. Values are the human's
// (the ticket's tables); the German Skat scheme is the default.
//
// `card*` colours a card face's pips and corner indices: on white, exactly the scheme's colour.
// `text*` colours a suit symbol in running text, which may sit on white or on the dark felt: a suit
// whose scheme colour is black takes the text's own colour instead (`currentColor`), so it stays
// legible on both. In the two-colour scheme both sets are exactly what the product showed before.
export const suit = stylex.defineVars({
  // German Skat: ♣ black, ♥ red, ♠ green, ♦ gold.
  cardClubs: '#000000',
  cardSpades: '#059669',
  cardHearts: '#E02424',
  cardDiamonds: '#D97706',
  textClubs: 'currentColor',
  textSpades: '#059669',
  textHearts: '#E02424',
  textDiamonds: '#D97706',
})

/** Four colours: ♠ black, ♥ red, ♣ green, ♦ blue. */
export const fourColours = stylex.createTheme(suit, {
  cardClubs: '#00A859',
  cardSpades: '#000000',
  cardHearts: '#FF0000',
  cardDiamonds: '#0071E3',
  textClubs: '#00A859',
  textSpades: 'currentColor',
  textHearts: '#FF0000',
  textDiamonds: '#0071E3',
})

/** Two colours, as the deck is printed: ♥ ♦ red, ♠ ♣ black. */
export const twoColours = stylex.createTheme(suit, {
  cardClubs: '#000000',
  cardSpades: '#000000',
  cardHearts: '#FF0000',
  cardDiamonds: '#FF0000',
  textClubs: 'currentColor',
  textSpades: 'currentColor',
  textHearts: '#D6281B',
  textDiamonds: '#D6281B',
})
