import * as stylex from '@stylexjs/stylex'
import { useEffect, useRef } from 'react'

import { FEES, TIERS, type Tier } from '~/lib/skat/league'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { elev } from '../../theme/elevation.stylex'
import { space } from '../../theme/scale.stylex'
import { dims, radii } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'

// The League's tiers and their names (SKATGO-204): the short name ("Gold") and the League's ("Gold League", German
// "Gold-Liga", "Legenden-Liga"), and the six as a row of picture cards that scrolls sideways (the human: 「tiers最好做成横向
// 滚动的carousel，然后玩家当前位于的段位在最左侧。要用彩色卡片，背景是档位的图片」), rendered on the server and again in the
// browser with the player's own tier marked and scrolled to the left edge.

const SHORT: Record<Tier, () => string> = {
  bronze: m.league_tier_bronze, silver: m.league_tier_silver, gold: m.league_tier_gold,
  platinum: m.league_tier_platinum, diamond: m.league_tier_diamond, legend: m.league_tier_legend,
}
const FULL: Record<Tier, () => string> = {
  bronze: m.league_name_bronze, silver: m.league_name_silver, gold: m.league_name_gold,
  platinum: m.league_name_platinum, diamond: m.league_name_diamond, legend: m.league_name_legend,
}
/** A tier's own name, "Gold". */
export const tierName = (tier: number) => SHORT[TIERS[tier]]()
/** A tier's League, "Gold League" / "Gold-Liga". */
export const leagueName = (tier: number) => FULL[TIERS[tier]]()

/** The six tiers, Bronze to Legend, each a card on its own picture (`public/league/<tier>.webp`, flat, its colour edge
 *  to edge) with its name and entry fee; the player's own tagged and, once the browser has the row, at its left edge. */
export function Tiers({ mine }: { mine: number | null }) {
  const row = useRef<HTMLOListElement>(null)
  useEffect(() => {
    // Once laid out: the row scrolled by however far the player's card stands from its left edge.
    const frame = requestAnimationFrame(() => {
      const list = row.current
      const own = mine === null ? null : list?.children[mine]
      if (list && own) list.scrollLeft += own.getBoundingClientRect().left - list.getBoundingClientRect().left
    })
    return () => cancelAnimationFrame(frame)
  }, [mine])
  return (
    <section data-testid="league-tiers" aria-labelledby="league-tiers-title" {...stylex.props(styles.box)}>
      <h2 id="league-tiers-title" {...stylex.props(typography.optionTitle, styles.ink)}>{m.league_tiers()}</h2>
      <ol ref={row} {...stylex.props(styles.row)}>
        {TIERS.map((t, i) => (
          <li key={t} data-testid="league-tier" data-tier={t} data-fee={FEES[i]} data-you={mine === i ? 'true' : undefined} {...stylex.props(styles.card)}>
            <img src={`/league/${t}.webp`} alt="" loading="lazy" {...stylex.props(styles.picture)} />
            {mine === i ? <span {...stylex.props(styles.you)}><Who side="you" /></span> : null}
            <span {...stylex.props(styles.words)}>
              <span {...stylex.props(typography.homeCardTitle, styles.onColor)}>{tierName(i)}</span>
              <span {...stylex.props(typography.appText, styles.onColorSoft)}>{m.league_fee_deal({ coins: FEES[i] })}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

const styles = stylex.create({
  box: { display: 'flex', flexDirection: 'column', gap: space.x12, minWidth: 0 },
  ink: { margin: 0, color: color.navy },
  onColor: { color: color.onColor },
  onColorSoft: { color: color.onColorSoft },
  // One row that scrolls sideways, each card stopping at the left edge; room under it for the cards' shadow.
  row: {
    display: 'flex',
    gap: space.x12,
    margin: 0,
    padding: 0,
    paddingBottom: space.x12,
    listStyle: 'none',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
  },
  card: {
    position: 'relative',
    flexShrink: 0,
    flexBasis: dims.tierCard,
    aspectRatio: dims.homeCard,
    overflow: 'hidden',
    borderRadius: radii.tile,
    boxShadow: elev.option,
    scrollSnapAlign: 'start',
  },
  picture: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  you: { position: 'absolute', top: space.x12, left: space.x12 },
  words: {
    position: 'absolute',
    left: space.x16,
    right: space.x16,
    bottom: space.x16,
    display: 'flex',
    flexDirection: 'column',
    gap: space.x2,
  },
})
