# SKATGO-102 plan

1. `make-backs.mjs`：从下载的素材包画出 34 个牌背，500×700，用 cwebp 转成 WebP，放进 `app/public/cards/backs/`，附 `LICENSES.txt`。
2. `lib/skat/backs.ts`：牌背列表、默认值、图片地址、判断存的选择是否还有效。
3. `settings.ts`：`back` 设置，默认 `k5-logo`；`useBack()`（服务器端和首次渲染用默认值，挂载后用存的选择）。
4. `playing-card.tsx`：牌背图片随设置；新牌背铺满整张牌，原来的炭黑花纹保留白框。
5. `frame.tsx`：设置里在「Kartenblatt」后加「Kartenrücken」，缩略图网格；新令牌 `dims.backChoices`。
6. 使用条款（德英）加出处，`LEGAL_UPDATED` 改为 2026-10-14。
7. charter 同步。
