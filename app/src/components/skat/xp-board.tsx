import * as stylex from '@stylexjs/stylex'
import { ChevronDown, ChevronUp, CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { XpBoard as Board } from '~/lib/skat/xp'
import { readXpBoard } from '~/lib/xp-api'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { marqueeSlide, timing } from '../../theme/effects.stylex'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Panel } from './ui'
import { XpHow } from './xp-earned'

/** The folded board's names, running sideways without end. */
const slide = stylex.keyframes({ from: { transform: marqueeSlide.start }, to: { transform: marqueeSlide.end } })

/**
 * The week's XP board in the front page's long card (SKATGO-172, the human: 「这个卡片大小规格行为，还和当前的elo卡片一样。elo的卡片和
 * 算法都删除」): every account with XP this week, the most first — rank, name, 🔥 days in a row, the week's XP — the
 * player's own row marked; under the title what earns XP and when the week starts again. The tiers open from a circled
 * question mark beside the title, in a `Modal`. Its frame is the Elo card's (SKATGO-123/140/144): `fill`, as tall as
 * where it sits, the list scrolling inside; wherever the page is one column (`bp.cards`) folded behind one line where
 * the players run slowly sideways, a tap opening it to five rows and a half. Rendered on the server as nobody; in the
 * browser asked again as the player, so their row is marked.
 */
export function XpBoard({ board: first, fill = false }: { board: Board; fill?: boolean }) {
  const [board, setBoard] = useState(first)
  const [open, setOpen] = useState(false)
  const [how, setHow] = useState(false)
  useEffect(() => {
    void readXpBoard().then((b) => b && setBoard(b))
  }, [])
  const names = board.rows.map((r) => `${r.rank}. ${r.nickname} · ${m.xp_points({ n: r.xp })}`)
  return (
    <Panel fill={fill}>
      <section data-testid="xp-board" aria-labelledby="xp-board-title" {...stylex.props(styles.board)}>
        <div {...stylex.props(styles.head)}>
          <h2 id="xp-board-title" {...stylex.props(typography.homeCardTitle, styles.title, styles.wide)}>{m.xp_title()}</h2>
          <button
            type="button"
            data-testid="xp-board-toggle"
            aria-expanded={open}
            aria-controls="xp-board-body"
            onClick={() => setOpen(!open)}
            {...stylex.props(styles.toggle)}
          >
            <span {...stylex.props(typography.homeCardTitle, styles.title, styles.oneLine)}>{m.xp_title()}</span>
            {names.length > 0 && !open ? (
              <span aria-hidden="true" data-testid="xp-board-marquee" {...stylex.props(typography.appText, styles.marquee)}>
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
            data-testid="xp-board-how"
            aria-label={m.xp_how()}
            title={m.xp_how()}
            aria-expanded={how}
            onClick={() => setHow(true)}
            {...stylex.props(styles.help)}
          >
            <CircleHelp aria-hidden="true" size={icon.inline} strokeWidth={icon.outline} />
          </button>
          {how ? <XpHow onClose={() => setHow(false)} testId="xp-board-how-text" /> : null}
        </div>
        <div id="xp-board-body" data-open={open ? 'true' : undefined} {...stylex.props(styles.body, !open && styles.folded)}>
          <p data-testid="xp-board-sub" {...stylex.props(typography.appText, styles.muted)}>
            {board.resetsIn === 1 ? m.xp_sub_tomorrow() : m.xp_sub({ n: board.resetsIn })}
          </p>
          {board.rows.length === 0 ? (
            <p data-testid="xp-board-empty" {...stylex.props(typography.appText, styles.muted)}>{m.xp_empty()}</p>
          ) : (
            <ol aria-label={m.xp_column()} {...stylex.props(styles.rows)}>
              {board.rows.map((r) => (
                <li key={`${r.rank}-${r.nickname}`} data-testid="xp-board-row" data-rank={r.rank} data-xp={r.xp} data-you={r.you ? 'true' : undefined} {...stylex.props(typography.appText, styles.row, r.you && styles.own)}>
                  <span {...stylex.props(styles.muted, styles.rank)}>{r.rank}</span>
                  <span data-testid="xp-board-name" {...stylex.props(styles.what)}>
                    {r.nickname}
                    {r.you ? <span {...stylex.props(styles.tag)}><Who side="you" /></span> : null}
                  </span>
                  <span data-testid="xp-board-streak" {...stylex.props(styles.streak)}>{`🔥 ${r.streak}`}</span>
                  <span {...stylex.props(typography.appBtnStrong, styles.score)}>{r.xp}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </Panel>
  )
}

const styles = stylex.create({
  board: { display: 'flex', flexDirection: 'column', gap: space.x12, flexGrow: 1, minHeight: 0 },
  // The title and the question mark; in one column the line that folds the board says the title.
  head: { position: 'relative', display: 'flex', alignItems: 'center', gap: space.x8 },
  title: { margin: 0, color: color.navy },
  wide: { display: { default: 'block', [bp.cards]: 'none' } },
  toggle: {
    display: { default: 'none', [bp.cards]: 'flex' },
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
  // The line on the week sits right over the rows, so three rows fit the card beside the progress card unscrolled.
  body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 },
  folded: { display: { default: 'flex', [bp.cards]: 'none' } },
  muted: { margin: 0, color: color.slate, flexShrink: 0 },
  // On a narrow screen the list is never full height either (SKATGO-144): five rows and a half, the rest scrolling; on
  // PC the card's row sets its height.
  rows: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, maxHeight: { default: null, [bp.cards]: dims.xpListNarrow }, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    flexShrink: 0,
    gap: space.x12,
    paddingBlock: space.x2,
    // The number keeps clear of the list's scroll bar.
    paddingInlineStart: space.x8,
    paddingInlineEnd: space.x16,
    borderBottomWidth: border.hair,
    borderBottomStyle: 'solid',
    borderBottomColor: color.hairline,
    color: color.navy,
  },
  // The player's own row, as the daily board marks it.
  own: { backgroundColor: color.goodSoft },
  rank: { minWidth: space.x24 },
  tag: { marginInlineStart: space.x6 },
  what: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  streak: { flexShrink: 0, color: color.amber, whiteSpace: 'nowrap' },
  score: { flexShrink: 0 },
})
