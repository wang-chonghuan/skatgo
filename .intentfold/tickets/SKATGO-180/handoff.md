# SKATGO-180 Handoff

This work came through an open development phase. This file records the delivered
and verified result, not which tool or skill produced each edit.

## What Changed

- Added the project-local `skatgo-personas` skill and its design, session,
  existing-room, runtime and verification references. The skill was authored and
  read before the corresponding configuration and implementation changes.
- Added 17 approved fictional nicknames and independently varied play/activity
  profiles, with stable prefix expansion through 100/200/300/400/500 identities.
- Added a bounded serial controller inside the existing multiplayer leader.
  Persisted enabled/population controls default to disabled/17, survive restart,
  and fence in-flight results after disabling, shrinking or leadership loss.
- Added separate simulation identity, activity and control tables. Legal completed
  daily activities join the one/six boards; completed deals earn the existing XP.
  Human accounts, private profiles, aliases, forum and analytics remain separate.
- Added a bundled operator CLI and documented its actual runtime contract in
  `multiplayer/README.md`. No new dependency or cloud resource was introduced.
- Updated EN/DE Terms to neutral scoring language without participant-composition
  claims. Terms date is 2026-11-09; Privacy remains unchanged at 2026-10-29.
  Product/Engineering Charter changes reflect the human's explicit approval.
- Separated roster audit version from RNG format version. The approved nickname
  revision preserves IDs, profiles, attendance, activity times and game streams;
  automatic registration still refuses renaming an existing identity.

## AC Results

Authoritative criteria were read from live Plane SKATGO-180 on 2026-11-09.
Existing unaffected evidence was reused, with the committed delivery's mechanical
defence completed successfully in this handoff invocation.

| AC | Observed Evidence |
| --- | --- |
| 1 | Project skill quick validator passed. Configuration/planning/calibration commands produced nonempty outputs. The skill-first sequence is recorded in Plane development comments. |
| 2 | Real ONNX calibration: 17 personas on the same 30 deals, 510 simulated games plus 30 standard baseline games (`tmp/service-calibration.json`). Deviations ranged 1-91; mean Seeger-Fabian ranged 11.2-36.37; declared games ranged 6-9. Current roster `/3` smoke completed 34 persona games plus 2 baseline games (`tmp/nickname-calibration.json`). These are samples, not calibrated difficulty guarantees. |
| 3 | Deterministic 30-day plans reproduced exactly with varied attendance, timing and volume. The 500-person sample contained 30,577 activities/61,317 planned deals; all 500 had participating days. Current tests passed Berlin boundaries, overnight windows, both DST transitions and nickname/version-independent streams. |
| 4 | Isolated PostgreSQL and actual daily/XP HTTP routes matched completed legal games and shared XP tiers. Replay, repeated/concurrent ticks and runner recreation passed without duplicate results. Prior web XP proxy verification returned 200 and matched backend data. |
| 5 | Disabled, failed-inference and leadership-loss paths did not publish fake results. Real-player nickname/profile isolation and existing action-route rejection of simulated IDs passed. Audit records remain separately queryable. |
| 6 | EN/DE structured Terms checks passed. Prior headed production-build verification covered Terms/Privacy at desktop 1280x820 and phone 375x812: eight page scenarios, correct content/dates, 200 responses and no Terms horizontal overflow. English screenshots received one fresh-context request-based look with no actionable mismatch. Charter approval/isolation/no-arena boundaries are retained. |
| 7 | Persistent controller tests passed first-start disabled/17, manual population changes through every requested size and back, preservation of old jobs/results, restart, in-flight disable and shrink fences. Current real local sample completed 32 activities/72 deals in 68,448 ms with one background activity; sample process RSS was 384,368,640 bytes. |
| 8 | All 500 nicknames passed product validation and case-insensitive uniqueness; all 500 play/activity profiles were distinct and expansion prefixes stable. Name reservations rejected human collisions and automatic renames. Status/heartbeat/error/queue assertions passed. Approved Unicode spelling was preserved; no result was fabricated to force a name onto a board. |

The committed implementation `2a35534` passed:

- Engineering frontend defence: typecheck/build, 344/344 tests, 126 client chunks
  checked, token/literal checks, SSR import, built SEO contract and 28/28 SEO
  negative tests. Local SEO derived 52 indexable pages, 28 noindex pages,
  52 assets and 4 linked files. Forum was not answering in that owned SEO preview;
  forum and board backend behavior were covered by the isolated backend checks.
- `TEST_PORT=56180 npm --prefix multiplayer run check`: typecheck/build and
  59/59 tests, zero failures or skips, duration 135,269 ms.
- Project skill quick validator and `git diff --check`.

Evidence remains in this ticket's ignored `tmp/` and the live Plane comments.
Cap4 will preserve useful scratch under the main checkout's
`.intentfold/tmp/SKATGO-180/` before removing the development worktree.

## Deviations

There is no autonomous plan or agreed local draft for this open-development phase.
The live ticket explicitly limits this delivery to embedded batch board simulation.
Persistent online actors, room participation, per-card waits and network
interruptions are guidance for future adapters, not implemented capabilities.

The final nickname revision required separating audit metadata from random-stream
format. A targeted local migration preserved all original saved job/result
snapshots; four accidental, unexecuted plans were backed up and precisely
withdrawn. No human or production data was changed.

## Environment

- Actual review ports: web 55180, multiplayer 56180, PostgreSQL 57180.
- Main checkout: `/Users/yong/work/skatgo-ws/skatgo`.
  Ticket checkout: `/Users/yong/work/skatgo-ws/skatgo--SKATGO-180`.
  Branch: `codex/SKATGO-180-personas`.
- Env-file keys to sync back to main: none. `DATABASE_URL` and
  `MULTIPLAYER_URL` only differ for ticket-local isolation ports; those values
  must not replace main's local connections. No credentials are recorded here.
- New optional bootstrap configuration is `SKATGO_PERSONAS_ENABLED` and
  `SKATGO_PERSONAS_COUNT`; neither was added to production or requires env sync.
  Persisted runtime control takes precedence after initialization.
- Preview processes were stopped by their actual ports for handoff checks.
  Check-owned processes cleaned themselves up; both review listeners are free.
  The named ticket database remains until cap4 cleanup. Its local review snapshot
  was saved in ignored `tmp/local-review-db.sql`.
- Production was inspected read-only: both services use manual deploys, and
  multiplayer has no persona bootstrap variables. No production deployment or
  activation has occurred at this handoff boundary.

## Residual

- Production activation remains a separate explicit decision. Do not migrate local
  simulation history, backfill old boards or enable it merely because code ships.
- Production latency/memory/queue measurements and a 24-hour soak are not done.
  Stable 500-person configuration/planning is not 500-person execution or room
  concurrency proof. The finite free-play pool can be exhausted.
- Room actors, session state, per-card thinking and simulated interruptions are
  future ticket scope. Standard AI, Lina and Noah remain unchanged.

## Check

No unresolved human-judgment issue. The human approved the 17-name revision and
subsequently requested cap4 closure and redeployment. The English Terms screenshots
had no request-supported mismatch in the single fresh-context look.

## Decided For You

- Reused the existing leader, shared models and PostgreSQL rather than introducing
  an independently deployed worker.
- Kept inference serial and catch-up bounded; activity duration is distinct from
  computation time, and newly enabled identities get future activity only.
- Preserved the established `/2` RNG stream while roster audit metadata became
  `/3`, so changing names does not redraw schedules or games.
- Retained the `review` finish record; the user's later explicit instruction is
  the authority to land, close and then perform the separate redeployment.
