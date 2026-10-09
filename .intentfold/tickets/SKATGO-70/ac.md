# SKATGO-70 AC check plan

Built web on 55070, headed Playwright at desktop 1280×820 and phone 375×812.

## AC1 — The tab, the header and the home-screen icon show the new logo

- **Check**: every icon file is regenerated from the new master, at its old pixel size (`sips`).
- **Check**: a contact sheet places each icon beside the new master, scaled to the same size and cropped the same way.
- **Check**: the header at both sizes is screenshotted.
- **Check**: the master's crop, re-rendered and diffed against each icon, shows only the rounding and padding the script applies.
- **Check**: the icons' corners and padding are pure white or transparent, with no grey frame and no specks from the JPG.
- **True when**: the icons match the master's crop, the header shows it, and no ground pixel strays from white.

## AC2 — Every page's preview shows the new logo

- **Check**: all 40 preview images are redrawn. In each, the logo area matches the new `logo-96.png` and differs from the old.
- **Check**: the rest of each image is unchanged, so the titles stay where they were.
- **True when**: all 40 hold.

## AC3 — The files served are the new ones, at their old sizes

- **Check**: the local server serves each file named in the ticket. Each has the same dimensions as before and a different content hash.
- **Check**: after the deploy, the same files on skatgo.com are checked at close.
- **True when**: all hold.

## Mechanical defence

As `engineering.md` Tools names it.
