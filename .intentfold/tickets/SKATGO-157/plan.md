# SKATGO-157 plan

SKATGO-156 inset each dialog's scrolling body by the whole 24px padding, so a 24px blank strip stood right of the scroll
bar. Keep only 8px on the right of the box (and, for the table's framed dialog, 8px above its body, clear of the 21.6px
corner) and make up the content's 24px with the body's (and the `Modal` head's) right padding. `ui.tsx` `Modal`,
`game-table.tsx` `Dialog`; ui.md's `Modal` row. No tokens added.
