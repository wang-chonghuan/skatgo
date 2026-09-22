import { beforeEach, describe, expect, it } from 'vitest'

import { COURSES } from '~/lib/skat/lessons/content'
import { locales } from '~/paraglide/runtime'
import { buildSystemPrompt } from './context'
import { LIMITS, admit, resetLimits } from './limits'

// The assistant's context is derived from the course, so it is held to the course: every lesson in
// every language must be describable, and the description must carry the page's own words.

describe('the assistant context', () => {
  it('describes every lesson in every language with its own teaching titles', () => {
    for (const locale of locales) {
      for (const lesson of COURSES[locale]) {
        const prompt = buildSystemPrompt(locale, { kind: 'lesson', lessonId: lesson.id })
        expect(prompt, `${locale} lesson ${lesson.id}`).not.toBeNull()
        expect(prompt).toContain(lesson.title)
        for (const step of lesson.steps) {
          if (step.kind === 'teach') expect(prompt).toContain(step.title)
        }
      }
    }
  })

  it('describes the course map with every lesson', () => {
    const prompt = buildSystemPrompt('zh', { kind: 'home' })
    for (const lesson of COURSES.zh) expect(prompt).toContain(lesson.title)
  })

  it('names the answer language and carries the rules', () => {
    expect(buildSystemPrompt('de', { kind: 'home' })).toContain('German')
    expect(buildSystemPrompt('en', { kind: 'home' })).toContain('SKAT RULES')
  })

  it('has nothing for a page that is not a lesson', () => {
    expect(buildSystemPrompt('en', { kind: 'lesson', lessonId: '99' })).toBeNull()
  })
})

describe('the limits', () => {
  beforeEach(resetLimits)

  it('lets one account ask perAccount times a minute, then refuses until the window passes', () => {
    const t0 = Date.parse('2026-09-22T10:00:00Z')
    for (let i = 0; i < LIMITS.perAccount; i++) expect(admit('a', t0 + i)).toBeNull()
    expect(admit('a', t0 + LIMITS.perAccount)).toBe('rate')
    expect(admit('b', t0 + LIMITS.perAccount)).toBeNull()
    expect(admit('a', t0 + LIMITS.windowMs + 1)).toBeNull()
  })

  it('stops the whole site at the daily cap and starts over the next UTC day', () => {
    const t0 = Date.parse('2026-09-22T23:59:00Z')
    for (let i = 0; i < LIMITS.perDay; i++) expect(admit(`user${i}`, t0)).toBeNull()
    expect(admit('late', t0)).toBe('daily')
    expect(admit('late', Date.parse('2026-09-23T00:00:01Z'))).toBeNull()
  })
})
