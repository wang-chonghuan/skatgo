# SKATGO-142 AC check plan

Local web 55142, multiplayer 56142 with the site's model, database 57142. No game is played: the player only passes
in the bidding (acceptance plays no games); the trick and decided moments are proven by `multiplayer/test/talk.test.ts`
on six pool deals SkatZero plays through, and left to the human's own play at the table.

1. A line during the deal, at most three, on the speaker's side, none after the deal — `tmp/ac.mjs` (bidding moment,
   PC and phone); the three-per-deal and during-the-deal rules by `talk.test.ts` and the browser's `TALK_MAX`.
2. Related to the deal, in the page's language — the line read in English and German.
3. Nothing unplayed told to the model, no advice — `talk.test.ts` checks every fact sent names only played cards;
   the prompt forbids advice.
4. Other tables silent — lesson 11 asks nothing (`tmp/ac.mjs`); the tournament, deal of the day and private tables
   never get the `talk` prop or call `/talk` (diff).
5. Switched off: no question, no line — `tmp/ac.mjs`.
6. Model unavailable: the deal goes on, no line — multiplayer started without the model's keys, the player passes and
   the table goes on; `/free/talk` answers `{ kind: null }`.
