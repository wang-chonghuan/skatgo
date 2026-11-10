# Runtime Integration

## Service Ownership and Capacity

Keep three responsibilities separate: a persona controller owns population,
sessions, leases and due intents; the existing game/room backend owns rules,
seats and scoring; bounded inference executors provide candidate evaluations.
A controller is an independently owned service responsibility, not one
process/browser/model per persona. Initially it may share the existing
deployment; a separate worker/service needs its own authorized implementation
and operational configuration. Do not add cloud resources, Redis or a lobby
merely because the population grows.

Distinguish roster size, available personas, active solo sessions, room seats
and in-flight inference. Read current schema/runner/room limits from code.
Increasing a roster cap is not evidence of hundreds-scale live capacity.
Keep inactive characters as data and due events, not polling clients.
Share resident model sessions per executor; actor wrappers do not own them.

Give real-player room decisions priority over background board work, with
bounded queues, in-flight jobs and catch-up. Do not create another serving
room leader to increase throughput: current epoch fencing remains authoritative.
Measure inference and queue latency, pending native work, memory, connection
pool use and transaction-lock waits before choosing worker counts or limits.
A rejected timeout does not necessarily cancel underlying native inference;
account for work still running when enforcing concurrency.

For new live adapters, do not hold a write transaction or connection while
thinking, sleeping or running ONNX. Read the decision input, compute outside
the transaction, then validate played state, actor lease and epoch in a short
commit. Current room code must be inspected for this boundary; do not claim
it already separates inference from its snapshot transaction.

## Card and Bidding Contracts

`Policy.ranked` gives legal cards with one-step-lookahead values **in hand order**,
not sorted order. Sort a copy by value, retaining the first best for deterministic
ties. Only a value strictly below the best is an actual mistake. Evaluate once
per decision, then sample the selected card; do not evaluate ranked and choose
again. Values are model units, not card points, and suit/Grand/Null scales differ:
rank-depth sampling avoids pretending one absolute loss means the same in all.
Contextual style reranking uses visible features and bounded persona state;
see [design.md](design.md). Never interpret the raw values as win probabilities.

The card wrapper changes only `choose`; preserve the base policy's truthful
`ranked`, `values`, `score`, tables and resource ownership. Persona-specific
bidding/skat adapters call those public evaluators without modifying them.
Use `viewOf`, never hidden opponent hands.
The wrapper must not release shared model sessions.

`seatBidding` returns `detail.pickupPen` and `detail.handMax`. Apply `maxBid` with
the persona threshold to each and take the maximum, retaining its pickup/Hand
tables. This permits distinct aggression without changing SkatZero defaults.
Changing a default threshold does not change committed pool/daily plans.

Play through `advance` and `computerTurn`, validate every move via the engine,
and summarize only a finished game. Keep the existing early-end rules.
Discard/declaration preferences require a persona-only adapter; preserve
the canonical policy and do not claim the existing `choose` wrapper does this.
Freeze the adapter version in activity snapshots and retain the old executable
route. See [calibration.md](calibration.md) for activation and experiment rules.

## Activity and Persistence

Use the lifecycle and exclusive timeline in [sessions.md](sessions.md).
For a batch-only ticket, preserve the current execution contract; adding
presence/timing/room behavior requires the corresponding implementation scope.
Plan within the actual Berlin tournament day, including 23/25-hour DST days.
Match IANA-local clock windows (including overnight windows) against real UTC
instants; never assume a fixed UTC offset. Use per-person daily decisions and
multi-day quiet-period state derived from stable seeds. Bound sessions and CPU.

The board runner executes a bounded batch serially in the current leader.
An always-running controller polls persisted enable/count settings, with one
resident shared policy and no per-person polling client. Limit each tick by
activity count and elapsed budget between activities, not a timer race that
leaves native inference running after an apparent timeout.
Commit only after locking and checking the current control revision, so a
completed disable/shrink command cannot be followed by an old in-flight result.
Filter queued work by the current population; retain inactive historical rows.
Publish heartbeat and queue/error state for internal operations.
Do not present board batching as a scalable live-actor design. Persist a
per-person, day and activity-slot job snapshot before evaluating it. Hold a session lock for
the runner; do not hold a database write transaction across ONNX computation.
Commit under the store's epoch fence only while still enabled and ready.
Save completed results atomically. Crash recovery reuses saved jobs; a config
version change must not create a second entry or grant the same day's XP again.
Do not replay an unbounded historical backlog after downtime.
Persist planned start and eligible completion separately; do not recompute a
saved day when count changes. New identities activated midday receive only
future activities, not a burst of backfilled leaderboard finishes.

Persistent-session implementations also save actor/session ownership,
transition reasons, sampled state, pending actions and eligible completion
times. Build a decision key from stable activity/deal/seat/turn identity, not
mutable presence revisions or config version alone. Freeze the config and
sample for an in-flight decision; a restart or retry cannot give another choice.
Invalidate it if the actual game input or seat ownership changed.

Store simulated results separately, including full moves, seed, policy/model
version, config snapshot, planned time and actual completion time. Daily totals
appear only after every deal of that competition completes. Combine board rows
at the existing read boundary without changing tie/rank rules, identity
validation or real-player profile queries.

Free-play simulations use verified pool deals and standard same-deal benchmarks.
Avoid repeatedly counting the same pool deal for a persona. Never call user
action endpoints to fabricate an account or send human-analytics events.
