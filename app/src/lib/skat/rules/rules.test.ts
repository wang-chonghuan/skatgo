import { describe, expect, it } from 'vitest'

import { locales } from '~/paraglide/runtime'
import { COURSES } from '../lessons/content'
import { GUIDES } from '../lessons/guide'
import { RULES } from '.'

// The landing text of SKATGO-29 is held to its contract: every lesson has its page in every language,
// the rules page has its eight sections in order, and every link between the two lands somewhere.

const SECTIONS = ['cards', 'dealing', 'bidding', 'games', 'extras', 'value', 'scoring', 'house']
const words = (texts: string[]) => texts.join(' ').replace(/\*\*/g, '').split(/\s+/).filter(Boolean).length
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const BANNED = /\b(soon|bald|demnächst|puzzles?|daily|täglich\w*|tournament|turnier\w*|leaderboard|rangliste)\b|coming soon/i

describe('the lesson pages', () => {
  for (const locale of locales) {
    it(`${locale}: one page per lesson, with a unique address and a 100–200 word introduction`, () => {
      const ids = COURSES[locale].map((l) => l.id)
      expect(Object.keys(GUIDES[locale]).sort()).toEqual([...ids].sort())
      const slugs = ids.map((id) => GUIDES[locale][id].slug)
      expect(new Set(slugs).size).toBe(slugs.length)
      for (const id of ids) {
        const g = GUIDES[locale][id]
        expect(g.slug, `${locale} ${id}`).toMatch(SLUG)
        expect(words(g.intro), `${locale} ${id} intro`).toBeGreaterThanOrEqual(100)
        expect(words(g.intro), `${locale} ${id} intro`).toBeLessThanOrEqual(200)
        expect(SECTIONS, `${locale} ${id} rule`).toContain(g.rule)
        expect(`${g.question} ${g.h1} ${g.description} ${g.intro.join(' ')}`, `${locale} ${id}`).not.toMatch(BANNED)
      }
    })
  }

  it('never shares an address between the languages', () => {
    const [a, b] = locales
    for (const id of Object.keys(GUIDES[a])) if (GUIDES[a][id].slug === GUIDES[b][id].slug) expect.fail(`lesson ${id} has one slug in both languages`)
  })
})

describe('the rules page', () => {
  for (const locale of locales) {
    it(`${locale}: eight sections in order, each with a unique anchor and a lesson that exists`, () => {
      const rules = RULES[locale]
      expect(rules.sections.map((s) => s.id)).toEqual(SECTIONS)
      const anchors = rules.sections.map((s) => s.anchor)
      expect(new Set(anchors).size).toBe(anchors.length)
      for (const s of rules.sections) {
        expect(s.anchor).toMatch(SLUG)
        expect(COURSES[locale].some((l) => l.id === s.lesson), `${locale} ${s.id}`).toBe(true)
      }
      expect(JSON.stringify(rules)).not.toMatch(BANNED)
    })
  }
})
