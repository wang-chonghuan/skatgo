# SKATGO-31 plan

- The landing header (`frame.tsx` `LandingHeader`) shows `logo-96.png` at `dims.brandMark` (40px, shared with
  the rail) and the name in `typography.dialogTitle` (22px bold). The new icon (SKATGO-30) carries white
  margin inside its square, so the visible mark is about 30px.
- Route: new tokens `dims.landingMark` (56px) and `dims.landingMarkPhone` (44px), and a new role
  `typography.landingBrand` (28px, 24px on a phone, bold), used only by the landing header's brand link. The
  rail keeps `brandMark`.
- Redlines: additions to the registries only (approved for additions under SKATGO-29's Q5; this ticket's
  grill records it); no dependency.
