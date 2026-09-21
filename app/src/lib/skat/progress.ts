import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Course progress. There are no accounts (pt_users is empty and nothing signs anyone up), so the
// browser is the only place it can live.
//
// The course renders in the browser only (components/skat/client-page), so the store can read
// localStorage as soon as it is created. `hydrated` still exists because that read is asynchronous
// in zustand's contract: until it lands, every lesson but the first looks locked, and the lesson
// page must not bounce a learner off a lesson they have in fact unlocked.

export type LessonRecord = { stars: 1 | 2 | 3; mistakes: number }
export type Tally = { games: number; won: number; score: number }

type ProgressState = {
  hydrated: boolean
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
      hydrated: false,
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

// With localStorage the read finishes synchronously, inside `create` — before `useProgress` is even
// assigned — so the flag cannot be set from a callback passed to `persist`. Set it here instead, for
// both the case that already happened and the one that has not.
//
// On the server (the course map renders there, SKATGO-1) there is no localStorage, zustand attaches
// no `persist` API, and there is nothing to hydrate: the store stays empty and `hydrated` false.
if (useProgress.persist) {
  if (useProgress.persist.hasHydrated()) useProgress.setState({ hydrated: true })
  useProgress.persist.onFinishHydration(() => useProgress.setState({ hydrated: true }))
}
