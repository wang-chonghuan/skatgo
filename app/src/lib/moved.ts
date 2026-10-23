import { localizeHref } from '~/paraglide/runtime'
import { postPath } from './forum'
import { GUIDES, lessonPath } from './skat/lessons/guide'

// Addresses that have moved, answered with a permanent redirect before the language middleware sees
// them (src/server.ts):
//   /zh/...            the Chinese pages, removed in SKATGO-28 — the same page in English;
//   /{l}/lesson/{id}   a lesson by number, before SKATGO-29 — the lesson under its own slug;
//   /de/course, /de/play — German pages now have German addresses (SKATGO-29): /de/kurs, /de/spielen;
//   /{l}/skat-tricks/12-tricks — the article, a forum post since SKATGO-120 (the human: 「移除这个文章在app里的
//                      所有其他引用的，就放论坛里」): the German original and the English one, each its own post.
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
  // Since SKATGO-124 one post, the English, read in German as its translation; the German post's address leads there.
  const tricks = /^\/(en|de)\/(?:skat-tricks\/12-tricks|forum\/2(?:-[^/]*)?)\/?$/.exec(pathname)
  if (tricks) {
    const locale = tricks[1] as 'en' | 'de'
    return `${localizeHref(postPath(TRICKS_POST), { locale })}${search}`
  }
  return null
}

/** The 12 Skat tricks in the forum's articles: production post 3, the English one (the human, SKATGO-124: 「12 个 Skat
 *  技巧会出现两次。保留英文版」); post 2, the German, is hidden. The forum corrects a changed title's slug. */
const TRICKS_POST = { id: 3, title: 'Skat Tricks: 12 tricks that make you a better player right away' }
