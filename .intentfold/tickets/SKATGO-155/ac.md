# SKATGO-155 acceptance checks

1. 1280×820 and 375×812 /en/play: each face box's computed background is `color.board` (rgba(0, 0, 0, 0.32)), the
   felt shows through (screenshot).
2. Face box size and place as on main (85px at 72px top on desktop, 68px on a phone), no intersection with cards, the
   info board or buttons (`getBoundingClientRect`).
