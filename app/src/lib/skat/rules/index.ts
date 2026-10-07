import type { Locale } from '~/paraglide/runtime'
import { RULES_DE } from './content.de'
import { RULES_EN } from './content.en'
import { SUMMARY_DE } from './summary.de'
import { SUMMARY_EN } from './summary.en'
import type { RulesSummary, RulesText } from './types'

/** The rules reference in each language (SKATGO-29). */
export const RULES: Record<Locale, RulesText> = { en: RULES_EN, de: RULES_DE }

/** The printable short version in each language (SKATGO-53). */
export const SUMMARY: Record<Locale, RulesSummary> = { en: SUMMARY_EN, de: SUMMARY_DE }
