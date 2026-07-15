<template>
<view :style="globalThemeStyle" class="page security-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">账号与支付安全</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <view class="security-content">
    <view class="setting-group card">
      <text class="group-title">密码修改</text>
      <button hover-class="none" class="setting-row" @tap="changeLoginPassword">
        <text>登录密码</text>
        <text>›</text>
      </button>
      <button hover-class="none" class="setting-row" @tap="changeWalletPassword">
        <text>食刻钱包支付密码</text>
        <text>›</text>
      </button>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import auth from '../../utils/auth.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    checking: false
  },
  onLoad() {
    if (!auth.guardPage('/pages/account-security/account-security')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight || 20 })
  },
  back() {
    uni.navigateBack()
  },
  securityCheckThenGo(url) {
    if (this.checking) return
    this.setData({ checking: true })
    uni.showLoading({ title: '环境安全检测中', mask: true })
    this.securityTimer = setTimeout(() => {
      uni.hideLoading()
      uni.showToast({ title: '支付环境检测安全', icon: 'none', duration: 900 })
      this.securityNavigateTimer = setTimeout(() => {
        this.setData({ checking: false })
        uni.navigateTo({ url })
      }, 850)
    }, 4000)
  },
  changeLoginPassword() {
    this.securityCheckThenGo('/pages/change-login-password/change-login-password')
  },
  changeWalletPassword() {
    this.securityCheckThenGo('/pages/wallet-password/wallet-password')
  },
  onUnload() {
    if (this.securityTimer) clearTimeout(this.securityTimer)
    if (this.securityNavigateTimer) clearTimeout(this.securityNavigateTimer)
    if (this.checking) uni.hideLoading()
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.security-page{min-height:100vh;background:#f5f5f7}
.security-content{padding:24rpx}
.setting-group{padding:10rpx 26rpx;margin-bottom:20rpx}
.group-title{display:block;font-size:21rpx;color:#999;font-weight:400;line-height:1.2;padding:18rpx 0 8rpx}
.setting-row{position:relative;width:100%!important;height:86rpx!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:space-between;background:transparent!important;text-align:left}
.setting-row::after{border:0!important}
.setting-row:not(:last-child)::before{content:'';position:absolute;left:0;right:0;bottom:0;height:1rpx;background:#ededf0}
.setting-row text:first-child{font-size:27rpx;font-weight:650;color:#111}
.setting-row text:last-child{font-size:22rpx;color:#999}
</style>
