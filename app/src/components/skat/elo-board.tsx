import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { useState } from 'react'

import { ELO_PROVISIONAL_DAYS, ELO_START, type EloBoard as Board } from '~/lib/skat/elo'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { marqueeSlide, timing } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Modal, Panel } from './ui'

type Line = { row: Board['rows'][number] } | { ki: number }

/** The folded board's names, running sideways without end. */
const slide = stylex.keyframes({ from: { transform: marqueeSlide.start }, to: { transform: marqueeSlide.end } })

/**
 * The tournament's Elo board in the front page's hero (SKATGO-123, the human: 「这个名单要显示出来，放到hero区域」):
 * the top players by their number, the KI's fixed number standing among them as on the daily board — after
 * any player with the same, taking no rank. How it is counted, and what a "?" means, open from a circled
 * question mark beside the title, in a `Modal` (SKATGO-123: 「how it counted用一个圆圈问号图标，放在 elo标题旁边」; a dialog
 * since SKATGO-140: 「文字啰嗦，而且点开后那个toast不好关」). `fill`: as tall as where it sits, the list scrolling inside (「可以滚动，不要那么高」), its rows close
 * together, one column (「你换成单列吧」), at the text's size (「我刚都没说让你改成14」). On a phone it is folded behind one line where the players run
 * slowly sideways, without end (「手机上可能要折叠一下排名榜」, 「横向持续缓慢滚动」); a tap opens it.
 */
export function EloBoard({ board, fill = false }: { board: Board; fill?: boolean }) {
  const [open, setOpen] = useState(false)
  const [how, setHow] = useState(false)
  const lines: Line[] = board.rows.map((row) => ({ row }))
  const at = board.rows.findIndex((r) => r.elo < board.ki)
  lines.splice(at >= 0 ? at : lines.length, 0, { ki: board.ki })
  const names = board.rows.map((r) => `${r.rank}. ${r.nickname} · ${r.elo}`)
  return (
    <Panel fill={fill}>
      <section data-testid="elo-board" aria-labelledby="elo-board-title" {...stylex.props(styles.board)}>
        <div {...stylex.props(styles.head)}>
          <h2 id="elo-board-title" {...stylex.props(typography.homeCardTitle, styles.title, styles.wide)}>{m.elo_title()}</h2>
          <button
            type="button"
            data-testid="elo-board-toggle"
            aria-expanded={open}
            aria-controls="elo-board-body"
            onClick={() => setOpen(!open)}
            {...stylex.props(styles.toggle)}
          >
            <span {...stylex.props(typography.homeCardTitle, styles.title, styles.oneLine)}>{m.elo_title()}</span>
            {names.length > 0 && !open ? (
              <span aria-hidden="true" data-testid="elo-board-marquee" {...stylex.props(typography.appText, styles.marquee)}>
                <span {...stylex.props(styles.track)}>
                  {[0, 1].map((copy) => (
                    <span key={copy} {...stylex.props(styles.copy)}>
                      {names.map((n) => <span key={n}>{n}</span>)}
                    </span>
                  ))}
                </span>
              </span>
            ) : null}
            <span {...stylex.props(styles.chevron)}>
              {open ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />}
            </span>
          </button>
          <button
            type="button"
            data-testid="elo-board-how"
            aria-label={m.elo_how()}
            title={m.elo_how()}
            aria-expanded={how}
            onClick={() => setHow(true)}
            {...stylex.props(styles.help)}
          >
            <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
          {/* How it is counted, in three lines, as a dialog in the middle of the screen with its own close button (SKATGO-140,
              the human: 「点问号显示算法，文字啰嗦，而且点开后那个toast不好关……改成行业最佳实践」). */}
          {how ? (
            <Modal title={m.elo_how()} onClose={() => setHow(false)} testId="elo-board-how-text">
              <ul {...stylex.props(typography.appText, styles.howList)}>
                <li>{m.elo_how_game()}</li>
                <li>{m.elo_how_win({ start: ELO_START, ki: board.ki })}</li>
                <li>{m.elo_how_provisional({ n: ELO_PROVISIONAL_DAYS })}</li>
              </ul>
            </Modal>
          ) : null}
        </div>
        <div id="elo-board-body" data-open={open ? 'true' : undefined} {...stylex.props(styles.body, !open && styles.folded)}>
          <ol aria-label={m.elo_column()} {...stylex.props(styles.rows)}>
            {lines.map((l) => <EloLine key={'ki' in l ? 'ki' : `${l.row.rank}-${l.row.nickname}`} line={l} />)}
          </ol>
        </div>
      </section>
    </Panel>
  )
}

/** One row: a player's rank, name and number, or the AI's number by its blue tag. */
function EloLine({ line: l }: { line: Line }) {
  return 'ki' in l ? (
    <li data-testid="elo-board-ki" data-elo={l.ki} {...stylex.props(typography.appText, styles.row)}>
      <span {...stylex.props(styles.rank)} />
      <span {...stylex.props(styles.what)}><Who side="ai" /></span>
      <span {...stylex.props(styles.score)}>{l.ki}</span>
    </li>
  ) : (
    <li data-testid="elo-board-row" data-rank={l.row.rank} data-elo={l.row.elo} {...stylex.props(typography.appText, styles.row)}>
      <span {...stylex.props(styles.muted, styles.rank)}>{l.row.rank}</span>
      <span data-testid="elo-board-name" {...stylex.props(styles.what)}>{l.row.nickname}</span>
      <span {...stylex.props(styles.score)}>
        {l.row.elo}
        {l.row.provisional ? <span {...stylex.props(styles.muted)}>?</span> : null}
      </span>
    </li>
  )
}

const styles = stylex.create({
  board: { display: 'flex', flexDirection: 'column', gap: space.x12, flexGrow: 1, minHeight: 0 },
  // The title and the question mark; on a phone the line that folds the board says the title.
  head: { position: 'relative', display: 'flex', alignItems: 'center', gap: space.x8 },
  title: { margin: 0, color: color.navy },
  wide: { display: { default: 'block', [bp.phone]: 'none' } },
  toggle: {
    display: { default: 'none', [bp.phone]: 'flex' },
    flexGrow: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: space.x12,
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
  // The folded line stays one line: the title whole, a long name cut short.
  oneLine: { flexShrink: 0, whiteSpace: 'nowrap' },
  // The names in a window of their own, running from right to left; under reduced motion they stand still.
  marquee: { display: 'flex', flexGrow: 1, minWidth: 0, overflow: 'hidden', color: color.slate },
  track: {
    display: 'flex',
    flexShrink: 0,
    animationName: { default: slide, [bp.reducedMotion]: 'none' },
    animationDuration: timing.marquee,
    animationTimingFunction: timing.steady,
    animationIterationCount: 'infinite',
  },
  chevron: { display: 'inline-flex', flexShrink: 0 },
  copy: { display: 'flex', flexShrink: 0, gap: space.x24, paddingInlineEnd: space.x24, whiteSpace: 'nowrap' },
  help: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: color.info,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: border.focus,
    outlineColor: color.info,
    outlineOffset: border.focusOffset,
    borderRadius: radii.column,
  },
  // The explanation, over the page under the title: a white card of its own.
  howList: { display: 'flex', flexDirection: 'column', gap: space.x8, margin: 0, paddingInlineStart: space.x20, color: color.text },
  body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 },
  folded: { display: { default: 'flex', [bp.phone]: 'none' } },
  muted: { margin: 0, color: color.slate, flexShrink: 0 },
  // On a narrow screen the list is never full height either (SKATGO-144, the human: 「elo也在窄屏上也不能全高，仍然要限定高度」): five rows
  // and a half, the rest scrolling; on PC the card's row sets its height.
  rows: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, maxHeight: { default: null, [bp.cards]: dims.eloListNarrow }, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
    gap: space.x12,
    paddingBlock: space.x2,
    // The number keeps clear of the list's scroll bar (the human: 「数字的右padding太小吧」).
    paddingInlineStart: space.x8,
    paddingInlineEnd: space.x16,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  rank: { minWidth: space.x24 },
  what: { flexGrow: 1, minWidth: 0 },
  score: { flexShrink: 0 },
})
