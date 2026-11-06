import * as stylex from '@stylexjs/stylex'
import { CircleHelp } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { XpBoard as Board } from '~/lib/skat/xp'
import { readXpBoard } from '~/lib/xp-api'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { icon } from '../../theme/constants'
import { border, space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Panel } from './ui'
import { XpHow } from './xp-earned'

/**
 * The week's XP board in the front page's long card (SKATGO-172, the human: 「这个卡片大小规格行为，还和当前的elo卡片一样。elo的卡片和
 * 算法都删除」): every account with XP this week, the most first — rank, name, 🔥 days in a row, the week's XP — the
 * player's own row marked; the title says both, "This week's XP and streaks" (the human: 「Every deal earns XP · starts again
 * in 3 days 这句去掉。标题改为本周经验和连胜天数」). The tiers open from a circled
 * question mark beside the title, in a `Modal`. On PC its frame is the Elo card's (SKATGO-123/140/144): `fill`, as tall as
 * where it sits, the list scrolling inside. Wherever the page is one column (`bp.cards`) the list shows the first five and
 * scrolls, nothing folded and nothing running sideways (the human: 「经验表，pc上不变，手机上显示前5名，然后可以滚动，不要横向滚动了」).
 * Rendered on the server as nobody; in the browser asked again as the player, so their row is marked.
 */
export function XpBoard({ board: first, fill = false }: { board: Board; fill?: boolean }) {
  const [board, setBoard] = useState(first)
  const [how, setHow] = useState(false)
  useEffect(() => {
    void readXpBoard().then((b) => b && setBoard(b))
  }, [])
  return (
    <Panel fill={fill}>
      <section data-testid="xp-board" aria-labelledby="xp-board-title" {...stylex.props(styles.board)}>
        <div {...stylex.props(styles.head)}>
          <h2 id="xp-board-title" {...stylex.props(typography.homeCardTitle, styles.title)}>{m.xp_title()}</h2>
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
        <div id="xp-board-body" {...stylex.props(styles.body)}>
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
  // The title and the question mark.
  head: { position: 'relative', display: 'flex', alignItems: 'center', gap: space.x8 },
  title: { margin: 0, color: color.navy },
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
  body: { display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 },
  muted: { margin: 0, color: color.slate, flexShrink: 0 },
  // In one column the first five rows show and the rest scroll (SKATGO-172); on PC the card's row sets its height.
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
