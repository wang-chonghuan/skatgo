import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { readXpBoard } from '~/lib/xp-api'
import { DAILY_DEALS } from '~/lib/daily'
import { organization, pageHead, samePath } from '~/lib/head'
import { SITE_URL, localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

export const Route = createFileRoute('/')({
  // The XP board (SKATGO-172, replacing SKATGO-123's Elo). The forum's announcement left the hero (SKATGO-131).
  loader: async () => ({ xp: await readXpBoard() }),
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
