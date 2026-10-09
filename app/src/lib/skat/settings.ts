import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// The learner's display preferences, kept in this browser like the progress, under a key of their own so
// a change here can never touch the progress. SKATGO-66: the deck the cards are drawn in. The default is
// the German tournament Skat deck (French suits, four colours, B / D / K / A); `german` is the
// German-suited deck; `jqk` is the tournament deck with the international letters J / Q / K / A, which
// official Skat does not use. (v1 held the card colours SKATGO-66 removed.)

export type Deck = 'tournament' | 'german' | 'jqk'

type SettingsState = {
  deck: Deck
  setDeck: (d: Deck) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      deck: 'tournament',
      setDeck: (deck) => set({ deck }),
    }),
    {
      name: 'skatgo.settings.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ deck: s.deck }),
    },
  ),
)

/** The deck to draw in: the default on the server and in the first browser render, so the markup
 *  hydrates; a stored choice applies at once after mount. */
export function useDeck(): Deck {
  const stored = useSettings((s) => s.deck)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? stored : 'tournament'
}
