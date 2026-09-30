import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

export const Route = createFileRoute('/play')({
  head: () =>
    pageHead({
      title: m.play_meta_title(),
      description: m.play_meta_description(),
      paths: samePath('/play'),
      image: 'play',
      jsonLd: [breadcrumbs([[m.play_title(), '/play']])],
    }),
  component: () => <ClientPage page="play" />,
})
