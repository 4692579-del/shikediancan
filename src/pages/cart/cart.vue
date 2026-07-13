<template>
<view :style="globalThemeStyle" class="page cart-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">购物车</text>
      <button v-if="cart.length" hover-class="none" class="manage-btn" :style="`right:${manageRight}px`" @tap="toggleManage">{{managing ? '退出管理' : '管理'}}</button>
    </view>
  </view>
  <scroll-view scroll-y :bounces="false" :show-scrollbar="false" class="cart-scroll">
    <view v-if="cart.length" class="cart-content">
      <view class="delivery-card card">
        <view class="delivery-icon"><image src="/static/assets/icons/delivery.svg" mode="aspectFit" /></view>
        <view><text class="delivery-title">预计 30 分钟送达</text><text class="delivery-sub">由食刻专送提供配送服务</text></view>
      </view>
      <view class="shop-cart card">
      <view class="shop-line"><button hover-class="none" :class="`check ${allChecked ? 'checked' : ''}`" @tap="toggleAll"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></button><text class="shop-name">食刻·品质厨房</text><text class="shop-more">›</text></view>
      <view v-for="(item, index) in cart" :key="item.key" class="cart-swipe-row">
        <view class="cart-item-actions">
          <button hover-class="none" class="swipe-favorite" :data-key="item.key" @tap.stop="favoriteCartItem"><image src="/static/assets/icons/heart.svg" mode="aspectFit" /><text>收藏</text></button>
          <button hover-class="none" class="swipe-delete" :data-key="item.key" @tap.stop="deleteCartItem"><image src="/static/assets/icons/delete.svg" mode="aspectFit" /><text>删除</text></button>
        </view>
        <view :class="`cart-item cart-item-track ${swipedCartKey === item.key ? 'swiped' : ''}`" :data-key="item.key" @touchstart="cartSwipeStart" @touchend="cartSwipeEnd">
          <button hover-class="none" :class="`check ${item.checked ? 'checked' : ''}`" :data-key="item.key" @tap="toggleItem"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></button>
          <view class="item-visual" :style="`background:${item.bg}`"><image :src="item.icon" mode="aspectFill" /></view>
          <view class="item-main">
            <text class="item-name">{{item.name}}</text>
            <text class="item-spec">{{item.spec}}</text>
            <view class="between">
              <text class="item-price">¥{{item.price}}</text>
              <view v-if="!managing" :class="`stepper ${item.count === 1 ? 'single' : ''}`">
                <button v-if="item.count > 1" hover-class="none" class="minus" :data-key="item.key" data-delta="-1" @tap="changeCount">−</button>
                <input class="count-input" type="number" :value="item.count" :data-key="item.key" @blur="setCount" />
                <button hover-class="none" class="plus" :data-key="item.key" data-delta="1" @tap="changeCount">＋</button>
              </view>
            </view>
          </view>
        </view>
      </view>
      </view>
      <view class="cart-offer card">
        <view><text class="offer-tag">减</text><text>店铺满减</text></view><text class="orange">已减 ¥8.00</text>
      </view>
    </view>
    <view v-else class="empty">
      <view class="empty-icon"><image src="/static/assets/icons/cart.svg" mode="aspectFit" /></view>
      <view class="empty-title">购物车还是空的</view>
      <view class="empty-desc">好吃的都在等你，去挑几样吧</view>
    </view>
  </scroll-view>
  <view v-if="cart.length" class="settle-bar">
    <button hover-class="none" :class="`check ${allChecked ? 'checked' : ''}`" @tap="toggleAll"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></button>
    <text class="all-label">全选</text>
    <view v-if="!managing" class="total"><text>合计 </text><text class="total-price">¥{{total}}</text><text class="total-tip">已优惠 ¥8</text></view>
    <button v-if="!managing" hover-class="none" class="settle-btn" @tap="checkout">去结算 ({{count}})</button>
    <button v-else hover-class="none" class="settle-btn delete-btn" @tap="deleteSelected">删除 ({{count}})</button>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 购物车页：负责商品勾选、数量修改、左滑操作、管理模式、金额汇总与结算校验。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    manageRight: 100,
    cart: [],
    count: 0,
    total: 0,
    allChecked: true,
    managing: false,
    swipedCartKey: ''
  },
  onLoad() {
    if (!auth.guardPage('/pages/cart/cart')) return
    const windowInfo = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
    const menu = typeof uni.getMenuButtonBoundingClientRect === 'function'
      ? uni.getMenuButtonBoundingClientRect()
      : { left: Number(windowInfo.windowWidth || 375) - 88 }
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      manageRight: Math.max(96, windowInfo.windowWidth - menu.left + 12)
    })
  },
  onShow() { this.refresh() },
  // 从缓存重新读取购物车并计算全选、件数和合计金额。
  refresh() {
    const cart = store.getCart()
    const summary = store.cartSummary(cart)
    this.setData({
      cart,
      ...summary,
      allChecked: cart.length > 0 && cart.every(item => item.checked),
      managing: cart.length ? this.managing : false,
      swipedCartKey: cart.some(item => item.key === this.swipedCartKey) ? this.swipedCartKey : ''
    })
  },
  back() { uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/menu/menu' }) }) },
  // 管理模式下底部主按钮由“去结算”切换为“删除”。
  toggleManage() {
    const managing = !this.managing
    const cart = this.cart.map(item => ({ ...item, checked: !managing }))
    store.set('sk_cart', cart)
    this.setData({ managing, swipedCartKey: '' })
    this.refresh()
  },
  cartSwipeStart(e) {
    if (this.managing) return
    const touch = e.changedTouches[0]
    this.cartTouchX = touch ? touch.clientX : 0
    this.cartTouchY = touch ? touch.clientY : 0
  },
  // 仅横向滑动超过阈值时露出收藏和删除圆形按钮。
  cartSwipeEnd(e) {
    if (this.managing) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this.cartTouchX
    const dy = touch.clientY - this.cartTouchY
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 32) return
    const key = e.currentTarget.dataset.key
    this.setData({ swipedCartKey: dx < 0 ? key : '' })
  },
  favoriteCartItem(e) {
    const key = e.currentTarget.dataset.key
    const item = this.cart.find(row => row.key === key)
    if (!item) return
    const favorites = store.get('sk_favorites', [])
    if (!favorites.includes(item.id)) {
      store.set('sk_favorites', favorites.concat(item.id))
      uni.showToast({ title: '已移入收藏夹', icon: 'success' })
    } else {
      uni.showToast({ title: '该商品已在收藏夹', icon: 'none' })
    }
    this.setData({ swipedCartKey: '' })
  },
  deleteCartItem(e) {
    const key = e.currentTarget.dataset.key
    store.updateCart(key, 0)
    this.setData({ swipedCartKey: '' })
    this.refresh()
    uni.showToast({ title: '商品已删除', icon: 'none' })
  },
  // 数量为 1 时禁止继续减少，且不弹出多余提示。
  changeCount(e) {
    const { key, delta } = e.currentTarget.dataset
    const item = this.cart.find(row => row.key === key)
    if (!item) return
    const count = item.count + Number(delta)
    if (count < 1) return
    store.updateCart(key, count)
    this.refresh()
  },
  // 快捷输入数量时校验正整数并同步缓存。
  setCount(e) {
    const key = e.currentTarget.dataset.key
    const value = String(e.detail.value || '').trim()
    if (!value) {
      this.refresh()
      return
    }
    const count = Math.floor(Number(value))
    if (!Number.isFinite(count) || count < 1) {
      uni.showToast({ title: '商品数量不能小于1', icon: 'none' })
      store.updateCart(key, 1)
      this.refresh()
      return
    }
    store.updateCart(key, count)
    this.refresh()
  },
  toggleItem(e) {
    const key = e.currentTarget.dataset.key
    const cart = this.cart.map(item => item.key === key ? { ...item, checked: !item.checked } : item)
    store.set('sk_cart', cart)
    this.refresh()
  },
  toggleAll() {
    const checked = !this.allChecked
    store.set('sk_cart', this.cart.map(item => ({ ...item, checked })))
    this.refresh()
  },
  // 管理模式批量删除前要求至少选中一个商品。
  deleteSelected() {
    if (!this.count) {
      uni.showToast({ title: '请选择要删除的商品', icon: 'none' })
      return
    }
    uni.showModal({
      title: '删除商品',
      content: `确定删除选中的 ${this.count} 件商品吗？`,
      confirmColor: '#ff4d3d',
      success: res => {
        if (!res.confirm) return
        const remaining = this.cart
          .filter(item => !item.checked)
          .map(item => ({ ...item, checked: false }))
        store.set('sk_cart', remaining)
        this.setData({ managing: remaining.length > 0 })
        this.refresh()
      }
    })
  },
  // 结算前依次校验选中商品和收货地址。
  checkout() {
    if (!this.count) return uni.showToast({ title: '请选择商品', icon: 'none' })
    if (!store.getDefaultAddress()) {
      uni.showModal({
        title: '暂无收货地址',
        content: '当前没有可用的收货地址，请先设置地址后继续下单。',
        confirmText: '去设置',
        cancelText: '暂不设置',
        success: res => {
          if (res.confirm) uni.navigateTo({ url: '/pages/address/address?from=cart' })
        }
      })
      return
    }
    uni.navigateTo({ url: '/pages/checkout/checkout' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.clear-btn{color:#777;padding:15rpx}.cart-content{padding:20rpx 24rpx 180rpx}.delivery-card{padding:22rpx;display:flex;align-items:center;margin-bottom:18rpx}.delivery-icon{width:72rpx;height:72rpx;border-radius:24rpx;background:var(--orange-soft);display:flex;align-items:center;justify-content:center;font-size:36rpx;margin-right:18rpx}.delivery-title,.delivery-sub{display:block}.delivery-title{font-weight:700}.delivery-sub{font-size:21rpx;color:#999;margin-top:5rpx}.shop-cart{padding:24rpx}.shop-line{display:flex;align-items:center;padding-bottom:22rpx;border-bottom:1rpx solid #eee}.check{width:40rpx;height:40rpx;border-radius:14rpx;border:2rpx solid #d0d0d5;color:transparent;display:flex;align-items:center;justify-content:center;font-size:24rpx;margin-right:18rpx}.check.checked{background:var(--orange);border-color:var(--orange);color:#fff}.shop-name{font-size:30rpx;font-weight:750}.shop-more{margin-left:auto;color:#aaa;font-size:40rpx}.cart-item{display:flex;padding:25rpx 0;border-bottom:1rpx solid #f0f0f2;align-items:center}.item-visual{width:144rpx;height:144rpx;border-radius:26rpx;display:flex;align-items:center;justify-content:center;font-size:68rpx;flex-shrink:0}.item-main{flex:1;padding-left:18rpx;min-width:0}.item-name{font-size:28rpx;font-weight:700;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.item-spec{display:inline-block;background:#f5f5f7;color:#888;border-radius:9rpx;padding:5rpx 9rpx;font-size:19rpx;margin:10rpx 0 20rpx}.item-price{color:var(--orange);font-size:30rpx;font-weight:800}.stepper{display:flex;align-items:center;gap:17rpx}.stepper button{width:48rpx;height:48rpx;border-radius:17rpx;background:#eeeef1;display:flex;align-items:center;justify-content:center;font-size:31rpx}.stepper .plus{background:var(--orange);color:#fff}.cart-offer{margin-top:18rpx;padding:24rpx;display:flex;align-items:center;justify-content:space-between}.offer-tag{background:var(--orange-soft);color:var(--orange);border-radius:9rpx;padding:5rpx 8rpx;font-size:19rpx;margin-right:10rpx}.settle-bar{position:fixed;left:0;right:0;bottom:0;z-index:50;height:130rpx;padding:0 24rpx env(safe-area-inset-bottom);background:rgba(255,255,255,.96);display:flex;align-items:center;box-shadow:0 -8rpx 24rpx rgba(0,0,0,.06)}.all-label{font-size:23rpx}.total{margin-left:auto;margin-right:16rpx;text-align:right;display:flex;align-items:baseline}.total-price{color:var(--orange);font-size:35rpx;font-weight:800}.total-tip{display:block;font-size:18rpx;color:var(--orange);margin-left:7rpx}.settle-btn{height:82rpx;padding:0 26rpx;border-radius:28rpx;background:var(--orange);color:#fff;font-weight:700}

.cart-content{padding-bottom:170rpx}.shop-cart{padding:22rpx}.check{width:38rpx;height:38rpx;flex-shrink:0;margin-right:13rpx}
.shop-name{font-size:28rpx;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cart-item{padding:22rpx 0}.item-visual{width:126rpx;height:126rpx;font-size:58rpx}
.item-main{padding-left:14rpx}.item-name{font-size:25rpx}.item-spec{max-width:100%;font-size:17rpx;margin:7rpx 0 14rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-price{font-size:27rpx}.stepper{gap:10rpx}.stepper button{width:42rpx;height:42rpx;font-size:27rpx}
.settle-bar{min-height:124rpx;height:auto;padding:13rpx 20rpx calc(13rpx + env(safe-area-inset-bottom))}
.all-label{font-size:20rpx;flex-shrink:0}.total{min-width:0;margin-right:10rpx;white-space:nowrap}.total>text:first-child{font-size:20rpx}
.total-price{font-size:30rpx}.total-tip{display:none}.settle-btn{height:74rpx;flex-shrink:0;padding:0 20rpx;border-radius:25rpx;font-size:22rpx}
.stepper button{flex:0 0 42rpx}.settle-btn{width:auto!important}
.settle-bar{min-height:136rpx;padding:15rpx 20rpx calc(15rpx + env(safe-area-inset-bottom))}
.total-price{font-size:32rpx}.settle-btn{height:82rpx;min-width:176rpx;padding:0 22rpx;display:flex;align-items:center;justify-content:center;line-height:1}

/* Prevent native button styles from stretching checkboxes. */
button.check,
.settle-bar button.check {
  width: 38rpx !important;
  min-width: 38rpx !important;
  max-width: 38rpx !important;
  height: 38rpx !important;
  min-height: 38rpx !important;
  flex: 0 0 38rpx !important;
  padding: 0 !important;
  margin-left: 0 !important;
  margin-right: 13rpx !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.delivery-icon image{width:40rpx;height:40rpx}
.item-visual>image{width:68rpx;height:68rpx}
.check image{width:22rpx;height:22rpx;opacity:0}
.check.checked image{opacity:1;filter:brightness(0) invert(1)}
.empty-icon image{width:110rpx;height:110rpx}

/* The cart is standalone and has no bottom navigation. */
.cart-content{padding-bottom:190rpx}
.settle-bar{
  left:24rpx;
  right:24rpx;
  bottom:calc(22rpx + env(safe-area-inset-bottom));
  min-height:108rpx;
  padding:12rpx 18rpx;
  border-radius:32rpx;
  box-shadow:0 10rpx 32rpx rgba(28,28,32,.13);
}
.empty{padding-bottom:calc(80rpx + env(safe-area-inset-bottom))}

/* Keep the action button equally inset from the top, bottom and right edge. */
.settle-bar{padding-right:12rpx}
.settle-btn{
  min-width:184rpx;
  margin-left:8rpx!important;
  margin-right:0!important;
}

/* Cart management mode. Keep the action clear of both the centered title
   and the native mini-program capsule on the right. */
.manage-btn{
  position:absolute;
  top:50%;
  z-index:3;
  width:auto!important;
  min-width:72rpx!important;
  height:60rpx;
  padding:0 4rpx!important;
  transform:translateY(-50%);
  display:flex;
  align-items:center;
  justify-content:flex-end;
  color:#666;
  font-size:22rpx;
  line-height:1;
  white-space:nowrap;
}
.delete-btn{
  margin-left:auto!important;
  background:#ff4d3d;
}

/* Capsule-shaped delivery, discount and bottom action bars. */
.cart-offer{
  border-radius:999rpx;
}
.delivery-card{
  border-radius:32rpx;
}
.settle-bar{
  border-radius:999rpx;
}
.settle-btn,
.delete-btn{
  border-radius:999rpx;
}
.delivery-icon{
  border-radius:50%;
}
.offer-tag{
  border-radius:999rpx;
}

/* Editable capsule quantity stepper. */
.stepper{
  width:150rpx;
  height:48rpx;
  flex:0 0 150rpx;
  gap:0;
  overflow:hidden;
  border:1rpx solid #e5e5e9;
  border-radius:999rpx;
  background:#f7f7f9;
}
.stepper.single{
  width:102rpx;
  flex-basis:102rpx;
}
.stepper button{
  width:48rpx!important;
  min-width:48rpx!important;
  max-width:48rpx!important;
  height:48rpx;
  flex:0 0 48rpx;
  padding:0!important;
  border-radius:0;
  background:transparent;
  color:#666;
  font-size:27rpx;
}
.stepper .minus{
  border-right:1rpx solid #e5e5e9;
}
.stepper .plus{
  border-left:1rpx solid rgba(255,255,255,.35);
  border-radius:0 999rpx 999rpx 0;
  background:var(--orange);
  color:#fff;
}
.count-input{
  width:54rpx;
  height:48rpx;
  flex:0 0 54rpx;
  padding:0;
  color:#333;
  font-size:22rpx;
  font-weight:650;
  line-height:48rpx;
  text-align:center;
  background:#fff;
}

/* Swipe actions for individual cart items. */
.cart-swipe-row{
  position:relative;
  overflow:hidden;
  border-bottom:1rpx solid #f0f0f2;
}
.cart-swipe-row:last-child{
  border-bottom:0;
}
.cart-item-track{
  position:relative;
  z-index:2;
  width:100%;
  border-bottom:0;
  background:#fff;
  transform:translateX(0);
  transition:transform .26s cubic-bezier(.22,.61,.36,1);
}
.cart-item-track.swiped{
  transform:translateX(-180rpx);
}
.cart-item-actions{
  position:absolute;
  z-index:1;
  top:0;
  right:0;
  bottom:0;
  width:176rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:16rpx;
  background:#fff;
}
.cart-item-actions button{
  width:72rpx!important;
  min-width:72rpx!important;
  max-width:72rpx!important;
  height:72rpx;
  flex:0 0 72rpx;
  border-radius:50%;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:3rpx;
  color:#fff;
  font-size:17rpx;
  box-shadow:0 8rpx 18rpx rgba(28,28,32,.14);
}
.cart-item-actions image{
  width:25rpx;
  height:25rpx;
  filter:brightness(0) invert(1);
}
.swipe-favorite{
  background:var(--theme-gradient);
}
.swipe-delete{
  background:linear-gradient(145deg,#ff6b58,#ed493b);
}
.item-visual{overflow:hidden}.item-visual>image{width:100%;height:100%;display:block}

/* Keep the cart title fixed; only the content below it scrolls. */
.cart-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.cart-page>.safe-nav{
  position:relative;
  z-index:60;
  flex-shrink:0;
}
.cart-scroll{
  flex:1;
  min-height:0;
  height:0;
}

/* 左滑操作圆钮：收紧图标与文字距离，避免上下分散。 */
.cart-page .cart-item-actions button{
  gap:0!important;
  line-height:1!important;
}
.cart-page .cart-item-actions image{
  width:23rpx!important;
  height:23rpx!important;
  margin:0 0 1rpx!important;
}
.cart-page .cart-item-actions text{
  margin-top:0!important;
  font-size:16rpx!important;
  line-height:18rpx!important;
  white-space:nowrap!important;
}

</style>
