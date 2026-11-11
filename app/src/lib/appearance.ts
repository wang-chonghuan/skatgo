// Night mode (SKATGO-184, the human: 「需要夜间模式，因为夜间太刺眼……实现精美的夜间模式」). The palette carries a day and a
// night value for each colour that differs (theme/color.stylex.ts, `light-dark()`); which one shows is the page's
// `color-scheme`, set by `data-theme` on <html> (the Astryx theme's rules): absent, the device's own light or dark;
// `light` or `dark`, the one chosen in the settings. The choice is kept in a cookie, not with the other settings in
// localStorage, because the server must read it to render the first paint in it — a page that turned dark after a
// script ran would flash white first.

import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { create } from 'zustand'

import { nightProbe, themeColor, themeColorDark } from '~/theme/constants'

export type Appearance = 'system' | 'light' | 'dark'
export const APPEARANCES: Appearance[] = ['system', 'light', 'dark']

const COOKIE = 'skatgo_theme'
/** A year and a bit, as the other choices a visitor makes here last. */
const MAX_AGE = 400 * 24 * 60 * 60

/** The choice a `Cookie` header carries: `light` or `dark`, anything else following the device. */
export function appearanceOf(cookies: string): Appearance {
  const raw = cookies
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1)
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}

/** Whether this browser can show night mode at all: the palette's night values need `light-dark()` (theme/color.stylex.ts). */
export const nightSupported = () => typeof CSS !== 'undefined' && CSS.supports('color', nightProbe)

/** The choice behind the page's own request, for the root route's loader. */
export const readAppearance = createIsomorphicFn()
  .server((): Appearance => appearanceOf(getRequest().headers.get('cookie') ?? ''))
  .client((): Appearance => appearanceOf(document.cookie))

/** The choice made on this page since it loaded; null until one is made, when the loader's answer stands. */
export const useAppearance = create<{ chosen: Appearance | null; choose: (a: Appearance) => void }>()((set) => ({
  chosen: null,
  choose: (chosen) => {
    document.cookie = chosen === 'system' ? `${COOKIE}=; Path=/; Max-Age=0; SameSite=Lax` : `${COOKIE}=${chosen}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`
    paintToolbar(chosen)
    set({ chosen })
  },
}))

/** The phone's toolbar colour for a choice, as `theme-color` metas: one per scheme when following the device. */
export function toolbarMetas(a: Appearance) {
  if (a === 'system') {
    return [
      { name: 'theme-color', media: '(prefers-color-scheme: light)', content: themeColor },
      { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: themeColorDark },
    ]
  }
  return [{ name: 'theme-color', content: a === 'dark' ? themeColorDark : themeColor }]
}

/** Repaints the toolbar after a choice on the page: the metas the head was rendered with, rewritten in place. */
function paintToolbar(a: Appearance) {
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
  metas.forEach((meta) => {
    const device = meta.media ? meta.media.includes('dark') : window.matchMedia('(prefers-color-scheme: dark)').matches
    const night = a === 'dark' || (a === 'system' && device)
    meta.content = night ? themeColorDark : themeColor
  })
}
