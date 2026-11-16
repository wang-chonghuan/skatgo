import { FPS, GAP, THINK, TRICK, type Segment } from './types'

export type Slot = Segment & { from: number; length: number }

/** When each line starts and how long its scene lasts: its audio, a breath, and the extra time a scene needs to be
 *  seen (the quiz's countdown, the answer's tricks). */
export function timeline(segments: Segment[], tricks: number): { slots: Slot[]; total: number } {
  let at = 0
  const slots = segments.map((s) => {
    const spoken = s.frames ?? 2 * FPS
    const extra = s.scene === 'question' ? THINK : s.scene === 'play' ? Math.max(0, tricks * TRICK - spoken) : 0
    const slot = { ...s, from: at, length: spoken + GAP + extra }
    at += slot.length
    return slot
  })
  return { slots, total: at + FPS }
}
