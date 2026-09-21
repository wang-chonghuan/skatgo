# SKATGO-7 plan

## What the code says that the ticket does not

- Two gates: `lesson-page.tsx` sends a learner back to the map when `isUnlocked(id, done)` is false, and
  `course-home.tsx` renders a locked lesson as a non-link with 🔒. `isUnlocked` lives in `content.ts`.
- `progress.ts`'s `hydrated` flag exists only so the lesson page does not bounce a learner before
  localStorage is read — i.e. only for the gate. It is not persisted (`partialize` keeps done/tally).
- The map outlines the "open" lesson in brass; today that is exactly the next lesson. Without locks
  every unfinished lesson would be "open", and the map would lose where the learner is.
- sitemap.xml / sitemap.test.ts give "lessons redirect a new visitor" as the reason lessons are not
  listed — no longer true.

## Route

1. Remove the gate: lesson page opens any existing lesson (unknown id → map); remove `isUnlocked`.
2. Map: every lesson is a link; states done / next (the one "continue" points at, brass as before) /
   open (plain card, brass outline on hover); no 🔒.
3. Remove `hydrated` (dead without the gate). Storage key, shape and records untouched.
4. Correct the sitemap reason in both comments; the outdated unlock test becomes a unique-ids test.
