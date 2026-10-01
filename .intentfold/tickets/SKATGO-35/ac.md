# SKATGO-35 acceptance checks

All against the built web app on the ticket's web port and a local multiplayer service on the
ticket's multiplayer port, backed by the local Docker PostgreSQL on the ticket's database port
(`operations.md` Tools). Never production. Scripts live in `tmp/`.

**No gameplay in the browser** (the human's standing rule: acceptance does not play games; gameplay
is left to the human's own testing). Whole deals are driven **headlessly through `/api/daily/*`**
— the server answers each move with the computers' replies at once, so 12 deals take seconds. The
script picks moves by the rules engine (`legalPlays` on the hand the API returned; pass in the
auction), never by generated text. The whole API check must finish in **under a minute**; gameplay
is listed in the handoff as left to the human's own testing. The browser (Playwright, headed, 1280×820 and 375×812) only checks
that the page opens, the table deals and responds to one move, a reload resumes, and the summary
renders.

## AC1 — same 12 deals for everyone today; a new set after Berlin midnight

- Players A and B (two cookie jars) each play all 12 deals through the API, recording for each deal
  the hand as dealt, the dealer and the seat roles.
- **Pass**: A's and B's 12 records are identical.
- Restart the local multiplayer with an acceptance-only clock preload (`tmp/`) that moves `Date` past
  the next Europe/Berlin midnight; player C requests state.
- **Pass**: C's day differs and deal 1 differs from A's; the local DB holds two `daily_deals` rows
  with different decks.
- Browser: `/en/daily` and `/de/taeglich` open, show the start button, and the table deals 10 cards.

## AC2 — per-deal and total Seeger-Fabian on the page equal the server's record; tampering changes nothing

- **Pass**: after A's 12 deals, the server's per-deal scores and total (local `psql`) equal an
  independent Seeger-Fabian computation in the check script from each deal's returned result.
- Browser with A's cookie: the summary lists 12 scores and the total, equal to the DB row.
- During B's play, `/api/daily/act` with an added `score`/`total` field, a forged deal index, and a
  stale `revision`.
- **Pass**: each is refused; the DB row is identical before and after.

## AC3 — once a day; refresh resumes the unfinished deal

- Browser with a fresh player D: start, make one legal move, reload.
- **Pass**: the same deal number, the same remaining hand, the same tricks; no new deal.
- A (finished): the page shows the summary and no way to start; the API returns the summary and
  refuses any action.

## AC4 — nothing hidden leaves the server before the deal is over

- **Pass**, mechanically over every API response of B's 12 deals: the cards in any response of a
  deal ⊆ B's own hand as dealt ∪ cards already played ∪ (the skat once B picked it up as declarer) ∪
  (an Ouvert declarer's hand) ∪ (the skat in the settlement once the deal is done). No response names
  a card of another deal.
- Browser: the opponents' stacks render face down.

## Tournament table (grill Q3/Q8)

- Browser: during a tournament deal there is no `skat-hint` tab and no hint button in the drawer or
  panel; the leave link points to `/daily`; the assistant's table snapshot stays empty.

## Unchanged behavior

- `/play` opens and deals; a lesson with a table opens and deals.
