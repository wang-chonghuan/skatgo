# SKATGO-8 acceptance check plan (basic function only — no whole games)

Built server on port 55008, headed Playwright, fresh contexts.

1. **Skat hint** — `/xx/play`: the learner answers every bid with "bid"/"yes" and no limit, which always
   wins the auction (the computers pass at their own limit) — no replaying of deals, no card played; at
   the skat choice the 💡 button exists and a click shows a hint panel with text.
2. **Declare hint** — from that state, both paths: pick up → discard two → declare step, 💡 shows the
   recommended game with a reason; and (new deal) Hand → declare step, 💡 likewise.
   Mechanically: unit test — the advice equals the computers' choice on their own hands; engine tests
   unchanged.
3. **Home** — `/zh`, `/en`, `/de` at 1280×820 and 375×812: the hero panel's first element is the
   free-play link (`/xx/play`, opens the table), no progress bar (`role=progressbar` absent on the map),
   the note line and resume link present, no second free-play link below; no horizontal scroll; no
   console errors.
