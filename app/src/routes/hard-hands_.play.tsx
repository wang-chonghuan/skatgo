import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { CHALLENGE_DEALS, CHALLENGE_KINDS, type ChallengeKind } from '~/lib/skat/challenge'
import { m } from '~/paraglide/messages'

// A hard hand on the table (SKATGO-248): which kind, which deal of it (from 1). A table, never indexed (lib/indexability.ts).
export type ChallengeSearch = { kind: ChallengeKind; n: number }

export const Route = createFileRoute('/hard-hands_/play')({
  validateSearch: (search: Record<string, unknown>): ChallengeSearch => {
    const kind = CHALLENGE_KINDS.find((k) => k === search.kind) ?? CHALLENGE_KINDS[0]
    const n = Number(search.n)
    return { kind, n: Number.isInteger(n) && n >= 1 && n <= CHALLENGE_DEALS ? n : 1 }
  },
  head: () =>
    pageHead({
      title: m.challenge_play_meta_title(),
      description: m.challenge_meta_description(),
      paths: samePath('/hard-hands/play'),
      image: 'play',
      jsonLd: [],
    }),
  component: clientPage('hardHandsPlay'),
})
