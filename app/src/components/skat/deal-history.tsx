import * as stylex from '@stylexjs/stylex'
import { Crown } from 'lucide-react'
import type { ReactNode } from 'react'

import { signed } from './daily-comparison'
import { Rich } from './ui'
import type { ProfileDeal } from '~/lib/skat/profile'
import { cardLabel, contractName, suitName } from '~/lib/skat/i18n'
import type { Card, Rank, Suit } from '~/lib/skat/cards'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { bp } from '../../theme/breakpoints.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

// The player's games, one row each, newest first (SKATGO-182; SKATGO-189, the human: 「不要出现别人的名字。首页的卡片里的列表和
// 真实列表，都要改。我认为只限显示 BA10这三张，然后日期，是否坐庄，合约是啥」): the game and whether they were its declarer, their
// jacks, aces and tens, the day, and their Seeger-Fabian score less the AI's on the same cards, signed and never judged in
// colour (SKATGO-81). The front page's card and the record of play show the same row; the record's can be played again
// (`action`).

/** The game a deal's record names (`played` in multiplayer's profile.ts): "C", "grand", "null hand" … — in words, a suit
 *  game by its suit's name without its sign (the human: 「这里不要再显示红心等符号了」). */
function gameName(game: string | undefined): string | null {
  if (!game) return null
  const [kind, hand] = game.split(' ')
  const name = kind === 'grand' || kind === 'null' ? contractName({ kind }) : /^[CSHD]$/.test(kind) ? suitName(kind as Suit) : null
  if (!name) return null
  return hand === 'hand' ? `${name} Hand` : name
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

/** The game, or that all passed. */
function Game({ deal, small }: { deal: ProfileDeal; small?: boolean }) {
  const name = small ? typography.panelLabel : typography.appBtnStrong
  if (deal.mine.declarer === null) return <span data-testid="history-game" {...stylex.props(name, styles.passed)}>{m.daily_passed_in_short()}</span>
  const game = gameName(deal.mine.game)
  return game ? <span data-testid="history-game" {...stylex.props(name, styles.ink)}>{game}</span> : null
}

/** Where the player was the declarer — the one who plays alone against two — a crown, small and outlined in navy
 *  (SKATGO-191, the human: 「那个declear表示还是太大，能否改成 一个符号？常用的？」, then 「同意你的推荐。
 *  那就不要显示列头，也不要显示declearer，defender这些字样了」, 「可以，那就只做庄家，防就不做了」, 「你还是他妈的用拍卖锤子图标吧，别太大，
 *  透明就行」, then 「还是用刚才那个王冠吧」); nothing where they defended or all passed. No word in the table; a screen reader says it. */
function Role({ deal }: { deal: ProfileDeal }) {
  if (deal.mine.declarer !== 0) return null
  const label = m.history_declarer()
  return (
    <span data-testid="history-role" data-role="declarer" title={label} {...stylex.props(styles.role)}>
      <Crown role="img" aria-label={label} size={icon.header} strokeWidth={icon.outline} />
    </span>
  )
}

/** The jacks, aces and tens, each suit in its colour, the three kinds a little apart; a dash when there are none, nothing
 *  where the deal's cards are not kept. */
function KeyCards({ deal, small }: { deal: ProfileDeal; small?: boolean }) {
  const groups = keyCards(deal)?.filter((g) => g.length)
  if (!groups) return null
  return (
    <span data-testid="history-hand" {...stylex.props(small ? typography.meta : typography.appText, styles.cards)}>
      {groups.length ? groups.map((g) => <span key={g[0].rank} {...stylex.props(small ? styles.groupSmall : styles.group)}><Rich text={g.map(cardLabel).join(small ? '\u2009' : ' ')} /></span>) : '–'}
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

/** The list's head: the game, the declarer's column and the difference to the AI. */
function Head({ action, small }: { action: boolean; small?: boolean }) {
  return (
    <li aria-hidden="true" {...stylex.props(typography.meta, styles.row, styles.headRow)}>
      <span {...stylex.props(styles.cell, styles.headCell, styles.first, styles.grow)}>{m.history_head_game()}</span>
      {/* The role's column has no head: one person or two says it (SKATGO-191). */}
      <span {...stylex.props(styles.cell, styles.headCell, styles.second, small && styles.close, styles.roleCell, styles.phoneNone)} />
      {/* The cards' column has no head (the human: 「第三列的列头很sb，删掉」). */}
      <span {...stylex.props(styles.cell, styles.headCell, styles.second, small && styles.close, styles.wide, styles.phoneNone)} />
      <span {...stylex.props(styles.cell, styles.headCell, styles.second, small && styles.close, styles.phoneNone)} />
      <span {...stylex.props(styles.cell, styles.headCell, styles.end, small && styles.close, styles.lineOne)}>{m.history_vs_ai()}</span>
      {action ? <span {...stylex.props(styles.cell, styles.headCell, styles.second, styles.phoneNone)} /> : null}
      <LineEnd />
    </li>
  )
}

/** One game: the game and the player's part, the jacks, aces and tens, the day, the difference to the AI, and on the
 *  record the way to play it again. */
function Row({ deal, action, small, testId }: { deal: ProfileDeal; action?: ReactNode; small?: boolean; testId: string }) {
  return (
    <li data-testid={testId} data-key={deal.key} {...stylex.props(styles.row, small && styles.rowSmall)}>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.first)}><Game deal={deal} small={small} /></span>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.second, small && styles.close, styles.roleCell)}><Role deal={deal} /></span>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.second, small && styles.close, styles.wide, styles.grow, styles.lineOne)}><KeyCards deal={deal} small={small} /></span>
      <span data-testid="history-day" {...stylex.props(typography.meta, styles.cell, small && styles.cellSmall, styles.second, small && styles.close, styles.day)}>{dayName(deal.day)}</span>
      <span {...stylex.props(styles.cell, small && styles.cellSmall, styles.end, small && styles.close)}><Gap deal={deal} /></span>
      {/* The way to play it again, last (the human: 「详情表里，replay放在最后一列」); on a phone its own line under the game. */}
      {action !== undefined ? <span {...stylex.props(styles.cell, styles.second, styles.action)}>{action}</span> : null}
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
    // Separate, not collapsed: a collapsed table drops its own padding, and the card's room for the scrollbar with it
    // (SKATGO-190, the human: 「vs AI分数的的右边连个padding都没有，紧贴滚动条」).
    borderCollapse: 'separate',
    borderSpacing: 0,
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
  end: { paddingInlineStart: { default: space.x12, [bp.phone]: 0 }, textAlign: 'end', order: { default: 0, [bp.phone]: 1 } },
  // On a phone the first line is the game, the crown and the cards; the head keeps "vs. AI" on its one line.
  lineOne: { order: 0 },
  second: { paddingInlineStart: { default: space.x12, [bp.phone]: 0 } },
  close: { paddingInlineStart: { default: space.x8, [bp.phone]: 0 } },
  // The cards' column takes the room left, so the day and the difference keep to the right.
  wide: { width: { default: '100%', [bp.phone]: 'auto' }, whiteSpace: 'normal' },
  grow: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  // The role's sign in the middle of its column; on a phone it follows the game on its line and takes the room
  // up to the difference.
  // On a phone an empty one (a defended game) takes no room, so the cards follow the game directly.
  roleCell: { order: 0, textAlign: { default: 'center', [bp.phone]: 'start' }, display: { default: 'table-cell', [bp.phone]: { default: 'block', ':empty': 'none' } } },
  phoneNone: { display: { default: 'table-cell', [bp.phone]: 'none' } },
  lineEnd: { display: { default: 'none', [bp.phone]: 'block' }, flexBasis: '100%', order: 0 },
  ink: { color: color.navy },
  passed: { color: color.slate },
  role: { display: 'inline-flex', color: color.navy, verticalAlign: 'middle' },
  // On a phone one line, cut with an ellipsis when the cards do not fit (SKATGO-192, the human: 「合约，庄，手牌，放第一行，要溢出
  // 就放三个点截断手牌」).
  cards: {
    display: { default: 'flex', [bp.phone]: 'block' },
    flexWrap: 'wrap',
    whiteSpace: { default: 'normal', [bp.phone]: 'nowrap' },
    overflow: { default: 'visible', [bp.phone]: 'hidden' },
    textOverflow: { default: 'clip', [bp.phone]: 'ellipsis' },
    color: color.navy,
  },
  group: { marginInlineEnd: { default: space.x12, ':last-child': 0 } },
  groupSmall: { marginInlineEnd: { default: space.x8, ':last-child': 0 } },
  // On a phone the second line: the day at the left, the difference and Replay at the right (「第二行放日期，差分，replay」).
  day: { color: color.slate, textAlign: { default: 'end', [bp.phone]: 'start' }, flexGrow: { default: 0, [bp.phone]: 1 } },
  number: { color: color.navy, fontVariantNumeric: 'tabular-nums' },
  action: { paddingTop: { default: space.x8, [bp.phone]: 0 } },
})
