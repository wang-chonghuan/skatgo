import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// The learner's display preferences (SKATGO-27), kept in this browser like the progress, under a key
// of their own so a change here can never touch the progress.

export type CardColours = 'german' | 'four' | 'two'

type SettingsState = {
  cardColours: CardColours
  setCardColours: (c: CardColours) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      cardColours: 'german',
      setCardColours: (cardColours) => set({ cardColours }),
    }),
    {
      name: 'skatgo.settings.v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cardColours: s.cardColours }),
    },
  ),
)
