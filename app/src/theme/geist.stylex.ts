import * as stylex from '@stylexjs/stylex'

// The forum's design (SKATGO-231, the human: 「论坛要仿照这个风格，最好严格用它的论坛设计系统……用vercel的设计」):
// Vercel's Geist, as the Vercel Community (community.vercel.com) shows it. The colours are Geist's own variables,
// read from that site's stylesheet on 2026-11-24 with their night values (its dark theme); the sizes were measured on
// its rendered pages at 1280×820. Only the forum's pages use these; the site's header and footer stay the lobby
// design (theme/color.stylex.ts). Night follows the page's `color-scheme`, as the rest of the site does (SKATGO-184).
const NIGHT = '@supports (color: light-dark(#000, #fff))'

export const geist = stylex.defineVars({
  /** --ds-background-100: the page. */
  background: { default: '#FFFFFF', [NIGHT]: 'light-dark(#FFFFFF, #000000)' },
  /** --ds-background-200: a code block, a quiet panel. */
  backgroundSoft: { default: '#FAFAFA', [NIGHT]: 'light-dark(#FAFAFA, #000000)' },
  /** --ds-gray-100: the chosen navigation row, a pill that is not chosen, an avatar's ground. */
  fill: { default: '#F2F2F2', [NIGHT]: 'light-dark(#F2F2F2, #1A1A1A)' },
  /** --ds-gray-200: a fill under the pointer. */
  fillHover: { default: '#EBEBEB', [NIGHT]: 'light-dark(#EBEBEB, #1F1F1F)' },
  /** --ds-gray-alpha-400: every hairline and control border. */
  hairline: { default: 'rgba(0, 0, 0, 0.08)', [NIGHT]: 'light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.14))' },
  /** --ds-gray-700: the quietest text, an icon at rest. */
  muted: '#8F8F8F',
  /** --ds-gray-900: secondary text — dates, excerpts, the navigation. */
  secondary: { default: '#4D4D4D', [NIGHT]: 'light-dark(#4D4D4D, #A0A0A0)' },
  /** --ds-gray-1000: text, titles, and the chosen pill and the main button's fill. */
  text: { default: '#171717', [NIGHT]: 'light-dark(#171717, #EDEDED)' },
  /** Text on `text` as a fill (the chosen pill, the main button): --ds-gray-100 by day, --ds-background-100 at night. */
  onText: { default: '#F2F2F2', [NIGHT]: 'light-dark(#F2F2F2, #000000)' },
  /** --ds-blue-700: the focus ring. */
  focus: { default: '#0070F7', [NIGHT]: 'light-dark(#0070F7, #0071F6)' },
  /** --ds-red-900: an error, a hidden post's reason. */
  error: { default: '#D60020', [NIGHT]: 'light-dark(#D60020, #FF5E63)' },
  /** --ds-red-800: the yes to a deletion. */
  destructive: { default: '#E70022', [NIGHT]: 'light-dark(#E70022, #E2162A)' },
})

export const geistShape = stylex.defineVars({
  /** Buttons, inputs, icon buttons and the navigation's rows. */
  control: '4px',
  /** Cards and the featured picture: Geist's --geist-radius. */
  card: '6px',
  /** Pills and avatars. */
  round: '9999px',
})

export const geistDims = stylex.defineVars({
  /** The forum's one column. */
  column: '840px',
  /** An avatar beside a name on a post or a comment. */
  avatar: '24px',
  /** An icon button and a button's height; a pill's height. */
  control: '32px',
  pill: '34px',
  /** An excerpt's lines in a list's row. */
  excerptLines: '1',
  /** The composer's text and a comment's, a few lines tall to start, growing with the text. */
  textPost: 'calc(6lh + 18px)',
  textComment: 'calc(3lh + 18px)',
  /** The current tab's line under it, laid over the row's hairline. */
  tabLine: '2px',
  tabOverlap: '-1px',
})
