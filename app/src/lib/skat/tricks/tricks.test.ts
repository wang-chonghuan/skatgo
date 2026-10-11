import { describe, expect, it } from 'vitest'

import { locales } from '~/paraglide/runtime'
import { PAGES } from '../../sitemap'
import { TRICKS } from '.'

// The Skat-Tricks article (SKATGO-82) is held to its ticket: twelve tricks in order, three ways into the
// daily tournament, the search term "Skat Tricks" in the title, the H1 and a section heading, and every
// page it links to a page of the site.

const KEYWORD = /skat tricks/i

describe('the Skat-Tricks article', () => {
  for (const locale of locales) {
    const a = TRICKS[locale]
    it(`${locale}: twelve tricks, numbered 1 to 12 in order`, () => {
      const tricks = a.blocks.flatMap((b) => (b.kind === 'trick' ? [b] : []))
      expect(tricks.map((t) => t.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      for (const t of tricks) expect(t.paragraphs.length, `${locale} ${t.n}`).toBeGreaterThan(0)
    })
    it(`${locale}: three ways into the daily tournament — at the start, in the middle and at the end`, () => {
      const kinds = a.blocks.map((b) => b.kind)
      expect(kinds.filter((k) => k === 'cta')).toHaveLength(3)
      expect(kinds[0]).toBe('cta')
      expect(kinds.at(-1)).toBe('cta')
    })
    it(`${locale}: "Skat Tricks" in the title, the H1 and a section heading`, () => {
      expect(a.metaTitle).toMatch(KEYWORD)
      expect(a.h1).toMatch(KEYWORD)
      expect(a.blocks.some((b) => b.kind === 'h2' && KEYWORD.test(b.title))).toBe(true)
      expect(a.metaDescription.length).toBeLessThanOrEqual(160)
    })
    it(`${locale}: every link lands on a page of the site`, () => {
      const links = [...a.blocks.flatMap((b) => (b.kind === 'trick' && b.link ? [b.link] : [])), ...a.further.links]
      for (const l of links) expect(PAGES, l.to).toContain(l.to)
    })
  }
})
