# SKATGO-119 plan

## What the code already says
- `TextArea` (ui.tsx, SKATGO-118) starts a control's height and grows with `field-sizing: content`; a fixed
  height is a new size token (ui.md Redline 1 — approved by the request).
- The tournament's size runs through everything: `DAILY_SIZES`/`DailySize`/`dailySize` (tournament.ts), every
  `/api/daily/*` body (`size`), the daily page's switch and `?deals=`, the table and result components, the
  messages' `{short}`/`{long}`, the legal text, and multiplayer's `daily.ts` (inputs, preparation per size, every
  query `AND size = $n`). Rows are keyed by `(day, size)`; size 12 rows stay (Constraints).

## Route
1. **Taller boxes** — `dims.textPost` / `dims.textComment` (shape.stylex.ts): about 6 and 3 lines
   (`calc(n·lh + padding and border)`), `TextArea` gets `size: 'post' | 'comment'` as its minimum height, still
   growing with the text. Composer uses `post`, the comment box and reasons `comment`.
2. **Six deals only** — drop `DAILY_SIZES`, `DailySize`, `dailySize`, `DAILY_LENGTHS`; `DAILY_DEALS` (6) stays as
   the one length. Web: no `size` in `/api/daily/*` bodies, no `?deals=` (the routes keep no search; an old
   `?deals=12` link opens the page as it is), no switch, messages name six deals; legal text. Multiplayer: no
   `size` in inputs (a body naming one is refused, 400), only six-deal days prepared, queries keep `size = 6`
   via `DAILY_DEALS` so the rows stay keyed as stored; `nameUnnamed` still names old rows of any size.
   Redraw `og/daily-*.png` (its h1 changes). Charter: product.md, ui.md, engineering.md.

## Redlines
- ui 1: the two dims tokens — approved by the human's request (「发帖框高一点」, then 「你用最佳实践，但是不要给的行太多」).
- operations 2: the data check reads the local database only; production rows are counted read-only.
- engineering 3: no dependency change. No production data is deleted.
