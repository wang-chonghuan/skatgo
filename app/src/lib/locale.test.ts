import { describe, expect, it } from 'vitest'

import { chooseLocale } from './locale'

const at = (path: string, acceptLanguage: string | null, cookie: string | null = null) =>
  chooseLocale({ url: `https://skatgo.com${path}`, cookie, acceptLanguage })

describe('which language a page is served in', () => {
  it('keeps the German homepage independent of browser and saved preferences', () => {
    for (const language of [null, '', '*', 'de-DE', 'en-US,en;q=0.9', 'fr-FR', 'zh-CN,de;q=0.8']) {
      expect(at('/', language)).toBe('de')
      expect(at('/', language, 'PARAGLIDE_LOCALE=en')).toBe('de')
    }
  })

  it("follows the browser's first language for unlocalized non-home URLs", () => {
    expect(at('/course', 'de-DE,de;q=0.9')).toBe('de')
    expect(at('/course', 'de-AT')).toBe('de')
    expect(at('/course', 'en-US,en;q=0.9')).toBe('en')
    expect(at('/course', 'zh-CN,de;q=0.8,en;q=0.5')).toBe('en')
    expect(at('/course', 'fr-FR,en;q=0.6,de;q=0.4')).toBe('en')
    expect(at('/course', 'fr-FR')).toBe('en')
    expect(at('/course', 'zh-CN,zh;q=0.9')).toBe('en')
    expect(at('/course', 'en;q=0.3,de;q=0.7')).toBe('de')
  })

  it('gets German when the browser names no language', () => {
    expect(at('/', null)).toBe('de')
    expect(at('/', '')).toBe('de')
    expect(at('/', '*')).toBe('de')
    expect(at('/', 'de;q=0')).toBe('de')
  })

  it('keeps an explicit choice: the URL first, then the saved choice', () => {
    expect(at('/de/play', 'en-US')).toBe('de')
    expect(at('/en', 'de-DE', 'PARAGLIDE_LOCALE=de')).toBe('en')
    expect(at('/course', 'zh-CN', 'other=1; PARAGLIDE_LOCALE=en')).toBe('en')
    expect(at('/course', 'de-DE', 'PARAGLIDE_LOCALE=fr')).toBe('de')
  })

  it('treats a saved Chinese choice, from before the site dropped Chinese, as no choice', () => {
    expect(at('/course', 'de-DE', 'PARAGLIDE_LOCALE=zh')).toBe('de')
    expect(at('/course', 'zh-CN', 'PARAGLIDE_LOCALE=zh')).toBe('en')
  })
})
