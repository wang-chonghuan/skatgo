import type { Locale } from '~/paraglide/runtime'
import { TRICKS_DE } from './content.de'
import { TRICKS_EN } from './content.en'
import type { TricksArticle } from './types'

/** The section's first article, at the section's own address, in each language (SKATGO-82). */
export const TRICKS: Record<Locale, TricksArticle> = { en: TRICKS_EN, de: TRICKS_DE }
