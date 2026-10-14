# SKATGO-104 AC check plan

1. **Both flags visible, header fits** — playwright at 1280×820, 375×812 and 320×640 on `/en` and `/`:
   two radios in the header's language group are visible; the header's right edge is inside the
   viewport (no horizontal overflow, no wrap: header height unchanged).
2. **English flag is the diagonal US/UK flag** — screenshot of the flag group zoomed; read it.
3. **Highlight and switching** — on `/en/course` the English radio is `aria-checked=true`, opacity 1
   with a green outline; the German radio's opacity is about 0.4. Click German → the URL becomes
   `/de/kurs`, German radio checked and ringed. Screenshot both states on the phone.
