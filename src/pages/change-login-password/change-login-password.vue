<template>
<view :style="globalThemeStyle" class="page password-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">修改登录密码</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <view class="password-content">
    <view class="password-card card">
      <text class="field-label">原登录密码</text>
      <view class="pill-input">
        <input :password="!showOld" placeholder="请输入原登录密码" :value="oldPassword" @input="inputOld" />
        <button hover-class="none" @tap="toggleOld"><image :src="showOld ? '/static/assets/icons/eye.svg' : '/static/assets/icons/eye-off.svg'" mode="aspectFit" /></button>
      </view>
      <text class="field-label">新登录密码</text>
      <view class="pill-input">
        <input :password="!showNew" placeholder="请输入6-20位新密码" :value="newPassword" @input="inputNew" />
        <button hover-class="none" @tap="toggleNew"><image :src="showNew ? '/static/assets/icons/eye.svg' : '/static/assets/icons/eye-off.svg'" mode="aspectFit" /></button>
      </view>
      <text class="field-label">确认新密码</text>
      <view class="pill-input">
        <input password placeholder="请再次输入新密码" :value="confirmPassword" @input="inputConfirm" />
      </view>
      <text class="field-tip">登录密码用于账号登录，修改后请使用新密码重新登录。</text>
    </view>
    <button hover-class="none" class="primary-btn save-btn" :disabled="saving" @tap="submit">{{saving ? '保存中…' : '保存修改'}}</button>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import auth from '../../utils/auth.js'
import wallet from '../../utils/wallet.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    showOld: false,
    showNew: false,
    saving: false
  },
  onLoad() {
    if (!auth.guardPage('/pages/change-login-password/change-login-password')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight || 20 })
  },
  back() { uni.navigateBack() },
  inputOld(e) { this.setData({ oldPassword: e.detail.value || '' }) },
  inputNew(e) { this.setData({ newPassword: e.detail.value || '' }) },
  inputConfirm(e) { this.setData({ confirmPassword: e.detail.value || '' }) },
  toggleOld() { this.setData({ showOld: !this.showOld }) },
  toggleNew() { this.setData({ showNew: !this.showNew }) },
  async submit() {
    if (this.saving) return
    const oldPassword = String(this.oldPassword || '')
    const newPassword = String(this.newPassword || '')
    const confirmPassword = String(this.confirmPassword || '')
    if (oldPassword.length < 6 || newPassword.length < 6 || newPassword.length > 20) {
      uni.showToast({ title: '密码需为6-20位', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      uni.showToast({ title: '两次新密码不一致', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await wallet.changeLoginPassword(oldPassword, newPassword)
      uni.showToast({ title: '登录密码已修改', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 420)
    } catch (error) {
      uni.showToast({ title: error.message || '修改失败，请重试', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.password-page{min-height:100vh;background:#f5f5f7}
.password-content{padding:24rpx}
.password-card{padding:28rpx}
.field-label{display:block;margin:8rpx 0 16rpx;color:#888;font-size:22rpx}
.pill-input{height:88rpx;margin-bottom:22rpx;padding:0 24rpx;border-radius:999rpx;background:#f7f7f9;border:1rpx solid rgba(0,0,0,.04);display:flex;align-items:center}
.pill-input input{flex:1;height:88rpx;font-size:26rpx;color:#222}
.pill-input button{width:54rpx!important;height:54rpx!important;margin:0!important;padding:0!important;background:transparent!important;display:flex;align-items:center;justify-content:center}
.pill-input button::after{border:0!important}
.pill-input image{width:32rpx;height:32rpx;opacity:.62}
.field-tip{display:block;margin-top:2rpx;color:#999;font-size:21rpx;line-height:1.5}
.save-btn{height:88rpx;margin-top:24rpx;display:flex;align-items:center;justify-content:center;line-height:1}
</style>
