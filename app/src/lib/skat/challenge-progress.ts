import { useCallback, useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAccount } from '~/lib/use-account'
import { CHALLENGE_KINDS, type ChallengeKind, type ChallengeProgress } from './challenge'

// Hard hands' progress (SKATGO-249, the human: 「先做每类的进度吧，要个bar」): for each kind, the deals passed — won, or lost
// where SkatZero's run of the same cards lost too, as the server's review says. A pass is never undone. Kept as the Skat
// Tricks ladder keeps its record (tricks/ladder-progress.ts): a guest's in this browser (localStorage — no cookie, nothing
// to consent to); an account's by the multiplayer service, which records a pass at the review the web names the account
// in, behind /api/challenge/progress and /merge (lib/challenge-handler.ts). What the browser kept as a guest joins the
// account's at the first look once signed in, and is then forgotten here. Applied after mount; on the server it is empty.

export { type ChallengeProgress, kindProgress } from './challenge'

const NONE: ChallengeProgress = {}

const withPass = (p: ChallengeProgress, kind: ChallengeKind, n: number): ChallengeProgress =>
  p[kind]?.includes(n) ? p : { ...p, [kind]: [...(p[kind] ?? []), n].sort((a, b) => a - b) }

type Guest = { passed: ChallengeProgress; pass: (kind: ChallengeKind, n: number) => void; forget: () => void }

const useGuest = create<Guest>()(
  persist(
    (set) => ({
      passed: {},
      pass: (kind, n) => set((s) => ({ passed: withPass(s.passed, kind, n) })),
      forget: () => set({ passed: {} }),
    }),
    { name: 'skatgo.hard-hands.v1', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ passed: s.passed }) },
  ),
)

/** The account's progress as the service last answered it, and whose it is. */
const useMine = create<{ owner: string | null; passed: ChallengeProgress | null }>(() => ({ owner: null, passed: null }))

let loading: string | null = null

/** The account's progress, once per page: with the guest's merged in when this browser has some. */
function load(owner: string) {
  if (useMine.getState().owner === owner || loading === owner) return
  loading = owner
  const guest = useGuest.getState().passed
  const merging = Object.values(guest).some((ns) => (ns?.length ?? 0) > 0)
  fetch(`/api/challenge/${merging ? 'merge' : 'progress'}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(merging ? { passed: guest } : {}),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`challenge progress: ${res.status}`)
      const { passed } = (await res.json()) as { passed: ChallengeProgress }
      useMine.setState({ owner, passed })
      if (merging) useGuest.getState().forget()
    })
    .catch(() => console.error('hard hands progress unavailable'))
    .finally(() => {
      if (loading === owner) loading = null
    })
}

/**
 * This visitor's progress and how a pass is kept: for an account the service has already recorded it at the review, so it
 * is only shown here; for a guest it is this browser's.
 */
export function useChallengeProgress(): { passed: ChallengeProgress; pass: (kind: ChallengeKind, n: number) => void } {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const account = useAccount()
  const guest = useGuest((s) => s.passed)
  const mine = useMine((s) => (account && s.owner === account ? s.passed : null))
  useEffect(() => {
    if (account) load(account)
  }, [account])
  // Stable while the visitor is, so a review asked with it is asked once.
  const pass = useCallback((kind: ChallengeKind, n: number) => {
    if (!CHALLENGE_KINDS.includes(kind)) return
    if (account) {
      const s = useMine.getState()
      if (s.owner === account && s.passed) useMine.setState({ passed: withPass(s.passed, kind, n) })
    } else if (account === null) useGuest.getState().pass(kind, n)
  }, [account])
  if (!mounted) return { passed: NONE, pass }
  return { passed: account ? (mine ?? NONE) : account === null ? guest : NONE, pass }
}
