import { describe, expect, it } from 'vitest'

import { legalPlays, sameCard } from '../cards'
import { LESSONS, isUnlocked } from './content'
import type { Step } from './types'

// The course's hand-written exercises are claims about the rules. Each one is checked against the
// engine here, so a typo in a hand cannot teach the learner something false.

function check(step: Exclude<Step, { kind: 'generated' }>, where: string) {
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

describe('the course', () => {
  it('has unique lesson ids and unlocks in order', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    expect(isUnlocked(LESSONS[0].id, {})).toBe(true)
    expect(isUnlocked(LESSONS[1].id, {})).toBe(false)
    expect(isUnlocked(LESSONS[1].id, { [LESSONS[0].id]: true })).toBe(true)
  })

  it('every fixed exercise agrees with the rules engine', () => {
    for (const lesson of LESSONS) {
      lesson.steps.forEach((step, i) => {
        if (step.kind !== 'generated') check(step, `lesson ${lesson.id} step ${i}`)
      })
    }
  })

  it('every generated drill yields a well-formed exercise, many times over', () => {
    for (const lesson of LESSONS) {
      lesson.steps.forEach((step, i) => {
        if (step.kind !== 'generated') return
        for (let n = 0; n < 60; n++) check(step.make(), `lesson ${lesson.id} step ${i} run ${n}`)
      })
    }
  })

  it('ends in a full game', () => {
    const last = LESSONS[LESSONS.length - 1]
    expect(last.steps.some((s) => s.kind === 'game')).toBe(true)
  })
})
