# Persona Design

## Traits, State and Context

For a new population, start with a small editable set of novice, casual,
practiced and strong styles. The host agent maps each style to bounded runtime
parameters, then judges its observed behavior. Choose fictional nicknames;
do not invent biographies claiming real persons.

Separate three layers:

- Stable traits: identity, habitual availability, skill profile, preferences,
  pace and interruption tendencies.
- Session state: attention, fatigue, time pressure, confidence and temporary
  network condition; change them gradually rather than per-card rerolls.
- Decision context: phase, own visible cards, public history, legal choices,
  unfamiliarity and recent events.

These are modeling dimensions, not JSON field definitions. The code schema is
authoritative; extending it is implementation work, not a roster-only edit.

| Dimension | Meaning to model |
|---|---|
| Identity | Stable ID, nickname and, where supported, avatar and language |
| Attendance | IANA-local windows, weekday/weekend habits, skipped days and multi-day quiet periods |
| Sessions | Duration, breaks, mode preferences and willingness to finish another deal |
| Bidding | Evaluation threshold, risk appetite and Hand/pickup or contract preferences |
| Card play | Declarer/defender strengths, contract weaknesses, error frequency and severity |
| Pace | Phase-specific baseline, hesitation, result-reading and next-deal readiness |
| Interruptions | Habitual stability, temporary distraction, short loss, reconnect and departure |

Do not force strength to imply volume, slow play or stable connectivity.
Within a session, shared attention or fatigue may affect both pace and errors.
Use several plausible style families with bounded variation, not evenly spaced
strengths or the Cartesian product of every possible trait. Hundreds of names
over a handful of identical profiles are not hundreds of distinct styles.

For example, an evening casual player may be conservative, deliberate and
briefly distracted late in a session. An occasional practiced player can be
fast in familiar defence but hesitant in Null. Treat these as examples, not
mandatory archetypes or claims about real people.

## Playing Styles and Mistakes

Legacy jobs retain the original mistake/severity/Null/form controls. New strength
profiles use role-specific card errors and bidding/pickup/discard/contract adapters
described in [calibration.md](calibration.md). Neither is proof of human
decision-making. Target choices a character plausibly
makes, not just a weaker version of the best engine:

- Condition error frequency on visible difficulty, role, contract, familiarity
  and session state. Strong styles mostly make subtle errors in difficult
  positions, not indiscriminate deep mistakes in obvious ones.
- Distinguish a plausible near-best alternative from a patterned error such
  as overvaluing a scoring card or mishandling a defence situation. Give each
  supported error family a concrete visible-context trigger.
- Rerank only legal candidates from `Policy.ranked`; never inspect hidden hands,
  encode a desired winner or adapt errors to force a real player's result.
- Apply bidding thresholds to the persona's own ten-card evaluation, not
  arbitrary bid additions. Keep standard opponent plans unchanged.
- Contract, pickup and discard preferences need an explicit persona-only
  decision adapter before config can claim support. A card-choice wrapper
  alone does not implement them.

Actual forgetting requires a separately implemented memory/belief model.
Do not claim a higher mistake probability simulates forgotten cards, or
silently alter the pinned encoder to create that effect.
Do not make new free-form chat, typing or social automation part of this work.
Existing Lina/Noah dialogue and its model use remain unchanged.

## Calibration and Maintenance

Probabilities are hypotheses, not calibrated difficulty labels. Measure
declaration frequency, contract/role-specific outcomes, deviations and their
severity, Seeger-Fabian mean/spread, win rate and XP on common cards.
Weak play may tie or beat stronger play on a deal; overlapping distributions
are valid. Never impose target ranks, scores or guaranteed win rates.
Validate attendance and pace with [sessions.md](sessions.md), not score
calibration alone.

When editing a roster, preserve IDs and registered names unless the human
explicitly approves a targeted persona nickname revision. Bump its version,
retain the seed for comparable experiments, and explain intentional parameter changes.
New people do not silently inherit an old person's history. The runtime saves
the exact roster hash and persona snapshot with each completed activity.
Keep the audit roster version separate from the random-stream format version:
a nickname-only revision must not reroll attendance, timing or game choices.

Before code consumes newly generated config, run [profile-gate.md](profile-gate.md).

## Population and Names

Hand-author the first 17 identities. Expand with stable per-identity random
streams over several existing style families, varying multiple bounded play
and attendance dimensions independently. Increasing the count must preserve
every previous identity, nickname, parameter and planned activity; do not make
the count part of an identity's seed.

Use user-chosen nicknames as context, excluding system-assigned two-word defaults
and the owner's pinyin/abbreviation variants. Favor familiar name variants,
diminutives, initials and individual handles over a uniform list of plain first
names. Mix case and sparse punctuation, and include a small amount of naturally
spelled non-English letters; do not decorate every name or apply a numeric suffix
template. Several aliases of one person are not independent naming samples.
Do not copy observed players, infer a person's nationality from a nickname or
invent biographies. The starter roster holds the exact human-approved names;
do not silently regenerate existing expansion identities to match a new style.

A registered persona rename requires explicit approval of the affected names
and a targeted migration. Pause the local runner, check the old names and global
reservations, and preserve IDs, traits, jobs, snapshots, results and XP. The
automatic reservation path must still reject name changes. Approval of a local
starter revision does not authorize production changes or any human rename.
Validate all generated names with the shared nickname validator and reserve
against human and persona names before scheduling. Report conflicts for a
targeted candidate-name edit, never rename the existing owner automatically.
