// A player's record of play (SKATGO-128): what the service sends for every deal they played against the AI on
// the same cards, and what the page makes of it. Shared by `multiplayer/src/profile.ts` and the page.

/** One deal: the tournament's day it was played on, where, and both Seeger-Fabian scores from the player's seat. */
export type ProfileDeal = {
  day: string
  source: 'daily' | 'free'
  score: number
  /** The AI's score on the same deal from the same seat; null for a tournament day dealt before it played them. */
  ai: number | null
}

/** A deal's difference against the AI: the player's score minus the AI's. */
export const againstAi = (d: ProfileDeal): number | null => (d.ai === null ? null : d.score - d.ai)

export type ProfileDay = { day: string; deals: number; againstAi: number }

/** The days played, newest first: how many deals, and the sum of their differences against the AI. */
export function daysOf(deals: ProfileDeal[]): ProfileDay[] {
  const days = new Map<string, ProfileDay>()
  for (const d of deals) {
    const day = days.get(d.day) ?? { day: d.day, deals: 0, againstAi: 0 }
    day.deals += 1
    day.againstAi += againstAi(d) ?? 0
    days.set(d.day, day)
  }
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day))
}
