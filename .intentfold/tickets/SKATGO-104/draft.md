# SKATGO-104 draft — agreed in conversation before filing

The human and the agent settled the look on three inline mockups before the ticket was filed, so this
replaces the grill (dev.md step 3).

## Agreed
- Two flags side by side in the header, English then German, each a direct radio: one tap switches.
  The dropdown card of flags goes.
- The English flag: the United States top left, the United Kingdom bottom right, split on the
  diagonal with a thin white line. Chosen over a vertical half-and-half, which cuts both flags messily.
- Chosen flag: full colour, a thin green (`color.go`) ring 1px off the flag. Other flag: its own
  colours, semi-transparent (about 0.4), clearer on hover.
- No padding and no frame round the flags (the human: 「我奇怪你为啥一定要有paddding」). The tap target
  is enlarged invisibly to about 32px instead.
- The settings dialog's language choice uses the same English flag.

## Ruled out
- Greying the unchosen flag (the human: 「不要搞灰色的，可以搞成透明点的」).
- Flags with "EN" / "DE" text: twice as wide, crowded on a phone.
- Changing the German-only front page `/` (SKATGO-44): left as it is.

## Registry approval (ui.md Redline 1)
The human's request is a new flag, which is `theme/flags.tsx`; the agreed look needs a few new values
(the flags' opacities, ring offset, corner, size). Taken as approved by the request, like earlier
tickets; listed in the handoff.
