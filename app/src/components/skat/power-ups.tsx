import * as stylex from '@stylexjs/stylex'
import { useEffect, useMemo, useState } from 'react'

import type { FreeError, FreeOdds } from '~/lib/free-api'
import { type Card, type Contract, SUITS, cardId, effectiveSuit, fullDeck, sameCard, sortHand } from '~/lib/skat/cards'
import type { Game, Seat } from '~/lib/skat/game'
import { cardLabel, contractName, matadorLabel } from '~/lib/skat/i18n'
import { NULL_VALUES, baseValue, matadors, nextBid } from '~/lib/skat/value'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Modal, Rich } from './ui'

// Free play's power-ups (SKATGO-177, the human: 「先把记牌器，叫牌胜率，该扣那两张，做成三个道具，放在灯泡打开的页面里，设计要美观。
// 先不考虑橡果，这三个道具自由免费在free play里用」): the lightbulb opens the one that serves the moment — the win chances while
// bidding and again once the skat is picked up, the card counter while the cards are played.
// The dialog speaks in the result dialog's four levels (SKATGO-146): its title, numbers `appBtnStrong`, words `appText`,
// the small bold 13. Each sees only what the player's seat may see: the win chances are SkatZero's on the server for the
// player's own cards, the counter is worked out here from the table. Nothing says which card to play (the human: 「不要出牌
// 提示，出牌提示让人不思考」), nor which two to put away or which game to play — the put-away tips are gone (「我觉得这个灯泡
// 提示不行……你那个放skat技巧的，删掉」).

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
  /** The cards the player has picked on the table: once two are picked to put away, the chances are with them. */
  picked?: Card[]
  nameOf: (seat: Seat) => string
  odds?: (discard?: Card[]) => Promise<FreeOdds | FreeError>
  onClose: () => void
}

export type PowerUp = 'odds' | 'counter'

/** The power-up that serves the moment, or none — then there is no lightbulb: the win chances while bidding, and again
 *  once the player has picked up the skat, with the cards found in it (the human: 「在选合约阶段，也显示这个胜率表，根据用户
 *  skat的牌，让胜率自适应显示」); the card counter while the cards are played. */
export const pickedUp = (g: Game) => (g.phase === 'skat' || g.phase === 'declare') && g.declarer === ME && g.pickedUp
export function powerUpOf(g: Game): PowerUp | null {
  if (g.phase === 'bidding' || pickedUp(g)) return 'odds'
  if ((g.phase === 'play' || g.phase === 'trickEnd') && g.declaration !== null) return 'counter'
  return null
}

/** The lightbulb's dialog: the one power-up of the moment, nothing to choose (the human: 「每个阶段……点这个灯泡之后就显示这个
 *  阶段适用的工具，不要让用户去选择了」). */
export function PowerUps({ game, picked = [], nameOf, odds, onClose }: Props) {
  const tool = powerUpOf(game)
  const ids = (cards: Card[]) => cards.map(cardId).sort().join()
  // Bidding: the ten cards. Picked up: the twelve in hand, with the two picked to put away once two are (the human: 「我选了
  // 2个skat，还没打出去，此时胜率表没变呢？」), then the ten kept and the two put away — each its own answer.
  const put = game.phase === 'skat' && pickedUp(game) && picked.length === 2 ? picked : undefined
  const ask = useMemo(() => (odds ? () => odds(put) : undefined), [odds, put && ids(put)])
  const oddsNow = useAsked<FreeOdds>(tool === 'odds' ? `odds|${game.dealer}|${ids(game.hands[ME])}|${pickedUp(game) ? ids(game.skat) : ''}|${put ? ids(put) : ''}` : null, ask)
  if (!tool) return null
  const title = tool === 'odds' ? m.powerup_odds_name() : m.powerup_counter_name()
  return (
    <Modal title={title} onClose={onClose} testId="skat-power-ups" tight>
      <div data-testid={`power-up-${tool}`} {...stylex.props(styles.body)}>
        {tool === 'odds' ? <OddsTable game={game} put={!!put} odds={oddsNow} /> : <Counter game={game} nameOf={nameOf} />}
      </div>
    </Modal>
  )
}

const Waiting = ({ state }: { state: 'loading' | 'failed' }) => (
  <p {...stylex.props(typography.appText, styles.note)}>{state === 'loading' ? m.loading() : m.powerup_failed()}</p>
)

/** The number the player would have to say or hold now: the speaker's next one, the one asked of the listener, 18 alone;
 *  once the skat is picked up, the bid won. */
function bidNow(g: Game): number {
  if (pickedUp(g)) return g.bid
  const b = g.bidding
  if (b.awaiting === 'speaker') return nextBid(b.value) ?? b.value
  return Math.max(18, b.value)
}

/** Each game's value with the ten cards in hand, without and with Hand, and SkatZero's chance to make it at the number on
 *  the table now after picking up — the win chances. Once picked up: the value with the twelve cards, no Hand (it is gone),
 *  and the chance at the bid won with this skat. Null has its fixed values and no chance. */
function OddsTable({ game, put, odds }: { game: Game; put: boolean; odds: FreeOdds | 'loading' | 'failed' | null }) {
  const after = pickedUp(game)
  const hand = after ? [...game.hands[ME], ...game.skat] : game.hands[ME]
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
            {after ? null : <th {...stylex.props(typography.smallBold, styles.th, styles.number)}>{m.bidvalues_hand()}</th>}
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
              {after ? null : <td {...stylex.props(typography.appText, styles.td, styles.number, styles.soft)}>{r.hand}</td>}
              <td data-testid="power-up-odds-win" {...stylex.props(typography.appBtnStrong, styles.td, styles.number, styles.strong)}>{r.win}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {odds === 'loading' || odds === 'failed' ? <Waiting state={odds} /> : null}
      <p {...stylex.props(typography.meta, styles.note)}>{!after ? m.powerup_odds_note() : game.phase === 'declare' || put ? m.powerup_odds_note_put() : m.powerup_odds_note_skat()}</p>
    </>
  )
}

/** What the player's seat has seen: their hand, every card played, and the skat once it is theirs to know. */
function seenBy(g: Game): Card[] {
  const played = [...g.tricks.flatMap((t) => t.cards.map((p) => p.card)), ...g.trick.map((p) => p.card)]
  const skat = g.declarer === ME && g.pickedUp ? g.skat : []
  return [...g.hands[ME], ...played, ...skat]
}

/** The card counter: per trumps and side suit which cards are still out — no points (the human: 「your side 几分这个不用显示」) —
 *  strongest first, no count (the human: 「还剩几张这一列不用显示，你就显示具体剩了哪些牌就行了」) — and who has shown they have
 *  none (they did not follow it): Lina, Noah, or both (「空的可能是两个人都空了」). */
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
  return (
    <>
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
            // Nothing of it still out: neither can hold any, whether or not they have shown it yet (the human: 「红心明明两个对手都
            // 没了，为啥只显示lina」).
            const blank = cards.length === 0 ? [1, 2].map((s) => nameOf(s as Seat)) : [1, 2].filter((s) => voids.get(s as Seat)!.has(g)).map((s) => nameOf(s as Seat))
            return (
              <tr key={g} data-testid="power-up-counter-row" data-group={g}>
                <td {...stylex.props(typography.appText, styles.td, styles.strong, styles.group)}>
                  <Rich text={g === 'T' ? m.powerup_counter_trumps() : `${'♣♠♥♦'['CSHD'.indexOf(g)]}`} />
                </td>
                <td data-testid="power-up-counter-out" {...stylex.props(typography.appText, styles.td, styles.strong)}>
                  {cards.length > 0 ? <Rich text={cards.map(cardLabel).join(' ')} /> : '—'}
                </td>
                {/* Both are void when nothing of it is out, or when both have shown it missing — then what is out lies in the skat. */}
                <td data-testid="power-up-counter-void" {...stylex.props(typography.appText, styles.td, styles.soft, styles.group)}>
                  {blank.length === 2 ? m.powerup_counter_void_both() : blank.length === 1 ? blank[0] : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}

const styles = stylex.create({
  body: { display: 'flex', flexDirection: 'column', gap: space.x8 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { paddingBottom: space.x6, textAlign: 'start', whiteSpace: 'nowrap', color: color.slate },
  td: { paddingBlock: space.x6, paddingRight: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline, verticalAlign: 'baseline' },
  number: { textAlign: 'end', whiteSpace: 'nowrap' },
  strong: { margin: 0, color: color.navy },
  soft: { color: color.slate },
  sub: { display: 'block', whiteSpace: 'nowrap', color: color.slate },
  group: { whiteSpace: 'nowrap' },
  note: { margin: 0, color: color.slate },
})
