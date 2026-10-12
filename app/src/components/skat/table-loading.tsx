import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { timing, turn } from '../../theme/effects.stylex'
import { fill } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'

/**
 * What a table shows while it loads (SKATGO-93): the felt, and on it the SkatGo logo turning in a white disc that fades into the felt at its rim —
 * three suits around the club, so it reads as turning (the human: 「不要显示那个几个人打牌的插画，应该显示我logo的动画」,
 * then 「还是要圆形白色」). The logo is on a clear ground, or the icon's white square would stick out of the disc as
 * it turns, and the centre of its three outer suits is the picture's own, so it turns about its middle (the human:
 * 「旋转的中心不对」): logo-mark.png, cut by `.intentfold/tickets/SKATGO-93/icons.mjs`.
 * The turn is CSS, so it runs before the page's script; with reduced motion the logo stands still.
 */
export function TableLoading({ children }: { children?: ReactNode }) {
  return (
    <div data-testid="table-loading" role="status" aria-label={m.table_loading()} {...stylex.props(styles.hold)}>
      <span {...stylex.props(styles.disc)}>
        <img src="/logo-mark.png" alt="" {...stylex.props(styles.mark)} />
      </span>
      {children}
    </div>
  )
}

const spin = stylex.keyframes({ from: { transform: turn.start }, to: { transform: turn.end } })

const styles = stylex.create({
  hold: {
    minHeight: dims.screenDynamic,
    backgroundImage: fill.felt,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.x24,
    padding: space.x24,
    boxSizing: 'border-box',
  },
  disc: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.tableLoader,
    height: dims.tableLoader,
    backgroundImage: fill.loaderGlow,
  },
  mark: {
    width: dims.tableLoaderMark,
    height: dims.tableLoaderMark,
    animationName: { default: spin, [bp.reducedMotion]: 'none' },
    animationDuration: timing.spin,
    animationTimingFunction: timing.steady,
    animationIterationCount: 'infinite',
  },
})
