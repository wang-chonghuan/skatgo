import { describe, expect, it } from 'vitest'

import { cardRow, forumImagePath, inlineParts, parseBody, plainText, postIdOf, postIndexable, postParam, sectionsFor, slugOf } from './forum'

// The forum's shared rules (SKATGO-118): what an address, a post's text and its indexing come to.

describe('forum addresses', () => {
  it('spells German letters out and keeps only letters, digits and hyphens', () => {
    expect(slugOf('Wann lohnt sich ein Grand?')).toBe('wann-lohnt-sich-ein-grand')
    expect(slugOf('Größe & Übung: Ärger')).toBe('groesse-uebung-aerger')
    expect(slugOf('♠♥')).toBe('post')
    expect(slugOf('a'.repeat(80)).length).toBe(60)
  })
  it('reads the number back from the address', () => {
    expect(postParam({ id: 12, title: 'Null ouvert' })).toBe('12-null-ouvert')
    expect(postIdOf('12-null-ouvert')).toBe(12)
    expect(postIdOf('12')).toBe(12)
    expect(postIdOf('x-12')).toBeNull()
    expect(postIdOf('0-zero')).toBeNull()
  })
})

describe('who may post where', () => {
  it('keeps announcements to the official', () => {
    expect(sectionsFor(false)).toEqual(['articles', 'talk', 'feedback'])
    expect(sectionsFor(true)).toEqual(['news', 'articles', 'talk', 'feedback'])
  })
  it('offers search engines the official posts and marked ones, never hidden or feedback', () => {
    const base = { section: 'talk' as const, official: false, indexed: false, hidden: null }
    expect(postIndexable(base)).toBe(false)
    expect(postIndexable({ ...base, indexed: true })).toBe(true)
    expect(postIndexable({ ...base, official: true })).toBe(true)
    expect(postIndexable({ ...base, official: true, hidden: 'Spam' })).toBe(false)
    expect(postIndexable({ ...base, section: 'feedback', official: true, indexed: true })).toBe(false)
  })
})

describe('a post\'s text', () => {
  it('reads paragraphs, headings, lists and rows of cards', () => {
    expect(parseBody('Erst\nzweite Zeile\n\n## Titel\n- a\n- b\n1. c\n[♣B ♠10 ♥D ♦7]\nEnde')).toEqual([
      { kind: 'p', lines: ['Erst', 'zweite Zeile'] },
      { kind: 'h2', text: 'Titel' },
      { kind: 'ul', items: ['a', 'b'] },
      { kind: 'ol', items: ['c'] },
      { kind: 'cards', cards: [{ suit: 'C', rank: 'J' }, { suit: 'S', rank: '10' }, { suit: 'H', rank: 'Q' }, { suit: 'D', rank: '7' }] },
      { kind: 'p', lines: ['Ende'] },
    ])
  })
  it('reads a picture of the site’s own on a line of its own, and leaves anything else text (SKATGO-129)', () => {
    expect(parseBody('Davor\n![Two curves, day by day](skatgo-saldo-defence.svg)\nDanach')).toEqual([
      { kind: 'p', lines: ['Davor'] },
      { kind: 'image', alt: 'Two curves, day by day', file: 'skatgo-saldo-defence.svg', line: '![Two curves, day by day](skatgo-saldo-defence.svg)' },
      { kind: 'p', lines: ['Danach'] },
    ])
    // Another site's picture, a path, or a picture inside a sentence is not one.
    for (const line of ['![x](https://example.com/a.svg)', '![x](../a.svg)', '![x](a.gif)', 'Sieh ![x](a.svg)']) {
      expect(parseBody(line)).toEqual([{ kind: 'p', lines: [line] }])
    }
    expect(forumImagePath('a.svg', 'de')).toBe('/forum-images/de/a.svg')
    expect(plainText('![Two curves](a.svg)\nText')).toBe('Text')
  })
  it('takes a row of cards only on a line of its own, and only of real cards', () => {
    expect(cardRow('[♠A ♥K]')).toEqual([{ suit: 'S', rank: 'A' }, { suit: 'H', rank: 'K' }])
    expect(cardRow('[♠J ♥Q]')).toEqual([{ suit: 'S', rank: 'J' }, { suit: 'H', rank: 'Q' }])
    expect(cardRow('[♠A ♥X]')).toBeNull()
    expect(cardRow('Ich habe [♠A]')).toBeNull()
    expect(cardRow(`[${Array(13).fill('♠A').join(' ')}]`)).toBeNull()
  })
  it('links only http(s) addresses', () => {
    expect(inlineParts('Siehe [Regeln](https://skatgo.com/de/regeln) oder https://example.com/x.')).toEqual([
      { text: 'Siehe ' },
      { text: 'Regeln', href: 'https://skatgo.com/de/regeln' },
      { text: ' oder ' },
      { text: 'https://example.com/x', href: 'https://example.com/x' },
      { text: '.' },
    ])
    expect(inlineParts('[x](javascript:alert(1))')).toEqual([{ text: '[x](javascript:alert(1))' }])
  })
  it('says it plainly in a description', () => {
    expect(plainText('## Kopf\n**fett** und [Link](https://a.de)\n[♠A]')).toBe('Kopf fett und Link')
    expect(plainText('wort '.repeat(60), 40).length).toBeLessThanOrEqual(40)
  })
})
