import { createIsomorphicFn } from '@tanstack/react-start'

import { callDaily } from './daily-handler'
import type { EloBoard } from './skat/elo'

// The tournament's Elo board (SKATGO-123), read by the front page's loader: on the server straight from the
// tournament service, so its rows are in the HTML; in the browser through /api/daily/elo. Null when the
// service does not answer: the board simply is not there.

/** It changes once a day; on the server one answer serves a minute. */
const ELO_MS = 60_000
let seen: { at: number; board: EloBoard | null } | null = null

const read = createIsomorphicFn()
  .server(async (): Promise<EloBoard | null> => {
    if (seen && Date.now() - seen.at < ELO_MS) return seen.board
    let board: EloBoard | null = null
    try {
      const res = await callDaily('elo', { player: null })
      if (res?.ok) board = (await res.json()) as EloBoard
    } catch {
      board = null
    }
    seen = { at: Date.now(), board }
    return board
  })
  .client(async (): Promise<EloBoard | null> => {
    try {
      const res = await fetch('/api/daily/elo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      return res.ok ? ((await res.json()) as EloBoard) : null
    } catch {
      return null
    }
  })

export const readEloBoard = () => read()
