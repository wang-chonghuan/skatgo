import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, pageHead, samePath } from '~/lib/head'
import { m } from '~/paraglide/messages'

// Deleting an account (SKATGO-185): what goes and what stays, and the button for the account signed in.
export const Route = createFileRoute('/delete-account')({
  head: () =>
    pageHead({
      title: m.delete_meta_title(),
      description: m.delete_meta_description(),
      paths: samePath('/delete-account'),
      image: 'home',
      jsonLd: [breadcrumbs([[m.delete_title(), '/delete-account']])],
    }),
  component: clientPage('deleteAccount'),
})
