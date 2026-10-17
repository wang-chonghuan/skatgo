import { useAuth } from '@clerk/tanstack-react-start'
import { useEffect, useState } from 'react'

/**
 * Who is signed in, as the browser knows it (SKATGO-12): the Clerk account's id, `null` for a guest, or
 * `undefined` while Clerk is still loading. If Clerk never answers (blocked, down), the visitor is a guest
 * after a few seconds, so its failure cannot keep anything waiting for it.
 */
export function useAccount(): string | null | undefined {
  const { isLoaded, userId } = useAuth()
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => {
    if (isLoaded) return
    const timer = setTimeout(() => setGaveUp(true), 4_000)
    return () => clearTimeout(timer)
  }, [isLoaded])
  if (isLoaded) return userId ?? null
  return gaveUp ? null : undefined
}
