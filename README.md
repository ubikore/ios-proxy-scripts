# iOS Proxy Scripts

iOS 代理工具的重写配置与脚本。目前提供 Quantumult X 的 Reddit 去广告订阅。

## 订阅

| App | 功能 | 客户端 | 重写订阅 |
| --- | --- | --- | --- |
| Reddit | 删除信息流中的广告条目，支持 JSON 和 GraphQL multipart 响应 | Quantumult X | [RedditAds.conf](https://raw.githubusercontent.com/ubikore/ios-proxy-scripts/main/rewrite/QuantumultX/RedditAds.conf) |

复制以下地址，在 Quantumult X「重写 → 引用」中添加：

```text
https://raw.githubusercontent.com/ubikore/ios-proxy-scripts/main/rewrite/QuantumultX/RedditAds.conf
```

1. 开启 Quantumult X 的重写与 MitM，并安装、信任 MitM 证书。
2. 添加上面的 `.conf` 重写订阅。配置已声明 `gql-fed.reddit.com` 并引用远程 JS，无需另外填写主机名或下载脚本。
3. 如果此前启用了其他 Reddit 去广告规则，请停用，避免重复匹配。
4. 完全退出 Reddit 后重新打开。后续更新时，在 QX 中更新重写资源及脚本缓存。

`.conf` 是订阅入口，`.js` 是它调用的处理脚本。不要把 JS 地址作为重写订阅导入。

## 目录

```text
ios-proxy-scripts/
├── README.md
├── rewrite/
│   └── QuantumultX/
│       └── RedditAds.conf
└── scripts/
    └── reddit-adblock.js
```

- `rewrite/<客户端>/`：按客户端存放重写配置，声明匹配规则、脚本地址和 MitM 主机名。
- `scripts/`：存放脚本源码。配置通过 GitHub Raw 地址引用对应文件。
- 今后新增 App 时，添加对应配置和脚本，并在上方订阅表登记；新增客户端时，在 `rewrite/` 下建立对应目录。
- 修改文件路径时，同步修改配置中的脚本 URL 和 README 中的订阅链接。

## Reddit 脚本说明

当前版本：`v1.1.0`（2026-11-08）。只删除广告条目，不修改会员状态或 NSFW 偏好。

已通过原抓包离线回放：33 个匹配响应中删除 2 条广告，保留 33 个正常条目及分页数据；另验证了 JSON、multipart 分段边界、异常输入与广告标记变体。尚未在 iPhone / Quantumult X 内实测，效果可能随 Reddit 接口变化而改变。

## 参考

目录组织参考以下项目，按本仓库规模采用配置与脚本分开的结构：

- [app2smile/rules](https://github.com/app2smile/rules)：分别组织 JS、模块和插件。
- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script)：分别组织重写配置、脚本和分流规则。
- [ddgksf2013/Rewrite](https://github.com/ddgksf2013/Rewrite) 与 [ddgksf2013/Scripts](https://github.com/ddgksf2013/Scripts)：分别维护重写配置与脚本。

Reddit 原规则参考：[@ddgksf2013 的 RedditAds.conf](https://github.com/ddgksf2013/Rewrite/blob/master/AdBlock/RedditAds.conf)。本仓库使用独立可读实现，增加 JSON / GraphQL multipart 响应处理；源码中保留了原规则参考说明。
