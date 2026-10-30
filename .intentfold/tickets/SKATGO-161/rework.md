# SKATGO-161 rework (after the frozen handoff)

1. 「topbar的高度是否太高？」, then 「改」 — the header was 80px (64px on a phone) with a 56px (44px) mark;
   with a lesson's sticky bar below it took about a sixth of a phone screen. It is now 64px (56px) with a
   44px (36px) mark: `dims.landingHeader`, `landingHeaderPhone`, `landingMark`, `landingMarkPhone` in
   `theme/shape.stylex.ts`, approved by the human (ui.md Redline 1). The scroll margins of the rules, legal
   and Skat-Tricks anchors follow the same tokens. `ui.md`'s frame line records the heights. `14f199f`

**Rechecked:** the header measured in a browser at 375 px (56px, mark 36px) and 1280 px (64px, mark 44px);
the front page at 320 and 375 px has no horizontal scroll; the design-token check. The lesson criteria are
untouched by a header height. At close, the mechanical defence ran once over the final branch.

**Net effect vs the handoff:** the delivery as handed off, plus a lower header on every page but the tables.
