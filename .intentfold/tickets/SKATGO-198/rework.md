# SKATGO-198 rework

1. 「不要写朋友，有点奇怪。你查查行业中都这么写的，专业点，而且现在这个图标太大」 (79ff2f2)
   Heading "Friends" / "Freunde" → "Recommended sites" / "Empfohlene Seiten" (pagat writes "Links to other sites",
   32karten "Links und Downloads"; "Partner" implies a business tie). Pictures 40px → 24px (`dims.badge`).
   Rechecked AC 1–3 in the footer.
2. The human asked whether it is needed at all and whether it belongs on the front page; the agent advised one page,
   About SkatGo, instead of every page's footer (sitewide reciprocal links read as a link exchange; the front page
   should not send players away). 「同意」 (c988a9a)
   The section moved to About SkatGo's end, each entry its picture, bold name link and a one-line note (en/de);
   the footer is back to the base file. The live ticket's Scope, Constraints and AC were amended to match.
   Mechanical defence passed on this code; AC 1–3 rechecked on /en/about, /de/about and at 375px; the footer has no
   outbound link; the links are in the server's HTML.

Net effect against the handoff: the recommended sites live on About SkatGo, not in the footer; heading "Recommended
sites"; 24px pictures with a one-line note each.
