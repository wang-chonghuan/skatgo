import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { dailyReview } from '~/lib/daily-api'
import { type Card, type Contract, pointsOf, sameCard } from '~/lib/skat/cards'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import { type DailySize, type DailyStatus, type DealReview, type DealSummary, PLAYER, type SeatBid, totals } from '~/lib/skat/tournament'
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
function gameName(d: DealSummary): string {
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

type Tint = 'C' | 'S' | 'H' | 'D' | 'grand' | 'null'
const tintOf = (c: Contract): Tint => (c.kind === 'suit' ? c.trump : c.kind)

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
 */
export function VsAiReview({ ask, cacheKey, names }: { ask: AskReview; cacheKey?: string; names?: string[] }) {
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
    <div data-testid="vs-ai-review" data-state="ready" {...stylex.props(styles.analysis)}>
      <BidCompare review={review} names={names ?? youNames()} />
      {review.mine.declarer === null ? null : <WorstTrick review={review} names={names ?? youNames()} />}
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

/** Whose game a deal was and which (SKATGO-145, the human: 「本trick谁当庄家，什么合约，最好更明显一点」, then 「这个合约应该放
 *  在this game is lost的下方」): the game in its contract's tint, as on the table's contract tiles, and the declarer. */
export function GameTag({ deal, names }: { deal: DealSummary; names: string[] }) {
  if (!deal.declaration || deal.declarer === null) return null
  return (
    <p data-testid="result-game" {...stylex.props(styles.sheetNote, styles.trickGame)}>
      <span {...stylex.props(typography.appBtnStrong, styles.contractChip, contractTint[tintOf(deal.declaration.contract)])}><Rich text={gameName(deal)} /></span>
      <span {...stylex.props(typography.appText, styles.ink)}>{m.review_trick_declarer({ name: names[deal.declarer] })}</span>
    </p>
  )
}

/** The deal's Seeger-Fabian score of each of the three at the table (SKATGO-146, the human: 「contract下面要显示本轮每个人
 *  得几分，这个是重点」): name over score, the player's cell named "You" and nothing more (「You这个不用加白色的框」). */
export function SeatScores({ scores, names }: { scores: readonly [number, number, number]; names: string[] }) {
  return (
    <div data-testid="result-seats" data-scores={scores.join(',')} {...stylex.props(styles.seats)}>
      {scores.map((v, seat) => (
        <div key={seat} data-seat={seat} data-own={seat === PLAYER ? 'true' : undefined} {...stylex.props(styles.seat)}>
          <span {...stylex.props(typography.appText, styles.muted)}>{names[seat]}</span>
          <span {...stylex.props(typography.appBtnStrong, styles.ink)}>{signed(v)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * The trick most worth improving (SKATGO-145): which card the AI would have played, the cards already on the table,
 * the player's hand as it was — their card outlined navy, the AI's blue, each tagged — and who took the trick. A deal
 * where every card was the AI's choice says so in one line.
 */
function WorstTrick({ review, names }: { review: DealReview; names: string[] }) {
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
      <h3 {...stylex.props(typography.appBtnStrong, styles.blockTitle)}>{m.review_trick_heading()}</h3>
      <p {...stylex.props(typography.appBtnStrong, styles.ink, styles.sheetNote)}>
        <Rich text={m.review_trick_title({ trick: w.trick, best: cardLabel(w.best) })} />
      </p>
      <div {...stylex.props(styles.trickGrid)}>
        <span {...stylex.props(typography.appText, styles.muted, styles.trickLabel)}>{m.review_trick_table()}</span>
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
  // What the deal was, under its row: quiet, one line, never wider than the sheet.
  gameLine: { paddingBottom: space.x6, color: color.slate, overflowWrap: 'anywhere' },
  analysis: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  // A block of the review: its heading, then its rows. The trick's sits under a fine rule; the bidding's follows
  // the result card, whose edge already divides them.
  block: { display: 'flex', flexDirection: 'column', gap: space.x6 },
  ruled: { paddingTop: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  blockTitle: { margin: 0, color: color.navy },
  ink: { color: color.navy },
  // A side's bidding: its tag, what it said over how it went, and its score at the end.
  // Tags, words and score in three columns shared by both rows, so the two lines start under each other.
  bidRows: { display: 'grid', gridTemplateColumns: 'max-content auto max-content', alignItems: 'center', columnGap: space.x8, rowGap: space.x6 },
  bidRow: { display: 'contents' },
  bidTags: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: space.x2 },
  bidText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  // Each label at the left of its cards, the cards of both lines starting under each other, so the trick stays on
  // one phone screen with the rest (SKATGO-145).
  trickGrid: { display: 'grid', gridTemplateColumns: 'max-content auto', alignItems: 'start', columnGap: space.x8, rowGap: space.x6 },
  trickLabel: { paddingTop: space.x4 },
  // Three equal cells.
  seats: { display: 'flex', gap: space.x6 },
  seat: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, flexBasis: 0, paddingBlock: space.x4 },
  trickGame: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.x8 },
  contractChip: { paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill, color: color.navy },
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

// One tint per contract, as on the table's contract tiles.
const contractTint = stylex.create({
  C: { backgroundColor: color.tintClubs },
  S: { backgroundColor: color.tintSpades },
  H: { backgroundColor: color.tintHearts },
  D: { backgroundColor: color.tintDiamonds },
  grand: { backgroundColor: color.tintGrand },
  null: { backgroundColor: color.tintNull },
})
