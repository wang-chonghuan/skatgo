# SKATGO-167 plan

Found: the faces are `/faces/{lina|noah}-{neutral|laugh|sad}.webp`, chosen by seat in `SeatFace`; the settings store
keeps the faces switch; the card-back picker in the settings is the visual pattern for choosing by picture.

1. Pictures: SKATGO-147's method — Azure `gpt-image-2` edits in Lina's and Noah's own flat sticker style (the human,
   after a first try in clay and inked comic: 「画风必须一致」): four new people, two women and two men; neutral from the
   style sample with Lina and Noah, laugh and sulk from the sample, Lina and the neutral; 192px WebP into
   `app/public/faces/`.
2. `face.ts`: `AVATARS`, defaults, `faceSrc`. `settings.ts`: `avatars` per seat, `useAvatar`. `SeatFace` wears it.
3. Settings: under the avatars switch, Lina's and Noah's rows of all six pictures, chosen ringed as the backs.
4. Charter `ui.md`.
