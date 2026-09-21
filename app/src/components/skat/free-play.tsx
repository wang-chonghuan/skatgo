import { Link } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { GameTable } from './game-table'
import { useProgress } from '~/lib/skat/progress'
import { skat } from '../../theme/skat.stylex'

/** A table with no lesson around it: for practice after the course, or for people who already play. */
export function FreePlay() {
  const recordGame = useProgress((s) => s.recordGame)
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(styles.h1)}>自由对局</h1>
        <Link to="/" {...stylex.props(styles.back)}>← 课程目录</Link>
      </div>
      <GameTable onSettled={({ humanWon, humanScore }) => recordGame(humanWon, humanScore)} />
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: 14 },
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  h1: { margin: 0, fontSize: 24, fontWeight: 800, color: skat.ink },
  back: { color: skat.inkSoft, textDecoration: 'none', fontSize: 14, fontWeight: 600 },
})
