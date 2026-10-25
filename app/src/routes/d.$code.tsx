import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { pageHead, samePath } from '~/lib/head'
import { readShared } from '~/lib/share-api'
import { SITE_URL } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

// A shared deal of the day (SKATGO-132): what the link in a message opens. Read on the server, so its link preview —
// the card — and its words are in the HTML the messengers read. Not a search entry.
export const Route = createFileRoute('/d/$code')({
  loader: ({ params }) => readShared(params.code),
  head: ({ params, loaderData }) => {
    const date = loaderData ? new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${loaderData.day}T00:00:00Z`)) : ''
    return pageHead({
      title: loaderData ? m.shared_meta_title({ score: signed(loaderData.score) }) : m.shared_title(),
      description: loaderData ? m.shared_meta_description({ date, score: signed(loaderData.score), ai: loaderData.ai === null ? '–' : signed(loaderData.ai) }) : m.shared_missing(),
      paths: samePath(`/d/${params.code}`),
      image: 'daily',
      imageUrl: loaderData ? `${SITE_URL}/api/card/${params.code}-${getLocale()}-wide.png` : undefined,
      jsonLd: [],
    })
  },
  component: clientPage('shared'),
})
