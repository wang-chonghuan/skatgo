import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Locale, locales } from '~/paraglide/runtime'
import { type Card, cardId, legalPlays, pointsOf, sameCard } from '../cards'
import { expectedValue } from '../value'
import { after, auction } from './auction'
import { CONCEPTS, conceptsIn } from './concepts'
import { COURSES } from './content'
import { DEAL_PACKETS } from './drills'
import { GUIDES } from './guide'
import type { Lesson, Step } from './types'

import de from '../../../../messages/de.json'
import en from '../../../../messages/en.json'

// The course's hand-written exercises are claims about the rules. Each one is checked against the
// engine here, so a typo in a hand cannot teach the learner something false.
//
// The course exists once per language (SKATGO-1), English being the reference. A translation must
// never change a card, an answer or the best play, so every language is held to the same structure
// here — for the random drills too, by driving each language's generator with the same random numbers.

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
  if (step.kind === 'sum') {
    expect(waysToMake(step.cards, step.size, step.target), `${where}: the target can be made`).toBeGreaterThan(0)
  }
  if (step.kind === 'deal') {
    expect(new Set(step.cards.map(cardId)).size, where).toBe(32)
  }
  if (step.kind === 'bid') {
    expect(step.hand, where).toHaveLength(10)
    const { calls } = auctionOf(step)
    expect(calls.some((c) => c.role === step.seat), `${where}: the learner has a call`).toBe(true)
    // Lesson 7's ladder stops at 33: a higher number belongs to games taught later (Null Hand is 35).
    for (const c of calls) if (c.say !== 'pass') expect(c.value, `${where}: ${c.role} says ${c.value}`).toBeLessThanOrEqual(33)
  }
}

/** How many ways `size` of `cards` make `target` card points. */
function waysToMake(cards: Card[], size: number, target: number, from = 0): number {
  if (size === 0) return target === 0 ? 1 : 0
  let n = 0
  for (let i = from; i < cards.length; i++) n += waysToMake(cards, size - 1, target - pointsOf([cards[i]]), i + 1)
  return n
}

type BidLike = Extract<Concrete, { kind: 'bid' }>
function auctionOf(step: BidLike) {
  const limit = expectedValue({ contract: step.contract, hand: false, schneiderAnnounced: false, schwarzAnnounced: false, ouvert: false }, step.hand)
  const [first, second] = after(step.seat)
  return auction({ [step.seat]: limit, [first]: step.limits[0], [second]: step.limits[1] } as Parameters<typeof auction>[0])
}

/** Every word a learner reads in a step: its strings, without the names of cards, contracts and seats. */
function words(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(words)
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => (['kind', 'suit', 'rank', 'trump', 'seat', 'make'].includes(k) ? [] : words(v)))
  }
  return []
}

/** Everything about a step that is not words: what the learner sees on the table and what is right. */
function shape(step: Concrete) {
  switch (step.kind) {
    case 'teach':
      return { kind: step.kind, rows: step.rows?.map((r) => ({ cards: r.cards, faceDown: r.faceDown, captions: r.captions?.length, follow: r.follow })), tip: step.tip !== undefined }
    case 'choice':
      return { kind: step.kind, rows: step.rows?.map((r) => r.cards), options: step.options.length, answer: step.answer, hint: step.hint !== undefined }
    case 'pick':
      return { kind: step.kind, cards: step.cards, correct: step.correct, single: step.single, context: step.context !== undefined }
    case 'order':
      return { kind: step.kind, cards: step.cards, correct: step.correct }
    case 'play':
      return { kind: step.kind, contract: step.contract, hand: step.hand, trick: step.trick, trickBy: step.trickBy?.length, best: step.best, whyNot: step.whyNot !== undefined }
    case 'sum':
      return { kind: step.kind, cards: step.cards, size: step.size, target: step.target }
    case 'deal':
      return { kind: step.kind, cards: step.cards }
    case 'bid':
      return { kind: step.kind, hand: step.hand, contract: step.contract, seat: step.seat, limits: step.limits }
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
  const reference = COURSES.en

  it('has unique lesson ids', () => {
    expect(new Set(reference.map((l) => l.id)).size).toBe(reference.length)
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

    // SKATGO-161 (the human: 「禁止在前序课里出现后序概念」): a lesson names no concept a later lesson teaches —
    // not in its title, promise, learned line, any step, any drill dealt many times over, or its page's title
    // and description. This replaces SKATGO-2's narrower test (no Grand or Null in a drill before lesson 5).
    it(`${locale}: no lesson names a concept of a later lesson, and each concept is named where it is taught`, () => {
      const textOf = (lesson: Lesson, n: number) => {
        const guide = GUIDES[locale][lesson.id]
        const parts = [lesson.title, lesson.promise, lesson.learned, guide.question, guide.h1, guide.description]
        lesson.steps.forEach((step, i) => {
          if (step.kind !== 'generated') parts.push(...words(step))
          else for (let run = 0; run < 40; run++) parts.push(...words(make(step, n * 100_000 + i * 1000 + run)))
        })
        return parts.join('\n')
      }
      const named = new Map<string, number>()
      course.forEach((lesson, n) => {
        const text = textOf(lesson, n)
        const lessonNo = n + 1
        for (const c of conceptsIn(text, locale)) {
          if (!named.has(c.id)) named.set(c.id, lessonNo)
          if (c.lesson > lessonNo) {
            const line = text.split('\n').find((t) => conceptsIn(t, locale).includes(c)) ?? ''
            expect.fail(`${locale} lesson ${lesson.id} names "${c.id}" (taught in lesson ${c.lesson}): ${line.slice(0, 160)}`)
          }
        }
      })
      for (const c of CONCEPTS) expect(named.get(c.id), `${locale}: "${c.id}" first named in lesson ${named.get(c.id)}, taught in ${c.lesson}`).toBe(c.lesson)
    })

    it(`${locale}: every lesson opens with a teaching card, and at most two come before the first question`, () => {
      for (const lesson of course) {
        expect(lesson.steps[0].kind, `lesson ${lesson.id}`).toBe('teach')
        const firstAsk = lesson.steps.findIndex((s) => s.kind !== 'teach')
        expect(firstAsk, `lesson ${lesson.id}`).toBeGreaterThan(0)
        expect(firstAsk, `lesson ${lesson.id}: teaching cards before the first question`).toBeLessThanOrEqual(2)
      }
    })

    it(`${locale}: every lesson ends with its final challenge on cards, and says what the learner can now do`, () => {
      for (const lesson of course) {
        expect(lesson.learned.trim(), `lesson ${lesson.id}`).not.toBe('')
        if (lesson === course[course.length - 1]) continue
        const last = make(lesson.steps[lesson.steps.length - 1], 1)
        expect(last.kind, `lesson ${lesson.id}`).not.toBe('teach')
        const shown = JSON.stringify(last)
        expect(/"suit":"[CSHD]","rank":/.test(shown), `lesson ${lesson.id}: the final challenge shows cards`).toBe(true)
      }
      const last = (id: string) => make(course.find((l) => l.id === id)!.steps.at(-1)!, 1)
      expect(last('1').kind, 'lesson 1 ends with dealing').toBe('deal')
      expect(last('7').kind, 'lesson 7 ends with bidding').toBe('bid')
      const discard = last('8')
      expect(discard.kind === 'pick' && discard.cards.length === 12 && discard.correct.length === 2, 'lesson 8 ends with putting two of twelve away').toBe(true)
    })

    it(`${locale}: every follow picture shows cards both allowed and refused by the engine`, () => {
      for (const lesson of course) {
        for (const step of lesson.steps) {
          if (step.kind !== 'teach') continue
          for (const row of step.rows ?? []) {
            if (!row.follow) continue
            const where = `${locale} lesson ${lesson.id} "${row.label}"`
            expect(row.cards.some((c) => sameCard(c, row.follow!.lead)), `${where}: the lead is not in the hand`).toBe(false)
            const legal = legalPlays(row.cards, [row.follow.lead], row.follow.contract)
            expect(legal.length, `${where}: some card allowed`).toBeGreaterThan(0)
            expect(legal.length, `${where}: some card refused`).toBeLessThan(row.cards.length)
          }
        }
      }
    })

    it(`${locale}: ends in a full game`, () => {
      expect(course[course.length - 1].steps.some((s) => s.kind === 'game')).toBe(true)
    })

    it(`${locale}: contains no Chinese`, () => {
      const text = JSON.stringify(course)
      expect(text.match(CJK)?.[0] ?? null).toBeNull()
    })

    if (locale === 'en') continue

    it(`${locale}: says the same as the English course — same lessons, cards, answers and best plays`, () => {
      expect(course.map((l) => [l.id, l.minutes, l.steps.length])).toEqual(reference.map((l) => [l.id, l.minutes, l.steps.length]))
      course.forEach((lesson, li) => {
        lesson.steps.forEach((step, si) => {
          const other = reference[li].steps[si]
          expect(step.kind === 'generated', `lesson ${lesson.id} step ${si}`).toBe(other.kind === 'generated')
          for (const seed of [1, 7, 42]) {
            const seedFor = seed * 1000 + li * 50 + si
            expect(shape(make(step, seedFor)), `lesson ${lesson.id} step ${si} seed ${seed}`).toEqual(shape(make(other, seedFor)))
          }
        })
      })
    })
  }
})

describe('the deal of lesson 1', () => {
  it('gives ten to each player and two to the skat, clockwise from the left, the dealer last', () => {
    const count = (to: string) => DEAL_PACKETS.filter((p) => p.to === to).reduce((n, p) => n + p.n, 0)
    expect([count('left'), count('right'), count('you'), count('skat')]).toEqual([10, 10, 10, 2])
    expect(DEAL_PACKETS.map((p) => p.n)).toEqual([3, 3, 3, 2, 4, 4, 4, 3, 3, 3])
    expect(DEAL_PACKETS.filter((p) => p.to !== 'skat').map((p) => p.to)).toEqual(['left', 'right', 'you', 'left', 'right', 'you', 'left', 'right', 'you'])
  })
})

describe('the messages', () => {
  const catalogues: Record<Locale, Record<string, string>> = { en, de }

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
