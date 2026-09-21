import type { ReactNode } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Theme } from '@astryxdesign/core/theme'

import { SkatLayout } from '~/skat-layout'
import { APP_THEME_MODE, APP_THEME_NAME, appTheme } from '~/theme'
import '~/styles/app.css'

// The document shell, taken from Parrottoon's root route with only what the course uses: the same
// head links, the same theme attributes on <html>, the same <Theme> wrapper. skatgo.com is meant to
// render exactly what parrottoon.com/skat does, and every one of these reaches the page.
//
// Left out on purpose: Parrottoon's analytics beacon (its token would count this site's visits as
// Parrottoon's), its light/dark and reading-order preferences (the course never offers either, so a
// visitor here always sees the light page a first-time Parrottoon visitor sees), and its link
// adapter (the course uses the router's own <Link>, never an Astryx `href`).

const TITLE = '斯卡特速成课 · 11 课学会德国国民牌戏'
const DESCRIPTION = '一套中文互动课程：从 32 张牌讲起，边学边练，最后和两个电脑对手打完整的一局斯卡特（Skat）。'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // The theme's --color-background-body, light value. A meta tag cannot read a CSS variable.
      { name: 'theme-color', content: '#F5F5F5' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      // The typefaces the theme names. It does not bundle them; without this link the course falls
      // back to system fonts and no longer looks like the page it was copied from.
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400..700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <SkatLayout />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // The theme's generated CSS is @scope'd to [data-astryx-theme]; writing the attributes here,
    // server-side, is what keeps the first paint themed instead of flashing unstyled.
    <html lang="en" data-astryx-theme={APP_THEME_NAME} data-theme={APP_THEME_MODE}>
      <head>
        <HeadContent />
        {/* In dev, StyleX serves the compiled atoms from a virtual endpoint; in a production build
            they are appended to the emitted CSS asset instead. */}
        {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}
      </head>
      <body>
        <Theme theme={appTheme} mode={APP_THEME_MODE}>
          {children}
        </Theme>
        <Scripts />
      </body>
    </html>
  )
}

