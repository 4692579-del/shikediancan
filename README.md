# 食刻点餐

食刻点餐是一个基于 uni-app、Vue 3 和 uniCloud 的点餐类课程实训项目。项目面向移动端点餐场景，覆盖从商品浏览、商品规格选择、加入购物车、提交订单、模拟支付、订单管理到评价反馈的完整业务流程，同时提供地址管理、收藏、优惠券、会员、食刻钱包、个人资料、设置、多语言、适老化和字号调整等扩展功能。

本项目用于《AI 辅助编程与工程化实训》课程展示，支付、钱包充值、提现、会员开通等交易相关能力均为课程设计中的模拟流程，不会发起真实扣款或真实资金结算。

## 线上部署地址

线上 Demo：

[https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/](https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/)

项目演示录屏见：[DEMO.md](./DEMO.md)。

## 课程提交材料

- 线上 Demo：[访问地址](https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/)
- 项目演示录屏：[DEMO.md](./DEMO.md)
- API 文档：[API.md](./API.md)
- Prompt 日志：[prompt_log.md](./prompt_log.md)
- AI Code Review 报告：[AI_CODE_REVIEW.md](./AI_CODE_REVIEW.md)
- 个人总结报告：[PERSONAL_SUMMARY.md](./PERSONAL_SUMMARY.md)
- 数据库、接口、AI Code Review 截图包：[截图包](./docs/screenshots/数据库、接口、AICodeReview截图包.zip)

## 主要功能

- 首页：门店信息、推荐商品、分类入口、搜索入口。
- 商品：商品列表、分类筛选、商品详情、规格选择、商品搜索。
- 购物车：加入购物车、修改数量、清空购物车、结算入口。
- 订单：创建订单、订单列表、订单详情、取消订单、完成订单、删除订单。
- 支付：微信/支付宝模拟支付、食刻钱包模拟支付、支付结果页。
- 评价：订单评价、商品评价列表、我的评价、删除评价。
- 地址：新增、编辑、删除、设置默认地址。
- 用户：注册、登录、切换账号、昵称和头像维护。
- 会员与优惠：优惠券、会员权益、会员订单。
- 钱包：开通钱包、余额、账单、充值、提现、支付密码。
- 设置：通知设置、账号安全、登录密码、钱包密码、个性化主题、语言、适老模式、字号。

## 技术栈

- 前端框架：uni-app、Vue 3
- 构建工具：Vite
- 国际化：vue-i18n
- 后端服务：uniCloud 云函数
- 云空间：Alipay 云空间
- 数据库：uniCloud database schema
- 包管理器：pnpm

## 目录结构

```text
.
+-- src
|   +-- components          # 公共组件
|   +-- pages               # 页面
|   +-- static              # 静态资源
|   +-- utils               # 前端业务工具和云函数调用封装
|   +-- App.vue
|   +-- main.js
|   +-- manifest.json
|   +-- pages.json
+-- uniCloud-alipay
|   +-- cloudfunctions      # uniCloud 云函数
|   +-- database            # 数据库 schema 与初始化数据
+-- package.json
+-- pnpm-lock.yaml
+-- vite.config.js
```

## 本地运行步骤

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 uniCloud

项目中的真实云空间配置文件 `src/utils/cloud-config.js` 未提交到仓库，需要先复制示例文件：

```bash
cp src/utils/cloud-config.example.js src/utils/cloud-config.js
```

Windows PowerShell 可使用：

```powershell
Copy-Item src/utils/cloud-config.example.js src/utils/cloud-config.js
```

然后在 `src/utils/cloud-config.js` 中填写自己的 uniCloud 云空间信息：

```js
export default {
  provider: 'alipay',
  spaceId: '你的 spaceId',
  spaceAppId: '你的 spaceAppId',
  accessKey: '你的 accessKey',
  secretKey: '你的 secretKey'
}
```

### 3. 上传数据库 schema 和云函数

使用 HBuilderX 或 uniCloud 控制台，将 `uniCloud-alipay/database` 中的数据库 schema 上传到云数据库，并上传 `uniCloud-alipay/cloudfunctions` 下的云函数。

数据库集合包括：

- `sk_users`
- `sk_shops`
- `sk_categories`
- `sk_products`
- `sk_carts`
- `sk_orders`
- `sk_addresses`
- `sk_favorites`
- `sk_coupons`
- `sk_memberships`
- `sk_member_orders`
- `sk_wallets`
- `sk_wallet_discount_offers`
- `sk_wallet_recharges`

### 4. 启动 H5 开发环境

```bash
pnpm run dev:h5
```

### 5. 构建 H5

```bash
pnpm run build:h5
```

构建产物默认输出到 `dist/build/web`。

## uniCloud 配置说明

前端通过 `src/utils/cloud.js` 统一初始化 uniCloud 客户端，并读取 `src/utils/cloud-config.js` 中的云空间配置。该真实配置文件已加入 `.gitignore`，避免将云空间密钥提交到公开仓库。

仓库中提供了 `src/utils/cloud-config.example.js` 作为配置模板。复现项目时必须补齐真实云空间参数，否则调用云函数时会失败。

## API 概览

本项目后端基于 uniCloud 云函数实现，通过 `cloud.callFunction` 调用，并使用 `action` 字段区分具体接口能力。完整接口说明、主要参数和调用示例见：[API.md](./API.md)。

| 云函数 | 主要职责 |
| --- | --- |
| `user-auth` | 用户注册、登录 |
| `user-profile` | 用户资料、头像、昵称、常用服务 |
| `product-service` | 商品、分类、店铺数据 |
| `order-service` | 购物车、订单、支付状态、评价 |
| `address-service` | 收货地址管理 |
| `favorite-service` | 商品收藏 |
| `benefit-service` | 优惠券、会员、会员订单 |
| `wallet-service` | 食刻钱包、充值、提现、钱包支付、密码管理 |

## 部署说明

H5 构建后可将 `dist/build/web` 部署到 uniCloud 前端网页托管。当前线上部署地址为：

[https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/](https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/)

部署前请确认：

- `src/utils/cloud-config.js` 已配置正确的云空间信息。
- 云函数已上传并部署成功。
- 数据库 schema 和初始化数据已配置完成。
- 线上环境可以正常访问云函数接口。

## 说明

本项目为课程实训作品，不是实际商业点餐平台。页面中的商品、价格、优惠、会员权益、钱包余额、订单状态、支付结果等均用于学习和展示。
