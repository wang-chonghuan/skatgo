import { ServerTable } from './server-table'
import { useProgress } from '~/lib/skat/progress'

/** Free play's table, browser-only (./client-part.tsx): a game on the server against SkatZero's
 *  computers (SKATGO-40); every settled game goes into the learner's tally. */
export function FreeTable() {
  const recordGame = useProgress((s) => s.recordGame)
  return <ServerTable fullScreen onSettled={({ humanWon, humanScore }) => recordGame(humanWon, humanScore)} />
}
