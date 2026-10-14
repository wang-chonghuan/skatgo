# Where the playing cards' pictures come from

SKATGO-66, generated 2026-10-09.

## What is here

- `masters/`: the original images as the model returned them, transparent except the back.
  - Each is stored as lossless WebP (`cwebp -lossless -exact`), pixel for pixel the model's PNG; this was checked for all 33.
  - The PNGs themselves (69 MB) are not in git. They stay on the machine that made them, in the repository's ignored `.intentfold/tmp/card-masters-png/`.
  - Beside each master is `<name>.png.json`: the full prompt, size, quality, background, the reference images used, the model, the time, and the PNG's byte size and SHA-256. It holds no credential and no endpoint.
- `prompts/`: the prompt parts.
  - `_style.txt`: shared by every image.
  - `_court-top.txt`, `_full.txt`, `_symbol.txt`, `_back.txt`: one per kind of image.
  - `<name>.txt`: each image's own subject.
  - `generate.sh` joins them in that order.
- `calls.txt`: every call to the model, including failed ones (Azure server errors), in order.
- `generate.sh`: the command that made each image.

The served files in `app/public/cards/` are cut from `masters/` by `app/scripts/make-card-images.mjs`.

## Tool

- Model: Azure OpenAI `gpt-image-2` (version 2026-04-21), deployment `gpt-image-2` on the Azure OpenAI resource the product's assistant also uses.
- Calls go through the n-azure skill's `generate_image.py`: a direct call, quality `high`, sizes 1536×1024 (court tops), 1024×1536 (Daus, back) and 1024×1024 (symbols). The key comes from the local credential file and is never in this repository.

## Process

1. **Style samples** of both decks' Herz courts. The human asked for less empty space and for colours not dominated by red. The prompts were then rewritten from scratch, and the six samples regenerated without reference images. The human approved them on 2026-10-09.
2. **The other 27 images**, with the approved samples as style references:
   - French courts: `french-H-K.png` and `french-H-J.png`;
   - German courts: `german-H-K.png` and `german-H-O.png`;
   - Daus and symbols: `german-H-O.png`.
   The prompts tell the model to match the samples' style and not to copy their figures.

## Originality

The figures are drawn fresh in the spirit of the traditional patterns: the French-suited pattern Skat players in Germany use, and the German-suited Saxon pattern. Traditional card patterns are not protected; specific artwork is.

- No existing commercial deck (for example ASS Altenburger's, or piksieben.de's drawings) was given to the model, copied or traced.
- The only reference images ever passed to the model are this ticket's own approved samples.
- Every prompt asks for an original drawing and forbids copying or tracing any existing deck.

The corner letters are not pictures: they are outlines of Bebas Neue (SIL Open Font License), see `app/scripts/extract-card-glyphs.py`.

## More backs (SKATGO-102)

Four more backs in the earlier back's style, generated 2026-10-14 with the same model and helper: `generate.sh back-<colour> back2`, where `prompts/_back2.txt` asks for the same kind of ornament, less dense (the human: 「不要太细密，否则有密集恐惧症，但是也不要留白」), edge to edge, with a small empty medallion in the middle, and `prompts/back-<colour>.txt` names its two colours: charcoal and white, navy and white, burgundy and white, forest green and gold. The masters are `masters/back-{charcoal,navy,burgundy,green}.webp`, each with its request beside it. `.intentfold/tickets/SKATGO-102/make-backs.mjs` cuts them to the card's 5:7 and puts the SkatGo logo into the medallion in the back's own other colour, small (「不要彩色，要和牌背一致，这样低调不夸张」).
