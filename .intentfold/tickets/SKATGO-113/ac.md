# SKATGO-113 ac

在本地构建版（55113）上用 HTTP 请求和 Playwright 检查，不跟随跳转、看状态码和 `Location`：

1. **非德语浏览器：** `Accept-Language: en-US` 和 `fr-FR` 各请求一次 `/?utm_source=test`，得到 307，`Location` 是 `/en?utm_source=test`。再用英语浏览器打开，最终落在英文首页，地址带 `utm_source=test`。
2. **德语和没有语言：** `Accept-Language: de-DE` 和不带语言头各请求一次 `/`，得到 200、`<html lang="de">`。
3. **保存的选择优先：**
   - 英语浏览器加 cookie `PARAGLIDE_LOCALE=de` → 200 德文；
   - 德语浏览器加 cookie `PARAGLIDE_LOCALE=en` → 307 到 `/en`；
   - 再用浏览器实际点一次页头的语言切换确认。
4. **SEO：** `check:seo -- --built` 和 `test:seo` 通过：两个首页都可收录、互相标注语言版本；新的首页规则也在检查里。
