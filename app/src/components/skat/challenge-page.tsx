import * as stylex from '@stylexjs/stylex'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { type ChallengeReply, challengeAct, challengeAgain, challengeNew, challengeReview } from '~/lib/challenge-api'
import type { FreeError } from '~/lib/free-api'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, type ChallengeKind, aimsSchneider, contractOfGame } from '~/lib/skat/challenge'
import { kindProgress, useChallengeProgress } from '~/lib/skat/challenge-progress'
import type { Move } from '~/lib/skat/game'
import { type SeatView, gameFromView } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { timing } from '../../theme/effects.stylex'
import { elev, pose } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { BOT_DELAY, GameTable } from './game-table'
import { TableLoading } from './table-loading'
import { Btn, Panel, ProgressBar } from './ui'

// Hard hands (SKATGO-248, the human: 「我要新模块难牌挑战」): the kinds of hand that are hard to play, each a run of deals from the
// easiest, the game set and the player the declarer; after each deal the AI's run of the same cards beside theirs. Counted
// nowhere (grill Q2) but in each kind's progress (SKATGO-249): the deals of it passed, on its card.

const KIND_TEXT: Record<ChallengeKind, { title: () => string; text: () => string }> = {
  'one-jack-suit': { title: m.challenge_kind_one_jack_suit_title, text: m.challenge_kind_one_jack_suit_text },
  'short-trumps': { title: m.challenge_kind_short_trumps_title, text: m.challenge_kind_short_trumps_text },
  'one-jack-grand': { title: m.challenge_kind_one_jack_grand_title, text: m.challenge_kind_one_jack_grand_text },
  'null-weak-spot': { title: m.challenge_kind_null_weak_spot_title, text: m.challenge_kind_null_weak_spot_text },
  'bad-seat': { title: m.challenge_kind_bad_seat_title, text: m.challenge_kind_bad_seat_text },
  schneider: { title: m.challenge_kind_schneider_title, text: m.challenge_kind_schneider_text },
}

/** The list: what the module is for, and each kind as the course's option cards with its progress, opening its first deal
 *  not yet passed. */
export function ChallengePage() {
  const { passed } = useChallengeProgress()
  return (
    <div data-testid="hard-hands" {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.challenge_title()}</h1>
        <p {...stylex.props(typography.appText, styles.lead)}>{m.challenge_lead()}</p>
        <ol {...stylex.props(styles.list)}>
          {CHALLENGE_KINDS.map((kind) => {
            const { done, next } = kindProgress(passed, kind)
            const count = m.challenge_progress({ n: done, count: CHALLENGE_DEALS })
            return (
              <li key={kind} {...stylex.props(styles.item)}>
                <Link to="/hard-hands/play" search={{ kind, n: next }} data-testid="hard-hands-kind" data-kind={kind} {...stylex.props(styles.card)}>
                  <span {...stylex.props(typography.optionTitle, styles.optionTitle)}>{KIND_TEXT[kind].title()}</span>
                  <span {...stylex.props(typography.optionDesc, styles.optionDesc)}>{KIND_TEXT[kind].text()}</span>
                  <span {...stylex.props(styles.progress)}>
                    <span data-testid="hard-hands-progress" {...stylex.props(typography.meta, styles.optionDesc)}>{count}</span>
                    <ProgressBar value={done / CHALLENGE_DEALS} label={count} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
        <nav {...stylex.props(styles.links)}>
          <Link to="/skat-tricks" {...stylex.props(typography.appLink, styles.link)}>{m.home_practice()}</Link>
          <Link to="/advanced-course" {...stylex.props(typography.appLink, styles.link)}>{m.advanced_title()}</Link>
        </nav>
      </div>
    </div>
  )
}

/** A deal of a kind on the table, the whole screen: the set game said over the skat step; at its end the result with the
 *  AI's run of the same cards, then the next deal of the kind or the same hand once more with the others dealt anew. */
export function ChallengePlayPage() {
  const search = useSearch({ from: '/hard-hands_/play' })
  const kind = search.kind ?? CHALLENGE_KINDS[0]
  const n = search.n ?? 1
  const navigate = useNavigate()
  const close = () => void navigate({ to: '/hard-hands' })
  const [reply, setReply] = useState<ChallengeReply | null>(null)
  const [shown, setShown] = useState<SeatView | null>(null)
  const [queue, setQueue] = useState<SeatView[]>([])
  const [release, setRelease] = useState(false)
  const [sending, setSending] = useState(false)
  const [failed, setFailed] = useState(false)
  function take(r: ChallengeReply | FreeError) {
    setSending(false)
    if ('error' in r) return setFailed(true)
    setReply(r)
    setShown(r.steps[0])
    setQueue(r.steps.slice(1))
  }
  async function begin(ask: () => Promise<ChallengeReply | FreeError>) {
    setSending(true)
    setRelease(false)
    setFailed(false)
    take(await ask())
  }
  useEffect(() => {
    void begin(() => challengeNew(kind, n))
  }, [kind, n])
  useEffect(() => {
    if (queue.length === 0) return
    const held = shown?.phase === 'trickEnd'
    if (held && !release) return
    const t = setTimeout(() => {
      if (held) setRelease(false)
      setShown(queue[0])
      setQueue((q) => q.slice(1))
    }, held ? 0 : BOT_DELAY)
    return () => clearTimeout(t)
  }, [queue, shown, release])
  const game = useMemo(() => (shown ? gameFromView(shown) : null), [shown])
  const token = reply?.token ?? null
  const { pass } = useChallengeProgress()
  // The review says whether the deal is passed; an account's pass the service has already kept, a guest's is this browser's.
  const review = useCallback(async () => {
    const r = await challengeReview(token ?? '')
    if (!('error' in r) && r.passed) pass(r.kind, r.n)
    return r
  }, [token, pass])
  if (failed) {
    return (
      <div {...stylex.props(styles.summary)}>
        <Panel tone="bad">
          <p role="alert" {...stylex.props(typography.appText, styles.title)}>{m.challenge_failed()}</p>
          <Btn onClick={close}>{m.challenge_back()}</Btn>
        </Panel>
      </div>
    )
  }
  if (!game || !reply) return <TableLoading />
  const next = n < reply.of ? () => void navigate({ to: '/hard-hands/play', search: { kind, n: n + 1 } }) : close
  async function send(move: Move) {
    if (!token) return
    setSending(true)
    take(await challengeAct(token, reply!.revision, move))
  }
  return (
    <GameTable
      fullScreen
      server={{
        game,
        busy: sending || queue.length > 0,
        send: (move) => void send(move),
        collect: () => setRelease(true),
        next,
        fixed: contractOfGame(reply.game),
        aim: aimsSchneider(kind) ? 'schneider' : undefined,
        deal: { n, of: reply.of },
        review,
        close,
        done: (
          <div {...stylex.props(styles.foot)}>
            {aimsSchneider(kind) && game.result ? (
              <p data-testid="hard-hands-aim" {...stylex.props(typography.appText, styles.title)}>
                {game.result.won && game.result.declarerPoints >= 90
                  ? m.challenge_schneider_made({ points: game.result.declarerPoints })
                  : m.challenge_schneider_missed({ points: game.result.declarerPoints })}
              </p>
            ) : null}
            <Btn testId="hard-hands-next" shape="block" size="lg" onClick={next}>{n < reply.of ? m.challenge_next() : m.challenge_back()}</Btn>
            <Btn testId="hard-hands-again" tone="quiet" shape="block" size="lg" onClick={() => void begin(() => challengeAgain(token!))}>{m.challenge_again()}</Btn>
          </div>
        ),
      }}
    />
  )
}

const focus = {
  outlineStyle: { default: 'none', ':focus-visible': 'solid' },
  outlineWidth: border.focus,
  outlineColor: color.info,
  outlineOffset: border.focusOffset,
} as const

// The advanced course's column and option cards (advanced-course-page.tsx).
const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x24,
    width: '100%',
    maxWidth: dims.pageColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x48, [bp.phone]: space.x24 },
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
    paddingInline: { default: space.x48, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.slate },
  links: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x12 },
  link: { color: color.info },
  optionTitle: { margin: 0, color: color.navy },
  optionDesc: { margin: 0, color: color.slate },
  progress: { display: 'flex', flexDirection: 'column', gap: space.x8, marginTop: 'auto' },
  list: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.cards]: dims.oneColumn },
    gridAutoRows: dims.equalRows,
    gap: space.x16,
  },
  item: { margin: 0, display: 'flex' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x10,
    flexGrow: 1,
    padding: space.x24,
    borderRadius: radii.option,
    borderWidth: border.tile,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: color.surface,
    boxShadow: elev.option,
    color: color.text,
    textDecoration: 'none',
    transform: { default: pose.rest, ':hover': pose.lift },
    transitionProperty: 'transform, border-color',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    ...focus,
  },
  summary: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flexGrow: 1, padding: space.x16, maxWidth: dims.readingColumn, marginInline: 'auto', width: '100%', boxSizing: 'border-box' },
  foot: { display: 'flex', flexDirection: 'column', gap: space.x12 },
})
