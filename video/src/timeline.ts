import { FPS, GAP, PAUSE, THINK, type Segment } from './types'

export type Slot = Segment & { from: number; length: number }

/** When each line starts and how long its scene lasts: its audio, a breath, and the extra time a scene needs to be
 *  seen (the challenge's countdown, the pause to think). */
export function timeline(segments: Segment[]): { slots: Slot[]; total: number } {
  let at = 0
  const slots = segments.map((s) => {
    const spoken = s.frames ?? 2 * FPS
    const extra = s.scene === 'question' ? THINK : s.pause ? PAUSE : 0
    const slot = { ...s, from: at, length: spoken + GAP + extra }
    at += slot.length
    return slot
  })
  return { slots, total: at + FPS }
}
