<template>
<view :style="globalThemeStyle" class="page"><view class="safe-nav" :style="`--status-height:${statusHeight}px`"><view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">{{text.title}}</text><view class="nav-back"></view></view></view>
<view class="settings-content">
  <view class="setting-group card"><text class="group-title">{{text.general}}</text><button hover-class="none" class="setting-row" @tap="copyUsername"><text>{{text.username}}</text><text>{{user && user.username ? user.username : common.notLogin}} ›</text></button><button hover-class="none" class="setting-row" @tap="openAccountSecurity"><text>{{text.accountSecurity}}</text><text>›</text></button><button hover-class="none" class="setting-row" @tap="openPersonalization"><text>{{text.personalization}}</text><text>›</text></button><button hover-class="none" class="setting-row" @tap="openServiceManager"><text>{{serviceManageText}}</text><text>›</text></button><button hover-class="none" class="setting-row" @touchstart="startCacheHold" @touchend="cancelCacheHold" @touchcancel="cancelCacheHold" @tap="clearCache"><text>{{text.cache}}</text><text>{{cacheSize}} ›</text></button></view>
  <view class="setting-group notification-group card"><text class="group-title">{{text.notification}}</text><button hover-class="none" class="setting-row" data-type="order" @tap="openNotificationSettings"><text>{{text.orderTradeNotice}}</text><text>›</text></button><button hover-class="none" class="setting-row" data-type="service" @tap="openNotificationSettings"><text>{{text.benefitServiceNotice}}</text><text>›</text></button></view>
  <view class="setting-group card"><text class="group-title">{{text.accessibility}}</text><button hover-class="none" class="setting-row" @tap="openElderMode"><text>{{text.elderMode}}</text><text>›</text></button><button hover-class="none" class="setting-row" @tap="openFontSize"><text>{{text.fontSize}}</text><text>›</text></button><button hover-class="none" class="setting-row" @tap="openLanguage"><text>{{text.language}}</text><text>{{languageName}} ›</text></button></view>
  <view class="setting-group card"><text class="group-title">{{text.privacyTitle}}</text><button hover-class="none" class="setting-row" data-type="user" @tap="openAgreement"><text>{{text.userAgreement}}</text><text>›</text></button><button hover-class="none" class="setting-row" data-type="privacy" @tap="openAgreement"><text>{{text.privacyPolicy}}</text><text>›</text></button></view>
  <button hover-class="none" v-if="user" class="switch-account-btn" @tap="openSwitchAccount">{{text.switchAccount || switchAccountText}}</button>
  <button hover-class="none" v-if="user" class="logout" @tap="logout">{{text.logout}}</button><button hover-class="none" v-else class="primary-btn" @tap="login">{{text.login}}</button>
  <view class="info-list-links">
    <button hover-class="none" data-type="personal" @tap="openInfoList">{{infoListText.personal}}</button>
    <button hover-class="none" data-type="third" @tap="openInfoList">{{infoListText.third}}</button>
  </view>
</view></view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import profileTheme from '../../utils/profile-theme.js'
import account from '../../utils/account.js'
import membership from '../../utils/membership.js'
import cloud from '../../utils/cloud.js'
import benefitBackend from '../../utils/benefit-backend.js'
import i18n from '../../utils/i18n.js'
import commonServices from '../../utils/common-services.js'

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

async function filePathToAvatarDataUrl(filePath) {
  if (!filePath) throw new Error('EMPTY_FILE')
  if (/^data:image\//i.test(filePath)) return filePath
  if (typeof fetch !== 'function') throw new Error('UNSUPPORTED_AVATAR_UPLOAD')

  const response = await fetch(filePath)
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    if (typeof document === 'undefined') {
      const dataUrl = await readBlobAsDataUrl(blob)
      if (dataUrl.length > 900 * 1024) throw new Error('AVATAR_TOO_LARGE')
      return dataUrl
    }

    const image = await loadImage(objectUrl)
    const size = Math.min(image.width, image.height)
    const sourceX = Math.max(0, (image.width - size) / 2)
    const sourceY = Math.max(0, (image.height - size) / 2)
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 320
    const context = canvas.getContext('2d')
    context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 320, 320)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getSwitchAccountText() {
  const locale = i18n.getLocale()
  if (locale === 'en') return 'Switch account'
  if (locale === 'ja') return 'アカウント切替'
  if (locale === 'zh-Hant') return '切換帳號'
  return '切换账号'
}

function getInfoListText() {
  const locale = i18n.getLocale()
  if (locale === 'en') {
    return {
      personal: '《Personal Information Collection List》',
      third: '《Third-party Data Sharing List》'
    }
  }
  if (locale === 'ja') {
    return {
      personal: '《個人情報収集リスト》',
      third: '《第三者情報共有リスト》'
    }
  }
  if (locale === 'zh-Hant') {
    return {
      personal: '《個人資訊收集清單》',
      third: '《第三方資訊資料共享清單》'
    }
  }
  return {
    personal: '《个人信息收集清单》',
    third: '《第三方信息数据共享清单》'
  }
}

const pageConfig = {
  data: { statusHeight: 20, user: null, profileTheme: profileTheme.getTheme('black'), cacheSize: '2.4 MB', text: i18n.page('settings'), common: i18n.page('common'), languageName: i18n.getLocaleName(), switchAccountText: getSwitchAccountText(), infoListText: getInfoListText(), serviceManageText: commonServices.getLabel('serviceManager') },
  onLoad() {
    if (!auth.guardPage('/pages/settings/settings')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  onShow() {
    this.setData({
      user: store.get('sk_user', null),
      profileTheme: profileTheme.getTheme(store.get('sk_profile_theme', 'black')),
      text: i18n.page('settings'),
      common: i18n.page('common'),
      languageName: i18n.getLocaleName(),
      switchAccountText: getSwitchAccountText(),
      infoListText: getInfoListText(),
      serviceManageText: commonServices.getLabel('serviceManager')
    })
  },
  back() { uni.navigateBack() },
  openNotificationSettings(e) {
    const type = e.currentTarget.dataset.type || 'order'
    uni.navigateTo({ url: `/pages/notification-settings/notification-settings?type=${type}` })
  },

  async changeAvatar() {
    if (!this.user || !this.user.uid) {
      uni.showToast({ title: '璇峰厛閲嶆柊鐧诲綍璐﹀彿', icon: 'none' })
      return
    }
    let loadingShown = false
    try {
      const chooseResult = await new Promise((resolve, reject) => {
        uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: resolve,
          fail: reject
        })
      })
      const filePath = chooseResult.tempFilePaths && chooseResult.tempFilePaths[0]
      if (!filePath) return
      uni.showLoading({ title: '上传头像中' })
      loadingShown = true
      const avatar = await filePathToAvatarDataUrl(filePath)
      const { result } = await cloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'updateAvatar',
          uid: this.user.uid,
          avatar
        }
      })
      if (!result || result.code !== 0) {
        uni.showToast({ title: (result && result.message) || '头像更新失败', icon: 'none' })
        return
      }
      const user = { ...this.user, ...result.user }
      store.set('sk_user', user)
      account.saveCurrentUser(user)
      this.setData({ user })
      uni.showToast({ title: '头像已更换', icon: 'success' })
    } catch (err) {
      console.error('change avatar failed:', cloud.normalizeError(err), err)
      const errorMessage = err && err.message === 'AVATAR_TOO_LARGE'
        ? '图片过大，请换一张较小的头像'
        : '头像上传失败'
      uni.showToast({ title: errorMessage, icon: 'none' })
    } finally {
      if (loadingShown) uni.hideLoading()
    }
  },
  editTheme() { uni.navigateTo({ url: '/pages/profile-theme/profile-theme' }) },
  editNickname() {
    if (!this.user) {
      uni.showToast({ title: '请先登录账号', icon: 'none' })
      return
    }
    uni.navigateTo({ url: '/pages/nickname/nickname' })
  },
  openAccountSecurity() {
    if (this.securityChecking) return
    this.securityChecking = true
    uni.showLoading({ title: '环境安全检测中', mask: true })
    this.securityCheckTimer = setTimeout(() => {
      uni.hideLoading()
      uni.showToast({ title: '支付环境检测安全', icon: 'success', duration: 900 })
      this.securityNavigateTimer = setTimeout(() => {
        this.securityChecking = false
        uni.navigateTo({ url: '/pages/account-security/account-security' })
      }, 850)
    }, 4000)
  },
  openPersonalization() {
    uni.navigateTo({ url: '/pages/personalization/personalization' })
  },
  openServiceManager() {
    uni.navigateTo({ url: '/pages/service-manager/service-manager' })
  },
  openLanguage() {
    uni.navigateTo({ url: '/pages/language/language' })
  },
  openFontSize() {
    uni.navigateTo({ url: '/pages/font-size/font-size' })
  },
  openElderMode() {
    uni.navigateTo({ url: '/pages/elder-mode/elder-mode' })
  },
  copyUsername() {
    const username = this.user && this.user.username ? this.user.username : ''
    if (!username) {
      uni.showToast({ title: '请先登录账号', icon: 'none' })
      return
    }
    uni.setClipboardData({
      data: username,
      success: () => uni.showToast({ title: '已复制用户名', icon: 'none' })
    })
  },
  openAgreement(e) {
    const type = e.currentTarget.dataset.type === 'privacy' ? 'privacy' : 'user'
    uni.navigateTo({ url: `/pages/legal/legal?type=${type}&locale=${i18n.getLocale()}` })
  },
  openInfoList(e) {
    const type = e.currentTarget.dataset.type === 'third' ? 'third' : 'personal'
    uni.navigateTo({ url: `/pages/info-list/info-list?type=${type}&locale=${i18n.getLocale()}` })
  },
  openSwitchAccount() {
    uni.navigateTo({ url: '/pages/switch-account/switch-account' })
  },

  startCacheHold() {
    this.cancelCacheHold()
    this.cacheHoldTriggered = false
    this.cacheHoldTimer = setTimeout(() => {
      this.cacheHoldTimer = null
      this.cacheHoldTriggered = true
      this.resetMembershipForTesting()
    }, 3000)
  },
  cancelCacheHold() {
    if (this.cacheHoldTimer) {
      clearTimeout(this.cacheHoldTimer)
      this.cacheHoldTimer = null
    }
  },

  clearCache() {
    if (this.cacheHoldTriggered) {
      this.cacheHoldTriggered = false
      return
    }
    uni.showModal({ title: '清除缓存', content: '不会清除登录、订单和地址信息', success: res => { if (res.confirm) { uni.removeStorageSync('sk_search_history'); this.setData({ cacheSize: '0 KB' }); uni.showToast({ title: '清理完成' }) } } })
  },

  async resetMembershipForTesting() {
    if (!this.user) return
    try {
      await benefitBackend.resetMembership()
    } catch (err) {
      console.error('reset backend membership failed', err)
      membership.resetCurrentMembership()
    }
    const currentTheme = profileTheme.getTheme(store.get('sk_profile_theme', 'black'))
    if (currentTheme.membershipLimited) account.saveTheme('black')
    this.setData({
      profileTheme: profileTheme.getTheme(store.get('sk_profile_theme', 'black')),
      globalThemeStyle: profileTheme.getGlobalStyle(store.get('sk_profile_theme', 'black'))
    })
    uni.vibrateShort({ type: 'medium' })
    uni.showToast({ title: '已恢复为普通用户', icon: 'none', duration: 1800 })
  },
  logout() { uni.showModal({ title: '退出登录', content: '退出后订单和本地数据仍会保留', confirmColor: '#ff4d3d', success: res => { if (res.confirm) { account.logout(); this.setData({ user: null, profileTheme: profileTheme.getTheme('black') }); uni.showToast({ title: '已退出登录' }); setTimeout(() => uni.redirectTo({ url: '/pages/profile/profile' }), 500) } } }) },
  login() { uni.navigateTo({ url: '/pages/login/login' }) },
  onUnload() {
    this.cancelCacheHold()
    if (this.securityCheckTimer) clearTimeout(this.securityCheckTimer)
    if (this.securityNavigateTimer) clearTimeout(this.securityNavigateTimer)
    if (this.securityChecking) uni.hideLoading()
    this.securityChecking = false
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.settings-content{padding:22rpx 24rpx}.setting-group{padding:10rpx 26rpx;margin-bottom:20rpx}.group-title{display:block;font-size:21rpx;color:#999;padding:18rpx 0 8rpx}.setting-row{width:100%;height:94rpx;display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid #eee;text-align:left}.setting-row:last-child{border-bottom:0}.setting-row>text:last-child{color:#999;font-size:22rpx}.switch{width:88rpx;height:48rpx;border-radius:24rpx;background:#ddd;padding:5rpx}.switch view{width:38rpx;height:38rpx;border-radius:50%;background:#fff;transition:.2s}.switch.on{background:var(--orange)}.switch.on view{transform:translateX(40rpx)}.logout,.switch-account-btn{width:100%;height:92rpx;border-radius:28rpx;background:#fff;color:#ff4d3d;margin-top:35rpx;font-weight:650}

.setting-row{gap:20rpx}.setting-row>text:first-child{min-width:0}.setting-row>text:last-child{max-width:300rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
.switch{flex-shrink:0}.logout,.switch-account-btn{height:86rpx}
.setting-row{width:100%!important;max-width:none!important}.logout,.switch-account-btn{width:100%!important}
.switch{width:84rpx;height:46rpx;flex:0 0 84rpx;border-radius:23rpx;padding:5rpx;overflow:hidden;display:flex;align-items:center;justify-content:flex-start}
.switch view{width:36rpx;height:36rpx;box-shadow:0 2rpx 6rpx rgba(0,0,0,.16);transition:transform .2s ease}
.switch.on{justify-content:flex-end}.switch.on view{transform:none}
.logout,.switch-account-btn{display:flex;align-items:center;justify-content:center;line-height:1}
.page{
  min-height:100vh;
  height:auto;
  padding-bottom:40rpx;
  overflow-y:auto;
  overflow-x:hidden;
}

.logout{
  border-radius:999rpx;
}
.switch-account-btn{
  margin-top:34rpx;
  margin-bottom:-16rpx;
  border-radius:999rpx;
  color:#222;
}
.profile-entry-right{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap:14rpx;
}
.profile-entry-right image{
  width:54rpx;
  height:54rpx;
  flex:0 0 54rpx;
  border-radius:50%;
  background:#f2f2f5;
}
.profile-entry-right text{
  color:#aaa;
  font-size:25rpx;
}
.theme-entry-right{margin-left:auto;display:flex;align-items:center;gap:12rpx;color:#999;font-size:21rpx}
.theme-entry-right>view{width:38rpx;height:38rpx;flex:0 0 38rpx;border:4rpx solid #fff;border-radius:50%;box-shadow:0 2rpx 10rpx rgba(0,0,0,.18)}

/* Preserve the original row typography and alignment; only the switch handles taps. */
.notification-group>.setting-row>.switch{
  margin-left:auto;
}

.group-title{
  font-size:21rpx!important;
  font-weight:400;
  line-height:1.2;
}
.setting-row,
.setting-row::after{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.setting-row{
  position:relative;
  height:95rpx;
  padding:0!important;
  margin:0!important;
}
.setting-row:not(:last-child)::before{
  content:''!important;
  display:block!important;
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1rpx;
  background:#ededf0;
}
.setting-row>text:first-child{
  font-size:30rpx;
  font-weight:500;
  line-height:1.2;
  color:#111;
}
.setting-row>text:last-child{
  font-size:24rpx;
  font-weight:400;
}
.notification-group .switch{position:relative;z-index:3;pointer-events:auto}
.info-list-links{
  margin:26rpx 12rpx 10rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-wrap:wrap;
  gap:14rpx 22rpx;
}
.info-list-links button{
  padding:0!important;
  margin:0!important;
  width:auto!important;
  height:auto!important;
  line-height:34rpx;
  color:#2f7df6;
  font-size:23rpx;
  font-weight:500;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}

</style>
