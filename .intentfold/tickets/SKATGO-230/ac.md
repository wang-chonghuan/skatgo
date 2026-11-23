# SKATGO-230 AC 检查方案（web 55230；有头 Chromium；tmp/ac.mjs）
1. 8 页各有 `/compare/brands/<brand>.webp`，加载成功，说明含网站名和 2026。
2. 8 页各有"打开网页就能玩"块：`/compare/table-<lang>.webp` 加载成功，写有"Kein Konto"/"No account"，按钮指向 `/de` 或 `/en`。
3. 对比表第一行是"Spielen ohne Anmeldung"，SkatGo 一栏写"Seite öffnen"；页面无负面词、无外链。
4. 1280、375、360 px 无横向滚动。
5. 上线后重新提交收录（关单时记录）。
