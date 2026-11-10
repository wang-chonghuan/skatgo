---
name: skatgo-personas
description: Load when developing SkatGo simulated players, their playing styles, online sessions, thinking times, interruptions, daily and XP board activity, or participation in existing private-room computer seats. Triggers include "拟人角色", "模拟玩家", "拟人服务", "调整角色牌力" and "skatgo-personas". Not for UX persona research, arenas, public matchmaking or replacing Lina/Noah.
---

# SkatGo Personas

Build persistent characters whose play, attendance and table behavior remain
recognizable across days and existing product surfaces. Prefer coherent traits
and session state over independent random delays and mistakes.
The host agent designs styles and judges evidence; deterministic code owns
configuration validation, state transitions, legal decisions and persistence.
Do not call a language model to choose game actions or manufacture scores.

## Scope

Support simulated entrants in the daily one- and six-deal competitions, free-play
activity and cumulative XP, plus personas in computer seats of existing private
rooms when room integration is explicitly included in the live ticket.
Do not add an arena, public lobby, matchmaking, anonymous room discovery, a new
chat system or a replacement for the course and its existing characters.

For a skill-only request, change these instructions only. New runtime contracts
below do not authorize code, roster, schema, infrastructure or production changes.

## Start

Read `.intentfold/readme.md`, the relevant charter and the live ticket. Product
changes require IntentFold setup; this skill owns development, not ticket,
merge or deploy authority. Commands below run from the repository root.

Choose the requested task:

- Add or tune personas: read [design.md](references/design.md) and
  [calibration.md](references/calibration.md) and [sessions.md](references/sessions.md), then map the requested dimensions to
  supported config and run the [profile gate](references/profile-gate.md).
- Implement or change the service, gameplay or storage: read
  [runtime.md](references/runtime.md), [calibration.md](references/calibration.md)
  and [sessions.md](references/sessions.md).
- Integrate existing rooms: also read [rooms.md](references/rooms.md).
- Validate or operate: read [validation.md](references/validation.md).

The authored starter roster is `multiplayer/src/personas/roster.json`; its schema,
stable population expansion and defaults belong to `multiplayer/src/personas/config.ts`,
not to a duplicate schema in this skill. Read that code, `control.ts`, `service.ts`,
`runner.ts`, `schedule.ts`, `play.ts`,
`multiplayer/scripts/personas.ts` and `multiplayer/README.md` to discover actual
support and limits. The initial implementation is a batch board simulator, not
a persistent presence service or room adapter. The richer behavior in these
references is a development contract, not evidence that it already runs.
Do not emit unsupported JSON fields or raise population limits without the
corresponding ticketed implementation and evidence.

For the current board-service expansion, use 17 starter identities and a manual
population control up to 500. A continuously running scheduler does not imply
continuous attendance or 500 concurrent games. Update these references alongside
the ticketed implementation and verify both the starter population and prefix
stability at every requested expansion size.

## Boundaries

- Separate `sim:` identities and audit storage from Clerk users, private
  profiles, referrals, forum and human analytics. Never borrow real identities
  or change an existing user's nickname.
- Apply persona choices only to the simulated player's seat. Preserve the
  standard AI benchmark, Lina/Noah, ONNX models, encoder and saved human games.
- Score once through the shared rules engine. XP uses the existing `xpOf`.
  Ties and occasional upsets are valid; never redraw a losing game or offset
  scores to force a desired ranking.
- Win rate is the simulated seat's side, as `recordOf` counts human games:
  declarer win or defending against a lost declaration; all-pass is excluded.
  A tiny sample or a six-deal AI tie does not establish long-run strength.
- Terms do not discuss participant composition: no statement about the presence,
  absence or possible presence of Synthetic players, and no all-human claim.
  Terms edits require an explicit ticketed human request; this is not blanket
  authority to change legal copy or other user-facing identity claims.
- Runtime is disabled by default. Production activation, backfill and deployment
  require separate explicit authorization; local acceptance refuses remote DBs.
- Scope random streams separately, but let timing, errors and interruptions
  share explicit session state. Save sampled decisions, deadlines, config
  snapshots and logs; retries must not reroll or overwrite completed history.
- Freeze executable policy as well as traits. Route old snapshots through their
  original policy; refuse unknown/mismatched policies. No silent job migration.
- One persona has one exclusive activity timeline. Room presence, solo play
  and board completion must not place the same character in two activities.

## Delivery

Use the roster to generate code/config, not a prose-only cast of characters.
For runtime changes, produce real-game calibration and isolated persistence/
board checks for the affected behavior. Add session/timing or room evidence
when those dimensions changed. Validate skill-only edits without implying
runtime acceptance.
Report implemented versus planned dimensions, measured sample sizes, capacity
and unresolved uncertainty. Different scores alone do not prove natural
behavior, and a finite evaluation cannot guarantee indistinguishability.
