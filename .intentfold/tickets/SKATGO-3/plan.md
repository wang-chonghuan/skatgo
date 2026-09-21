# SKATGO-3 plan

## What the code says that the ticket does not

- `components/skat/lesson-player.tsx` walks a lesson with one `index`, one `solved` flag for the current
  step, and a `mistakes` count that becomes the stars. The foot is a sticky bar holding one
  `Btn size="lg" grow` "继续". Steps are materialised once per lesson (`useMemo`), so going back to a
  random drill shows the same cards it had.
- Each exercise (`exercises.tsx`: Choice, Pick, Order, Play) keeps its own state and is remounted per
  step (`key={index}` on the motion wrapper): going back remounts it **unanswered**, and "continue" is
  disabled until solved. So "back" is not only a button: a step already solved must stay passable.
- The kit (`ui.tsx`) has `Btn` with tones primary/quiet/felt/danger and sizes sm/md/lg — a smaller
  quiet button next to the primary one needs no new component or token.

## Route

1. `lesson-player.tsx`: remember which steps were solved (a set of indices, not one flag);
   `canContinue` = teach or solved; a back button left of "continue" (`Btn tone="quiet" size="md"`,
   disabled on the first step) that moves `index - 1`.
2. How a solved step looks when revisited — settled in the grill.
3. Messages `lesson_back` in en/de/zh.
4. No change to progress storage, stars rule, or the engine.
