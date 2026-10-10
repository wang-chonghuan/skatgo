import { createIsomorphicFn } from '@tanstack/react-start'

import { SITE_URL } from '~/lib/site'
import { getLocale } from '~/paraglide/runtime'

// Product analytics (SKATGO-25): PostHog Cloud EU, organisation SkatGo, project `skatgo` — wired the way
// Risetive (trovestep, TROVESTEP-315/318) wires it.

/**
 * The PostHog project key, read from the server's environment on every server render. The key is
 * public by design — it ships to the browser — but it is configuration, not code: unset (development,
 * tests, a ticket worktree without it) or malformed means analytics is simply not loaded.
 *
 * On the client it is never read again. The first page arrives with the server's answer in the root
 * loader's data, and PostHog, once started, stays started; a server function would have to cross the
 * language middleware (src/server.ts), which redirects every URL without a language prefix.
 */
export const readProjectKey = createIsomorphicFn()
  .server((): string | null => {
    const key = process.env.POSTHOG_PROJECT_KEY?.trim() ?? ''
    return /^phc_[A-Za-z0-9]+$/.test(key) ? key : null
  })
  .client((): string | null => null)

/**
 * Only the published site reports. Derived from SITE_URL rather than listed again, so localhost, a
 * ticket preview and the Render service hostname (skatgo.onrender.com) send nothing — which is what
 * keeps development and diagnostic traffic out of the project.
 */
export function isPublishedSite(hostname: string): boolean {
  const host = new URL(SITE_URL).hostname
  return hostname === host || hostname.endsWith(`.${host}`)
}

/**
 * The tracking plan (SKATGO-74): every product event the site sends, with its properties. Nothing
 * else reaches PostHog but its own page views and page leaves; clicks are not captured
 * (components/product-analytics.tsx). An event marks a step in a visitor's journey, once — a game
 * started or finished, never a bid or a card. Names are `object_action`, the action in the past tense;
 * what differs between occasions goes in the properties, not the name.
 */
export type ProductEvents = {
  /** The front page's main button was pressed. */
  home_cta_clicked: { button: 'primary' }
  /** A lesson was opened, by its number. */
  lesson_started: { lesson: number }
  /** A lesson's last step was done. */
  lesson_completed: { lesson: number }
  /** The button to free play that a finished course offers was pressed, on the course page or after
   *  the last lesson. */
  course_complete_cta_clicked: Empty
  /** A game against the computers was dealt: free play, or lesson 11's game. */
  game_started: { mode: GameMode }
  /** That game was settled. `score` is the learner's game value as declarer, 0 as a defender. */
  game_finished: { mode: GameMode; won: boolean; score: number }
  /** One of today's tournaments was entered: its start button pressed while none of its deals was open.
   *  `deals` says which (SKATGO-77). */
  daily_started: { deals: number }
  /** A tournament's last deal today was finished. */
  daily_finished: { deals: number; total: number }
  /** Today's finished entry was put on the leaderboard under a nickname, or renamed. */
  daily_nickname_set: Empty
  /** A private table was opened. */
  room_created: Empty
  /** A seat at someone's private table was taken. */
  room_joined: Empty
  /** The private table's first deal was started, with this many people seated. */
  room_started: { humans: number }
  /** A question went to the assistant, from this kind of page. */
  assistant_asked: { context: 'entry' | 'home' | 'lesson' | 'play' }
}
export type GameMode = 'free' | 'lesson'
type Empty = Record<string, never>

/**
 * Sends one event of the tracking plan, with the page's language and path added to its properties. It
 * goes to PostHog once PostHog has started — only on the published site — and is also announced on
 * the window as a `skatgo:track` event, which is how a local check observes it without PostHog.
 */
export function track<E extends keyof ProductEvents>(
  event: E,
  ...[props]: ProductEvents[E] extends Empty ? [] : [ProductEvents[E]]
) {
  if (typeof window === 'undefined') return
  const detail = { event, props: { locale: getLocale(), page: window.location.pathname, ...props } }
  window.dispatchEvent(new CustomEvent('skatgo:track', { detail }))
  if (!isPublishedSite(window.location.hostname)) return
  void import('posthog-js').then(({ default: posthog }) => {
    if (posthog.__loaded) posthog.capture(event, detail.props)
  })
}
