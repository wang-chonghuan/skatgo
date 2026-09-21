import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Locale, locales } from '~/paraglide/runtime'
import { legalPlays, sameCard } from '../cards'
import { COURSES, isUnlocked } from './content'
import type { Lesson, Step } from './types'

import de from '../../../../messages/de.json'
import en from '../../../../messages/en.json'
import zh from '../../../../messages/zh.json'

// The course's hand-written exercises are claims about the rules. Each one is checked against the
// engine here, so a typo in a hand cannot teach the learner something false.
//
// The course exists three times, once per language (SKATGO-1). A translation must never change a
// card, an answer or the best play, so the three are held to the same structure here — for the
// random drills too, by driving each language's generator with the same random numbers.

type Concrete = Exclude<Step, { kind: 'generated' }>

function check(step: Concrete, where: string) {
  if (step.kind === 'choice') {
    expect(step.answer, where).toBeGreaterThanOrEqual(0)
    expect(step.answer, where).toBeLessThan(step.options.length)
    expect(new Set(step.options).size, where).toBe(step.options.length)
  }
  if (step.kind === 'pick') {
    expect(step.correct.length, where).toBeGreaterThan(0)
    for (const c of step.correct) expect(step.cards.some((d) => sameCard(c, d)), where).toBe(true)
  }
  if (step.kind === 'order') {
    expect(step.correct).toHaveLength(step.cards.length)
  }
  if (step.kind === 'play') {
    const legal = legalPlays(step.hand, step.trick, step.contract)
    for (const c of step.best ?? []) expect(legal.some((d) => sameCard(c, d)), `${where}: best card must be legal`).toBe(true)
  }
}

/** Everything about a step that is not words: what the learner sees on the table and what is right. */
function shape(step: Concrete) {
  switch (step.kind) {
    case 'teach':
      return { kind: step.kind, rows: step.rows?.map((r) => ({ cards: r.cards, faceDown: r.faceDown, captions: r.captions?.length })), tip: step.tip !== undefined }
    case 'choice':
      return { kind: step.kind, rows: step.rows?.map((r) => r.cards), options: step.options.length, answer: step.answer, hint: step.hint !== undefined }
    case 'pick':
      return { kind: step.kind, cards: step.cards, correct: step.correct, single: step.single, context: step.context !== undefined }
    case 'order':
      return { kind: step.kind, cards: step.cards, correct: step.correct }
    case 'play':
      return { kind: step.kind, contract: step.contract, hand: step.hand, trick: step.trick, trickBy: step.trickBy?.length, best: step.best, whyNot: step.whyNot !== undefined }
    case 'game':
      return { kind: step.kind }
  }
}

/** A small deterministic generator, so two languages' drills can be dealt the same cards. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

/** Materialise a step; a generated drill is dealt from `seed`. */
function make(step: Step, seed: number): Concrete {
  if (step.kind !== 'generated') return step
  vi.spyOn(Math, 'random').mockImplementation(seeded(seed))
  const out = step.make()
  vi.restoreAllMocks()
  return out
}

afterEach(() => vi.restoreAllMocks())

const CJK = /[　-〿㐀-鿿＀-￯]/

describe('the course', () => {
  const zhCourse = COURSES.zh

  it('has unique lesson ids and unlocks in order', () => {
    expect(new Set(zhCourse.map((l) => l.id)).size).toBe(zhCourse.length)
    expect(isUnlocked(zhCourse[0].id, {})).toBe(true)
    expect(isUnlocked(zhCourse[1].id, {})).toBe(false)
    expect(isUnlocked(zhCourse[1].id, { [zhCourse[0].id]: true })).toBe(true)
  })

  it('exists in every language', () => {
    expect(Object.keys(COURSES).sort()).toEqual([...locales].sort())
  })

  for (const locale of locales as readonly Locale[]) {
    const course: Lesson[] = COURSES[locale]

    it(`${locale}: every fixed exercise agrees with the rules engine`, () => {
      for (const lesson of course) {
        lesson.steps.forEach((step, i) => {
          if (step.kind !== 'generated') check(step, `${locale} lesson ${lesson.id} step ${i}`)
        })
      }
    })

    it(`${locale}: every generated drill yields a well-formed exercise, many times over`, () => {
      for (const lesson of course) {
        lesson.steps.forEach((step, i) => {
          if (step.kind !== 'generated') return
          for (let n = 0; n < 60; n++) check(step.make(), `${locale} lesson ${lesson.id} step ${i} run ${n}`)
        })
      }
    })

    it(`${locale}: ends in a full game`, () => {
      expect(course[course.length - 1].steps.some((s) => s.kind === 'game')).toBe(true)
    })

    if (locale === 'zh') continue

    it(`${locale}: says the same as the Chinese course — same lessons, cards, answers and best plays`, () => {
      expect(course.map((l) => [l.id, l.emoji, l.minutes, l.steps.length])).toEqual(zhCourse.map((l) => [l.id, l.emoji, l.minutes, l.steps.length]))
      course.forEach((lesson, li) => {
        lesson.steps.forEach((step, si) => {
          const other = zhCourse[li].steps[si]
          expect(step.kind === 'generated', `lesson ${lesson.id} step ${si}`).toBe(other.kind === 'generated')
          for (const seed of [1, 7, 42]) {
            const seedFor = seed * 1000 + li * 50 + si
            expect(shape(make(step, seedFor)), `lesson ${lesson.id} step ${si} seed ${seed}`).toEqual(shape(make(other, seedFor)))
          }
        })
      })
    })

    it(`${locale}: contains no Chinese`, () => {
      const text = JSON.stringify(course)
      expect(text.match(CJK)?.[0] ?? null).toBeNull()
    })
  }
})

describe('the messages', () => {
  const catalogues: Record<Locale, Record<string, string>> = { en, de, zh }

  it('every language has exactly the same keys', () => {
    const keys = Object.keys(en).sort()
    for (const l of locales as readonly Locale[]) expect(Object.keys(catalogues[l]).sort(), l).toEqual(keys)
  })

  it('every message uses the same parameters in every language', () => {
    const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort()
    for (const key of Object.keys(en)) {
      for (const l of locales as readonly Locale[]) expect(params(catalogues[l][key]), `${l} ${key}`).toEqual(params(catalogues.en[key]))
    }
  })

  it('English and German contain no Chinese', () => {
    for (const l of ['en', 'de'] as const) {
      for (const [key, value] of Object.entries(catalogues[l])) expect(CJK.test(value), `${l} ${key}`).toBe(false)
    }
  })
})
