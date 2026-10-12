import * as stylex from '@stylexjs/stylex'

import { ClientPart, FreeTable } from './client-part'
import { TableLoading } from './table-loading'
import { m } from '~/paraglide/messages'
import { dims } from '../../theme/shape.stylex'
import { color } from '../../theme/color.stylex'
import { typography } from '../../theme/type'

/**
 * Free play: a table with no lesson around it, for practice after the course or for people who already
 * play. Like every table it is one screen with nothing below it (SKATGO-69, the human); its title is a
 * heading for screen readers only. Cards render only in the browser; while they load, the logo turns on
 * the felt (SKATGO-93; the illustration it replaced belongs to the front page).
 */
export function FreePlay() {
  return (
    <div {...stylex.props(styles.root)}>
      <h1 {...stylex.props(styles.hidden)}>{m.play_title()}</h1>
      <div {...stylex.props(styles.tableStage)}>
        <ClientPart fallback={
          <TableLoading>
            <p {...stylex.props(typography.body, styles.loading)}>{m.game_javascript()}</p>
          </TableLoading>
        }>
          <FreeTable />
        </ClientPart>
      </div>
    </div>
  )
}

const styles = stylex.create({
  hidden: {
    position: 'absolute',
    width: dims.visuallyHidden,
    height: dims.visuallyHidden,
    margin: 0,
    overflow: 'hidden',
    clipPath: dims.visuallyHiddenClip,
    whiteSpace: 'nowrap',
  },
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  tableStage: { minHeight: dims.screenDynamic },
  loading: { margin: 0, color: color.onColor, textAlign: 'center' },
})
