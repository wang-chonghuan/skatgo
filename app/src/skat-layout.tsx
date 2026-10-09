import { Outlet } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { AskLauncher } from '~/components/skat/ask'
import { LegalFooter } from '~/components/skat/legal-page'
import { LandingHeader, useFrame, useSection } from '~/components/skat/frame'
import { bp } from './theme/breakpoints.stylex'
import { color } from './theme/color.stylex'
import { dims } from './theme/shape.stylex'
import { typography } from './theme/type'

// The frame around every page, in the lobby design (SKATGO-26, reference.md). Each page wears the
// frame of its kind (frameOf):
//   every page but the tables — the public site's white header (SKATGO-43, lessons since SKATGO-47),
//                       over the front page's white page or a sub-page's grey one;
//   play              — the card table fills the screen, with its own side panel and way out.
// The floating assistant comes after, and decides itself which pages it is on.
export function SkatLayout() {
  const frame = useFrame()
  const section = useSection()
  if (frame === 'landing') {
    return (
      <div {...stylex.props(typography.frame, styles.page, section === 'home' && styles.landing)}>
        <div {...stylex.props(styles.screenOnly)}>
          <LandingHeader />
        </div>
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
        <div {...stylex.props(styles.screenOnly)}>
          <LegalFooter />
          <AskLauncher />
        </div>
      </div>
    )
  }
  return (
    <div {...stylex.props(typography.frame, styles.page, styles.table)}>
      <main {...stylex.props(styles.main)}>
        <Outlet />
      </main>
      <AskLauncher />
    </div>
  )
}

const styles = stylex.create({
  page: {
    minHeight: dims.screen,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: color.page,
    color: color.text,
    colorScheme: 'light',
  },
  landing: { backgroundColor: color.surface },
  // The table is exactly one screen and never scrolls (SKATGO-29).
  table: { height: dims.screenDynamic, minHeight: dims.screenDynamic, overflow: 'hidden', backgroundColor: color.feltOuter },
  // The header, footer and assistant stay off paper (SKATGO-50); on screen the wrapper is no box at all,
  // so the header still sticks to the page.
  screenOnly: { display: { default: 'contents', [bp.print]: 'none' } },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
})
