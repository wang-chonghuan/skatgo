# SKATGO-246 acceptance checks

1. Faces at a private table — :55246, two test accounts (A with an uploaded-free drawn look, B), A opens a room, gives one seat to the computer, B comes in, A starts: both A's and B's tables show `skat-face-1` and `skat-face-2` with `data-face="still"`; screenshot compared with a League table's boxes (same place and size). True when both faces are present and the boxes match.
2. A person's own avatar — A sets a new look in /profile before the room; B's table shows A's picture URL with A's seed (`?square`). True when the src carries A's face.
3. Computer and newcomer — the computer's seat shows the drawing of its name; a third account C comes in mid-game taking the computer's seat: from then on that seat's face is C's. True when the src changes to C's.
4. Other tables unchanged — free play shows Lina/Noah stickers with expressions (`data-face` neutral/laugh/sad); League still shows still faces; daily table none, as before.
