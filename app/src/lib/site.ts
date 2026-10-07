import { type Locale, localizeHref } from '~/paraglide/runtime'

// Site-wide facts the pages' <head> and the sitemap need: where the site lives, and how each language
// is named to browsers and crawlers.

import { SITE_URL } from './origin'

export { SITE_URL }

/** BCP 47 tag for <html lang> and hreflang. */
export const LANG_TAG: Record<Locale, string> = { en: 'en', de: 'de' }

/** The absolute URL of a page (a route path such as `/play`) in one language. */
export const localizedUrl = (path: string, locale: Locale) => `${SITE_URL}${localizeHref(path, { locale })}`
