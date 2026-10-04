import { type Locale, cookieName, extractLocaleFromUrl, locales } from '~/paraglide/runtime'

// The German root is a stable public page, not a preference redirect (SKATGO-44).
// For other URLs, the existing language selection remains (English and German since SKATGO-28; the browser
// rule is the human's of SKATGO-29: 「浏览器语言是德语，则显示德语，其他语言，则显示英语，识别不出来语言，
// 则显示德语」):
//   1. a language in the URL (/en, /de) — the address the visitor opened, which is explicit;
//   2. the visitor's saved choice — the cookie is written only when they pick a language in the header;
//      a choice of a language the site no longer has (Chinese, saved before SKATGO-28) counts as none;
//   3. the browser's own language, its first preference: German gets German, any other gets English;
//   4. no language the browser names at all: German.
export function chooseLocale(input: { url: string; cookie: string | null; acceptLanguage: string | null }): Locale {
  if (new URL(input.url).pathname === '/') return 'de'
  const fromUrl = extractLocaleFromUrl(input.url)
  if (fromUrl) return fromUrl
  const saved = savedLocale(input.cookie)
  if (saved) return saved
  return browserLocale(input.acceptLanguage) ?? 'de'
}

const CHOSEN: readonly string[] = locales

function savedLocale(cookie: string | null): Locale | undefined {
  const value = cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)
  return value && CHOSEN.includes(value) ? (value as Locale) : undefined
}

/** German when the browser's first language is German, English for any other language it names;
 *  undefined when it names none (no header, only `*`, or nothing acceptable). */
export function browserLocale(acceptLanguage: string | null): 'de' | 'en' | undefined {
  if (!acceptLanguage) return undefined
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { primary: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) : 1, index }
    })
    .filter((x) => /^[a-z]{2,3}$/.test(x.primary) && x.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  if (ranked.length === 0) return undefined
  return ranked[0].primary === 'de' ? 'de' : 'en'
}
