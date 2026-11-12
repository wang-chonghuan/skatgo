# SKATGO-188 Grill

没有问题达到需要问人类的门槛（错了代价高、记录里没有答案、不能做出来给人看，三条同时满足），以下全部由 agent 决定。

## Decided for you

1. **什么时候提交：发布后脚本，还是服务启动时自动提交？**
   决定：发布后脚本，写进 operations.md 发布后步骤。
   依据：工单 Proposed solution；Render 每次重启都会触发启动逻辑，重复提交同一批网址；本项目的发布本来就是 agent 按 operations.md 显式执行的，加一条命令即可，改起来也便宜。

2. **每次提交全部 sitemap 网址，还是只提交改过的？**
   决定：全部（目前 62 个，远低于 IndexNow 单次 10,000 的上限）。
   依据：一次发布改的往往是公共布局，哪些页面“变了”无法可靠判断；sitemap 没有 lastmod 可用。以后要改成只交变更，只动脚本一处。

3. **密钥算不算凭据（engineering.md Redline 1 禁止提交凭据）？**
   决定：不算，密钥文件提交进仓库。
   依据：IndexNow 协议要求密钥公开放在站点根目录（任何人都能读 `/<密钥>.txt`），它证明的是“这个站点的主人发起了提交”，不是访问任何账号的口令；换成环境变量也一样要公开发布。

4. **提交到哪个接口？**
   决定：`https://api.indexnow.org/indexnow`。
   依据：IndexNow 的公共入口，会转发给所有参与的引擎（Bing、Yandex、Seznam、Naver 等），和工单 Request 里“Yandex、Seznam 也会同步收到”一致。

5. **论坛 sitemap 读不到（503）或是空的时怎么办？**
   决定：读不到（非 200）时脚本以非 0 退出，什么都不提交；论坛没有可收录的帖子时 sitemap 是空的，这是正常状态，照常提交其余网址；两个 sitemap 合起来一个网址都没有才算失败。
   依据：engineering.md Guidance「No fake progress」，部分提交会让人以为全部交了；本地新库没有帖子时论坛 sitemap 就是空的（开发中实测）。

6. **怎么判断是不是生产，避免本地/预览误发？**
   决定：所给站点的主机名等于 sitemap 网址的主机名才发送，否则只列出不发。
   依据：sitemap 网址恒为 `SITE_URL`（`app/src/lib/origin.ts`），预览站的主机名是 127.0.0.1，天然不相等；不需要在脚本里再写一遍域名。

7. **AC3 在生产上提交，是否违反 operations.md Redline 2（验收检查不得改动外部或生产数据）？**
   决定：不违反。AC3 读的是正常发布步骤那次提交的结果，不为验收额外提交。
   依据：提交本身就是本单要加的发布步骤；验收只读脚本输出和 Bing 站长工具。

8. **本地怎么验收 AC2（需要论坛 sitemap）？**
   决定：按 operations.md Tools 在本单端口起本地数据库（57188）和 multiplayer（56188），web 用生产构建跑在 55188。cap4 时清理本单建的本地容器。
   依据：operations.md「Run locally / Build and tests」；论坛 sitemap 只能由 multiplayer 应答。
