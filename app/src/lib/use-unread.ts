import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { readUnread } from './forum-api'

// How many forum mentions the signed-in account has not seen (SKATGO-232), for the count on the header's account picture:
// asked again on every page but /profile, which reads the mentions itself, marks them seen and says so here.

let count = 0
const listeners = new Set<(n: number) => void>()

/** The count, as /profile now knows it. */
export function setUnread(n: number) {
  count = n
  for (const listen of listeners) listen(n)
}

export function useUnread(signedIn: boolean): number {
  const path = useRouterState({ select: (s) => s.location.pathname })
  const [n, setN] = useState(count)
  useEffect(() => {
    listeners.add(setN)
    return () => void listeners.delete(setN)
  }, [])
  useEffect(() => {
    if (!signedIn || path.endsWith('/profile')) return
    let live = true
    void readUnread().then((r) => { if (live && r.ok) setUnread(r.data.unread) })
    return () => { live = false }
  }, [signedIn, path])
  return signedIn ? n : 0
}
