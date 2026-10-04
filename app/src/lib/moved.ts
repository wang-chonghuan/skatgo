import { localizeHref } from '~/paraglide/runtime'
import { GUIDES, lessonPath } from './skat/lessons/guide'

// Addresses that have moved, answered with a permanent redirect before the language middleware sees
// them (src/server.ts):
//   /zh/...            the Chinese pages, removed in SKATGO-28 — the same page in English;
//   /{l}/lesson/{id}   a lesson by number, before SKATGO-29 — the lesson under its own slug;
//   /de/course, /de/play — German pages now have German addresses (SKATGO-29): /de/kurs, /de/spielen.
// Returns the new path (with the query) or null when the address has not moved.
export function movedTo(pathname: string, search: string): string | null {
  if (/^\/de\/?$/.test(pathname)) return `/${search}`
  if (pathname === '/en/') return `/en${search}`
  if (pathname === '/zh' || pathname.startsWith('/zh/')) return `/en${pathname.slice(3)}${search}`
  const lesson = /^\/(en|de)\/lesson\/([^/]+)\/?$/.exec(pathname)
  if (lesson) {
    const locale = lesson[1] as 'en' | 'de'
    const target = lesson[2] in GUIDES[locale] ? lessonPath(lesson[2], locale) : '/course'
    return `${localizeHref(target, { locale })}${search}`
  }
  const course = /^\/de\/course(\/.*)?$/.exec(pathname)
  if (course) return `/de/kurs${course[1] ?? ''}${search}`
  if (/^\/de\/play\/?$/.test(pathname)) return `/de/spielen${search}`
  return null
}
