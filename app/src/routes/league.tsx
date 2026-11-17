import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// The League (SKATGO-204): the player's own standing, never indexed (lib/indexability.ts).
export const Route = createFileRoute('/league')({
  head: () =>
    pageHead({
      title: m.league_meta_title(),
      description: m.league_meta_description(),
      paths: samePath('/league'),
      image: 'play',
      jsonLd: [breadcrumbs([[m.league_title(), '/league']])],
    }),
  component: clientPage('league'),
})
