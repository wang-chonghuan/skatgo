import { describe, expect, it } from 'vitest'

import { chooseLocale } from './locale'

const at = (path: string, acceptLanguage: string | null, cookie: string | null = null) =>
  chooseLocale({ url: `https://skatgo.com${path}`, cookie, acceptLanguage })

describe('which language a page is served in', () => {
  it('follows the browser, but only to German or English', () => {
    expect(at('/', 'de-DE,de;q=0.9')).toBe('de')
    expect(at('/', 'en-US,en;q=0.9')).toBe('en')
    expect(at('/', 'zh-CN,de;q=0.8,en;q=0.5')).toBe('de')
    expect(at('/', 'fr-FR,en;q=0.6,de;q=0.4')).toBe('en')
    expect(at('/', 'en;q=0.3,de;q=0.7')).toBe('de')
  })

  it('never infers Chinese: a Chinese or unknown browser gets English', () => {
    expect(at('/', 'zh-CN,zh;q=0.9')).toBe('en')
    expect(at('/', 'fr-FR')).toBe('en')
    expect(at('/', null)).toBe('en')
    expect(at('/', 'de;q=0')).toBe('en')
  })

  it('keeps an explicit choice: the URL first, then the saved choice', () => {
    expect(at('/zh', 'de-DE')).toBe('zh')
    expect(at('/de/play', 'en-US')).toBe('de')
    expect(at('/', 'de-DE', 'PARAGLIDE_LOCALE=zh')).toBe('zh')
    expect(at('/', 'zh-CN', 'other=1; PARAGLIDE_LOCALE=en')).toBe('en')
    expect(at('/', 'de-DE', 'PARAGLIDE_LOCALE=fr')).toBe('de')
  })
})
