# SKATGO-31 rework

Reconstructed at close from the three commits after the handoff; `handoff.md` is unchanged.

- **The site name matches the headline** (「logo字加粗，和heading1的那个字体一样」): `landingBrand` is
  Red Hat Display 900, as `landingHero` is. Its size is unchanged. Checked: computed 900 against the
  H1's 900.
- **Header height** (「改，本工单」): `dims.landingHeader` 100 → 80px on desktop; the phone stays at 64.
  Checked at 1280: the bar is 80px, the mark is centred (0px off), and the hero moved up 20px.
- **Hero small print** (「每天12幅牌并排名，免费，无限AI牌桌」): "12 deals a day, ranked" / "Free to
  play" / "Unlimited AI games", and in German "12 Spiele am Tag, mit Rangliste" / "Kostenlos" /
  "Unbegrenzt gegen die KI". The 12 comes from `DAILY_DEALS`; the unused `DAILY_EST_MINUTES` is gone.
  Folded into this ticket on the human's go-ahead to keep the front-page polish together. Checked:
  English at 1280, German at 375 with no horizontal scroll.
- **Criteria rechecked:** AC1 after the header change. The mechanical defence runs once more at close.
