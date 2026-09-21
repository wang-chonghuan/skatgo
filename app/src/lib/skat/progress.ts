import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Course progress. There are no accounts (pt_users is empty and nothing signs anyone up), so the
// browser is the only place it can live.
//
// Progress no longer gates anything (SKATGO-7: every lesson opens directly); it records stars and
// games, and the course map applies it after mount (course-home.tsx). On the server there is no
// localStorage and the store simply stays empty.

export type LessonRecord = { stars: 1 | 2 | 3; mistakes: number }
export type Tally = { games: number; won: number; score: number }

type ProgressState = {
  done: Record<string, LessonRecord>
  tally: Tally
  complete: (lessonId: string, mistakes: number) => LessonRecord
  recordGame: (won: boolean, score: number) => void
  reset: () => void
}

export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3
  return mistakes <= 2 ? 2 : 1
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      done: {},
      tally: { games: 0, won: 0, score: 0 },
      complete: (lessonId, mistakes) => {
        const before = get().done[lessonId]
        const stars = starsFor(mistakes)
        // Replaying a lesson can only improve its record — a careless second run must not take a
        // star away, or nobody would ever revise.
        const record = before && before.stars >= stars ? before : { stars, mistakes }
        set((s) => ({ done: { ...s.done, [lessonId]: record } }))
        return record
      },
      recordGame: (won, score) =>
        set((s) => ({ tally: { games: s.tally.games + 1, won: s.tally.won + (won ? 1 : 0), score: s.tally.score + score } })),
      reset: () => set({ done: {}, tally: { games: 0, won: 0, score: 0 } }),
    }),
    {
      name: 'parrottoon.skat.progress.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ done: s.done, tally: s.tally }),
    },
  ),
)
