# SKATGO-66 AC check plan

Local web 55066 (built server), with multiplayer 56066 and database 57066 for the table. Headed Playwright at desktop 1280×820 and phone 375×812.

1. **All images and their provenance are in the repo.**
   - Command: count the masters and served files by deck and kind: French courts 12; German courts 12, Daus 4, suit symbols 4; back 1. Check each is a readable image of the expected size with an alpha channel (`file`, `cwebp -info`).
   - `app/brand/cards/PROVENANCE.md` names the tool, model, dates and prompts. `prompts.json` has one entry per image, and each master has its metadata JSON with no credential (grep for the key's prefix finds nothing).
2. **The human has seen the overview of both decks and confirmed the style.**
   - The overview picture is posted for the human, and their confirmation is a ticket comment (quoted in the handoff).
3. **The French deck is everywhere a card is shown; no other pattern or colouring is offered.**
   - Front page, a course lesson with cards, `/play` (hand, trick, skat in the info panel), `/daily/play`: every `[data-card]` face carries `data-deck="french"` and no `@letele` markup. Courts load `/cards/french/*.webp`. The pip colours, read from the computed style per suit, are ♣ black, ♠ green, ♥ red, ♦ gold.
   - The settings offer decks only (the tournament deck and J / Q / K / A), with no colour scheme.
   - Screenshots at both sizes; nothing broken at 34 px (the skat) or 58 px (phone hand).
4. **The default deck's letters are B / D / K / A in every language; the J / Q / K / A deck is a choice that sticks.**
   - `/de/…` and `/en/…` pages, fresh context: every court's and ace's `data-index` is B / D / K / A, and 7–10 show their numbers.
   - Choose "J, Q, K" in the header's gear, then reload: the letters are J / Q / K / A. Choosing at the table's settings tab switches them back.

Mechanical defence per `engineering.md` Tools.
