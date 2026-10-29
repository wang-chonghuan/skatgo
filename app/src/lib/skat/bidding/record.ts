import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAccount } from '~/lib/use-account'
import { type Answered, type BiddingRecord, FREE_IDS } from './practice'

// The bidding practice's record (SKATGO-150), kept as the ladder's is (tricks/ladder-progress.ts): a guest's answers to
// the free questions stay in this browser (localStorage — no cookie, nothing to consent to); an account's are the
// multiplayer service's, behind /api/tricks/bidding/* (lib/tricks-handler.ts). What the browser kept as a guest joins
// the account's at the first look once signed in, and is then forgotten here. Applied after mount; on the server the
// record is empty.

const NONE: BiddingRecord = {}

/** An answer on top of what was there: the first answer stays, a right one later fixes it. */
const mark = (r: Answered | undefined, chosen: number, right: boolean): Answered => (r ? { first: r.first, fixed: r.fixed || right } : { first: chosen, fixed: false })

type Guest = { questions: BiddingRecord; answer: (id: string, chosen: number, right: boolean) => void; forget: () => void }

const useGuest = create<Guest>()(
  persist(
    (set) => ({
      questions: {},
      answer: (id, chosen, right) => set((s) => ({ questions: { ...s.questions, [id]: mark(s.questions[id], chosen, right) } })),
      forget: () => set({ questions: {} }),
    }),
    { name: 'skatgo.bidding.v1', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ questions: s.questions }) },
  ),
)

/** The account's record as the service last answered it, and whose it is. */
const useMine = create<{ owner: string | null; questions: BiddingRecord | null }>(() => ({ owner: null, questions: null }))

let issued = 0
let applied = 0
let loading: string | null = null

/** Asks the service; the answer to the request sent last wins, whichever arrives first. */
async function call(owner: string, op: 'state' | 'answer' | 'merge', body: object): Promise<void> {
  const n = ++issued
  const res = await fetch(`/api/tricks/bidding/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`bidding ${op}: ${res.status}`)
  const { questions } = (await res.json()) as { questions: BiddingRecord }
  if (n > applied) {
    applied = n
    useMine.setState({ owner, questions })
  }
}

/** The account's record, once per page: with the guest's free answers merged in when this browser has some. */
function load(owner: string) {
  if (useMine.getState().owner === owner || loading === owner) return
  loading = owner
  const guest = Object.fromEntries(Object.entries(useGuest.getState().questions).filter(([id]) => FREE_IDS.includes(id)))
  const merging = Object.keys(guest).length > 0
  call(owner, merging ? 'merge' : 'state', merging ? { questions: guest } : {})
    .then(() => {
      if (merging) useGuest.getState().forget()
    })
    .catch(() => console.error('bidding record unavailable'))
    .finally(() => {
      if (loading === owner) loading = null
    })
}

/** This visitor's record, who they are — an account's id, `null` for a guest, `undefined` until known — and how an
 *  answer is recorded. */
export function useBiddingRecord(): { questions: BiddingRecord; account: string | null | undefined; answer: (id: string, chosen: number, right: boolean) => void } {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const account = useAccount()
  const guest = useGuest((s) => s.questions)
  const mine = useMine((s) => (account && s.owner === account ? s.questions : null))
  useEffect(() => {
    if (account) load(account)
  }, [account])
  const answer = (id: string, chosen: number, right: boolean) => {
    if (account) {
      // Shown at once, then as the service has it.
      const now = useMine.getState().questions ?? {}
      useMine.setState({ owner: account, questions: { ...now, [id]: mark(now[id], chosen, right) } })
      call(account, 'answer', { question: id, chosen }).catch(() => console.error('bidding answer not recorded'))
    } else if (FREE_IDS.includes(id)) useGuest.getState().answer(id, chosen, right)
  }
  if (!mounted) return { questions: NONE, account: undefined, answer }
  return { questions: account ? (mine ?? NONE) : account === null ? guest : NONE, account, answer }
}
