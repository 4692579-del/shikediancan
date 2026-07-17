# AI Code Review 报告

审查日期：2026-07-17

审查对象：食刻点餐 uni-app 项目

审查工具：AI 辅助静态代码审查 + 本地构建验证

## 1. 审查范围

本次 Code Review 重点检查以下内容：

- 前端页面与组件结构：`src/pages`、`src/components`
- 前端业务工具封装：`src/utils`
- uniCloud 云函数：`uniCloud-alipay/cloudfunctions`
- 数据库 schema：`uniCloud-alipay/database`
- 项目文档：`README.md`、`API.md`
- 构建配置：`package.json`、`vite.config.js`

## 2. 项目总体评价

项目功能完整度较高，已经从早期前端模拟数据逐步升级为 uniCloud 后端化实现。当前代码覆盖点餐类项目的核心链路，包括商品浏览、购物车、订单、支付模拟、评价、地址、收藏、优惠券、会员和钱包等模块。

代码目录结构清晰，前端页面、工具函数、云函数和数据库 schema 分层明确；云函数数量和接口 action 数量明显超过课程要求的“至少 3 个 API 接口”。Git 提交记录也能体现持续迭代过程。

本次本地执行 `pnpm run build:h5`，H5 构建成功。

## 3. 主要优点

### 3.1 业务链路完整

项目已实现从首页浏览、商品详情、加购、结算、模拟支付、订单状态流转到评价的完整点餐流程。个人中心也补充了地址、收藏、优惠券、会员、钱包、设置、多语言和适老模式等功能。

### 3.2 后端接口覆盖充分

项目包含 8 个 uniCloud 云函数：

- `user-auth`
- `user-profile`
- `product-service`
- `order-service`
- `address-service`
- `favorite-service`
- `benefit-service`
- `wallet-service`

这些云函数通过 `action` 区分具体接口能力，接口数量和功能覆盖面均满足课程要求。

### 3.3 数据库设计较完整

`uniCloud-alipay/database` 中已包含用户、店铺、商品、分类、购物车、订单、地址、收藏、优惠券、会员、会员订单、钱包、钱包优惠和钱包充值订单等 schema，数据模型与业务模块基本对应。

### 3.4 前后端调用封装统一

前端通过 `src/utils/cloud.js` 封装 uniCloud 初始化和云函数调用，各业务模块再通过 `product-backend.js`、`order-backend.js`、`wallet.js` 等文件进行二次封装，降低了页面层直接操作云函数的复杂度。

### 3.5 文档已有基础

当前已补充 `README.md` 和 `API.md`。其中 `API.md` 单独列出了云函数、主要 action、参数和调用示例，有利于老师验证后端接口。

## 4. 发现的问题与风险

### P1：README 中仍出现云空间密钥字段示例

位置：`README.md:87-88`

当前 README 的 uniCloud 配置示例中仍出现：

```js
accessKey: '你的 accessKey',
secretKey: '你的 secretKey'
```

虽然这是占位符，不是真实密钥，但公开文档中直接引导填写 `accessKey` 和 `secretKey` 容易造成误解，也不利于体现安全意识。建议改为只展示 `provider`、`spaceId`、`spaceAppId` 等必要标识，并补充说明真实密钥不应提交到公开仓库，云函数上传和部署建议通过 HBuilderX 或 uniCloud 控制台完成。

建议处理优先级：高。

### P1：登录 token 目前更偏展示态，缺少服务端鉴权闭环

位置：`uniCloud-alipay/cloudfunctions/user-auth/index.js:44`

登录成功时会生成随机 token：

```js
token: crypto.randomBytes(16).toString('hex')
```

但从当前云函数调用方式看，后续业务接口主要依赖前端传入的 `userId` 或 `uid` 识别用户，例如：

- `uniCloud-alipay/cloudfunctions/order-service/index.js:22`
- `uniCloud-alipay/cloudfunctions/order-service/index.js:243-244`
- `uniCloud-alipay/cloudfunctions/wallet-service/index.js:24`
- `uniCloud-alipay/cloudfunctions/wallet-service/index.js:509-510`

这对课程项目和演示项目可以接受，但如果作为真实业务，需要在服务端校验 token/session，避免用户伪造其他用户的 `userId` 操作订单、地址、钱包等数据。

建议处理优先级：高。

### P2：缺少自动化测试

位置：`package.json:5-7`

当前 `scripts` 只有：

```json
"dev:h5": "uni -p h5",
"build:h5": "uni build"
```

仓库中没有发现单元测试、接口测试或端到端测试文件。项目功能模块较多，订单、钱包、会员、优惠券等模块存在较多状态流转，后续继续迭代时容易出现回归问题。

建议补充：

- 云函数核心逻辑测试：登录、订单创建、支付、取消、评价、钱包支付。
- 前端工具函数测试：金额计算、倒计时、缓存同步、会员权益计算。
- 最低限度增加一份手工测试清单，作为课程提交材料的一部分。

建议处理优先级：中。

### P2：部分敏感业务过度依赖前端传参

位置：

- `uniCloud-alipay/cloudfunctions/order-service/index.js:243-244`
- `uniCloud-alipay/cloudfunctions/wallet-service/index.js:509-510`

订单、钱包、会员等接口通过前端传入 `userId` 判断用户身份。若没有配套 token 鉴权，这类接口在真实环境中会存在越权风险。

建议后续将登录态与用户身份绑定，例如：

- 登录后在服务端保存 token/session。
- 云函数统一读取并校验 token。
- 业务函数只使用服务端解析出的用户身份，不直接信任前端传入的 `userId`。

建议处理优先级：中。

### P2：缺少统一的错误码文档

当前各云函数已有 `code` 和 `message` 返回结构，但错误码没有集中整理。例如登录、订单、钱包分别维护自己的错误码。建议在 `API.md` 中增加“错误码说明”小节，列出常见错误码和含义，方便测试和验收。

建议处理优先级：中。

### P3：部分数据仍保留本地缓存兼容逻辑

位置：`src/utils/store.js`

项目已经大量后端化，但 `store.js` 中仍保留地址、购物车、订单、收藏等本地缓存初始化和兼容逻辑。该设计有助于提升前端体验和兼容旧数据，但也需要注意云端数据与本地缓存不同步时的展示问题。

建议在 README 或开发说明中解释：

- 哪些数据以云端为准。
- 哪些数据仅作为本地缓存。
- 离线或接口失败时页面如何兜底。

建议处理优先级：低。

## 5. 建议优化清单

| 优先级 | 建议 | 目的 |
| --- | --- | --- |
| 高 | 移除 README 中 `accessKey` / `secretKey` 示例 | 避免公开文档误导填写密钥 |
| 高 | 为云函数增加 token/session 鉴权 | 防止伪造 `userId` 访问他人数据 |
| 中 | 增加自动化测试或手工测试清单 | 降低订单、钱包、会员等流程回归风险 |
| 中 | 在 `API.md` 补充错误码说明 | 提升接口文档完整度 |
| 中 | 统一云函数返回结构 | 方便前端统一处理错误和提示 |
| 低 | 说明本地缓存与云端数据的边界 | 方便项目复现和维护 |

## 6. 已验证内容

本地执行：

```bash
pnpm run build:h5
```

结果：构建成功，输出 `DONE Build complete.`。

## 7. AI 审查结论

该项目已经具备较完整的课程实训交付基础：功能链路完整，后端云函数数量充足，数据库 schema 较全，文档也已补充到可验收状态。

当前最建议优先处理的是文档中的密钥字段示例和服务端鉴权说明。对于课程演示项目而言，不一定需要完全实现生产级鉴权，但至少应在文档中说明“当前为课程模拟项目，真实上线需补充 token/session 鉴权、权限校验和测试覆盖”。这样既能体现项目当前能力，也能体现工程化风险意识。
