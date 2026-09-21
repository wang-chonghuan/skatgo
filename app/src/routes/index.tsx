import { createFileRoute } from '@tanstack/react-router'

import { ClientPage } from '~/components/skat/client-page'

export const Route = createFileRoute('/')({ component: () => <ClientPage page="home" /> })
