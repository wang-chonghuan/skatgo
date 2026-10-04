import { m } from '~/paraglide/messages'
import { type Locale, getLocale, locales } from '~/paraglide/runtime'
import { LANG_TAG, SITE_URL, localizedUrl } from './site'
import { isIndexable } from './indexability'

// Every page's own head (SKATGO-29): title and description, a canonical URL that is the page itself,
// hreflang links between its English and German versions (German is the page's x-default),
// the Open Graph and Twitter tags with the page's own 1200×630
// picture, and its structured data. The root route writes only what is the same on every page.

type JsonLd = Record<string, unknown>

export type PageHead = {
  title: string
  description: string
  /** The page's route path in each language — they differ for a lesson, whose slug is translated. */
  paths: Record<Locale, string>
  /** The file name (without language and extension) of the page's picture in /og. */
  image: string
  jsonLd: JsonLd[]
}

/** The same route path in every language — every page but a lesson. */
export const samePath = (path: string): Record<Locale, string> =>
  Object.fromEntries(locales.map((l) => [l, path])) as Record<Locale, string>

export const ogImageUrl = (image: string, locale: Locale) => `${SITE_URL}/og/${image}-${locale}.png`

export function pageHead({ title, description, paths, image, jsonLd }: PageHead) {
  const locale = getLocale()
  const url = localizedUrl(paths[locale], locale)
  const picture = ogImageUrl(image, locale)
  const indexable = isIndexable(paths[locale])
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'robots', content: indexable ? 'index, follow' : 'noindex, follow' },
      { property: 'og:site_name', content: m.site_name() },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: m.og_locale() },
      { property: 'og:image', content: picture },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: title },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: picture },
      // The router renders a `script:ld+json` entry as an escaped JSON-LD script; the type of a route's
      // head() only knows <meta> attributes, hence the cast.
      ...jsonLd.map((data) => ({ 'script:ld+json': { '@context': 'https://schema.org', ...data } }) as unknown as { name: string }),
    ],
    links: [
      { rel: 'canonical', href: url },
      ...(indexable ? [
        ...locales.map((l) => ({ rel: 'alternate', hrefLang: LANG_TAG[l], href: localizedUrl(paths[l], l) })),
        { rel: 'alternate', hrefLang: 'x-default', href: localizedUrl(paths.de, 'de') },
      ] : []),
    ],
  }
}

/** The organisation behind the site, for the front page's structured data and as a course's provider. */
export const organization = (): JsonLd => ({
  '@type': 'Organization',
  name: m.site_name(),
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
})

/** The trail from the front page to this one; `trail` is [name, route path] after the front page. */
export function breadcrumbs(trail: [string, string][]): JsonLd {
  const locale = getLocale()
  const items: [string, string][] = [[m.nav_home(), '/'], ...trail]
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: localizedUrl(path, locale),
    })),
  }
}
