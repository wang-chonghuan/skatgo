import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { GameTable } from './game-table'
import { useProgress } from '~/lib/skat/progress'
import { m } from '~/paraglide/messages'
import { skat } from '../../theme/skat.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

/** A table with no lesson around it: for practice after the course, or for people who already play. */
export function FreePlay() {
  const recordGame = useProgress((s) => s.recordGame)
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(typography.pageTitle, styles.h1)}>{m.free_title()}</h1>
        <Link to="/" data-testid="skat-back-start" {...stylex.props(typography.link, styles.back)}>{m.back_to_start()}</Link>
      </div>
      <GameTable onSettled={({ humanWon, humanScore }) => recordGame(humanWon, humanScore)} />
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: space.x14 },
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  h1: { margin: 0, color: skat.ink },
  back: { color: skat.inkSoft, textDecoration: 'none' },
})
