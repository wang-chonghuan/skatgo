# Sessions and Table Rhythm

Read for attendance, thinking time, interruptions or cross-surface consistency.
These are target runtime contracts; inspect current code before claiming support.

## One Activity Timeline

Use a persisted duration-aware lifecycle:

```text
offline -> available -> active -> between-deals -> available/leaving -> offline
```

`active` names exactly one existing activity: daily-one, daily-six, free play or
a private-room computer seat. `available` is internal eligibility, not a public
lobby. Interruption/reconnection is a substate of the owned activity.

Acquire an exclusive persona activity lease before entering an activity.
Retain or transfer it explicitly through reconnection, a between-deal break
and release; two runners cannot put the same identity into two activities.
An interrupted seat reservation must not simultaneously permit solo play.
Release ownership when the room's actual replacement/closure rules require it.

Generate session starts from local windows and attendance history. Sample
duration, mode choice and breaks conditionally, including quiet periods of
several days. Avoid independent hourly online/offline coins, identical daily
start times and clocks tied to fixed UTC offsets.
Finish a started deal before a normal departure; sudden interruption is a
separate event. Reaching an attendance-window boundary does not imply abandoning
a live deal. Respect hard room expiry and tournament-day limits.

## State That Creates Correlation

Keep a bounded session state for attention, fatigue, urgency and temporary
network quality. Specify how events change it and how it recovers.
A distraction may slow several actions and increase error probability until
attention recovers. Do not regenerate all traits after a win, loss or reconnect.
Use separate random streams for attendance, state transitions, timing, errors
and network events; those streams consume shared explicit state, not mutually
independent behavior. Snapshot state and samples so recovery is reproducible.

## Thinking and Between-Deal Time

Use phase-specific positive, skewed distributions with a bounded long-pause
component; a clipped log-normal or mixture is a starting hypothesis, not
measured Skat timing. Distinguish bidding, pickup, discard, declaration, card
play, result reading and next-deal readiness.

Condition timing on the persona, current state and visible context:

- One legal card is usually quicker, but not a zero-time mechanical response.
- Several plausible choices or an unfamiliar contract may cause hesitation.
- Candidate ranks/gaps are signals, not the full definition of difficulty.
  Model values are not calibrated probabilities and scales differ by contract.
- Familiar decisions can be quick for strong or weak styles alike. Weakness
  does not universally imply longer thought.
- Adjacent actions share pace state; do not use independent uniform delays.
- Result-reading and readiness vary too; do not make every persona instantly
  ready or let multiple personas' waits make the table unreasonably slow.

Sample a target deadline once when a decision becomes eligible. Compute the
move without occupying a sleeping inference worker or holding a DB transaction.
Act when both the target deadline and computation permit, within the table's
time budget. If inference used the intended wait, do not add that wait again.
Model-computation timeout and intentional thinking delay are separate budgets;
a compute failure remains a real failure, not a simulated distraction.

Persist the decision identity, sampled delay, deadline and chosen action.
Presence-only revisions and retries must not reroll the same game decision.
Cancel stale actions when play, ownership or leadership changes.

## Interruptions and Reconnection

Sample rare interruption events by elapsed online time and current environment,
not once per card/deal. Most sessions should have none; measure rather than
invent precise rates. Temporary network trouble may cluster briefly.

Distinguish distraction (connected but late), short connection loss, an actual
reconnect, voluntary departure and a session-ending loss. Reconnection returns
to the same owned activity if its reservation still exists; it cannot reclaim
a seat already assigned to a real player.
Use the room's approved grace, takeover and replacement rules. Do not stage
frequent full-grace waits or repeated outages for realism.
Label simulated behavioral events separately from real transport, inference,
DB and service failures in internal audit/metrics.

## Compute Time Versus Character Time

A batch simulation may calculate faster than a character's activity duration.
Reserve its start, progress/break budget and eligible completion on the same
timeline used by rooms; do not merely jitter a board-publication timestamp.
Keep actual computation/commit times and simulated lifecycle times separate
in audit data. Results remain game-derived and become board/XP eligible only
after the activity's required completion, without backdating database events.

Persist due events and bound recovery. On restart, recover an owned live seat
before assigning another activity; do not replay missed presence transitions
or discharge every overdue action at once. Observe existing catch-up/day limits.
