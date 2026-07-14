<template>
<view :style="globalThemeStyle" v-if="order" class="page detail-page">
  <view class="detail-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back detail-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">订单详情</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :bounces="false" :show-scrollbar="false" class="detail-scroll" @scroll="onDetailScroll">
    <view class="detail-hero" :style="`opacity:${heroOpacity};transform:translateY(-${heroLift}rpx)`">
      <view class="detail-hero-inner">
        <view class="status-block"><text>{{ statusText }}</text><text>{{ statusDesc(order) }}</text></view>
        <view class="step-row">
          <view v-for="(item, index) in steps" :key="item.name" :class="`step ${item.done ? 'done' : ''} ${item.current ? 'current' : ''}`">
            <view><image v-if="item.done" src="/static/assets/icons/check.svg" mode="aspectFit" /><text v-else>{{ index + 1 }}</text></view>
            <text>{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="detail-content">
      <view class="card detail-card">
        <view class="card-title"><text>食刻·品质厨房</text><button hover-class="none" @tap="contact">联系商家</button></view>
        <view v-for="item in order.items" :key="item.key || item.id || item.name" class="detail-goods">
          <view :style="`background:${item.bg || '#f6e2c9'}`"><image :src="item.icon" mode="aspectFill" /></view>
          <text>{{ item.name }}<text>{{ item.spec }} ×{{ item.count }}</text></text>
          <text>¥{{ item.price * item.count }}</text>
        </view>
        <view class="detail-bill">
          <view><text>商品小计</text><text>¥{{ order.goodsTotal }}</text></view>
          <view><text>包装费</text><text>¥{{ order.packingFee }}</text></view>
          <view><text>优惠</text><text class="orange">-¥{{ order.discount + order.couponDiscount + (order.memberDiscount || 0) + (order.walletDiscount || 0) }}</text></view>
          <view class="paid"><text>实付</text><text>¥{{ order.total }}</text></view>
        </view>
      </view>

      <view class="card detail-card">
        <text class="block-title">配送信息</text>
        <view class="info-row"><text>收货地址</text><text>{{ (order.address && (order.address.fullDetail || order.address.detail)) || '' }}
{{ order.address && order.address.name }} {{ order.address && order.address.phone }}</text></view>
        <view class="info-row"><text>送达时间</text><text>{{ order.deliveryTime }}</text></view>
        <view class="info-row"><text>配送服务</text><text>食刻专送</text></view>
      </view>

      <view class="card detail-card">
        <text class="block-title">订单信息</text>
        <view class="info-row"><text>订单号码</text><view class="order-id-value"><text>{{ order.id }}</text><button hover-class="none" @tap="copy">复制</button></view></view>
        <view class="info-row"><text>下单时间</text><text>{{ order.createdAt }}</text></view>
        <view class="info-row"><text>支付方式</text><text>{{ payMethodText(order.payMethod) }}</text></view>
        <view class="info-row"><text>订单备注</text><text>{{ order.remark || '无' }}</text></view>
      </view>

      <view v-if="recommendations.length" class="recommend-section">
        <view class="recommend-title"><view></view><text>为你推荐</text><view></view></view>
        <view class="recommend-grid">
          <view v-for="item in recommendations" :key="item.id" class="recommend-card" :data-id="item.id" @tap="goFoodDetail">
            <view class="recommend-visual" :style="`background:${item.bg || '#f6e2c9'}`"><image :src="item.icon" mode="aspectFill" /><text class="recommend-tag">{{ item.tag }}</text></view>
            <view class="recommend-info">
              <text class="recommend-name">{{ item.name }}</text>
              <view class="recommend-sales"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{ item.rating }} · 月售{{ item.sales }}</text></view>
              <view class="recommend-bottom"><view><text class="recommend-price">¥{{ item.price }}</text><text class="recommend-old">¥{{ item.oldPrice }}</text></view><button hover-class="none" :data-id="item.id" @tap.stop="addRecommended">+</button></view>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="detail-scroll-end"></view>
  </scroll-view>

  <view :class="`detail-actions ${order.status === 'unpaid' || order.status === 'making' || order.status === 'delivery' || order.status === 'done' ? 'two-actions' : 'single-action'}`">
    <button hover-class="none" v-if="order.status === 'unpaid'" class="primary-small" @tap="payNow">立即付款</button>
    <button hover-class="none" v-if="order.status === 'making' || order.status === 'delivery'" class="primary-small" @tap="confirmDelivery">确认送达</button>
    <button hover-class="none" v-if="order.status === 'done'" :class="`primary-small ${hasReviewed ? 'disabled-action' : ''}`" @tap="reviewOrder">{{ hasReviewed ? '已评价' : '立即评价' }}</button>
    <button hover-class="none" @tap="contact">联系客服</button>
  </view>
  <product-spec-sheet :show="showSpecSheet" :food="selectedFood" @close="closeSpecSheet" @added="specAdded" />
</view>
</template>
<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import paymentCountdown from '../../utils/payment-countdown.js'
import orderBackend from '../../utils/order-backend.js'
import productBackend from '../../utils/product-backend.js'

function hasOrderReview(order) {
  return Boolean(order && order.reviewed === true)
}

const pageConfig = {
  data: {
    statusHeight: 20,
    order: null,
    recommendations: [],
    statusText: '',
    steps: [],
    fromPayResult: false,
    heroOpacity: 1,
    heroLift: 0,
    paymentCountdown: '',
    selectedFood: null,
    showSpecSheet: false
  },
  computed: {
    hasReviewed() {
      return hasOrderReview(this.order)
    }
  },
  onLoad(options) {
    const target = auth.buildUrl('/pages/order-detail/order-detail', options)
    if (!auth.guardPage(target)) return
    this.orderId = options.id
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, fromPayResult: options.from === 'payResult' })
    const cachedOrder = orderBackend.getCachedOrders().find(item => item.id === this.orderId)
    if (cachedOrder) this.renderOrder(cachedOrder)
    productBackend.syncProducts().then(() => {
      if (this.order) this.setData({ recommendations: this.getRecommendations(this.order) })
    }).catch(err => console.error('sync products failed', err))
    this.loadOrder()
  },
  onShow() {
    if (!this.orderId) return
    this.loadOrder()
  },
  onHide() { this.stopPaymentCountdown() },
  onUnload() { this.stopPaymentCountdown() },
  async loadOrder() {
    let order = null
    try {
      order = await orderBackend.getOrder(this.orderId)
    } catch (err) {
      console.error('load backend order detail failed', err)
      order = paymentCountdown.getOrder(this.orderId)
    }
    if (!order) {
      uni.showToast({ title: '订单不存在', icon: 'none' })
      return
    }
    this.renderOrder(order)
  },
  renderOrder(order) {
    const localOrders = store.get('sk_orders', [])
    store.set('sk_orders', [order, ...localOrders.filter(item => item.id !== order.id)])
    this.setData({ order, recommendations: this.getRecommendations(order) })
    this.buildStatus()
    this.startPaymentCountdown()
  },
  getRecommendations(order) {
    if (!order) return []
    const orderedIds = new Set((order.items || []).map(item => Number(item.id)))
    const foods = productBackend.getFoods()
    const candidates = foods.filter(item => !orderedIds.has(Number(item.id))).map(item => ({ ...item }))
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = candidates[i]
      candidates[i] = candidates[j]
      candidates[j] = temp
    }
    return candidates.slice(0, 4)
  },
  statusDesc(order) {
    if (!order) return ''
    if (order.status === 'unpaid') return `剩余支付时间 ${this.paymentCountdown || ''}`
    if (order.status === 'making') return '预计 20:10 前送达'
    if (order.status === 'delivery') return '骑手正在向你飞奔'
    if (order.status === 'cancelled') return order.cancelledReason || '订单已取消'
    return '感谢你的支持'
  },
  payMethodText(method) {
    const map = {
      alipay: '支付宝支付',
      wallet: '食刻钱包支付',
      quick: '微信支付'
    }
    return map[method] || '微信支付'
  },
  buildStatus() {
    const order = this.order
    if (!order) return
    const map = { unpaid: '等待付款', making: '商家正在制作', delivery: '骑手正在配送', done: '订单已完成', cancelled: '订单已取消' }
    const currentStep = { unpaid: 1, making: 2, delivery: 3 }[order.status]
    const steps = [
      { name: '订单已提交', done: true },
      { name: order.status === 'unpaid' ? '等待付款' : '支付成功', done: order.status !== 'unpaid' },
      { name: '商家制作', done: ['making', 'delivery', 'done'].includes(order.status) },
      { name: '骑手配送', done: ['delivery', 'done'].includes(order.status) },
      { name: '已送达', done: order.status === 'done' }
    ].map((item, index) => ({ ...item, current: index === currentStep }))
    this.setData({ statusText: map[order.status] || '订单详情', steps })
  },
  startPaymentCountdown() {
    this.stopPaymentCountdown()
    this.updatePaymentCountdown()
    if (this.order && this.order.status === 'unpaid') this.paymentTimer = setInterval(() => this.updatePaymentCountdown(), 1000)
  },
  stopPaymentCountdown() {
    if (this.paymentTimer) {
      clearInterval(this.paymentTimer)
      this.paymentTimer = null
    }
  },
  async updatePaymentCountdown() {
    const order = paymentCountdown.getOrder(this.orderId)
    if (!order) return
    if (order.status !== 'unpaid') {
      this.stopPaymentCountdown()
      if (!this.order || order.status !== this.order.status) {
        this.setData({ order, paymentCountdown: '' })
        this.buildStatus()
      }
      if (order.status === 'cancelled') orderBackend.cancelOrder(order.id, '支付超时').catch(err => console.error('sync expired order failed', err))
      return
    }
    this.setData({ order, paymentCountdown: paymentCountdown.formatRemaining(order.paymentDeadline) })
  },
  onDetailScroll(e) {
    const progress = Math.min(Math.max(e.detail.scrollTop / 82, 0), 1)
    const heroOpacity = Number((1 - progress * 0.82).toFixed(2))
    const heroLift = Number((progress * 108).toFixed(1))
    if (Math.abs(heroOpacity - this.heroOpacity) < 0.02 && progress !== 0 && progress !== 1) return
    this.setData({ heroOpacity, heroLift })
  },
  back() {
    if (this.fromPayResult) {
      uni.reLaunch({ url: '/pages/orders/orders' })
      return
    }
    uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/orders/orders' }) })
  },
  copy() { uni.setClipboardData({ data: this.order.id }) },
  async payNow() {
    let order = null
    try { order = await orderBackend.getOrder(this.order.id) } catch (err) { order = paymentCountdown.getOrder(this.order.id) }
    if (!order || order.status !== 'unpaid') {
      await this.loadOrder()
      return uni.showToast({ title: '该订单已取消', icon: 'none' })
    }
    store.set('sk_order_draft', order)
    uni.navigateTo({ url: `/pages/pay/pay?amount=${order.total}&existing=${order.id}` })
  },
  addRecommended(e) {
    const selectedFood = productBackend.getFoodById(e.currentTarget.dataset.id)
    if (!selectedFood) return
    this.setData({ selectedFood, showSpecSheet: true })
  },
  closeSpecSheet() { this.setData({ showSpecSheet: false }) },
  specAdded() {},
  goFoodDetail(e) { uni.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` }) },
  contact() { uni.showActionSheet({ itemList: ['联系商家', '联系骑手', '联系平台客服'], success: res => { uni.showToast({ title: ['商家电话已接通', '骑手电话已接通', '客服已接入'][res.tapIndex], icon: 'none' }) } }) },
  async confirmDelivery() {
    if (!['making', 'delivery'].includes(this.order.status)) return
    try {
      const order = await orderBackend.completeOrder(this.order.id)
      const orders = store.get('sk_orders', []).map(item => item.id === order.id ? order : item)
      store.set('sk_orders', orders)
      this.setData({ order })
      this.buildStatus()
      uni.showToast({ title: '订单已确认送达', icon: 'success' })
    } catch (err) {
      console.error('complete order failed', err)
      uni.showToast({ title: '操作失败，请重试', icon: 'none' })
    }
  },
  reviewOrder() {
    if (hasOrderReview(this.order)) {
      uni.showToast({ title: '该订单已评价', icon: 'none' })
      return
    }
    uni.navigateTo({ url: `/pages/review/review?id=${this.order.id}` })
  },
  again() {
    const cart = this.order.items.map(item => ({ ...item, checked: true }))
    store.set('sk_cart', cart)
    orderBackend.saveCart(cart).catch(err => console.error('sync cart failed', err))
    uni.navigateTo({ url: '/pages/cart/cart' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.detail-page{padding-bottom:150rpx}.detail-head{background:linear-gradient(145deg,#1d1d1f,#38383d);color:#fff;padding-bottom:35rpx;border-radius:0 0 44rpx 44rpx}.nav-more{color:#fff;font-size:28rpx}.status-block{padding:25rpx 34rpx}.status-block text{display:block}.status-block text:first-child{font-size:40rpx;font-weight:800}.status-block text:last-child{font-size:23rpx;color:#bbb;margin-top:9rpx}.step-row{display:flex;padding:15rpx 22rpx 0}.step{flex:1;display:flex;flex-direction:column;align-items:center;color:#777;font-size:17rpx}.step>view{width:37rpx;height:37rpx;border-radius:50%;background:#555;display:flex;align-items:center;justify-content:center;margin-bottom:8rpx}.step.done{color:#fff}.step.done>view{background:var(--orange)}.detail-content{padding:20rpx 24rpx}.detail-card{padding:26rpx;margin-bottom:18rpx}.card-title{display:flex;justify-content:space-between;align-items:center;font-weight:750;font-size:29rpx}.card-title button{color:var(--orange);font-size:21rpx}.detail-goods{display:flex;align-items:center;padding:20rpx 0}.detail-goods>view{width:110rpx;height:110rpx;border-radius:22rpx;display:flex;align-items:center;justify-content:center;font-size:52rpx}.detail-goods>text:nth-child(2){flex:1;padding-left:15rpx}.detail-goods>text:nth-child(2)>text{font-size:20rpx;color:#999}.detail-bill{border-top:1rpx solid #eee;padding-top:15rpx}.detail-bill>view{display:flex;justify-content:space-between;padding:10rpx 0;font-size:23rpx}.detail-bill .paid{font-size:29rpx;font-weight:750}.detail-bill .paid text:last-child{font-size:36rpx}.block-title{font-size:29rpx;font-weight:750;display:block;margin-bottom:16rpx}.info-row{display:flex;justify-content:space-between;padding:13rpx 0;font-size:22rpx}.info-row>text:first-child{color:#999}.info-row>text:last-child{text-align:right;max-width:480rpx}.info-row button{color:var(--orange);font-size:20rpx}.detail-actions{position:fixed;left:0;right:0;bottom:0;background:#fff;padding:20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));display:flex;justify-content:flex-end;gap:12rpx;box-shadow:0 -5rpx 20rpx rgba(0,0,0,.05)}.detail-actions button{height:70rpx;border-radius:24rpx;border:1rpx solid #ddd;padding:0 22rpx;font-size:22rpx}.detail-actions .primary-small{background:var(--orange);color:#fff;border-color:var(--orange)}

.step{min-width:0}.step text{text-align:center;white-space:nowrap;font-size:16rpx}.detail-card{padding:23rpx}.card-title{gap:14rpx}.card-title>text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card-title button{flex-shrink:0}
.detail-goods>view{width:98rpx;height:98rpx;flex-shrink:0;font-size:47rpx}.detail-goods>text:nth-child(2){min-width:0;white-space:pre-line;overflow:hidden;text-overflow:ellipsis}
.detail-goods>text:last-child{flex-shrink:0;margin-left:10rpx}.info-row{gap:18rpx}.info-row>text:first-child{flex-shrink:0}.info-row>text:last-child{min-width:0;max-width:430rpx;overflow-wrap:anywhere}
.detail-actions{flex-wrap:nowrap}.detail-actions button{height:66rpx;padding:0 18rpx}
.detail-actions.two-actions button{
  width:auto!important;
  min-width:0!important;
  flex:1;
}
.detail-actions.single-action button{
  width:260rpx!important;
  min-width:260rpx!important;
  flex:0 0 260rpx;
}
.detail-actions button,.card-title button,.info-row button{display:flex;align-items:center;justify-content:center;line-height:1;text-align:center}
.order-id-value{display:flex;align-items:center;justify-content:flex-end;gap:10rpx;min-width:0;max-width:480rpx}
.order-id-value>text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.order-id-value button,.info-row button{width:auto!important;min-width:0!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:var(--orange);font-size:20rpx;white-space:nowrap}
.step>view image{width:20rpx;height:20rpx;filter:brightness(0) invert(1)}
.detail-goods>view image{width:54rpx;height:54rpx}
.detail-back{
  color:#fff;
  justify-content:center;
}

.detail-back image{filter:brightness(0) invert(1)}

/* Mature order-page layering: only the title bar stays fixed. */
.detail-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
  background:#f5f5f7;
}
.detail-nav{
  flex-shrink:0;
  position:relative;
  z-index:30;
  color:#fff;
  background:#242426;
}
.detail-nav .nav-row{
  background:#242426;
}
.detail-scroll{
  flex:1;
  min-height:0;
  height:0;
  background:#f5f5f7;
}
.detail-hero{
  position:relative;
  min-height:260rpx;
  margin-top:-1rpx;
  padding:10rpx 0 48rpx;
  color:#fff;
  background:linear-gradient(180deg,#242426 0%,#303034 100%);
  border-radius:0 0 42rpx 42rpx;
  overflow:hidden;
  transform-origin:50% 0;
  will-change:opacity,transform;
}
.detail-hero-inner{
  min-height:260rpx;
}
.detail-hero::after{
  content:"";
  position:absolute;
  left:24rpx;
  right:24rpx;
  bottom:0;
  height:1rpx;
  background:rgba(255,255,255,.06);
}
.status-block{
  padding:20rpx 34rpx 18rpx;
}
.step-row{
  padding:12rpx 22rpx 0;
}
.detail-content{
  position:relative;
  z-index:2;
  margin-top:-26rpx;
  padding:0 24rpx;
}
.detail-card{
  box-shadow:0 8rpx 28rpx rgba(28,28,32,.055);
}
.recommend-section{padding:8rpx 0 12rpx}
.recommend-title{display:flex;align-items:center;justify-content:center;gap:18rpx;margin:10rpx 6rpx 20rpx;color:#999}
.recommend-title view{width:78rpx;height:1rpx;background:#d7d7dc}
.recommend-title text{font-size:22rpx;font-weight:500;white-space:nowrap}
.recommend-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18rpx}
.recommend-card{min-width:0;overflow:hidden;background:#fff;border-radius:30rpx;box-shadow:0 8rpx 28rpx rgba(28,28,32,.055)}
.recommend-visual{height:196rpx;position:relative;display:flex;align-items:center;justify-content:center}
.recommend-visual>image{width:94rpx;height:94rpx}
.recommend-tag{position:absolute;left:12rpx;top:12rpx;max-width:135rpx;padding:6rpx 10rpx;border-radius:10rpx;background:rgba(255,255,255,.88);color:#a94b2d;font-size:17rpx;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.recommend-info{padding:17rpx 16rpx 18rpx}
.recommend-name{display:block;font-size:25rpx;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.recommend-sales{display:flex;align-items:center;margin:8rpx 0 13rpx;color:#999;font-size:18rpx;white-space:nowrap}
.recommend-sales image{width:20rpx;height:20rpx;margin-right:5rpx}
.recommend-bottom{display:flex;align-items:center;justify-content:flex-start;gap:8rpx;width:100%}
.recommend-price{color:var(--orange);font-size:29rpx;font-weight:800}
.recommend-old{margin-left:5rpx;color:#aaa;text-decoration:line-through;font-size:17rpx}
.recommend-bottom button{width:50rpx!important;min-width:50rpx!important;max-width:50rpx!important;height:50rpx;flex:0 0 50rpx;margin-left:auto!important;padding:0!important;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:29rpx;line-height:1}
.detail-scroll-end{height:calc(170rpx + env(safe-area-inset-bottom))}

/* Keep every scrolling card below the fixed order actions. */
.detail-actions{z-index:80}
.detail-actions button,
.detail-actions .primary-small{
  border-radius:999rpx!important;
}
.detail-goods>view,.recommend-visual{overflow:hidden}
.detail-goods>view image,.recommend-visual>image{width:100%;height:100%;display:block}

/* Rotating progress halo for the single currently active order step. */
.step>view{
  position:relative;
  overflow:visible;
}
.step.current{
  color:#fff;
  font-weight:650;
}
.step.current>view{
  background:var(--orange);
  box-shadow:0 0 18rpx var(--theme-shadow);
}
.step.current>view::after{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:49rpx;
  height:49rpx;
  margin-left:-27rpx;
  margin-top:-27rpx;
  border:3rpx solid var(--theme-shadow);
  border-top-color:var(--theme-border);
  border-right-color:var(--orange);
  border-radius:50%;
  animation:order-step-spin 1.15s linear infinite;
  pointer-events:none;
}
@keyframes order-step-spin{
  to{transform:rotate(360deg)}
}

.detail-actions .disabled-action{
  background:#f3f3f5!important;
  color:#9a9aa0!important;
  border-color:#f3f3f5!important;
  box-shadow:none!important;
}

</style>


