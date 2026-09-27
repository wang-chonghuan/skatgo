# SKATGO-20 Acceptance Plan

Authority: the live Plane ticket. This file records how to prove its four outcomes.
Status: AC1-AC3 and AC4 local checks passed on 2026-09-27. AC4's actual Render
release and unchanged-website observation remain the authorized post-merge cap4
step. The ticket must remain open until that step succeeds.

Use real Colyseus SDK clients over a running network service and real isolated local
PostgreSQL. The user explicitly authorized non-browser verification. Document the
final executable commands in Operations Tools after the Charter update is approved.
Raw output belongs in this ticket's ignored `tmp/`.

## AC1

- Start a built backend against a fresh local acceptance database.
- Drive separate SDK clients through create/join/start and a complete game for
  one human plus two server AIs, two humans plus one server AI, and three humans.
- Human test drivers choose actions using only their own received view and legal
  public rules, never a test-only full-state endpoint.
- Assert the seat assignment, AI progress, shared result and legal termination;
  reject excess clients and attempts to replace seats after start.
- A passed-in auction is tested separately, not counted as a completed played game.

## AC2

- Inspect every initial state, patch and application message received by each client.
  Compare against the authoritative local snapshot to prove hidden hands, unseen
  skat and other seats' credentials were not delivered. Apply explicit Ouvert rules.
- Send out-of-turn, forged-seat, malformed and illegal-card actions, duplicate
  identifiers, reused identifiers with changed payloads and stale revisions.
- Assert rejection or an identical prior receipt as appropriate, unchanged durable
  state for rejected requests, and exactly one advancement for retries.
- Check unauthorized admission, forged recovery credentials and duplicate active
  sessions; no logs or health responses may expose cards or secrets.

## AC3

- Interrupt a client's socket and reconnect; assert the same seat and visible hand.
- Hold a client offline beyond the default 30-second grace, prove AI advances its
  turn, then reconnect and prove that same seat is human-controlled again. Cover
  reconnection before the deadline and after it, including a pending AI timer.
- Record a confirmed action and durable revision, terminate the actual backend
  process forcibly, then restart the production build using the same database.
- Resume with persisted room/seat credentials and finish the same game. Assert
  unchanged dealt cards, retained accepted moves and no duplicated AI action.
- Retry an action whose acknowledgment was interrupted; it must not apply twice.
- Exercise a database failure and stale process ownership: no successful receipt
  may be returned for a write that did not commit.

## AC4

- Run backend install/typecheck/build and the repeatable acceptance command; run
  the existing application's required mechanical defence unchanged.
- Build and start the backend container and confirm health/readiness and version.
  Database migrations must succeed on a fresh database and be safe to run again.
- After the approved verification and merge: provision the agreed Render
  resources, initialize only the new schema, deploy the exact merged commit and
  confirm service/DB readiness and the live version with read-only observations.
- Verify the existing web service remains on its previous intended deployment,
  with its domains and application configuration unchanged. Do not run mutable
  multiplayer acceptance against external or production data.
- Cloud completion remains pending until a real deployment is authorized and
  observed; a Dockerfile or valid infrastructure configuration alone is not it.
