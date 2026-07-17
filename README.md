# 食刻点餐

食刻点餐是一个基于 uni-app + Vue 3 + uniCloud 的点餐类课程实训项目，覆盖商品浏览、购物车、订单、模拟支付、评价、地址、收藏、优惠券、会员和食刻钱包等功能。

## 线上 Demo

访问地址：[https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/](https://env-00jy6k9lf709-static.normal.cloudstatic.cn/index.html#/)

## 技术栈

- uni-app
- Vue 3
- Vite
- uniCloud
- Alipay 云空间

## 本地运行

```bash
pnpm install
pnpm run dev:h5
```

## H5 构建

```bash
pnpm run build:h5
```

## uniCloud 配置

项目中的真实云空间配置文件 `src/utils/cloud-config.js` 未提交到仓库。首次运行时请复制示例配置：

```bash
cp src/utils/cloud-config.example.js src/utils/cloud-config.js
```

然后在 `src/utils/cloud-config.js` 中填写自己的 uniCloud 云空间信息。
