# SKATGO-106 plan

Found in the code (`lib/skat/sounds.ts`, `game-table.tsx` `useCardSounds`): `loadSounds()` runs in the
table's own mount effect, and the first fresh deal calls `playSound('deal')` in the same commit, before
any file is fetched — so the first deal of every page load is silent. `playSound` also drops a sound when
the AudioContext is not running (an iPhone before a touch on the table, or back from the lock screen),
only asking it to resume. The AudioContext is created outside any gesture, which an iPhone will not
start until a later touch.

Route:
1. `primeSounds()` from `SkatLayout` (every page): fetch the five files at once (15 KB), and a capture
   listener on pointerdown / keydown / touchend that creates the AudioContext inside the gesture, starts
   a silent one-sample buffer (iPhone unlock), resumes it and decodes the files.
2. `playSound`: plays at once when ready; otherwise records the ask and plays it when the audio becomes
   ready (decoded, running), if within `sound.late` (1200 ms, `theme/constants.ts`); later than that it
   is dropped. Settings-off and hidden page still mean silence, checked again at the late start.
3. `game-table.tsx`: drop its `loadSounds` effect.

Token: `sound.late` in `constants.ts` (ui.md Redline 1) — part of the human's "修了马上上线" fix; see grill.md.
