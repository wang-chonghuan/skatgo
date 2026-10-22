import { createFileRoute, notFound, redirect, rootRouteId } from '@tanstack/react-router'

import { clientPage } from '~/components/skat/client-page'
import { plainText, postIdOf, postParam, postPath } from '~/lib/forum'
import { readForumPost } from '~/lib/forum-api'
import { breadcrumbs, ogImageUrl, pageHead, samePath } from '~/lib/head'
import { SITE_URL, localizedUrl } from '~/lib/site'
import { m } from '~/paraglide/messages'
import { getLocale } from '~/paraglide/runtime'

// One forum post and its comments (SKATGO-118), at an address in each language of the site: the page's words are
// the site's language, the post's whatever its author wrote. An unknown or hidden post is a missing page; an old
// or mistyped title in the address is corrected. Indexed only when the post may be (lib/forum.ts).
export const Route = createFileRoute('/forum_/$post')({
  loader: async ({ params }) => {
    const id = postIdOf(params.post)
    if (!id) throw notFound({ routeId: rootRouteId })
    const answer = await readForumPost(id)
    if (!answer.ok) {
      if (answer.status === 404) throw notFound({ routeId: rootRouteId })
      return { post: null, viewer: null }
    }
    const { post } = answer.data
    if (params.post !== postParam(post)) throw redirect({ to: '/forum/$post', params: { post: postParam(post) }, statusCode: 301 })
    return answer.data
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) return { meta: [{ title: m.forum_title() }, { name: 'robots', content: 'noindex, follow' }] }
    const locale = getLocale()
    const path = postPath(post)
    const url = localizedUrl(path, locale)
    // The same post stands at an address in each language; the words around it tell the two apart.
    const description = m.forum_page_description({ excerpt: plainText(post.body, 120) || post.title })
    const published = new Date(post.createdAt).toISOString()
    const publisher = { '@type': 'Organization', name: m.site_name(), url: SITE_URL }
    return pageHead({
      title: m.forum_page_title({ title: post.title }),
      description,
      paths: samePath(path),
      image: 'forum',
      indexable: post.indexable,
      jsonLd: [
        post.official
          ? { '@type': 'Article', headline: post.title, description, url, inLanguage: locale, image: ogImageUrl('forum', locale), datePublished: published, author: publisher, publisher }
          : { '@type': 'DiscussionForumPosting', headline: post.title, text: plainText(post.body, 500), url, inLanguage: locale, datePublished: published, author: { '@type': 'Person', name: post.author }, commentCount: post.comments },
        breadcrumbs([[m.forum_title(), '/forum'], [post.title, path]]),
      ],
    })
  },
  component: clientPage('forumPost'),
})
