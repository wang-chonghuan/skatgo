# Multiplayer Backend

Independent Colyseus 0.18 TypeScript service. The course frontend is unchanged.
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
| `AI_DELAY_MS` | Default 350; minimum 10; short delays are useful for headless verification |
| `APP_VERSION` | Local diagnostic override; Render uses `RENDER_GIT_COMMIT` |
| `TEST_PORT` | Acceptance server port; next port is used to test a standby process |
| `DATABASE_PORT` | Local database provisioning port |
| `DOCKER_CONTEXT` | Optional existing local Docker context, preserved in local `.env` |

No Clerk, LLM or Azure configuration is needed by this service.

## Protocol

This release is for trusted integration clients, not public frontend admission.
Never embed the shared admission key in a browser bundle. A later frontend ticket
must replace that integration boundary with server-issued short-lived admission.

Using `@colyseus/sdk`, create three independent 32-byte random hex values: admission
key (server configuration), invite token (shared with invited participants) and
seat token (private to each participant). Keep the seat token across client restarts.

```ts
const room = await client.create('skat', {
  admissionKey, humanSeats: 3, inviteToken, seatToken,
})
const invited = await anotherClient.joinById(room.roomId, {
  admissionKey, inviteToken, seatToken: anotherPrivateSeatToken,
})
const recovered = await client.joinById(savedRoomId, { admissionKey, seatToken })
```

`humanSeats` is 1, 2 or 3 and fixed at creation. The creator is seat 0 and starts
after the selected human seats are connected; remaining seats are AI. New people
cannot replace human or AI seats after start. There is no public room listing.
The room ID is not an invitation or a recovery credential.

`state.publicData` is JSON with the phase, actor, public bids, declared contract,
played tricks, result, revision, expiry and seat connectivity/control. Each
`state.players.get(String(seat)).privateData` is a Colyseus StateView-filtered JSON
field containing that seat's hand and known buried cards. Other players' private
fields are absent. Ouvert's explicitly open declarer hand is public; no other
original hands or unseen skat are published, even in a result.

Send `command` with `{ id, revision, action }`. IDs are 1-80 alphanumeric, underscore
or hyphen characters and unique per seat. Use the latest public revision.

| Action | Body |
|---|---|
| Start | `{ type: 'start' }` |
| Bid | `{ type: 'bid', value: 'bid' \| 'hold' \| 'pass' }` |
| Pick up skat | `{ type: 'pickup' }` |
| Play Hand | `{ type: 'hand' }` |
| Discard | `{ type: 'discard', cards: [card, card] }` |
| Declare | `{ type: 'declare', declaration }` using the engine's declaration shape |
| Play | `{ type: 'play', card }` |

The server sends `receipt`: `{ id, ok: true, revision }` only after persistence, or
`{ id, ok: false, error }`. Retry an uncertain request with the same ID/action;
the prior receipt is returned without another transition. Reusing its ID for a
different action is rejected. A stale revision is rejected, not silently replayed
against a different turn. Ignore neither rejections nor the current public actor.
Trick collection and AI turns are server-owned.

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

## SkatZero card play (daily tournament)

From SKATGO-38 the daily tournament's computers play their cards with SkatZero
(github.com/Jimboom7/SkatZero `1fe5cab`, MIT): the nine ONNX models are committed in
`skatzero/models/`, named with size and SHA-256 in `skatzero/manifest.json`, and loaded once
at start (`src/skatzero/policy.ts`). Readiness waits for them; a missing or altered file stops
the service. Bidding and the skat step are still the heuristics; `daily_deals.computer` names
which computer a day was dealt with, and recorded days keep every move of every deal.

`src/skatzero/encode.ts` is a literal port of SkatZero's Python feature encoder. Changing the
models or the encoder means: regenerate parity against SkatZero's own driver (the Python
reference used in SKATGO-22/38), refresh `test/fixtures/skatzero-parity.json`, update the
manifest, and give the day's computer a new name — never edit a recorded day.

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
