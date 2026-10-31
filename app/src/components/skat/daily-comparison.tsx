import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { dailyReview } from '~/lib/daily-api'
import { type Card, pointsOf, sameCard } from '~/lib/skat/cards'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import type { Game } from '~/lib/skat/game'
import { type DailySize, type DailyStatus, type DealReview, type DealSummary, type Differ, PLAYER, type SeatBid, totals } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PlayingCard } from './playing-card'
import { Panel, Rich } from './ui'

// The day against the AI (SKATGO-42, SKATGO-48): every deal the player has finished, beside the same deal
// played by the computer in the player's seat against the same two computers — worked out when the day
// was dealt, and shown only once the player has finished that deal.
//
// Since SKATGO-79 every comparison is a score sheet: all three seats' Seeger-Fabian scores, the player's
// deal over the AI's. What is compared and ranked is the player's own Seeger-Fabian score, the standard
// German players know (SKATGO-81, the human: 「按他们习惯的标准来」, and of Saldo: 「saldo都移除吧」). The player is navy and the AI the
// app's blue, its one "AI" tag wherever the AI is named (SKATGO-80, the human: 「AI标志都用app里那个蓝色的
// Ai标志」), so the two lines are told apart at a glance; neither colour judges. A day's row gives both
// scores and opens to the deal's bidding and its one trick most worth improving (SKATGO-145); the rows fold so
// the table fits a phone without scrolling sideways.

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

/** The seats' names in the player's deal, and in the AI's, where the AI sits in the player's seat. */
const youNames = () => [m.name_you(), m.name_lina(), m.name_max()]
const aiNames = () => [m.daily_ai(), m.name_lina(), m.name_max()]

/** The seat's part in a deal, as a word under its score. */
function roleOf(d: DealSummary): string {
  if (d.declarer === null) return m.daily_passed_in_short()
  return d.declarer === PLAYER ? m.daily_role_declarer() : m.daily_role_defender()
}

/** The game a deal was played as: the contract and what was announced with it. */
export function gameName(d: DealSummary): string {
  const decl = d.declaration!
  return [
    contractName(decl.contract),
    decl.hand ? 'Hand' : null,
    decl.schneiderAnnounced ? m.announced_schneider() : null,
    decl.schwarzAnnounced ? m.announced_schwarz() : null,
    decl.ouvert ? 'Ouvert' : null,
  ].filter(Boolean).join(' ')
}

/** The declarer and the game, the outcome with its card points, and what made it big or lost it. */
function playedParts(d: DealSummary, who: string): string[] {
  const decl = d.declaration!
  const parts = [`${who}: ${gameName(d)}`]
  const outcome = d.won ? m.daily_won() : m.daily_lost()
  const x = d.detail!
  // Null is decided by tricks, not card points.
  parts.push(decl.contract.kind === 'null' ? outcome : `${outcome} ${x.declarerPoints}:${x.defenderPoints}`)
  if (x.schwarz) parts.push('Schwarz')
  else if (x.schneider) parts.push('Schneider')
  if (x.overbid) parts.push(m.daily_overbid())
  return parts
}

/** What a deal was, as the line under its row in a score sheet (SKATGO-79): the declarer, the game and
 *  the bid, won or lost with the card points, and what made it big or lost it — or that all passed. */
export function gameLine(d: DealSummary, names: string[]): string {
  if (d.declarer === null || !d.declaration) return m.daily_passed_in_short()
  const [head, ...rest] = playedParts(d, names[d.declarer])
  return [`${head} (${d.bid})`, ...rest].join(' · ')
}

type Scores = readonly [number, number, number]
type Side = 'you' | 'ai'

/** Whose line it is: the player in navy, the AI in the app's blue (SKATGO-79, SKATGO-80) — the one tag
 *  for the AI in a score sheet, the play record and on the leaderboard. */
export function Who({ side }: { side: Side }) {
  return (
    <span data-who={side} {...stylex.props(typography.badge, styles.whoTag, side === 'you' ? styles.whoYou : styles.whoAi)}>
      {side === 'you' ? m.name_you() : m.daily_ai()}
    </span>
  )
}

/**
 * A score sheet (SKATGO-79): the three seats' Seeger-Fabian scores — of one deal, or a tournament's totals
 * — the player's line over the AI's, the player's own seat marked. `lines` puts what the deal was under
 * each row. The AI's line is missing on days dealt before it played them.
 */
export function ScoreSheet({ mine, ai, lines, testId }: { mine: Scores; ai: Scores | null; lines?: { you: string; ai: string | null }; testId: string }) {
  const seats = [m.daily_col_seat(), m.name_lina(), m.name_max()]
  const rows: [Side, Scores, string | null][] = [['you', mine, lines?.you ?? null], ...(ai ? [['ai', ai, lines?.ai ?? null] as [Side, Scores, string | null]] : [])]
  return (
    <table data-testid={testId} {...stylex.props(styles.scores)}>
        <thead>
          {/* The own seat's shading starts under its name, which stays readable (SKATGO-93, the human: 「your seat 这个字不要被灰色阴影遮住」). */}
          <tr>
            <td />
            {seats.map((name, seat) => (
              <th key={name} scope="col" {...stylex.props(typography.small, styles.scoreHead)}>{name}</th>
            ))}
          </tr>
        </thead>
        {rows.map(([side, scores, line]) => (
          <tbody key={side} data-row={side} data-scores={scores.join(',')}>
            <tr>
              <th scope="row" {...stylex.props(styles.scoreLabel)}><Who side={side} /></th>
              {scores.map((v, seat) => (
                <td key={seat} data-seat={seat} {...stylex.props(typography.appBtnStrong, styles.scoreCell, seat === PLAYER && styles.own)}>{signed(v)}</td>
              ))}
            </tr>
            {line ? (
              <tr>
                <td colSpan={seats.length + 1} data-testid="daily-game-line" {...stylex.props(typography.micro, styles.gameLine)}><Rich text={line} /></td>
              </tr>
            ) : null}
          </tbody>
        ))}
    </table>
  )
}

/** Fetches a finished deal's review: its auctions, the AI's deal from the same seat, and where the player's cards
 *  were not the AI's. */
export type AskReview = () => Promise<DealReview | { error: string }>

/** A deal of one of today's tournaments, reviewed through /api/daily. */
export const dailyAsk = (deal: number, size?: DailySize): AskReview => () => dailyReview(deal, size)

/** What this page already fetched, so reopening a deal does not ask again. */
const reviews = new Map<string, DealReview>()

/**
 * A finished deal against the AI (SKATGO-145, the human: 「先显示叫牌和ai的不同，再显示打的和ai最不同（打的最不好的一个
 * trick），其他不显示」): the bidding, the player's over the AI's from the same seat, then the one trick where the
 * player's card fell furthest below the AI's choice. Every word of it is SkatZero's choice and the rules engine's
 * record; no model explains it (the human: 「解读太麻烦了」). The review is asked once.
 *
 * `after`: under a deal's own result in the after-deal dialog (SKATGO-166, 「信息不重复」), which already says the player's
 * game, score and skat: the AI's side only — its score from the player's seat and what it did otherwise — the trick
 * under its own title, and the record without the skat.
 */
export function VsAiReview({ ask, cacheKey, names, after = false }: { ask: AskReview; cacheKey?: string; names?: string[]; after?: boolean }) {
  const [review, setReview] = useState<DealReview | null>(cacheKey ? (reviews.get(cacheKey) ?? null) : null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (review) return
    void ask().then((r) => {
      if ('error' in r) return setFailed(true)
      if (cacheKey) reviews.set(cacheKey, r)
      setReview(r)
    })
    // Once, when the review is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!review) {
    return (
      <p role={failed ? 'alert' : undefined} data-testid="vs-ai-review" data-state={failed ? 'failed' : 'loading'} {...stylex.props(typography.appText, styles.muted, styles.sheetNote)}>
        {failed ? m.daily_review_failed() : m.loading()}
      </p>
    )
  }
  return (
    <div data-testid="vs-ai-review" data-state="ready" {...stylex.props(styles.analysis, after && styles.ruled)}>
      {after ? <AiSeat review={review} names={names ?? youNames()} /> : <BidCompare review={review} names={names ?? youNames()} />}
      {review.mine.declarer === null ? null : <WorstTrick review={review} names={names ?? youNames()} heading={!after} />}
      {review.mine.declarer === null ? null : <PlayRecord review={review} names={names ?? youNames()} skat={!after} />}
    </div>
  )
}

/**
 * Every trick against the AI, last and folded (SKATGO-153, after a player's word in the forum: "Now I am not seeing the AI
 * difference for each Stich … These were excellent learning tools!"; the human: 「放到最下面一个明显的折叠卡片里，点了后就跟删掉的
 * 内容一样」): opened, the play record SKATGO-145 had removed, as it was.
 */
function PlayRecord({ review, names, skat }: { review: DealReview; names: string[]; skat: boolean }) {
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <details data-testid="vs-ai-play-record" open={open} onToggle={(e) => setOpen(e.currentTarget.open)} {...stylex.props(styles.recordCard)}>
      <summary data-testid="vs-ai-play-record-head" {...stylex.props(typography.appBtnStrong, styles.recordHead)}>
        <span>{m.review_play_record()}</span>
        <Chevron aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
      </summary>
      {open ? <TrickReplay tricks={review.tricks} names={names} skat={skat ? review.skat : undefined} hand={review.hand} differs={review.differs} early={review.early} /> : null}
    </details>
  )
}

/**
 * A deal replayed trick by trick (SKATGO-79, the human: 「10墩，每墩谁出了什么（有时序）然后谁赢了，一个10行的
 * 表格」): each trick's three cards in the order they were played, each under its player's name, and who
 * took it with how many card points; under each trick, the player's hand as it was before it (「每trick都要
 * 显示打这个trick前我手里的牌」). The player's own cards are bold. `differs` puts the AI's card under the
 * player's wherever it would have played another — card first, so the column stays cards (the human:
 * 「AI和AI打的牌，换个位置，这样纵向就都是牌了」) — and marks the trick of the furthest. Tricks a claim or a
 * concession left unplayed are not rows, only a line under them. Back since SKATGO-153, in `PlayRecord`.
 */
export function TrickReplay({ tricks, names, skat, hand, differs = null, early = null }: { tricks: Game['tricks']; names: string[]; skat?: Card[]; hand?: Card[]; differs?: Differ[] | null; early?: Game['early'] | null }) {
  const played = early ? tricks.slice(0, early.from) : tricks
  const worst = differs?.[0]?.trick ?? null
  const ai = new Map((differs ?? []).map((d) => [d.trick, d.best]))
  // What the player held before a trick: the hand they began with, less the cards of the tricks before.
  const before = (i: number) => (hand ?? []).filter((c) => !tricks.slice(0, i).some((t) => t.cards.some((p) => p.seat === PLAYER && sameCard(p.card, c))))
  // That hand is shown for one trick at a time, the one tapped; a tap anywhere else folds it away (SKATGO-100, the
  // human: 「只有用户点击那一行时，才显示出来，而且点击别处就折叠回去，只能显示一个」). No icon says so.
  const [shown, setShown] = useState<number | null>(null)
  const rows = useRef<HTMLTableElement>(null)
  useEffect(() => {
    if (shown === null) return
    const away = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.('[data-trick]') || !rows.current?.contains(e.target as Node)) setShown(null)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [shown])
  return (
    <div {...stylex.props(styles.replay)}>
      <table ref={rows} data-testid="daily-replay" data-tricks={played.length} {...stylex.props(styles.replayTable)}>
        <thead>
          <tr>
            <th scope="col" {...stylex.props(typography.smallBold, styles.replayHead)}>{m.daily_replay_trick()}</th>
            {[1, 2, 3].map((n) => <th key={n} scope="col" {...stylex.props(typography.smallBold, styles.replayHead)}>{n}.</th>)}
            <th scope="col" {...stylex.props(typography.smallBold, styles.replayHead, styles.end)}>{m.daily_replay_winner()}</th>
          </tr>
        </thead>
        {played.map((t, i) => {
          const n = i + 1
          const marked = worst === n
          const best = ai.get(n)
          const held = before(i)
          return (
            <tbody
              key={i}
              data-trick={n}
              data-highlight={marked ? 'true' : undefined}
              aria-expanded={held.length ? shown === n : undefined}
              onClick={held.length ? () => setShown((x) => (x === n ? null : n)) : undefined}
              {...stylex.props(styles.replayRow, marked && styles.replayMarked, held.length > 0 && styles.replayTap)}
            >
              <tr data-winner={t.winner}>
                <td {...stylex.props(typography.appText, styles.muted, styles.replayCell)}>{n}</td>
                {t.cards.map((p, k) => (
                  <td key={k} data-seat={p.seat} {...stylex.props(styles.replayCell)}>
                    <span {...stylex.props(typography.smallBold, styles.muted, styles.replayName)}>{names[p.seat]}</span>
                    <span {...stylex.props(p.seat === PLAYER ? typography.appBtnStrong : typography.appText, styles.replayCard)}><Rich text={cardLabel(p.card)} /></span>
                    {p.seat === PLAYER && best ? (
                      <span data-testid="daily-replay-ai" data-card={`${best.suit}${best.rank}`} {...stylex.props(typography.appText, styles.replayAi)}>
                        <Rich text={cardLabel(best)} />
                        <Who side="ai" />
                      </span>
                    ) : null}
                  </td>
                ))}
                <td {...stylex.props(typography.appText, styles.replayCell, styles.end)}>{m.daily_replay_points({ name: names[t.winner], points: pointsOf(t.cards.map((p) => p.card)) })}</td>
              </tr>
              {held.length && shown === n ? (
                <tr>
                  <td />
                  <td colSpan={t.cards.length + 1} data-testid="daily-replay-hand" data-cards={held.length} {...stylex.props(typography.appText, styles.replayHand)}>
                    <span {...stylex.props(styles.muted)}>{m.daily_replay_hand()}</span> <Rich text={held.map(cardLabel).join(' ')} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          )
        })}
      </table>
      {early ? <p {...stylex.props(typography.appText, styles.muted, styles.sheetNote)}>{m.daily_replay_rest({ n: 10 - early.from })}</p> : null}
      {skat?.length ? (
        <p {...stylex.props(typography.appText, styles.sheetNote)}>
          <span {...stylex.props(styles.muted)}>{m.result_skat()}</span> <Rich text={skat.map(cardLabel).join(' ')} />
        </p>
      ) : null}
    </div>
  )
}

/** What a seat said in the auction, and the game it then played. */
function bidSaid(d: DealSummary, said: SeatBid): string {
  if (d.declarer === PLAYER && d.declaration) return m.review_bid_played({ bid: d.bid, game: gameName(d) })
  return said.value > 0 ? m.review_bid_passed_after({ value: said.value }) : m.review_bid_passed()
}

/** How the deal ended for that seat: the player's own game's outcome, or who played what and how it went. */
function bidOutcome(d: DealSummary, names: string[]): string {
  if (d.declarer === PLAYER && d.declaration) return playedParts(d, '').slice(1).join(' · ')
  return gameLine(d, names)
}

type BidRow = { who: Side | 'both'; said: string; outcome: string; score: number }

/** The bidding, the player's line over the AI's; one line when the two read the same. */
function BidCompare({ review, names }: { review: DealReview; names: string[] }) {
  const you: BidRow = { who: 'you', said: bidSaid(review.mine, review.auction[PLAYER]), outcome: bidOutcome(review.mine, names), score: review.mine.scores[PLAYER] }
  const ai: BidRow | null = review.ai && review.aiAuction
    ? { who: 'ai', said: bidSaid(review.ai, review.aiAuction[PLAYER]), outcome: bidOutcome(review.ai, aiNames()), score: review.ai.scores[PLAYER] }
    : null
  const same = ai && ai.said === you.said && ai.outcome === you.outcome && ai.score === you.score
  const rows = same ? [{ ...you, who: 'both' as const }] : ai ? [you, ai] : [you]
  return (
    <section data-testid="vs-ai-bid" data-rows={rows.length} {...stylex.props(styles.block)}>
      <h3 {...stylex.props(typography.appBtnStrong, styles.blockTitle)}>{m.review_bid_title()}</h3>
      <div {...stylex.props(styles.bidRows)}>
      {rows.map((r) => (
        <div key={r.who} data-who={r.who} data-score={r.score} {...stylex.props(styles.bidRow)}>
          <span {...stylex.props(styles.bidTags)}>
            {r.who === 'ai' ? null : <Who side="you" />}
            {r.who === 'you' ? null : <Who side="ai" />}
          </span>
          <span {...stylex.props(styles.bidText)}>
            <span {...stylex.props(typography.appBtnStrong, styles.ink)}><Rich text={r.said} /></span>
            <span {...stylex.props(typography.appText, styles.muted)}><Rich text={r.outcome} /></span>
          </span>
          <span {...stylex.props(typography.appBtnStrong, styles.ink)}>{signed(r.score)}</span>
        </div>
      ))}
      </div>
    </section>
  )
}

/**
 * The AI in the player's seat, under a deal's result (SKATGO-166): "If the AI had played your cards", then its deal told as
 * the result tells the player's (the human: 「你那个+86是什么意思？然后70 50什么意思，然后为啥不写ai打的时候，最后每个人得几分呢」) — the
 * bidding where the AI's differed from the player's, who won or lost which game and why, and each seat's score in a table
 * of the result's own columns, the AI in the player's. Nothing on a day dealt before the AI played it.
 */
function AiSeat({ review, names }: { review: DealReview; names: string[] }) {
  const ai = review.ai
  if (!ai || !review.aiAuction) return null
  const seats = [m.daily_ai(), names[1], names[2]]
  // What each said, the game left to the line under it.
  const said = (d: DealSummary, s: SeatBid) => (d.declarer === PLAYER ? m.review_bid_you_bid({ bid: d.bid }) : bidSaid(d, s))
  const mine = said(review.mine, review.auction[PLAYER])
  const its = said(ai, review.aiAuction[PLAYER])
  const rows: { who: Side; text: string }[] = mine === its ? [] : [{ who: 'you', text: mine }, { who: 'ai', text: its }]
  return (
    <section data-testid="vs-ai-bid" data-rows={rows.length} {...stylex.props(styles.block)}>
      <h3 {...stylex.props(typography.appBtnStrong, styles.blockTitle)}>{m.review_ai_seat()}</h3>
      {rows.map((r) => (
        <p key={r.who} data-who={r.who} {...stylex.props(styles.aiRow, styles.sheetNote)}>
          <Who side={r.who} />
          <span {...stylex.props(typography.appText, styles.ink)}><Rich text={r.text} /></span>
        </p>
      ))}
      <p data-testid="vs-ai-deal" {...stylex.props(typography.appText, styles.ink, styles.sheetNote)}><Rich text={dealLine(ai, seats)} /></p>
      <ScoreTable testId="vs-ai-scores" names={seats} deal={ai.scores} totals={null} />
    </section>
  )
}

/** A deal in one line, as a result's title and reason say it (SKATGO-166): who won or lost which game, the card points or
 *  how a Null went, and what made it big or lost it — or that all passed. */
function dealLine(d: DealSummary, names: string[]): string {
  if (d.declarer === null || !d.declaration) return m.result_head_passed()
  const game = gameName(d)
  const head = d.won ? m.result_head_won({ name: names[d.declarer], game }) : m.result_head_lost({ name: names[d.declarer], game })
  const x = d.detail
  const why =
    d.declaration.contract.kind === 'null'
      ? [d.won ? m.result_reason_null_won() : m.result_reason_null_lost()]
      : x
        ? [m.result_reason_points({ declarer: x.declarerPoints, defenders: x.defenderPoints }), x.schwarz ? 'Schwarz' : x.schneider ? 'Schneider' : null, x.overbid ? m.daily_overbid() : null]
        : []
  return [head, ...why].filter(Boolean).join(' · ')
}

/** Each seat's score of a deal and the running totals (SKATGO-166), in the board's order — the left seat, the player, the
 *  right one — under the names; the deal's row bold. The totals only where they say something the deal's row does not: not
 *  where the table plays one game, and not while they are the deal's own scores, as after a room's first deal. */
export function ScoreTable({ names, deal, totals: all, testId = 'skat-result-scores' }: { names: string[]; deal: readonly [number, number, number]; totals: readonly [number, number, number] | null; testId?: string }) {
  const order = [1, PLAYER, 2] as const
  const totals = all && all.some((v, seat) => v !== deal[seat]) ? all : null
  return (
    <table data-testid={testId} data-deal={deal.join(',')} data-totals={totals ? totals.join(',') : undefined} {...stylex.props(styles.dealTable)}>
      <thead {...stylex.props(styles.dealRows)}>
        <tr {...stylex.props(styles.dealRows)}>
          <td />
          {order.map((seat) => (
            <th key={seat} scope="col" data-seat={seat} {...stylex.props(typography.appText, styles.muted, styles.dealName)}>{names[seat]}</th>
          ))}
        </tr>
      </thead>
      <tbody {...stylex.props(styles.dealRows)}>
        <tr data-row="deal" {...stylex.props(styles.dealRows)}>
          <th scope="row" {...stylex.props(typography.appText, styles.muted, styles.dealLabel, styles.dealRule)}>{m.result_col_deal()}</th>
          {order.map((seat) => (
            <td key={seat} data-seat={seat} {...stylex.props(typography.appBtnStrong, styles.ink, styles.dealCell, styles.dealRule)}>{signed(deal[seat])}</td>
          ))}
        </tr>
        {totals ? (
          <tr data-row="total" {...stylex.props(styles.dealRows)}>
            <th scope="row" {...stylex.props(typography.appText, styles.muted, styles.dealLabel)}>{m.result_col_total()}</th>
            {order.map((seat) => (
              <td key={seat} data-seat={seat} {...stylex.props(typography.appText, styles.ink, styles.dealCell)}>{signed(totals[seat])}</td>
            ))}
          </tr>
        ) : null}
      </tbody>
    </table>
  )
}

/**
 * The trick most worth improving (SKATGO-145): which card the AI would have played, the cards already on the table,
 * the player's hand as it was — their card outlined navy, the AI's blue, each tagged — and who took the trick. A deal
 * where every card was the AI's choice says so in one line.
 */
function WorstTrick({ review, names, heading = true }: { review: DealReview; names: string[]; heading?: boolean }) {
  const w = review.differs[0]
  const t = w ? review.tricks[w.trick - 1] : undefined
  if (!w || !t) {
    return (
      <p data-testid="vs-ai-clean" {...stylex.props(typography.appText, styles.ink, styles.sheetNote)}>{m.daily_review_clean()}</p>
    )
  }
  const mine = t.cards.findIndex((p) => p.seat === PLAYER)
  const before = t.cards.slice(0, mine)
  // The hand before the trick: the cards the player began with, less those of the tricks before.
  const earlier = review.tricks.slice(0, w.trick - 1).flatMap((x) => x.cards.filter((p) => p.seat === PLAYER).map((p) => p.card))
  const held = review.hand.filter((c) => !earlier.some((e) => sameCard(e, c)))
  const mark = (c: Card): Side | null => (sameCard(c, w.played) ? 'you' : sameCard(c, w.best) ? 'ai' : null)
  return (
    <section data-testid="vs-ai-trick" data-trick={w.trick} data-played={`${w.played.suit}${w.played.rank}`} data-best={`${w.best.suit}${w.best.rank}`} {...stylex.props(styles.block, styles.ruled)}>
      {heading ? <h3 {...stylex.props(typography.appBtnStrong, styles.blockTitle)}>{m.review_trick_heading()}</h3> : null}
      <p {...stylex.props(typography.appBtnStrong, styles.ink, styles.sheetNote)}>
        <Rich text={m.review_trick_title({ trick: w.trick, best: cardLabel(w.best) })} />
      </p>
      <div {...stylex.props(styles.trickGrid)}>
        <span {...stylex.props(typography.appText, styles.muted, styles.trickLabel, !before.length && styles.trickLabelText)}>{m.review_trick_table()}</span>
        {before.length ? (
          <span data-testid="vs-ai-trick-table" data-cards={before.length} {...stylex.props(styles.cards)}>
            {before.map((p) => <PlayingCard key={`${p.card.suit}${p.card.rank}`} card={p.card} size="xs" />)}
          </span>
        ) : (
          <span data-testid="vs-ai-trick-table" data-cards={0} {...stylex.props(typography.appText, styles.ink)}>{m.review_trick_lead()}</span>
        )}
        <span {...stylex.props(typography.appText, styles.muted, styles.trickLabel)}>{m.review_trick_hand()}</span>
        <span data-testid="vs-ai-trick-hand" data-cards={held.length} {...stylex.props(styles.cards)}>
          {held.map((c) => {
            const side = mark(c)
            return (
              <span key={`${c.suit}${c.rank}`} data-mark={side ?? undefined} {...stylex.props(styles.handCard)}>
                <span {...stylex.props(styles.cardFrame, side === 'you' && styles.frameYou, side === 'ai' && styles.frameAi)}>
                  <PlayingCard card={c} size="xs" />
                </span>
                {side ? <Who side={side} /> : null}
              </span>
            )
          })}
        </span>
      </div>
      <p {...stylex.props(typography.appText, styles.muted, styles.sheetNote)}>
        {m.review_trick_taken({ name: names[t.winner], points: pointsOf(t.cards.map((p) => p.card)) })}
      </p>
    </section>
  )
}

/**
 * The day's deals on /daily while the day runs (SKATGO-63): every one of them, so a visitor sees at a
 * glance how many there are — the finished ones against the AI, the rest by number only. Without a
 * status (on the server, and while it loads) every deal is still to play.
 */
export function DayDeals({ of, status }: { of: number; status?: DailyStatus }) {
  return (
    <Panel>
      <section data-testid="daily-so-far" {...stylex.props(styles.day)}>
        <h2 {...stylex.props(typography.panelLabel, styles.dayTitle)}>{m.daily_play_title()}</h2>
        <VsAiTable
          deals={status?.deals ?? []}
          benchmarks={status?.benchmarks}
          of={of}
          current={status?.started ? status.deal : null}
          review={status ? (i) => ({ ask: dailyAsk(i), cacheKey: `${status.day}|6|${i}` }) : undefined}
          openLatest
        />
      </section>
    </Panel>
  )
}

/** The running comparison on /daily: one foldable row per finished deal, the player's Seeger-Fabian score
 *  against the AI's in their seat (SKATGO-81), opening to that deal's bidding and the trick most worth improving
 *  (SKATGO-145); under the rows the score sheet
 *  of the whole tournament so far. `openLatest` opens the newest row, on the day's page while it runs.
 *  `of` (SKATGO-63): the day's number of deals; those not finished follow as rows of their number and
 *  whether they are `current` or still to play — nothing of their cards, which every player shares.
 *  `review`: how a finished deal's review is had, when it can be; a row without one does not open. */
export function VsAiTable({ deals, benchmarks, openLatest = false, of, current = null, review }: { deals: DealSummary[]; benchmarks?: (DealSummary | null)[]; openLatest?: boolean; of?: number; current?: number | null; review?: (deal: number) => { ask: AskReview; cacheKey?: string } | null }) {
  const latest = deals.length - 1
  const [open, setOpen] = useState<number[]>(openLatest ? [latest] : [])
  useEffect(() => {
    if (openLatest) setOpen([latest])
  }, [openLatest, latest])
  if (deals.length === 0 && !of) return null
  const ahead = Array.from({ length: Math.max(0, (of ?? 0) - deals.length) }, (_, k) => deals.length + k)
  const ai = deals.map((_, i) => benchmarks?.[i] ?? null)
  const aiTotals = ai.every((b) => b) ? totals(ai as DealSummary[]) : null
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((j) => j !== i) : [...o, i]))
  return (
    <div data-testid="daily-vs-ai" data-rows={deals.length} data-of={of ?? deals.length} {...stylex.props(styles.table)}>
      <div aria-hidden="true" {...stylex.props(styles.grid, styles.head)}>
        <span {...stylex.props(typography.small)}>{m.daily_col_deal()}</span>
        <span {...stylex.props(styles.headWho)}><Who side="you" /><span {...stylex.props(typography.micro)}>{m.daily_points()}</span></span>
        <span {...stylex.props(styles.headWho)}><Who side="ai" /><span {...stylex.props(typography.micro)}>{m.daily_points()}</span></span>
        <span />
      </div>
      <ol {...stylex.props(styles.list)}>
        {deals.map((d, i) => {
          const b = ai[i]
          const isOpen = open.includes(i)
          const id = `daily-deal-${i}`
          const reviewed = review?.(i) ?? null
          // The row's four columns; a foldable row's last one carries its chevron.
          const cells = (chevron: ReactNode) => (
            <>
              <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
              <Score score={d.scores[PLAYER]} role={roleOf(d)} />
              {b ? <Score score={b.scores[PLAYER]} role={roleOf(b)} /> : <span {...stylex.props(typography.small, styles.muted)}>–</span>}
              <span {...stylex.props(styles.chevron)}>{chevron}</span>
            </>
          )
          return (
            <li key={i} data-testid="daily-vs-ai-row" data-you={d.scores[PLAYER]} data-ai={b ? b.scores[PLAYER] : ''} {...stylex.props(styles.item)}>
              {reviewed ? (
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                aria-label={m.daily_show_deal({ n: i + 1 })}
                data-testid="daily-vs-ai-toggle"
                onClick={() => toggle(i)}
                {...stylex.props(styles.grid, styles.row)}
              >
                {cells(isOpen ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />)}
              </button>
              ) : (
                <div {...stylex.props(styles.grid, styles.flatRow)}>{cells(null)}</div>
              )}
              {reviewed && isOpen ? (
                <div id={id} data-testid="daily-vs-ai-detail" {...stylex.props(styles.detail)}>
                  <VsAiReview ask={reviewed.ask} cacheKey={reviewed.cacheKey} />
                </div>
              ) : null}
            </li>
          )
        })}
        {ahead.map((i) => (
          <li key={i} data-testid="daily-vs-ai-ahead" data-state={i === current ? 'current' : 'open'} {...stylex.props(styles.item)}>
            <div {...stylex.props(styles.grid, styles.flatRow)}>
              <span {...stylex.props(typography.small, styles.muted)}>{i + 1}</span>
              <span {...stylex.props(typography.small, styles.muted)}>{i === current ? m.daily_deal_current() : m.daily_deal_open()}</span>
              <span {...stylex.props(typography.small, styles.muted)}>–</span>
              <span />
            </div>
          </li>
        ))}
      </ol>
      {deals.length === 0 ? null : (
        <div data-testid="daily-vs-ai-total" data-you={totals(deals)[PLAYER]} data-ai={aiTotals ? aiTotals[PLAYER] : ''} {...stylex.props(styles.total)}>
          <span {...stylex.props(typography.smallBold)}>{m.daily_total()}</span>
          <ScoreSheet testId="daily-total-scores" mine={totals(deals)} ai={aiTotals} />
        </div>
      )}
    </div>
  )
}

function Score({ score, role }: { score: number; role: string }) {
  return (
    <span {...stylex.props(styles.cell)}>
      <span {...stylex.props(typography.appBtnStrong)}>{signed(score)}</span>
      <span {...stylex.props(typography.micro, styles.muted, styles.role)}>{role}</span>
    </span>
  )
}

const styles = stylex.create({
  day: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  dayTitle: { margin: 0, color: color.navy },
  deal: { display: 'flex', flexDirection: 'column', gap: space.x12, color: color.navy },
  // All three seats, the player's deal over the AI's.
  scores: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  scoreHead: { paddingBottom: space.x4, textAlign: 'center', color: color.slate },
  scoreLabel: { paddingInlineEnd: space.x8, textAlign: 'start', color: color.slate, whiteSpace: 'nowrap' },
  scoreCell: { paddingBlock: space.x4, textAlign: 'center' },
  // The player's seat is the one the comparison is about.
  own: { backgroundColor: color.page },
  sheetNote: { margin: 0 },
  // The folded play record (SKATGO-153): a plain bordered card, its title and chevron the line to tap.
  recordCard: { display: 'flex', flexDirection: 'column', gap: space.x10, padding: space.x12, borderWidth: border.hair, borderStyle: 'solid', borderColor: color.hairline, borderRadius: radii.panel },
  recordHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.x12,
    cursor: 'pointer',
    listStyleType: 'none',
    color: color.navy,
    '::-webkit-details-marker': { display: 'none' },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  replay: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  replayTable: { width: '100%', borderCollapse: 'collapse', color: color.navy },
  replayHead: { paddingBottom: space.x4, textAlign: 'start', color: color.slate },
  replayRow: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  // The trick of the move most worth improving, on the app's pink (the human: 「那一行标红背景，就是本app常用
  // 那种粉红的背景」).
  replayMarked: { backgroundColor: color.badSoft },
  replayTap: { cursor: 'pointer' },
  replayCell: { paddingBlock: space.x4, paddingInlineEnd: space.x6, verticalAlign: 'top' },
  replayName: { display: 'block' },
  replayCard: { display: 'block', color: color.navy },
  // The AI's card under the player's, its tag after it.
  replayAi: { display: 'flex', alignItems: 'center', gap: space.x4, marginTop: space.x2, color: color.navy, whiteSpace: 'nowrap' },
  // The hand before the trick, quiet under its row.
  replayHand: { paddingBottom: space.x6, color: color.navy, overflowWrap: 'anywhere' },
  // What the deal was, under its row: quiet, one line, never wider than the sheet.
  gameLine: { paddingBottom: space.x6, color: color.slate, overflowWrap: 'anywhere' },
  analysis: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  // A block of the review: its heading, then its rows. The trick's sits under a fine rule; the bidding's follows
  // the result card, whose edge already divides them.
  block: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  ruled: { paddingTop: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  blockTitle: { margin: 0, color: color.navy },
  ink: { color: color.navy },
  // The AI's side under a deal's result (SKATGO-166): a row a difference in the bidding.
  aiRow: { display: 'flex', alignItems: 'baseline', gap: space.x8 },
  // A deal's score table (SKATGO-166): a grid, so the row names take their own width and the seats share the rest; its
  // rows are only the grid's cells. A name too long for its column wraps rather than losing its end (「Lina (AI)」).
  dealTable: { display: 'grid', gridTemplateColumns: dims.scoreColumns, width: '100%' },
  dealRows: { display: 'contents' },
  dealName: { paddingBottom: space.x4, paddingInlineStart: space.x8, textAlign: 'end', alignSelf: 'end', overflowWrap: 'anywhere' },
  dealLabel: { paddingBlock: space.x4, textAlign: 'start', whiteSpace: 'nowrap' },
  dealCell: { paddingBlock: space.x4, paddingInlineStart: space.x8, textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  dealRule: { borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  // A side's bidding: its tag, what it said over how it went, and its score at the end.
  // Tags, words and score in three columns shared by both rows, so the two lines start under each other; each row's
  // tag and score on the baseline of its first line, however its words wrap (SKATGO-148, the human: 「you 和AI的两个结果的
  // 行都没对齐，错位了」). Where both sides bid alike, their two tags stand side by side.
  bidRows: { display: 'grid', gridTemplateColumns: 'max-content auto max-content', alignItems: 'baseline', columnGap: space.x8, rowGap: space.x8 },
  bidRow: { display: 'contents' },
  bidTags: { display: 'flex', alignItems: 'baseline', gap: space.x4 },
  bidText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  // Each label at the left of its cards, the cards of both lines starting under each other, so the trick stays on
  // one phone screen with the rest (SKATGO-145).
  trickGrid: { display: 'grid', gridTemplateColumns: 'max-content auto', alignItems: 'start', columnGap: space.x8, rowGap: space.x6 },
  trickLabel: { paddingTop: space.x4 },
  // Beside words instead of cards ("You led"), a label shares their line (SKATGO-148: 「you led也没对齐左边的 on the table」).
  trickLabelText: { paddingTop: 0 },
  // Three equal cells.
  // Cards in a row, wide enough apart that two ringed cards never touch; a hand too long for a phone's line goes
  // on in a second.
  cards: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: space.x8 },
  handCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: space.x4 },
  // The player's card and the AI's, each ringed in its side's colour.
  cardFrame: { display: 'flex', borderRadius: radii.cardXs, outlineWidth: border.focusSm, outlineStyle: 'none' },
  frameYou: { outlineStyle: 'solid', outlineColor: color.navy },
  frameAi: { outlineStyle: 'solid', outlineColor: color.info },
  whoTag: { display: 'inline-block', paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill, color: color.onColor },
  whoYou: { backgroundColor: color.navy },
  whoAi: { backgroundColor: color.info },
  table: { display: 'flex', flexDirection: 'column', color: color.navy },
  // Deal, you, the AI, the difference: the same columns in the header, every row and the total.
  grid: {
    display: 'grid',
    gridTemplateColumns: dims.vsAiColumns,
    alignItems: 'center',
    columnGap: { default: space.x12, [bp.phone]: space.x8 },
    paddingInline: space.x8,
  },
  head: { paddingBottom: space.x6, color: color.slate },
  list: { margin: 0, padding: 0, listStyleType: 'none' },
  item: {
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  row: {
    width: '100%',
    paddingBlock: space.x8,
    borderWidth: 0,
    borderRadius: radii.column,
    backgroundColor: { default: 'transparent', ':hover': color.page },
    color: color.navy,
    textAlign: 'start',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: { default: timing.tile, [bp.reducedMotion]: timing.instant },
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
  },
  flatRow: { paddingBlock: space.x8 },
  cell: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  // A narrow column (the table inside the settlement on a phone) shortens the role, never overlaps it.
  role: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  // On a phone a column is too narrow for the tag and its word side by side: the word goes under it (SKATGO-119).
  headWho: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: space.x6, rowGap: space.x2, minWidth: 0 },
  end: { textAlign: 'end' },
  muted: { color: color.slate },
  detail: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    marginBottom: space.x8,
    padding: space.x10,
    borderRadius: radii.column,
    backgroundColor: color.page,
  },
  total: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x6,
    paddingTop: space.x8,
    borderTopWidth: border.tile,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
})
