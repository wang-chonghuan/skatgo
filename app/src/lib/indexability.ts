// These routes are card tables — app screens and personal execution state — not search entry pages. Shared
// by head and sitemap. A route with a parameter (a private table, SKATGO-61) covers every address it
// matches. Free play's table joined them in SKATGO-69 (the human): a table is one screen with nothing
// below it to read, and its search entry is the front page.
export const PRIVATE_PAGES = ['/play', '/daily/play', '/table/$id'] as const

const matches = (path: string, route: string) => new RegExp(`^${route.replace(/\$[A-Za-z0-9_]+/g, '[^/]+')}$`).test(path)

export function isIndexable(path: string): boolean {
  return !PRIVATE_PAGES.some((page) => matches(path, page))
}
