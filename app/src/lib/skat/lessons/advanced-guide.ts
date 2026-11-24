import type { Locale } from '~/paraglide/runtime'
import type { LessonGuide } from '../rules/types'
import { ADVANCED_GUIDE_DE } from './advanced.de'
import { ADVANCED_GUIDE_EN } from './advanced.en'

// Each advanced lesson's page and address, per language (SKATGO-234), as guide.ts is the course's: apart from the
// lessons' own module, so the sitemap and the search-surface checker read them without the runtime.

export const ADVANCED_GUIDES: Record<Locale, Record<string, LessonGuide>> = { en: ADVANCED_GUIDE_EN, de: ADVANCED_GUIDE_DE }

/** The route path (no language prefix) of an advanced lesson in one language: `/advanced-course/schneider-in-skat`. */
export const advancedPath = (id: string, locale: Locale) => `/advanced-course/${ADVANCED_GUIDES[locale][id].slug}`

/** The advanced lesson a slug names, and the language it is in; undefined for a slug no lesson has. */
export function advancedBySlug(slug: string): { id: string; locale: Locale } | undefined {
  for (const locale of Object.keys(ADVANCED_GUIDES) as Locale[]) {
    const id = Object.keys(ADVANCED_GUIDES[locale]).find((k) => ADVANCED_GUIDES[locale][k].slug === slug)
    if (id) return { id, locale }
  }
  return undefined
}
