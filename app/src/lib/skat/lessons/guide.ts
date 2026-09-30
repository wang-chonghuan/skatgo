import type { Locale } from '~/paraglide/runtime'
import type { LessonGuide } from '../rules/types'
import { GUIDE_DE } from './guide.de'
import { GUIDE_EN } from './guide.en'

// Each lesson's landing text and address, per language (SKATGO-29). A lesson is still identified by its
// id everywhere else — progress, the course, the table — so a slug only ever appears in a URL.

export const GUIDES: Record<Locale, Record<string, LessonGuide>> = { en: GUIDE_EN, de: GUIDE_DE }

/** The route path (no language prefix) of a lesson in one language: `/course/how-bidding-works`. */
export const lessonPath = (id: string, locale: Locale) => `/course/${GUIDES[locale][id].slug}`

/** The lesson a slug names, and the language it is in; undefined for a slug no lesson has. */
export function lessonBySlug(slug: string): { id: string; locale: Locale } | undefined {
  for (const locale of Object.keys(GUIDES) as Locale[]) {
    const id = Object.keys(GUIDES[locale]).find((k) => GUIDES[locale][k].slug === slug)
    if (id) return { id, locale }
  }
  return undefined
}
