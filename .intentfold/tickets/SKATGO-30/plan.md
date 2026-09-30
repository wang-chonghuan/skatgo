# SKATGO-30 plan

## What the code says that the ticket does not

- Every icon is cut from one master, `app/brand/skatgo-logo.png`, by SKATGO-23's `icons.mjs` (Chromium canvas,
  no image dependency): `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png` (180),
  `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, and `logo-96.png` — the header/rail mark,
  shown at 40px (`dims.brandMark`) with rounded corners.
- The script crops to the drawn area (every pixel that is not near-white) and pads per use, so a master
  with generous white margins (5.png is 1254² with the mark in the middle) needs no hand cropping.
- No code references change: every file keeps its name and size.
- SKATGO-29 (unmerged) also draws `logo-96.png` into its share images; they are regenerated when that
  ticket lands after this one (noted there).

## Route

1. `5.png` becomes the master `app/brand/skatgo-logo.png`.
2. A copy of the generator in this ticket (`icons.mjs`), Playwright from `tmp/`, with the paddings of
   grill Q1; run it.
3. Look at every output at its real size.

## Redline lookup

- No dependency (engineering Redline 3). No token change (ui Redline 1). No production data.
