import * as stylex from '@stylexjs/stylex'

import { FEES, TIERS, type Tier } from '~/lib/skat/league'
import { m } from '~/paraglide/messages'
import { color } from '../../theme/color.stylex'
import { border, space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { Who } from './daily-comparison'
import { Panel } from './ui'

// The League's tiers and their names (SKATGO-204): the short name ("Gold") and the League's ("Gold League", German
// "Gold-Liga", "Legenden-Liga"), and the list of the six with their entry fees, rendered on the server and again in the
// browser with the player's own tier marked.

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

/** The six tiers, highest first as a ladder reads, each with its entry fee; the player's own marked. */
export function Tiers({ mine }: { mine: number | null }) {
  return (
    <Panel>
      <section data-testid="league-tiers" aria-labelledby="league-tiers-title" {...stylex.props(styles.box)}>
        <div {...stylex.props(styles.head)}>
          <h2 id="league-tiers-title" {...stylex.props(typography.optionTitle, styles.ink)}>{m.league_tiers()}</h2>
          <span {...stylex.props(typography.meta, styles.slate)}>{m.league_fee()}</span>
        </div>
        <ol {...stylex.props(styles.rows)}>
          {TIERS.map((t, i) => i).reverse().map((i) => (
            <li key={TIERS[i]} data-testid="league-tier" data-tier={TIERS[i]} data-fee={FEES[i]} data-you={mine === i ? 'true' : undefined} {...stylex.props(typography.appText, styles.row, mine === i && styles.own)}>
              <span {...stylex.props(styles.name)}>
                {tierName(i)}
                {mine === i ? <span {...stylex.props(styles.tag)}><Who side="you" /></span> : null}
              </span>
              <span {...stylex.props(typography.appBtnStrong, styles.fee)}>{m.league_coins({ coins: FEES[i] })}</span>
            </li>
          ))}
        </ol>
      </section>
    </Panel>
  )
}

const styles = stylex.create({
  box: { display: 'flex', flexDirection: 'column', gap: space.x12 },
  head: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: space.x12 },
  ink: { margin: 0, color: color.navy },
  slate: { margin: 0, color: color.slate },
  rows: { display: 'flex', flexDirection: 'column', margin: 0, padding: 0, listStyle: 'none' },
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
  // The player's own tier, as the boards mark the player's own row.
  own: { backgroundColor: color.goodSoft },
  name: { flexGrow: 1, minWidth: 0 },
  tag: { marginInlineStart: space.x6 },
  fee: { flexShrink: 0, textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
})
