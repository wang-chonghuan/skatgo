import { GameTable } from './game-table'
import { useProgress } from '~/lib/skat/progress'

/** Free play's table, browser-only (./client-part.tsx): every settled game goes into the learner's
 *  tally. */
export function FreeTable() {
  const recordGame = useProgress((s) => s.recordGame)
  return <GameTable fullScreen onSettled={({ humanWon, humanScore }) => recordGame(humanWon, humanScore)} />
}
