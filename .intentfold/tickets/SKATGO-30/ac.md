# SKATGO-30 acceptance checks

Built server on port 55030; Playwright.

## AC1 — the new icon everywhere
- `/favicon.ico` (every entry), `/favicon-32.png`, `/apple-touch-icon.png`, `/icon-192.png`, `/icon-512.png`,
  `/icon-maskable-512.png` and `/logo-96.png` answer 200 and are byte-identical to the regenerated files,
  which differ from `main`'s.
- The front page header and a sub-page's rail show `logo-96.png` (screenshot).

## AC2 — whole, centred, readable
- For each output: the drawn area (non-white pixels) touches no edge, and its centre is within 3% of the
  image's centre; content fills 80–92% of the side (maskable excepted).
- 16px and 32px renders, magnified, show four distinct colour areas (black, green, red, orange).

## AC3 — maskable
- Every drawn pixel of `icon-maskable-512.png` lies inside the centred circle of radius 40% of the side.
