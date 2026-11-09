# Acceptance Checks

Read the live Plane ticket for authoritative criteria.

## AC 1
Validate the project skill with the host quick validator, then execute its
configuration, planning and calibration commands. Each command must succeed
with nonempty derived output. Record the skill-first development sequence.

## AC 2
Run real ONNX/engine calibration on the same pool sample for all configured
personas, including a deterministic standard baseline. Replay logs; compare
bidding, card deviations, score distributions and XP. Do not require every
deal or every finite sample to rank every persona in strength order.

## AC 3
Generate at least 30 days of plans twice. Compare exact results; observe
distinct completion times, skipped days and free-play counts. Check Berlin
day boundaries, overnight windows and both DST transitions.

## AC 4
Use isolated loopback PostgreSQL and the actual backend board endpoints.
Complete daily simulations for sizes 1 and 6 and free play; confirm board
totals and XP from persisted summaries. Repeat and invoke concurrent ticks;
recreate the runner to prove no duplicate results.

## AC 5
Check disabled ticks, failed decisions and loss of leadership never publish
results. Verify a real player's board row, nickname and private profile are
unchanged; simulated IDs cannot enter player action routes. Query simulation
audit records separately. Run existing project mechanical checks afterward.

## AC 6
Check English and German Terms from their structured copy and rendered pages:
neither discusses Synthetic players or human-only participation. Scores and
rankings use neutral wording about recorded completed games and scoring rules.
Terms show the new version date without changing the Privacy Policy's date.
Confirm Product and Engineering Charter explicitly permit Synthetic players
to support online participation and improve existing game experiences, while
retaining separate internal identities and excluding arenas/public matching.

## AC 7
Run the always-on controller against isolated PostgreSQL. Explicitly enable 17
players and exercise every starter through real legal board play. Change the
persisted count through 100/200/300/400/500 and back; compare prior profiles,
job snapshots and completed history. Disable/shrink during an in-flight job,
restart the service and check that no forbidden or duplicate result commits.
Verify first-start defaults and runtime application without redeployment.

## AC 8
Derive nickname validity, uniqueness and profile diversity from the entire
500-person population. Check reservation against occupied human names.
Read internal heartbeat, effective population and queue/error status. Measure
real inference throughput and schedule counts; report population capacity
separately from unmeasured concurrent room capacity.
