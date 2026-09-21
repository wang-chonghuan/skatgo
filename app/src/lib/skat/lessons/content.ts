// The course in the learner's language. Lesson ids, cards and answers are the same in every language
// (lessons.test.ts proves it), so progress — keyed by lesson id — is shared across languages.

import { type Locale, getLocale } from '~/paraglide/runtime'
import { LESSONS_DE } from './content.de'
import { LESSONS_EN } from './content.en'
import { LESSONS_ZH } from './content.zh'
import type { Lesson } from './types'

export const COURSES: Record<Locale, Lesson[]> = { zh: LESSONS_ZH, en: LESSONS_EN, de: LESSONS_DE }

/** The lessons in the current language (the URL's prefix). */
export const lessons = (): Lesson[] => COURSES[getLocale()]

export const lessonById = (id: string): Lesson | undefined => lessons().find((l) => l.id === id)
