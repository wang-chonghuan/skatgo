import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { ELO_PROVISIONAL_DAYS, ELO_START, type EloBoard as Board, eloK } from '~/lib/skat/elo'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Panel } from './ui'

type Line = { row: Board['rows'][number] } | { ki: number }

/**
 * The tournament's Elo board in the front page's hero (SKATGO-123, the human: 「这个名单要显示出来，放到hero区域」):
 * the top players by their number, the KI's fixed number standing among them as on the daily board — after
 * any player with the same, taking no rank — and how it is counted, one line and a fold with the numbers, so a
 * visitor can follow it (「别人看了，觉得不离谱，觉得能理解」). On a phone it is folded behind one line with the
 * leader (「手机上可能要折叠一下排名榜」); a tap opens it.
 */
export function EloBoard({ board }: { board: Board }) {
  const [open, setOpen] = useState(false)
  const lines: Line[] = board.rows.map((row) => ({ row }))
  const at = board.rows.findIndex((r) => r.elo < board.ki)
  lines.splice(at >= 0 ? at : lines.length, 0, { ki: board.ki })
  const leader = board.rows[0]
  return (
    <Panel>
      <section data-testid="elo-board" aria-labelledby="elo-board-title" {...stylex.props(styles.board)}>
        <h2 id="elo-board-title" {...stylex.props(typography.dialogTitle, styles.title, styles.wide)}>{m.elo_title()}</h2>
        <button
          type="button"
          data-testid="elo-board-toggle"
          aria-expanded={open}
          aria-controls="elo-board-body"
          onClick={() => setOpen(!open)}
          {...stylex.props(styles.toggle)}
        >
          <span {...stylex.props(typography.dialogTitle, styles.title)}>{m.elo_title()}</span>
          {leader ? <span {...stylex.props(typography.appText, styles.leader)}>{`${leader.rank}. ${leader.nickname} · ${leader.elo}`}</span> : null}
          {open ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />}
        </button>
        <div id="elo-board-body" data-open={open ? 'true' : undefined} {...stylex.props(styles.body, !open && styles.folded)}>
          <p {...stylex.props(typography.appText, styles.muted)}>{m.elo_lead()}</p>
          <ol {...stylex.props(styles.rows)}>
            <li aria-hidden="true" {...stylex.props(typography.micro, styles.headRow, styles.muted)}>
              <span {...stylex.props(styles.what)} />
              <span>{m.elo_column()}</span>
            </li>
            {lines.map((l) =>
              'ki' in l ? (
                <li key="ki" data-testid="elo-board-ki" data-elo={l.ki} {...stylex.props(typography.appText, styles.row)}>
                  <span {...stylex.props(styles.rank)} />
                  <span {...stylex.props(styles.what)}><Who side="ai" /></span>
                  <span {...stylex.props(styles.score)}>{l.ki}</span>
                </li>
              ) : (
                <li key={`${l.row.rank}-${l.row.nickname}`} data-testid="elo-board-row" data-rank={l.row.rank} data-elo={l.row.elo} {...stylex.props(typography.appText, styles.row)}>
                  <span {...stylex.props(styles.muted, styles.rank)}>{l.row.rank}</span>
                  <span data-testid="elo-board-name" {...stylex.props(styles.what)}>{l.row.nickname}</span>
                  <span {...stylex.props(styles.score)}>
                    {l.row.elo}
                    {l.row.provisional ? <span {...stylex.props(styles.muted)}>?</span> : null}
                  </span>
                </li>
              ),
            )}
          </ol>
          <details data-testid="elo-board-how" {...stylex.props(styles.how)}>
            <summary {...stylex.props(typography.appLink, styles.summary)}>{m.elo_how()}</summary>
            <ul {...stylex.props(typography.appText, styles.howList)}>
              <li>{m.elo_how_win()}</li>
              <li>{m.elo_how_start({ start: ELO_START, ki: board.ki })}</li>
              <li>{m.elo_how_change({ first: eloK(0), after: eloK(30) })}</li>
              <li>{m.elo_how_day()}</li>
              <li>{m.elo_how_provisional({ n: ELO_PROVISIONAL_DAYS })}</li>
            </ul>
          </details>
        </div>
      </section>
    </Panel>
  )
}

const styles = stylex.create({
  board: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  // The title on its own wherever the board is open by itself; on a phone the line that folds it says it.
  title: { margin: 0, color: color.navy },
  wide: { display: { default: 'block', [bp.phone]: 'none' } },
  toggle: {
    display: { default: 'none', [bp.phone]: 'flex' },
    alignItems: 'center',
    gap: space.x12,
    width: '100%',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.navy,
    textAlign: 'start',
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  leader: { flexGrow: 1, minWidth: 0, color: color.slate },
  body: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  folded: { display: { default: 'flex', [bp.phone]: 'none' } },
  muted: { margin: 0, color: color.slate, flexShrink: 0 },
  rows: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
  headRow: { display: 'flex', paddingInline: space.x8, paddingBottom: space.x4 },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: space.x12,
    paddingBlock: space.x6,
    paddingInline: space.x8,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  rank: { minWidth: space.x24 },
  what: { flexGrow: 1, minWidth: 0 },
  score: { flexShrink: 0 },
  how: { color: color.text },
  summary: { color: color.info, cursor: 'pointer' },
  howList: { display: 'flex', flexDirection: 'column', gap: space.x4, margin: 0, paddingTop: space.x8, paddingInlineStart: space.x20, color: color.text },
})
