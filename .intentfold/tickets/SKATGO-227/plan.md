# SKATGO-227 plan

## What the code already says that the ticket does not

- `home_cta_clicked { button: 'primary' | 'free' }` (`app/src/lib/analytics.ts`, SKATGO-131) is sent only by the deal of
  the day's and free play's cards (`heroClick` in `entry-page.tsx`); the course's and the League's send nothing.
- `track` announces every event on the window as `skatgo:track` and sends to PostHog only on the published site, so a
  local check sees each click without touching PostHog (ops Redline 2 forbids test data in production).
- The four cards are `Way`s, each with its `section` (daily / play / course / league), in page order daily, play,
  course, League (SKATGO-224).
- The token check rejects a number other than 0 or 1 in a JSX attribute, so a position cannot be written as `={2}`.

## Route

1. `analytics.ts`: `home_cta_clicked` carries `card` and `position` (1–4), `button` kept as optional for the two cards
   that had it.
2. `entry-page.tsx`: the four cards' order as one list (`CARD_ORDER`) beside them; `Way` sends the event itself on click
   with its `section` as `card`, its place in that list as `position`, and a `button` when given (daily `primary`, play
   `free`); `heroClick` goes.
3. No charter text names this event; nothing to amend.

One commit, then the handoff.
