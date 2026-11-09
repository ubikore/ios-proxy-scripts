# iOS Proxy Scripts

iOS 代理工具的重写配置与脚本。目前提供 Quantumult X 的 Reddit 与虎扑去广告订阅。

## 订阅

| App | 功能 | 客户端 | 重写订阅 |
| --- | --- | --- | --- |
| Reddit | 过滤信息流广告，并拦截独立 Ads 请求；支持 JSON 和 GraphQL multipart 响应 | Quantumult X | [RedditAds.conf](https://raw.githubusercontent.com/ubikore/ios-proxy-scripts/main/rewrite/QuantumultX/RedditAds.conf) |
| 虎扑 | 为 goblin 开屏广告接口返回空广告数据，避免拒绝请求造成等待 | Quantumult X | [HupuSplashAds.conf](https://raw.githubusercontent.com/ubikore/ios-proxy-scripts/main/rewrite/QuantumultX/HupuSplashAds.conf) |

复制上表所需订阅的链接，在 Quantumult X「重写 → 引用」中添加。例如 Reddit：

```text
https://raw.githubusercontent.com/ubikore/ios-proxy-scripts/main/rewrite/QuantumultX/RedditAds.conf
```

1. 开启 Quantumult X 的重写与 MitM，并安装、信任 MitM 证书。
2. 添加所需的 `.conf` 重写订阅。配置已声明对应 MitM 主机名并引用远程 JS，无需另外填写主机名或下载脚本。
3. 停用匹配同一接口的旧重写或拒绝规则，避免重复匹配。
4. 完全退出对应 App 后重新打开。后续更新时，在 QX 中更新重写资源及脚本缓存。

`.conf` 是订阅入口，`.js` 是它调用的处理脚本。不要把 JS 地址作为重写订阅导入。

## 目录

```text
ios-proxy-scripts/
├── README.md
├── rewrite/
│   └── QuantumultX/
│       ├── HupuSplashAds.conf
│       └── RedditAds.conf
├── scripts/
│   ├── hupu-splash-adblock.js
│   └── reddit-adblock.js
└── tests/
    └── reddit-adblock.test.cjs
```

- `rewrite/<客户端>/`：按客户端存放重写配置，声明匹配规则、脚本地址和 MitM 主机名。
- `scripts/`：存放脚本源码。配置通过 GitHub Raw 地址引用对应文件。
- 今后新增 App 时，添加对应配置和脚本，并在上方订阅表登记；新增客户端时，在 `rewrite/` 下建立对应目录。
- 修改文件路径时，同步修改配置中的脚本 URL 和 README 中的订阅链接。

## Reddit 脚本说明

当前版本：`v1.2.0`（2026-11-08）。过滤广告条目，并按原规则的行为，对请求头 `X-APOLLO-OPERATION-NAME` 中名称包含 `Ads`（不区分大小写）的操作返回空对象。此类独立广告请求可能不含 `edges`，旧版实现遗漏了这项处理。请求头名称同样按大小写不敏感读取。不修改会员状态或 NSFW 偏好。

已通过原抓包离线回放：33 个匹配响应中删除 2 条广告，保留 33 个正常条目及分页数据；另验证了 JSON、multipart 分段边界、异常输入与广告标记变体。尚未在 iPhone / Quantumult X 内实测，效果可能随 Reddit 接口变化而改变。

帖子页独立 Ads 请求的回归测试使用合成数据；现有抓包不包含帖子页广告响应，仍需手机端验证。运行本地回归测试：

```sh
node --test tests/reddit-adblock.test.cjs
```

## 虎扑脚本说明

当前版本：`v1.0.0`（2026-11-09），根据用户提供的「虎扑开屏不白屏」规则转换为 QX 格式，仅处理 `goblin.hupu.com/<数字>/<版本>/interfaceAd/getOther` 开头的开屏广告接口。

订阅使用 `script-echo-response`，直接返回 HTTP 200 和有效 JSON：

```json
{"ad_code":-41,"show_type":0,"ads":[]}
```

此方式无需等待上游广告响应，因此没有移植原规则中的 `DIRECT` 分流项。MitM 主机名已包含在订阅中。请停用针对该接口的旧拒绝规则；如果域名已在 DNS 或分流层被拦截，也需解除对应拦截。

已验证 URL 匹配范围、HTTP 状态及 JSON 输出。尚未通过真实虎扑抓包或手机端测试验证“不白屏”效果；不包含帖子、信息流等其他广告的处理。

## 参考

目录组织参考以下项目，按本仓库规模采用配置与脚本分开的结构：

- [app2smile/rules](https://github.com/app2smile/rules)：分别组织 JS、模块和插件。
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)：分别组织重写配置、脚本和分流规则。
- [ddgksf2013/Rewrite](https://github.com/ddgksf2013/Rewrite) 与 [ddgksf2013/Scripts](https://github.com/ddgksf2013/Scripts)：分别维护重写配置与脚本。

Reddit 原规则参考：[@ddgksf2013 的 RedditAds.conf](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/RedditAds.conf)。本仓库使用独立可读实现，增加 JSON / GraphQL multipart 响应处理；源码中保留了原规则参考说明。
