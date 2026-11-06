import { createIsomorphicFn } from '@tanstack/react-start'

import { callDaily } from './daily-handler'
import type { XpBoard } from './skat/xp'

// The week's XP board (SKATGO-172), read by the front page's loader: on the server straight from the tournament
// service, asked as nobody, so its rows are in the HTML; in the browser through /api/daily/xp, as the signed-in player,
// so their own row is marked. Null when the service does not answer: the board simply is not there.

/** On the server one answer serves a minute. */
const XP_MS = 60_000
let seen: { at: number; board: XpBoard | null } | null = null

const read = createIsomorphicFn()
  .server(async (): Promise<XpBoard | null> => {
    if (seen && Date.now() - seen.at < XP_MS) return seen.board
    let board: XpBoard | null = null
    try {
      const res = await callDaily('xp', { player: null })
      if (res?.ok) board = (await res.json()) as XpBoard
    } catch {
      board = null
    }
    seen = { at: Date.now(), board }
    return board
  })
  .client(async (): Promise<XpBoard | null> => {
    try {
      const res = await fetch('/api/daily/xp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      return res.ok ? ((await res.json()) as XpBoard) : null
    } catch {
      return null
    }
  })

export const readXpBoard = () => read()
