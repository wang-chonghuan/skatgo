# SKATGO-239 acceptance checks

1. Dark ground — running product, a League table (Playwright, no deal played): both opponent boxes show the person on the
   box's dark ground, no light tint; screenshot beside free play's at the same size.
2. Smaller — the same screenshot against SKATGO-238's: the person drawn smaller in the box; the boxes' places and sizes
   measured equal to free play's at 844×390, 390×844 and 1440×900.
3. Elsewhere unchanged — the round drawing's SVG (no `?square`) is byte-identical before and after; forum unit tests pass.
