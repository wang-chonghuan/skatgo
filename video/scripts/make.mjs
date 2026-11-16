// A day's video (SKATGO-202), in German and in English: the day before's deal of the day played out by the AI, then
// that day's as a question left for tomorrow.
//   npm --prefix video run make [-- YYYY-MM-DD]      (default: today in Berlin)
// Reads both deals from the production database (read-only, through the Render CLI), plans what each video shows
// and says (plan.ts), has Azure speak each line (Seraphina HD, the human's choice), and renders out/<day>/*.mp4.
// Needs RENDER_API_KEY (from ~/.zshrc) and the speech key in .intentfold/tmp/video/speech.env.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'

const VIDEO = path.resolve(import.meta.dirname, '..')
const ROOT = path.resolve(VIDEO, '..')
const VOICE = 'de-DE-Seraphina:DragonHDLatestNeural'
const FPS = 30
// 96 kbit/s constant-rate MP3, so a line's length is its size.
const FORMAT = 'audio-24khz-96kbitrate-mono-mp3'
const BYTES_PER_SECOND = 96000 / 8

const berlin = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const day = process.argv[2] ?? berlin(new Date())
const before = berlin(new Date(Date.parse(`${day}T12:00:00Z`) - 86_400_000))

function env(file) {
  return Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
}
const speech = env(path.join(ROOT, '.intentfold/tmp/video/speech.env'))
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
  execFileSync('node', ['--import', 'tsx', path.join(VIDEO, 'scripts/plan.ts'), spec(day), spec(before), lang, file], { cwd: path.join(ROOT, 'multiplayer'), stdio: 'inherit' })
  return JSON.parse(readFileSync(file, 'utf8'))
}

const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
async function speak(text, file, lang) {
  const ssml = `<speak version='1.0' xml:lang='${lang === 'en' ? 'en-US' : 'de-DE'}' xmlns='http://www.w3.org/2001/10/synthesis'><voice name='${VOICE}'>${xml(text)}</voice></speak>`
  const r = await fetch(`https://${speech.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': speech.AZURE_SPEECH_KEY, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'skatgo-video' },
    body: ssml,
  })
  if (!r.ok) throw new Error(`speech ${r.status}: ${await r.text()}`)
  writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  return Math.ceil((statSync(file).size / BYTES_PER_SECOND) * FPS)
}

/** One day's video in one language: yesterday's deal played out, then today's as the question. */
async function make(lang) {
  const p = plan(lang)
  for (const s of p.segments) {
    const name = `${lang}-${s.id}.mp3`
    s.frames = await speak(s.text, path.join(audioDir, name), lang)
    s.audio = `out/${day}/${name}`
  }
  const props = path.join(out, `props-${lang}.json`)
  writeFileSync(props, JSON.stringify(p))
  const mp4 = path.join(out, `skatgo-${day}-${lang}.mp4`)
  execFileSync(path.join(VIDEO, 'node_modules/.bin/remotion'), ['render', 'src/index.ts', 'Daily', mp4, `--props=${props}`], { cwd: VIDEO, stdio: 'inherit' })
  console.log(`made ${mp4}`)
}

// German and English, the same voice (Seraphina speaks both).
for (const lang of ['de', 'en']) await make(lang)
