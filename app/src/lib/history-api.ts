import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { dailyProfile, isError } from './daily-api'
import { handleDaily } from './daily-handler'
import { signedInUser } from './session'
import type { ProfileDeal } from './skat/profile'

// The front page's games (SKATGO-193, the human: 「你看看这个history在home上的加载速度如何，是否需要优化」), read by its
// loader: on the server while the page is made, through the very ask the browser makes (/api/daily/profile — the same
// player, guest device and claiming), and streamed into the page behind the rest of it, so the games come with the page
// instead of one more round trip after it; in the browser, through that ask, for a page reached by a link on the site.
// Null when the service does not answer: the card asks again from the browser.

/** How many games the card lists, scrolling inside it. */
export const HOME_GAMES = 20

/** The page's games and whether an account asked: the card's look needs it before the browser knows the account. */
export type HomeHistory = { signedIn: boolean; games: ProfileDeal[] }

/** The newest games first, as many as the card lists. */
export const newestGames = (deals: ProfileDeal[]) => [...deals].reverse().slice(0, HOME_GAMES)

const read = createIsomorphicFn()
  .server(async (): Promise<HomeHistory | null> => {
    const page = getRequest()
    const headers = new Headers({ 'content-type': 'application/json' })
    for (const name of ['cookie', 'authorization']) {
      const value = page.headers.get(name)
      if (value) headers.set(name, value)
    }
    const ask = new Request(new URL('/api/daily/profile', page.url), { method: 'POST', headers, body: '{}' })
    try {
      const [res, user] = await Promise.all([handleDaily(ask), signedInUser(page)])
      if (!res.ok) return null
      const { deals } = (await res.json()) as { deals: ProfileDeal[] }
      return { signedIn: user !== null, games: newestGames(deals) }
    } catch {
      return null
    }
  })
  .client(async (): Promise<HomeHistory | null> => null)

export const readHistory = () => read()

/** The games as the browser reads them, for a card whose page did not bring them. */
export async function fetchGames(): Promise<ProfileDeal[] | null> {
  const r = await dailyProfile()
  return isError(r) ? null : newestGames(r.deals)
}
