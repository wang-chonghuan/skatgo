# SKATGO-201 rework

1. 「实在放不下时，国旗合并成一个，可以下来的，否则就还是两个」 (asked after 「合并上线」, before the PR)
   Under 375px (`bp.oneFlag`, the breakpoint registry's SKATGO-200 `markOnly` retuned and renamed; `narrowPhone` removed
   as unused — both registry changes made under this ask) the two flags become one: the language in use with a chevron,
   opening a `panel` menu of both languages (flag and own name, the one in use ringed). From 375px the two flags as
   before. The name now shows at every width (no mark-alone step).
   Rechecked: de/en at 320, 360, 374, 375, 390, 430, 1280 — name shown, page overflow 0 and 12px to the edge from 360
   up, one flag under 375 and two from 375; the menu switches de→en and en→de. Mechanical defence passed.
   At 320px (phones from 2016 and earlier) the header still runs 13px (de) / 22px (en) sideways.

Net effect against the handoff: from 360px every header fits with its full edge; English 360 is no longer tight;
under 375px one flag with a language menu.
