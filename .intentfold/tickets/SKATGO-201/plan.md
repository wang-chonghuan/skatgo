# SKATGO-201 plan

Found: SKATGO-200 hid the header's "SkatGo" under 430px (`bp.markOnly`). Measured on skatgo.com with the name shown:
German overflows 43px at 360 ("Anmelden" button 129px), English 8px at 360. With "Login" (86px) German fits from 360;
English needs 8px more, which the phone gap between the right-hand controls (12 → 8) gives.

Route: name hides only under `bp.narrowPhone` again; a header-only message `auth_sign_in_header` ("Sign in" / "Login"),
the other sign-in buttons keep "Anmelden"; `landingEnd` gap `x8` on a phone; charter ui.md header line.
`bp.markOnly` becomes unused; removing it is a registry change (ui.md Redline 1), so it stays until the human says.
