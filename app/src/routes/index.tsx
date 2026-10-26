import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { readEloBoard } from '~/lib/elo-api'
import { DAILY_DEALS } from '~/lib/daily'
import { organization, pageHead, samePath } from '~/lib/head'
import { SITE_URL, localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/')({
  // The tournament's Elo board (SKATGO-123). The forum's announcement left the hero (SKATGO-131).
  loader: async () => ({ elo: await readEloBoard() }),
  head: () =>
    pageHead({
      title: m.home_meta_title(),
      description: m.home_meta_description({ n: DAILY_DEALS }),
      paths: samePath('/'),
      image: 'home',
      jsonLd: [
        { '@type': 'WebSite', name: m.site_name(), url: localizedUrl('/', getLocale()), inLanguage: getLocale(), publisher: { '@id': `${SITE_URL}/#organization` } },
        { ...organization(), '@id': `${SITE_URL}/#organization` },
      ],
    }),
  component: clientPage('entry'),
})
