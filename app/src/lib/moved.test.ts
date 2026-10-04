import { describe, expect, it } from 'vitest'

import { movedTo } from './moved'
import { GUIDES } from './skat/lessons/guide'

describe('moved addresses', () => {
  it('sends the removed Chinese pages to English', () => {
    expect(movedTo('/zh', '')).toBe('/en')
    expect(movedTo('/zh/play', '?x=1')).toBe('/en/play?x=1')
  })

  it('sends a lesson by number to its slug, in its language', () => {
    expect(movedTo('/en/lesson/7', '')).toBe(`/en/course/${GUIDES.en['7'].slug}`)
    expect(movedTo('/de/lesson/7', '')).toBe(`/de/kurs/${GUIDES.de['7'].slug}`)
    expect(movedTo('/de/lesson/99', '')).toBe('/de/kurs')
  })

  it('sends German pages to their German addresses', () => {
    expect(movedTo('/de/course', '')).toBe('/de/kurs')
    expect(movedTo('/de/play', '')).toBe('/de/spielen')
  })

  it('leaves current addresses alone', () => {
    for (const path of ['/', '/en', '/en/course', '/de/kurs', '/en/play', '/de/spielen', '/en/rules', '/de/regeln', '/api/ask']) expect(movedTo(path, '')).toBeNull()
  })

  it('consolidates the German homepage with query preserved', () => {
    expect(movedTo('/de', '')).toBe('/')
    expect(movedTo('/de/', '?source=search')).toBe('/?source=search')
    expect(movedTo('/en/', '?source=search')).toBe('/en?source=search')
  })
})
