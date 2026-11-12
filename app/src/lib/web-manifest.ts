import { themeColor } from '../theme/constants'

// The web app manifest (SKATGO-185), answered by server.ts at /site.webmanifest: SkatGo opens as an app of its own —
// installed from the browser, or as the Android app (android/, a Trusted Web Activity of this site) — on the page's white,
// the colour the `theme-color` meta takes from the same constant. The icons are those cut from the logo (SKATGO-93).

export const WEB_MANIFEST = {
  id: '/',
  name: 'SkatGo',
  short_name: 'SkatGo',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  theme_color: themeColor,
  background_color: themeColor,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

export function webManifest(): Response {
  return new Response(JSON.stringify(WEB_MANIFEST), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}
