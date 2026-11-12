# SKATGO-190 acceptance checks
1. `tmp/compare.mjs` on the ticket DB holding the owner's production records and decks: old and new query give the same
   dealer, deck, AI summary and entries for every deal; the specs' size drops by an order of magnitude.
2. `tmp/pad.mjs`, production build on 55190, desktop and phone: 20 rows, ≥ 16px between the vs AI score and the list's
   right edge.
