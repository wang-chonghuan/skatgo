import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { type CardBack, DEFAULT_BACK, isCardBack } from './backs'
import { type Avatar, DEFAULT_AVATAR, isAvatar } from './face'

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
  /** SKATGO-142: Lina and Noah talk at free play's and the daily tournament's tables. On by default; off, the table asks
   *  nothing of the model. */
  talk: boolean
  setTalk: (on: boolean) => void
  /** SKATGO-147: Lina's and Noah's faces above their cards. On by default (the human: 「默认是开的」). */
  faces: boolean
  setFaces: (on: boolean) => void
  /** SKATGO-167: the face each computer seat wears, Lina's (1) and Noah's (2), chosen by its picture in the settings. Only a
   *  face the player chose is kept (SKATGO-168, the human: 「用户自己选择ai头像后，要能保存下来，以后再打都还是这个头像」); a
   *  seat without one wears its default, so a new default reaches everyone who never chose. */
  avatars: Partial<Record<1 | 2, Avatar>>
  setAvatar: (seat: 1 | 2, avatar: Avatar) => void
  /** SKATGO-157: free play's bid calculator in the bidding drawer. On by default. */
  bidCalc: boolean
  setBidCalc: (on: boolean) => void
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
      faces: true,
      setFaces: (faces) => set({ faces }),
      avatars: {},
      setAvatar: (seat, avatar) => set((s) => ({ avatars: { ...s.avatars, [seat]: avatar } })),
      bidCalc: true,
      setBidCalc: (bidCalc) => set({ bidCalc }),
    }),
    {
      name: 'skatgo.settings.v2',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (stored, version) => migrateSettings(stored, version) as SettingsState,
      partialize: (s) => ({ deck: s.deck, tapToCollect: s.tapToCollect, sounds: s.sounds, back: s.back, boardTricks: s.boardTricks, talk: s.talk, faces: s.faces, avatars: s.avatars, bidCalc: s.bidCalc }),
    },
  ),
)

/** Settings stored by an older version, brought to this one. Version 1 (SKATGO-168): SKATGO-167 stored both seats' faces
 *  with any setting, its defaults too; a seat that still holds its old default ('lina', 'noah') was never chosen, and now
 *  wears the new default. The old man in a cap was redrawn as a lively grandfather (「那个老头要画得精神点，慈祥点」): a seat
 *  that chose him wears the new one. */
export function migrateSettings(stored: unknown, version: number): unknown {
  const s = (stored ?? {}) as { avatars?: Partial<Record<string, string>> }
  if (version < 1 && s.avatars) {
    const old: Record<string, string> = { 1: 'lina', 2: 'noah' }
    const kept = Object.entries(s.avatars).filter(([seat, a]) => old[seat] !== a)
    return { ...s, avatars: Object.fromEntries(kept.map(([seat, a]) => [seat, a === 'man-cap' ? 'man-grandpa' : a])) }
  }
  return s
}

/** Whether Lina's and Noah's faces show (SKATGO-147): on on the server and in the first browser render, so the
 *  markup hydrates; a stored choice applies at once after mount. */
export function useFaces(): boolean {
  const stored = useSettings((s) => s.faces)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? stored : true
}

/** The face a computer seat wears (SKATGO-167): its default on the server and in the first browser render, so the markup
 *  hydrates; a stored choice applies at once after mount, unless it names an avatar there no longer is. */
export function useAvatar(seat: 1 | 2): Avatar {
  const stored = useSettings((s) => s.avatars?.[seat])
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && isAvatar(stored) ? stored : DEFAULT_AVATAR[seat]
}

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
