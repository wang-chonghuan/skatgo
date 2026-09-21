/**
 * Parrottoon Theme — the project's own governed token registry.
 *
 * Scaffolded from Astryx's Matcha with `astryx theme add matcha`, which is the
 * documented way to take ownership of a theme: it lands as editable source in the
 * repo instead of being patched inside node_modules, and `astryx theme build`
 * compiles it to the same two artifacts a published theme ships.
 *
 * The structure is Matcha's; the palette is no longer. PARROT-15 replaced the olive
 * core with an achromatic ramp plus one teal accent, because the olive was hard to
 * read: text, icons, borders and even the shadows were tints of #3E481D. Typography
 * and component overrides are untouched — that ticket changed colour only.
 *
 * Editing this file is editing a governed registry: charter/ui.md redline 4.
 * After any edit, rebuild:
 *
 *   npx @astryxdesign/cli theme build src/theme/parrottoonTheme.ts \
 *     --out src/theme/parrottoon.css --icons-specifier ./icons
 */

import {defineTheme, defineSyntaxTheme} from '@astryxdesign/core/theme';
import {parrottoonIconRegistry} from './icons';

/** Syntax palette — earthy greens and warm tones, inherited from Matcha. */
const parrottoonSyntax = defineSyntaxTheme({
  name: 'xds-parrottoon',
  tokens: {
    // Greyscale. Code is told apart by weight and depth, not hue — the same rule the
    // rest of this theme follows. Nothing renders a code block today; this exists so
    // that when something does, it does not arrive as the one green patch left.
    keyword: ['#141414', '#EDEDED'],
    string: ['#4A4A4A', '#B8B8B8'],
    comment: ['#8A8A8A', '#7A7A7A'],
    number: ['#3A3A3A', '#CFCFCF'],
    function: ['#242424', '#DEDEDE'],
    type: ['#3A3A3A', '#CFCFCF'],
    variable: ['#141414', '#EDEDED'],
    operator: ['#6E6E6E', '#9E9E9E'],
    constant: ['#3A3A3A', '#CFCFCF'],
    tag: ['#242424', '#DEDEDE'],
    attribute: ['#4A4A4A', '#B8B8B8'],
    property: ['#3A3A3A', '#CFCFCF'],
    punctuation: ['#8A8A8A', '#7A7A7A'],
    background: ['#F2F2F2', '#171717'],
  },
});

export const parrottoonTheme = defineTheme({
  name: 'parrottoon',

  typography: {
    // base 16 / ratio 1.25 — aligned with the other themes' geometric scale.
    scale: {base: 16, ratio: 1.25},
    body: {
      family: 'DM Sans',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    // Matcha ships Playwrite US Trad, a joined handwriting face. It was replaced
    // because a heading is the one place legibility cannot be traded for flavour:
    // at hero size a script face is decorative, and at 17px section size it stops
    // being readable at all.
    //
    // Fraunces keeps the character — it is an old-style serif with genuine
    // personality, and it is what Astryx's own `chocolate` theme uses for
    // headings, so this stays inside the system's taste rather than importing
    // an outside one.
    //
    // The fallbacks matter more than usual here: Fraunces has no CJK glyphs, and
    // most of this product's headings are Chinese, so every Chinese heading is
    // rendered by this list. It leads with the platform sans faces a Chinese
    // reader expects for display text, not with a Latin serif.
    heading: {
      family: 'Fraunces',
      fallbacks:
        '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", Georgia, serif',
    },
    code: {
      family: 'JetBrains Mono',
      fallbacks: '"SF Mono", Monaco, Consolas, monospace',
    },
  },

  motion: {fast: 125, medium: 300, slow: 700, ratio: 0.75},

  syntax: parrottoonSyntax,

  tokens: {
    // =========================================================================
    // 无彩色的字与底，一个 teal 强调色，状态色照旧
    //
    // 人类的裁决（PARROT-15 grill）：字全黑，teal 仍是主题色，按钮可以用它。
    // 所以文字与底色一律无色相，彩色只出现在两处：强调色 #2E6B5A，以及状态色。
    //
    // 这套灰阶是按对比度选的，不是按好看选的：
    //   #141414 正文 / #F5F5F5 底  →  16.8:1（AAA 要求 7:1）
    //   #595959 次级 / #F5F5F5 底  →   6.9:1（AA  要求 4.5:1）
    // 换灰阶前先算，别换完再看着办。
    //
    // 旧的橄榄调（#3E481D / #707E46 / #C0CBA9 / #F0F0E0）是整套调色板的骨架，连
    // 阴影和边框都是它的透明叠加。留一处没换，界面上就会剩下一块说不清来路的暗绿。
    // =========================================================================

    // Core semantic
    '--color-accent': ['#2E6B5A', '#7FC4AE'],
    '--color-accent-muted': ['#2E6B5A14', '#7FC4AE20'],
    '--color-neutral': ['#1414140F', '#EDEDED1A'],
    '--color-background-surface': ['#FFFFFF', '#171717'],
    '--color-background-body': ['#F5F5F5', '#101010'],
    '--color-overlay': ['#00000080', '#000000CC'],
    '--color-overlay-hover': ['#1414140D', '#EDEDED0D'],
    '--color-overlay-pressed': ['#1414141A', '#EDEDED1A'],
    '--color-background-muted': ['#EDEDED', '#242424'],

    // Text — 全部无彩色，除了 text-accent（链接与被强调的字，需要被认出来）
    '--color-text-primary': ['#141414', '#EDEDED'],
    '--color-text-secondary': ['#595959', '#A8A8A8'],
    '--color-text-disabled': ['#9E9E9E', '#6E6E6E'],
    '--color-text-accent': ['#245546', '#8FD0BA'],
    '--color-on-dark': '#FFFFFF',
    '--color-on-light': '#141414',
    '--color-on-accent': ['#FFFFFF', '#101010'],
    '--color-on-success': ['#FFFFFF', '#101010'],
    '--color-on-error': ['#FFFFFF', '#101010'],
    '--color-on-warning': ['#141414', '#141414'],

    // Icon
    '--color-icon-accent': ['#2E6B5A', '#7FC4AE'],
    '--color-icon-primary': ['#141414', '#EDEDED'],
    '--color-icon-secondary': ['#595959', '#A8A8A8'],
    '--color-icon-disabled': ['#9E9E9E', '#6E6E6E'],

    // Surface variants
    '--color-background-card': ['#FFFFFF', '#1C1C1C'],
    '--color-background-popover': ['#FFFFFF', '#242424'],
    '--color-background-inverted': ['#141414', '#EDEDED'],

    // Status / Sentiment — 人类裁决：全部保留，它们是反馈不是风格
    '--color-success': ['#4D9900', '#6dbf2a'],
    '--color-success-muted': ['#4D990020', '#6dbf2a20'],
    '--color-error': ['#FD0000', '#ff5c5c'],
    '--color-error-muted': ['#FD000020', '#ff5c5c20'],
    '--color-warning': ['#FFB600', '#ffc940'],
    '--color-warning-muted': ['#FFB60020', '#ffc94020'],

    // Border
    '--color-border': ['#E2E2E2', '#EDEDED1A'],
    '--color-border-emphasized': ['#C2C2C2', '#4A4A4A'],

    // Effects — 阴影原本是 #3E481D 的叠加，也就是绿的
    '--color-skeleton': ['#DEDEDE', '#3A3A3A'],
    '--color-shadow': ['#0000001A', '#0000004D'],
    '--color-tint-hover': ['black', 'white'],

    // Categorical — Blue
    '--color-background-blue': ['#3a5e8c33', '#3a5e8c33'],
    '--color-border-blue': ['#3a5e8c', '#7ba8d4'],
    '--color-icon-blue': ['#3a5e8c', '#7ba8d4'],
    '--color-text-blue': ['#2e4a6e', '#8dbce0'],

    // Categorical — Cyan
    '--color-background-cyan': ['#3a7c7c33', '#3a7c7c33'],
    '--color-border-cyan': ['#3a7c7c', '#70c4c4'],
    '--color-icon-cyan': ['#3a7c7c', '#70c4c4'],
    '--color-text-cyan': ['#2e6060', '#82d4d4'],

    // Categorical — Gray. 原本整组是橄榄 (#707E46)，也就是说 ui.md 里那个"复习词
    // 用 gray"的灰，一直是绿的。现在它是真的灰。
    '--color-background-gray': ['#59595933', '#A8A8A833'],
    '--color-border-gray': ['#8A8A8A', '#6E6E6E'],
    '--color-icon-gray': ['#595959', '#A8A8A8'],
    '--color-text-gray': ['#3A3A3A', '#CFCFCF'],

    // Categorical — Green
    '--color-background-green': ['#4D990033', '#6dbf2a33'],
    '--color-border-green': ['#4D9900', '#6dbf2a'],
    '--color-icon-green': ['#4D9900', '#6dbf2a'],
    '--color-text-green': ['#3d7a00', '#80d43a'],

    // Categorical — Orange
    '--color-background-orange': ['#c4762033', '#d4903a33'],
    '--color-border-orange': ['#c47620', '#d4903a'],
    '--color-icon-orange': ['#c47620', '#d4903a'],
    '--color-text-orange': ['#a06018', '#e0a04a'],

    // Categorical — Pink
    '--color-background-pink': ['#c44a7033', '#e07a9a33'],
    '--color-border-pink': ['#c44a70', '#e07a9a'],
    '--color-icon-pink': ['#c44a70', '#e07a9a'],
    '--color-text-pink': ['#a03a5a', '#f08aaa'],

    // Categorical — Purple
    '--color-background-purple': ['#6b4a8c33', '#b08ed433'],
    '--color-border-purple': ['#6b4a8c', '#b08ed4'],
    '--color-icon-purple': ['#6b4a8c', '#b08ed4'],
    '--color-text-purple': ['#553a70', '#c0a0e0'],

    // Categorical — Red
    '--color-background-red': ['#FD000033', '#ff5c5c33'],
    '--color-border-red': ['#FD0000', '#ff5c5c'],
    '--color-icon-red': ['#FD0000', '#ff5c5c'],
    '--color-text-red': ['#cc0000', '#ff7a7a'],

    // Categorical — Teal（= 强调色那一族）
    '--color-background-teal': ['#2E6B5A33', '#7FC4AE33'],
    '--color-border-teal': ['#2E6B5A', '#7FC4AE'],
    '--color-icon-teal': ['#2E6B5A', '#7FC4AE'],
    '--color-text-teal': ['#245546', '#8FD0BA'],

    // Categorical — Yellow
    '--color-background-yellow': ['#FFB60033', '#ffc94033'],
    '--color-border-yellow': ['#FFB600', '#ffc940'],
    '--color-icon-yellow': ['#FFB600', '#ffc940'],
    '--color-text-yellow': ['#cc9200', '#ffd960'],

    // =========================================================================
    // Spacing
    // =========================================================================
    '--spacing-0-5': '3px',
    '--spacing-1': '6px',
    '--spacing-1-5': '9px',
    '--spacing-2': '12px',
    '--spacing-3': '18px',
    '--spacing-4': '24px',
    '--spacing-5': '30px',
    '--spacing-6': '36px',
    '--spacing-7': '42px',
    '--spacing-8': '48px',
    '--spacing-9': '54px',
    '--spacing-10': '60px',
    '--spacing-11': '66px',
    '--spacing-12': '72px',

    // =========================================================================
    // Radius — soft and rounded
    // =========================================================================
    '--radius-inner': '6px',
    '--radius-element': '12px',
    '--radius-container': '18px',
    '--radius-page': '42px',

    // No explicit --font-size-* overrides — font sizes come from
    // typography.scale above, keeping the scale the single source of truth.

    // =========================================================================
    // Element sizes
    // =========================================================================
    '--size-element-sm': '36px',
    '--size-element-md': '40px',
    '--size-element-lg': '44px',

    // =========================================================================
    // Shadows
    // =========================================================================
    '--shadow-low': '0 2px 4px #0000000D, 0 4px 8px #0000001A',
    '--shadow-med': '0 2px 4px #0000000D, 0 4px 12px #0000001A',
    '--shadow-high': '0 4px 6px #0000001A, 0 12px 24px #00000026',
    '--shadow-inset-hover': 'inset 0px 0px 0px 2px #14141430',
    '--shadow-inset-selected': 'inset 0px 0px 0px 2px #2E6B5A50',
    '--shadow-inset-success': 'inset 0px 0px 0px 2px #4D990050',
    '--shadow-inset-warning': 'inset 0px 0px 0px 2px #FFB60050',
    '--shadow-inset-error': 'inset 0px 0px 0px 2px #FD000050',
  },

  components: {
    button: {
      base: {
        borderRadius: 'var(--radius-full)',
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-page)',
        padding: 'var(--spacing-3)',
      },
    },
    section: {
      base: {
        padding: 'var(--spacing-3)',
      },
    },
  },

  icons: parrottoonIconRegistry,
});
