import { createHash } from 'node:crypto'
import { FORUM_LANGS, type ForumLang } from '../../app/src/lib/forum'
import type { Store } from './store'

// What people write, in the reader's language (SKATGO-124, the human: 「不管用户发啥语言的帖子，看到的都是他ui上的语言的翻
// 译版。用便宜的翻译功能实现」). Each text is translated once per language by the site's model and kept in `translations`,
// keyed by the text itself (its sha256), so the same words are never translated twice and any text, wherever it
// stands, is looked up the same way. A text not yet translated shows as written while it is translated in the
// background, one at a time; a page never waits for the model.

/** The site's model, as the assistant uses it (app/src/lib/ask/azure.ts); low effort is enough to translate (the
 *  human: 「用luna low就行」). */
const MODEL = 'gpt-5.6-luna'
const EFFORT = 'low'

const NAME: Record<ForumLang, string> = { de: 'German', en: 'English' }

/** What the model is told: translate faithfully, keep everything that is not prose, and say the language it was
 *  written in. */
const prompt = (lang: ForumLang) => `You translate posts and comments of a Skat forum into ${NAME[lang]}.
Reply with JSON only: {"from": "<ISO 639-1 code of the language the text is written in>", "text": "<the text in ${NAME[lang]}>"}.
If the text is already in ${NAME[lang]}, or already says it in ${NAME[lang]} beside another language (two languages side by side, as in "Hello · Hallo"), reply {"from": "${lang}"} and nothing else.
Translate faithfully: nothing added, nothing left out, the same tone.
Keep exactly as they are: line breaks; the marks ##, ###, "- ", "1. " and **…**; links [text](url) — translate the text, never the url; bare urls; card rows in square brackets such as [♠A ♠10 ♥K]; @names; numbers; emoji.
Keep the German words a Skat table uses as they are: Grand, Null, Hand, Schneider, Schwarz, Ouvert, Ramsch, Bock, Kontra, Re, Skat, Matador, Bube, Dame.`

export type Translation = { from: string; text: string }

const hashOf = (text: string) => createHash('sha256').update(text).digest('hex')

/** What is known for `texts` in `lang`, by text; a text not known yet is queued for translation. */
export async function translationsOf(store: Store, texts: string[], lang: ForumLang): Promise<Map<string, Translation>> {
  const unique = [...new Set(texts.filter((t) => t.trim()))]
  const known = new Map<string, Translation>()
  if (unique.length === 0) return known
  const { rows } = await store.pool.query('SELECT hash, source_lang, text FROM translations WHERE lang = $1 AND hash = ANY($2)', [lang, unique.map(hashOf)])
  const byHash = new Map(rows.map((r) => [r.hash as string, { from: r.source_lang as string, text: r.text as string }]))
  for (const t of unique) {
    const found = byHash.get(hashOf(t))
    if (found) known.set(t, found)
    else translateLater(store, t, lang)
  }
  return known
}

/** Queues `texts` for every language of the site: what is written now is ready before anyone else reads it. */
export function translateForAll(store: Store, texts: string[]) {
  for (const t of texts) if (t.trim()) for (const lang of FORUM_LANGS) translateLater(store, t, lang)
}

const waiting = new Map<string, { text: string; lang: ForumLang }>()
let working = false

function translateLater(store: Store, text: string, lang: ForumLang) {
  if (!process.env.LLM_BASE_URL || !process.env.LLM_API_KEY) return
  const key = `${hashOf(text)}:${lang}`
  if (!waiting.has(key)) waiting.set(key, { text, lang })
  if (!working) void work(store)
}

async function work(store: Store) {
  working = true
  try {
    for (const [key, { text, lang }] of waiting) {
      try {
        const done = await translate(text, lang)
        await store.pool.query(
          'INSERT INTO translations (hash, lang, source_lang, text, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [hashOf(text), lang, done.from, done.text, Date.now()])
      } catch (e) {
        // Shown as written meanwhile; the next reading asks again. The text itself is never logged.
        console.error(JSON.stringify({ event: 'translation_failed', reason: (e as Error).message }))
      }
      waiting.delete(key)
    }
  } finally {
    working = false
  }
}

/** One text into `lang` by the site's model: the language it was written in, and the text in `lang` — as written when
 *  it already is. */
async function translate(text: string, lang: ForumLang): Promise<Translation> {
  const res = await fetch(`${process.env.LLM_BASE_URL!.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(120_000),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || MODEL,
      reasoning_effort: EFFORT,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: prompt(lang) }, { role: 'user', content: text }],
    }),
  })
  if (!res.ok) {
    await res.body?.cancel()
    throw new Error(`upstream ${res.status}`)
  }
  const answer = JSON.parse((await res.json()).choices?.[0]?.message?.content ?? '{}') as { from?: unknown; text?: unknown }
  const from = typeof answer.from === 'string' ? answer.from.toLowerCase() : ''
  if (!/^[a-z]{2,3}$/.test(from)) throw new Error('no_language')
  if (from === lang) return { from, text }
  if (typeof answer.text !== 'string' || !answer.text.trim()) throw new Error('no_text')
  return { from, text: answer.text }
}
