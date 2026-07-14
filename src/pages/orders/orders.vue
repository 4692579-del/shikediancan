<template>
<view :style="globalThemeStyle" class="page orders-page">
  <view class="orders-head" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <text class="nav-title">我的订单</text>
      <view class="nav-back"></view>
    </view>
    <view class="order-tabs">
      <button hover-class="none" :class="active !== 'unpaid' ? 'active' : ''" @tap="toggleStatusMenu">
        <text>{{ activeLabel }}</text>
        <text :class="`tab-arrow ${showStatusMenu ? 'open' : ''}`">▼</text>
      </button>
      <button hover-class="none" :class="active === 'unpaid' ? 'active' : ''" data-id="unpaid" @tap="selectTab">待付款</button>
    </view>
    <view v-if="showStatusMenu" class="status-menu">
      <button
        v-for="item in moreTabs"
        :key="item.id"
        hover-class="none"
        :class="active === item.id ? 'selected' : ''"
        :data-id="item.id"
        @tap="selectMoreTab"
      >{{ item.name }}</button>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="order-list">
    <view v-for="item in filtered" :key="item.id" class="order-card card">
      <view class="order-head">
        <view class="shop-logo">食</view>
        <text class="order-shop">{{ item.shopName || '食刻·品质厨房' }} ›</text>
        <text :class="`status ${item.status}`">{{ statusLabel(item.status) }}</text>
      </view>

      <view class="order-goods">
        <view class="food-stack">
          <view
            v-for="food in (item.items || []).slice(0, 3)"
            :key="food.key || food.id || food.name"
            class="mini-food"
            :style="`background:${food.bg || '#f6e2c9'}`"
          >
            <image v-if="food.icon" :src="food.icon" mode="aspectFill" />
            <text v-else>食</text>
          </view>
        </view>
        <view class="order-summary">
          <text>{{ orderSummary(item) }}</text>
          <text>实付 ¥{{ item.total }}</text>
        </view>
      </view>

      <view class="order-time">{{ item.createdAt }}</view>
      <view :class="`order-actions ${item.status === 'unpaid' ? 'has-pay' : ''}`">
        <button
          v-if="item.status === 'unpaid' || item.status === 'done' || item.status === 'cancelled'"
          hover-class="none"
          class="more-action"
          :data-id="item.id"
          :data-status="item.status"
          @tap.stop="moreActions"
        >
          <view class="more-dots"><text></text><text></text><text></text></view>
        </button>
        <button hover-class="none" class="orange-btn action-main" :data-id="item.id" @tap.stop="detail">查看详情</button>
        <button v-if="item.status === 'unpaid'" hover-class="none" class="pay-main" :data-id="item.id" @tap.stop="pay">立即支付</button>
      </view>
    </view>

    <view v-if="!filtered.length" class="empty">
      <view class="empty-icon"><image src="/static/assets/icons/order.svg" mode="aspectFit" /></view>
      <view class="empty-title">还没有相关订单</view>
      <view class="empty-desc">下单后可以在这里查看进度</view>
      <button hover-class="none" class="primary-btn" @tap="goMenu">去点餐</button>
    </view>
    <view class="order-list-end"></view>
  </scroll-view>

  <bottom-nav active="orders" />
</view>
</template>
<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import paymentCountdown from '../../utils/payment-countdown.js'
import orderBackend from '../../utils/order-backend.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    active: 'all',
    activeLabel: '全部',
    showStatusMenu: false,
    orders: [],
    filtered: [],
    cartCount: 0,
    moreTabs: [
      { id: 'all', name: '全部' },
      { id: 'making', name: '进行中' },
      { id: 'done', name: '已完成' },
      { id: 'reviewed', name: '已评价' },
      { id: 'cancelled', name: '已取消' }
    ]
  },
  onLoad() {
    if (!auth.guardPage('/pages/orders/orders')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  async onShow() {
    const active = uni.getStorageSync('sk_order_filter') || this.active
    uni.removeStorageSync('sk_order_filter')
    const activeLabel = active === 'unpaid' ? '全部' : (this.moreTabs.find(item => item.id === active) || this.moreTabs[0]).name
    let orders = []
    try {
      orders = await orderBackend.fetchOrders()
    } catch (err) {
      console.error('fetch backend orders failed', err)
      orders = paymentCountdown.normalizeOrders()
    }
    this.setData({ orders, active, activeLabel, showStatusMenu: false, cartCount: store.cartSummary().count })
    this.filter()
  },
  toggleStatusMenu() { this.setData({ showStatusMenu: !this.showStatusMenu }) },
  selectTab(e) {
    this.setData({ active: e.currentTarget.dataset.id, showStatusMenu: false })
    this.filter()
  },
  selectMoreTab(e) {
    const active = e.currentTarget.dataset.id
    const activeLabel = this.moreTabs.find(item => item.id === active).name
    this.setData({ active, activeLabel, showStatusMenu: false })
    this.filter()
  },
  filter() {
    const { orders, active } = this
    const filtered = active === 'all'
      ? orders
      : active === 'making'
        ? orders.filter(item => ['making', 'delivery'].includes(item.status))
        : active === 'done'
          ? orders.filter(item => item.status === 'done' && !item.reviewed && !item.review)
          : active === 'reviewed'
            ? orders.filter(item => item.status === 'done' && (item.reviewed || item.review))
            : orders.filter(item => item.status === active)
    this.setData({ filtered })
  },
  statusLabel(status) {
    const map = {
      unpaid: '待付款',
      making: '商家制作中',
      delivery: '配送中',
      done: '已完成',
      cancelled: '订单已取消'
    }
    return map[status] || '进行中'
  },
  orderSummary(item) {
    const items = item.items || []
    if (!items.length) return '订单商品'
    return `${items[0].name}${items.length > 1 ? ` 等${items.length}件` : ''}`
  },
  detail(e) {
    uni.navigateTo({ url: `/pages/order-detail/order-detail?id=${e.currentTarget.dataset.id}` })
  },
  async pay(e) {
    const id = e.currentTarget.dataset.id
    let order = null
    try {
      order = await orderBackend.getOrder(id)
    } catch (err) {
      console.error('load pay order failed', err)
      order = paymentCountdown.getOrder(id)
    }
    if (!order || order.status !== 'unpaid') {
      await this.onShow()
      return uni.showToast({ title: '该订单已取消', icon: 'none' })
    }
    store.set('sk_order_draft', order)
    uni.navigateTo({ url: `/pages/pay/pay?amount=${order.total}&existing=${order.id}` })
  },
  moreActions(e) {
    const { id, status } = e.currentTarget.dataset
    const itemList = status === 'unpaid'
      ? ['取消订单']
      : status === 'cancelled'
        ? ['删除订单']
        : ['再来一单', '删除订单']
    uni.showActionSheet({
      itemList,
      success: res => {
        if (status === 'unpaid') this.cancelOrder(id)
        else if (status === 'cancelled') this.deleteOrder(id)
        else if (res.tapIndex === 0) this.againOrder(id)
        else this.deleteOrder(id)
      }
    })
  },
  cancelOrder(id) {
    uni.showModal({
      title: '取消订单',
      content: '确定要取消这笔待付款订单吗？',
      success: async res => {
        if (!res.confirm) return
        try {
          const order = await orderBackend.cancelOrder(id)
          const orders = this.orders.map(item => item.id === id ? order : item)
          store.set('sk_orders', orders)
          this.setData({ orders })
          this.filter()
          uni.showToast({ title: '订单已取消' })
        } catch (err) {
          console.error('cancel order failed', err)
          uni.showToast({ title: '取消失败，请重试', icon: 'none' })
        }
      }
    })
  },
  async againOrder(id) {
    const order = this.orders.find(item => item.id === id)
    if (!order || !order.items) return
    const cart = order.items.map(item => ({ ...item, checked: true }))
    store.set('sk_cart', cart)
    orderBackend.saveCart(cart).catch(err => console.error('sync cart failed', err))
    uni.navigateTo({ url: '/pages/cart/cart' })
  },
  deleteOrder(id) {
    uni.showModal({
      title: '删除订单',
      content: '删除后无法恢复，确定删除这笔订单吗？',
      confirmColor: '#ff4d3d',
      success: async res => {
        if (!res.confirm) return
        try {
          await orderBackend.deleteOrder(id)
          const orders = this.orders.filter(item => item.id !== id)
          store.set('sk_orders', orders)
          this.setData({ orders })
          this.filter()
          uni.showToast({ title: '订单已删除' })
        } catch (err) {
          console.error('delete order failed', err)
          uni.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    })
  },
  goMenu() { uni.redirectTo({ url: '/pages/menu/menu' }) }
}

export default adaptPage(pageConfig)
</script>

<style>
.orders-head{background:#fff;position:sticky;top:0;z-index:20}.order-tabs{white-space:nowrap;height:80rpx;padding:0 25rpx}.order-tabs button{display:inline-flex;height:80rpx;align-items:center;padding:0 31rpx;color:#888;position:relative}.order-tabs button.active{color:#222;font-weight:700}.order-tabs button.active::after{content:"";position:absolute;bottom:5rpx;left:50%;width:38rpx;height:6rpx;border-radius:3rpx;background:var(--orange);transform:translateX(-50%)}.order-list{padding:22rpx 24rpx 170rpx}.order-card{width:100%;padding:25rpx;text-align:left;margin-bottom:20rpx}.order-head{display:flex;align-items:center}.shop-logo{width:50rpx;height:50rpx;border-radius:17rpx;background:#1c1c1e;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:750;margin-right:12rpx}.order-shop{font-weight:700;flex:1}.status{font-size:22rpx;color:#888}.status.unpaid{color:var(--orange)}.status.making,.status.delivery{color:#199b61}.order-goods{display:flex;align-items:center;margin:22rpx 0}.food-stack{display:flex}.mini-food{width:100rpx;height:100rpx;border-radius:22rpx;display:flex;align-items:center;justify-content:center;font-size:43rpx;margin-right:8rpx}.order-summary{flex:1;text-align:right}.order-summary text{display:block}.order-summary text:first-child{font-size:22rpx;color:#777;margin-bottom:12rpx}.order-summary text:last-child{font-weight:750}.order-time{font-size:20rpx;color:#aaa;border-bottom:1rpx solid #eee;padding-bottom:18rpx}.order-actions{display:flex;justify-content:flex-end;gap:12rpx;padding-top:18rpx}.order-actions button{height:62rpx;border-radius:22rpx;padding:0 21rpx;font-size:22rpx}.plain{border:1rpx solid #ddd}.orange-btn{background:var(--orange);color:#fff}

.order-tabs{padding:0 12rpx;display:flex}.order-tabs button{flex:1;justify-content:center;padding:0 10rpx}
.order-card{padding:22rpx}.order-shop{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status{flex-shrink:0;margin-left:10rpx}
.order-goods{min-width:0}.food-stack{max-width:190rpx;flex-shrink:0;overflow:hidden}.mini-food{width:84rpx;height:84rpx;font-size:38rpx;margin-right:7rpx}
.order-summary{min-width:0}.order-summary text:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.order-actions{flex-wrap:wrap}.order-actions button{height:60rpx;min-width:126rpx;padding:0 18rpx}
.order-card{width:100%!important;max-width:none!important}.order-actions button{width:auto!important;flex:0 0 auto}
.order-actions{align-items:center}.order-actions button{display:flex;align-items:center;justify-content:center;line-height:1;white-space:nowrap}
.mini-food image{width:48rpx;height:48rpx}
.empty-icon image{width:104rpx;height:104rpx}

/* Secondary actions live in the left overflow menu; primary actions align right. */
.order-actions{
  width:100%;
  flex-wrap:nowrap;
  justify-content:flex-start;
}
.order-actions .more-action{
  width:64rpx!important;
  min-width:64rpx!important;
  max-width:64rpx!important;
  flex:0 0 64rpx!important;
  height:60rpx;
  padding:0!important;
  border:0;
  border-radius:0;
  background:transparent;
  color:#777;
  font-size:27rpx;
  letter-spacing:2rpx;
}
.order-actions .action-main{
  width:188rpx!important;
  min-width:188rpx!important;
  max-width:188rpx!important;
  flex:0 0 188rpx!important;
  height:64rpx;
  margin-left:auto!important;
  padding:0!important;
  border-radius:22rpx;
}

/* Pin secondary and primary actions to opposite card edges. */
.order-actions{
  display:grid;
  grid-template-columns:64rpx 1fr 188rpx;
  column-gap:0;
  align-items:center;
}
.order-actions .more-action{
  grid-column:1;
  justify-self:start;
}
.order-actions .action-main{
  grid-column:3;
  justify-self:end;
  margin-left:0!important;
}

/* Use an internal scroll area without the native page scrollbar. */
.orders-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.orders-head{flex-shrink:0}
.order-list{
  flex:1;
  min-height:0;
  height:0;
  padding:22rpx 24rpx 0;
  background:#f5f5f7;
  box-sizing:border-box;
}
.order-list-end{height:calc(150rpx + env(safe-area-inset-bottom))}
.status.cancelled{color:#999}

/* Order card actions use the same capsule language as the status bars. */
.order-actions button,
.action-main{
  border-radius:999rpx;
}

.order-actions .orange-btn,
.order-actions .plain,
.order-actions .action-main{
  border-radius:999rpx!important;
}
.mini-food{overflow:hidden}.mini-food image{width:100%;height:100%;display:block}

/* Expandable order status filter. */
.orders-head{position:relative}
.order-tabs{
  overflow:visible;
}
.order-tabs button{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8rpx;
}
.tab-arrow{
  font-size:17rpx;
  color:#999;
  transition:transform .2s ease;
}
.tab-arrow.open{transform:rotate(180deg)}
.status-menu{
  position:absolute;
  left:24rpx;
  top:calc(100% - 4rpx);
  z-index:60;
  width:260rpx;
  padding:12rpx;
  border-radius:24rpx;
  background:#fff;
  box-shadow:0 16rpx 45rpx rgba(28,28,32,.16);
}
.status-menu button{
  width:100%!important;
  height:66rpx;
  padding:0 18rpx!important;
  border-radius:16rpx;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  color:#555;
  font-size:23rpx;
}
.status-menu button.selected{
  color:var(--orange);
  background:var(--orange-soft);
  font-weight:700;
}

/* 娓呴櫎璁㈠崟椤电瓫閫夋寜閽湪 H5 涓嬬殑榛樿娴呯伆搴曡壊锛岄€変腑椤逛粛鐢变笂闈㈢殑瑙勫垯鍗曠嫭鐫€鑹层€?*/
.order-tabs button,
.status-menu button{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.status-menu button.selected{background:var(--orange-soft)!important}

/* 璁㈠崟鍗＄墖閲囩敤绱у噾淇℃伅灞傜骇锛岄伩鍏嶅晢鍝併€佹椂闂村拰鎿嶄綔鍖轰箣闂寸暀涓嬭繃澶х殑绌虹櫧銆?*/
.order-card{
  display:block;
  box-sizing:border-box;
  padding:18rpx 20rpx!important;
  margin-bottom:14rpx!important;
  background:#fff!important;
  border:0!important;
}
.order-head{min-height:50rpx}
.shop-logo{width:46rpx;height:46rpx;flex:0 0 46rpx;border-radius:15rpx}
.order-goods{margin:12rpx 0!important;min-height:76rpx}
.mini-food{width:76rpx;height:76rpx;border-radius:18rpx}
.order-summary text:first-child{margin-bottom:7rpx}
.order-time{padding-bottom:12rpx}
.order-actions{padding-top:12rpx!important;min-height:50rpx}
.order-actions .more-action{
  width:54rpx!important;
  min-width:54rpx!important;
  max-width:54rpx!important;
  height:50rpx!important;
  flex:0 0 54rpx!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:0!important;
  border-radius:50%!important;
  background:transparent!important;
  box-shadow:none!important;
}
.more-dots{display:flex;align-items:center;justify-content:center;gap:5rpx}
.more-dots text{width:7rpx;height:7rpx;border-radius:50%;background:#777;display:block}
.order-actions .action-main{height:52rpx!important}

/* 姣忓紶璁㈠崟鍗＄墖鍙€氳繃鍙充笅瑙掆€滄煡鐪嬭鎯呪€濊繘鍏ヨ鎯呴〉锛岄伩鍏嶆暣寮犲崱鐗囪瑙︺€?*/
.order-actions{
  display:grid!important;
  grid-template-columns:60rpx 1fr 168rpx!important;
  align-items:center!important;
  width:100%!important;
  gap:0!important;
  padding-top:12rpx!important;
}
.order-actions .more-action{
  grid-column:1!important;
  justify-self:start!important;
}
.order-actions .action-main,
uni-button.action-main.orange-btn{
  grid-column:3!important;
  justify-self:end!important;
  width:168rpx!important;
  min-width:168rpx!important;
  max-width:168rpx!important;
  height:54rpx!important;
  margin:0!important;
  padding:0!important;
  border-radius:999rpx!important;
  background:var(--orange)!important;
  color:#fff!important;
  box-shadow:0 8rpx 18rpx var(--theme-shadow)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:22rpx!important;
  font-weight:700!important;
  line-height:1!important;
  white-space:nowrap!important;
}

/* H5 涓〉闈㈡牱寮忎細鍏ㄥ眬鍙犲姞锛岀‘璁よ鍗曢〉鐨?.order-goods 鏇炬薄鏌撹鍗曞崱鐗囥€?   杩欓噷鐢ㄩ〉闈㈡牴绫诲己鍒堕攣瀹氳鍗曞垪琛ㄧ殑绱у噾甯冨眬锛屽埛鏂板墠鍚庝繚鎸佷竴鑷淬€?*/
.orders-page .order-card{
  width:auto!important;
  max-width:none!important;
  min-height:0!important;
  padding:16rpx 20rpx!important;
  margin:0 0 14rpx!important;
  border-radius:28rpx!important;
  overflow:hidden!important;
}
.orders-page .order-card .order-head{
  min-height:48rpx!important;
  height:48rpx!important;
  display:flex!important;
  align-items:center!important;
}
.orders-page .order-card .shop-logo{
  width:44rpx!important;
  height:44rpx!important;
  flex:0 0 44rpx!important;
  margin-right:10rpx!important;
  border-radius:14rpx!important;
}
.orders-page .order-card .order-goods{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  width:100%!important;
  min-height:72rpx!important;
  height:72rpx!important;
  margin:10rpx 0 12rpx!important;
  padding:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
.orders-page .order-card .food-stack{
  width:86rpx!important;
  max-width:86rpx!important;
  flex:0 0 86rpx!important;
  overflow:hidden!important;
}
.orders-page .order-card .mini-food{
  width:72rpx!important;
  height:72rpx!important;
  flex:0 0 72rpx!important;
  margin-right:0!important;
  border-radius:18rpx!important;
}
.orders-page .order-card .order-summary{
  flex:1 1 auto!important;
  min-width:0!important;
  height:72rpx!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-end!important;
  justify-content:center!important;
  text-align:right!important;
}
.orders-page .order-card .order-summary text:first-child{
  width:100%!important;
  margin:0 0 6rpx!important;
  color:#777!important;
  font-size:21rpx!important;
  line-height:1.2!important;
}
.orders-page .order-card .order-summary text:last-child{
  width:100%!important;
  margin:0!important;
  font-size:27rpx!important;
  font-weight:800!important;
  line-height:1.2!important;
}
.orders-page .order-card .order-time{
  height:42rpx!important;
  padding:0 0 10rpx!important;
  display:flex!important;
  align-items:flex-start!important;
  font-size:20rpx!important;
  line-height:1!important;
}
.orders-page .order-card .order-actions{
  min-height:60rpx!important;
  height:60rpx!important;
  padding-top:14rpx!important;
  display:grid!important;
  grid-template-columns:60rpx 1fr 168rpx!important;
  align-items:center!important;
}
.orders-page .order-card .action-main,
.orders-page .order-card uni-button.action-main{
  height:50rpx!important;
  background:#fff!important;
  color:var(--orange)!important;
  border:2rpx solid var(--orange)!important;
  box-shadow:none!important;
  font-weight:700!important;
}

/* 璁㈠崟鍗＄墖鏈€缁堣瑙夛細鐣ュ井澧為珮鍗＄墖涓庢搷浣滃尯锛屾寜閽悓楂樺悓瀹斤紝寰呮敮浠樿ˉ鍏呪€滅珛鍗虫敮浠樷€濄€?*/
.orders-page .order-card{
  padding:20rpx 22rpx!important;
  margin:0 0 16rpx!important;
  border-radius:28rpx!important;
}
.orders-page .order-card .order-goods{
  min-height:84rpx!important;
  height:84rpx!important;
  margin:14rpx 0 14rpx!important;
}
.orders-page .order-card .food-stack{
  width:98rpx!important;
  max-width:98rpx!important;
  flex:0 0 98rpx!important;
}
.orders-page .order-card .mini-food{
  width:82rpx!important;
  height:82rpx!important;
  flex:0 0 82rpx!important;
  border-radius:20rpx!important;
}
.orders-page .order-card .order-summary{
  height:84rpx!important;
}
.orders-page .order-card .order-time{
  height:48rpx!important;
  padding:0 0 13rpx!important;
}
.orders-page .order-card .order-actions{
  min-height:82rpx!important;
  height:82rpx!important;
  padding-top:17rpx!important;
  display:grid!important;
  grid-template-columns:60rpx 1fr 178rpx!important;
  align-items:center!important;
  column-gap:0!important;
}
.orders-page .order-card .order-actions.has-pay{
  grid-template-columns:60rpx 1fr 178rpx 18rpx 178rpx!important;
}
.orders-page .order-card .more-action{
  grid-column:1!important;
  align-self:center!important;
}
.orders-page .order-card .action-main,
.orders-page .order-card uni-button.action-main{
  grid-column:3!important;
  justify-self:end!important;
  width:178rpx!important;
  min-width:178rpx!important;
  max-width:178rpx!important;
  height:62rpx!important;
  border-radius:999rpx!important;
  background:#fff!important;
  color:var(--orange)!important;
  border:2rpx solid var(--orange)!important;
  box-shadow:none!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:0!important;
  margin:0!important;
  font-size:22rpx!important;
  font-weight:700!important;
  line-height:1!important;
  white-space:nowrap!important;
}
.orders-page .order-card .pay-main,
.orders-page .order-card uni-button.pay-main{
  grid-column:5!important;
  justify-self:end!important;
  width:178rpx!important;
  min-width:178rpx!important;
  max-width:178rpx!important;
  height:62rpx!important;
  border-radius:999rpx!important;
  background:var(--orange)!important;
  color:#fff!important;
  border:2rpx solid var(--orange)!important;
  box-shadow:0 8rpx 18rpx var(--theme-shadow)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  padding:0!important;
  margin:0!important;
  font-size:22rpx!important;
  font-weight:700!important;
  line-height:1!important;
  white-space:nowrap!important;
}

</style>


