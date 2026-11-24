import { type Locale, getLocale } from '~/paraglide/runtime'
import type { LessonGuide } from '../rules/types'
import { ADVANCED_DE, ADVANCED_GUIDE_DE } from './advanced.de'
import { ADVANCED_EN, ADVANCED_GUIDE_EN } from './advanced.en'
import type { Lesson } from './types'

// The advanced course (SKATGO-234, the human: 「新增一个进阶课程，或者高级课程之类的，用来放之前就规划的那个书上的专题等」): one topic
// a lesson for players who know the rules, at /advanced-course. Its lessons play in the course's own lesson player and
// are recorded with the course's progress; their ids start at 101, so they never meet the course's 1 to 11, and the
// course's count ("3 of 11 done") never counts them.

export const ADVANCED: Record<Locale, Lesson[]> = { en: ADVANCED_EN, de: ADVANCED_DE }
export const ADVANCED_GUIDES: Record<Locale, Record<string, LessonGuide>> = { en: ADVANCED_GUIDE_EN, de: ADVANCED_GUIDE_DE }

/** The advanced lessons in the current language. */
export const advancedLessons = (): Lesson[] => ADVANCED[getLocale()]

export const advancedById = (id: string): Lesson | undefined => advancedLessons().find((l) => l.id === id)

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
