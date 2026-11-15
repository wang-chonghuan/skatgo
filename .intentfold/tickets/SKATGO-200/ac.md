# SKATGO-200 acceptance checks

Production build on web 55200, a guest (no sign-in).
1. /de/... and /en/... at 320, 360, 375, 390, 399, 400, 430px: documentElement.scrollWidth equals clientWidth, and the
   sign-in button's right edge is inside the viewport.
2. At 400 and 430px the name "SkatGo" shows beside the mark; at 1280px the header is unchanged (screenshot).
