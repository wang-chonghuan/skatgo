# SKATGO-198 AC checks (playwright on the ticket's port 55198)

Rework round 3 moved the sites from the footer to About SkatGo (the human: 「同意」 to that proposal); the live ticket
was amended to match.

1. On /en/about and /de/about the "Recommended sites" / "Empfohlene Seiten" section lists 32karten, pagat.com, DSkV and
   The Checker Maven, each with an `img` whose `naturalWidth > 0`, the name and a one-line note.
2. Each entry's link has the site's address and `target="_blank"`; the footer has no outbound link.
3. At 375px `document.documentElement.scrollWidth <= innerWidth`.
