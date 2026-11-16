# SKATGO-201 handoff

## What changed
- `frame.tsx`: the header's "SkatGo" hides only under `bp.narrowPhone` (359px) again, not under 430px (SKATGO-200);
  the header's sign-in uses `auth_sign_in_header` ("Sign in" / "Login"); the right-hand controls `x8` apart on a phone
  (was `x12`, `x10` under 360). Flags, their distance, gear, button style and header height unchanged.
- Messages: `auth_sign_in_header` en "Sign in", de "Login". The other sign-in buttons keep "Anmelden".
- Charter `ui.md`: the header line.

## AC results (production build, :55201, guest, light)
1. de and en at 360, 375, 390, 414, 430: name shown, page overflow 0, sign-in inside the viewport — pass
   (en 360: the button's right edge exactly at 360).
2. German header button "Login" — pass.
3. 1280: header as before, German button "Login" — pass. 359: the mark alone, overflow 0.
Screenshots `de-360/390/1280.png`, `en-360/390/1280.png`. Mechanical defence passed (346 tests and the rest).

## Deviations
None from the plan.

## Environment
web 55201. No env keys changed.

## Residual
`bp.markOnly` (SKATGO-200) is unused now; removing it is a registry change and waits for the human.

## Check
1. English at 360px (many Samsung phones): "Sign in" fits but touches the screen edge.
2. German header "Login".

## Decided for you
- Only the header's button says "Login"; the other German sign-in buttons keep "Anmelden".
- Under 360px the mark alone, as before SKATGO-200.
- Phone gap between flags group, gear and button 12 → 8px.
