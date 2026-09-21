import type { ReactNode } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Theme } from '@astryxdesign/core/theme'

import { LANG_TAG, SITE_URL, localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale, locales } from '~/paraglide/runtime'
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
//
// The head is in the page's language (SKATGO-1): Paraglide's middleware has settled the locale for
// the request before this renders, so the server sends each of /en, /de, /zh with its own title,
// description, canonical URL and the hreflang links that tie the three versions of a page together.

export const Route = createRootRoute({
  head: ({ matches }) => {
    // The router has already stripped the language prefix: this is the page's path in any language.
    const path = matches[matches.length - 1]?.pathname ?? '/'
    const locale = getLocale()
    const title = m.meta_title()
    const description = m.meta_description()
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        // The theme's --color-background-body, light value. A meta tag cannot read a CSS variable.
        { name: 'theme-color', content: '#F5F5F5' },
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: localizedUrl(path, locale) },
        { property: 'og:locale', content: m.og_locale() },
      ],
      links: [
        { rel: 'canonical', href: localizedUrl(path, locale) },
        ...locales.map((l) => ({ rel: 'alternate', hrefLang: LANG_TAG[l], href: localizedUrl(path, l) })),
        // No prefix: the server picks the visitor's language — exactly what x-default means.
        { rel: 'alternate', hrefLang: 'x-default', href: `${SITE_URL}${path}` },
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
    }
  },
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
    <html lang={LANG_TAG[getLocale()]} data-astryx-theme={APP_THEME_NAME} data-theme={APP_THEME_MODE}>
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

