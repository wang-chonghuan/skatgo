import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { brandHead } from '~/lib/brands'

// skat-online's page under the comparison of Skat sites (SKATGO-229).
export const Route = createFileRoute('/skat-sites-compared_/skat-online')({
  head: () => brandHead('skat-online'),
  component: clientPage('brandSkatOnline'),
})
