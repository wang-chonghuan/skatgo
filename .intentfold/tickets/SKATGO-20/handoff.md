# SKATGO-20 Handoff

2026-09-27. Autonomous development; effective finish is `auto-deploy` for this
ticket only, authorized in the live ticket and `grill.md`.

## Primary Deliverable: Multiplayer Backend Guide

Documentation addendum, 2026-09-27, explicitly requested by the human after first
delivery. The original implementation and acceptance record below is unchanged.

The [multiplayer backend guide](../../../multiplayer/README.md) is a primary output
of this enabler and the starting point for subsequent client/frontend integration.
It documents local startup and environment variables, SDK room creation/joining/
recovery, public and per-seat private state, commands and receipts, disconnect/AI
takeover, persistence, verification, and Render deployment/rollback.

Engineering Charter's [Tools section](../../charter/engineering.md#tools) links
to this guide as the project's multiplayer development entry. Maintain current
usage there; this handoff records what was delivered.

## What Changed

- Added the standalone TypeScript `multiplayer/` Colyseus service, importing the
  existing pure Skat rules and AI without changing `app/`.
- Added private invite rooms with 1-3 humans, AI-filled remaining seats, validated
  commands, per-seat StateViews and separate invite/recovery credentials.
- Added PostgreSQL snapshots and idempotent receipts committed before acknowledgment,
  process ownership fencing, restoration, 30-second temporary AI takeover and
  human seat recovery. Rooms expire after 24 hours of inactivity.
- Added the non-root backend image, local database and SDK acceptance tools,
  scoped Render provisioning/release tools, and protocol/operations documentation.
- Applied only the approved Engineering/Operations Charter and port additions.

## Acceptance Evidence

Verified implementation commit: `db79442`.

| Criterion | Observation |
|---|---|
| AC1 | Passed: actual network SDK clients completed legal games with 1, 2 and 3 humans, matching results, server AI progress and excess-client rejection. The passed-in auction is a separate case. |
| AC2 | Passed: own-seat private state only, explicit Ouvert visibility, unauthorized admission, invalid/forged/out-of-turn commands, illegal cards, duplicate receipt and changed-payload ID rejection. Checks compare received states and messages with real local database snapshots. |
| AC3 | Passed: actual 30-second grace, short reconnect, AI advancement after the deadline, late human recovery, SIGKILL/restart with durable seats and moves, retry idempotency, inactive standby, stale-generation rejection and an injected PostgreSQL write failure without acknowledgment. |
| AC4 local | Passed: backend typecheck/build and 12 tests in 42 seconds; image build; actual container connected to PostgreSQL, correct version and non-root `node` user. Fresh and repeated schema initialization are exercised by server restarts. Existing application mechanical defence passed: typecheck, build, 67 tests, client bundle check, literal count 1 and SSR import. No app files changed since that check. |
| AC4 cloud | Pending the authorized post-merge release, not claimed passed. cap4 must create the two approved Render resources, observe the exact merged commit live and ready, and confirm the existing website's deploy/config/domains are unchanged before closing. Production verification is read-only. |

Commands actually used:

```sh
TEST_PORT=56020 npm --prefix multiplayer run check
docker --context colima-skatgo build -f multiplayer/Dockerfile -t skatgo-multiplayer:SKATGO-20 .
TEST_PORT=56023 node multiplayer/scripts/container-smoke.mjs
```

The unchanged application's full mechanical-defence command was run from
Engineering Tools. No browser or external acceptance data was used.
Backend output is in this ticket's ignored `tmp/backend-check.log`.

## Deviations

- The user extended the original 2-3-human proposal to 1-3 humans and requested
  temporary AI after disconnect. Thirty seconds follows the official Colyseus
  example, not a claim that every game uses the same industry standard.
- The existing shared Colima disk was full. An isolated `colima-skatgo` context
  was used without deleting data or stopping unrelated containers.
- Verification exposed a rejected-join `onDrop` path that could attempt invalid
  SDK reconnection. The joined-seat guard and retryable disconnect persistence
  were fixed before this handoff; final acceptance is green.

## Environment

- Actual test service ports: 56020 and standby 56021. Container smoke: 56023.
  These processes/containers stop at the end of their checks.
- Local PostgreSQL: 57020, container `skatgo-multiplayer-db-57020` in
  `colima-skatgo`; still running for cap4 cleanup. No frontend server started.
- New ignored `multiplayer/.env` keys: `DATABASE_URL`,
  `MULTIPLAYER_ADMISSION_KEY`, `DOCKER_CONTEXT`. No values are committed.
  `app/.env` was copied unchanged; none of its keys are ticket-owned.
- Main runtime ports: backend 3221 and database 3222. At close, synchronize the
  new env keys with a backup and translate the local database port to 3222;
  do not leave main dependent on the ticket's 57020 container.
- Render adds only `DATABASE_URL` and `MULTIPLAYER_ADMISSION_KEY` to the new
  backend. Render provides `PORT` and `RENDER_GIT_COMMIT`. No Azure/LLM keys.

## Residual

- Frontend room UX and server-issued short-lived public admission are future work.
  Never ship the integration admission key to a browser.
- This is a single-active-process backend. Horizontal matchmaking/routing and
  capacity/load qualification are not included.
- Initial approved fixed resource quote is $13.30/month, below the $25/month
  authorization; variable bandwidth, taxes and account charges are excluded.
  Provisioning requires a same-day price check and the exact merged main head.
- No Azure, DNS, existing website service, Clerk, or assistant changes.
