import { useEffect, useState } from 'react'

import { cardId, sameCard } from '~/lib/skat/cards'
import { type Game, type Move, collectTrick, playCard } from '~/lib/skat/game'
import type { OpenEndgame, OpenNode, Played } from '~/lib/skat/tricks/exercises/open'
import { BOT_DELAY, GameTable } from './game-table'

/**
 * An open-card endgame played out on the game's own table (SKATGO-110, the human: 「出的就跟打牌界面一样……都是明牌，
 * 形式就是有人打明手时的桌面的样子」): every hand open, the learner in seat 0. Each card the learner plays is judged by
 * the worked-out play: one that still wins is right, and the others then play their best answers, card by card, until
 * it is the learner's turn again or the game is decided; one that loses is wrong, and the others show why by playing
 * the rest out, everybody at their best. Nothing is worked out here.
 */
/** Where a wrong card was played: the turn it was played at, and whether that was the first. */
export type OpenMistake = { at: OpenNode; first: boolean }

export function OpenTable({ e, onSolved, onMistake }: { e: OpenEndgame; onSolved: () => void; onMistake: (m: OpenMistake) => void }) {
  const [game, setGame] = useState<Game>(e.game)
  // The learner's turn now, with what it asks; null while the others play or once it is over.
  const [node, setNode] = useState<OpenNode | null>(e.play)
  // The others' cards still to come, and what follows them: the learner's next turn, or the end.
  const [queue, setQueue] = useState<Played[]>([])
  const [then, setThen] = useState<OpenNode | null>(null)
  const [state, setState] = useState<'play' | 'right' | 'wrong'>('play')

  function send(move: Move) {
    if (move.type !== 'play' || !node || state !== 'play') return
    const played = playCard(game, move.card)
    if (played === game) return
    const right = node.after.find((a) => sameCard(a.card, move.card))
    setGame(played)
    setNode(null)
    if (right) {
      setQueue(right.plays)
      setThen(right.next)
      return
    }
    setQueue(node.refute.find((r) => sameCard(r.card, move.card))?.plays ?? [])
    setState('wrong')
    onMistake({ at: node, first: node === e.play })
  }

  // The others' cards, one by one at the computers' pace; a finished trick waits for the table to gather it in.
  useEffect(() => {
    if (game.phase === 'trickEnd') return
    if (queue.length) {
      if (game.phase !== 'play') return
      const t = setTimeout(() => {
        setGame((g) => playCard(g, queue[0].card))
        setQueue((q) => q.slice(1))
      }, BOT_DELAY)
      return () => clearTimeout(t)
    }
    // All shown — after the last trick too, when the game is over.
    if (state !== 'play' || node) return
    if (then) setNode(then)
    else {
      setState('right')
      onSolved()
    }
    // Once per card shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, queue])

  const exercise = {
    game,
    busy: !node || state !== 'play',
    send,
    collect: () => setGame((g) => (g.phase === 'trickEnd' ? collectTrick(g) : g)),
    next: () => {},
  }
  return (
    // The cards that win now, for scripted checks; the table itself never tells.
    <div data-testid="open-endgame" data-state={state} data-turn={String(!!node && state === 'play')} data-win={node ? node.win.map(cardId).join(' ') : ''}>
      <GameTable exercise={exercise} />
    </div>
  )
}
