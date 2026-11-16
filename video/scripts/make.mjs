// A day's video (SKATGO-202), in German and in English: the day before's deal of the day broken down, then that day's
// left as the challenge, its breakdown the next day.
//   npm --prefix video run make [-- YYYY-MM-DD]      (default: today in Berlin)
// Reads both deals from the production database (read-only, through the Render CLI), plans what the video shows and
// says (plan.ts, the breakdown written by the site's model), has Azure speak each line in a lively voice — each line
// heard back through speech-to-text and spoken again if words went missing — and renders out/<day>/skatgo-<day>-<lang>.mp4.
// Needs RENDER_API_KEY (from ~/.zshrc), the speech key in .intentfold/tmp/video/speech.env and LLM_* in app/.env.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'

const VIDEO = path.resolve(import.meta.dirname, '..')
const ROOT = path.resolve(VIDEO, '..')
// One woman's voice in both languages, lively but lower and calmer (the human: 「要有活力的女声」, then 「这两个女声有点太疯狂了，
// 有没有稍微低沉一点……但是还要有活力」 — chose Harper): Microsoft's MAI Harper, its "educational" style throughout.
const VOICE = { de: { name: 'de-DE-Harper:MAI-Voice-2.1', lang: 'de-DE' }, en: { name: 'en-US-Harper:MAI-Voice-2.1', lang: 'en-US' } }
const STYLE = 'educational'
const FPS = 30
// 96 kbit/s constant-rate MP3, so a line's length is its size.
const FORMAT = 'audio-24khz-96kbitrate-mono-mp3'
const BYTES_PER_SECOND = 96000 / 8
const REMOTION = path.join(VIDEO, 'node_modules/.bin/remotion')

const berlin = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const day = process.argv[2] ?? berlin(new Date())
const before = berlin(new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000))

function env(file) {
  return Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]))
}
const speech = env(path.join(ROOT, '.intentfold/tmp/video/speech.env'))
const llm = Object.fromEntries(Object.entries(env(path.join(ROOT, 'app/.env'))).filter(([k]) => k.startsWith('LLM_')))
const renderKey = process.env.RENDER_API_KEY ?? /export RENDER_API_KEY=["']?([^"'\n]+)/.exec(readFileSync(path.join(process.env.HOME, '.zshrc'), 'utf8'))?.[1]

const out = path.join(VIDEO, 'out', day)
const audioDir = path.join(VIDEO, 'public', 'out', day)
mkdirSync(out, { recursive: true })
mkdirSync(audioDir, { recursive: true })
// The site's own pictures and font, copied in for the render (public/site is not committed).
const site = path.join(VIDEO, 'public', 'site')
cpSync(path.join(ROOT, 'app/public/cards'), path.join(site, 'cards'), { recursive: true })
cpSync(path.join(ROOT, 'app/public/logo-mark.png'), path.join(site, 'logo-mark.png'))
cpSync(path.join(ROOT, 'multiplayer/assets/fonts'), path.join(site, 'fonts'), { recursive: true })

/** The day's deal of the day as stored: dealer, deck and the AI's game of it; read once per day. */
const specs = new Map()
function spec(d) {
  if (specs.has(d)) return specs.get(d)
  const sql = `SELECT json_build_object('day', day, 'spec', deals->0)::text FROM daily_deals WHERE size = 1 AND day = '${d}'`
  const text = execFileSync('render', ['psql', 'skatgo-multiplayer-db', '--confirm', '--output', 'text', '--command', '\\pset tuples_only on', '--command', sql], { env: { ...process.env, RENDER_API_KEY: renderKey }, encoding: 'utf8' })
  const line = text.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'))
  if (!line) throw new Error(`no deal of the day stored for ${d}`)
  const file = path.join(out, `spec-${d}.json`)
  writeFileSync(file, line)
  specs.set(d, file)
  return file
}

function plan(lang) {
  const file = path.join(out, `plan-${lang}.json`)
  execFileSync('node', ['--import', 'tsx', path.join(VIDEO, 'scripts/plan.ts'), spec(day), spec(before), lang, file], { cwd: path.join(ROOT, 'multiplayer'), stdio: 'inherit', env: { ...process.env, ...llm } })
  return JSON.parse(readFileSync(file, 'utf8'))
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const AZURE = `${speech.AZURE_SPEECH_REGION}.tts.speech.microsoft.com`

async function synthesize(text, file, lang, style) {
  const v = VOICE[lang]
  // A breath first: the styled voices otherwise sometimes swallow a line's first words. A little brisker.
  const ssml = `<speak version='1.0' xml:lang='${v.lang}' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts'><voice name='${v.name}'><mstts:express-as style='${style}'><break time='300ms'/><prosody rate='+10%'>${xml(text)}</prosody></mstts:express-as></voice></speak>`
  const r = await fetch(`https://${AZURE}/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': speech.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'skatgo-video' },
    body: ssml,
  })
  if (!r.ok) throw new Error(`speech ${r.status}: ${await r.text()}`)
  writeFileSync(file, Buffer.from(await r.arrayBuffer()))
}

/** What the line sounds like, heard back through Azure's speech-to-text. */
async function hear(file, lang) {
  const wav = file.replace(/\.mp3$/, '.wav')
  execFileSync(REMOTION, ['ffmpeg', '-loglevel', 'error', '-y', '-i', file, '-ar', '16000', '-ac', '1', wav], { cwd: VIDEO, stdio: 'ignore' })
  const r = await fetch(`https://${speech.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${VOICE[lang].lang}&profanity=raw`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': speech.AZURE_SPEECH_KEY, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000' },
    body: readFileSync(wav),
  })
  return r.ok ? ((await r.json()).DisplayText ?? '') : ''
}

// Speech-to-text writes numbers as digits and some card words its own way; both sides are compared in one spelling.
const SAME = {
  ein: '1', eins: '1', zwei: '2', drei: '3', vier: '4', sieben: '7', acht: '8', neun: '9', zehn: '10',
  one: '1', two: '2', three: '3', four: '4', seven: '7', eight: '8', nine: '9', ten: '10', pick: 'pik',
}
const words = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).map((w) => SAME[w] ?? w).filter((w) => w.length > 1)
function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
/** How well the line was heard: the share of its words found, loosely (speech-to-text hears "Buben" as "Bubbin" and
 *  "Rearhand" as "rear hand"), and whether its first words were — what the styled voices sometimes swallow. */
function hearing(text, heard) {
  const got = words(heard)
  const pool = [...got, ...got.slice(1).map((w, i) => got[i] + w)]
  const found = (w) => pool.some((h) => h === w || distance(h, w) <= Math.max(1, Math.floor(w.length / 3)))
  const want = words(text)
  const share = want.filter(found).length / Math.max(1, want.length)
  return { share, start: want.slice(0, 2).some(found) }
}

/** A line spoken and checked by ear; spoken again when words went missing, and after three takes the best one kept.
 *  Its length in frames. */
async function speak(text, file, lang, style) {
  let best = { score: -1, take: '' }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const take = file.replace(/\.mp3$/, `.take${attempt}.mp3`)
    await synthesize(text, take, lang, style)
    const heard = await hear(take, lang)
    const h = hearing(text, heard)
    const score = h.share + (h.start ? 1 : 0)
    if (score > best.score) best = { score, take }
    if (h.start && h.share >= 0.75) break
    console.warn(`line spoken again (${attempt}): "${text}" was heard as "${heard}"`)
  }
  cpSync(best.take, file)
  return Math.ceil((statSync(file).size / BYTES_PER_SECOND) * FPS)
}

/** One day's video in one language: yesterday's deal broken down, then today's as the challenge. */
async function make(lang) {
  const p = plan(lang)
  for (const s of p.segments) {
    const name = `${lang}-${s.id}.mp3`
    s.frames = await speak(s.text, path.join(audioDir, name), lang, STYLE)
    s.audio = `out/${day}/${name}`
  }
  const props = path.join(out, `props-${lang}.json`)
  writeFileSync(props, JSON.stringify(p))
  const mp4 = path.join(out, `skatgo-${day}-${lang}.mp4`)
  execFileSync(REMOTION, ['render', 'src/index.ts', 'Daily', mp4, `--props=${props}`], { cwd: VIDEO, stdio: 'inherit' })
  console.log(`made ${mp4}`)
}

for (const lang of ['de', 'en']) await make(lang)
