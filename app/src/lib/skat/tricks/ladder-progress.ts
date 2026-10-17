import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useAccount } from '~/lib/use-account'
import { LADDER_FREE } from './exercises/ladder'
import { OPEN_EXERCISES } from './exercises/open-list'

// The "Sieg sichern" ladder's record (SKATGO-108; SKATGO-109, the human: 「错的刷新页面后可以重做，但是要记下来哪题
// 错了」): for each step, whether it was answered right and how many times wrong. Anyone may answer the first
// LADDER_FREE steps; a guest's answers stay in this browser (localStorage — no cookie, nothing to consent to).
// From the next step on an account is needed (the human: 「第三题必须登录才可以做」), and the record is the
// account's, kept by the multiplayer service behind /api/tricks/ladder/* (lib/tricks-handler.ts). What the
// browser kept as a guest joins the account's at the first look once signed in, and is then forgotten here.
// Like the course's progress it is applied after mount; on the server the record is empty.

export type StepRecord = { solved: boolean; misses: number }
export type LadderRecord = Record<string, StepRecord>

// The record follows the exercises the site shows: since SKATGO-110 the open-card endgames.
const FREE = OPEN_EXERCISES.slice(0, LADDER_FREE).map((e) => e.id)
const NONE: LadderRecord = {}

const mark = (r: StepRecord | undefined, right: boolean): StepRecord => ({
  solved: (r?.solved ?? false) || right,
  misses: (r?.misses ?? 0) + (right ? 0 : 1),
})

type Guest = { steps: LadderRecord; answer: (id: string, right: boolean) => void; forget: () => void }

const useGuest = create<Guest>()(
  persist(
    (set) => ({
      steps: {},
      answer: (id, right) => set((s) => ({ steps: { ...s.steps, [id]: mark(s.steps[id], right) } })),
      forget: () => set({ steps: {} }),
    }),
    // v1 (SKATGO-108) held the solved steps of the ladder's first ten; v2 (SKATGO-109) the steps of two and three
    // tricks, which SKATGO-110 replaced with four-trick ones at the same numbers — their records are let go.
    { name: 'skatgo.ladder.v3', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ steps: s.steps }) },
  ),
)

/** The account's record as the service last answered it, and whose it is. */
const useMine = create<{ owner: string | null; steps: LadderRecord | null }>(() => ({ owner: null, steps: null }))

let issued = 0
let applied = 0
let loading: string | null = null

/** Asks the service; the answer to the request sent last wins, whichever arrives first. */
async function call(owner: string, op: 'state' | 'answer' | 'merge', body: object): Promise<void> {
  const n = ++issued
  const res = await fetch(`/api/tricks/ladder/${op}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`ladder ${op}: ${res.status}`)
  const { steps } = (await res.json()) as { steps: LadderRecord }
  if (n > applied) {
    applied = n
    useMine.setState({ owner, steps })
  }
}

/** The account's record, once per page: with the guest's free steps merged in when this browser has some. */
function load(owner: string) {
  if (useMine.getState().owner === owner || loading === owner) return
  loading = owner
  const guest = Object.fromEntries(Object.entries(useGuest.getState().steps).filter(([id]) => FREE.includes(id)))
  const merging = Object.keys(guest).length > 0
  call(owner, merging ? 'merge' : 'state', merging ? { steps: guest } : {})
    .then(() => {
      if (merging) useGuest.getState().forget()
    })
    .catch(() => console.error('ladder record unavailable'))
    .finally(() => {
      if (loading === owner) loading = null
    })
}

/**
 * The ladder's record for this visitor, who they are — an account's id, `null` for a guest, `undefined`
 * until that is known — and how an answer is recorded.
 */
export function useLadder(): { steps: LadderRecord; account: string | null | undefined; answer: (id: string, right: boolean) => void } {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const account = useAccount()
  const guest = useGuest((s) => s.steps)
  const mine = useMine((s) => (account && s.owner === account ? s.steps : null))
  useEffect(() => {
    if (account) load(account)
  }, [account])
  const answer = (id: string, right: boolean) => {
    if (account) call(account, 'answer', { step: id, right }).catch(() => console.error('ladder answer not recorded'))
    else if (FREE.includes(id)) useGuest.getState().answer(id, right)
  }
  if (!mounted) return { steps: NONE, account: undefined, answer }
  return { steps: account ? (mine ?? NONE) : account === null ? guest : NONE, account, answer }
}
