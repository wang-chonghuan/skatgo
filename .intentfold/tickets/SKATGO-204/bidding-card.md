# The bidding practice's picture card (app/public/bidding-card.webp)

Azure OpenAI gpt-image-2, 1536x1024, quality high, generated 2026-11-17T17:14:40.526499+00:00 with
app/public/practice-card.webp as the only style reference (n-azure generate_image.py). Cut 30 px from the top and
40 px from the bottom, padded with white to 16:9 (sips), resized to 612x344 and saved as WebP q82 (cwebp).

## Prompt

A flat vector illustration in exactly the drawing style of the reference picture: clean flat shapes, soft warm colours, thin dark outlines on hands and faces, no gradients, no texture, plain white background with one soft light-beige ellipse on the floor under the table. The reference only shows the style; its people do not appear.

Scene: two different people sitting at a small round wooden table during the bidding of a card game. On the left, a woman of about fifty with a short dark-brown bob and small earrings, in a teal blouse, holding a fan of ten playing cards close to her chest, looking at the other player with a thinking smile. On the right, a young man of about twenty-five with curly black hair and a light-brown skin, in a mustard-yellow sweater, holding his own fan of cards in one hand and raising the other hand with the index finger up, as if naming a number. Above and between them a single white rounded speech bubble with only the number "18?" in it. Two face-down cards lie in the middle of the table. Wooden chairs like the reference. Wide horizontal composition, the whole scene centred with white space around it, nothing cut off. No other text, no logos.

# The League's tier pictures (app/public/league/<tier>.webp)

Azure OpenAI gpt-image-2, 1536x1024, quality high, the same style reference; cropped to x 256–1536 (5:4), resized to
480x384, WebP q80. One prompt with the colour and emblem per tier:

A flat vector illustration for a game tier card, in the flat drawing style of the reference picture: clean flat shapes, no gradients, no texture, no outlines on the background. The reference only shows the drawing style; draw none of its people or objects. The whole picture is filled edge to edge with one solid deep background colour: <colour>. In the upper right part stands one large emblem: <emblem>, with a few small flat sparkles around it. The lower left third of the picture stays plain background colour, empty, for text to be placed later. No text, no letters, no numbers, no frame, no border.

- bronze
- silver
- gold
- platinum
- diamond
- legend
