import * as stylex from '@stylexjs/stylex'
import { useEffect, useMemo, useRef, useState } from 'react'

import { type FreeError, freeAct, freeNew, isFreeError } from '~/lib/free-api'
import type { Move } from '~/lib/skat/game'
import { type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { BOT_DELAY, GameTable, TRICK_DELAY } from './game-table'
import { Btn, Panel } from './ui'

// Free play and lesson 11 on the server (SKATGO-40): a game drawn from the server's pool, played
// against SkatZero's computers. The page holds the game's token in memory only — no cookie, no
// storage — so a reload starts a new game, as before. The server answers each move with every state
// the table passed through, and the table shows them one by one on its own beats. Hints and the
// assistant work as at the local table: they read only what this seat may see.

type Failure = { text: string; retry?: () => void }

const problemText = (e: FreeError) =>
  e.error === 'slow_down' ? m.free_slow_down() : e.error === 'game_expired' || e.error === 'invalid_game' ? m.free_expired() : m.free_unreachable()

export function ServerTable({ fullScreen = false, onSettled }: { fullScreen?: boolean; onSettled?: (info: { humanWon: boolean; humanScore: number }) => void }) {
  const [token, setToken] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const started = useRef(false)

  function take(steps: SeatView[], next: { token: string; revision: number }) {
    setToken(next.token)
    setRevision(next.revision)
    setFailure(null)
    setShown(steps[0])
    setQueue(steps.slice(1))
  }

  async function start() {
    setSending(true)
    const r = await freeNew()
    setSending(false)
    if (isFreeError(r)) return setFailure({ text: problemText(r), retry: () => void start() })
    take(r.steps, r)
  }

  async function send(move: Move) {
    if (!token) return
    setSending(true)
    const r = await freeAct(token, revision, move)
    setSending(false)
    if (isFreeError(r)) {
      // The same move with the same token is safe to send again; an expired game can only start over.
      const lost = r.error === 'game_expired' || r.error === 'invalid_game' || r.error === 'stale_revision'
      return setFailure({ text: problemText(r), retry: lost ? undefined : () => void send(move) })
    }
    take(r.steps, r)
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    void start()
    // Once, when the table opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The computers' moves arrive all at once; show them one by one, a trick lingering as at the table.
  useEffect(() => {
    if (queue.length === 0) return
    const t = setTimeout(() => {
      setShown(queue[0])
      setQueue((q) => q.slice(1))
    }, shown?.phase === 'trickEnd' ? TRICK_DELAY : BOT_DELAY)
    return () => clearTimeout(t)
  }, [queue, shown])

  const game = useMemo(() => (shown ? gameFromView(shown) : null), [shown])
  if (!game) {
    if (!failure) return null
    return (
      <Panel tone="bad">
        <p data-testid="server-problem" role="alert" {...stylex.props(typography.appText, styles.text)}>{failure.text}</p>
        <div {...stylex.props(styles.row)}>
          <Btn testId="server-new-game" onClick={() => void start()}>{m.free_new_game()}</Btn>
        </div>
      </Panel>
    )
  }
  return (
    <GameTable
      fullScreen={fullScreen}
      onSettled={onSettled}
      server={{
        game,
        busy: sending || queue.length > 0,
        send: (move) => void send(move),
        next: () => void start(),
        problem: failure ? { text: failure.text, retry: failure.retry, fresh: () => void start() } : null,
      }}
    />
  )
}

const styles = stylex.create({
  text: { margin: 0, color: color.navy },
  row: { display: 'flex', gap: space.x10, paddingTop: space.x10 },
})
