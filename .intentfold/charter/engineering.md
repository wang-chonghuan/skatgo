# Engineering

Human-authored architecture and development rules. This file defines how the product is built, how
code changes are made, and how they land. Section shape is fixed by `.intentfold/readme.md`.

The dependency inventory belongs to the lockfile; generated structure belongs to its generator.
Record here only decisions, boundaries, and commands that the repository cannot explain by itself.

> Seeded 2026-09-21 by intentfold cap1 **from the repository and from how it was built** (it was
> extracted from Parrottoon the same day), and accepted by the human as written.

## Contract

**Stack**

- **TanStack Start** (Vite, TypeScript, React 19): server-rendered shell, file-based routes. Every
  piece of course state lives in the browser, without database access from the course. The web app's
  server endpoint, `POST /api/ask` — the assistant (SKATGO-9) — is answered in `app/src/server.ts` before
  the page router: it streams a contextual answer from Azure OpenAI to any visitor. A Clerk session,
  when present, identifies the learner for rate limiting but never gates the answer (SKATGO-13/14).
  Its other server endpoints, `POST /api/daily/state` and `/api/daily/act` (SKATGO-35), are answered
  there too: they pass the daily tournament's requests on to `multiplayer/`, naming the player — the
  Clerk account, or else a device id from an httpOnly cookie, sent on only as its hash.
- **Accounts are Clerk's** (`@clerk/tanstack-react-start`, SKATGO-12): the users live at Clerk, not
  here. Accounts are optional: neither the course nor the assistant requires one.
- **StyleX, compiled through Astryx's build integration** (`astryxStylex()`), with Astryx's reset and
  theme CSS underneath. `ui.md` owns styling.
- **Nitro** produces the deployable server (`app/.output/server/index.mjs`).
- **Colyseus** owns the independent `multiplayer/` backend (SKATGO-20, human-approved
  2026-09-27). It reuses the pure Skat engine; PostgreSQL stores private snapshots,
  seat ownership and idempotent command receipts. Only public state and per-seat
  StateViews cross the socket. The course frontend remains independent.
- **The daily tournament runs in `multiplayer/`** (SKATGO-35), as plain HTTP routes under `/daily`
  behind the admission key, not as a room: one human against two deterministic computers needs no
  socket. Its PostgreSQL holds each day's deals (`daily_deals`) and each player's entry
  (`daily_entries`: the human's moves per deal, per-deal summaries, the total, and the nickname a
  finished player put on the leaderboard — SKATGO-36). The leaderboard is computed from those rows on
  request. The web service is its only client.
- **The tournament's computers play their cards with SkatZero** (SKATGO-38): nine pinned ONNX models
  from github.com/Jimboom7/SkatZero `1fe5cab` (MIT), committed under `multiplayer/skatzero/` with a
  hash manifest and run by `onnxruntime-node` (exact version, human-approved 2026-10-02) — in
  `multiplayer/` only, never in `app/` or the browser. `multiplayer/src/skatzero/` is the port of
  SkatZero's feature encoder and of the measured decision procedure (one-step lookahead included).
  Since SKATGO-39 the bidding is SkatZero's too (`src/skatzero/bidding.ts`, a port of its `Bidder`
  with its eight `.npy` tables committed under `multiplayer/skatzero/bidding/`): the auction, pick-up
  or Hand, the discard and the game. Days dealt with it are `skatzero@1fe5cab`; SKATGO-38's hybrid
  days (`skatzero-play@1fe5cab+heuristic-bid`) keep the heuristics' bidding. The opponents' bids are
  never features, in bidding or card play. Since SKATGO-40 free play (`/play`) and lesson 11's game
  play the same SkatZero computers on the server, their bidding taken from a committed pool of deals
  (`multiplayer/skatzero/free-pool.json.gz`, label `skatzero@1fe5cab`). Rooms and hints keep the
  heuristics.
- Course libraries: `motion` (animation), `@letele/playing-cards` (public-domain card faces),
  `canvas-confetti`, `zustand` (progress, persisted to `localStorage`), `deep-chat-react` (the
  assistant's chat window).

**Structure**

`app/` is a **standalone project** — its own `package.json`, lockfile and `node_modules`. The repo
root has none; it holds the `Dockerfile`, whose build context is the repo root.
`multiplayer/` is another standalone npm project with its own lockfile and Dockerfile,
also built from the repository root. Neither project imports the other's runtime.

| Path | Owns |
|---|---|
| `app/src/lib/skat/` | the rules engine (ISkO): cards, trick-taking, game value, settlement, the whole-game state machine, and the computer players (`ai.ts`, which also writes every hint) |
| `app/src/lib/skat/lessons/` | the course: `content.ts` (lessons), `drills.ts` (randomised exercises whose answers the engine computes), `types.ts` |
| `app/src/lib/skat/progress.ts` | learner progress in `localStorage` |
| `app/src/components/skat/` | every page and widget of the course, and its own small UI kit (`ui.tsx`) |
| `app/src/lib/ask/` | the assistant's server side: the page context it is given, the limits, the model call, and the `/api/ask` handler (with an optional session lookup for rate-limit identity) |
| `app/src/start.ts` | Clerk's request middleware, which hands each page its session state |
| `app/src/skat-layout.tsx` | the frame around every page, including the sign-in button and the floating assistant |
| `app/src/routes/` | thin route files: `/` (the front page), `/course`, `/lesson/$id`, `/play` |
| `app/src/theme/`, `app/src/styles/app.css` | styling — see `ui.md` |
| `app/brand/skatgo-logo.png` | the SkatGo logo's master image; every icon in `app/public/` (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `icon-*.png`, `logo-96.png`) is cut from it by `.intentfold/tickets/SKATGO-23/icons.mjs` — regenerate them, never edit them |
| `app/src/lib/skat/tournament.ts` | the tournament's rules on the engine: what seat 0 may see of a deal (`seatView`, also free play's), that view as a table, Seeger-Fabian |
| `app/src/lib/skat/nickname.ts` | what may stand on the public leaderboard as a nickname (SKATGO-36) |
| `app/src/lib/daily-handler.ts`, `app/src/lib/session.ts` | the web's `/api/daily/*` proxy, and the Clerk session lookup the server routes share |
| `app/src/components/skat/daily-table.tsx` | the tournament's button, day result and table; `/daily/play` is its full-screen page |
| `app/src/lib/free-handler.ts`, `app/src/lib/free-api.ts`, `app/src/components/skat/server-table.tsx` | free play on the server (SKATGO-40): the web's `/api/free/*` proxy and its per-address limits, the browser's calls, and the table free play and lesson 11 use (`GameTable` with a `server` source, hints and assistant kept) |
| `multiplayer/` | room transport, admission, persistence, recovery, backend verification and deployment; `src/daily.ts` the daily tournament; `src/free.ts` free play; `src/computers.ts` the SkatZero computer turns both share; `scripts/make-free-pool.ts` the one-off generator of free play's pool |

**Key decisions**

- **The rules engine is the only judge.** Exercises are generated from random cards and judged by
  `lib/skat`; there are no hand-typed answer keys, so an exercise cannot teach something the game at
  the end contradicts. Hand-written exercises are checked against the engine by
  `lessons/lessons.test.ts`.
- **Public titles, explanations and navigation render on the server** through
  `components/skat/client-page.tsx`. Random exercises, game tables and personal tournament state are
  browser-only, behind `client-part.tsx`; progress is applied after mount. A crawler must not need
  hydration to read an indexable page. The SSR bundle import check protects against the historical
  Nitro/rolldown undefined-binding failure (PARROT-42), not a prohibition on static page content.
- **German-first public addresses** (SKATGO-44): one stable German root, a permanent redirect from
  the old German homepage, and independent English pages. Paraglide patterns own translated
  addresses; canonical, page-specific hreflang, internal links and sitemap agree with them.
  `lib/indexability.ts` owns exclusion of personal execution pages; those routes declare noindex.
- **The tournament's cards and scores are the server's** (SKATGO-35). The browser receives only seat
  0's view of the current deal (`seatView`): its own hand, what has been played, the skat only once it
  may know it, an Ouvert declarer's hand. A deal is stored as its deck and dealer plus the human's
  moves and replayed through the engine; the score is what that replay settles, never a number the
  browser sends.
- **A computer is asked once per move, and the answer is kept** (SKATGO-38). Days dealt with SkatZero
  store every move of a deal — the human's and the computers' — and replay them as recorded; a
  computer decides only when it is its turn and never again for that move. A computer decides from
  what its seat may see (`viewOf`), and every move it proposes passes the engine. If it cannot decide,
  the request fails and nothing is stored: no other player stands in for it. Days dealt before keep
  `computer = heuristic` and replay as they always did.
- **A day's computer bidding is worked out when the day is dealt, not when it is played**
  (SKATGO-39). One computer's bidding simulates all 231 possible skats (≈ 1 s per computer per deal
  locally), so the leader deals today and tomorrow ahead (`prepareDays`: at start, then hourly),
  computing in slices that yield to the event loop, and stores each computer's highest bid and its
  pick-up/Hand tables inside the deal (`daily_deals.deals`). Requests never deal: a day not yet
  prepared answers `503 day_preparing`. Only today's day is ever read by a route. The skats are tried in
  an order fixed by day, deal and seat; the stored result is what play uses, on every platform.
- **A free-play game is a deal from a committed pool, and its state travels with the page**
  (SKATGO-40).
  - The pool holds 1,000 deals (seed `skatgo-free-pool/1`). For both computers it stores the
    highest bid and the pick-up/Hand choice at every SkatZero bid value.
  - It is generated once by `scripts/make-free-pool.ts` and committed with its size, SHA-256 and
    count in the manifest. Readiness waits for it; an altered pool stops the service at start.
    Running the generator with a larger count extends the pool; earlier deals stay identical.
  - The server keeps nothing per game. The game is an AES-256-GCM token (key derived by HKDF from
    the admission key, label `skatgo-free/1`, 24 h lifetime) holding the deal's index, the pool
    version, the start time and every move, the computers' included.
  - Replay runs the engine only; a computer is asked only for new moves. There is no cookie and no
    browser storage; a reload starts a new game.
  - The pool is in the public repository, so its decks are readable. This is accepted because free
    play is unranked.
- **Split from Parrottoon on 2026-09-21**, as byte copies of its course code, theme and styles; routes
  moved from `/skat/...` to the root. The two codebases are **not synchronised**: a change in either
  does not reach the other.
- **Two build details are load-bearing and commented where they live**: the CSS layer order in
  `app/src/styles/app.css`, and the lightningcss targets in `app/vite.config.ts` that keep
  `light-dark()` native.

## Tools

**Multiplayer development entry**

[Multiplayer backend guide](../../multiplayer/README.md) is the primary integration
reference and a major SKATGO-20 deliverable. It covers local startup and environment
variables, SDK room creation/joining/recovery, public and private state, commands
and receipts, disconnect/AI takeover, persistence, verification, and Render
release/rollback. Start there when integrating or extending multiplayer; ticket
handoffs record delivery evidence, not the current usage contract.

**Mechanical defence**

Run once before the handoff. Each part catches a different class of defect:

```bash
npm --prefix app run typecheck && npm --prefix app run build && npm --prefix app run test && \
  node app/scripts/check-client-bundle.mjs && node app/scripts/check-design-tokens.mjs && \
  test "$(git grep -nE 'className=|style=\{\{|#[0-9a-fA-F]{6}' -- app/src ':(exclude)app/src/theme/**' | wc -l | tr -d ' ')" = 0 && \
  node -e "import('$PWD/app/.output/server/_ssr/ssr.mjs').catch((e) => { console.error('server bundle does not link:', e.message); process.exit(1) })"
```

- **`typecheck`** — Vite compiles without typechecking; a prop or token that does not exist builds and
  ships silently otherwise.
- **`build`** — StyleX compiles at build time, so a bad style fails here.
- **`test`** — the rules engine, including 300 whole games between three computer players, and every
  lesson's exercises against the engine.
- **`check-client-bundle.mjs`** — a server-only reference (`Buffer.from`, `process.env`) that reached a
  browser chunk and would kill hydration.
- **`check-design-tokens.mjs`** — `ui.md`'s token check: a colour, size, weight, duration, breakpoint
  or other design value written in product code instead of named from a registry under
  `app/src/theme/` (SKATGO-19). It parses the source with `@babel/parser` (a devDependency for this
  check alone) and fails on finding no files, so it cannot pass vacuously.
- **the git grep** — `ui.md`'s literal check over tracked product source, excluding only the theme
  registries. No hit is correct: even the `theme-color` meta takes its colour from
  `app/src/theme/constants.ts`. Using `git grep` keeps ignored Paraglide-generated documentation out
  of the result.
- **the import** — links the built server's SSR chunk. It is what catches the 500-everywhere build
  described under Key decisions; it was made to go red against the defective PARROT-42 build before
  it was written here.

**Architecture and generation**

**Search surface**

Run against the built server at the acceptance boundary, and against production after release:

```bash
node app/scripts/check-seo.mjs <origin>
```

Requires the Playwright installation used for acceptance. If it is outside app node_modules, set
`PLAYWRIGHT_MODULE` to its resolved package directory. `HEADED=1` opens Chromium visibly. The checker
parses the live sitemap, derives its pages and language variants, then verifies visible content with
JavaScript disabled, reciprocal alternates, self-canonical URLs, robots, unique metadata, JSON-LD,
assets, internal links, stable German root, legacy redirects and unknown-page 404s. Empty derivation
fails. Deliberately incorrect canonical and empty-content observations must be rejected.

Multiplayer defence (requires an isolated local PostgreSQL; see Operations Tools):

```bash
npm --prefix multiplayer run check
```

It includes `test/skatzero.test.ts`: the committed models match `multiplayer/skatzero/manifest.json`,
an altered model is refused, and the encoder, values and choices equal SkatZero's Python driver on
the committed fixture (`test/fixtures/skatzero-parity.json`, produced by that driver).

- **Generated, never hand-edited**: `app/src/routeTree.gen.ts` (TanStack Start writes it from
  `app/src/routes/`), and `app/src/theme/parrottoon.{css,js,d.ts}` (rebuilt from
  `app/src/theme/parrottoonTheme.ts` — the command is in `ui.md`).

**Dependencies**

npm, with `app/package-lock.json` as the source of truth: `npm --prefix app install`.

**Landing changes**

Through a **pull request** to `main`, squash-merged. There is no CI; the mechanical defence is run
locally before the handoff.

```bash
gh pr list --head <branch> --state all
gh pr create --base main --head <branch> --title "<title>" --body "<body>"
gh pr checks <number>
gh pr merge <number> --squash
```

The ticket branch is deleted at close, not by the merge command: `--delete-branch` fails from a
linked worktree after the merge has already landed.

## Guidance

**No gratuitous dependencies.** If the existing stack can meet the requirement, do not add, remove,
or change a library. A dependency change is admissible only when the stack genuinely cannot meet the
requirement and the ticket records the human's decision.

**Reuse before inventing.** Existing helpers, config paths, schemas, components, and sources of truth
come first. A second way to do something that already has a way is a defect.

**Respect ownership boundaries.** Put behavior in the module that owns it. Do not reach through a
public interface into another module's private implementation for convenience.

**No fake progress.** No TEMP markers, degradation branches, or mocks standing in for a failed
external dependency. A failed premise is a stop and a report.

**Surgical changes.** Touch what the ticket needs. Do not reformat unrelated files or fold adjacent
cleanup into the same change.

**Uncertainty surfaces.** Ask rather than invent a fallback, compatibility layer, data meaning, or
cross-module contract.

**Complexity hotspots**

- **`app/src/lib/skat/value.ts` and `game.ts` are the rules.** A change there changes what every
  exercise and every hint says. Change the rule, then let the tests say which exercises moved; never
  adjust an exercise to agree with a rule that is wrong.
- **`app/src/lib/skat/ai.ts` is both the opponents and the hint.** Making a computer player stronger
  also changes what the learner is told to do and why; the reason strings are part of the teaching.
- **Course randomness runs in the browser only.** Drills use `Math.random`; rendering one on the
  server would hand the browser a different question from the one it hydrates. Multiplayer deals are
  server-owned and cryptographically shuffled, and free play's deal is drawn from the server's pool
  (SKATGO-40); none of them is SSR content.
- **A tournament deal in progress is replayed from its moves** (SKATGO-35). On a `heuristic` day,
  changing `ai.ts` or `game.ts` changes how an unfinished deal of that day replays; on a recorded day
  (SKATGO-38) only `game.ts` matters, since the computers' moves are stored. Finished deals keep the
  summary and score written when they ended.
- **`multiplayer/src/skatzero/encode.ts` must stay equal to SkatZero's Python encoder**, quirks
  included: the models were trained on exactly those features. A change there is checked against the
  Python driver, not against intuition.
- **Progress lives in `localStorage` under one versioned key** (`progress.ts`). Changing its shape
  without a new key or a migration silently loses every learner's progress.

## Redlines

1. **Committing credentials, tokens, connection strings, or hidden account data** — forbidden
   outright, including source, fixtures, ticket artifacts, and commits.
2. **Discarding or reverting a change already present in a dirty worktree** — forbidden outright.
3. **Adding, removing, or changing a dependency** — not without the human's explicit approval and a
   ticket carrying that decision.
4. **A route file under `app/src/routes/` importing a course page other than through
   `~/components/skat/client-page`** — forbidden outright. Detectable from the
   imports of the route files. It is the shape that produced the 500-everywhere build.
5. **Hand-editing `app/src/routeTree.gen.ts` or `app/src/theme/parrottoon.{css,js,d.ts}`** — forbidden
   outright. They are generated.
6. **A server-only reference in a browser chunk** — forbidden outright. Detectable by
   `app/scripts/check-client-bundle.mjs`.
7. **Weakening a check to make it pass** — forbidden outright: deleting an
   assertion, loosening the grep, or skipping a test. The check failing is the check working.
