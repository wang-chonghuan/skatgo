import * as stylex from '@stylexjs/stylex'
import type { ReactNode } from 'react'

import { Who, signed } from './daily-comparison'
import { type ProfileDeal, dealKeyOf } from '~/lib/skat/profile'
import { contractName } from '~/lib/skat/i18n'
import type { Contract, Suit } from '~/lib/skat/cards'
import { DEAL_OF_DAY } from '~/lib/skat/tournament'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// The player's games, one row each, newest first (SKATGO-182, the human: 「没登录就显示打的牌的历史列表……打开后，既要显示当前的，又
// 能显示历史」): what happened from the player's seat — the game they played or defended against, won or lost, or that all
// passed — where and when, and the player's Seeger-Fabian score beside the AI's on the same cards, signed and never
// judged in colour (SKATGO-81). On the record of play each row can be played again (`action`); on the front page's card a
// row is one line.

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
  return m.nav_header_free()
}

const dayName = (day: string) => new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T00:00:00Z`))

/** The record's rows, newest first, laid out as "You vs. the AI" beside them (SKATGO-169): what happened, and under it where
 *  and when and the way to play it again (`action`); the player's score and the AI's in two columns under their tags. */
export function DealRows({ deals, action }: { deals: ProfileDeal[]; action?: (d: ProfileDeal) => ReactNode }) {
  return (
    <div data-testid="history-rows" role="table" {...stylex.props(styles.table)}>
      <div role="row" {...stylex.props(styles.contents)}>
        <span role="columnheader" />
        <span role="columnheader" {...stylex.props(styles.head)}><Who side="you" /></span>
        <span role="columnheader" {...stylex.props(styles.head)}><Who side="ai" /></span>
      </div>
      {deals.map((d) => (
        <div key={d.key} role="row" data-testid="history-row" data-key={d.key} {...stylex.props(styles.contents)}>
          <div role="cell" {...stylex.props(styles.cell, styles.main)}>
            <span data-testid="history-what" {...stylex.props(typography.appText, styles.what)}>{dealLine(d)}</span>
            <span {...stylex.props(typography.meta, styles.meta)}>
              {`${modeOf(d)} · ${dayName(d.day)}`}
              {action ? <> · {action(d)}</> : null}
            </span>
          </div>
          <span role="cell" data-testid="history-you" {...stylex.props(typography.appBtnStrong, styles.cell, styles.number)}>{signed(d.mine.scores[0])}</span>
          <span role="cell" data-testid="history-ai" {...stylex.props(typography.appText, styles.cell, styles.number)}>{d.ai ? signed(d.ai.scores[0]) : '–'}</span>
        </div>
      ))}
    </div>
  )
}

/** The front page's card: one line a deal — the day, what happened, the player's score. */
export function DealLines({ deals }: { deals: ProfileDeal[] }) {
  return (
    <ul data-testid="history-lines" {...stylex.props(styles.lines)}>
      {deals.map((d) => (
        <li key={d.key} data-testid="history-line" data-key={d.key} {...stylex.props(styles.line)}>
          <span {...stylex.props(typography.meta, styles.lineDay)}>{dayName(d.day)}</span>
          <span {...stylex.props(typography.appText, styles.lineWhat)}>{dealLine(d)}</span>
          <span {...stylex.props(typography.appBtnStrong, styles.number)}>{signed(d.mine.scores[0])}</span>
        </li>
      ))}
    </ul>
  )
}

const styles = stylex.create({
  // The grid of "You vs. the AI" (`dims.versusColumns`): what happened, then the two scores; a row is only its cells.
  table: { display: 'grid', gridTemplateColumns: dims.versusColumns, width: '100%' },
  contents: { display: 'contents' },
  head: { paddingBottom: space.x6, textAlign: 'end' },
  cell: { paddingBlock: space.x8, borderTopWidth: border.hair, borderTopStyle: 'solid', borderTopColor: color.hairline },
  main: { display: 'flex', flexDirection: 'column', gap: space.x2, minWidth: 0, paddingInlineEnd: space.x8 },
  what: { color: color.navy },
  meta: { color: color.slate },
  number: { color: color.navy, textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
  // On the card: as the XP board's list beside it, the rows scrolling inside the card (SKATGO-172).
  lines: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
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
  lineDay: { flexShrink: 0, color: color.slate },
  lineWhat: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: color.navy },
})
