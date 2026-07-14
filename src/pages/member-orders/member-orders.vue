<template>
<view :style="globalThemeStyle" class="page member-orders-page" @tap="closeSwipe">
  <view class="safe-nav member-orders-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">会员订单</text><view class="nav-back"></view></view>
    <view class="member-order-tabs">
      <button hover-class="none" :class="activeTab === 'unpaid' ? 'active' : ''" data-id="unpaid" @tap="tab">待支付</button>
      <button hover-class="none" :class="`completed-tab ${activeTab === 'completed' ? 'active' : ''}`" data-id="completed" @tap.stop="tab">
        <text>{{completedFilter === 'cancelled' ? '已取消' : '已完成'}}</text>
        <view :class="`tab-arrow ${showCompletedMenu ? 'open' : ''}`"></view>
      </button>
      <view v-if="showCompletedMenu" class="completed-menu">
        <button hover-class="none" :class="completedFilter === 'paid' ? 'selected' : ''" data-status="paid" @tap.stop="chooseCompletedFilter">已完成</button>
        <button hover-class="none" :class="completedFilter === 'cancelled' ? 'selected' : ''" data-status="cancelled" @tap.stop="chooseCompletedFilter">已取消</button>
      </view>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="member-order-scroll">
    <view class="member-order-list">
      <view v-for="(item, index) in visibleOrders" :key="item.id" class="member-order-swipe">
        <view v-if="item.status !== 'unpaid'" class="member-order-delete"><button hover-class="none" :data-id="item.id" @tap.stop="deleteOrder"><image src="/static/assets/icons/delete.svg" mode="aspectFit" /><text>删除</text></button></view>
        <view :class="`member-order-card ${swipedId === item.id ? 'swiped' : ''}`" :data-id="item.id" :data-status="item.status" @touchstart="touchStart" @touchend="touchEnd">
          <view class="order-card-head"><view :class="`member-level level-${item.tier}`">{{item.tier === 'pro' ? 'PRO' : 'PLUS'}}</view><view><text>{{item.tierText}}</text><text>{{item.operationText}}</text></view><text :class="`order-status status-${item.status}`">{{item.statusText}}</text></view>
          <view class="order-plan"><view><text>{{item.planName}}</text><text>{{item.createdText}}</text></view><view><text>¥</text><text>{{item.amountText}}</text></view></view>
          <view class="order-card-foot">
            <text>订单号 {{item.id}}</text>
            <view v-if="item.status === 'unpaid'" class="foot-actions">
              <button hover-class="none" class="cancel-order" :data-id="item.id" @tap.stop="cancelOrder">取消订单</button>
              <button hover-class="none" class="continue-pay" :data-id="item.id" @tap.stop="continuePay">继续支付</button>
            </view>
            <button v-else-if="item.status === 'paid'" class="view-rights" hover-class="none" @tap.stop="viewMembership">查看权益</button>
          </view>
        </view>
      </view>

      <view v-if="visibleOrders.length === 0" class="member-order-empty">
        <view><image src="/static/assets/icons/order.svg" mode="aspectFit" /></view>
        <text>{{activeTab === 'unpaid' ? '暂无待支付会员订单' : completedFilter === 'cancelled' ? '暂无已取消会员订单' : '暂无已完成会员订单'}}</text>
        <text>{{activeTab === 'unpaid' ? '选择会员方案后会在这里保留支付记录' : completedFilter === 'cancelled' ? '取消的会员订单会显示在这里' : '开通或续费成功后会显示在这里'}}</text>
      </view>
      <view class="orders-safe"></view>
    </view>
  </scroll-view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 会员订单页：管理待支付、已完成与已取消的会员订单。

import auth from '../../utils/auth.js'
import membership from '../../utils/membership.js'
import benefitBackend from '../../utils/benefit-backend.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    activeTab: 'unpaid',
    completedFilter: 'paid',
    showCompletedMenu: false,
    orders: [],
    visibleOrders: [],
    touchStartX: 0,
    swipedId: ''
  },

  onLoad() {
    if (!auth.guardPage('/pages/member-orders/member-orders')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },

  onShow() {
    this.renderOrders(benefitBackend.getCachedMemberOrders())
    this.refresh()
  },

  back() {
    uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/plus/plus' }) })
  },

  // 读取当前账号会员订单，并同步处理超时状态。
  async refresh() {
    let source = []
    try {
      source = await benefitBackend.fetchMemberOrders()
    } catch (err) {
      console.error('fetch member orders failed', err)
      source = membership.getPaymentList()
    }
    this.renderOrders(source)
  },

  renderOrders(source = []) {
    const orders = source.map(item => ({
      ...item,
      amountText: Number(item.paidAmount || item.amount || 0).toFixed(2),
      createdText: this.formatTime(item.createdAt),
      statusText: item.status === 'paid' ? '已完成' : item.status === 'unpaid' ? '待支付' : '已取消',
      tierText: item.tier === 'pro' ? '食刻会员 PRO' : '食刻 PLUS',
      operationText: item.operation === 'upgrade' ? '补款升级' : item.operation === 'renew' ? '会员续费' : '会员开通'
    }))
    this.setData({ orders }, () => this.filterOrders())
  },

  formatTime(timestamp) {
    const date = new Date(Number(timestamp || Date.now()))
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  tab(e) {
    const activeTab = e.currentTarget.dataset.id
    if (activeTab === 'completed' && this.activeTab === 'completed') {
      this.setData({ showCompletedMenu: !this.showCompletedMenu, swipedId: '' })
      return
    }
    this.setData({ activeTab, showCompletedMenu: false, swipedId: '' }, () => this.filterOrders())
  },

  chooseCompletedFilter(e) {
    this.setData({
      activeTab: 'completed',
      completedFilter: e.currentTarget.dataset.status,
      showCompletedMenu: false,
      swipedId: ''
    }, () => this.filterOrders())
  },

  // 待支付独立展示；已完成页可下拉切换查看已取消订单。
  filterOrders() {
    const targetStatus = this.activeTab === 'completed' ? this.completedFilter : 'unpaid'
    const visibleOrders = this.orders.filter(item => item.status === targetStatus)
    this.setData({ visibleOrders })
  },

  touchStart(e) {
    this.setData({ touchStartX: e.touches[0].clientX })
  },

  // 待支付订单左滑用于取消，已结束订单左滑用于删除。
  touchEnd(e) {
    const id = e.currentTarget.dataset.id
    if (e.currentTarget.dataset.status === 'unpaid') {
      this.setData({ swipedId: '' })
      return
    }
    const endX = e.changedTouches[0].clientX
    const distance = endX - this.touchStartX
    if (distance < -45) this.setData({ swipedId: id })
    else if (distance > 35 || this.swipedId !== id) this.setData({ swipedId: '' })
  },

  closeSwipe() {
    if (this.swipedId || this.showCompletedMenu) {
      this.setData({ swipedId: '', showCompletedMenu: false })
    }
  },

  // 付款前校验当前会员等级，防止支付已不适用的旧订单。
  async continuePay(e) {
    const id = e.currentTarget.dataset.id
    let order = null
    try {
      order = await benefitBackend.getMemberOrder(id)
    } catch (err) {
      order = membership.getPayment(id)
    }
    if (!order || order.status !== 'unpaid') {
      this.refresh()
      return uni.showToast({ title: '该订单已失效', icon: 'none' })
    }
    const validation = membership.canPayPayment(order)
    if (!validation.allowed) {
      return uni.showModal({ title: '无法支付', content: validation.message, showCancel: false })
    }
    uni.navigateTo({ url: `/pages/pay/pay?type=membership&payment=${order.id}&amount=${order.amount}` })
  },

  // 用户确认后手动取消会员待支付订单。
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    uni.showModal({
      title: '取消会员订单',
      content: '取消后该订单将无法继续支付，确认取消吗？',
      confirmText: '取消订单',
      confirmColor: '#ef6644',
      success: async res => {
        if (!res.confirm) return
        try {
          await benefitBackend.cancelMemberOrder(id)
        } catch (err) {
          const cancelled = membership.cancelPayment(id)
          if (!cancelled) {
            this.refresh()
            return uni.showToast({ title: err.message || '该订单已失效', icon: 'none' })
          }
        }
        this.refresh()
        uni.showToast({ title: '订单已取消', icon: 'none' })
      }
    })
  },

  viewMembership() {
    uni.navigateTo({ url: '/pages/plus/plus' })
  },

  async deleteOrder(e) {
    const id = e.currentTarget.dataset.id
    let order = null
    try {
      order = await benefitBackend.getMemberOrder(id)
    } catch (err) {
      order = membership.getPayment(id)
    }
    if (!order || order.status === 'unpaid') {
      return uni.showToast({ title: '待支付订单请先取消', icon: 'none' })
    }
    uni.showModal({
      title: '删除会员订单',
      content: '删除后无法恢复，确认删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#ff4d3d',
      success: async res => {
        if (!res.confirm) return
        try {
          await benefitBackend.deleteMemberOrder(id)
        } catch (err) {
          membership.deletePayment(id)
        }
        this.setData({ swipedId: '' })
        this.refresh()
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.member-orders-page{position:relative;height:100vh;min-height:0;padding-bottom:0;display:flex;flex-direction:column;overflow:hidden;isolation:isolate;background:#f5f5f7}
.member-orders-nav{position:relative;z-index:30;flex:none;overflow:visible!important;background:#f2f3f6;backdrop-filter:none}
.member-order-tabs{position:relative;height:76rpx;padding:0 70rpx;display:flex;align-items:center}
.member-order-tabs button{position:relative;flex:1;height:76rpx;display:flex;align-items:center;justify-content:center;color:#999;font-size:24rpx}
.member-order-tabs button.active{color:#222;font-weight:750}
.member-order-tabs button.active::after{content:"";position:absolute;left:50%;bottom:6rpx;width:38rpx;height:6rpx;border-radius:999rpx;background:var(--orange);transform:translateX(-50%)}
.completed-tab{gap:9rpx}
.tab-arrow{width:11rpx;height:11rpx;margin-top:-6rpx;border-right:2rpx solid currentColor;border-bottom:2rpx solid currentColor;transform:rotate(45deg);transition:transform .2s ease,margin .2s ease}
.tab-arrow.open{margin-top:6rpx;transform:rotate(225deg)}
.completed-menu{position:absolute;z-index:999;right:68rpx;top:66rpx;width:176rpx;padding:9rpx;border:1rpx solid rgba(30,35,43,.05);border-radius:24rpx;background:#fff;box-shadow:0 14rpx 38rpx rgba(30,35,43,.18)}
.completed-menu button{width:100%;height:62rpx;color:#777;border-radius:17rpx;font-size:21rpx}
.completed-menu button.selected{color:var(--orange);background:var(--theme-soft)}
.completed-menu button::after{display:none!important}
.member-order-scroll{position:relative;z-index:1;flex:1;min-height:0;background:#f5f5f7}
.member-order-list{min-height:100%;padding:22rpx 24rpx;background:#f5f5f7}
.member-order-swipe{position:relative;isolation:isolate;margin-bottom:18rpx;overflow:hidden;border-radius:34rpx;background:#f5f5f7}
.member-order-delete{position:absolute;z-index:1;top:0;right:0;bottom:0;width:112rpx;display:flex;align-items:center;justify-content:center;background:transparent}
.member-order-delete button{width:74rpx!important;height:74rpx;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3rpx;background:#ed594a;color:#fff;font-size:16rpx;box-shadow:0 8rpx 20rpx rgba(120,35,25,.18)}
.member-order-delete image{width:25rpx;height:25rpx;filter:brightness(0) invert(1)}
.member-order-card{position:relative;z-index:2;padding:24rpx;border-radius:34rpx;background:#fff;box-shadow:0 9rpx 28rpx rgba(38,42,50,.06);transform:translateX(0);transition:transform .24s cubic-bezier(.22,.61,.36,1)}
.member-order-card.swiped{transform:translateX(-112rpx)}
.order-card-head{display:flex;align-items:center;padding-bottom:20rpx;border-bottom:1rpx solid #f0f0f2}
.member-level{width:66rpx;height:66rpx;flex:0 0 66rpx;margin-right:15rpx;border-radius:22rpx;display:flex;align-items:center;justify-content:center;color:#fff;font-size:17rpx;font-weight:850}
.level-plus{background:linear-gradient(145deg,#adb5be,#596472)}
.level-pro{background:linear-gradient(145deg,#d9b56e,#865c2e)}
.order-card-head>view:nth-child(2){flex:1;min-width:0;display:flex;flex-direction:column;gap:5rpx}
.order-card-head>view:nth-child(2) text:first-child{font-size:27rpx;font-weight:780;color:#29292d}
.order-card-head>view:nth-child(2) text:last-child{font-size:19rpx;color:#999}
.order-status{font-size:20rpx;font-weight:700}.status-unpaid{color:var(--orange)}.status-paid{color:#56916f}.status-cancelled{color:#999}
.order-plan{min-height:105rpx;display:flex;align-items:center;justify-content:space-between}
.order-plan>view:first-child{display:flex;flex-direction:column;gap:9rpx;min-width:0}
.order-plan>view:first-child text:first-child{font-size:24rpx;font-weight:680;color:#3c3c41}
.order-plan>view:first-child text:last-child{font-size:18rpx;color:#aaa}
.order-plan>view:last-child{display:flex;align-items:baseline;color:#242428}
.order-plan>view:last-child text:first-child{font-size:20rpx;font-weight:700}
.order-plan>view:last-child text:last-child{font-size:35rpx;font-weight:850}
.order-card-foot{height:70rpx;padding-top:13rpx;border-top:1rpx solid #f0f0f2;display:flex;align-items:center;justify-content:space-between}
.order-card-foot>text{max-width:390rpx;color:#aaa;font-size:16rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.order-card-foot>button,.foot-actions button{height:58rpx;border-radius:999rpx;display:flex;align-items:center;justify-content:center;font-size:20rpx;font-weight:700}
.order-card-foot>button{width:150rpx!important}
.foot-actions{display:flex;align-items:center;gap:10rpx}
.foot-actions button{width:128rpx!important}
.foot-actions .cancel-order{color:#777;background:#fff;border:1rpx solid #dedee2}
.foot-actions .continue-pay,.view-rights{color:#fff;background:var(--theme-gradient)}
.member-order-empty{padding:150rpx 20rpx 60rpx;display:flex;flex-direction:column;align-items:center;text-align:center}
.member-order-empty>view{width:110rpx;height:110rpx;border-radius:38rpx;background:#e8ebef;display:flex;align-items:center;justify-content:center}
.member-order-empty image{width:52rpx;height:52rpx;opacity:.55}
.member-order-empty>text:nth-child(2){margin-top:26rpx;font-size:28rpx;font-weight:750;color:#444}
.member-order-empty>text:nth-child(3){margin-top:11rpx;font-size:19rpx;color:#aaa}
.orders-safe{height:60rpx}

/* 待支付订单底部操作区固定为单行左右布局，避免按钮文字被挤成竖排。 */
.order-card-foot>text{flex:1;min-width:0}
.foot-actions{flex:0 0 auto;white-space:nowrap}
.foot-actions button,
.order-card-foot>button{
  white-space:nowrap!important;
  word-break:keep-all!important;
  writing-mode:horizontal-tb!important;
  overflow:visible!important;
  padding:0 14rpx!important;
}

/* 会员订单“已完成”筛选下拉，统一为“我的订单-全部”同款浮层样式。 */
.member-orders-page .member-orders-nav{
  overflow:visible!important;
  z-index:80!important;
}
.member-orders-page .member-order-tabs{
  position:relative!important;
  overflow:visible!important;
  z-index:90!important;
}
.member-orders-page .member-order-tabs button{
  background:transparent!important;
  box-shadow:none!important;
}
.member-orders-page .member-order-tabs button::after,
.member-orders-page .completed-menu button::after{
  display:none!important;
}
.member-orders-page .member-order-tabs button.active::after{
  display:block!important;
}
.member-orders-page .completed-tab{
  gap:8rpx!important;
}
.member-orders-page .tab-arrow{
  width:auto!important;
  height:auto!important;
  margin:0!important;
  border:0!important;
  color:#999!important;
  font-size:17rpx!important;
  line-height:1!important;
  transform:none!important;
  transition:transform .2s ease!important;
}
.member-orders-page .tab-arrow::before{
  content:"▼";
}
.member-orders-page .tab-arrow.open{
  transform:rotate(180deg)!important;
}
.member-orders-page .completed-menu{
  position:absolute!important;
  right:58rpx!important;
  top:72rpx!important;
  z-index:120!important;
  width:260rpx!important;
  padding:12rpx!important;
  border:0!important;
  border-radius:24rpx!important;
  background:#fff!important;
  box-shadow:0 18rpx 48rpx rgba(35,35,40,.12)!important;
}
.member-orders-page .completed-menu button{
  width:100%!important;
  height:66rpx!important;
  padding:0 18rpx!important;
  border-radius:16rpx!important;
  display:flex!important;
  align-items:center!important;
  justify-content:flex-start!important;
  background:transparent!important;
  color:#555!important;
  font-size:23rpx!important;
  font-weight:400!important;
  text-align:left!important;
}
.member-orders-page .completed-menu button.selected{
  color:var(--orange)!important;
  background:var(--orange-soft)!important;
  font-weight:700!important;
}

/* 会员订单左滑删除圆钮：收紧图标和文字的上下距离。 */
.member-orders-page .member-order-delete button{
  gap:0!important;
  line-height:1!important;
}
.member-orders-page .member-order-delete image{
  width:23rpx!important;
  height:23rpx!important;
  margin:0 0 1rpx!important;
}
.member-orders-page .member-order-delete text{
  margin-top:0!important;
  font-size:16rpx!important;
  line-height:18rpx!important;
  white-space:nowrap!important;
}
.foot-actions button{width:116rpx!important}

</style>
