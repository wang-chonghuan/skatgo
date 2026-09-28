import { useEffect } from 'react'

import { isPublishedSite } from '~/lib/analytics'

// SKATGO-25: PostHog Cloud EU only. The host is fixed here rather than configurable, so events cannot
// be pointed at another region by an environment value.
const POSTHOG_API_HOST = 'https://eu.i.posthog.com'
const POSTHOG_UI_HOST = 'https://eu.posthog.com'

/**
 * Starts PostHog in the browser, the same way Risetive does. The SDK is imported inside the effect, so
 * it never runs during server rendering and stays out of the first page's scripts.
 *
 * Stated explicitly rather than left to PostHog's defaults: no cookie (`localStorage`), no session
 * recording and no surveys, whatever the project settings say. Nothing identifies a signed-in learner:
 * events stay anonymous, and the project anonymises IP addresses.
 *
 * It starts once. A later render with no key (the client never re-reads it — lib/analytics.ts) leaves
 * a started PostHog running.
 */
export function ProductAnalytics({ projectKey }: { projectKey: string | null }) {
  useEffect(() => {
    if (!projectKey || !isPublishedSite(window.location.hostname)) return
    void import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) return
      posthog.init(projectKey, {
        api_host: POSTHOG_API_HOST,
        ui_host: POSTHOG_UI_HOST,
        defaults: '2026-05-30',
        persistence: 'localStorage',
        autocapture: true,
        capture_pageview: 'history_change',
        disable_session_recording: true,
        disable_surveys: true,
      })
    })
  }, [projectKey])

  return null
}
