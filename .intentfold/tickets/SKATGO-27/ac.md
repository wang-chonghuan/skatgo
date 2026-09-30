# SKATGO-27 acceptance checks

Checked against the built server on port 55027. Playwright runs headed, at 1280×820 and 375×812. The
browser context starts fresh for AC1 and keeps its storage for AC2.

Colours are read from computed styles: a face's pip `fill` (the `<use>` elements) and a suit glyph's
`color` in text. The expected hex values are the ticket's.

## AC1 — first visit is German Skat

On a fresh context, check these places:
- the hand at `/play`;
- a card row and a drill in lesson 1;
- the suits on the front page;
- a contract name with ♥ in the picker, when reachable.

Pass when every ♣ is `#000000`, ♥ `#E02424`, ♠ `#059669` and ♦ `#D97706`, and every court card's
figure keeps its own colours. The court check compares a figure path's fill before and after
switching: it is unchanged.

## AC2 — the settings button switches and remembers

Open settings from the public header, the band and the table panel. Each shows three schemes, each
with swatches.
1. Choose four-colour. Every place in AC1 changes at once: ♠ black, ♥ red, ♣ green, ♦ blue, with the
   values from Q1.
2. Reload the page; it is still four-colour.
3. Open a new page in the same context; it is still four-colour.
4. Choose two-colour, reload, and check that it persists.

## AC3 — two-colour looks as before

In two-colour: ♥ and ♦ are the deck's own red (as `main` renders them), ♠ and ♣ black. Compared with
the same card on `main`: the pip fills are equal.

## Also run

- The mechanical defence.
- The overflow probe on every page at 375, 768 and 1280, with the settings dialog open on one of
  them.
