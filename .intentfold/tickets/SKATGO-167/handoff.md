# SKATGO-167 handoff

## What changed

- **Four new faces** in Lina's and Noah's own flat sticker style (after 「画风必须一致」 stopped a first try in clay and
  inked comic, and 「不要老奶奶，要年轻黑发性感女」 replaced a silver-haired woman): `woman-wavy` (long wavy black hair, red
  lips, gold hoops, white top), `man-beard` (curly hair, beard, purple hoodie), `woman-fringe` (straight black hair with a
  fringe, coral jumper), `man-cap` (grey moustache, flat cap, red waistcoat) — calm, laughing, sulking each; Azure
  `gpt-image-2` with the approved style sample and Lina and Noah as references, as SKATGO-147 made them; 192px WebP in
  `app/public/faces/` (9–14 KB). Sources and prompts in `.intentfold/tmp/SKATGO-167/faces2/`.
- `face.ts` — `AVATARS`, `DEFAULT_AVATAR`, `faceSrc`. `settings.ts` — `avatars` per seat, `useAvatar` (defaults until
  mounted). `game-table.tsx` `SeatFace` wears the seat's avatar.
- `frame.tsx` settings — under the avatars switch, "Lina" and "Noah" each over a row of all six calm pictures, the
  chosen one ringed green as the card back is. `dims.faceChoices`; messages `settings_face_for`, `settings_face_option`.
- Charter `ui.md`: the faces paragraph.

## AC results

`tmp/accept.mjs` → `tmp/accept.txt`, 32 PASS, free play at 1280×820 and 375×812, en and de, no game played.
1. Settings: two radiogroups of six loaded pictures, lina / noah checked by default — pass.
2. Lina's seat woman-wavy, Noah's seat woman-fringe: the table's three pictures per seat are those avatars', loaded —
   pass (`tmp/shots/*-table.png`).
3. A woman's face on Noah's seat — pass (2).
4. Reload keeps the choice; a fresh browser wears lina / noah — pass.
5. Faces switched off: none at the table — pass.
6. No sideways scroll, no page errors — pass.

Mechanical defence: pass (`tmp/defence.log`, 322 tests, SEO). After it only `woman-glasses` → `woman-wavy` changed (one id,
three pictures); typecheck, build and tests rerun, the check above rerun.

## Deviations

- The first pictures (clay, inked comic) were dropped for the existing style; the silver-haired woman for a young one.

## Environment

Ports: web 55167, multiplayer 56167, database 57167. No env keys changed.

## Residual

None.

## Check

1. The six faces side by side (sheet) — whether the four new people fit beside Lina and Noah.
2. Settings → Avatars on the phone: the two rows, choosing one.
3. The table with a chosen face, in play: laughing and sulking.

## Decided for you

- 「两套头像，一男一女」 read as two sets, each a woman and a man: four new faces, six to choose from.
- Each seat chooses from all six; the names stay Lina and Noah.
- The young woman's top is white, not black, so it shows against the dark avatar box.
