<template>
<view class="dock-wrap">
  <view v-if="!loggedIn" class="login-prompt">
    <view class="login-prompt-copy">
      <text class="login-prompt-title">登录后享更多优惠</text>
      <text class="login-prompt-sub">优惠券、订单与购物车随时查看</text>
    </view>
    <button hover-class="none" class="login-prompt-btn" @tap="loginNow">立即登录</button>
  </view>
  <view class="dock">
    <block v-for="(item, index) in tabs" :key="item.key">
      <button hover-class="none" :class="`tab ${active === item.key ? 'active' : ''}`" :data-key="item.key" :data-url="item.url" @tap="switchTab">
        <view class="tab-icon-wrap">
          <image class="tab-icon" :src="item.icon" mode="aspectFit" />
        </view>
        <text class="tab-label">{{item.label}}</text>
      </button>
    </block>
  </view>
</view>
</template>

<script>
import adaptComponent from '@/utils/component-adapter.js'
// 自定义底部导航组件：负责页面切换、登录提示与购物车角标同步。

import auth from '../../utils/auth.js'
import store from '../../utils/store.js'
const componentConfig = {
  properties: {
    active: { type: String, value: 'home' }
  },
  data: {
    loggedIn: false,
    navigating: false,
    tabs: [
      { key: 'home', icon: '/static/assets/icons/home.svg', label: '首页', url: '/pages/home/home' },
      { key: 'menu', icon: '/static/assets/icons/food.svg', label: '点餐', url: '/pages/menu/menu' },
      { key: 'orders', icon: '/static/assets/icons/order.svg', label: '订单', url: '/pages/orders/orders' },
      { key: 'profile', icon: '/static/assets/icons/user.svg', label: '我的', url: '/pages/profile/profile' }
    ]
  },
  lifetimes: {
    // 组件挂载后同步登录状态和购物车角标。
    attached() {
      this.refreshLogin()
    }
  },
  pageLifetimes: {
    show() { this.refreshLogin() }
  },
  methods: {
    refreshLogin() {
      this.setData({ loggedIn: store.isLogin() })
    },
    // 未登录提示条的立即登录入口，并记录当前页面作为返回目标。
    loginNow() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const target = current ? auth.buildUrl(`/${current.route}`, current.options || {}) : '/pages/profile/profile'
      auth.requireLogin(target)
    },
    // 自定义导航使用 redirectTo 切换页面，避免堆积页面栈。
    switchTab(e) {
      const { key, url } = e.currentTarget.dataset
      if (key === this.active || this.navigating) return
      if (key === 'orders' && !auth.requireLogin(url)) return
      this.setData({ navigating: true })
      uni.redirectTo({
        url,
        fail: () => this.setData({ navigating: false })
      })
    },
  }
}

export default adaptComponent(componentConfig)
</script>

<style>
.dock-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 90;
  padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
  pointer-events: none;
}
.login-prompt{
  width:calc(100% - 20rpx);
  min-height:76rpx;
  margin:0 auto 12rpx;
  padding:11rpx 12rpx 11rpx 28rpx;
  border-radius:28rpx;
  display:flex;
  align-items:center;
  gap:14rpx;
  color:#fff;
  background:linear-gradient(135deg,#2d2d30,#1c1c1e);
  box-shadow:0 12rpx 30rpx rgba(28,28,32,.18);
  pointer-events:auto;
}
.login-prompt-copy{flex:1;min-width:0;display:flex;flex-direction:column}
.login-prompt-title{font-size:22rpx;font-weight:750}
.login-prompt-sub{font-size:17rpx;color:#b9b9be;margin-top:3rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.login-prompt-btn{
  width:116rpx!important;
  min-width:116rpx!important;
  max-width:116rpx!important;
  height:48rpx;
  flex:0 0 116rpx;
  margin:0!important;
  padding:0!important;
  border-radius:999rpx;
  box-sizing:border-box;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  background:var(--orange)!important;
  flex-shrink:0;
  font-size:20rpx;
  font-weight:700;
  line-height:1;
  white-space:nowrap;
  overflow:visible;
}
.dock {
  position:relative;
  height: 108rpx;
  padding: 0 12rpx;
  border-radius: 38rpx;
  display: flex;
  align-items: center;
  background: rgba(255,255,255,.96);
  box-shadow: 0 14rpx 48rpx rgba(27,27,32,.14);
  pointer-events: auto;
}
.tab {
  position:relative;
  z-index:1;
  flex: 1;
  min-width: 0;
  height: 84rpx;
  margin:0 5rpx;
  border-radius:26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0a0a6;
  padding:0!important;
  border:0!important;
  box-sizing:border-box;
  overflow:visible;
}
.tab-icon-wrap { width: 54rpx; height: 48rpx; display:flex; align-items:center; justify-content:center; position:relative; }
.tab-icon {
  width:36rpx;
  height:36rpx;
  opacity:.62;
  filter:grayscale(1) brightness(.75);
}
.tab-label { font-size: 21rpx; margin-top: 2rpx; }
.tab.active {
  color:#fff;
  background:var(--theme-gradient);
  box-shadow:0 8rpx 18rpx var(--theme-shadow);
}
.tab.active .tab-icon{
  opacity:1;
  filter:brightness(0) invert(1);
}
.tab.active .tab-label{font-weight:700}

/* H5 原生按钮默认内边距会裁切选中态图标，导航项统一清零并保持图标完整。 */
uni-button.tab,
uni-button.tab.active{
  padding:0!important;
  border:0!important;
  overflow:visible!important;
  box-sizing:border-box;
}

/* Unified capsule treatment for horizontal status bars. */
.login-prompt{
  border-radius:999rpx;
}
.login-prompt-btn{
  border-radius:999rpx;
}
uni-button.login-prompt-btn,
.login-prompt .login-prompt-btn{
  width:116rpx!important;
  min-width:116rpx!important;
  max-width:116rpx!important;
  height:48rpx!important;
  flex:0 0 116rpx!important;
  border-radius:999rpx!important;
  background:var(--orange)!important;
  color:#fff!important;
  box-shadow:none!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:20rpx!important;
  font-weight:700!important;
  line-height:1!important;
  white-space:nowrap!important;
}
.dock{
  border-radius:999rpx;
}
.tab,
.tab.active{
  border-radius:999rpx;
}

/* 选中胶囊内部留出上边距，避免图标贴住橙色背景顶部。 */
.tab,
.tab.active{
  justify-content:center!important;
  padding-top:6rpx!important;
  padding-bottom:5rpx!important;
}
.tab .tab-icon-wrap,
.tab.active .tab-icon-wrap{
  height:38rpx!important;
  margin-bottom:3rpx!important;
  align-items:center!important;
}
.tab.active .tab-icon{
  width:34rpx!important;
  height:34rpx!important;
}
.tab .tab-label,
.tab.active .tab-label{
  margin-top:0!important;
  line-height:24rpx!important;
}

</style>
