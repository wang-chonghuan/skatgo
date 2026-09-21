import * as stylex from '@stylexjs/stylex'

// The Skat course's own palette. The course is a self-contained place inside Parrottoon with its
// own look (PARROT-42: the human asked for a style of its own) — a card room: green baize, cream
// paper, brass. It lives in the theme directory because this is where colours are decided; product
// code under components/skat only ever references these names.
//
// One fixed palette, deliberately not a light/dark pair: a card table is dark green at any hour,
// and the cards on it must stay paper-white to be readable.
export const skat = stylex.defineVars({
  felt: '#1E6B4C',
  feltDeep: '#134A35',
  feltLight: '#2A8360',
  feltLine: '#3C9A74',
  paper: '#FBF6EA',
  paperDeep: '#F1E8D3',
  paperEdge: '#DDD0B3',
  ink: '#1F2B25',
  inkSoft: '#5C6B63',
  inkFaint: '#8C978F',
  brass: '#E0A92E',
  brassDeep: '#B07F12',
  brassSoft: '#FBEFC9',
  red: '#C9402F',
  good: '#2E8B57',
  goodSoft: '#DFF3E6',
  bad: '#C9402F',
  badSoft: '#FBE3DF',
  white: '#FFFFFF',
  shadow: 'rgba(12, 40, 28, 0.28)',
  shadowSoft: 'rgba(12, 40, 28, 0.12)',
  glow: 'rgba(224, 169, 46, 0.55)',
  scrim: 'rgba(10, 30, 22, 0.62)',
})
