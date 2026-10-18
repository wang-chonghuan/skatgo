import * as stylex from '@stylexjs/stylex'
import { type ReactNode, useEffect, useState } from 'react'

import { type Card, cardId, pointsOf, sameCard } from '~/lib/skat/cards'
import { type Game, type Move, collectTrick, playCard } from '~/lib/skat/game'
import type { OpenEndgame, OpenNode, Played } from '~/lib/skat/tricks/exercises/open'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { BOT_DELAY, GameTable } from './game-table'
import { ProgressBar } from './ui'

/**
 * An open-card endgame played out on the game's own table (SKATGO-110, the human: 「出的就跟打牌界面一样……都是明牌，
 * 形式就是有人打明手时的桌面的样子」): every hand open, the learner in seat 0. After each card the learner plays, the
 * others play their best answers from the worked-out play, card by card, until it is the learner's turn again or the
 * game is decided. A wrong card is not marked: the learner plays on to the end and is told then (SKATGO-111, the
 * human: 「我觉得可以打完，打完后告诉它错了，记下来，但是可以重试」). Nothing is worked out here.
 */
/** The first wrong card: the turn it was played at, the card, and whether that was the first turn. */
export type OpenMistake = { at: OpenNode; card: Card; first: boolean }

export function OpenTable({ e, onSolved, onMistake, after }: { e: OpenEndgame; onSolved: () => void; onMistake: (m: OpenMistake) => void; after?: ReactNode }) {
  const [game, setGame] = useState<Game>(e.game)
  // The learner's turn now, with what it asks; null while the others play or once it is over.
  const [node, setNode] = useState<OpenNode | null>(e.play)
  // The others' cards still to come, and what follows them: the learner's next turn, or the end.
  const [queue, setQueue] = useState<Played[]>([])
  const [then, setThen] = useState<OpenNode | null>(null)
  const [state, setState] = useState<'play' | 'right' | 'wrong'>('play')
  const [miss, setMiss] = useState<OpenMistake | null>(null)

  function send(move: Move) {
    if (move.type !== 'play' || !node || state !== 'play') return
    const played = playCard(game, move.card)
    if (played === game) return
    const answer = node.after.find((a) => sameCard(a.card, move.card))
    if (!answer) return
    setGame(played)
    setNode(null)
    if (!miss && !node.win.some((c) => sameCard(c, move.card))) setMiss({ at: node, card: move.card, first: node === e.play })
    setQueue(answer.plays)
    setThen(answer.next)
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
    // All shown — after the last trick too, when the game is over; only then is the learner told.
    if (state !== 'play' || node) return
    if (then) setNode(then)
    else if (miss) {
      setState('wrong')
      onMistake(miss)
    } else {
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
    top: <Goal game={game} role={e.role} />,
    // Once the game is decided.
    after: state !== 'play' ? after : undefined,
  }
  return (
    // The cards that win now, for scripted checks; the table itself never tells.
    <div
      data-testid="open-endgame"
      data-state={state}
      data-turn={String(!!node && state === 'play')}
      data-win={node ? node.win.map(cardId).join(' ') : ''}
      data-miss={miss ? cardId(miss.card) : ''}
    >
      <GameTable exercise={exercise} />
    </div>
  )
}

/** The goal over the felt, in the info board's place (SKATGO-111, the human: 「像那种两步杀，消消乐那种」): the declarer's card
 *  points so far — the skat and its tricks — against 61, as a bar that grows with every trick it takes. */
function Goal({ game, role }: { game: Game; role: OpenEndgame['role'] }) {
  const have = pointsOf(game.skat) + game.tricks.filter((t) => t.winner === game.declarer).reduce((n, t) => n + pointsOf(t.cards.map((p) => p.card)), 0)
  return (
    <div data-testid="open-goal" data-have={have} {...stylex.props(styles.goal)}>
      <div {...stylex.props(styles.goalRow)}>
        <span {...stylex.props(typography.infoLabel, styles.onFelt)}>{role === 'declarer' ? m.tricks_open_you({ n: have }) : m.tricks_open_declarer({ n: have })}</span>
        <span {...stylex.props(typography.infoLabel, styles.goalText)}>{role === 'declarer' ? m.tricks_open_goal_declarer() : m.tricks_open_goal_defender()}</span>
      </div>
      <ProgressBar value={have / 61} label={m.tricks_open_goal_declarer()} />
    </div>
  )
}

const styles = stylex.create({
  goal: { display: 'flex', flexDirection: 'column', gap: space.x6, width: '100%', maxWidth: dims.tipWidth, marginInline: 'auto', boxSizing: 'border-box', paddingInline: space.x12, paddingTop: space.x8 },
  goalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: space.x12 },
  onFelt: { color: color.onColor },
  goalText: { color: color.amber },
})
