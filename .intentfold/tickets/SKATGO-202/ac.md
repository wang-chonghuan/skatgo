# SKATGO-202 AC checks

1. `node video/scripts/make.mjs 2026-11-16` → `video/out/2026-11-16/quiz-2026-11-16.mp4` and `answer-2026-11-15.mp4`;
   ffprobe: h264 1080×1920 + aac audio, 15–60 s.
2. Quiz stills: the ten cards equal `deal(dealer, deck).hands[0]` of 2026-11-16; a question; no contract, bid or score of
   the AI in its frames or narration (plan JSON text checked); skatgo.com at the end.
3. Answer stills: 2026-11-15's hand, Mittelhand's Herz-Spiel, ten tricks, 45 : 75 — as `benchmark.summary`.
4. Narration audible in Seraphina HD (`de-DE-Seraphina:DragonHDLatestNeural`); captions lit with it (stills).
