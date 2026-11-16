# SKATGO-202 handoff

## What changed
- `video/` (new, its own package; nothing in `app/` or `multiplayer/` changed): Remotion 4.0.539 project.
  - `remotion.config.ts`: the site's `PlayingCard` compiled from `app/src` with StyleX's Babel plugin (runtime
    injection), packages from `video/node_modules`, the cards' `/cards/...` pictures under the render's static base.
  - `scripts/plan.ts`: from a stored deal of the day, the quiz (hand, position, one question chosen by the AI's own
    decision in the player's seat: pass / bid / game / hand, never answered) and the answer (auction, skat and discard,
    contract, ten tricks, result).
  - `scripts/make.mjs`: reads the day's and the day before's deals (Render CLI, read-only), plans, speaks each line
    with Azure (`de-DE-Seraphina:DragonHDLatestNeural`), renders `out/<day>/quiz-<day>.mp4` and `answer-<day-1>.mp4`.
  - `src/`: one composition, 1080×1920, 30 fps: felt, logo and date pill, the hand popping in, the question with a
    3-second countdown, the tricks one by one (winner ringed), the result, skatgo.com; under it the line being said,
    its words lit with the voice.
- Azure: `rg-skatgo` / `skatgo-speech` (SpeechServices F0, West Europe, tags `DrataExclude`, `project=skatgo`); key in
  git-ignored `.intentfold/tmp/video/speech.env`.
- Charter: engineering.md (`video/`), operations.md (how to run, the Azure resource).

## AC results
1. `node video/scripts/make.mjs 2026-11-16` made both: h264 1080×1920 + aac; quiz 19.3 s, answer 30.9 s (AC amended
   on the ticket to 15–60 s) — pass.
2. Quiz: hand equals seat 0 of 2026-11-16's deal; question "Welches Spiel sagst du an?"; narration and props carry no
   contract, bid, points or tricks; skatgo.com at the end — pass (`quiz-sheet.jpg`).
3. Answer: 2026-11-15's hand, "Mittelhand spielt Herz-Spiel", ten tricks, 45 : 75 — equals `benchmark.summary` — pass
   (`answer-sheet.jpg`).
4. Seraphina HD voice; captions lit word by word with it (stills) — pass.
Mechanical defence passed (346 tests and the rest; `test:seo` rerun once after a navigation timeout).

## Deviations
- AC length 30–60 s → 15–60 s (the agent's own number; the quiz is as long as its lines).
- Captions timed by letters within each line, not by Azure word events (REST gives none; no Speech SDK added).

## Environment
No service ports (the SEO check uses web 55202). New local file `.intentfold/tmp/video/speech.env`
(`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`), not in any `.env`.

## Residual
- Daily running (a schedule) and posting are not built; posting stays the human's.
- The answer explains the play only by showing the tricks; a spoken key moment per deal would need its own rules.

## Check
1. `quiz-2026-11-16.mp4` — the question, the voice, the pace (~19 s).
2. `answer-2026-11-15.mp4` — whether the tricks are readable at that speed and the answer explains enough.

## Decided for you
- The quiz never says the answer ("Die Auflösung gibt es morgen"), as SKATGO-195.
- Question type per deal from the AI's own decision in the player's seat.
- Felt background, the site's logo, cards and font; captions in the upper-middle, clear of TikTok's bottom buttons.
- German only for now.
