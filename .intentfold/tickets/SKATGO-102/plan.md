# SKATGO-102 plan（最终）

1. `app/brand/cards/generate.sh` 加 kind `back2`，提示词 `prompts/_back2.txt` 和 `prompts/back-{charcoal,navy,burgundy,green}.txt`；生成的原图在 `masters/back-*.webp`，生成参数在旁边的 `.png.json`，每次调用记在 `calls.txt`，出处说明在 `PROVENANCE.md`。
2. `.intentfold/tickets/SKATGO-102/make-backs.mjs`：把原图转成 500×700（5:7），在中间圆章贴同色 logo，输出到 `app/public/cards/backs/`。
3. `lib/skat/backs.ts`：牌背列表（原版和四种新的），默认原版。
4. `settings.ts` 加 `back` 和 `useBack()`；`playing-card.tsx` 按设置画牌背，都在白框里。
5. `frame.tsx` 设置里加「Kartenrücken」缩略图（新令牌 `dims.backChoices`）。
6. charter：ui.md 的牌背描述，engineering.md 加一行牌背文件。
