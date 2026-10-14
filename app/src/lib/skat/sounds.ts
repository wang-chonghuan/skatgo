import { sound } from '../../theme/constants'
import { useSettings } from './settings'

// The cards' sounds at the table (SKATGO-101, the human: 「发牌时那种快速拨动牌的声音，以及打牌时抽牌出去的声音」):
// a riffle when a deal is dealt, a card's sound for every card played, a sound when a trick is gathered in.
// Played through the Web Audio API, which a browser lets speak only after the page has been touched; until then,
// and wherever audio fails, the table plays on in silence.
//
// For now there are several sets to choose from in the settings, to try them one by one (the human: 「这个好像太
// 沉重……在setting里加上很多音效套装，我一个一个试试」); the one kept stays, the others go. Their files are Kenney's
// Casino Audio and BMacZero's Playing Card Sounds, both CC0 (licences in app/public/sounds), trimmed and levelled to
// MP3 by .intentfold/tickets/SKATGO-101/make-sounds.sh; "Papier" is drawn by the browser itself, from noise.

export type CardSound = 'deal' | 'play' | 'collect'

/** One kind of sound in a set: files picked at random, played at `rate` (1 = as recorded) and `gain`; or drawn. */
type Voice = { files: string[]; rate?: number; gain?: number } | { draw: (ctx: AudioContext, gain: GainNode) => void }

export const SOUND_SETS = ['kenney', 'kenney-light', 'kenney-bright', 'bmac', 'mix', 'paper'] as const
export type SoundSet = (typeof SOUND_SETS)[number]
export const SOUND_SET_NAMES: Record<SoundSet, string> = {
  kenney: '1 · Kenney Original',
  'kenney-light': '2 · Kenney Leicht',
  'kenney-bright': '3 · Kenney Hell',
  bmac: '4 · BMacZero',
  mix: '5 · Mix',
  paper: '6 · Papier',
}

/** Noise through a filter, rising at once and dying away over `length` seconds, `at` seconds from now. */
function swish(ctx: AudioContext, out: AudioNode, at: number, length: number, filter: BiquadFilterType, from: number, to: number, level: number) {
  const n = Math.ceil(ctx.sampleRate * length)
  const noise = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = noise
  const f = ctx.createBiquadFilter()
  f.type = filter
  const t = ctx.currentTime + at
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + length)
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(level, t + 0.004)
  env.gain.exponentialRampToValueAtTime(0.0001, t + length)
  src.connect(f).connect(env).connect(out)
  src.start(t)
  src.stop(t + length + 0.02)
}

const SETS: Record<SoundSet, Record<CardSound, Voice>> = {
  kenney: {
    deal: { files: ['deal-1', 'deal-2'] },
    play: { files: ['play-1', 'play-2', 'play-3', 'play-4'] },
    collect: { files: ['collect-1', 'collect-2'] },
  },
  'kenney-light': {
    deal: { files: ['deal-1'], gain: 0.7 },
    play: { files: ['place-1', 'place-2', 'place-3'], gain: 0.8 },
    collect: { files: ['slide-soft'], gain: 0.8 },
  },
  'kenney-bright': {
    deal: { files: ['deal-1', 'deal-2'], rate: 1.3, gain: 0.75 },
    play: { files: ['play-1', 'play-2', 'play-3', 'play-4'], rate: 1.3, gain: 0.75 },
    collect: { files: ['collect-1', 'collect-2'], rate: 1.3, gain: 0.75 },
  },
  bmac: {
    deal: { files: ['bmac-deal'] },
    play: { files: ['bmac-play-1', 'bmac-play-2'] },
    collect: { files: ['bmac-collect'] },
  },
  mix: {
    deal: { files: ['bmac-deal'] },
    play: { files: ['place-1', 'place-2', 'place-3'], gain: 0.8 },
    collect: { files: ['bmac-collect'] },
  },
  paper: {
    // rapid soft ticks, a light flick of paper, a soft swish
    deal: { draw: (ctx, out) => { for (let i = 0; i < 9; i++) swish(ctx, out, i * 0.045, 0.03, 'highpass', 3500, 2500, 0.5 + Math.random() * 0.3) } },
    play: { draw: (ctx, out) => swish(ctx, out, 0, 0.09, 'bandpass', 3200, 1600, 0.9) },
    collect: { draw: (ctx, out) => swish(ctx, out, 0, 0.16, 'lowpass', 3000, 700, 0.6) },
  },
}

let context: AudioContext | null = null
const buffers = new Map<string, AudioBuffer | null>()
const last: Partial<Record<CardSound, number>> = {}
let woken = false

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

/** Fetch and decode a set's sounds once, and let the first touch or key anywhere wake the audio up. */
export function loadSounds(set: SoundSet = useSettings.getState().soundSet): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const ctx = audio()
  if (!ctx) return Promise.resolve()
  if (!woken) {
    woken = true
    const wake = () => void ctx.resume().catch(() => {})
    for (const type of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(type, wake, { capture: true, passive: true })
  }
  const names = Object.values(SETS[set]).flatMap((v) => ('files' in v ? v.files : [])).filter((n) => !buffers.has(n))
  return Promise.all(
    names.map(async (name) => {
      buffers.set(name, null)
      try {
        const res = await fetch(`/sounds/${name}.mp3`)
        buffers.set(name, await ctx.decodeAudioData(await res.arrayBuffer()))
      } catch {
        buffers.delete(name)
      }
    }),
  ).then(() => undefined)
}

/** One of the kind's sounds in the chosen set, unless sound is off, the page is hidden, audio is not awake yet,
 *  or one of the kind has just played. `set` plays another set than the chosen one (the settings' trial). */
export function playSound(kind: CardSound, set?: SoundSet) {
  const settings = useSettings.getState()
  if (typeof document === 'undefined' || document.hidden || (!set && !settings.sounds)) return
  const ctx = context
  if (!ctx) return
  if (ctx.state !== 'running') {
    void ctx.resume().catch(() => {})
    return
  }
  const now = performance.now()
  if (!set && now - (last[kind] ?? -Infinity) < sound.gap) return
  last[kind] = now
  const voice = SETS[set ?? settings.soundSet][kind]
  try {
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    if ('draw' in voice) {
      gain.gain.value = sound.volume
      voice.draw(ctx, gain)
      return
    }
    const choices = voice.files.map((n) => buffers.get(n)).filter((b): b is AudioBuffer => !!b)
    if (!choices.length) return
    const source = ctx.createBufferSource()
    source.buffer = choices[Math.floor(Math.random() * choices.length)]
    source.playbackRate.value = voice.rate ?? 1
    gain.gain.value = sound.volume * (voice.gain ?? 1)
    source.connect(gain)
    source.start()
  } catch {
    // No sound this time; the game goes on.
  }
}

/** The settings' trial of a set: a deal, three cards and a trick gathered in. */
export async function trySoundSet(set: SoundSet) {
  await loadSounds(set)
  await context?.resume().catch(() => {})
  const steps: [CardSound, number][] = [['deal', 0], ['play', 1100], ['play', 1500], ['play', 1900], ['collect', 2500]]
  for (const [kind, at] of steps) window.setTimeout(() => playSound(kind, set), at)
}
