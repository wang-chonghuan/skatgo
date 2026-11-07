import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// Today's deal of the day played again by whoever finished it (SKATGO-177): the table, the whole screen. Not a search entry.
export const Route = createFileRoute('/daily_/replay')({
  head: () =>
    pageHead({
      title: m.dod_replay_title(),
      description: m.daily_play_description(),
      paths: samePath('/daily/replay'),
      image: 'daily',
      jsonLd: [],
    }),
  component: clientPage('dodReplay'),
})
