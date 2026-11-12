import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { signed } from './daily-comparison'
import { Rich } from './ui'
import type { ProfileDeal } from '~/lib/skat/profile'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import type { Card, Contract, Rank, Suit } from '~/lib/skat/cards'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { bp } from '../../theme/breakpoints.stylex'
import { border, space } from '../../theme/scale.stylex'
import { radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// The player's games, one row each, newest first (SKATGO-182; SKATGO-189, the human: 「不要出现别人的名字。首页的卡片里的列表和
// 真实列表，都要改。我认为只限显示 BA10这三张，然后日期，是否坐庄，合约是啥」): the game and whether they were its declarer, their
// jacks, aces and tens, the day, and their Seeger-Fabian score less the AI's on the same cards, signed and never judged in
// colour (SKATGO-81). The front page's card and the record of play show the same row; the record's can be played again
// (`action`).

/** The game a deal's record names (`played` in multiplayer's profile.ts): "C", "grand", "null hand" … */
function gameName(game: string | undefined): string | null {
  if (!game) return null
  const [kind, hand] = game.split(' ')
  const contract: Contract | null = kind === 'grand' ? { kind: 'grand' } : kind === 'null' ? { kind: 'null' } : /^[CSHD]$/.test(kind) ? { kind: 'suit', trump: kind as Suit } : null
  if (!contract) return null
  return hand === 'hand' ? `${contractName(contract)} Hand` : contractName(contract)
}

const dayName = (day: string) => new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

/** The ranks a row shows, in that order, and the suits' order within each (the human: 「只限显示 BA10这三张」). */
const RANKS: Rank[] = ['J', 'A', '10']
const SUITS: Suit[] = ['C', 'S', 'H', 'D']

/** The player's jacks, then aces, then tens, each by suit; null where the deal's cards are not kept. */
function keyCards(d: ProfileDeal): Card[][] | null {
  if (!d.hand) return null
  const hand = d.hand.map((c) => ({ suit: c[0], rank: c.slice(1) }) as Card)
  return RANKS.map((rank) => SUITS.flatMap((suit) => hand.filter((c) => c.rank === rank && c.suit === suit)))
}

/** The player's Seeger-Fabian score less the AI's on the same cards from the same seat, or null without the AI's game. */
export const vsAi = (d: ProfileDeal) => (d.ai ? d.mine.scores[0] - d.ai.scores[0] : null)

/** The game and the player's part in it: declarer or defender, or that all passed. */
function Game({ deal, small }: { deal: ProfileDeal; small?: boolean }) {
  const { declarer } = deal.mine
  const name = small ? typography.panelLabel : typography.appBtnStrong
  if (declarer === null) return <span data-testid="history-game" {...stylex.props(name, styles.passed)}>{m.daily_passed_in_short()}</span>
  const game = gameName(deal.mine.game)
  const mine = declarer === 0
  return (
    <span {...stylex.props(styles.game)}>
      {game ? <span data-testid="history-game" {...stylex.props(name, styles.ink)}><Rich text={game} /></span> : null}
      <span data-testid="history-role" data-role={mine ? 'declarer' : 'defender'} {...stylex.props(small ? typography.label : typography.badge, styles.tag, small && styles.tagSmall, mine ? styles.declarer : styles.defender)}>
        {mine ? m.history_declarer() : m.history_defender()}
      </span>
    </span>
  )
}

/** The jacks, aces and tens, each suit in its colour, the three kinds a little apart; a dash when there are none, nothing
 *  where the deal's cards are not kept. */
function KeyCards({ deal, small }: { deal: ProfileDeal; small?: boolean }) {
  const groups = keyCards(deal)?.filter((g) => g.length)
  if (!groups) return null
  return (
    <span data-testid="history-hand" {...stylex.props(small ? typography.meta : typography.appText, styles.cards, small && styles.cardsSmall)}>
      {groups.length ? groups.map((g) => <span key={g[0].rank}><Rich text={g.map(cardLabel).join(small ? '\u2009' : ' ')} /></span>) : '–'}
    </span>
  )
}

/** The difference to the AI, signed, never judged in colour (SKATGO-81). */
function Gap({ deal }: { deal: ProfileDeal }) {
  const gap = vsAi(deal)
  return <span data-testid="history-gap" {...stylex.props(typography.appBtnStrong, styles.number)}>{gap === null ? '–' : signed(gap)}</span>
}

// The rows are a table where there is room (the human: the same row on the card and the record), one line a game with
// its columns lined up, so the front page's card shows several; on a phone each game is two lines — the game and the
// difference, then the cards and the day — and the record's way to play it again under them, as before.

/** On a phone, the end of a game's first line. */
const LineEnd = () => <span aria-hidden="true" {...stylex.props(styles.lineEnd)} />

/** The list's head: the game, the cards and the difference to the AI. */
function Head({ action, small }: { action: boolean; small?: boolean }) {
  return (
    <li aria-hidden="true" {...stylex.props(typography.meta, styles.row, styles.headRow)}>
      <span {...stylex.props(styles.cell, styles.headCell, styles.first, styles.grow)}>{m.history_head_game()}</span>
      <span {...stylex.props(styles.cell, styles.headCell, styles.second, small && styles.close, styles.wide, small && styles.phoneNone)}>{m.history_head_cards()}</span>
      <span {...stylex.props(styles.cell, styles.headCell, styles.second, small && styles.close, styles.phoneNone)} />
      {action ? <span {...stylex.props(styles.cell, styles.headCell, styles.second, styles.phoneNone)} /> : null}
      <span {...stylex.props(styles.cell, styles.headCell, styles.end, small && styles.close)}>{m.history_vs_ai()}</span>
      <LineEnd />
    </li>
  )
}

/** One game: the game and the player's part, the jacks, aces and tens, the day, on the record the way to play it again,
 *  and the difference to the AI. */
function Row({ deal, action, small, testId }: { deal: ProfileDeal; action?: ReactNode; small?: boolean; testId: string }) {
  return (
    <li data-testid={testId} data-key={deal.key} {...stylex.props(styles.row, small && styles.rowSmall)}>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.first, styles.grow)}><Game deal={deal} small={small} /></span>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.second, small && styles.close, styles.wide, styles.grow)}><KeyCards deal={deal} small={small} /></span>
      <span data-testid="history-day" {...stylex.props(typography.meta, styles.cell, small && styles.cellSmall, styles.second, small && styles.close, styles.day)}>{dayName(deal.day)}</span>
      {action !== undefined ? <span {...stylex.props(styles.cell, styles.second, styles.action)}>{action}</span> : null}
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.end, small && styles.close)}><Gap deal={deal} /></span>
      <LineEnd />
    </li>
  )
}

/** The record's rows, newest first, each with the way to play it again (`action`). */
export function DealRows({ deals, action }: { deals: ProfileDeal[]; action?: (d: ProfileDeal) => ReactNode }) {
  return (
    <ul data-testid="history-rows" {...stylex.props(styles.list)}>
      <Head action={!!action} />
      {deals.map((d) => <Row key={d.key} deal={d} action={action?.(d) ?? undefined} testId="history-row" />)}
    </ul>
  )
}

/** The front page's card: the same rows, scrolling inside the card, smaller and closer — the game and its tag a step
 *  down, the cards a thin space apart at the size of its earlier lines, and on a phone the head one line — so a hand keeps
 *  to one line and more games show. */
export function DealLines({ deals }: { deals: ProfileDeal[] }) {
  return (
    <ul data-testid="history-lines" {...stylex.props(styles.list, styles.cardEnd)}>
      <Head action={false} small />
      {deals.map((d) => <Row key={d.key} deal={d} small testId="history-line" />)}
    </ul>
  )
}

const styles = stylex.create({
  list: {
    display: { default: 'table', [bp.phone]: 'flex' },
    flexDirection: 'column',
    width: '100%',
    borderCollapse: 'collapse',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  // On the card, room at the right for the list's scrollbar, as the XP board's list beside it (SKATGO-172).
  cardEnd: { paddingInlineEnd: space.x16 },
  row: {
    display: { default: 'table-row', [bp.phone]: 'flex' },
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.x12,
    rowGap: space.x2,
    paddingBlock: { default: 0, [bp.phone]: space.x8 },
    borderTopWidth: { default: 0, [bp.phone]: border.hair },
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  headRow: { color: color.slate, borderTopWidth: 0, paddingTop: 0, paddingBottom: { default: 0, [bp.phone]: space.x6 } },
  cell: {
    display: { default: 'table-cell', [bp.phone]: 'block' },
    verticalAlign: 'middle',
    paddingBlock: { default: space.x8, [bp.phone]: 0 },
    borderTopWidth: { default: border.hair, [bp.phone]: 0 },
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
    whiteSpace: 'nowrap',
    order: { default: 0, [bp.phone]: 1 },
  },
  rowSmall: { paddingBlock: { default: 0, [bp.phone]: space.x6 } },
  cellSmall: { paddingBlock: { default: space.x4, [bp.phone]: 0 } },
  headCell: { paddingTop: 0, paddingBottom: { default: space.x6, [bp.phone]: 0 }, borderTopWidth: 0 },
  // The game and the difference make a phone's first line; the rest follows on the next.
  first: { paddingInlineStart: 0, order: 0 },
  end: { paddingInlineStart: { default: space.x12, [bp.phone]: 0 }, textAlign: 'end', order: 0 },
  second: { paddingInlineStart: { default: space.x12, [bp.phone]: 0 } },
  close: { paddingInlineStart: { default: space.x8, [bp.phone]: 0 } },
  // The cards' column takes the room left, so the day and the difference keep to the right.
  wide: { width: { default: '100%', [bp.phone]: 'auto' }, whiteSpace: 'normal' },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  phoneNone: { display: { default: 'table-cell', [bp.phone]: 'none' } },
  lineEnd: { display: { default: 'none', [bp.phone]: 'block' }, flexBasis: '100%', order: 0 },
  game: { display: 'flex', flexWrap: { default: 'nowrap', [bp.phone]: 'wrap' }, alignItems: 'center', gap: space.x8 },
  ink: { color: color.navy },
  passed: { color: color.slate },
  tag: { display: 'inline-block', paddingInline: space.x8, paddingBlock: space.x2, borderRadius: radii.pill },
  tagSmall: { paddingInline: space.x6 },
  declarer: { backgroundColor: color.youTag, color: color.onColor },
  defender: { backgroundColor: color.page, color: color.slate },
  cards: { display: 'flex', flexWrap: 'wrap', columnGap: space.x12, color: color.navy },
  cardsSmall: { columnGap: space.x8 },
  day: { color: color.slate, textAlign: 'end' },
  number: { color: color.navy, fontVariantNumeric: 'tabular-nums' },
  action: { flexBasis: { default: 'auto', [bp.phone]: '100%' }, paddingTop: { default: space.x8, [bp.phone]: space.x2 } },
})
