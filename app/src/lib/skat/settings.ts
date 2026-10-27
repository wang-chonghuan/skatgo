import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { type CardBack, DEFAULT_BACK, isCardBack } from './backs'

// The learner's display preferences, kept in this browser like the progress, under a key of their own so
// a change here can never touch the progress. SKATGO-66: the deck the cards are drawn in. The default is
// the Turnierblatt, the German Skat association's tournament deck (French suits in German colours,
// B / D / K / A); `german` is the Deutsches Blatt; `jqk` is the Turnierblatt with the English letters
// J / Q / K / A, which official Skat does not use. (v1 held the card colours SKATGO-66 removed.)

export type Deck = 'tournament' | 'german' | 'jqk'

type SettingsState = {
  deck: Deck
  setDeck: (d: Deck) => void
  /** SKATGO-75: a finished trick waits for the learner's tap (the hand of SKATGO-72) instead of going by
   *  itself after a short pause. Off by default. */
  tapToCollect: boolean
  setTapToCollect: (on: boolean) => void
  /** SKATGO-101: the cards' sounds at the table. On by default (the human: 「默认开」). */
  sounds: boolean
  setSounds: (on: boolean) => void
  /** SKATGO-102: the cards' back, to choose in the settings (lib/skat/backs.ts). */
  back: CardBack
  setBack: (back: CardBack) => void
  /** SKATGO-127: the info board's "Augen" cell shows the tricks each side has taken instead, for a player who keeps
   *  count themselves; switched by a tap on the cell, off (card points) by default. */
  boardTricks: boolean
  setBoardTricks: (on: boolean) => void
  /** SKATGO-142: Lina and Noah talk at free play's table. On by default; off, the table asks nothing of the model. */
  talk: boolean
  setTalk: (on: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      deck: 'tournament',
      setDeck: (deck) => set({ deck }),
      tapToCollect: false,
      setTapToCollect: (tapToCollect) => set({ tapToCollect }),
      sounds: true,
      setSounds: (sounds) => set({ sounds }),
      back: DEFAULT_BACK,
      setBack: (back) => set({ back }),
      boardTricks: false,
      setBoardTricks: (boardTricks) => set({ boardTricks }),
      talk: true,
      setTalk: (talk) => set({ talk }),
    }),
    {
      name: 'skatgo.settings.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ deck: s.deck, tapToCollect: s.tapToCollect, sounds: s.sounds, back: s.back, boardTricks: s.boardTricks, talk: s.talk }),
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

/** Whether a finished trick waits for a tap (SKATGO-75): off on the server and in the first browser
 *  render, like the deck; a stored choice applies at once after mount. */
export function useTapToCollect(): boolean {
  const stored = useSettings((s) => s.tapToCollect)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && stored
}

/** Whether the info board counts tricks instead of card points (SKATGO-127): off on the server and in the first
 *  browser render, like the deck; a stored choice applies at once after mount. */
export function useBoardTricks(): boolean {
  const stored = useSettings((s) => s.boardTricks)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && stored
}

/** The back to draw: the default on the server and in the first browser render, so the markup hydrates; a stored
 *  choice applies at once after mount, unless it names a back there no longer is (SKATGO-102). */
export function useBack(): CardBack {
  const stored = useSettings((s) => s.back)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && isCardBack(stored) ? stored : DEFAULT_BACK
}
