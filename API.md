# 食刻点餐 API 文档

本文档记录食刻点餐项目的后端接口。项目后端基于 uniCloud 云函数实现，不使用传统 REST 路由；前端通过 `cloud.callFunction` 调用云函数，并通过 `action` 字段区分具体接口。

## 统一调用方式

```js
cloud.callFunction({
  name: '云函数名称',
  data: {
    action: '接口动作',
    userId: '当前用户 ID',
    ...payload
  }
})
```

## 通用返回格式

大多数接口返回结构如下：

```js
{
  code: 0,
  message: 'ok',
  data: {}
}
```

当接口调用失败时，通常会返回非 `0` 的 `code` 或失败状态，并携带错误提示信息。前端会根据 `result.code`、`result.message` 等字段进行提示和兜底处理。

## 云函数总览

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

## 1. user-auth

用户注册和登录接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `register` | 用户注册 | `phone`、`password`、`nickname` |
| `login` | 用户登录 | `phone`、`password` |

### register 示例

```js
cloud.callFunction({
  name: 'user-auth',
  data: {
    action: 'register',
    phone: '13800000000',
    password: '123456',
    nickname: '新用户'
  }
})
```

### login 示例

```js
cloud.callFunction({
  name: 'user-auth',
  data: {
    action: 'login',
    phone: '13800000000',
    password: '123456'
  }
})
```

## 2. user-profile

用户资料和个人中心配置接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `get` | 获取用户资料 | `uid` |
| `updateAvatar` | 更新头像 | `uid`、`avatar` |
| `updateNickname` | 更新昵称 | `uid`、`nickname` |
| `getCommonServices` | 获取常用服务配置 | `uid` |
| `saveCommonServices` | 保存常用服务配置 | `uid`、`services` |

### updateNickname 示例

```js
cloud.callFunction({
  name: 'user-profile',
  data: {
    action: 'updateNickname',
    uid: 'user_id',
    nickname: '食刻用户'
  }
})
```

## 3. product-service

商品、分类和店铺数据接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `product.sync` | 同步商品、分类、店铺数据 | `seed` 可选 |
| `product.list` | 获取商品列表 | 无 |
| `product.detail` | 获取商品详情 | `id` |
| `product.search` | 搜索商品 | `keyword` |

### product.list 示例

```js
cloud.callFunction({
  name: 'product-service',
  data: {
    action: 'product.list'
  }
})
```

### product.detail 示例

```js
cloud.callFunction({
  name: 'product-service',
  data: {
    action: 'product.detail',
    id: 'food_001'
  }
})
```

## 4. order-service

购物车、订单和评价接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `cart.list` | 获取购物车 | `userId` |
| `cart.set` | 保存购物车 | `userId`、`items` |
| `cart.clear` | 清空购物车 | `userId` |
| `order.create` | 创建订单 | `userId`、`order` 或订单 payload |
| `order.list` | 获取订单列表 | `userId` |
| `order.get` | 获取订单详情 | `userId`、`id` |
| `order.pay` | 支付订单 | `userId`、`id`、`method` |
| `order.cancel` | 取消订单 | `userId`、`id` |
| `order.complete` | 完成订单 | `userId`、`id` |
| `order.review` | 提交订单评价 | `userId`、`id`、`review` |
| `order.delete` | 删除订单 | `userId`、`id` |
| `review.list` | 获取我的评价 | `userId` |
| `review.pending` | 获取待评价订单 | `userId` |
| `review.delete` | 删除我的评价 | `userId`、`orderId`、`foodId` |
| `productReview.list` | 获取商品评价列表 | `foodId` |
| `productReview.delete` | 删除商品评价 | `userId`、`orderId`、`foodId` |

### cart.set 示例

```js
cloud.callFunction({
  name: 'order-service',
  data: {
    action: 'cart.set',
    userId: 'user_id',
    items: [
      {
        id: 'food_001',
        name: '番茄牛肉米线',
        count: 1,
        price: 28
      }
    ]
  }
})
```

### order.create 示例

```js
cloud.callFunction({
  name: 'order-service',
  data: {
    action: 'order.create',
    userId: 'user_id',
    items: [],
    address: {},
    amount: 58,
    remark: '少辣'
  }
})
```

### productReview.list 示例

```js
cloud.callFunction({
  name: 'order-service',
  data: {
    action: 'productReview.list',
    foodId: 'food_001'
  }
})
```

## 5. address-service

收货地址管理接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `list` | 获取地址列表 | `userId` |
| `save` | 新增或编辑地址 | `userId`、地址字段 |
| `remove` | 删除地址 | `userId`、`id` |

### save 示例

```js
cloud.callFunction({
  name: 'address-service',
  data: {
    action: 'save',
    userId: 'user_id',
    id: 'address_id',
    name: '张三',
    phone: '13800000000',
    region: '上海市',
    detail: '某某路 100 号',
    isDefault: true
  }
})
```

## 6. favorite-service

商品收藏接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `favorite.list` | 获取收藏列表 | `userId` |
| `favorite.add` | 添加收藏 | `userId`、`food` |
| `favorite.remove` | 取消收藏 | `userId`、`foodId` |
| `favorite.toggle` | 切换收藏状态 | `userId`、`food` 或 `foodId` |

### favorite.toggle 示例

```js
cloud.callFunction({
  name: 'favorite-service',
  data: {
    action: 'favorite.toggle',
    userId: 'user_id',
    food: {
      id: 'food_001',
      name: '番茄牛肉米线'
    }
  }
})
```

## 7. benefit-service

优惠券、会员和会员订单接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `sync` / `benefit.sync` | 同步会员与优惠数据 | `userId` |
| `coupon.list` | 获取优惠券列表 | `userId` |
| `coupon.use` | 使用优惠券 | `userId`、`couponId`、`orderId` |
| `membership.createOrder` | 创建会员订单 | `userId`、`planId`、`tier` |
| `membership.getOrder` | 获取会员订单详情 | `userId`、`id` |
| `membership.listOrders` | 获取会员订单列表 | `userId` |
| `membership.payOrder` | 支付会员订单 | `userId`、`id`、支付参数 |
| `membership.cancelOrder` | 取消会员订单 | `userId`、`id` |
| `membership.deleteOrder` | 删除会员订单 | `userId`、`id` |
| `membership.reset` | 重置会员状态 | `userId` |

### coupon.list 示例

```js
cloud.callFunction({
  name: 'benefit-service',
  data: {
    action: 'coupon.list',
    userId: 'user_id'
  }
})
```

### membership.createOrder 示例

```js
cloud.callFunction({
  name: 'benefit-service',
  data: {
    action: 'membership.createOrder',
    userId: 'user_id',
    planId: 'plus_month',
    tier: 'plus'
  }
})
```

## 8. wallet-service

食刻钱包、充值、提现、钱包支付和密码管理接口。

| Action | 说明 | 主要参数 |
| --- | --- | --- |
| `wallet.get` | 获取钱包信息 | `userId` |
| `wallet.open` | 开通钱包 | `userId`、`payPassword` |
| `wallet.close` | 关闭钱包 | `userId`、`reason` |
| `wallet.withdraw` | 模拟提现 | `userId`、`amount`、`method`、`payPassword` |
| `wallet.pay` | 钱包支付 | `userId`、`amount`、`orderId`、`payPassword` |
| `wallet.discount.prepare` | 准备钱包优惠 | `userId`、`amount`、`orderId`、`scene` |
| `wallet.payPassword.change` | 修改支付密码 | `userId`、`oldPassword`、`newPassword` |
| `wallet.payPassword.set` | 设置支付密码 | `userId`、`newPassword` |
| `wallet.transaction.delete` | 删除钱包账单 | `userId`、`id` |
| `account.loginPassword.change` | 修改登录密码 | `uid`、`oldPassword`、`newPassword` |
| `recharge.create` | 创建充值订单 | `userId`、`amount` |
| `recharge.get` | 获取充值订单 | `userId`、`id` |
| `recharge.complete` | 完成模拟充值 | `userId`、`id`、`method` |

### wallet.get 示例

```js
cloud.callFunction({
  name: 'wallet-service',
  data: {
    action: 'wallet.get',
    userId: 'user_id'
  }
})
```

### wallet.pay 示例

```js
cloud.callFunction({
  name: 'wallet-service',
  data: {
    action: 'wallet.pay',
    userId: 'user_id',
    amount: 58,
    orderId: 'order_id',
    payPassword: '123456',
    scene: 'food'
  }
})
```

### recharge.create 示例

```js
cloud.callFunction({
  name: 'wallet-service',
  data: {
    action: 'recharge.create',
    userId: 'user_id',
    amount: 100
  }
})
```

## 数据库集合

接口主要读写以下 uniCloud 数据库集合：

| 集合 | 说明 |
| --- | --- |
| `sk_users` | 用户信息 |
| `sk_shops` | 店铺信息 |
| `sk_categories` | 商品分类 |
| `sk_products` | 商品信息 |
| `sk_carts` | 购物车 |
| `sk_orders` | 订单与评价 |
| `sk_addresses` | 收货地址 |
| `sk_favorites` | 商品收藏 |
| `sk_coupons` | 优惠券 |
| `sk_memberships` | 会员信息 |
| `sk_member_orders` | 会员订单 |
| `sk_wallets` | 钱包余额与账单 |
| `sk_wallet_discount_offers` | 钱包优惠 |
| `sk_wallet_recharges` | 钱包充值订单 |

## 说明

本文档中的支付、充值、提现和会员开通均为课程设计模拟接口，用于展示业务流程，不会产生真实资金交易。
