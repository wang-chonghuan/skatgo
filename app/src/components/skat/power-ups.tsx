import * as stylex from '@stylexjs/stylex'
import { ArrowDownToLine, ListChecks, Percent } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import type { FreeError, FreeOdds, FreePutAway } from '~/lib/free-api'
import { type Card, type Contract, SUITS, cardId, effectiveSuit, fullDeck, sameCard, sortHand } from '~/lib/skat/cards'
import { type Game, type Seat, runningPoints } from '~/lib/skat/game'
import { cardLabel, contractName, matadorLabel } from '~/lib/skat/i18n'
import { NULL_VALUES, baseValue, matadors, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { PlayingCard } from './playing-card'
import { Modal, Pill, Rich } from './ui'

// Free play's power-ups (SKATGO-177, the human: 「先把记牌器，叫牌胜率，该扣那两张，做成三个道具，放在灯泡打开的页面里，设计要美观。
// 先不考虑橡果，这三个道具自由免费在free play里用」): the lightbulb opens them in one dialog, in the order a deal goes — the win
// chances while bidding, the two cards to put away once the skat is picked up, the card counter while the cards are played.
// The one that serves the moment is marked and open; the others say when they serve. The dialog speaks in the result
// dialog's four levels (SKATGO-146): its title, names and numbers `appBtnStrong`, words `appText`, the small bold 13. Each sees only what the player's
// seat may see: the win chances and the put-away are SkatZero's on the server for the player's own cards, the counter is
// counted here from the cards on the table. Nothing says which card to play (the human: 「不要出牌提示，出牌提示让人不思考」).

const ME = 0 as Seat
const GAMES: Contract[] = [...[...SUITS].reverse().map((trump): Contract => ({ kind: 'suit', trump })), { kind: 'grand' }]
const MODE: Record<string, 'C' | 'S' | 'H' | 'D' | 'G'> = { C: 'C', S: 'S', H: 'H', D: 'D', grand: 'G' }

/** One answer per deal and moment, so reopening the dialog asks the server nothing again. */
const kept = new Map<string, unknown>()
function useAsked<T>(key: string | null, ask: (() => Promise<T | FreeError>) | undefined): T | 'loading' | 'failed' | null {
  const [, redraw] = useState(0)
  useEffect(() => {
    if (!key || !ask || kept.has(key)) return
    kept.set(key, 'loading')
    void ask().then((r) => {
      kept.set(key, r && typeof r === 'object' && 'error' in r ? 'failed' : r)
      if (kept.size > 40) kept.delete(kept.keys().next().value!)
      redraw((n) => n + 1)
    })
  }, [key, ask])
  if (!key || !ask) return null
  return (kept.get(key) as T | 'loading' | 'failed' | undefined) ?? 'loading'
}

type Props = {
  game: Game
  nameOf: (seat: Seat) => string
  odds?: () => Promise<FreeOdds | FreeError>
  putAway?: () => Promise<FreePutAway | FreeError>
  onClose: () => void
}

export function PowerUps({ game, nameOf, odds, putAway, onClose }: Props) {
  const ids = (cards: Card[]) => cards.map(cardId).sort().join()
  const bidding = game.phase === 'bidding'
  const picked = game.phase === 'skat' && game.declarer === ME && game.pickedUp
  const playing = (game.phase === 'play' || game.phase === 'trickEnd') && game.declaration !== null
  const oddsNow = useAsked<FreeOdds>(bidding ? `odds|${game.dealer}|${ids(game.hands[ME])}` : null, odds)
  // The declarer's twelve: in hand before putting away, hand and skat after.
  const putKey = `put|${game.dealer}|${ids([...game.hands[ME], ...(game.pickedUp && game.declarer === ME ? game.skat : [])])}|${game.bid}`
  const putNow = useAsked<FreePutAway>(picked ? putKey : null, putAway)
  // Once asked, the put-away's game still serves while the game is chosen.
  const putKept = !picked && game.phase === 'declare' && game.declarer === ME ? (kept.get(putKey) as FreePutAway | undefined) : undefined
  const put = putNow ?? (putKept && typeof putKept === 'object' ? putKept : null)
  return (
    <Modal title={m.powerups_title()} onClose={onClose} testId="skat-power-ups">
      <div {...stylex.props(styles.list)}>
        <Item testId="power-up-odds" tone={styles.toneNavy} icon={<Percent size={icon.inline} strokeWidth={icon.outline} />} name={m.powerup_odds_name()} desc={m.powerup_odds_desc()} when={m.powerup_when_bidding()} now={bidding}>
          <OddsTable game={game} odds={oddsNow} />
        </Item>
        <Item testId="power-up-putaway" tone={styles.toneOrange} icon={<ArrowDownToLine size={icon.inline} strokeWidth={icon.outline} />} name={m.powerup_putaway_name()} desc={m.powerup_putaway_desc()} when={m.powerup_when_pickup()} now={put !== null}>
          <PutAway put={put} />
        </Item>
        <Item testId="power-up-counter" tone={styles.toneGreen} icon={<ListChecks size={icon.inline} strokeWidth={icon.outline} />} name={m.powerup_counter_name()} desc={m.powerup_counter_desc()} when={m.powerup_when_play()} now={playing}>
          {playing ? <Counter game={game} nameOf={nameOf} /> : null}
        </Item>
      </div>
    </Modal>
  )
}

function Item({ testId, tone, icon: glyph, name, desc, when, now, children }: { testId: string; tone: stylex.StyleXStyles; icon: ReactNode; name: string; desc: string; when: string; now: boolean; children: ReactNode }) {
  return (
    <section data-testid={testId} data-now={now} {...stylex.props(styles.item, now && styles.itemNow)}>
      <div {...stylex.props(styles.head)}>
        <span aria-hidden="true" {...stylex.props(styles.icon, tone)}>{glyph}</span>
        <div {...stylex.props(styles.titles)}>
          <h3 {...stylex.props(typography.appBtnStrong, styles.name)}>{name}</h3>
          {/* The one that serves now says what it does; the others, in one row, only when they serve. */}
          {now ? <p {...stylex.props(typography.appText, styles.desc)}>{desc}</p> : <p {...stylex.props(typography.smallBold, styles.when)}>{when}</p>}
        </div>
        {now ? <Pill tone="go">{m.powerup_now()}</Pill> : null}
      </div>
      {now ? <div {...stylex.props(styles.body)}>{children}</div> : null}
    </section>
  )
}

const Waiting = ({ state }: { state: 'loading' | 'failed' }) => (
  <p {...stylex.props(typography.appText, styles.note)}>{state === 'loading' ? m.loading() : m.powerup_failed()}</p>
)

/** The number the player would have to say or hold now: the speaker's next one, the one asked of the listener, 18 alone. */
function bidNow(g: Game): number {
  const b = g.bidding
  if (b.awaiting === 'speaker') return nextBid(b.value) ?? b.value
  return Math.max(18, b.value)
}

/** Each game's value with the ten cards in hand, without and with Hand, and SkatZero's chance to make it at the number on
 *  the table now after picking up — the win chances. Null has its four fixed values and no chance. */
function OddsTable({ game, odds }: { game: Game; odds: FreeOdds | 'loading' | 'failed' | null }) {
  const hand = game.hands[ME]
  const at = bidNow(game)
  const chance = (c: Contract): string => {
    if (!odds || typeof odds !== 'object' || c.kind === 'null') return '—'
    const i = odds.bids.findIndex((b) => b >= at)
    const row = odds.made[MODE[c.kind === 'suit' ? c.trump : 'grand']]
    return i < 0 || !row ? '—' : m.powerup_percent({ n: row[i] })
  }
  const rows = GAMES.map((c) => {
    const t = matadors(hand, c)
    const base = baseValue(c)
    return { key: contractName(c), name: contractName(c), count: `${matadorLabel(t.with, t.count)}: ${t.count + 1} × ${base}`, bid: base * (t.count + 1), hand: base * (t.count + 2), win: chance(c) }
  })
  rows.push(
    { key: 'null', name: 'Null', count: '', bid: NULL_VALUES.plain, hand: NULL_VALUES.hand, win: '—' },
    { key: 'null-ouvert', name: m.rules_null_ouvert(), count: '', bid: NULL_VALUES.ouvert, hand: NULL_VALUES.handOuvert, win: '—' },
  )
  return (
    <>
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th {...stylex.props(typography.smallBold, styles.th)}>{m.bidvalues_game()}</th>
            <th {...stylex.props(typography.smallBold, styles.th, styles.number)}>{m.bidvalues_bid()}</th>
            <th {...stylex.props(typography.smallBold, styles.th, styles.number)}>{m.bidvalues_hand()}</th>
            <th {...stylex.props(typography.smallBold, styles.th, styles.number)}>{m.powerup_win_at({ bid: at })}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} data-testid="power-up-odds-row">
              <td {...stylex.props(styles.td)}>
                <span {...stylex.props(typography.appText, styles.strong, styles.group)}><Rich text={r.name} /></span>
                {r.count ? <span {...stylex.props(typography.meta, styles.sub)}>{r.count}</span> : null}
              </td>
              <td {...stylex.props(typography.appBtnStrong, styles.td, styles.number, styles.strong)}>{r.bid}</td>
              <td {...stylex.props(typography.appText, styles.td, styles.number, styles.soft)}>{r.hand}</td>
              <td data-testid="power-up-odds-win" {...stylex.props(typography.appBtnStrong, styles.td, styles.number, styles.strong)}>{r.win}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {odds === 'loading' || odds === 'failed' ? <Waiting state={odds} /> : null}
      <p {...stylex.props(typography.meta, styles.note)}>{m.powerup_odds_note()}</p>
    </>
  )
}

/** SkatZero's two cards to put away and the game it plays with what is left. */
function PutAway({ put }: { put: FreePutAway | 'loading' | 'failed' | null }) {
  if (put === null) return null
  if (put === 'loading' || put === 'failed') return <Waiting state={put} />
  const d = put.declaration
  const game = d.contract.kind === 'null' && d.ouvert ? m.rules_null_ouvert() : contractName(d.contract)
  return (
    <div {...stylex.props(styles.put)}>
      <div data-testid="power-up-putaway-cards" {...stylex.props(styles.cards)}>
        {put.discard.map((c) => <PlayingCard key={cardId(c)} card={c} size="sm" />)}
      </div>
      <p {...stylex.props(typography.appText, styles.strong)}>
        <Rich text={m.powerup_putaway_then({ game })} />
      </p>
    </div>
  )
}

/** What the player's seat has seen: their hand, every card played, and the skat once it is theirs to know. */
function seenBy(g: Game): Card[] {
  const played = [...g.tricks.flatMap((t) => t.cards.map((p) => p.card)), ...g.trick.map((p) => p.card)]
  const skat = g.declarer === ME && g.pickedUp ? g.skat : []
  return [...g.hands[ME], ...played, ...skat]
}

/** The card counter: the side's points against what it needs, and per trumps and side suit the cards still out — strongest
 *  first — and who has shown they have none (they did not follow it). */
function Counter({ game, nameOf }: { game: Game; nameOf: (seat: Seat) => string }) {
  const contract = game.declaration!.contract
  const seen = seenBy(game)
  const out = sortHand(fullDeck().filter((c) => !seen.some((s) => sameCard(s, c))), contract)
  const groups: ('T' | Card['suit'])[] = contract.kind === 'null' ? [...SUITS] : ['T', ...SUITS.filter((s) => contract.kind !== 'suit' || s !== contract.trump)]
  const voids = new Map<Seat, Set<string>>([[1 as Seat, new Set()], [2 as Seat, new Set()]])
  for (const trick of [...game.tricks.map((t) => t.cards), game.trick]) {
    if (trick.length === 0) continue
    const led = effectiveSuit(trick[0].card, contract)
    for (const p of trick.slice(1)) if (p.seat !== ME && effectiveSuit(p.card, contract) !== led) voids.get(p.seat)!.add(led)
  }
  const mine = game.declarer === ME
  const points = runningPoints(game)
  const side = mine ? points.declarer : points.defenders
  const goal = mine ? 61 : 60
  return (
    <>
      {contract.kind !== 'null' ? (
        <p data-testid="power-up-counter-points" {...stylex.props(typography.appText, styles.strong, styles.points)}>
          <Rich text={side >= goal ? m.powerup_counter_reached({ points: side, goal }) : m.powerup_counter_points({ points: side, left: goal - side, goal })} />
        </p>
      ) : null}
      <table {...stylex.props(styles.table)}>
        <thead>
          <tr>
            <th aria-label={m.bidvalues_game()} {...stylex.props(typography.smallBold, styles.th)} />
            <th {...stylex.props(typography.smallBold, styles.th)}>{m.powerup_counter_out()}</th>
            <th {...stylex.props(typography.smallBold, styles.th)}>{m.powerup_counter_void()}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const cards = out.filter((c) => effectiveSuit(c, contract) === g)
            const blank = [1, 2].filter((s) => voids.get(s as Seat)!.has(g)).map((s) => nameOf(s as Seat))
            return (
              <tr key={g} data-testid="power-up-counter-row" data-group={g}>
                <td {...stylex.props(typography.appText, styles.td, styles.strong, styles.group)}>
                  <Rich text={g === 'T' ? m.powerup_counter_trumps() : `${'♣♠♥♦'['CSHD'.indexOf(g)]}`} />
                </td>
                <td {...stylex.props(typography.appText, styles.td, styles.strong)}>
                  <span {...stylex.props(typography.appBtnStrong)}>{cards.length}</span>
                  {cards.length > 0 ? <span {...stylex.props(styles.labels)}> <Rich text={cards.map(cardLabel).join(' ')} /></span> : null}
                </td>
                <td {...stylex.props(typography.appText, styles.td, styles.soft)}>{blank.length > 0 ? blank.join(', ') : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

const styles = stylex.create({
  list: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x12,
    paddingBlock: space.x12,
    paddingInline: space.x16,
    borderRadius: radii.panel,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    backgroundColor: color.surface,
  },
  itemNow: { borderWidth: border.tile, borderColor: color.go },
  head: { display: 'flex', alignItems: 'center', gap: space.x12 },
  icon: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.powerUpIcon,
    height: dims.powerUpIcon,
    borderRadius: radii.panel,
    color: color.onColor,
  },
  toneNavy: { backgroundColor: color.tileNavy },
  toneOrange: { backgroundColor: color.tileOrange },
  toneGreen: { backgroundColor: color.tileGreen },
  titles: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
  name: { margin: 0, color: color.navy },
  desc: { margin: 0, color: color.slate },
  when: { margin: 0, color: color.slate },
  body: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { paddingBottom: space.x6, textAlign: 'start', whiteSpace: 'nowrap', color: color.slate },
  td: { paddingBlock: space.x6, paddingRight: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline, verticalAlign: 'baseline' },
  number: { textAlign: 'end', whiteSpace: 'nowrap' },
  strong: { margin: 0, color: color.navy },
  soft: { color: color.slate },
  sub: { display: 'block', whiteSpace: 'nowrap', color: color.slate },
  group: { whiteSpace: 'nowrap' },
  labels: { color: color.navy },
  points: { margin: 0 },
  note: { margin: 0, color: color.slate },
  put: { display: 'flex', alignItems: 'center', gap: space.x16, flexWrap: 'wrap' },
  cards: { display: 'flex', gap: space.x8 },
})
