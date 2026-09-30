import { create } from 'zustand'

import { phoneQuery } from '../../theme/constants'

// Whether free play's side panel is open (SKATGO-29). It folds away at any width; the table and the
// assistant's launcher, which waits beside it, both follow it. It starts open beside the felt on a wide
// screen and closed on a phone, where open means a drawer over the table; within a visit it keeps the
// learner's last choice.
export const useTablePanel = create<{ open: boolean; toggle: () => void }>()((set) => ({
  open: typeof window === 'undefined' || !window.matchMedia(phoneQuery).matches,
  toggle: () => set((s) => ({ open: !s.open })),
}))
