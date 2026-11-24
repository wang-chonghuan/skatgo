import { type Locale, getLocale } from '~/paraglide/runtime'
import { ADVANCED_DE } from './advanced.de'
import { ADVANCED_EN } from './advanced.en'
import type { Lesson } from './types'

export { ADVANCED_GUIDES, advancedBySlug, advancedPath } from './advanced-guide'

// The advanced course (SKATGO-234, the human: 「新增一个进阶课程，或者高级课程之类的，用来放之前就规划的那个书上的专题等」): one topic
// a lesson for players who know the rules, at /advanced-course. Its lessons play in the course's own lesson player and
// are recorded with the course's progress; their ids start at 101, so they never meet the course's 1 to 11, and the
// course's count ("3 of 11 done") never counts them.

export const ADVANCED: Record<Locale, Lesson[]> = { en: ADVANCED_EN, de: ADVANCED_DE }

/** The advanced lessons in the current language. */
export const advancedLessons = (): Lesson[] => ADVANCED[getLocale()]

export const advancedById = (id: string): Lesson | undefined => advancedLessons().find((l) => l.id === id)
