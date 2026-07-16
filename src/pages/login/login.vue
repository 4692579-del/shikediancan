<template>
<view class="login-page" :style="`${globalThemeStyle};--login-status-height:${statusHeight}px; padding-top:${statusHeight}px`">
  <button hover-class="none" class="back login-page-back" @tap="back">
    <image src="/static/assets/icons/back.svg" mode="aspectFit" />
  </button>

  <view class="login-hero">
    <view class="hero-bg">
      <view class="glass-piece p1"></view>
      <view class="glass-piece p2"></view>
      <view class="glass-piece p3"></view>
      <view class="glass-piece p4"></view>
    </view>
    <view class="hero-copy">
      <text class="hello">{{ labels.hello }}</text>
      <text class="login-title">{{ labels.title }}</text>
      <text class="login-sub">{{ labels.sub }}</text>
    </view>
    <view class="brand-mark">
      <image src="/static/assets/login-brand-mobile.jpg" mode="aspectFill" />
    </view>
  </view>

  <view class="login-card">
    <view :class="`mode-tabs ${mode === 'login' ? 'login-active' : 'register-active'}`">
      <button hover-class="none" :class="`mode-tab ${mode === 'login' ? 'active' : ''}`" data-mode="login" @tap="switchMode">{{ labels.login }}</button>
      <button hover-class="none" :class="`mode-tab ${mode === 'register' ? 'active' : ''}`" data-mode="register" @tap="switchMode">{{ labels.register }}</button>
    </view>

    <view :key="formAnimateKey" class="form-panel">
      <view class="input-row">
        <input maxlength="10" :placeholder="labels.usernamePlaceholder" :value="username" @input="usernameInput" />
      </view>
      <view v-if="mode === 'register'" class="username-rule">
        <text>5-10位，字母开头，仅支持字母和数字</text>
      </view>
      <view class="input-row password-row">
        <input :password="!showPassword" maxlength="20" :placeholder="labels.passwordPlaceholder" :value="password" @input="passwordInput" />
        <button hover-class="none" class="eye-btn" data-field="password" @tap="togglePasswordVisible">
          <image :src="showPassword ? '/static/assets/icons/eye-off.svg' : '/static/assets/icons/eye.svg'" mode="aspectFit" />
        </button>
      </view>
      <view v-if="mode === 'register'" class="input-row password-row confirm-row">
        <input :password="!showConfirmPassword" maxlength="20" :placeholder="labels.confirmPlaceholder" :value="confirmPassword" @input="confirmInput" />
        <button hover-class="none" class="eye-btn" data-field="confirm" @tap="togglePasswordVisible">
          <image :src="showConfirmPassword ? '/static/assets/icons/eye-off.svg' : '/static/assets/icons/eye.svg'" mode="aspectFit" />
        </button>
      </view>
    </view>

    <button hover-class="none" class="primary-btn login-btn" :disabled="loading" @tap="submit">
      {{ loading ? labels.processing : (mode === 'login' ? labels.loginButton : labels.registerButton) }}
    </button>

    <view class="agreement">
      <button hover-class="none" :class="`agree-box ${agreed ? 'on' : ''}`" @tap="toggleAgree">
        <image src="/static/assets/icons/check.svg" mode="aspectFit" />
      </button>
      <view class="agreement-copy">
        <text>{{ labels.agreePrefix }}</text>
        <button hover-class="none" class="agreement-link" data-type="user" @tap="openAgreement">{{ labels.service }}</button>
        <text>{{ labels.and }}</text>
        <button hover-class="none" class="agreement-link" data-type="privacy" @tap="openAgreement">{{ labels.privacy }}</button>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import account from '../../utils/account.js'
import cloud from '../../utils/cloud.js'
import i18n from '../../utils/i18n.js'
import addressBackend from '../../utils/address-backend.js'

function getLabels() {
  const text = i18n.page('login')
  return {
    hello: text.hello,
    title: text.welcome,
    sub: text.sub,
    login: text.login,
    register: text.register,
    usernamePlaceholder: text.username,
    passwordPlaceholder: text.password,
    confirmPlaceholder: text.confirmPassword,
    loginButton: text.loginButton,
    registerButton: text.registerButton,
    processing: i18n.getLocale() === 'en' ? 'Processing...' : i18n.getLocale() === 'ja' ? '処理中...' : '处理中...',
    agreePrefix: text.agree,
    service: text.agreement,
    privacy: text.privacy,
    and: text.and
  }
}

function toast(title) {
  uni.showToast({ title, icon: 'none' })
}

function isValidUsername(username) {
  return /^[A-Za-z][A-Za-z0-9]{4,9}$/.test(username)
}

const pageConfig = {
  data: {
    statusHeight: 20,
    labels: getLabels(),
    mode: 'login',
    agreed: false,
    username: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    formAnimateKey: 0,
    loading: false
  },
  onLoad() {
    this.setData({ statusHeight: getApp().globalData.statusBarHeight || 20 })
  },
  onShow() {
    this.setData({ labels: getLabels() })
  },
  back() {
    auth.cancelLogin()
    uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/profile/profile' }) })
  },
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode === 'register' ? 'register' : 'login'
    if (mode === this.mode) return
    this.setData({ mode, password: '', confirmPassword: '', showPassword: false, showConfirmPassword: false, formAnimateKey: this.formAnimateKey + 1 })
  },
  toggleMode() {
    const mode = this.mode === 'login' ? 'register' : 'login'
    this.setData({ mode, password: '', confirmPassword: '', showPassword: false, showConfirmPassword: false, formAnimateKey: this.formAnimateKey + 1 })
  },
  toggleAgree() {
    this.setData({ agreed: !this.agreed })
  },
  togglePasswordVisible(e) {
    const field = e.currentTarget.dataset.field
    if (field === 'confirm') {
      this.setData({ showConfirmPassword: !this.showConfirmPassword })
      return
    }
    this.setData({ showPassword: !this.showPassword })
  },
  openAgreement(e) {
    const type = e.currentTarget.dataset.type === 'privacy' ? 'privacy' : 'user'
    uni.navigateTo({ url: `/pages/legal/legal?type=${type}` })
  },
  usernameInput(e) {
    this.setData({ username: (e.detail.value || '').trim() })
  },
  passwordInput(e) {
    this.setData({ password: e.detail.value || '' })
  },
  confirmInput(e) {
    this.setData({ confirmPassword: e.detail.value || '' })
  },
  validateForm() {
    if (!this.agreed) {
      toast('\u8bf7\u5148\u540c\u610f\u670d\u52a1\u534f\u8bae\u548c\u9690\u79c1\u653f\u7b56')
      return false
    }
    if (!isValidUsername(this.username)) {
      toast('用户名需为5-10位，以字母开头，仅支持字母和数字')
      return false
    }
    if (!/^.{6,20}$/.test(this.password)) {
      toast('\u5bc6\u7801\u9700\u4e3a6-20\u4f4d')
      return false
    }
    if (this.mode === 'register' && this.password !== this.confirmPassword) {
      toast('\u4e24\u6b21\u8f93\u5165\u7684\u5bc6\u7801\u4e0d\u4e00\u81f4')
      return false
    }
    return true
  },
  async submit() {
    if (this.loading || !this.validateForm()) return
    this.setData({ loading: true })
    try {
      const { result } = await cloud.callFunction({
        name: 'user-auth',
        data: {
          action: this.mode === 'register' ? 'register' : 'login',
          username: this.username,
          password: this.password
        }
      })
      if (!result || result.code !== 0) {
        toast((result && result.message) || '\u64cd\u4f5c\u5931\u8d25')
        return
      }
      if (this.mode === 'register') {
        uni.showToast({ title: '\u6ce8\u518c\u6210\u529f\uff0c\u8bf7\u767b\u5f55', icon: 'success' })
        this.setData({ mode: 'login', password: '', confirmPassword: '' })
        return
      }
      account.login(result.user)
      store.set('sk_addresses', [])
      store.set('sk_selected_address', null)
      await addressBackend.fetchAddresses({ force: true })
      store.set('sk_privacy_consent_v1', true)
      uni.showToast({ title: '\u767b\u5f55\u6210\u529f', icon: 'success' })
      setTimeout(() => auth.finishLogin(), 450)
    } catch (err) {
      const detail = cloud.normalizeError(err)
      console.error('user-auth failed detail:', detail, err)
      toast((err && (err.errMsg || err.message)) || '\u540e\u7aef\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528')
    } finally {
      this.setData({ loading: false })
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.login-page{
  --login-panel-bg:#fff;
  min-height:100vh;
  box-sizing:border-box;
  position:relative;
  overflow-y:auto;
  padding:0 30rpx calc(24rpx + env(safe-area-inset-bottom));
  background:#fff;
}
.login-page button,
.login-page button::after{
  border:0;
  box-shadow:none!important;
  background:transparent;
}
.login-page .login-page-back{
  position:absolute!important;
  left:20rpx!important;
  top:calc(var(--login-status-height,20px) + 20rpx);
  width:62rpx!important;
  height:62rpx!important;
  min-width:62rpx!important;
  max-width:62rpx!important;
  margin:0!important;
  padding:0!important;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:20;
  border-radius:18rpx;
  background:rgba(255,255,255,.58)!important;
  backdrop-filter:blur(18rpx);
}
.login-page-back image{width:30rpx;height:30rpx;display:block}
.login-hero{
  height:calc(420rpx + var(--login-status-height,20px));
  position:relative;
  margin:calc(-1 * var(--login-status-height,20px)) -30rpx 0;
  padding-top:var(--login-status-height,20px);
  overflow:hidden;
  border-radius:0 0 34rpx 34rpx;
}
.hero-bg{
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 15% 5%,rgba(255,255,255,.92),transparent 21%),
    radial-gradient(circle at 88% 8%,rgba(255,143,82,.36),transparent 29%),
    linear-gradient(135deg,#fff3ec 0%,#ffd4bc 47%,#fff8f2 100%);
}
.hero-bg::after{
  content:'';
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:190rpx;
  background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.75));
}
.glass-piece{
  position:absolute;
  border-radius:34rpx;
  background:linear-gradient(145deg,rgba(255,255,255,.78),rgba(255,255,255,.18));
  border:1rpx solid rgba(255,255,255,.48);
  box-shadow:0 22rpx 48rpx rgba(238,105,61,.13),inset 0 1rpx 0 rgba(255,255,255,.75);
  transform:rotate(-18deg);
}
.p1{width:210rpx;height:88rpx;left:60rpx;top:86rpx}.p2{width:286rpx;height:116rpx;right:30rpx;top:66rpx}.p3{width:280rpx;height:108rpx;left:200rpx;top:205rpx}.p4{width:155rpx;height:70rpx;right:170rpx;top:270rpx}
.hero-copy{
  position:absolute;
  left:64rpx;
  bottom:126rpx;
  display:flex;
  flex-direction:column;
  z-index:2;
}
.hello{
  font-size:48rpx;
  line-height:1;
  font-weight:900;
  color:#141414;
  letter-spacing:-1rpx;
  margin-bottom:20rpx;
}
.login-title{
  font-size:43rpx;
  line-height:1.08;
  font-weight:900;
  color:#151515;
  letter-spacing:-1rpx;
}
.login-sub{
  margin-top:12rpx;
  font-size:22rpx;
  color:rgba(30,30,30,.44);
}
.brand-mark{
  position:absolute;
  right:64rpx;
  bottom:112rpx;
  width:106rpx;
  height:106rpx;
  border-radius:32rpx;
  overflow:hidden;
  background:#1c1c1e;
  box-shadow:0 18rpx 45rpx rgba(0,0,0,.14);
  z-index:3;
}
.brand-mark image{width:100%;height:100%}
.login-card{
  position:relative;
  z-index:4;
  margin-top:-72rpx;
  min-height:calc(100vh - 348rpx - var(--login-status-height,20px));
  padding:0 56rpx 28rpx;
  display:flex;
  flex-direction:column;
  background:transparent;
}
.login-card::before{
  content:'';
  position:absolute;
  left:0;
  right:0;
  top:118rpx;
  bottom:0;
  border-radius:0 0 42rpx 42rpx;
  background:var(--login-panel-bg);
  box-shadow:0 22rpx 70rpx rgba(52,44,38,.06);
  z-index:0;
}
.mode-tabs{
  position:relative;
  z-index:2;
  height:126rpx;
  display:grid;
  grid-template-columns:1fr 1fr;
  margin:0 -56rpx 70rpx;
  align-items:stretch;
  overflow:visible;
}
.mode-tabs::before{
  content:'';
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:92rpx;
  border-radius:42rpx 42rpx 0 0;
  background:rgba(255,255,255,.22);
  backdrop-filter:blur(18rpx);
  z-index:0;
}
.mode-tab{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  height:126rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#8d8d8d;
  font-size:30rpx;
  font-weight:650;
  position:relative;
  z-index:1;
  border-radius:0!important;
  background:transparent!important;
}
.login-page .mode-tab.active{
  color:var(--orange);
  background:var(--login-panel-bg)!important;
  font-weight:850;
  z-index:3;
  box-shadow:0 -8rpx 26rpx rgba(60,55,50,.035)!important;
}
.login-page .login-active .mode-tab.active{
  border-radius:46rpx 46rpx 0 0!important;
}
.login-page .register-active .mode-tab.active{
  border-radius:46rpx 46rpx 0 0!important;
}
.mode-tab.active::before{
  content:'';
  position:absolute;
  left:50%;
  bottom:26rpx;
  width:54rpx;
  height:7rpx;
  border-radius:999rpx;
  background:var(--orange);
  transform:translateX(-50%);
  box-shadow:0 6rpx 14rpx rgba(238,105,61,.25);
}
.form-panel{
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  gap:26rpx;
  animation:formFadeIn .34s cubic-bezier(.2,.8,.2,1) both;
}
.input-row{
  height:92rpx;
  border-radius:999rpx;
  background:#fffaf6;
  display:flex;
  align-items:center;
  padding:0 34rpx;
  box-sizing:border-box;
  overflow:hidden;
  border:1rpx solid rgba(238,105,61,.12);
  box-shadow:0 14rpx 32rpx rgba(238,105,61,.052);
  animation:inputRiseIn .36s cubic-bezier(.2,.8,.2,1) both;
}
.input-row:nth-child(2){animation-delay:.035s}
.input-row:nth-child(3){animation-delay:.07s}
.confirm-row{animation-name:confirmExpandIn}
.username-rule{
  min-height:34rpx;
  margin:-14rpx 4rpx -2rpx;
  padding-left:26rpx;
  display:flex;
  align-items:center;
  color:rgba(238,105,61,.74);
  font-size:21rpx;
  line-height:1.35;
  animation:inputRiseIn .28s cubic-bezier(.2,.8,.2,1) both;
}
.username-rule text{
  padding:8rpx 18rpx;
  border-radius:999rpx;
  background:rgba(238,105,61,.07);
}
.input-row:focus-within{
  border-color:rgba(238,105,61,.45);
  box-shadow:0 16rpx 36rpx rgba(238,105,61,.09);
}
.input-row input{
  flex:1;
  min-width:0;
  height:92rpx;
  font-size:28rpx;
  color:#1e1e1e;
}
.password-row input{padding-right:12rpx}
.eye-btn{
  width:58rpx!important;
  height:58rpx!important;
  min-width:58rpx!important;
  max-width:58rpx!important;
  flex:0 0 58rpx!important;
  padding:0!important;
  margin:0 -12rpx 0 0!important;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%!important;
}
.eye-btn image{width:36rpx;height:36rpx;opacity:.5}
.login-page .login-btn{
  position:relative;
  z-index:2;
  width:100%!important;
  height:92rpx;
  margin-top:44rpx;
  border-radius:999rpx!important;
  background:linear-gradient(135deg,var(--orange),#f05b35)!important;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:31rpx;
  font-weight:850;
  box-shadow:0 18rpx 38rpx rgba(238,105,61,.22)!important;
}
.login-btn[disabled]{opacity:.72}
.agreement{
  position:relative;
  z-index:2;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-wrap:nowrap;
  padding:0 0 8rpx;
  margin-top:auto;
  color:#333;
  font-size:22rpx;
  min-height:118rpx;
}
.login-page .agree-box{
  width:34rpx!important;
  height:34rpx!important;
  min-width:34rpx!important;
  max-width:34rpx!important;
  flex:0 0 34rpx!important;
  padding:0!important;
  margin:0 12rpx 0 0!important;
  border-radius:50%!important;
  border:3rpx solid rgba(238,105,61,.78)!important;
  background:#fff!important;
  display:flex!important;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
}
.agree-box image{width:18rpx;height:18rpx;opacity:0}.login-page .agree-box.on{background:var(--orange)!important;border-color:var(--orange)!important}.agree-box.on image{opacity:1;filter:brightness(0) invert(1)}
.agreement-copy{min-width:0;display:flex;align-items:center;flex-wrap:nowrap;white-space:nowrap;line-height:36rpx}
.agreement-copy text{flex-shrink:0;font-size:22rpx;line-height:36rpx;color:#333}
.agreement-link{font-size:22rpx;color:var(--orange);font-weight:700;white-space:nowrap;padding:0!important;margin:0 2rpx!important;line-height:36rpx}
@keyframes formFadeIn{
  from{opacity:.72;transform:translateY(16rpx)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes inputRiseIn{
  from{opacity:0;transform:translateY(22rpx) scale(.985)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes confirmExpandIn{
  from{opacity:0;transform:translateY(-10rpx) scaleY(.88)}
  to{opacity:1;transform:translateY(0) scaleY(1)}
}
</style>
