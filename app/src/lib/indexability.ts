// These routes are card tables — app screens and personal execution state — not search entry pages. Shared
// by head and sitemap. A route with a parameter (a private table, SKATGO-61) covers every address it
// matches. Free play's table joined them in SKATGO-69 (the human): a table is one screen with nothing
// below it to read, and its search entry is the front page. A Skat-Tricks exercise is not one either (SKATGO-103,
// the human: 「单页不收录，但是题目页要收录」): the list of all of them, /skat-tricks, is the entry. A player's record of play
// is theirs alone (SKATGO-128).
export const PRIVATE_PAGES = ['/play', '/daily/play', '/table/$id', '/skat-tricks/$exercise', '/profile'] as const

const matches = (path: string, route: string) => new RegExp(`^${route.replace(/\$[A-Za-z0-9_]+/g, '[^/]+')}$`).test(path)

export function isIndexable(path: string): boolean {
  return !PRIVATE_PAGES.some((page) => matches(path, page))
}

/** Routes whose addresses come from the forum's database (SKATGO-118): each post says whether it may be indexed
 *  (`postIndexable` in lib/forum.ts), and the indexable ones are listed in /sitemap-forum.xml, not /sitemap.xml. */
export const DATA_PAGES = ['/forum/$post'] as const
