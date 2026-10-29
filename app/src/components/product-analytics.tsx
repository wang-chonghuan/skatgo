import { useUser } from '@clerk/tanstack-react-start'
import { useContext, useEffect } from 'react'

import { RELAY_PATH, identify, isPublishedSite } from '~/lib/analytics'
import { TestAccount } from '~/lib/use-account'

// SKATGO-25: PostHog Cloud EU only. Since SKATGO-152 the browser sends to skatgo.com's own relay (lib/analytics-relay.ts),
// which is fixed to the EU hosts, so events still cannot be pointed at another region by an environment value. The
// links PostHog's toolbar opens stay at its EU app.
const POSTHOG_UI_HOST = 'https://eu.posthog.com'

/**
 * Starts PostHog in the browser, the same way Risetive does. The SDK is imported inside the effect, so
 * it never runs during server rendering and stays out of the first page's scripts.
 *
 * Stated explicitly rather than left to PostHog's defaults: no cookie (`localStorage`), no session
 * recording and no surveys, whatever the project settings say. And nothing captured on its own but page
 * views and page leaves (SKATGO-74): no clicks, rage or dead clicks, heatmaps, web vitals or exceptions.
 * Every tap at a table was an event; the product's events are the tracking plan in lib/analytics.ts. Every
 * visitor has a person, a guest too, with where they first came from and landed (SKATGO-152); a signed-in
 * learner is that account's person (`identify`).
 *
 * It starts once. A later render with no key (the client never re-reads it — lib/analytics.ts) leaves
 * a started PostHog running. It sits inside Clerk's provider so it knows who is signed in; it starts before it
 * says so, its effect coming first.
 */
export function ProductAnalytics({ projectKey }: { projectKey: string | null }) {
  useEffect(() => {
    if (!projectKey || !isPublishedSite(window.location.hostname)) return
    void import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) return
      posthog.init(projectKey, {
        api_host: RELAY_PATH,
        ui_host: POSTHOG_UI_HOST,
        defaults: '2026-05-30',
        persistence: 'localStorage',
        person_profiles: 'always',
        autocapture: false,
        rageclick: false,
        capture_dead_clicks: false,
        capture_heatmaps: false,
        capture_performance: false,
        capture_exceptions: false,
        capture_pageview: 'history_change',
        capture_pageleave: true,
        disable_session_recording: true,
        disable_surveys: true,
      })
    })
  }, [projectKey])

  // Who is signed in, once Clerk knows (a local test account at once, lib/test-account.ts).
  const test = useContext(TestAccount)
  const { isLoaded, user } = useUser()
  const id = test ? test.userId : isLoaded ? (user?.id ?? null) : undefined
  const createdAt = test ? test.createdAt : (user?.createdAt?.getTime() ?? null)
  useEffect(() => {
    if (id !== undefined) identify(id === null ? null : { id, createdAt })
  }, [id, createdAt])

  return null
}
