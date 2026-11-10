import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { signed } from './daily-comparison'
import { Rich } from './ui'
import { type ProfileDeal, dealKeyOf } from '~/lib/skat/profile'
import { cardLabel, contractName } from '~/lib/skat/i18n'
import { type Card, type Contract, type Suit, sortHand } from '~/lib/skat/cards'
import { DEAL_OF_DAY } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'

// The player's games, one row each, newest first (SKATGO-182, the human: 「没登录就显示打的牌的历史列表……打开后，既要显示当前的，又
// 能显示历史」, then 「每一行显示用户拿到了啥牌，以及和ai差几分」): the ten cards they were dealt and their Seeger-Fabian score less
// the AI's on the same cards, signed and never judged in colour (SKATGO-81). On the record of play a row also says what
// happened — the game they played or defended against, won or lost, or that all passed — where and when, and can be
// played again (`action`); on the front page's card a row is one line.

/** The game a deal's record names (`played` in multiplayer's profile.ts): "C", "grand", "null hand" … */
function gameName(game: string | undefined): string | null {
  if (!game) return null
  const [kind, hand] = game.split(' ')
  const contract: Contract | null = kind === 'grand' ? { kind: 'grand' } : kind === 'null' ? { kind: 'null' } : /^[CSHD]$/.test(kind) ? { kind: 'suit', trump: kind as Suit } : null
  if (!contract) return null
  return hand === 'hand' ? `${contractName(contract)} Hand` : contractName(contract)
}

/** What happened in the deal, from the player's seat. */
export function dealLine(d: ProfileDeal): string {
  const { declarer, won } = d.mine
  if (declarer === null) return m.daily_passed_in_short()
  const game = gameName(d.mine.game) ?? m.history_game()
  if (declarer === 0) return won ? m.result_head_you_won({ game }) : m.result_head_you_lost({ game })
  const name = declarer === 1 ? m.name_lina() : m.name_max()
  return won ? m.result_head_won({ name, game }) : m.result_head_lost({ name, game })
}

/** Where the deal was played: free play, the deal of the day, or the daily tournament. */
export function modeOf(d: ProfileDeal): string {
  const key = dealKeyOf(d.key)
  if (key?.kind === 'daily') return key.size === DEAL_OF_DAY ? m.history_dod() : m.history_tournament()
  return m.history_free()
}

const dayName = (day: string) => new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

/** The player's ten cards as dealt, in the hand's order (trumps of a Grand first), or null where they are not kept. */
function handOf(d: ProfileDeal): Card[] | null {
  return d.hand ? sortHand(d.hand.map((c) => ({ suit: c[0], rank: c.slice(1) }) as Card), null) : null
}

/** The player's Seeger-Fabian score less the AI's on the same cards from the same seat, or null without the AI's game. */
export const vsAi = (d: ProfileDeal) => (d.ai ? d.mine.scores[0] - d.ai.scores[0] : null)

/** The ten cards in one line, each suit in its colour (SKATGO-182, the human: 「每一行显示用户拿到了啥牌，以及和ai差几分」). */
function Hand({ deal, line }: { deal: ProfileDeal; line?: boolean }) {
  const hand = handOf(deal)
  return (
    // On the card's one line the cards close up, a thin space apart and at the meta size, so ten fit on a phone.
    <span data-testid="history-hand" {...stylex.props(line ? typography.meta : typography.appText, styles.hand, line && styles.cut)}>
      {hand ? <Rich text={hand.map(cardLabel).join(line ? '\u2009' : ' ')} /> : dealLine(deal)}
    </span>
  )
}

/** The difference to the AI, signed, never judged in colour (SKATGO-81). */
function Gap({ deal }: { deal: ProfileDeal }) {
  const gap = vsAi(deal)
  return <span data-testid="history-gap" {...stylex.props(typography.appBtnStrong, styles.number)}>{gap === null ? '–' : signed(gap)}</span>
}

/** The head over the differences: what they are. */
function GapHead() {
  return <span {...stylex.props(typography.meta, styles.gapHead)}>{m.history_vs_ai()}</span>
}

/** The record's rows, newest first: the ten cards, under them what happened, where and when, and under that the way to
 *  play it again (`action`); at the right the difference to the AI. */
export function DealRows({ deals, action }: { deals: ProfileDeal[]; action?: (d: ProfileDeal) => ReactNode }) {
  return (
    <ul data-testid="history-rows" {...stylex.props(styles.list)}>
      <li aria-hidden="true" {...stylex.props(styles.headRow)}><GapHead /></li>
      {deals.map((d) => (
        <li key={d.key} data-testid="history-row" data-key={d.key} {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.main)}>
            <Hand deal={d} />
            <span {...stylex.props(typography.meta, styles.meta)}>{`${d.hand ? `${dealLine(d)} · ` : ''}${modeOf(d)} · ${dayName(d.day)}`}</span>
            {action ? <span {...stylex.props(styles.action)}>{action(d)}</span> : null}
          </div>
          <Gap deal={d} />
        </li>
      ))}
    </ul>
  )
}

/** The front page's card: one line a game — its ten cards and the difference to the AI. */
export function DealLines({ deals }: { deals: ProfileDeal[] }) {
  return (
    <ul data-testid="history-lines" {...stylex.props(styles.list)}>
      <li aria-hidden="true" {...stylex.props(styles.headRow, styles.lineHead)}><GapHead /></li>
      {deals.map((d) => (
        <li key={d.key} data-testid="history-line" data-key={d.key} {...stylex.props(styles.line)}>
          <Hand deal={d} line />
          <Gap deal={d} />
        </li>
      ))}
    </ul>
  )
}

const styles = stylex.create({
  list: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  headRow: { display: 'flex', justifyContent: 'flex-end', paddingBottom: space.x6 },
  lineHead: { paddingBottom: space.x2, paddingInlineEnd: space.x16 },
  gapHead: { color: color.slate },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.x12,
    paddingBlock: space.x8,
    borderTopWidth: border.hair,
    borderTopStyle: 'solid',
    borderTopColor: color.hairline,
  },
  main: { display: 'flex', flexDirection: 'column', gap: space.x2, minWidth: 0 },
  hand: { color: color.navy },
  cut: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { color: color.slate },
  action: { display: 'flex', paddingTop: space.x2 },
  number: { flexShrink: 0, color: color.navy, textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
  // On the card: as the XP board's list beside it, the rows scrolling inside the card (SKATGO-172).
  line: {
    display: 'flex',
    alignItems: 'baseline',
    gap: space.x12,
    paddingBlock: space.x2,
    paddingInlineEnd: space.x16,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
  },
})
