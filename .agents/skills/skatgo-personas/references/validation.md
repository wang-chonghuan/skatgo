# Validation and Operation

Validate the changed scope, not every target capability of this skill.
For a skill-only update, check frontmatter, local reference links and realistic
task routing. Do not report session, room or scale behavior as passed from prose.

## Current Offline Commands

Commands run at repo root. The CLI defaults to the current Berlin day; use an
explicit day for reproducible planning:

```sh
START_DAY="$(TZ=Europe/Berlin date +%F)"
node --import ./multiplayer/node_modules/tsx/dist/loader.mjs multiplayer/scripts/personas.ts validate
node --import ./multiplayer/node_modules/tsx/dist/loader.mjs multiplayer/scripts/personas.ts plan --day "$START_DAY" --days 30
node --import ./multiplayer/node_modules/tsx/dist/loader.mjs multiplayer/scripts/personas.ts calibrate --deals 30
```

Validation must derive all personas from the roster and reject empty input,
duplicate identities/names, invalid probabilities/time zones, impossible
windows, out-of-range volume and unknown fields. Commands are offline and never
write a DB. Calibration uses committed verified models and pool, then releases
sessions even after failure.

Inspect per-person declarations, deviations, win rate, score spread and XP,
alongside a zero-deviation baseline on the same deals. Report sample size and
model runtime. No guarantee of deterministic floats across different ONNX
platforms: saved logs are the authority; same-runtime seeded reruns should match.

## Session and Behavior Evidence

When these dimensions are implemented, derive all profiles from the maintained
roster and use multiple reproducible seeds. Start with a small population and
expand only after its full lifecycle works. A larger calibration or 30/90-day
simulation is useful when observed variation or attendance needs more evidence;
the live ticket owns the required sample, not this example.

Observe and assert, for the changed behavior:

- Non-overlapping activity/session/room reservations, IANA windows, overnight
  sessions, DST, skipped days, quiet periods and bounded activity duration.
- Phase-specific action-time distributions, quantiles and table-wide wait.
  Obvious/familiar decisions are generally faster, not necessarily every sample.
- Conditional pace/error patterns and adjacent-action correlation; a shared
  distraction affects several decisions and recovers as the configured state
  model says. Do not pass identical independent delays as varied personalities.
- Most sessions without interruption, bounded rare events, short reconnect,
  departure, reservation loss and no cross-mode activity while disconnected.
- Distinct declarer/defender/contract/error-family behavior where supported,
  plausible alternatives, legal replay and overlapping score distributions.
- Recovered sampled actions/deadlines and unchanged completed history after
  retries, config changes, restart or leadership handover.
- Board completion eligible only after the session activity completes, with
  actual audit times separate from simulated duration and no duplicate XP.

Review representative traces as whole sessions, not isolated screenshots.
Blinded human play review can assess naturalness; it is not a guarantee that
no player or detector can identify an actor. Report unmeasured dimensions.

## Persistence, Rooms and Capacity

For storage/board evidence, run `npm --prefix multiplayer run check` with its
isolated local DB. Add focused tests for duplicate/concurrent/restarted execution,
disabled and failed jobs, true-user isolation, legal replay and both board sizes.
Do not weaken existing board or AI parity assertions.

When room integration changes, use the approved local headless SDK surface.
Exercise a real participant with persona computer seats, a friend's takeover,
host controls, required human readiness, short/long loss, reconnect, actor
disable/failure, restart and last-human closure. Assert authorization, private
view isolation, lease exclusivity, score attribution and rejection of late moves.
Do not award room XP or introduce public matchmaking in the acceptance fixture.

For a larger population, report configured/eligible/active/seated/in-flight
counts separately. Measure inference/queue/action latency (including tails),
memory, DB connections and lock waits with concurrent live and background work.
Show that background work cannot starve real-player actions and that overload
or restart does not release a burst of stale moves. A large roster alone is
not a load test; no simultaneous-table guarantee without a measured workload.

## Operation

Run `npm --prefix multiplayer run build`, then use its bundled `personas` command:
`status`, `configure --enabled 1 --count 17`, `configure --count 100` and
`configure --enabled 0`. Inspect `multiplayer/README.md` for exact configuration,
production-operation flags and bootstrap-versus-persisted precedence.
Verify every requested growth size and the original prefix, disabled/shrunk
in-flight commits, future-only new scheduling and saved-history restart.
Environment enable/count values bootstrap an absent control row only; they
do not undo a persisted operator decision.
The controller polls while disabled and reports heartbeat, tick duration/error
and queue counts. Stop/release before changing bundled traits.
Do not infer room drain behavior from this batch toggle. No separate cloud job,
social automation or gameplay LLM service is required.
