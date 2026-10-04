import { Outlet, useRouterState } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { AskLauncher } from '~/components/skat/ask'
import { LegalFooter } from '~/components/skat/legal-page'
import { AppShell, LandingHeader, Rail, TabBar, useCardColourTheme, useFrame, useSection } from '~/components/skat/frame'
import { color } from './theme/color.stylex'
import { dims } from './theme/shape.stylex'
import { typography } from './theme/type'

// The frame around every page, in the lobby design (SKATGO-26, reference.md). Each page wears the
// frame of its kind (frameOf):
//   the front page, and the tournament, course and rules it links to — the public site's white header
//                       (SKATGO-43), over the front page's white page or a sub-page's grey one;
//   a lesson          — the app's rail (a bottom tab bar on a phone), and the lesson's own coloured band;
//   play              — the card table fills the screen, with its own side panel and way out.
// The floating assistant comes after, and decides itself which pages it is on.
export function SkatLayout() {
  const frame = useFrame()
  const section = useSection()
  const freePlay = useRouterState({ select: (s) => s.location.pathname === '/play' })
  // The learner's card colours (SKATGO-27): every suit colour below reads theme/suits.stylex.ts.
  const cardColours = useCardColourTheme()
  if (frame === 'landing') {
    return (
      <div {...stylex.props(typography.frame, styles.page, section === 'home' && styles.landing, cardColours)}>
        <LandingHeader />
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
        <LegalFooter />
        <AskLauncher />
      </div>
    )
  }
  if (frame === 'table') {
    return (
      <div {...stylex.props(typography.frame, styles.page, freePlay ? styles.freePlay : styles.table, cardColours)}>
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
        <AskLauncher />
      </div>
    )
  }
  return (
    <div {...stylex.props(typography.frame, styles.page, cardColours)}>
      <Rail />
      <AppShell>
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
      </AppShell>
      <TabBar />
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
  freePlay: { position: 'relative', backgroundColor: color.page },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
})
