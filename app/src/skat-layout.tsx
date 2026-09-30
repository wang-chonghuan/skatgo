import { Outlet } from '@tanstack/react-router'
import * as stylex from '@stylexjs/stylex'

import { AskLauncher } from '~/components/skat/ask'
import { AppShell, LandingHeader, Rail, TabBar, useCardColourTheme, useSection } from '~/components/skat/frame'
import { color } from './theme/color.stylex'
import { dims } from './theme/shape.stylex'
import { typography } from './theme/type'

// The frame around every page, in the lobby design (SKATGO-26, reference.md). Each section wears the
// frame the reference gives its kind of page:
//   the front page    — the public site's white header over a white page;
//   course and lesson — the app's rail (a bottom tab bar on a phone), and the page's own coloured band;
//   play              — the card table fills the screen, with its own side panel and way out.
// The floating assistant comes after, and decides itself which pages it is on.
export function SkatLayout() {
  const section = useSection()
  // The learner's card colours (SKATGO-27): every suit colour below reads theme/suits.stylex.ts.
  const cardColours = useCardColourTheme()
  if (section === 'home') {
    return (
      <div {...stylex.props(typography.frame, styles.page, styles.landing, cardColours)}>
        <LandingHeader />
        <main {...stylex.props(styles.main)}>
          <Outlet />
        </main>
        <AskLauncher />
      </div>
    )
  }
  if (section === 'play') {
    return (
      <div {...stylex.props(typography.frame, styles.page, styles.table, cardColours)}>
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
  table: { backgroundColor: color.feltOuter },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' },
})
