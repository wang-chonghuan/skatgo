# SKATGO-239 plan

Found: the League table's avatars are the square variant of the forum's drawing (`/api/forum/avatar/a4/<seed>.svg?square`,
SKATGO-238): DiceBear Avataaars with radius 0 on the light `avatarGrounds` tints, filling free play's face box, whose own
ground is the dark see-through `color.board`. Only the League table asks for `?square`.

Route: the square variant draws no ground (`backgroundColor: transparent`), so the box's dark square shows as behind
Lina and Noah, and draws the person smaller (`scale` 80) and lower (`translateY` 10) so the shoulders still meet the
box's foot. The box (place and size) is untouched, keeping SKATGO-238's alignment with free play. Charter ui.md.
