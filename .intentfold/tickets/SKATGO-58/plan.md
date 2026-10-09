# SKATGO-58 plan

## What the code shows

- `Pill` (`components/skat/ui.tsx`) has `whiteSpace: 'nowrap'` and no width limit, so any long pill grows wider than its container.
- In the table's side panel (`game-table.tsx`, the `strip` row), the play-phase pill is one message, `table_trick_count`: "Stich {n} von 10 · Alleinspieler {declarer} · Gegenspieler {defenders} Augen". It is the longest pill and overflows the pinned panel (`dims.sidePanelPinned`, as narrow as 280 px) and the phone drawer.
- `Pill` is also used on the course page (three short pills) and for the trick winner, the contract and the declarer.

## Route

1. `ui.tsx` `Pill`: never wider than its container (`maxWidth: '100%'`). A long text wraps, centred, with a little vertical padding, instead of overflowing. Short pills look the same as now.
2. `game-table.tsx`: split the play-phase pill in two:
   - "Stich {n} von 10" (the existing `info_tricks`);
   - a new `table_points`, "Augen: Alleinspieler {declarer} · Gegenspieler {defenders}" / "Card points: declarer … · defenders …".

   `table_trick_count` is removed. The two pills wrap side by side or one under the other, as the `strip` row already allows.
3. No new design value: padding comes from the existing `space` steps.

## Redline lookup

- ui.md Redline 1: no registry change.
- No dependency.
- No data.
