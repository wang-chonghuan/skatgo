import { useAuth } from '@clerk/tanstack-react-start'
import { createContext, useContext, useEffect, useState } from 'react'

import type { TestAccount as Test } from './test-account'

/** A local test account (lib/test-account.ts), handed down by the root route; null everywhere else. */
export const TestAccount = createContext<Test | null>(null)

/**
 * Who is signed in, as the browser knows it (SKATGO-12): the Clerk account's id, `null` for a guest, or
 * `undefined` while Clerk is still loading. If Clerk never answers (blocked, down), the visitor is a guest
 * after a few seconds, so its failure cannot keep anything waiting for it.
 */
export function useAccount(): string | null | undefined {
  const test = useContext(TestAccount)
  const { isLoaded, userId } = useAuth()
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => {
    if (isLoaded) return
    const timer = setTimeout(() => setGaveUp(true), 4_000)
    return () => clearTimeout(timer)
  }, [isLoaded])
  if (test) return test.userId
  if (isLoaded) return userId ?? null
  return gaveUp ? null : undefined
}
