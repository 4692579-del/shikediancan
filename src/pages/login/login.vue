<template>
<view class="login-page" :style="`${globalThemeStyle};--login-status-height:${statusHeight}px; padding-top:${statusHeight}px`">
  <button hover-class="none" class="back login-page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
  <view class="login-art">
    <view class="brand-mark"><image src="/static/assets/login-brand-mobile.jpg" mode="aspectFill" /></view>
    <view class="art-orbit o1"><image src="/static/assets/icons/snack.svg" mode="aspectFit" /></view><view class="art-orbit o2"><image src="/static/assets/icons/restaurant.svg" mode="aspectFit" /></view><view class="art-orbit o3"><image src="/static/assets/icons/fruit.svg" mode="aspectFit" /></view>
  </view>
  <view class="login-card">
    <text class="login-title">欢迎来到食刻</text>
    <text class="login-sub">登录后享受专属优惠与便捷点餐</text>
    <view :class="`login-method-stage ${showPhoneLogin ? 'phone-mode' : 'quick-mode'}`">
      <view class="login-method-panel quick-method">
        <button hover-class="none" class="quick-btn" @tap="quickLogin"><view class="quick-mark">捷</view><text>一键登录</text></button>
        <button hover-class="none" class="phone-entry" @tap="togglePhoneLogin">使用手机号登录</button>
      </view>
      <view v-if="showPhoneLogin" class="login-method-panel phone-login-panel">
        <view class="input-row phone-row"><text>+86</text><input type="number" maxlength="11" placeholder="请输入手机号" :value="phone" @input="phoneInput"/></view>
        <view class="input-row code-row"><input type="number" maxlength="4" placeholder="请输入验证码" :value="code" @input="codeInput"/><button hover-class="none" class="code-btn" @tap="sendCode">{{sent ? countdown + 's' : '获取验证码'}}</button></view>
        <button hover-class="none" class="primary-btn login-btn" @tap="login">手机号登录</button>
        <button hover-class="none" class="login-switch" @tap="togglePhoneLogin">使用一键登录</button>
      </view>
    </view>

    <view class="agreement">
      <button hover-class="none" :class="`agree-box ${agreed ? 'on' : ''}`" @tap="toggleAgree"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></button>
      <view class="agreement-copy">
        <text>我已阅读并同意</text>
        <button hover-class="none" class="agreement-link" data-type="user" @tap="openAgreement">《用户服务协议》</button>
        <text>和</text>
        <button hover-class="none" class="agreement-link" data-type="privacy" @tap="openAgreement">《隐私政策》</button>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 登录页：模拟一键登录和手机号验证码登录，并在成功后恢复原操作路径。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import account from '../../utils/account.js'
const pageConfig = {
  data: { statusHeight: 20, agreed: false, showPhoneLogin: false, phone: '', code: '', sent: false, countdown: 60 },
  onLoad() { this.setData({ statusHeight: getApp().globalData.statusBarHeight }) },
  back() { auth.cancelLogin(); uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/profile/profile' }) }) },
  // 在一键登录和手机号登录表单之间切换。
  togglePhoneLogin() {
    if (this.showPhoneLogin) uni.hideKeyboard()
    this.setData({ showPhoneLogin: !this.showPhoneLogin })
  },
  toggleAgree() { this.setData({ agreed: !this.agreed }) },
  // 协议正文使用独立页面展示，保证审核人员和用户均可完整查看。
  openAgreement(e) {
    const type = e.currentTarget.dataset.type === 'privacy' ? 'privacy' : 'user'
    uni.navigateTo({ url: `/pages/legal/legal?type=${type}` })
  },
  phoneInput(e) { this.setData({ phone: e.detail.value }) },
  codeInput(e) { this.setData({ code: e.detail.value }) },
  // 模拟发送验证码并启动倒计时，测试验证码固定为 8888。
  sendCode() {
    if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    this.setData({ sent: true, countdown: 60 })
    uni.showToast({ title: '验证码：8888', icon: 'none', duration: 2500 })
    this.timer = setInterval(() => {
      const countdown = this.countdown - 1
      this.setData({ countdown })
      if (countdown <= 0) { clearInterval(this.timer); this.setData({ sent: false }) }
    }, 1000)
  },
  // 手机号登录前校验协议、手机号和验证码。
  login() {
    if (!this.agreed) return uni.showToast({ title: '请先同意服务协议', icon: 'none' })
    if (!/^1\d{10}$/.test(this.phone)) return uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    if (this.code !== '8888') return uni.showToast({ title: '验证码为 8888', icon: 'none' })
    account.login({ accountId: `phone:${this.phone}`, nickname: '食刻用户', phone: this.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), avatar: '/static/assets/icons/smile.svg' })
    store.set('sk_privacy_consent_v1', true)
    uni.showToast({ title: '登录成功' })
    setTimeout(() => auth.finishLogin(), 500)
  },
  // 第三方平台登录为前端模拟账号，不调用真实用户信息接口。
  quickLogin() {
    if (!this.agreed) return uni.showToast({ title: '请先同意服务协议', icon: 'none' })
    uni.showLoading({ title: '登录中' })
    setTimeout(() => {
      uni.hideLoading()
      account.login({ accountId: 'quick-default', nickname: '食刻用户', phone: '138****2026', avatar: '/static/assets/icons/smile.svg' })
      store.set('sk_privacy_consent_v1', true)
      uni.showToast({ title: '登录成功' })
      setTimeout(() => auth.finishLogin(), 400)
    }, 650)
  },
  // 页面卸载时清理验证码定时器，避免后台继续更新。
  onUnload() { if (this.timer) clearInterval(this.timer) }
}

export default adaptPage(pageConfig)
</script>

<style>
.login-page{min-height:100vh;background:linear-gradient(180deg,var(--orange-soft) 0,#f8f8fa 48%);padding-left:30rpx;padding-right:30rpx}.back{width:68rpx;height:68rpx;font-size:50rpx;display:flex;align-items:center}.login-art{height:330rpx;position:relative;display:flex;align-items:center;justify-content:center}.brand-mark{width:150rpx;height:150rpx;border-radius:48rpx;background:#1c1c1e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:72rpx;font-weight:800;box-shadow:0 20rpx 50rpx rgba(0,0,0,.2)}.art-orbit{position:absolute;width:72rpx;height:72rpx;border-radius:25rpx;background:#fff;display:flex;align-items:center;justify-content:center;font-size:36rpx;box-shadow:0 9rpx 25rpx rgba(100,60,40,.12)}.o1{left:100rpx;top:60rpx;transform:rotate(-10deg)}.o2{right:85rpx;top:95rpx;transform:rotate(10deg)}.o3{right:145rpx;bottom:20rpx}.login-card{background:#fff;border-radius:42rpx;padding:38rpx 32rpx;box-shadow:0 15rpx 55rpx rgba(50,45,65,.08)}.login-title,.login-sub{display:block}.login-title{font-size:44rpx;font-weight:800;letter-spacing:-1rpx}.login-sub{color:#999;font-size:24rpx;margin:10rpx 0 34rpx}.input-row{height:94rpx;border-radius:27rpx;background:#f5f5f7;display:flex;align-items:center;padding:0 22rpx;margin-bottom:18rpx}.input-row>text{padding-right:18rpx;margin-right:18rpx;border-right:1rpx solid #ddd}.input-row input{flex:1}.code-btn{color:var(--orange);font-size:23rpx;font-weight:650}.login-btn{margin-top:26rpx}.divider{display:flex;align-items:center;gap:18rpx;margin:30rpx 0;color:#bbb;font-size:21rpx}.divider view{height:1rpx;background:#eee;flex:1}.quick-btn{height:94rpx;border-radius:47rpx;background:#07c160;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}.quick-btn text{font-size:35rpx;margin-right:12rpx}.agreement{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:25rpx;color:#999;font-size:19rpx}.agreement button{font-size:19rpx;color:var(--orange)}.agree-box{width:30rpx;height:30rpx;border-radius:9rpx;border:1rpx solid #ccc;color:transparent!important;margin-right:8rpx}.agree-box.on{background:var(--orange);color:#fff!important;border-color:var(--orange)}

/* Compact layout for common 667–844px phone heights */
.login-page{padding:0 30rpx calc(28rpx + env(safe-area-inset-bottom));overflow-y:auto}
.back{height:58rpx}
.login-art{height:230rpx}
.brand-mark{width:124rpx;height:124rpx;border-radius:40rpx;font-size:60rpx}
.art-orbit{width:60rpx;height:60rpx;border-radius:20rpx;font-size:30rpx}
.o1{top:28rpx}.o2{top:52rpx}.o3{bottom:4rpx}
.login-card{border-radius:36rpx;padding:30rpx}
.login-title{font-size:39rpx}.login-sub{font-size:22rpx;margin:8rpx 0 26rpx}
.input-row{height:86rpx;border-radius:24rpx;padding:0 20rpx;margin-bottom:15rpx;overflow:hidden}
.input-row input{min-width:0}.code-btn{flex-shrink:0;font-size:20rpx;padding-left:10rpx;white-space:nowrap}
.login-btn{height:86rpx;margin-top:20rpx}.divider{margin:20rpx 0}
.quick-btn{width:100%!important;max-width:none!important;height:86rpx}.agreement{font-size:18rpx;line-height:1.6;margin-top:20rpx}
.agreement button{font-size:18rpx;white-space:nowrap}.agree-box{flex-shrink:0}
.art-orbit image{width:38rpx;height:38rpx}
.agree-box{display:flex;align-items:center;justify-content:center}
.agree-box image{width:18rpx;height:18rpx;opacity:0}
.agree-box.on image{opacity:1;filter:brightness(0) invert(1)}

/* Login method hierarchy and compact form layout */
.quick-btn{
  gap:12rpx;
  box-shadow:0 12rpx 26rpx rgba(7,193,96,.2);
}
.quick-btn text{font-size:27rpx;margin-right:0}
.quick-mark{
  width:38rpx;
  height:38rpx;
  border-radius:13rpx;
  background:#fff;
  color:#07a956;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:21rpx;
  font-weight:800;
}
.phone-entry{
  width:100%!important;
  height:78rpx;
  margin-top:18rpx;
  border:2rpx solid #ececf0;
  border-radius:25rpx;
  color:#666;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:23rpx;
  font-weight:650;
}
.phone-login-panel{margin-top:24rpx}
.phone-login-panel .input-row{margin-bottom:20rpx}
.phone-row input{padding-left:2rpx}
.code-row{padding-right:10rpx}
.code-row input{min-width:0;padding-right:12rpx}
.code-btn{
  width:164rpx!important;
  min-width:164rpx!important;
  max-width:164rpx!important;
  height:62rpx;
  margin-left:auto;
  padding:0!important;
  border-radius:19rpx;
  background:var(--orange-soft);
  display:flex;
  align-items:center;
  justify-content:center;
}
.login-btn{margin-top:4rpx}
.login-switch{
  width:100%!important;
  height:58rpx;
  margin-top:8rpx;
  color:#999;
  font-size:20rpx;
  display:flex;
  align-items:center;
  justify-content:center;
}
.agreement{
  align-items:center;
  justify-content:flex-start;
  flex-wrap:nowrap;
  padding:0 6rpx;
}
.agree-box{
  width:34rpx!important;
  min-width:34rpx!important;
  max-width:34rpx!important;
  height:34rpx!important;
  min-height:34rpx!important;
  flex:0 0 34rpx!important;
  padding:0!important;
  margin:0 12rpx 0 0!important;
  border-radius:10rpx;
}
.agree-box image{width:19rpx;height:19rpx}
.agreement-copy{
  flex:1;
  min-width:0;
  display:flex;
  align-items:center;
  flex-wrap:nowrap;
  white-space:nowrap;
  line-height:1.7;
}
.agreement-copy text{
  flex-shrink:0;
  font-size:20rpx;
  line-height:34rpx;
}
.agreement-link{color:var(--orange);font-weight:600}

.login-page{position:relative}
.back{justify-content:center}
.login-page-back{
  position:absolute!important;
  left:8rpx!important;
  top:calc(var(--login-status-height, 20px) + 8rpx);
  width:68rpx!important;
  min-width:68rpx!important;
  max-width:68rpx!important;
  margin:0!important;
  padding:0!important;
  z-index:5;
}
.back image{width:30rpx;height:30rpx;display:block}

.code-btn{
  border-radius:999rpx;
}

/* Smooth transition between quick and phone login methods. */
.login-method-stage{
  position:relative;
}
.login-method-panel{
  max-height:0;
  margin-top:0;
  overflow:hidden;
  opacity:0;
  visibility:hidden;
  pointer-events:none;
  transform:translateY(14rpx) scale(.985);
  transform-origin:top center;
  transition:
    max-height .38s cubic-bezier(.22,.61,.36,1),
    opacity .22s ease,
    transform .34s cubic-bezier(.22,.61,.36,1),
    margin-top .34s ease,
    visibility 0s linear .38s;
}
.login-method-stage.quick-mode .quick-method,
.login-method-stage.phone-mode .phone-login-panel{
  opacity:1;
  visibility:visible;
  pointer-events:auto;
  transform:translateY(0) scale(1);
  transition:
    max-height .42s cubic-bezier(.22,.61,.36,1),
    opacity .28s ease .08s,
    transform .38s cubic-bezier(.22,.61,.36,1),
    margin-top .34s ease,
    visibility 0s;
}
.login-method-stage.quick-mode .quick-method{
  max-height:190rpx;
}
.login-method-stage.phone-mode .phone-login-panel{
  max-height:440rpx;
  margin-top:4rpx;
  animation:phone-panel-enter .34s cubic-bezier(.22,.61,.36,1) both;
}
.quick-method{
  display:flex;
  flex-direction:column;
}

/* Capsule controls for phone login. */
.phone-entry,
.phone-login-panel .input-row{
  border-radius:999rpx!important;
}
.phone-login-panel .input-row{
  padding-left:28rpx;
  padding-right:10rpx;
}

.brand-mark{
  overflow:hidden;
  padding:0;
  background:#171719;
}
.brand-mark image{
  width:100%;
  height:100%;
  display:block;
}

@keyframes phone-panel-enter{
  from{opacity:0;transform:translateY(14rpx) scale(.985)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* 协议名称是真实可点击按钮，同时保持与说明文字在同一行。 */
.agreement-link{
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  height:34rpx!important;
  min-height:34rpx!important;
  padding:0!important;
  margin:0!important;
  flex:0 0 auto!important;
  display:inline-flex;
  align-items:center;
  color:var(--orange);
  font-size:20rpx!important;
  font-weight:600;
  line-height:34rpx!important;
}

</style>
