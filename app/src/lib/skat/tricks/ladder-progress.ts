import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// The "Sieg sichern" ladder's progress (SKATGO-108, the human agreed: 「只存在浏览器里」): which steps were
// answered right, in this browser only — no account. Like the course's progress (progress.ts) it is applied
// after mount; on the server the store stays empty.

type LadderState = {
  solved: string[]
  solve: (id: string) => void
}

export const useLadder = create<LadderState>()(
  persist(
    (set) => ({
      solved: [],
      solve: (id) => set((s) => (s.solved.includes(id) ? s : { solved: [...s.solved, id] })),
    }),
    { name: 'skatgo.ladder.v1', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ solved: s.solved }) },
  ),
)
