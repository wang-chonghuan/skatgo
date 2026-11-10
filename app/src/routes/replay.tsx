import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// A game of the record of play played again by its player (SKATGO-182): the table, the whole screen. Not a search entry.
type ReplaySearch = { deal?: string }

export const Route = createFileRoute('/replay')({
  validateSearch: (search: Record<string, unknown>): ReplaySearch =>
    typeof search.deal === 'string' && search.deal.length <= 160 ? { deal: search.deal } : {},
  head: () =>
    pageHead({
      title: m.history_replay_title(),
      description: m.profile_meta_description(),
      paths: samePath('/replay'),
      image: 'daily',
      jsonLd: [],
    }),
  component: clientPage('recordReplay'),
})
