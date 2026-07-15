<template>
<view :style="globalThemeStyle" class="page profile-page">
  <view :class="`profile-top ${profileTheme.tone === 'light' ? 'light-profile-theme' : ''} ${profileTheme.watermark ? 'limited-profile-theme' : ''}`" :style="`--profile-status-height:${statusHeight}px;background:${profileTheme.color}`">
    <text v-if="profileTheme.watermark" class="profile-v-watermark">V</text>
    <button hover-class="none" v-if="user" class="user-row" @tap="account">
      <view class="user-avatar"><image :src="user.avatar" mode="aspectFill" /></view>
      <view class="user-copy"><view class="name-line"><text class="user-name">{{user.nickname || ('食刻用户' + user.username)}}</text><text v-if="membershipActive" :class="`level-chip ${membershipTier === 'pro' ? 'pro-level-chip' : 'plus-level-chip'}`">{{membershipTier === 'pro' ? 'PRO会员' : 'PLUS会员'}}</text></view><text class="user-phone">{{user.username || '已登录账号'}}</text></view><text class="chev">›</text>
    </button>
    <button hover-class="none" v-else class="user-row" @tap="account">
      <view class="user-avatar guest"><image src="/static/assets/icons/user.svg" mode="aspectFit" /></view>
      <view class="user-copy"><text class="user-name">登录 / 注册</text><text class="user-phone">登录后享受更多服务</text></view><text class="chev">›</text>
    </button>
    <view class="stats">
      <button hover-class="none" data-url="/pages/coupons/coupons" @tap="goPage"><text class="stat-num">{{couponCount}}</text><text>优惠券</text></button>
      <view class="stats-divider"></view>
      <button hover-class="none" data-url="/pages/favorites/favorites" @tap="goPage"><text class="stat-num">{{favoriteCount}}</text><text>收藏</text></button>
      <view class="stats-divider"></view>
      <button hover-class="none" @tap="goOrders"><text class="stat-num">{{user ? '128' : '0'}}</text><text>积分</text></button>
    </view>
  </view>
  <view class="profile-content">
    <view class="order-panel card">
      <view class="section-head"><text class="panel-title">我的订单</text><button hover-class="none" class="section-more" @tap="goOrders">全部订单 ›</button></view>
      <view class="order-actions">
        <button hover-class="none" class="order-primary" data-status="unpaid" @tap="goOrders"><view class="action-icon"><image src="/static/assets/icons/payment.svg" mode="aspectFit" /><text v-if="unpaidCount">{{unpaidCount}}</text></view><text>待付款</text></button>
        <button hover-class="none" data-status="making" @tap="goOrders"><view class="action-icon"><image src="/static/assets/icons/shop.svg" mode="aspectFit" /><text v-if="activeOrderCount">{{activeOrderCount}}</text></view><text>进行中</text></button>
        <button hover-class="none" data-status="done" @tap="goOrders"><view class="action-icon"><image src="/static/assets/icons/success.svg" mode="aspectFit" /><text v-if="doneCount">{{doneCount}}</text></view><text>已完成</text></button>
        <button hover-class="none" @tap="goReviews"><view class="action-icon"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text v-if="reviewedCount">{{reviewedCount}}</text></view><text>我的评价</text></button>
      </view>
    </view>
    <view v-if="!membershipActive" class="member-card">
      <view class="member-copy"><view class="member-line"><text class="member-kicker">食刻 PLUS</text><text class="member-tag">每月省更多</text></view><text class="member-title">开通会员 · 每月领 ¥24 券包</text></view>
      <button hover-class="none" data-url="/pages/plus/plus" @tap="goPage">立即查看 <text>›</text></button>
    </view>
    <view class="service-card card">
      <text class="panel-title">常用服务</text>
      <view class="service-grid">
        <button hover-class="none" data-url="/pages/plus/plus" @tap="goPage"><view class="service-icon member-service"><image src="/static/assets/icons/star-filled.svg" mode="aspectFit" /></view><text>会员中心</text></button>
        <button hover-class="none" data-url="/pages/address/address" @tap="goPage"><view class="service-icon location-service"><image src="/static/assets/icons/location.svg" mode="aspectFit" /></view><text>地址管理</text></button>
        <button hover-class="none" class="service-featured" data-url="/pages/cart/cart" @tap="goPage"><view class="service-icon cart-service"><image src="/static/assets/icons/cart.svg" mode="aspectFit" /><text v-if="cartCount">{{cartCount}}</text></view><text>购物车</text></button>
        <button hover-class="none" data-url="/pages/wallet/wallet" @tap="goPage"><view class="service-icon wallet-service"><image src="/static/assets/icons/wallet.svg" mode="aspectFit" /></view><text>食刻钱包</text></button>
        <button hover-class="none" @tap="contact"><view class="service-icon support-service"><image src="/static/assets/icons/service.svg" mode="aspectFit" /></view><text>联系客服</text></button>
        <button hover-class="none" data-url="/pages/settings/settings" @tap="goPage"><view class="service-icon notice-service"><image src="/static/assets/icons/bell.svg" mode="aspectFit" /></view><text>消息设置</text></button>
      </view>
    </view>
  </view>
  <bottom-nav active="profile" />
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 个人中心页：汇总账号资料、订单状态、会员钱包和常用服务入口。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import profileTheme from '../../utils/profile-theme.js'
import wallet from '../../utils/wallet.js'
import membership from '../../utils/membership.js'
import favoriteBackend from '../../utils/favorite-backend.js'
import orderBackend from '../../utils/order-backend.js'
import benefitBackend from '../../utils/benefit-backend.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    user: null,
    cartCount: 0,
    couponCount: 0,
    favoriteCount: 0,
    unpaidCount: 0,
    activeOrderCount: 0,
    doneCount: 0,
    cancelledCount: 0,
    reviewedCount: 0,
    membershipActive: false,
    membershipTier: '',
    membershipExpireText: '',
    profileTheme: profileTheme.getTheme('black')
  },
  onLoad() { this.setData({ statusHeight: getApp().globalData.statusBarHeight }) },
  // 先用本地缓存立即渲染“我的”页，再在后台刷新后端数据，避免切换进来时长时间空白。
  onShow() {
    this.renderProfile()
    const user = store.get('sk_user', null)
    if (!user) return
    Promise.allSettled([
      favoriteBackend.fetchFavorites(),
      orderBackend.fetchOrders(),
      benefitBackend.syncBenefits(),
      wallet.fetchWallet({ force: true })
    ]).then(results => {
      const labels = ['fetch favorites failed', 'fetch orders failed', 'sync benefits failed', 'sync wallet failed']
      results.forEach((item, index) => {
        if (item.status === 'rejected') console.error(labels[index], item.reason)
      })
      this.renderProfile()
    })
  },
  // 同步用户资料、订单数量、收藏积分、会员状态和资料卡主题。
  renderProfile() {
    const user = store.get('sk_user', null)
    const orders = user ? store.get('sk_orders', []) : []
    let themeId = user ? store.get('sk_profile_theme', 'black') : 'black'
    let theme = profileTheme.getTheme(themeId)
    const membershipActive = user ? membership.isActive() : false
    if (theme.limited && !wallet.isOpened()) {
      themeId = 'black'
      theme = profileTheme.getTheme('black')
    }
    if (theme.membershipLimited && !membership.hasTier(theme.requiredTier || 'plus')) {
      themeId = 'black'
      theme = profileTheme.getTheme('black')
    }
    const memberRecord = membershipActive ? membership.getMembership() : null
    this.setData({
      user,
      cartCount: user ? store.cartSummary().count : 0,
      couponCount: user ? store.get('sk_coupons', []).filter(item => !item.used).length : 0,
      favoriteCount: user ? store.get('sk_favorites', []).length : 0,
      unpaidCount: orders.filter(item => item.status === 'unpaid').length,
      activeOrderCount: orders.filter(item => ['making', 'delivery'].includes(item.status)).length,
      doneCount: orders.filter(item => item.status === 'done').length,
      cancelledCount: orders.filter(item => item.status === 'cancelled').length,
      reviewedCount: orders.filter(item => item.status === 'done' && item.reviewed === true).length,
      membershipActive,
      membershipTier: membershipActive ? membership.getTier() : '',
      membershipExpireText: memberRecord ? membership.formatDate(memberRecord.expireAt) : '',
      profileTheme: theme
    })
  },
  login() { auth.requireLogin('/pages/profile/profile') },
  // 未登录时进入登录页，已登录时进入设置页。
  account() {
    if (!this.user) {
      auth.requireLogin('/pages/profile/profile')
      return
    }
    if (!auth.requireLogin('/pages/settings/settings')) return
    uni.navigateTo({ url: '/pages/settings/settings' })
  },
  // 订单快捷入口通过状态参数筛选相应订单。
  goOrders(e) {
    if (e.currentTarget.dataset.status) uni.setStorageSync('sk_order_filter', e.currentTarget.dataset.status)
    if (!auth.requireLogin('/pages/orders/orders')) return
    uni.redirectTo({ url: '/pages/orders/orders' })
  },
  goReviews() {
    if (!auth.requireLogin('/pages/my-reviews/my-reviews')) return
    uni.navigateTo({ url: '/pages/my-reviews/my-reviews' })
  },
  goPage(e) {
    const url = e.currentTarget.dataset.url
    if (auth.requireLogin(url)) uni.navigateTo({ url })
  },
  contact() { uni.showModal({ title: '联系食刻客服', content: '客服热线：400-888-2026\n服务时间：09:00—22:00', confirmText: '拨打电话', success: res => { if (res.confirm) uni.makePhoneCall({ phoneNumber: '4008882026' }) } }) }
}

export default adaptPage(pageConfig)
</script>

<style>
.profile-page{background:#f5f5f7}.profile-top{background:linear-gradient(155deg,#1c1c1e,#343439);color:#fff;padding-left:28rpx;padding-right:28rpx;padding-bottom:100rpx;border-radius:0 0 54rpx 54rpx}.user-row{width:100%;display:flex;align-items:center;text-align:left;color:#fff;padding:18rpx 0}.user-avatar{width:108rpx;height:108rpx;border-radius:38rpx;background:linear-gradient(145deg,#ffd6b7,#ff986a);display:flex;align-items:center;justify-content:center;font-size:55rpx;border:3rpx solid rgba(255,255,255,.7)}.user-avatar.guest{background:#4a4a4f}.user-copy{flex:1;padding-left:22rpx}.user-name,.user-phone{display:block}.user-name{font-size:38rpx;font-weight:750}.user-phone{font-size:22rpx;color:#b9b9be;margin-top:8rpx}.chev{font-size:47rpx;color:#888}.stats{display:grid;grid-template-columns:repeat(4,1fr);margin-top:35rpx}.stats button{color:#ddd;display:flex;flex-direction:column;align-items:center;font-size:21rpx}.stat-num{font-size:34rpx;color:#fff;font-weight:750;margin-bottom:7rpx}.profile-content{padding:0 24rpx 170rpx;margin-top:-62rpx}.order-panel{padding:27rpx;margin-bottom:20rpx}.panel-title{font-size:30rpx;font-weight:750}.order-actions{display:grid;grid-template-columns:repeat(4,1fr);margin-top:20rpx}.order-actions button,.service-grid button{display:flex;flex-direction:column;align-items:center;gap:10rpx;color:#555;font-size:22rpx}.order-actions button text:first-child{font-size:42rpx}.member-card{height:145rpx;border-radius:32rpx;background:linear-gradient(125deg,#262325,#403731);color:#f6d6a7;padding:27rpx;display:flex;align-items:center;justify-content:space-between;margin-bottom:20rpx}.member-kicker,.member-title{display:block}.member-kicker{font-size:30rpx;font-weight:800}.member-title{font-size:20rpx;margin-top:7rpx;color:#d4bea0}.member-card button{background:#f4d6aa;color:#563e26;border-radius:20rpx;padding:13rpx 18rpx;font-size:20rpx;font-weight:700}.service-card{padding:27rpx}.service-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:34rpx 12rpx;margin-top:28rpx}.service-grid button text:first-child{font-size:40rpx}

.user-avatar{flex-shrink:0}.user-copy{min-width:0}.user-name,.user-phone{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stats button,.order-actions button,.service-grid button{min-width:0}.stats button text:last-child,.order-actions button text:last-child,.service-grid button text:last-child{white-space:nowrap}
.order-panel,.service-card{padding:24rpx}.member-card{height:auto;min-height:138rpx;padding:24rpx;gap:14rpx}.member-card>view{flex:1;min-width:0}
.member-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.member-card button{flex-shrink:0;padding:12rpx 15rpx}
.service-grid{gap:30rpx 8rpx}.service-grid button{font-size:20rpx}
.user-row{width:100%!important;max-width:none!important}.member-card button{width:auto!important}
.stats,.order-actions,.service-grid{display:flex;flex-wrap:wrap}
.stats button{width:33.333%!important;flex:0 0 33.333%}.order-actions button{width:25%!important;flex:0 0 25%}.service-grid button{width:33.333%!important;flex:0 0 33.333%}
.stats button{margin-bottom:0}.order-actions{row-gap:18rpx}
.service-grid{row-gap:30rpx}.service-grid button{margin:0}
.stats button,.order-actions button,.service-grid button,.member-card button{justify-content:center;text-align:center}
.user-row{margin-top:12rpx}
.service-grid{
  display:flex;
  flex-wrap:wrap;
  column-gap:0;
  gap:0;
  row-gap:30rpx;
}
.service-grid button{
  width:33.333333%!important;
  max-width:33.333333%!important;
  flex:0 0 33.333333%!important;
  margin:0!important;
  padding:0 4rpx!important;
}
.user-avatar image{width:58rpx;height:58rpx}
.user-avatar.guest image{filter:brightness(0) invert(1);opacity:.9}
.order-actions button image,.service-grid button image{width:42rpx;height:42rpx}
.profile-content{padding-bottom:270rpx}

/* Keep the account row clear of the native top-right capsule. */
.profile-top{padding-top:calc(var(--profile-status-height, 20px) + 72rpx)!important}
.user-row{margin-top:0}

/* Align the order header edges and add breathing room to service rows. */
.order-panel .section-head{
  width:100%;
  display:grid;
  grid-template-columns:1fr auto;
  align-items:center;
  margin-bottom:20rpx;
}
.order-panel .section-more{
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  justify-self:end;
  margin:0!important;
  padding:0!important;
  text-align:right;
}
.service-grid{
  row-gap:46rpx;
}

/* More comfortable vertical rhythm for the two service cards. */
.order-panel{
  min-height:230rpx;
  padding:30rpx 28rpx 32rpx;
}
.order-panel .section-head{
  margin-bottom:30rpx;
}
.order-actions{
  margin-top:0;
  align-items:center;
}
.service-card{
  min-height:330rpx;
  padding:30rpx 28rpx 34rpx;
}
.service-card>.panel-title{
  display:block;
  margin-bottom:38rpx;
}
.service-grid{
  margin-top:0;
  row-gap:52rpx;
}
.profile-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
}

/* Logged-in avatar is a full-bleed photo without the orange frame. */
.user-avatar:not(.guest){
  overflow:hidden;
  padding:0;
  border:0;
  background:#f2f2f5;
}
.user-avatar:not(.guest) image{
  width:100%;
  height:100%;
  display:block;
}

/* Circular account avatar. */
.user-avatar,
.user-avatar.guest,
.user-avatar:not(.guest),
.user-avatar image{
  border-radius:50%;
}

/* Soft premium light sweep every two seconds. */
.member-card{
  position:relative;
  overflow:hidden;
  transform:translateZ(0);
}
.member-card::after{
  content:"";
  position:absolute;
  z-index:0;
  top:0;
  bottom:0;
  left:-18%;
  width:13%;
  transform:translate3d(0,0,0) skewX(-16deg);
  background:linear-gradient(90deg,transparent,rgba(255,242,212,.1),rgba(255,255,255,.2),rgba(255,242,212,.1),transparent);
  animation:member-light-sweep 3.5s ease-in-out infinite;
  will-change:transform,opacity;
  pointer-events:none;
}
.member-card>view,
.member-card>button{
  position:relative;
  z-index:1;
}
@keyframes member-light-sweep{
  0%{transform:translate3d(0,0,0) skewX(-16deg);opacity:0}
  4%{transform:translate3d(0,0,0) skewX(-16deg);opacity:.7}
  57%{transform:translate3d(1000%,0,0) skewX(-16deg);opacity:.7}
  61%,100%{transform:translate3d(1000%,0,0) skewX(-16deg);opacity:0}
}

/* Layered profile visual system. */
.profile-page{
  position:relative;
  background:linear-gradient(180deg,#ececf1 0,#f6f6f8 43%,#f2f2f5 100%);
}
.profile-top{
  position:relative;
  z-index:2;
  overflow:hidden;
  padding-left:24rpx;
  padding-right:24rpx;
  padding-bottom:112rpx;
  border-radius:0 0 28rpx 28rpx;
  background:#242426;
  box-shadow:0 20rpx 46rpx rgba(24,24,28,.22);
}
.user-row{
  min-height:126rpx;
  padding:12rpx 14rpx!important;
  border:0;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
.user-avatar{
  width:100rpx;
  height:100rpx;
  flex:0 0 100rpx;
  box-shadow:0 8rpx 24rpx rgba(0,0,0,.22),0 0 0 5rpx rgba(255,255,255,.12);
}
.user-copy{padding-left:20rpx}
.name-line{display:flex;align-items:center;gap:12rpx;min-width:0}
.user-name{font-size:34rpx;font-weight:800;letter-spacing:-1rpx}
.level-chip{flex-shrink:0;height:24rpx;padding:0 8rpx;border-radius:999rpx;display:inline-flex;align-items:center;justify-content:center;line-height:1;white-space:nowrap;font-size:14rpx;font-weight:750}
.plus-level-chip{
  color:#3f4852;
  border:1rpx solid rgba(255,255,255,.48);
  background:linear-gradient(135deg,#f8fafc 0%,#dce1e6 42%,#aab2bc 100%);
  box-shadow:inset 0 1rpx 0 rgba(255,255,255,.82),0 3rpx 9rpx rgba(20,28,38,.14);
}
.pro-level-chip{background:linear-gradient(135deg,#f4d5a1,#c7995e);color:#50371e}
.user-phone{margin-top:0;color:#d0d0d5;font-size:20rpx;line-height:1.2}
.user-tip{display:block;margin-top:5rpx;color:#8f8f96;font-size:17rpx}
.chev{color:#b3b3b9;font-size:38rpx}
.stats{
  display:flex;
  margin-top:26rpx;
}
.profile-top>button,.profile-top>.stats{position:relative;z-index:2}.profile-v-watermark{position:absolute;z-index:1;right:-55rpx;bottom:-175rpx;color:rgba(255,255,255,.16);font-family:Georgia,"Times New Roman",serif;font-size:430rpx;font-weight:700;font-style:italic;line-height:1;transform:rotate(-8deg);pointer-events:none}.profile-top.light-profile-theme{color:#352f25;box-shadow:0 20rpx 46rpx rgba(87,74,51,.18)}.profile-top.light-profile-theme .user-row{color:#352f25}.profile-top.light-profile-theme .user-phone,.profile-top.light-profile-theme .stats button,.profile-top.light-profile-theme .stats button>text:last-child,.profile-top.light-profile-theme .chev{color:rgba(45,42,38,.62)}.profile-top.light-profile-theme .stats .stat-num{color:#302b24}.profile-top.light-profile-theme .stats-divider{background:rgba(48,43,36,.22)}.profile-top.light-profile-theme .profile-v-watermark{color:rgba(255,255,255,.28);text-shadow:0 1rpx 0 rgba(70,60,45,.08)}
.stats button{
  width:33.333%!important;
  flex:0 0 33.333%;
  min-height:74rpx;
  padding:0!important;
  color:#c8c8cd;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  background:transparent;
}
.stats .stat-num{margin:0 0 7rpx;color:#fff;font-size:34rpx;line-height:1;font-weight:750}
.stats button>text:last-child{font-size:20rpx;color:#c7c7cc}
.stats button{
  width:auto!important;
  max-width:none!important;
  flex:1 1 0!important;
}
.stats-divider{
  width:2rpx;
  height:52rpx;
  flex:0 0 2rpx;
  align-self:center;
  border-radius:2rpx;
  background:rgba(235,235,240,.62);
}

/* Plain avatar: no frame, glow, border or decorative background. */
.user-avatar,
.user-avatar.guest,
.user-avatar:not(.guest){
  padding:0!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
  overflow:hidden;
}

.profile-content{
  position:relative;
  z-index:3;
  margin-top:-72rpx;
  padding:0 24rpx 270rpx;
}
.profile-content>.card{
  border:1rpx solid rgba(255,255,255,.85);
  background:linear-gradient(145deg,rgba(255,255,255,.98),rgba(250,250,252,.94));
  box-shadow:0 15rpx 38rpx rgba(49,49,62,.085),inset 0 1rpx rgba(255,255,255,.9);
}
.order-panel{
  min-height:224rpx;
  margin-bottom:18rpx;
  border-radius:35rpx;
  background:#fff!important;
  opacity:1;
}
.panel-title{font-size:29rpx;font-weight:800;letter-spacing:-.5rpx}
.order-panel .section-more{color:#999;font-size:21rpx}
.order-actions{position:relative}
.order-actions::before{
  content:"";
  position:absolute;
  left:12.5%;
  right:12.5%;
  top:39rpx;
  height:1rpx;
  z-index:0;
  background:linear-gradient(90deg,transparent,#ececf0 15%,#ececf0 85%,transparent);
}
.order-actions button{position:relative;z-index:1;gap:8rpx;color:#555;font-size:20rpx}
.action-icon{
  position:relative;
  width:66rpx;
  height:66rpx;
  border-radius:23rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#f1f1f3!important;
  box-shadow:0 5rpx 14rpx rgba(32,32,40,.05)!important;
}
.action-icon image{width:34rpx!important;height:34rpx!important}
.order-primary .action-icon{background:#f1f1f3!important}
.order-primary .action-icon image{filter:none}
.action-icon>text{
  position:absolute;
  right:-8rpx;
  top:-8rpx;
  min-width:28rpx;
  height:28rpx;
  padding:0 7rpx;
  border:3rpx solid #fff;
  border-radius:999rpx;
  background:#ff5c3b;
  color:#fff;
  font-size:15rpx;
  display:flex;
  align-items:center;
  justify-content:center;
}
.member-card{
  min-height:134rpx;
  padding:24rpx 26rpx;
  border:1rpx solid rgba(240,208,163,.18);
  border-radius:32rpx;
  background:
    radial-gradient(circle at 80% 20%,rgba(216,175,117,.13),transparent 34%),
    linear-gradient(125deg,#242123,#3c342f);
  box-shadow:0 15rpx 34rpx rgba(45,37,32,.18);
}
.member-line{display:flex;align-items:center;gap:10rpx}
.member-tag{padding:4rpx 9rpx;border-radius:999rpx;color:#d2b68d;background:rgba(246,214,167,.11);font-size:15rpx}
.member-card button{
  height:58rpx;
  padding:0 18rpx!important;
  border-radius:999rpx;
  background:linear-gradient(135deg,#ffe6ba,#d8ad72);
  color:#4c3420;
  box-shadow:0 7rpx 18rpx rgba(217,174,114,.2),inset 0 1rpx rgba(255,255,255,.55);
  display:flex;
  align-items:center;
  justify-content:center;
  gap:4rpx;
  line-height:1;
  white-space:nowrap;
}
.member-card button text{margin:0;font-size:24rpx;line-height:1}
.service-card{
  min-height:322rpx;
  border-radius:35rpx;
}
.service-card>.panel-title{margin-bottom:32rpx}
.service-grid{row-gap:34rpx}
.service-grid button{gap:9rpx;color:#57575d;font-size:19rpx}
.service-icon{
  position:relative;
  width:70rpx;
  height:58rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  background:transparent!important;
  box-shadow:none!important;
}
  .service-icon image{width:42rpx!important;height:42rpx!important}
  .member-service image{filter:sepia(1) saturate(1.25) hue-rotate(345deg) brightness(.88)}
.cart-service{width:70rpx;height:58rpx}
.cart-service image{filter:none}
.cart-service>text{
  position:absolute;
  right:-7rpx;
  top:-7rpx;
  min-width:27rpx;
  height:27rpx;
  padding:0 6rpx;
  border:3rpx solid #fff;
  border-radius:999rpx;
  background:#ff4d3d;
  color:#fff;
  font-size:14rpx;
  display:flex;
  align-items:center;
  justify-content:center;
}
.service-grid button>text{font-size:22rpx}
.service-featured>text{font-weight:600;color:#57575d}

/* The profile page follows the normal page scroll again. */
.profile-page{
  height:auto;
  min-height:100vh;
  overflow:visible;
  padding-bottom:calc(150rpx + env(safe-area-inset-bottom));
}

/* 个人中心按钮不使用 H5 默认内边距，避免标题、角标和图标被裁切。 */
.stats button,
.order-actions button,
.service-grid button{
  padding:0!important;
  border:0!important;
  overflow:visible!important;
  box-sizing:border-box;
  white-space:nowrap;
}
.cart-service>text{z-index:3;white-space:nowrap}

/* 我的订单卡片固定四等分，避免 H5 的按钮默认样式和历史布局规则把图标文字挤乱。 */
.order-panel .order-actions{
  position:relative!important;
  display:grid!important;
  grid-template-columns:repeat(4,minmax(0,1fr))!important;
  flex-wrap:nowrap!important;
  width:100%!important;
  margin:0!important;
  padding:0!important;
  gap:0!important;
  row-gap:0!important;
  align-items:start!important;
}
.order-panel .order-actions::before{
  top:34rpx!important;
  left:12.5%!important;
  right:12.5%!important;
  height:1rpx!important;
}
.order-panel .order-actions button,
.order-panel .order-actions uni-button{
  width:100%!important;
  min-width:0!important;
  max-width:none!important;
  height:96rpx!important;
  flex:0 0 auto!important;
  margin:0!important;
  padding:0 2rpx!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:8rpx!important;
  overflow:visible!important;
  color:#555!important;
  font-size:20rpx!important;
  line-height:1.15!important;
  text-align:center!important;
  white-space:nowrap!important;
}
.order-panel .order-actions button>text,
.order-panel .order-actions uni-button>text{
  display:block!important;
  width:100%!important;
  height:26rpx!important;
  line-height:26rpx!important;
  margin:0!important;
  padding:0!important;
  color:#555!important;
  font-size:19rpx!important;
  font-weight:400!important;
  white-space:nowrap!important;
  overflow:visible!important;
  text-align:center!important;
}
.order-panel .action-icon{
  position:relative!important;
  width:58rpx!important;
  height:58rpx!important;
  min-width:58rpx!important;
  max-width:58rpx!important;
  flex:0 0 58rpx!important;
  margin:0 auto!important;
  border-radius:18rpx!important;
  background:#f1f1f3!important;
  box-shadow:0 5rpx 14rpx rgba(32,32,40,.05)!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  overflow:visible!important;
}
.order-panel .action-icon image{
  width:32rpx!important;
  height:32rpx!important;
  display:block!important;
}
.order-panel .action-icon>text{
  position:absolute!important;
  right:-9rpx!important;
  top:-9rpx!important;
  width:auto!important;
  min-width:27rpx!important;
  height:27rpx!important;
  padding:0 6rpx!important;
  border:3rpx solid #fff!important;
  border-radius:999rpx!important;
  background:#ff5c3b!important;
  color:#fff!important;
  font-size:14rpx!important;
  font-weight:700!important;
  line-height:27rpx!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  white-space:nowrap!important;
  z-index:3!important;
}

</style>
