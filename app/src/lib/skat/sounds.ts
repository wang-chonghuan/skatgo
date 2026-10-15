import { sound } from '../../theme/constants'
import { useSettings } from './settings'

// The cards' sounds at the table (SKATGO-101, the human: 「发牌时那种快速拨动牌的声音，以及打牌时抽牌出去的声音」):
// a riffle when a deal is dealt, a card set down for every card played, a soft slide when a trick is gathered in.
// The human tried six sets and kept Kenney's lightest card sounds (「选2号」, after 「这个好像太沉重」). They are from
// Kenney's Casino Audio (CC0, app/public/sounds/LICENSE-kenney-casino-audio.txt), trimmed, levelled and kept as MP3
// by .intentfold/tickets/SKATGO-101/make-sounds.sh. Played through the Web Audio API, which a browser lets speak
// only after the page has been touched; wherever audio fails, the table plays on in silence.
//
// SKATGO-106 (the human: 「发牌时有时没声音」): the files are fetched as soon as any page is up, not when a table
// appears, and the audio is made and woken inside the first touch or key anywhere — on an iPhone only a
// touch can wake it, so the tap that opens a table does. A sound asked for before the audio is ready (the
// first deal of a visit, or a phone just back from the lock screen) waits for it, briefly: `sound.late`.

export type CardSound = 'deal' | 'play' | 'collect'

/** Each kind's files, one picked at random, and its loudness against `sound.volume`. */
const VOICES: Record<CardSound, { files: string[]; gain: number }> = {
  deal: { files: ['deal'], gain: 0.7 },
  play: { files: ['play-1', 'play-2', 'play-3'], gain: 0.8 },
  collect: { files: ['collect'], gain: 0.8 },
}

let context: AudioContext | null = null
let files: Promise<Partial<Record<CardSound, ArrayBuffer[]>>> | null = null
let decoding: Promise<void> | null = null
const buffers: Partial<Record<CardSound, AudioBuffer[]>> = {}
const last: Partial<Record<CardSound, number>> = {}
/** Sounds asked for before the audio was ready, and when. */
const waiting: Partial<Record<CardSound, number>> = {}

/** Once per page: fetch the files, and let every touch or key wake the audio — making it the first time. */
export function primeSounds() {
  if (files || typeof window === 'undefined') return
  files = fetchFiles()
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(type, wake, { capture: true, passive: true })
}

async function fetchFiles() {
  const out: Partial<Record<CardSound, ArrayBuffer[]>> = {}
  await Promise.all(
    (Object.keys(VOICES) as CardSound[]).map(async (kind) => {
      const got = await Promise.all(
        VOICES[kind].files.map(async (name) => {
          try {
            const res = await fetch(`/sounds/${name}.mp3`)
            return res.ok ? await res.arrayBuffer() : null
          } catch {
            return null
          }
        }),
      )
      out[kind] = got.filter((b): b is ArrayBuffer => b !== null)
    }),
  )
  return out
}

/** Inside a touch or key: make the audio if there is none yet, and wake it if it sleeps. On an iPhone a sound
 *  started in the touch itself is what unlocks it, so a silent one is started too. */
function wake() {
  const ctx = audio()
  if (!ctx) return
  void decode(ctx)
  if (ctx.state === 'running') return
  try {
    const silence = ctx.createBufferSource()
    silence.buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    silence.connect(ctx.destination)
    silence.start()
  } catch {
    // Nothing to unlock with; resume() alone may do.
  }
  void ctx.resume().then(flush, () => {})
}

function audio(): AudioContext | null {
  if (context) return context
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    context = Ctx ? new Ctx() : null
  } catch {
    context = null
  }
  if (context) context.onstatechange = flush
  return context
}

/** Decode the fetched files once, with the audio they will play through. */
function decode(ctx: AudioContext): Promise<void> {
  if (decoding || !files) return decoding ?? Promise.resolve()
  const fetched = files
  decoding = fetched
    .then((got) =>
      Promise.all(
        (Object.keys(got) as CardSound[]).map(async (kind) => {
          const decoded = await Promise.all(
            (got[kind] ?? []).map(async (bytes) => {
              try {
                return await ctx.decodeAudioData(bytes)
              } catch {
                return null
              }
            }),
          )
          buffers[kind] = decoded.filter((b): b is AudioBuffer => b !== null)
        }),
      ),
    )
    .then(flush)
  return decoding
}

/** Play what was waiting for the audio, unless it waited too long to still belong to what is on the table. */
function flush() {
  const now = performance.now()
  for (const kind of Object.keys(waiting) as CardSound[]) {
    if (now - (waiting[kind] ?? -Infinity) > sound.late) delete waiting[kind]
    else if (ready(kind)) {
      delete waiting[kind]
      start(kind)
    }
  }
}

function ready(kind: CardSound) {
  return context?.state === 'running' && Boolean(buffers[kind]?.length)
}

/** One of the kind's sounds, at random, unless sound is off in the settings or the page is hidden. Before the
 *  audio is ready it waits, briefly, for it. */
export function playSound(kind: CardSound) {
  if (typeof document === 'undefined' || document.hidden || !useSettings.getState().sounds) return
  if (ready(kind)) return start(kind)
  waiting[kind] = performance.now()
  if (!context) return
  void decode(context)
  if (context.state !== 'running') void context.resume().then(flush, () => {})
}

/** Start one of the kind's sounds, unless one of the kind has just played. */
function start(kind: CardSound) {
  const ctx = context
  const choices = buffers[kind]
  if (!ctx || !choices?.length || document.hidden || !useSettings.getState().sounds) return
  const now = performance.now()
  if (now - (last[kind] ?? -Infinity) < sound.gap) return
  last[kind] = now
  try {
    const source = ctx.createBufferSource()
    source.buffer = choices[Math.floor(Math.random() * choices.length)]
    const gain = ctx.createGain()
    gain.gain.value = sound.volume * VOICES[kind].gain
    source.connect(gain).connect(ctx.destination)
    source.start()
  } catch {
    // No sound this time; the game goes on.
  }
}
