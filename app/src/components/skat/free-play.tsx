import * as stylex from '@stylexjs/stylex'

import { ClientPart, FreeTable } from './client-part'
import { m } from '~/paraglide/messages'
import { fill } from '../../theme/elevation.stylex'
import { dims } from '../../theme/shape.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { typography } from '../../theme/type'
import { GameReading } from './game-reading'

/**
 * Free play: a table with no lesson around it, for practice after the course or for people who already
 * play. The table retains its full first screen; public reading content follows below (SKATGO-44).
 * Cards render only in the browser, with a real product illustration while they load.
 */
export function FreePlay() {
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.tableStage)}>
        <ClientPart fallback={
          <div {...stylex.props(styles.feltHold)}>
            <img src="/hero-table.webp" alt={m.entry_art_alt()} {...stylex.props(styles.image)} />
            <p {...stylex.props(typography.body, styles.loading)}>{m.game_javascript()}</p>
          </div>
        }>
          <FreeTable />
        </ClientPart>
      </div>
      <GameReading />
    </div>
  )
}

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', flexGrow: 1 },
  tableStage: { minHeight: dims.screenDynamic },
  feltHold: { minHeight: dims.screenDynamic, backgroundImage: fill.felt, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: space.x24, padding: space.x24, boxSizing: 'border-box' },
  image: { width: '100%', maxWidth: dims.heroArt, aspectRatio: dims.heroArtRatio, objectFit: 'contain' },
  loading: { margin: 0, color: color.onColor, textAlign: 'center' },
})
