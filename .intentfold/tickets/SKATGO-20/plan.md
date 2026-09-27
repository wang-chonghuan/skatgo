# SKATGO-20 Plan

Status: approved on 2026-09-27 with the changes recorded in `grill.md`.

## Findings

- `app/src/lib/skat/game.ts` is a pure immutable state machine. Its imports are the
  pure cards, AI and value modules. `deal` accepts an explicit deck, so multiplayer
  can supply a server-secure shuffle without changing course randomness.
- `Game` includes every hand, the skat and original cards. It is a private server
  snapshot, not a network state type. `bidAction` and several other transitions
  do not accept the caller's seat; the network boundary must validate identity,
  actor, phase and action shape before invoking them.
- `game-table.tsx` owns local browser state, seat 0 and AI timers. It stays untouched.
  No root workspace conversion or copy of the rules engine is needed.
- Engineering Contract currently says there is no database and only one endpoint;
  its randomness guidance assumes browser rendering. Operations Contract permits
  only one service and assumes stateless rollback. These need scoped human-approved
  updates before the proposed backend can be implemented.
- Render read access works. The existing `skatgo` service is Starter, one instance,
  Frankfurt, in environment `evm-dasmjfrbc2fs73fu7t30`. No cloud mutation has occurred.
- Docker CLI exists, but its daemon is not running. Local libpq includes clients,
  `initdb` and `pg_ctl`, but no `postgres` executable at the reported bindir.
  Establish a real isolated local PostgreSQL runtime before acceptance; do not
  substitute an in-memory store for persistence validation.
- Current Colyseus documentation was resolved via Context7 (`/colyseus/docs`).
  Lifecycle hooks include `onDrop`, `allowReconnection` and `onReconnect`.
  Framework reconnection and durable application recovery are separate concerns.

## Implementation Sequence

1. Record the human's decisions in `grill.md` and Plane. Make only the approved
   Engineering/Operations Charter edits. Add explicit `multiplayer` and local
   database ports to `project.json`, validate, then resolve ticket ports.
2. Add a standalone `multiplayer/` TypeScript npm package and lockfile, with a
   Node-compatible production build importing the existing pure engine. Add a
   separate Dockerfile with repository-root build context. Leave `app/`, its
   dependencies and the current root Dockerfile alone.
3. Define the admission/session protocol and runtime-validated actions. Implement
   a three-seat Colyseus room, host-controlled start with 1-3 humans and AI filling
   the other seats, 30-second disconnect grace then temporary AI control,
   bounded inputs and admission limits. Publish only a purpose-built public state
   plus per-client private views; never serialize the full engine snapshot.
4. Add PostgreSQL migrations and a durable repository for versioned room snapshots,
   hashed seat credentials and idempotent action receipts. Serialize each room's
   transitions and atomically persist state plus receipt before acknowledgment.
   One PostgreSQL advisory-lock leader owns all rooms; a generation fence prevents
   the old process writing after a failover. Liveness and gameplay readiness are
   separate during Render's old/new deployment overlap.
   Include revision/ownership fencing for old/new process overlap during deploys.
   Storage failure must reject advancement, not acknowledge unpersisted state.
5. Wire reconnect and cold recovery separately. Restore the same logical room,
   seats, snapshot and action receipts without dealing again; rebuild private views
   from trusted seat identity and stop temporary AI control on recovery. Re-arm timers from persisted state without repeating
   a committed transition. Apply the agreed expiry policy and reject invalid tokens.
6. Build a real SDK acceptance runner using a separate local database. Drive both
   seat arrangements, malicious commands, reconnect and process-kill recovery.
   Independently inspect received state and durable revisions. No browser needed.
7. Add reproducible local startup, health/readiness, migration, release and recovery
   commands. Deployment configuration must name the actual management mode; do not
   claim an API-created service is Blueprint-managed.
8. Run the existing Charter mechanical defence and the new backend checks. Execute
   cap3handoff, then cap4 and the authorized first deployment. Only this enabler
   is authorized; do not pick up unrelated tickets afterward.

## Approval Boundary

The approved batch is in `grill.md`. Engineering Redline 3 and Operations Redlines
3-5 are cleared for the listed dependencies, new resources, initial schema and deploy.
Production acceptance remains read-only under Operations Redline 2: mutable game
checks use isolated local data. No DNS, Azure, existing production data or frontend
change is needed. `product.md` and `ui.md` remain unchanged.
