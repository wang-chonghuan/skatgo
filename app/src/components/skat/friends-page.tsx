import * as stylex from '@stylexjs/stylex'

import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'
import { ClientPart, OpenTable, PrivateTable } from './client-part'
import { TableLoading } from './table-loading'

/**
 * Skat with friends (SKATGO-61): the public page a search for "Skat mit Freunden online spielen" lands
 * on — its title and one line, rendered on the server — and, in the browser, the name and the button that open
 * one. How a table goes is on About SkatGo (SKATGO-134).
 */
export function FriendsPage() {
  return (
    <div data-testid="friends" {...stylex.props(styles.root)}>
      <section {...stylex.props(styles.column)}>
        <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.friends_title()}</h1>
        <p {...stylex.props(typography.landingBody, styles.lead)}>{m.friends_lead()}</p>
        {/* The form needs the browser; until it is there, nothing stands in its place. */}
        <ClientPart fallback={<span />}>
          <OpenTable />
        </ClientPart>
      </section>
    </div>
  )
}

/**
 * A private table's own page (SKATGO-61): personal, never indexed. Its title is a heading for screen
 * readers only; the lobby or the table renders in the browser, the logo turning on the felt until then (SKATGO-93).
 */
export function TablePage() {
  return (
    <div {...stylex.props(styles.play)}>
      <h1 {...stylex.props(styles.hidden)}>{m.table_title()}</h1>
      <ClientPart fallback={<TableLoading />}>
        <PrivateTable />
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
    paddingBlock: { default: space.x32, [bp.phone]: space.x16 },
    paddingInline: { default: space.x24, [bp.phone]: space.x12 },
  },
  title: { margin: 0, color: color.navy },
  lead: { margin: 0, color: color.navy },
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
