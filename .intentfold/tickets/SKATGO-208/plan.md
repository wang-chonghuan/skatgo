# SKATGO-208 plan

Found in the code: the Bidding panel's name (`auctionHead`, game-table.tsx) already ends in an ellipsis, but its column
(`auctionCol`) is a grid item in `repeat(3, 1fr)`; a grid item's automatic minimum width is its content, so a long name
widens its `1fr` column and pushes the third column out of the panel.

Route (the ticket's proposed solution, as it stands): `auctionCol` gets `minWidth: 0`. The three columns stay equal thirds
of the panel whatever the names, and `auctionHead`'s ellipsis takes effect. No token, no copy, no charter change (ui.md
already has the columns equal; nothing there describes a wider one).
