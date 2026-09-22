import { createRouter } from '@tanstack/react-router'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { deLocalizeUrl, localizeUrl } from './paraglide/runtime'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // The route tree knows `/`, `/lesson/$id`, `/play`; the language prefix is stripped on the way in
    // and put back on every link on the way out, so no route or <Link> names a language.
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
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
