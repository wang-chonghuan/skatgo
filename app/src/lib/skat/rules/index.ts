import type { Locale } from '~/paraglide/runtime'
import { RULES_DE } from './content.de'
import { RULES_EN } from './content.en'
import type { RulesText } from './types'

/** The rules reference in each language (SKATGO-29). */
export const RULES: Record<Locale, RulesText> = { en: RULES_EN, de: RULES_DE }
