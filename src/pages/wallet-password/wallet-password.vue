<template>
<view :style="globalThemeStyle" class="page wallet-password-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">食刻钱包支付密码</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <view class="password-content">
    <view v-if="!walletReady" class="password-loading">
      <view class="wallet-loading-spinner"></view>
      <text>正在同步钱包状态…</text>
    </view>

    <view v-if="walletReady && !walletOpened" class="empty-card card">
      <image src="/static/assets/icons/wallet.svg" mode="aspectFit" />
      <text>请先开通食刻钱包</text>
      <text>开通时会引导你设置 6 位数字支付密码。</text>
      <button hover-class="none" class="primary-btn" @tap="goWallet">去开通</button>
    </view>

    <view v-if="walletReady && walletOpened" class="pay-panel card">
      <view class="panel-head">
        <button hover-class="none" class="panel-close" @tap="back">×</button>
        <text>{{panelTitle}}</text>
        <view class="panel-placeholder"></view>
      </view>

      <view class="panel-body">
        <text class="panel-tip">{{panelTip}}</text>
        <view class="password-boxes">
          <view v-for="item in passwordSlots" :key="item" class="password-cell">
            <view v-if="inputValue.length > item" class="password-dot"></view>
          </view>
        </view>
        <text v-if="stepMessage" class="step-message">{{stepMessage}}</text>
      </view>

      <view class="number-keyboard">
        <button v-for="item in numberKeys" :key="item" hover-class="none" :data-digit="item" @tap="inputDigit">{{item}}</button>
        <view class="keyboard-blank"></view>
        <button hover-class="none" data-digit="0" @tap="inputDigit">0</button>
        <button hover-class="none" class="delete-key" @tap="deleteDigit">⌫</button>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import auth from '../../utils/auth.js'
import wallet from '../../utils/wallet.js'

const STEP_TEXT = {
  old: {
    title: '验证支付密码',
    tip: '请输入原 6 位数字支付密码'
  },
  set: {
    title: '设置支付密码',
    tip: '请设置 6 位数字，用于食刻钱包支付与提现'
  },
  confirm: {
    title: '确认支付密码',
    tip: '请再次输入，确认新的支付密码'
  }
}

const pageConfig = {
  data: {
    statusHeight: 20,
    walletReady: false,
    walletOpened: false,
    payPasswordSet: false,
    step: 'set',
    panelTitle: STEP_TEXT.set.title,
    panelTip: STEP_TEXT.set.tip,
    inputValue: '',
    oldPassword: '',
    firstPassword: '',
    saving: false,
    stepMessage: '',
    passwordSlots: [0, 1, 2, 3, 4, 5],
    numberKeys: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  },
  onLoad() {
    if (!auth.guardPage('/pages/wallet-password/wallet-password')) return
    const cached = wallet.getWallet()
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight || 20,
      walletReady: cached.opened === true,
      walletOpened: cached.opened,
      payPasswordSet: !!cached.payPasswordSet
    })
    if (cached.opened) {
      this.setStep(cached.payPasswordSet ? 'old' : 'set')
    }
  },
  onShow() {
    this.refresh()
  },
  async refresh() {
    const data = await wallet.fetchWallet({ force: true }).catch(() => wallet.getWallet())
    const step = data.opened && data.payPasswordSet ? 'old' : 'set'
    this.setData({
      walletReady: true,
      walletOpened: data.opened,
      payPasswordSet: !!data.payPasswordSet,
      inputValue: '',
      oldPassword: '',
      firstPassword: '',
      stepMessage: ''
    })
    this.setStep(step)
  },
  setStep(step, extra = {}) {
    const text = STEP_TEXT[step] || STEP_TEXT.set
    this.setData({
      step,
      panelTitle: text.title,
      panelTip: text.tip,
      ...extra
    })
  },
  back() {
    if (this.saving) return
    uni.navigateBack()
  },
  goWallet() {
    uni.navigateTo({ url: '/pages/wallet/wallet' })
  },
  inputDigit(e) {
    if (this.saving || this.inputValue.length >= 6) return
    const digit = String(e.currentTarget.dataset.digit || '')
    if (!/^\d$/.test(digit)) return
    const next = `${this.inputValue}${digit}`
    this.setData({ inputValue: next, stepMessage: '' })
    if (next.length === 6) {
      this.completeTimer = setTimeout(() => this.handleComplete(next), 180)
    }
  },
  deleteDigit() {
    if (this.saving || !this.inputValue) return
    this.setData({ inputValue: this.inputValue.slice(0, -1), stepMessage: '' })
  },
  handleComplete(value) {
    if (this.step === 'old') {
      this.setStep('set', {
        oldPassword: value,
        inputValue: '',
        stepMessage: '原密码已输入，请设置新的支付密码'
      })
      return
    }
    if (this.step === 'set') {
      this.setStep('confirm', {
        firstPassword: value,
        inputValue: '',
        stepMessage: ''
      })
      return
    }
    if (value !== this.firstPassword) {
      uni.showToast({ title: '两次密码不一致，请重新设置', icon: 'none' })
      this.setStep('set', {
        inputValue: '',
        firstPassword: '',
        stepMessage: ''
      })
      return
    }
    this.submit(value)
  },
  async submit(confirmPassword) {
    if (this.saving) return
    this.setData({ saving: true })
    uni.showLoading({ title: '保存中', mask: true })
    try {
      if (this.payPasswordSet) {
        await wallet.changePayPassword(this.oldPassword, confirmPassword)
      } else {
        await wallet.setPayPassword(confirmPassword)
      }
      uni.hideLoading()
      uni.showToast({ title: '支付密码已保存', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 420)
    } catch (error) {
      uni.hideLoading()
      uni.showToast({ title: error.message || '保存失败，请重试', icon: 'none' })
      const step = this.payPasswordSet ? 'old' : 'set'
      this.setStep(step, {
        inputValue: '',
        oldPassword: '',
        firstPassword: '',
        stepMessage: ''
      })
    } finally {
      this.setData({ saving: false })
    }
  },
  onUnload() {
    if (this.completeTimer) clearTimeout(this.completeTimer)
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.wallet-password-page{min-height:100vh;background:#f5f5f7}
.password-content{min-height:calc(100vh - 120rpx);padding:24rpx 24rpx 0}
.password-loading{min-height:520rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#999;font-size:22rpx}
.password-loading .wallet-loading-spinner{width:58rpx;height:58rpx;margin-bottom:18rpx;border:6rpx solid rgba(0,0,0,.08);border-top-color:var(--orange);border-radius:50%;animation:wallet-spin .8s linear infinite}
@keyframes wallet-spin{to{transform:rotate(360deg)}}
.pay-panel{position:fixed;left:0;right:0;bottom:0;z-index:20;margin:0!important;padding:0 0 env(safe-area-inset-bottom)!important;overflow:hidden;border-radius:32rpx 32rpx 0 0!important;background:#fff;box-shadow:0 -18rpx 50rpx rgba(0,0,0,.08);animation:payPanelUp .22s ease-out both}
@keyframes payPanelUp{from{transform:translateY(40rpx);opacity:.85}to{transform:translateY(0);opacity:1}}
.panel-head{height:90rpx;display:grid;grid-template-columns:76rpx 1fr 76rpx;align-items:center;border-bottom:1rpx solid #f0f0f2}
.panel-head text{font-size:30rpx;font-weight:800;color:#111;text-align:center}
.panel-close{width:54rpx!important;height:54rpx!important;margin-left:16rpx!important;padding:0!important;border-radius:12rpx!important;background:#f5f5f7!important;color:#777!important;font-size:42rpx!important;line-height:48rpx!important;display:flex;align-items:center;justify-content:center}
.panel-close::after{border:0!important}
.panel-placeholder{width:76rpx;height:1rpx}
.panel-body{padding:34rpx 34rpx 36rpx;text-align:center}
.panel-tip{display:block;font-size:22rpx;color:#888;line-height:1.5}
.password-boxes{height:88rpx;margin-top:28rpx;border:2rpx solid #dddddf;border-radius:16rpx;display:grid;grid-template-columns:repeat(6,1fr);overflow:hidden;background:#fff}
.password-cell{display:flex;align-items:center;justify-content:center;border-right:1rpx solid #e5e5e7}
.password-cell:last-child{border-right:0}
.password-dot{width:16rpx;height:16rpx;border-radius:50%;background:#111}
.step-message{display:block;margin-top:18rpx;font-size:21rpx;color:#ee6b42}
.number-keyboard{display:grid;grid-template-columns:repeat(3,1fr);gap:1rpx;background:#dcdde1}
.number-keyboard button,.keyboard-blank{height:112rpx!important;margin:0!important;padding:0!important;border-radius:0!important;background:#fff!important;color:#111!important;font-size:38rpx!important;font-weight:400!important;line-height:112rpx!important;text-align:center}
.number-keyboard button::after{border:0!important}
.keyboard-blank,.number-keyboard .delete-key{background:#d8d9de!important}
.delete-key{font-size:32rpx!important}
.empty-card{padding:56rpx 30rpx;text-align:center;display:flex;flex-direction:column;align-items:center}
.empty-card image{width:96rpx;height:96rpx;opacity:.24}
.empty-card text:nth-child(2){margin-top:18rpx;font-size:30rpx;font-weight:800;color:#222}
.empty-card text:nth-child(3){margin-top:10rpx;font-size:22rpx;color:#999}
.empty-card button{height:82rpx;margin-top:28rpx;display:flex;align-items:center;justify-content:center}
</style>
