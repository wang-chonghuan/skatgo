import { createRouter } from '@tanstack/react-router'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { deLocalizeUrl, isExcludedByRouteStrategy, localizeUrl } from './paraglide/runtime'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // The route tree knows `/`, `/lesson/$id`, `/play`, `/api/ask`; the language prefix is stripped on
    // the way in and put back on every link on the way out, so no route or <Link> names a language.
    // A URL Paraglide excludes (the assistant's endpoint, SKATGO-9) has no language and is left alone:
    // localizing it would make the router answer a GET with a redirect to /en/api/ask.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => (isExcludedByRouteStrategy(url) ? url : localizeUrl(url)),
    },
    defaultNotFoundComponent: () => <EmptyState title="Page not found" />,
  })

  // Route-local scroll containers (the reading pane) are not the window, so the
  // router's own restoration does not reach them. Reset them on every navigation
  // that is not an in-page anchor.
  router.subscribe('onRendered', ({ toLocation }) => {
    if (toLocation.hash || typeof document === 'undefined') return
    queueMicrotask(() => {
      document
        .querySelectorAll<HTMLElement>('[data-scroll-restoration-id]')
        .forEach((element) => element.scrollTo({ top: 0, left: 0 }))
    })
  })

  return router
}
