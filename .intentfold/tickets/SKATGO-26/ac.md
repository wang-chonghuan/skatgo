# SKATGO-26 acceptance checks

Checked against the built server (`node .output/server/index.mjs`) on port 55026, with `app/.env`
loaded. Playwright runs headed, at 1280×820 and 375×812.

## AC1 — every page matches its Funbridge reference in detail (human-confirmed)

- The capture script writes side-by-side pairs to `tmp/compare/`, one per skatgo page per viewport,
  each skatgo capture next to its reference capture. The pages: `/`, `/course`, a lesson step, a
  lesson drill, and `/play` in bidding, contract, play and settlement. The phone reference exists only
  where Funbridge serves one (Q6).
- The computed-style probe prints, for each element in `reference.md`, skatgo's value beside the
  reference value:
  - rail width, top-bar height;
  - tile size, radius, padding and shadow;
  - section-title type, button radius and colours;
  - side-panel width, frame border, felt colours.

  A value that differs is either fixed or listed as a deliberate deviation.
- The human reviews the pairs and confirms. The agent does not record AC1 as passed on its own.

## AC2 — the front page is lobby-structured and its entries work

At both viewports:
- the lobby structure is present (per Q1: rail or top bar, colour tiles, section titles);
- clicking the course tile lands on `/course` and the play tile on `/play`;
- coming-soon tiles are not links.

## AC3 — the table is Funbridge-styled and a whole game completes

At both viewports, drive `/play` from the deal to the settlement:
- bid or pass in Reizen;
- when declarer, take or leave the skat and pick a contract;
- play every card, locating legal cards through the engine's `data-*` attributes.

Pass when all of these hold:
- the settlement appears;
- no page errors;
- the felt, the gold frame, the seat plates and the side panel are present (by stable `data-testid`).

## AC4 — nothing from Funbridge is in the project

- `git grep -in funbridge -- app/` returns nothing.
- No font file named nexa is added.
- `git diff --stat main -- '*.png' '*.jpg' '*.svg' '*.webp' '*.woff*'` lists only files whose origin
  is recorded in `handoff.md` as original or openly licensed.

## Also run

- The mechanical defence (`engineering.md`).
- `overflow_probe.mjs` over every page at 375, 768 and 1280, proven able to fail once.
- `page_blocks.mjs` against `main` for each page. Every difference is either a fix or a recorded,
  approved deviation.
