# SKATGO-198 AC checks (playwright on the ticket's port 55198)

1. On /en/rules and /de/rules the footer lists 32karten, The Checker Maven, pagat.com and DSkV, each with an `img` whose
   `naturalWidth > 0` and the name visible.
2. Each entry's link has the site's address and `target="_blank"`.
3. At 375px width `document.documentElement.scrollWidth <= innerWidth` and the friends row's right edge is inside the
   viewport.
