# SKATGO-167 rework

Against the frozen handoff (9305f18). Three rounds, one commit each.

1. 「fringe那个改为35岁左右的金发的office lady」 (d2fc959) — `woman-fringe` replaced by `woman-office`, a blonde office lady of
   about 35 (camel blazer, white blouse). Rechecked: `tmp/accept.mjs`, 32 PASS.
2. 「你他妈的画的脸都是一样的，就头发和衣服换一下」 (900f835) — the cause: the new faces had been generated with Lina's and
   Noah's faces as references and a prompt asking for the same eyes, mouth and proportions. All four redrawn: the style
   sample the only reference for each calm face, each face described on its own (shape, eyes, nose, mouth, jaw, age),
   the references' faces excluded; laugh and sulk from the person's own calm face (`.intentfold/tmp/SKATGO-167/faces3/`).
   The calm faces compared beside Lina and Noah before the expressions were made. Rechecked: 32 PASS.
3. 「wavy改为印度风格的美女」 (a59b394) — `woman-wavy` replaced by `woman-indian` (kohl, nose stud, bindi, jasmine braid,
   jhumkas, magenta saree), made the same way. Rechecked: 32 PASS.

Net effect against the handoff: the four new faces are four different people — a young Indian woman, a bearded man, a
blonde office lady, an older man in a cap — in Lina's and Noah's style; the picker and the table unchanged.
