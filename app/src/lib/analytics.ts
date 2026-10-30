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

/** Where the browser sends PostHog's requests: skatgo.com's own relay to PostHog Cloud EU (SKATGO-152,
 *  lib/analytics-relay.ts), a path that names nothing. */
export const RELAY_PATH = '/hx'

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
  /** A button of the front page's hero was pressed: the deal of the day's, or free play's beside it (SKATGO-131; the
   *  tournament's and the forum's until then). */
  home_cta_clicked: { button: 'primary' | 'free' }
  /** A lesson was opened, by its number. */
  lesson_started: { lesson: number }
  /** A lesson's last step was done. */
  lesson_completed: { lesson: number }
  /** The button to free play that a finished course offers was pressed, on the course page or after
   *  the last lesson. */
  course_complete_cta_clicked: Empty
  /** A game against the computers was dealt: free play, or lesson 11's game. */
  game_started: { mode: GameMode }
  /** That game was settled. `score` is the learner's game value as declarer, 0 as a defender; since SKATGO-152 also
   *  the learner's side, the game played, the bid it was won at, the learner's Seeger-Fabian score and the AI's from
   *  the same seat on the same cards (null when its review did not come). */
  game_finished: { mode: GameMode; won: boolean; score: number; role: 'declarer' | 'defender'; contract: string; bid: number; sf: number; ai_sf: number | null }
  /** Free play's round of six deals was over (SKATGO-152): the learner's Seeger-Fabian total and the AI's from the
   *  same seats, over the deals whose AI game is known. */
  free_round_finished: { total: number; ai_total: number }
  /** An exercise was answered, its first answer (SKATGO-152): which section — a Skat-Tricks type, or `bidding` —
   *  its number there, and whether it was right. */
  exercise_finished: { section: string; number: number; right: boolean }
  /** A sign-in or sign-up button was pressed (SKATGO-152): where on the page; the page itself comes with every event. */
  sign_in_clicked: { at: SignInAt }
  /** An account made within the hour was signed in for the first time in this browser (SKATGO-152). */
  account_signed_up: Empty
  /** One of today's tournaments was entered: its start button pressed while none of its deals was open.
   *  `deals` says which (SKATGO-77). */
  daily_started: { deals: number }
  /** A tournament's last deal today was finished, and the name the entry stands under on the board (SKATGO-152;
   *  null when the board did not answer). */
  daily_finished: { deals: number; total: number; name: string | null }
  /** The deal of the day's result was shared (SKATGO-131): through the share sheet, copied, or neither worked. */
  dod_shared: { how: 'whatsapp' | 'facebook' | 'telegram' | 'x' | 'sheet' | 'copy' | 'failed' }
  /** A shared result's page was opened (SKATGO-132): through which platform's link, and whether on its own day. */
  dod_share_opened: { via: string; today: boolean }
  /** Today's finished entry was put on the leaderboard under a nickname, or renamed. */
  daily_nickname_set: Empty
  /** A private table was opened. */
  room_created: Empty
  /** A seat at someone's private table was taken. */
  room_joined: Empty
  /** The private table's first deal was started, with this many people seated. */
}
export type GameMode = 'free' | 'lesson'
export type SignInAt = 'header' | 'home' | 'daily' | 'profile' | 'tricks' | 'bidding' | 'forum_post' | 'forum_comment' | 'table_open' | 'table_sign_up'
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

/** What PostHog keeps about the visitor beyond their events (SKATGO-152): the name they stand under on the
 *  leaderboard, once it is known. Only on the published site, like every event. */
export function setPerson(props: { nickname: string }) {
  if (typeof window === 'undefined' || !isPublishedSite(window.location.hostname)) return
  void import('posthog-js').then(({ default: posthog }) => {
    if (posthog.__loaded) posthog.setPersonProperties(props)
  })
}

/** An account as PostHog is told about it: its Clerk id and when it was made (ms; null when not known). */
export type Person = { id: string; createdAt: number | null }
/** How new an account may be for its first sign-in in a browser to count as signing up (SKATGO-117's hour). */
const NEW_ACCOUNT_MS = 60 * 60 * 1000
/** The account this browser last announced, so a sign-in is announced once and a sign-out is noticed. */
const ANNOUNCED = 'skatgo.account.v1'

/**
 * Tells PostHog who is signed in (SKATGO-152), each time that is settled on a page. An account is identified by its
 * Clerk id, with the database's `user:<id>` as a property, so the browser's events before sign-in become the
 * account's too. An account's first sign-in in this browser is announced on the window as `skatgo:identify`, as
 * `track` announces events, and an account made within the hour counts as signed up. No account where one was
 * signed in means it signed out: PostHog forgets it, and what follows is a new visitor's.
 */
export function identify(person: Person | null) {
  if (typeof window === 'undefined') return
  let announced: string | null = null
  try {
    announced = localStorage.getItem(ANNOUNCED)
    if (person) localStorage.setItem(ANNOUNCED, person.id)
    else localStorage.removeItem(ANNOUNCED)
  } catch {
    // Storage refused: PostHog's own state below still decides what it is told.
  }
  const fresh = person ? announced !== person.id : announced !== null
  if (fresh) window.dispatchEvent(new CustomEvent('skatgo:identify', { detail: person }))
  if (isPublishedSite(window.location.hostname)) {
    void import('posthog-js').then(({ default: posthog }) => {
      if (!posthog.__loaded) return
      const held = posthog.get_property('$user_state') === 'identified' ? posthog.get_distinct_id() : null
      if (!person) {
        if (held) posthog.reset()
      } else if (held !== person.id) {
        const created = person.createdAt === null ? undefined : { account_created_at: new Date(person.createdAt).toISOString() }
        posthog.identify(person.id, { player: `user:${person.id}` }, created)
      }
    })
  }
  if (person && fresh && person.createdAt !== null && Date.now() - person.createdAt < NEW_ACCOUNT_MS) track('account_signed_up')
}
