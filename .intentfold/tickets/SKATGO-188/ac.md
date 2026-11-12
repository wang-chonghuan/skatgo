# SKATGO-188 验收

## AC1 密钥文件
- 做法：在预览站（web 55188，`npm run build` 后用生产服务器启动）上 `curl -s -o body -w '%{http_code}' http://127.0.0.1:55188/<密钥>.txt`。
- 通过：状态码 200，正文与密钥逐字相同（不多空白、不多换行以外的内容）。

## AC2 预览上只列不发
- 做法：`node app/scripts/indexnow.mjs http://127.0.0.1:55188`；同时数预览站两个 sitemap 的 `<loc>` 总数。为确认没发请求，用 `node --import tmp/guard.mjs` 运行，非本机的 fetch 一律拦下并记失败。
- 通过：脚本列出的网址数量等于两个 sitemap 的 `<loc>` 总数，退出码 0，没有向 IndexNow 发出请求（用 `tmp/guard.mjs` 拦截一切非本机请求，拦到即失败）。顺带观察：停掉 multiplayer 时 sitemap-forum.xml 返回 503，脚本以非 0 退出。

## AC3 生产提交（发布后验证）
- 做法：合并并按 operations.md 发布后，运行发布后步骤里的 `node app/scripts/indexnow.mjs https://skatgo.com`（这就是正常的发布步骤，不是额外为验收做的提交）；然后在 Bing 站长工具的 IndexNow 页查看。
- 通过：脚本打印 IndexNow 返回 200 或 202；Bing 站长工具 IndexNow 页出现 skatgo.com 的提交记录。
