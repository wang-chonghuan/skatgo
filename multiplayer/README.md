# Multiplayer Backend

Independent Colyseus 0.18 TypeScript service. Its rooms are the site's private
tables (SKATGO-61); it also runs the daily tournament and free play over HTTP.
It imports the existing pure Skat engine, not a fork of the rules.

## Local Runtime

Node 24+, npm and Docker are required. From the repository root:

```sh
npm --prefix multiplayer ci
node multiplayer/scripts/local-db.mjs start
npm --prefix multiplayer run check
npm --prefix multiplayer start
```

`local-db.mjs` creates a named local PostgreSQL 17 container and generates a
mode-0600 `multiplayer/.env`. It does not print credentials, prune containers or
replace an existing environment file. Use `stop` to stop only that database.
If the current Docker runtime is full, select an isolated context rather than
deleting other projects' data.

For a ticket, use the ports resolved from `.intentfold/project.json`:

```sh
DATABASE_PORT=57020 node multiplayer/scripts/local-db.mjs start
PORT=56020 npm --prefix multiplayer start
TEST_PORT=56020 npm --prefix multiplayer test
```

Do not start the preview on the acceptance port while tests are running. Tests
create a unique local database, spawn actual server processes and clean up their
own database. They refuse external database hosts. They use the actual 30-second
disconnect deadline, not a mock clock; allow several minutes.

| Configuration | Contract |
|---|---|
| `DATABASE_URL` | Required, direct PostgreSQL connection; not transaction-pooled |
| `MULTIPLAYER_ADMISSION_KEY` | Required, random secret of at least 32 characters |
| `PORT` | Default 3221 locally; Render supplies its port |
| `AI_DELAY_MS` | A private room's beat between computer moves: default 850, free play's (SKATGO-164); minimum 10; short delays are useful for headless verification |
| `APP_VERSION` | Local diagnostic override; Render uses `RENDER_GIT_COMMIT` |
| `TEST_PORT` | Acceptance server port; next port is used to test a standby process |
| `DATABASE_PORT` | Local database provisioning port |
| `DOCKER_CONTEXT` | Optional existing local Docker context, preserved in local `.env` |
| `SKATGO_PERSONAS_ENABLED` | First-start bootstrap only: missing or `0` disables; `1` enables. Other values fail startup. Persisted control subsequently takes precedence. Activation is a separate explicit operation. |
| `SKATGO_PERSONAS_COUNT` | First-start bootstrap population, default 17; integer 1–500. Persisted control subsequently takes precedence. |

No Clerk, LLM or Azure configuration is needed by this service.

## Simulated Personas

The project development skill is `.agents/skills/skatgo-personas/SKILL.md`.
The editable starter roster is `src/personas/roster.json`: 17 fictional players
with independent card-play, bidding and activity styles. `config.ts` deterministically
extends it to 500 independently varied profiles with stable IDs and names.
Increasing population preserves the prior prefix; it does not clone 17 identical
profiles. Starter names mix personal name variants, initials, individual handles,
case and a few naturally spelled non-English letters; the exact approved list
lives in the roster. The existing larger-population name generator is separate:
a starter revision does not regenerate its prior identities. No player is
automatically renamed.
The roster is bundled with the backend; editing traits requires a release/restart,
but changing enabled/count settings does not. No dependency, gameplay LLM or
separate cloud worker is needed.
The activity/game RNG format version is independent of the editable roster
version. Nickname-only revisions keep the same seed and random sequence;
their new version/hash is audit metadata, not a reason to reroll attendance,
timing or play.

Offline commands, from repo root:

```sh
npm --prefix multiplayer run build
npm --prefix multiplayer run personas -- validate --count 17
npm --prefix multiplayer run personas -- plan --days 30 --count 17
node multiplayer/dist/personas.mjs calibrate --partition smoke --deals 30 --count 17 --output .intentfold/tmp/persona-smoke --cache .intentfold/tmp/persona-inputs
```

Calibration is real ONNX/engine play on the same pool sample for every persona.
Scores are not generated directly. Report sample size; the roster's probabilities
are initial hypotheses, not a promise of fixed difficulty or rank.

The `/4` roster adds `play.strength`: separate declarer/defender card-error
probabilities, rank-depth severity, bid-estimate noise, and pickup/Hand,
contract and discard judgement errors. Card errors depend on visible legal-choice
complexity, contract weakness and seeded activity form. The adapter sees no
hidden opponent hands, prior win totals, board ranks or desired outcomes.
Forced moves and equal-valued alternatives are not counted as mistakes.
Audit records include phase, role, candidates, selected rank, raw loss and severity;
raw model losses are not card points or win probabilities. Only the selected
contract's actual discard decision is counted in the played trace.

Strength calibration protocol and acceptance:

```sh
node multiplayer/dist/personas.mjs calibrate --partition train --output .intentfold/tmp/persona-train --cache .intentfold/tmp/persona-inputs
node multiplayer/dist/personas.mjs calibrate --partition holdout --training .intentfold/tmp/persona-train --output .intentfold/tmp/persona-holdout --cache .intentfold/tmp/persona-inputs
```

Training is indices 0-599 of the verified 1,000-deal pool; holdout is 600-999.
Both use three fixed seeds. Holdout refuses missing/incomplete training or a
different roster hash. The output folder freezes the experiment manifest and
contains atomic per-deal checkpoints, full game/audit logs and `report.json`.
Rerunning unchanged inputs resumes; changed configuration requires a new folder.
The shared input cache contains canonical evaluations/benchmarks only, not
sampled outcomes. Every loaded/generated game is legally replayed and its XP
recomputed before entering the report. No database is used.

Reports compare the exact legacy and new adapters on paired cards/seeds, including
player-side win rate, declarations/defence, contract strata, score/XP distributions,
AI gaps, six-deal copies, all-win rounds and upper score quantiles.
The uncertainty unit is a distinct deal with its seeds grouped together, not
every replay. 10,000 deterministic cluster bootstrap draws provide one-sided
95% upper bounds and Bonferroni-adjusted family bounds for the tested profiles.
The ordinary-card family upper edge is 35%, a calibration reference, never a
display clamp, forced-loss quota or universal human maximum. `acceptanceSample`
is true only for the full 400-card/three-seed holdout; `--deals` smoke/probe runs
do not establish acceptance. Selected daily-one cards require separate date
evidence and are not pooled into this ordinary-card gate.

Read-only database diagnosis:

```sh
node multiplayer/dist/personas.mjs diagnose --day 2026-11-10
```

`--since` defaults to the same `XP_SINCE` as the XP board. `--player` selects a
simulated six-deal incident, default `sim:sunny`; `--export <new-file>` exports
only simulated snapshots/results and server deals for isolated replay.
Server deals in the export cover `--since` through `--day`, preserving each
daily-one deal's stored selection provenance.
The command uses a repeatable read-only transaction, never migrations or a
runner, and works with local or explicitly supplied remote DB configuration.
Human aliases are merged for per-person/mode aggregates; account IDs and human
game histories are not exported. External connections should use TLS with
certificate validation (for example the connection URL's `sslmode=verify-full`).

Separate daily-mode evaluation, after freezing training:

```sh
node multiplayer/dist/personas.mjs diagnose --day 2026-11-10 --since 2026-11-02 --export .intentfold/tmp/daily-fixture.json
node multiplayer/dist/personas.mjs calibrate-daily --fixture .intentfold/tmp/daily-fixture.json --training .intentfold/tmp/persona-train --output .intentfold/tmp/persona-daily
```

The fixture is read-only input, never imported into production. This compares
both policies with all three seeds and the stored canonical benchmark, legally
replaying every saved game. Daily-six uncertainty groups whole dates; daily-one
groups selected dates and has no artificial six-deal rounds. Neither daily mode
uses the ordinary 35% acceptance gate. Fewer than 40 dates, including limited
contract/role strata, are explicitly insufficient for a long-run conclusion.
Unchanged input resumes; a changed fixture/configuration requires a new output
folder. Full selected-mode logs and date/selection metadata remain in that folder.

The controller lives in the existing always-on multiplayer leader, not a new
deployment. It starts immediately, then waits 10 seconds between ticks, including
when disabled. An enabled tick executes at most 3 activities, serially, and stops
starting more after a 5-second batch budget. One slow activity may exceed that
budget; native inference is awaited, never abandoned behind a timeout.
There is one background activity in flight and shared resident ONNX sessions.
Service uptime is not player attendance: not all 17 appear on every board.

Activities finish in independently sampled IANA-local windows inside the Berlin
tournament day, respecting DST. Quiet periods and independent attendance allow
skipped days. Only today's activities at most 30 minutes late are attempted:
there is no historical backfill or unbounded catch-up. Missing daily deals wait
for preparation. Each failed job records its error and retries at most three
times, at 5/10/15-minute intervals, still subject to today's catch-up bound.
Shutdown/handover cancels the runner before models are released.
Newly activated personas receive only activities whose planned start is still
in the future. A restart reads saved jobs, not a new catch-up plan; the controller
does not replay yesterday or backfill earlier starts. Planned start and completion
are stored separately from actual computation/commit time. This remains batch
board simulation, not a persisted online-presence/room-actor lifecycle.

Manual controls (local `.env` is loaded by the command):

```sh
npm --prefix multiplayer run personas -- status
npm --prefix multiplayer run personas -- configure --enabled 1 --count 17
npm --prefix multiplayer run personas -- configure --count 100
npm --prefix multiplayer run personas -- configure --count 200
npm --prefix multiplayer run personas -- configure --count 300
npm --prefix multiplayer run personas -- configure --count 400
npm --prefix multiplayer run personas -- configure --count 500
npm --prefix multiplayer run personas -- configure --enabled 0
```

Settings live in `persona_control`, survive restart, and apply on the next tick.
The command atomically increments the control revision. Each result transaction
locks/checks it, so a finished disable/shrink operation blocks any stale result
even if a native computation is still finishing. Shrinking does not erase earlier
entries or XP; reenabling reuses saved slots.
Status reports effective settings, heartbeat age, tick duration/error and the
current active population's completed/due/future/expired/failed queue.
`due` includes jobs waiting for retry or daily preparation; it is not all immediately
runnable. `registered` includes inactive identities retained for their history.
Bootstrap env variables do not override a persisted operator decision on restart.

The CLI ships as `dist/personas.mjs` in the production image. An authorized operator
can run `node dist/personas.mjs configure --count 100` in that service's shell;
its remote database requires `--allow-remote --confirm`. These flags acknowledge
an external write, not a substitute for the project's production authorization.
`status` is read-only. No browser-facing control route or web proxy is added.

`persona_players` reserves stable simulated nicknames without touching real
users; a collision stops the tick rather than renaming someone. A registered
persona nickname revision requires explicit human approval and a targeted
migration with the runner stopped. Preserve identity and all saved activities,
snapshots, results and XP; the reservation path still rejects automatic renames.
Local revision approval does not authorize a production migration. `persona_jobs`
holds each day's activity snapshot, seed, roster hash/version, planned time,
actual completion time, full legal move logs, model version, summaries and XP.
Its key excludes config version: restarting or changing the roster cannot count
an already planned/completed slot twice. Free-play pool indices are reserved
once per simulated player and pool version, across days. Exhaustion records an
error; it never reuses a deal for XP.

Once a persona has a plan for that day, changing bundled traits or volume cannot
add/rearrange its slots that day; the new plan applies on later days. This preserves
the original activity timeline as well as already completed scores.

`strengthSince` declares the first eligible Berlin day (2026-11-11 for `/4`).
Before it, new plans retain legacy traits/policy. Each new snapshot freezes its
`policy`; snapshots predating the field route through `skatgo-personas/1`.
`skatgo-personas/2` requires strength traits, and unknown/mismatched policies fail
the job rather than changing its decisions. Existing queued and completed jobs
are not migrated, even after the date boundary. Keep the legacy adapter until
no retained job needs it. Deploy/activation or explicit queued-job migration is
a separate operator decision; this configuration alone changes no production data.

Only complete activities enter the daily and XP board reads. Simulated entries
are never inserted into `daily_entries`, `play_deals`, user aliases, private
profiles, forum, referrals or analytics. Existing routes do not accept `sim:`
identities. Daily rank/tie rules and XP tiers are shared with real users.
Disabling stops new work; already completed board history remains.

500 is a supported population/configuration limit, not a measured promise of
500 simultaneous tables. Before production growth, measure real-user latency,
background inference, expired queues and memory on that instance. The 1,000-deal
free pool remains finite for each persona; exhaustions must be acted on rather
than silently recycling XP. Rooms, per-card thinking and simulated network
interruptions are future adapters, not delivered by this board service.

## Protocol

Two kinds of client come in. Trusted integration clients (the tests) send the
admission key. Browsers — a private table on the site (SKATGO-61) — never see the key:
the web server's `/api/room/ticket` signs a two-minute ticket with it
(`app/src/lib/room-ticket.ts`), and the room accepts `ticket` in place of
`admissionKey`. Both ride in the SDK's join options. A ticket says what it is for
(SKATGO-117): `open` names the account opening a table (`user:<id>`) and is the only
ticket a browser can create a table with — the snapshot keeps that account as `host`;
`join` sits down at a table or takes a seat back. The web issues tickets only while
`/readyz` answers, so during a deploy browsers wait and try again.

Using `@colyseus/sdk`, create two independent 32-byte random hex values per table —
the invite token (shared with invited participants) and each participant's seat token
(private). Keep the seat token across client restarts.

```ts
const room = await client.create('skat', { ticket, inviteToken, seatToken, nickname })
const invited = await anotherClient.joinById(room.roomId, { ticket, inviteToken, seatToken: another, nickname })
const recovered = await client.joinById(savedRoomId, { ticket, seatToken })
```

A new seat needs a nickname, judged by the leaderboard's rules
(`app/src/lib/skat/nickname.ts`); a seat token alone takes a seat back. Seats fill in
the order people arrive; the creator is seat 0. The table waits in a lobby until seat
0 sends `start`: whoever sits at it then plays, and the empty seats are computers for
good. Nobody can join after the start. There is no public room listing. The room ID
is not an invitation or a recovery credential.

After a deal ends (`done` or `passedIn`), anyone seated sends `next` for the next
deal, dealt by the seat after the last dealer. Each deal's Seeger-Fabian scores add
to the table's running `scores`.

The computers are SkatZero, as in free play. Each deal is drawn from free play's pool
(`skatzero/free-pool.json.gz`) with the dealer the table needs, together with every
seat's prepared bidding plan. A computer also stands in for a person whose seat it
has taken over (see below), on their seat's plan. The discard and game after a
pick-up, and every card, come from the models live. A decided deal ends early, as in
free play (SKATGO-59).

`state.publicData` is JSON (`RoomPublic` in `app/src/lib/skat/room-view.ts`):
- the lobby or the phase, actor, turn and dealer;
- public bids, the declared contract and the played tricks;
- the result, the deal count and the running scores, revision and expiry;
- each seat's nickname, connectivity and control.

Each `state.players.get(String(seat)).privateData` is a Colyseus StateView-filtered
JSON field holding that seat's hand and known buried cards. Other players' private
fields are absent. Ouvert's explicitly open declarer hand is public while it is
played; the skat is public once the deal is over, as at a real table. No other
original hand is published.

Send `command` with `{ id, revision, action }`. IDs are 1-80 alphanumeric, underscore
or hyphen characters and unique per seat. Use the latest public revision. A move is
stale only if the game itself changed since its revision (`played`, SKATGO-117):
someone else dropping or coming back does not make it stale.

| Action | Body |
|---|---|
| Start (seat 0, lobby) | `{ type: 'start' }` |
| Next deal (anyone seated, deal over) | `{ type: 'next' }` |
| Bid | `{ type: 'bid', value: 'bid' \| 'hold' \| 'pass' }` |
| Pick up skat | `{ type: 'pickup' }` |
| Play Hand | `{ type: 'hand' }` |
| Discard | `{ type: 'discard', cards: [card, card] }` |
| Declare | `{ type: 'declare', declaration }` using the engine's declaration shape |
| Play | `{ type: 'play', card }` |
| Claim the rest (declarer) | `{ type: 'claim' }` |

The server sends `receipt`: `{ id, ok: true, revision }` only after persistence, or
`{ id, ok: false, error }`. Retry an uncertain request with the same ID/action;
the prior receipt is returned without another transition. Reusing its ID for a
different action is rejected. A stale revision is rejected, not silently replayed
against a different turn. Ignore neither rejections nor the current public actor.
Trick collection and computer turns are server-owned.

A guest who signs up at a table is recorded as brought by its host: `POST /rooms/referral`
with the admission key and `{ account, roomId, seatToken }` (the web checks the account is
new) writes `account_referrals` once per account; the host's own seat, an unknown seat
and a table without a host are refused.

A room admits six connections for three seats, so a dropped person's reconnection
reservation never locks a full table against its own players; who may sit is decided
by the seat rules above.

Snapshots carry `schema: 2`. A table stored by an earlier schema is not restored and
expires like any other.

## Disconnect and Recovery

After server-detected loss, the player keeps control for 30 seconds. At that
deadline AI temporarily controls the seat. The seat token still belongs to its
human owner. Rejoining atomically restores human control; committed AI moves are
not undone. The normal SDK reconnection token supports short drops; after it
expires or the server restarts, use the room ID and private seat token above.
Do not confuse the short-lived SDK token with the durable application seat token.

Snapshots, token hashes and command receipts are stored in PostgreSQL. A fresh
process restores active rooms and gives previously connected humans a new grace
period. Twenty-four hours without game/admission activity expires a room and
its receipts; requests fail rather than silently starting another game.

One process holds a session advisory lock. All write transactions check its
generation; old processes cannot write after ownership moves. During a Render
rolling deploy, `/healthz` can be healthy while `/readyz` returns 503: the new
process waits for the old process to drain and release ownership. Gameplay
admission opens only after restoration. Do not increase instance count to scale
this design; shared matchmaking and per-room routing need a separate change.

## SkatZero card play and bidding (daily tournament)

From SKATGO-38 the daily tournament's computers play their cards with SkatZero
(github.com/Jimboom7/SkatZero `1fe5cab`, MIT): the nine ONNX models are committed in
`skatzero/models/`, named with size and SHA-256 in `skatzero/manifest.json`, and loaded once
at start (`src/skatzero/policy.ts`). Readiness waits for them; a missing or altered file stops
the service. `daily_deals.computer` names which computer a day was dealt with, and recorded days
keep every move of every deal.

From SKATGO-39 the bidding is SkatZero's as well (`src/skatzero/bidding.ts`, a literal port of
`bidding/bidder.py` and `api.py`'s BID / SKAT_OR_HAND_DECL / DISCARD_AND_DECL, with the eight
tables in `skatzero/bidding/`, hashed in the manifest). Because one computer's bidding simulates
all 231 possible skats, the leader prepares today's and tomorrow's tournaments ahead — one a day of
six deals, its row keyed by day and `size` (6; SKATGO-77's twelve-deal tournament is gone since
SKATGO-119, its stored rows kept), prepared one at a time and abandoned after an hour (`prepareDays` in
`src/daily.ts`) — and stores each computer's highest bid and pick-up/Hand tables with the deal; a `/daily`
request that names a `size` is refused; in
play only the discard and game after a pick-up are computed. The model outputs differ in the last
digits between ONNX Runtime builds (macOS vs Linux), which is why the result is stored rather than
recomputed elsewhere.

`src/skatzero/encode.ts` is a literal port of SkatZero's Python feature encoder. Changing the
models or the encoder means: regenerate parity against SkatZero's own driver (the Python
reference used in SKATGO-22/38/39), refresh `test/fixtures/skatzero-parity.json` and
`test/fixtures/skatzero-bidding.json`, update the manifest, and give the day's computer a new
name — never edit a recorded day.

## The ladder's record (SKATGO-109)

`POST /ladder/state`, `/ladder/answer` and `/ladder/merge`, behind the admission key like `/daily`, keep the
open-card endgames' record per account in `ladder_answers` (the steps are `OPEN_STORED`'s ids since SKATGO-110; the first table, `ladder_steps`, went with the earlier closed-card puzzles): for each step a player has answered, when it was
first answered right (`solved_at`) and how many answers were wrong (`misses`). The web's `/api/tricks/ladder/*`
(`app/src/lib/tricks-handler.ts`) is their one client and names only signed-in players (`user:<Clerk id>`).
`answer` takes `{ player, step, right }`; `merge` takes what a guest answered in the browser — the free steps
only (`LADDER_FREE` in `app/src/lib/skat/tricks/exercises/ladder.ts`) — as `{ player, steps: { <step>: { solved,
misses } } }` and keeps the larger count, so the same record sent twice changes nothing. Each answers
`{ steps }`, the account's whole record.

## The forum (SKATGO-118)

`POST /forum/<op>`, behind the admission key like `/daily`, hold the forum in `forum_posts`, `forum_comments` and
`forum_reports`. The web's `/api/forum/*` (`app/src/lib/forum-handler.ts`) is their one client: it names the viewer
— `player`, a signed-in account (`user:<Clerk id>`) or `null`, and `official`, whether that account is listed in the
web's `FORUM_OFFICIALS` — and the browser can name neither. The rules shared with the pages (sections, limits, what
may be indexed, the text's marks) are `app/src/lib/forum.ts`.

- Reads: `list` (`{ player, official, section?, page? }`: the posts, in whatever language they were written, newest activity first, the
  announcement of the last two weeks first), `post` (`{ player, official, id }`: a post and its comments, flat,
  oldest first), `latest` (`{}`: that announcement or `null`), `sitemap` (`{}`: every post search engines
  may read). Hidden posts and comments are returned only to their author and the official. Only names leave
  here — authors stand under their leaderboard name (`daily_players`, given by `nameOf` at their first write) —
  and whether something is the viewer's own travels as `mine`.
- Writes: `create`, `comment` and `delete` (an author's own, for good; a post takes its comments with it),
  `report` (once per reporter and thing). Announcements (`news`) are the official's only (403); each account may
  write `DAILY_LIMITS` a day (429 `limit_reached`); the official has no limit.
- The official: `reports` (open reports, grouped by what they report) and `moderate` (`hide` with a reason,
  `restore`, `dismiss` a report, `index` / `unindex` a player's post; the official's own posts are always
  indexable and feedback never, 409 `not_markable`).

Nothing here notifies anyone. Tests: `test/forum.test.ts`, against a database of its own.

## Deployment

API-managed, not Blueprint-managed. `render.json` records the approved resource
shape and fixed-cost quote; it does not hold credentials. PostgreSQL is internal-only,
uses direct connections, 1 GB storage and no storage autoscaling. Schema initialization
is idempotent and protected by a migration lock. The new service's runtime initializes
only its database; the website service and its domain are never modified.

First provisioning requires a same-day pricing check and human approval. On the
merged main commit, with `RENDER_API_KEY` supplied securely:

```sh
node multiplayer/scripts/render.mjs inspect
node multiplayer/scripts/render.mjs provision --approved
```

Later releases:

```sh
node multiplayer/scripts/render.mjs deploy
node multiplayer/scripts/render.mjs verify
```

Both readiness endpoints and the actual Render live commit must agree. Never use
the integration acceptance runner against the production database. Production
verification is read-only. Inspect logs through Render, but do not log action
payloads, state snapshots, invitation tokens or credentials.

Build the standalone container from the repository root:

```sh
docker build -f multiplayer/Dockerfile -t skatgo-multiplayer .
```

Rollback code only if it supports the persisted snapshot schema. Never reset
the database to recover a deployment.
