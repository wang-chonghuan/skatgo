import { describe, expect, it } from 'vitest'

import { LEGAL, LEGAL_OPERATOR, LEGAL_UPDATED, TERMS_UPDATED } from './legal'
import { locales } from '~/paraglide/runtime'

describe('public legal documents', () => {
  it('uses the approved public operator contacts', () => {
    expect(LEGAL_OPERATOR).toEqual({
      name: 'Olena Holub',
      email: 'intentplex@gmail.com',
      phone: '+353 830091396',
      phoneHref: 'tel:+353830091396',
      address: '2 Hume Street, Dublin 2, Ireland',
    })
    expect(LEGAL_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('updates Terms without changing the Privacy Policy revision', () => {
    expect(LEGAL_UPDATED).toBe('2026-10-29')
    expect(TERMS_UPDATED).toBe('2026-11-09')
  })

  for (const locale of locales) {
    it(`${locale} terms do not discuss participant composition`, () => {
      const copy = LEGAL[locale].terms
      const text = [copy.intro, ...copy.sections.flatMap(({ title, paragraphs }) => [title, ...paragraphs])].join(' ')
      expect(text).not.toMatch(/\b(?:synthetic|simulated)\s+(?:players?|participants?)\b|\bbots?\b|(?:synthetische|simulierte|ki|computer)[-\s]*(?:spieler|teilnehmer)/i)
      expect(text).not.toMatch(/\b(?:only|exclusively)\s+(?:human|real)\s+(?:players|participants)\b|\b(?:all|every)\s+(?:players?|participants?).{0,30}\b(?:humans?|real people)\b|\bhuman-only\b|(?:nur|ausschließlich)\s+(?:echte|menschliche)\s+(?:spieler|teilnehmer)|alle\s+(?:spieler|teilnehmer).{0,30}(?:menschen|menschlich)/i)
    })

    it(`${locale} terms retain scoring and fair-play rules`, () => {
      const text = LEGAL[locale].terms.sections.find(({ id }) => id === 'fair-play')?.paragraphs.join(' ')
      expect(text).toMatch(locale === 'en' ? /Scores and leaderboard positions follow the applicable scoring rules/ : /Punkte und Ranglistenplätze richten sich nach den geltenden Wertungsregeln/)
      expect(text).toMatch(locale === 'en' ? /completed games recorded by the server/ : /auf dem Server aufgezeichneten abgeschlossenen Spielen/)
      expect(text).toMatch(locale === 'en' ? /one entry per player per day/ : /ein Eintrag pro Spieler und Tag/)
      expect(text).toMatch(locale === 'en' ? /Do not manipulate scores/ : /Manipuliere keine Ergebnisse/)
      expect(text).toMatch(locale === 'en' ? /Do not impersonate someone/ : /Gib dich nicht als andere Person aus/)
    })

    for (const document of ['privacy', 'terms'] as const) {
      it(`${locale} ${document} identifies the operator and contains complete, addressable sections`, () => {
        const copy = LEGAL[locale][document]
        expect(copy.intro.trim()).not.toBe('')
        expect(copy.sections.length).toBeGreaterThan(1)
        expect(new Set(copy.sections.map(({ id }) => id)).size).toBe(copy.sections.length)
        const contact = copy.sections.filter(({ contact }) => contact)
        expect(contact).toHaveLength(1)
        expect(contact[0].id).toBe('operator')
        expect(contact[0].paragraphs.join(' ')).toContain(LEGAL_OPERATOR.name)
        expect(JSON.stringify(copy)).not.toContain('Risetive')
        for (const section of copy.sections) {
          expect(section.title.trim()).not.toBe('')
          expect(section.paragraphs.length).toBeGreaterThan(0)
          expect(section.paragraphs.every((text) => text.trim().length > 0)).toBe(true)
        }
      })
    }
  }
})
