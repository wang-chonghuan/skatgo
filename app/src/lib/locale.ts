import { type Locale, cookieName, extractLocaleFromUrl } from '~/paraglide/runtime'

// Which language a page is served in (SKATGO-23, the human: 「严格根据用户的浏览器选择德语和英语，识别不
// 出来就默认英语，中文只有用户明确选择才切换到」):
//   1. a language in the URL (/en, /de, /zh) — the address the visitor opened, which is explicit;
//   2. the visitor's saved choice — the cookie is written only when they pick a language in the header;
//   3. the browser's languages, in its order of preference, looking only for German or English;
//   4. English.
// Chinese is never inferred from the browser: a Chinese-speaking browser gets English (or German, if it
// also asks for German) until the visitor chooses Chinese.
export function chooseLocale(input: { url: string; cookie: string | null; acceptLanguage: string | null }): Locale {
  const fromUrl = extractLocaleFromUrl(input.url)
  if (fromUrl) return fromUrl
  const saved = savedLocale(input.cookie)
  if (saved) return saved
  return browserLocale(input.acceptLanguage) ?? 'en'
}

const CHOSEN: readonly string[] = ['en', 'de', 'zh']

function savedLocale(cookie: string | null): Locale | undefined {
  const value = cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1)
  return value && CHOSEN.includes(value) ? (value as Locale) : undefined
}

/** German or English, whichever the browser prefers first; undefined when it asks for neither. */
export function browserLocale(acceptLanguage: string | null): 'de' | 'en' | undefined {
  if (!acceptLanguage) return undefined
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { primary: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) : 1, index }
    })
    .filter((x) => x.primary && x.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  const hit = ranked.find((x) => x.primary === 'de' || x.primary === 'en')
  return hit ? (hit.primary as 'de' | 'en') : undefined
}
