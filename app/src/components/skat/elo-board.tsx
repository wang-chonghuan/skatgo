import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { ELO_PROVISIONAL_DAYS, ELO_START, type EloBoard as Board, eloK } from '~/lib/skat/elo'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { carouselStepMs, icon, phoneQuery } from '../../theme/constants'
import { timing } from '../../theme/effects.stylex'
import { elev } from '../../theme/elevation.stylex'
import { border, layer, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Panel } from './ui'

type Line = { row: Board['rows'][number] } | { ki: number }

/** A line's coming in, in the folded board's carousel. */
const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })

/**
 * The tournament's Elo board in the front page's hero (SKATGO-123, the human: 「这个名单要显示出来，放到hero区域」):
 * the top players by their number, the KI's fixed number standing among them as on the daily board — after
 * any player with the same, taking no rank. How it is counted, and what a "?" means, open from a circled
 * question mark beside the title, over the page (the human: 「how it counted用一个圆圈问号图标，放在 elo标题旁边，
 * 作为toast」). `fill`: as tall as where it sits, the list scrolling inside (「可以滚动，不要那么高」), its rows dense
 * and in two columns, first down the left (「A和B」). On a phone it is folded behind one line that goes through the
 * players one by one (「手机上可能要折叠一下排名榜」, 「名字要能像carousel那样自动轮换」); a tap opens it.
 */
export function EloBoard({ board, fill = false }: { board: Board; fill?: boolean }) {
  const [open, setOpen] = useState(false)
  const [how, setHow] = useState(false)
  // The player the folded line shows; it moves on while the line is folded and seen, on a phone.
  const [shown, setShown] = useState(0)
  const count = board.rows.length
  useEffect(() => {
    if (open || count < 2 || !window.matchMedia(phoneQuery).matches) return
    const t = setInterval(() => setShown((i) => (i + 1) % count), carouselStepMs)
    return () => clearInterval(t)
  }, [open, count])
  const head = useRef<HTMLDivElement>(null)
  // The explanation closes on Escape and on a tap anywhere else.
  useEffect(() => {
    if (!how) return
    const away = (e: PointerEvent) => { if (!head.current?.contains(e.target as Node)) setHow(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setHow(false) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', key)
    }
  }, [how])
  const lines: Line[] = board.rows.map((row) => ({ row }))
  const at = board.rows.findIndex((r) => r.elo < board.ki)
  lines.splice(at >= 0 ? at : lines.length, 0, { ki: board.ki })
  const current = board.rows[shown % Math.max(count, 1)]
  // Two columns, the first down the left: 1–5 there, the rest beside it.
  const half = Math.ceil(lines.length / 2)
  return (
    <Panel fill={fill}>
      <section data-testid="elo-board" aria-labelledby="elo-board-title" {...stylex.props(styles.board)}>
        <div ref={head} {...stylex.props(styles.head)}>
          <h2 id="elo-board-title" {...stylex.props(typography.dialogTitle, styles.title, styles.wide)}>{m.elo_title()}</h2>
          <button
            type="button"
            data-testid="elo-board-toggle"
            aria-expanded={open}
            aria-controls="elo-board-body"
            onClick={() => setOpen(!open)}
            {...stylex.props(styles.toggle)}
          >
            <span {...stylex.props(typography.dialogTitle, styles.title, styles.oneLine)}>{m.elo_title()}</span>
            {current && !open ? (
              <span key={shown} aria-hidden="true" data-testid="elo-board-carousel" {...stylex.props(typography.appText, styles.leader, styles.turn)}>
                {`${current.rank}. ${current.nickname} · ${current.elo}`}
              </span>
            ) : null}
            {open ? <ChevronUp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} /> : <ChevronDown aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />}
          </button>
          <button
            type="button"
            data-testid="elo-board-how"
            aria-label={m.elo_how()}
            title={m.elo_how()}
            aria-expanded={how}
            aria-controls="elo-board-how-text"
            onClick={() => setHow(!how)}
            {...stylex.props(styles.help)}
          >
            <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
          {how ? (
            <div id="elo-board-how-text" role="dialog" aria-label={m.elo_how()} data-testid="elo-board-how-text" {...stylex.props(typography.appText, styles.howText)}>
              <p {...stylex.props(styles.howLine)}>{m.elo_lead()}</p>
              <ul {...stylex.props(styles.howList)}>
                <li>{m.elo_how_win()}</li>
                <li>{m.elo_how_start({ start: ELO_START, ki: board.ki })}</li>
                <li>{m.elo_how_change({ first: eloK(0), after: eloK(30) })}</li>
                <li>{m.elo_how_day()}</li>
                <li>{m.elo_how_provisional({ n: ELO_PROVISIONAL_DAYS })}</li>
              </ul>
            </div>
          ) : null}
        </div>
        <div id="elo-board-body" data-open={open ? 'true' : undefined} {...stylex.props(styles.body, !open && styles.folded)}>
          <div {...stylex.props(styles.scroll)}>
            {[lines.slice(0, half), lines.slice(half)].map((column, c) => (
              <ol key={c} aria-label={m.elo_column()} start={c === 0 ? undefined : half + 1} {...stylex.props(styles.rows)}>
                {column.map((l) => <EloLine key={'ki' in l ? 'ki' : `${l.row.rank}-${l.row.nickname}`} line={l} />)}
              </ol>
            ))}
          </div>
        </div>
      </section>
    </Panel>
  )
}

/** One row: a player's rank, name and number, or the AI's number by its blue tag. */
function EloLine({ line: l }: { line: Line }) {
  return 'ki' in l ? (
    <li data-testid="elo-board-ki" data-elo={l.ki} {...stylex.props(typography.boardDense, styles.row)}>
      <span {...stylex.props(styles.rank)} />
      <span {...stylex.props(styles.what)}><Who side="ai" /></span>
      <span {...stylex.props(styles.score)}>{l.ki}</span>
    </li>
  ) : (
    <li data-testid="elo-board-row" data-rank={l.row.rank} data-elo={l.row.elo} {...stylex.props(typography.boardDense, styles.row)}>
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
  leader: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: color.slate },
  turn: { animationName: { default: fadeIn, [bp.reducedMotion]: 'none' }, animationDuration: timing.progress },
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
  howText: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: layer.tip,
    width: '100%',
    maxWidth: dims.readingColumn,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: space.x8,
    marginTop: space.x8,
    padding: space.x16,
    backgroundColor: color.surface,
    borderWidth: border.hair,
    borderStyle: 'solid',
    borderColor: color.hairline,
    borderRadius: radii.option,
    boxShadow: elev.panel,
    color: color.text,
  },
  howLine: { margin: 0, color: color.text },
  howList: { display: 'flex', flexDirection: 'column', gap: space.x4, margin: 0, paddingInlineStart: space.x20 },
  body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 },
  folded: { display: { default: 'flex', [bp.phone]: 'none' } },
  muted: { margin: 0, color: color.slate, flexShrink: 0 },
  // The two columns scroll together; on a phone, opened, they stand one under the other.
  scroll: {
    display: 'grid',
    gridTemplateColumns: { default: dims.twoColumns, [bp.phone]: dims.oneColumn },
    alignContent: 'start',
    columnGap: space.x16,
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  rows: { display: 'flex', flexDirection: 'column', minWidth: 0, margin: 0, padding: 0, listStyle: 'none' },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
    gap: space.x12,
    paddingBlock: space.x2,
    paddingInline: space.x4,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  rank: { minWidth: space.x24 },
  what: { flexGrow: 1, minWidth: 0 },
  score: { flexShrink: 0 },
})
