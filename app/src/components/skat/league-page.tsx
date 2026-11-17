import * as stylex from '@stylexjs/stylex'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, LeagueHome, LeagueTable } from './client-part'
import { Tiers } from './league-tiers'
import { TableLoading } from './table-loading'

/**
 * The League (SKATGO-204): a sub-page on the grey page — its H1, then in the browser the player's own League (tier,
 * points, coins and the one way to play), the six tiers with their fees and the Legend board; until the browser has it,
 * the tiers. Personal, never indexed (lib/indexability.ts).
 */
export function LeaguePage() {
  return (
    <div data-testid="league" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.league_title()}</h1>
        <ClientPart fallback={<Tiers mine={null} />}>
          <LeagueHome />
        </ClientPart>
      </section>
    </div>
  )
}

/** A League round's table (SKATGO-204): the full-screen table, its title for screen readers only. */
export function LeaguePlayPage() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.league_play_meta_title()}</h1>
      <ClientPart fallback={<TableLoading />}>
        <LeagueTable />
      </ClientPart>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column' },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    boxSizing: 'border-box',
    paddingTop: { default: space.x32, [bp.phone]: space.x16 },
    paddingBottom: { default: space.x72, [bp.phone]: space.x36 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  play: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  hidden: {
    position: 'absolute',
    width: dims.visuallyHidden,
    height: dims.visuallyHidden,
    margin: 0,
    overflow: 'hidden',
    clipPath: dims.visuallyHiddenClip,
    whiteSpace: 'nowrap',
  },
})
