import { type Locale, localizeHref } from '~/paraglide/runtime'

// Site-wide facts the pages' <head> and the sitemap need: where the site lives, and how each language
// is named to browsers and crawlers.

export const SITE_URL = 'https://skatgo.com'

/** BCP 47 tag for <html lang> and hreflang. The Chinese course is written in Simplified characters. */
export const LANG_TAG: Record<Locale, string> = { en: 'en', de: 'de', zh: 'zh-Hans' }

/** The absolute URL of a page (a route path such as `/play`) in one language. */
export const localizedUrl = (path: string, locale: Locale) => `${SITE_URL}${localizeHref(path, { locale })}`
