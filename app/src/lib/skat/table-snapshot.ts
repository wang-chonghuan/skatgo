import { create } from 'zustand'

// What the table currently looks like from the learner's seat, as text — published by the table
// while a game is on the page, read by the assistant when a question is sent (SKATGO-9). It is only
// ever the learner's own view (table-view.ts); nothing here can see the other hands.

type TableSnapshot = {
  text: string | null
  publish: (text: string | null) => void
}

export const useTableSnapshot = create<TableSnapshot>((set) => ({
  text: null,
  publish: (text) => set({ text }),
}))
