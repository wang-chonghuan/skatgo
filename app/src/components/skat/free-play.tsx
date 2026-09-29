import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { GameTable } from './game-table'
import { useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { border, layer, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

/** A table with no lesson around it: for practice after the course, or for people who already play.
 *  In the lobby design (SKATGO-26) the table fills the screen; the page's title and its way back sit
 *  in the felt's top-left corner. */
export function FreePlay() {
  const recordGame = useProgress((s) => s.recordGame)
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <Link to="/" data-testid="skat-back-start" {...stylex.props(typography.bandBack, styles.back)}>
          {m.back_to_start()}
        </Link>
        <h1 {...stylex.props(typography.panelLabel, styles.h1)}>{m.free_title()}</h1>
      </div>
      <GameTable fullScreen onSettled={({ humanWon, humanScore }) => recordGame(humanWon, humanScore)} />
    </div>
  )
}

const styles = stylex.create({
  root: { position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column' },
  head: {
    position: 'absolute',
    top: space.x16,
    left: { default: space.x16, [bp.phone]: space.x8 },
    zIndex: layer.launcher,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x4,
  },
  h1: { margin: 0, color: color.onColor },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.x4,
    color: color.onColor,
    textDecoration: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.gold,
  },
})
