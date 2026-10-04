import { describe, expect, it } from 'vitest'

import { LEGAL, LEGAL_OPERATOR, LEGAL_UPDATED } from './legal'
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

  for (const locale of locales) {
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
