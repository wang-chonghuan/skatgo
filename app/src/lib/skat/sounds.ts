import { sound } from '../../theme/constants'
import { useSettings } from './settings'

// The cards' sounds at the table (SKATGO-101, the human: 「发牌时那种快速拨动牌的声音，以及打牌时抽牌出去的声音」):
// a riffle when a deal is dealt, a card set down for every card played, a soft slide when a trick is gathered in.
// The human tried six sets and kept Kenney's lightest card sounds (「选2号」, after 「这个好像太沉重」). They are from
// Kenney's Casino Audio (CC0, app/public/sounds/LICENSE-kenney-casino-audio.txt), trimmed, levelled and kept as MP3
// by .intentfold/tickets/SKATGO-101/make-sounds.sh. Played through the Web Audio API, which a browser lets speak
// only after the page has been touched; until then, and wherever audio fails, the table plays on in silence.

export type CardSound = 'deal' | 'play' | 'collect'

/** Each kind's files, one picked at random, and its loudness against `sound.volume`. */
const VOICES: Record<CardSound, { files: string[]; gain: number }> = {
  deal: { files: ['deal'], gain: 0.7 },
  play: { files: ['play-1', 'play-2', 'play-3'], gain: 0.8 },
  collect: { files: ['collect'], gain: 0.8 },
}

let context: AudioContext | null = null
const buffers: Partial<Record<CardSound, AudioBuffer[]>> = {}
const last: Partial<Record<CardSound, number>> = {}
let loading: Promise<void> | null = null

function audio(): AudioContext | null {
  if (context) return context
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    context = Ctx ? new Ctx() : null
  } catch {
    context = null
  }
  return context
}

/** Fetch and decode the sounds once, and let the first touch or key anywhere wake the audio up. */
export function loadSounds(): Promise<void> {
  if (loading || typeof window === 'undefined') return loading ?? Promise.resolve()
  const ctx = audio()
  if (!ctx) return (loading = Promise.resolve())
  const wake = () => void ctx.resume().catch(() => {})
  for (const type of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(type, wake, { capture: true, passive: true })
  loading = Promise.all(
    (Object.keys(VOICES) as CardSound[]).map(async (kind) => {
      const decoded = await Promise.all(
        VOICES[kind].files.map(async (name) => {
          try {
            const res = await fetch(`/sounds/${name}.mp3`)
            return await ctx.decodeAudioData(await res.arrayBuffer())
          } catch {
            return null
          }
        }),
      )
      buffers[kind] = decoded.filter((b): b is AudioBuffer => b !== null)
    }),
  ).then(() => undefined)
  return loading
}

/** One of the kind's sounds, at random, unless sound is off in the settings, the page is hidden, audio is not
 *  awake yet, or one of the kind has just played. */
export function playSound(kind: CardSound) {
  if (typeof document === 'undefined' || document.hidden || !useSettings.getState().sounds) return
  const ctx = context
  const choices = buffers[kind]
  if (!ctx || !choices?.length) return
  if (ctx.state !== 'running') {
    void ctx.resume().catch(() => {})
    return
  }
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
