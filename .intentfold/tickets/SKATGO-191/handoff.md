# SKATGO-191 handoff

## What changed
- `app/src/components/skat/deal-history.tsx`: the role column shows lucide `User` (navy) where the player declared,
  `Users` (slate) where they defended, nothing when all passed; no head over it; the phone's "Declarer" word gone. The
  role stays for screen readers (aria-label) and as a hover title.
- Messages: `history_defender` back (EN "Defender", DE "Gegenspieler"), for the screen reader only.
- Charter `ui.md`: the rows' description.

## AC results
`tmp/ac.mjs` on a production build with the owner's records, EN and DE, desktop and phone, front card and profile — ALL
PASS: 10 declared rows with one person, 10 defended with two, no role words in the list text, no head over the column.
Mechanical defence passed.

## Deviations
None.

## Environment
web 55191, multiplayer 56191, database 57191. No env keys changed.

## Residual
- The history's load time (see SKATGO-190's closing comment): waiting for 开工单.

## Check
1. The one-person / two-person signs on the front card and the profile.

## Decided for you
- One person in navy, two in slate, so declared games stand out.
- Hovering a sign still shows "Declarer" / "Defender".
