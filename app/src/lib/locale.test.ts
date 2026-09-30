import { describe, expect, it } from 'vitest'

import { chooseLocale } from './locale'

const at = (path: string, acceptLanguage: string | null, cookie: string | null = null) =>
  chooseLocale({ url: `https://skatgo.com${path}`, cookie, acceptLanguage })

describe('which language a page is served in', () => {
  it("follows the browser's first language: German gets German, any other gets English", () => {
    expect(at('/', 'de-DE,de;q=0.9')).toBe('de')
    expect(at('/', 'de-AT')).toBe('de')
    expect(at('/', 'en-US,en;q=0.9')).toBe('en')
    expect(at('/', 'zh-CN,de;q=0.8,en;q=0.5')).toBe('en')
    expect(at('/', 'fr-FR,en;q=0.6,de;q=0.4')).toBe('en')
    expect(at('/', 'fr-FR')).toBe('en')
    expect(at('/', 'zh-CN,zh;q=0.9')).toBe('en')
    expect(at('/', 'en;q=0.3,de;q=0.7')).toBe('de')
  })

  it('gets German when the browser names no language', () => {
    expect(at('/', null)).toBe('de')
    expect(at('/', '')).toBe('de')
    expect(at('/', '*')).toBe('de')
    expect(at('/', 'de;q=0')).toBe('de')
  })

  it('keeps an explicit choice: the URL first, then the saved choice', () => {
    expect(at('/de/play', 'en-US')).toBe('de')
    expect(at('/', 'zh-CN', 'other=1; PARAGLIDE_LOCALE=en')).toBe('en')
    expect(at('/', 'de-DE', 'PARAGLIDE_LOCALE=fr')).toBe('de')
  })

  it('treats a saved Chinese choice, from before the site dropped Chinese, as no choice', () => {
    expect(at('/', 'de-DE', 'PARAGLIDE_LOCALE=zh')).toBe('de')
    expect(at('/', 'zh-CN', 'PARAGLIDE_LOCALE=zh')).toBe('en')
  })
})
