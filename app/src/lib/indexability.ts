// These routes are personal execution state, not search entry pages. Shared by head and sitemap.
export const PRIVATE_PAGES = ['/daily/play'] as const

export function isIndexable(path: string): boolean {
  return !PRIVATE_PAGES.some((page) => page === path)
}
