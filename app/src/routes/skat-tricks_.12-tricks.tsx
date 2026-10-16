import { createFileRoute } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { breadcrumbs, ogImageUrl, pageHead, samePath } from '~/lib/head'
import { TRICKS } from '~/lib/skat/tricks'
import { SITE_URL, localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// The Skat-Tricks' first article (SKATGO-82), at its own address since SKATGO-103.
export const Route = createFileRoute('/skat-tricks_/12-tricks')({
  head: () => {
    const locale = getLocale()
    const article = TRICKS[locale]
    const publisher = { '@type': 'Organization', name: m.site_name(), url: SITE_URL }
    return pageHead({
      title: article.metaTitle,
      description: article.metaDescription,
      paths: samePath('/skat-tricks/12-tricks'),
      image: 'tricks',
      jsonLd: [
        {
          '@type': 'Article',
          headline: article.h1,
          description: article.metaDescription,
          url: localizedUrl('/skat-tricks/12-tricks', locale),
          inLanguage: locale,
          image: ogImageUrl('tricks', locale),
          datePublished: '2026-10-12',
          author: publisher,
          publisher,
        },
        breadcrumbs([[m.tricks_title(), '/skat-tricks'], [article.h1, '/skat-tricks/12-tricks']]),
      ],
    })
  },
  component: clientPage('tricksArticle'),
})
