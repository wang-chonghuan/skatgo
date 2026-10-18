# SKATGO-114 ac

在本地构建版（55114）上用 Playwright 检查，德文页一并确认没有变：

1. **英文首页：** `/en` 的 `<title>` 和 `h1` 都含「Skat card game」（不分大小写），`<title>` 含「free」和「online」。
2. **5 分钟上手页：** `/en/course/skat-in-5-minutes` 的 `<title>` 以「How to play Skat」开头（不分大小写）。
3. **charter：** product.md 不再有「Germany is the primary market」和 1% 的说法，写明首攻市场、相邻市场、德国的位置和「两周内 30% 在 3 个不同的日子回来」的标准。
4. **SEO：** `check:seo -- --built` 和 `test:seo` 通过：可收录、规范地址、语言版本互标、标题和描述全站唯一。
