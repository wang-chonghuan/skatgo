import * as stylex from '@stylexjs/stylex'
import { Btn } from './ui'
import { m } from '~/paraglide/messages'
import { bp } from '../../theme/breakpoints.stylex'
import { color } from '../../theme/color.stylex'
import { space } from '../../theme/scale.stylex'
import { dims } from '../../theme/shape.stylex'
import { typography } from '../../theme/type'

// What the service worker (public/sw.js, SKATGO-185) shows in place of a page the network could not bring: this page in
// the language asked for, kept on the device, its address naming the page asked for (`?from=`). "Try again" asks for that
// page again.

/** The page the service worker could not bring: a path of this site, nothing else. */
function asked(): string | null {
  const from = new URLSearchParams(window.location.search).get('from')
  return from && from.startsWith('/') && !from.startsWith('//') ? from : null
}

export function OfflinePage() {
  return (
    <article data-testid="offline" {...stylex.props(styles.column)}>
      <h1 {...stylex.props(typography.landingHeading, styles.title)}>{m.offline_title()}</h1>
      <p {...stylex.props(typography.body, styles.text)}>{m.offline_text()}</p>
      <div>
        <Btn size="lg" testId="offline-retry" onClick={() => { const from = asked(); if (from) window.location.replace(from); else window.location.reload() }}>{m.offline_retry()}</Btn>
      </div>
    </article>
  )
}

const styles = stylex.create({
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.x16,
    width: '100%',
    maxWidth: dims.readingColumn,
    marginInline: 'auto',
    paddingBlock: { default: space.x32, [bp.phone]: space.x24 },
    paddingInline: { default: space.x24, [bp.phone]: space.x16 },
    boxSizing: 'border-box',
  },
  title: { margin: 0, color: color.navy },
  text: { margin: 0, color: color.text },
})
