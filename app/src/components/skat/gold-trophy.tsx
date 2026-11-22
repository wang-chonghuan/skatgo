import * as stylex from '@stylexjs/stylex'
import { useId } from 'react'

import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { goldTrophy as cup } from '../../theme/constants'
import { shine, timing, twinkle } from '../../theme/effects.stylex'
import { fill } from '../../theme/elevation.stylex'

// The League tile's cup (SKATGO-221, the human: 「奖杯改成金色带高光的还会闪的，这个是提高留存的重要途径」): gold, lit at the
// rim and down the bowl's left, glowing softly; a band of light passes over it about every three seconds, and two
// sparkles beside it twinkle out of step. A visitor who asked for less motion sees it still: no band, the sparkles lit.
const sweep = stylex.keyframes({ from: { transform: shine.start }, to: { transform: shine.end } })
const glint = stylex.keyframes({ from: { opacity: twinkle.dim, transform: twinkle.small }, to: { opacity: twinkle.lit, transform: twinkle.whole } })

/** The gold cup, `size` px square, in place of a tile's outline icon: it takes an outline icon's props, and needs no
 *  stroke and is always hidden from assistive technology, as the tile's title names it. */
export function GoldTrophy({ size }: { size: number; strokeWidth?: number; 'aria-hidden'?: 'true' }) {
  // Each cup's gradient and clip are its own: `useId`'s punctuation is not safe inside `url(#…)`.
  const id = `gold-trophy-${useId().replace(/[^\w-]/g, '')}`
  return (
    <svg aria-hidden="true" data-testid="gold-trophy" width={size} height={size} viewBox={cup.view} {...stylex.props(styles.cup)}>
      <defs>
        <linearGradient id={`${id}-gold`} x1={0} y1={0} x2={1} y2={1}>
          <stop offset={cup.stops.light} {...stylex.props(styles.light)} />
          <stop offset={cup.stops.gold} {...stylex.props(styles.gold)} />
          <stop offset={cup.stops.deep} {...stylex.props(styles.deep)} />
        </linearGradient>
        <clipPath id={`${id}-body`}>
          <path d={cup.bowl} />
          <path d={cup.foot} />
        </clipPath>
      </defs>
      {cup.handles.map((d) => (
        <path key={d} d={d} stroke={`url(#${id}-gold)`} strokeWidth={cup.handle} strokeLinecap="round" {...stylex.props(styles.none)} />
      ))}
      <path d={cup.foot} fill={`url(#${id}-gold)`} />
      <path d={cup.plaque} strokeWidth={cup.plaqueLine} strokeLinecap="round" {...stylex.props(styles.engraved)} />
      <path d={cup.bowl} fill={`url(#${id}-gold)`} />
      <path d={cup.star} {...stylex.props(styles.star)} />
      <path d={cup.rim} {...stylex.props(styles.rim)} />
      <path d={cup.highlight} strokeWidth={cup.highlightLine} strokeLinecap="round" {...stylex.props(styles.highlight)} />
      <g clipPath={`url(#${id}-body)`}>
        <path data-testid="gold-trophy-shine" d={cup.band} {...stylex.props(styles.band)} />
      </g>
      {cup.sparkles.map((d, i) => (
        <path key={d} data-testid="gold-trophy-sparkle" d={d} {...stylex.props(styles.sparkle, i > 0 && styles.behind)} />
      ))}
    </svg>
  )
}

const styles = stylex.create({
  cup: { display: 'block', flexShrink: 0, overflow: 'visible', filter: fill.trophyGlow },
  light: { stopColor: color.trophyLight },
  gold: { stopColor: color.trophyGold },
  deep: { stopColor: color.trophyDeep },
  none: { fill: 'none' },
  rim: { fill: color.trophyLight },
  star: { fill: color.trophyDeep },
  engraved: { fill: 'none', stroke: color.trophyDeep },
  highlight: { fill: 'none', stroke: color.onColorSoft },
  band: {
    fill: color.onColorSoft,
    transform: shine.start,
    animationName: { default: sweep, [bp.reducedMotion]: 'none' },
    animationDuration: timing.shine,
    animationTimingFunction: timing.steady,
    animationIterationCount: 'infinite',
  },
  sparkle: {
    fill: color.trophyLight,
    transformBox: 'fill-box',
    transformOrigin: 'center',
    animationName: { default: glint, [bp.reducedMotion]: 'none' },
    animationDuration: timing.twinkle,
    animationTimingFunction: timing.easeInOut,
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
  },
  behind: { animationDelay: timing.twinkleBehind },
})
