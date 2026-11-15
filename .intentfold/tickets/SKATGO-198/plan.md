# SKATGO-198 plan

What the code already promises: `legal-footer.tsx` is the one footer under every header page (not the tables, not print);
it is a single wrapping `nav` of internal links in `color.info`, inside `dims.landingColumn`. No external link and no
third-party image exists in the footer yet.

Route:
1. `app/public/friends/{32karten,checkermaven,pagat,dskv}.webp` — each site's own picture, cut square from that
   site's own files (32karten's header jack on its banner blue, The Checker Maven's header checker, the "P" of pagat's banner wordmark,
   DSkV's suit icon), 80×80 for a 40px mark. Made from files fetched from each site in this ticket.
2. `app/src/lib/friends.ts` — the four sites: name, address (pagat's German page in German), picture.
3. `legal-footer.tsx` — a second block under the links: a small heading (`footer_friends`: "Friends" / "Freunde") and a
   wrapping row; each entry is the 40px picture (`dims.control`, `radii.tag`, `hairline` border) and the name as a
   link, opening in a new tab with `rel="noopener"`, followed (no nofollow: the human's own recommendation).
4. Charter: `ui.md` Footer row, `engineering.md` the public files.

Undecided before the grill: heading word; whether to nofollow; size of the picture.
