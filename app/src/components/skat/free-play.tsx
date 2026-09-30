import * as stylex from '@stylexjs/stylex'

import { ClientPart, FreeTable } from './client-part'
import { m } from '~/paraglide/messages'
import { fill } from '../../theme/elevation.stylex'
import { dims } from '../../theme/shape.stylex'

/**
 * Free play: a table with no lesson around it, for practice after the course or for people who already
 * play. The table is the whole screen and the page does not scroll (SKATGO-26, SKATGO-29); its title is a
 * heading for screen readers and search engines only. The table renders in the browser; until it
 * arrives, bare felt holds its place.
 */
export function FreePlay() {
  return (
    <div {...stylex.props(styles.root)}>
      <h1 {...stylex.props(styles.hidden)}>{m.play_title()}</h1>
      <ClientPart fallback={<div aria-hidden="true" {...stylex.props(styles.feltHold)} />}>
        <FreeTable />
      </ClientPart>
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  feltHold: { minHeight: dims.screenDynamic, backgroundImage: fill.felt },
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
