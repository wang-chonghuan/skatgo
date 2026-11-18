import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// A League table (SKATGO-204): one person's page, never indexed (lib/indexability.ts).
export const Route = createFileRoute('/league_/play')({
  head: () =>
    pageHead({
      title: m.league_play_meta_title(),
      description: m.league_play_meta_description(),
      paths: samePath('/league/play'),
      image: 'play',
      jsonLd: [],
    }),
  component: clientPage('leaguePlay'),
})
