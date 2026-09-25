import { beforeEach, describe, expect, it } from 'vitest'

import { COURSES } from '~/lib/skat/lessons/content'
import { locales } from '~/paraglide/runtime'
import { buildSystemPrompt } from './context'
import { readModelDeltas } from './azure'
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

  it('lets one visitor ask perVisitor times a minute, then refuses until the window passes', () => {
    const t0 = Date.parse('2026-09-22T10:00:00Z')
    for (let i = 0; i < LIMITS.perVisitor; i++) expect(admit('a', t0 + i)).toBeNull()
    expect(admit('a', t0 + LIMITS.perVisitor)).toBe('rate')
    expect(admit('b', t0 + LIMITS.perVisitor)).toBeNull()
    expect(admit('a', t0 + LIMITS.windowMs + 1)).toBeNull()
  })

  it('stops the whole site at the daily cap and starts over the next UTC day', () => {
    const t0 = Date.parse('2026-09-22T23:59:00Z')
    for (let i = 0; i < LIMITS.perDay; i++) expect(admit(`user${i}`, t0)).toBeNull()
    expect(admit('late', t0)).toBe('daily')
    expect(admit('late', Date.parse('2026-09-23T00:00:01Z'))).toBeNull()
  })
})

describe('the model stream (SKATGO-14)', () => {
  const streamOf = (...chunks: string[]) =>
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(new TextEncoder().encode(c))
        controller.close()
      },
    })
  const collect = async (body: ReadableStream<Uint8Array>) => {
    const out: string[] = []
    for await (const piece of readModelDeltas(body)) out.push(piece)
    return out
  }

  it('yields the text pieces in order, across chunk boundaries, and stops at [DONE]', async () => {
    const line = (content: string | null) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
    const all = line(null) + line('斯卡') + line('特有') + ': keep-alive\n\n' + `data: ${JSON.stringify({ choices: [] })}\n\n` + line(' 32 张') + 'data: [DONE]\n\n' + line('never')
    // Split the bytes anywhere, including inside a line.
    const cut = [7, 40, 41, 90]
    const chunks = [all.slice(0, cut[0]), ...cut.map((c, i) => all.slice(c, cut[i + 1]))]
    expect(await collect(streamOf(...chunks))).toEqual(['斯卡', '特有', ' 32 张'])
  })

  it('ends quietly when the stream ends without [DONE]', async () => {
    expect(await collect(streamOf(`data: ${JSON.stringify({ choices: [{ delta: { content: 'a' } }] })}\n`))).toEqual(['a'])
  })
})
