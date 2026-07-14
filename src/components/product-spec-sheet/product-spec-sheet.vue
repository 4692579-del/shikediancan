<template>
<view v-if="show && food" class="spec-mask" @tap="close">
  <view class="spec-dialog" @tap.stop="noop">
    <view class="sheet-handle"></view>
    <view class="sheet-product">
      <view class="sheet-visual" :style="`background:${food.bg}`"><image :src="food.icon" mode="aspectFill" /></view>
      <view class="sheet-copy"><text>{{food.name}}</text><view><text>¥</text>{{displayPrice}}</view></view>
    </view>
    <text class="sheet-title">选择规格</text>
    <view class="detail-specs">
      <button v-for="(item, index) in specs" :key="item.name" hover-class="none" :class="selectedSpec === item.name ? 'on' : ''" :data-name="item.name" @tap="selectSpec">
        <text>{{item.name}}</text><text v-if="item.extra">+¥{{item.extra}}</text><text v-else>原价</text>
      </button>
    </view>
    <view class="sheet-quantity-row">
      <view><text>购买数量</text><text>最少购买1份</text></view>
      <view :class="`sheet-stepper ${count === 1 ? 'single' : ''}`">
        <button v-if="count > 1" hover-class="none" class="minus" @tap="decrease">−</button>
        <input class="count-input" type="number" :value="count" @blur="setCount" />
        <button hover-class="none" class="plus" @tap="increase">＋</button>
      </view>
    </view>
    <button hover-class="none" class="confirm-btn" @tap="confirm">加入购物车</button>
  </view>
</view>
</template>

<script>
import adaptComponent from '@/utils/component-adapter.js'
// 通用商品规格面板：统一处理规格选择、购买数量校验和加入购物车。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import orderBackend from '../../utils/order-backend.js'
const componentConfig = {
  properties: {
    show: { type: Boolean, value: false },
    food: { type: Object, value: null }
  },
  data: {
    selectedSpec: '标准份',
    specs: [
      { name: '标准份', extra: 0 },
      { name: '加大份', extra: 5 },
      { name: '双倍主菜', extra: 9 }
    ],
    count: 1,
    displayPrice: '0.0'
  },
  observers: {
    'show,food': function(show, food) {
      if (show && food) {
        this.setData({
          selectedSpec: '标准份',
          count: 1,
          displayPrice: Number(food.price).toFixed(1)
        })
      }
    }
  },
  methods: {
    close() { this.triggerEvent('close') },
    noop() {},
    // 切换规格并根据规格附加价实时更新显示价格。
    selectSpec(e) {
      const selectedSpec = e.currentTarget.dataset.name
      const spec = this.specs.find(item => item.name === selectedSpec)
      this.setData({
        selectedSpec,
        displayPrice: (Number(this.food.price) + spec.extra).toFixed(1)
      })
    },
    decrease() {
      if (this.count <= 1) return
      this.setData({ count: this.count - 1 })
    },
    increase() { this.setData({ count: this.count + 1 }) },
    // 支持手动输入数量；非法值或小于 1 时恢复为 1。
    setCount(e) {
      const value = String(e.detail.value || '').trim()
      if (!value) {
        this.setData({ count: 1 })
        return
      }
      const count = Math.floor(Number(value))
      if (!Number.isFinite(count) || count < 1) {
        uni.showToast({ title: '商品数量不能小于1', icon: 'none' })
        this.setData({ count: 1 })
        return
      }
      this.setData({ count })
    },
    // 真正加入购物车前再执行登录校验。
    confirm() {
      const food = this.food
      if (!food) return
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const target = current ? auth.buildUrl(`/${current.route}`, current.options || {}) : '/pages/home/home'
      if (!auth.requireLogin(target)) return
      const spec = this.specs.find(item => item.name === this.selectedSpec)
      store.addCart(
        { ...food, price: Number(food.price) + spec.extra },
        this.count,
        `${spec.name}${spec.extra ? ` +¥${spec.extra}` : ''}`
      )
      orderBackend.saveCart(store.getCart()).catch(err => console.error('sync cart failed', err))
      this.triggerEvent('added', { count: store.cartSummary().count })
      this.close()
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    }
  }
}

export default adaptComponent(componentConfig)
</script>

<style>
.spec-mask{position:fixed;z-index:160;inset:0;background:rgba(18,18,20,.34);display:flex;align-items:flex-end}
.spec-dialog{width:100%;padding:16rpx 30rpx calc(30rpx + env(safe-area-inset-bottom));background:#fff;border-radius:40rpx 40rpx 0 0;box-shadow:0 -15rpx 45rpx rgba(25,25,30,.14);animation:spec-rise .24s ease-out}
@keyframes spec-rise{from{transform:translateY(100%);opacity:.6}to{transform:translateY(0);opacity:1}}
.sheet-handle{width:72rpx;height:8rpx;margin:0 auto 22rpx;border-radius:999rpx;background:#ddd}
.sheet-product{display:flex;align-items:center;padding-bottom:26rpx;border-bottom:1rpx solid #eee}
.sheet-visual{width:112rpx;height:112rpx;flex:0 0 112rpx;overflow:hidden;border-radius:25rpx}.sheet-visual image{width:100%;height:100%;display:block}
.sheet-copy{min-width:0;padding-left:18rpx}.sheet-copy>text{display:block;max-width:470rpx;font-size:27rpx;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet-copy>view{margin-top:10rpx;color:var(--orange);font-size:36rpx;font-weight:850}.sheet-copy>view text{font-size:22rpx;margin-right:3rpx}
.sheet-title{display:block;margin-top:25rpx;font-size:28rpx;font-weight:750}
.detail-specs{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10rpx;margin-top:20rpx}
.detail-specs button{width:100%!important;min-width:0!important;max-width:none!important;height:82rpx;padding:0 4rpx!important;overflow:hidden;border:2rpx solid transparent;border-radius:999rpx;background:#f4f4f6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx}
.detail-specs button text{display:block;width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.detail-specs button text:first-child{font-size:20rpx;font-weight:650}.detail-specs button text:last-child{font-size:16rpx;color:#999}
.detail-specs button.on{border-color:var(--theme-border);background:var(--orange-soft);color:var(--orange)}.detail-specs button.on text:last-child{color:var(--theme-border)}
.sheet-quantity-row{display:flex;align-items:center;justify-content:space-between;margin-top:30rpx;padding-top:24rpx;border-top:1rpx solid #eee}
.sheet-quantity-row>view:first-child text{display:block}.sheet-quantity-row>view:first-child text:first-child{font-size:25rpx;font-weight:700}.sheet-quantity-row>view:first-child text:last-child{margin-top:5rpx;color:#aaa;font-size:18rpx}
.sheet-stepper{width:150rpx;height:48rpx;flex:0 0 150rpx;overflow:hidden;border:1rpx solid #e5e5e9;border-radius:999rpx;background:#f7f7f9;display:flex;align-items:center}.sheet-stepper.single{width:102rpx;flex-basis:102rpx}
.sheet-stepper button{width:48rpx!important;min-width:48rpx!important;max-width:48rpx!important;height:48rpx;flex:0 0 48rpx;padding:0;border-radius:0;background:transparent;color:#666;font-size:27rpx;display:flex;align-items:center;justify-content:center}.sheet-stepper .minus{border-right:1rpx solid #e5e5e9}.sheet-stepper .plus{border-left:1rpx solid rgba(255,255,255,.35);border-radius:0 999rpx 999rpx 0;background:var(--orange);color:#fff}
.count-input{width:54rpx;height:48rpx;flex:0 0 54rpx;padding:0;color:#333;font-size:22rpx;font-weight:650;line-height:48rpx;text-align:center;background:#fff}
.confirm-btn{width:100%!important;max-width:none!important;height:84rpx;margin-top:30rpx;border-radius:999rpx;background:var(--theme-gradient);color:#fff;font-size:25rpx;font-weight:750;display:flex;align-items:center;justify-content:center}

</style>
