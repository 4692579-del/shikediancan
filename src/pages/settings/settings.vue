<template>
<view :style="globalThemeStyle" class="page"><view class="safe-nav" :style="`--status-height:${statusHeight}px`"><view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">设置</text><view class="nav-back"></view></view></view>
<view class="settings-content">
  <view class="setting-group notification-group card"><text class="group-title">消息通知</text><button hover-class="none" class="setting-row"><text>订单状态通知</text><view :class="`switch ${notice ? 'on' : ''}`" data-field="notice" @tap="toggle"><view></view></view></button><button hover-class="none" class="setting-row"><text>优惠活动通知</text><view :class="`switch ${promotion ? 'on' : ''}`" data-field="promotion" @tap="toggle"><view></view></view></button><button hover-class="none" class="setting-row"><text>声音与振动</text><view :class="`switch ${vibration ? 'on' : ''}`" data-field="vibration" @tap="toggle"><view></view></view></button></view>
  <view class="setting-group card"><text class="group-title">通用</text><button hover-class="none" class="setting-row" @tap="changeAvatar"><text>更换头像</text><view class="profile-entry-right"><image :src="user.avatar" mode="aspectFill" /><text>›</text></view></button><button hover-class="none" class="setting-row" @tap="editTheme"><text>更改资料卡主题</text><view class="theme-entry-right"><view :style="`background:${profileTheme.color}`"></view><text>{{profileTheme.name}} ›</text></view></button><button hover-class="none" class="setting-row" @touchstart="startCacheHold" @touchend="cancelCacheHold" @touchcancel="cancelCacheHold" @tap="clearCache"><text>清除缓存</text><text>{{cacheSize}} ›</text></button></view>
  <view class="setting-group card"><text class="group-title">协议与隐私</text><button hover-class="none" class="setting-row" data-type="user" @tap="openAgreement"><text>用户服务协议</text><text>›</text></button><button hover-class="none" class="setting-row" data-type="privacy" @tap="openAgreement"><text>隐私政策</text><text>›</text></button></view>
  <button hover-class="none" v-if="user" class="logout" @tap="logout">退出登录</button><button hover-class="none" v-else class="primary-btn" @tap="login">登录账号</button>
</view></view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 设置页：管理通知偏好、头像昵称、主题、缓存、登录状态及测试用会员重置。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import profileTheme from '../../utils/profile-theme.js'
import account from '../../utils/account.js'
import membership from '../../utils/membership.js'
import cloud from '../../utils/cloud.js'
const NOTIFICATION_SETTINGS_KEY = 'sk_notification_settings'
const DEFAULT_NOTIFICATION_SETTINGS = {
  notice: true,
  promotion: true,
  vibration: true
}

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

// H5 端直传 uniCloud 云存储可能因上传密钥失败而不可用。
// 这里将用户选择的图片压缩成头像尺寸，再交给云函数写入用户资料表，保证头像资料真正后端化。
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

const pageConfig = {
  data: { statusHeight: 20, user: null, profileTheme: profileTheme.getTheme('black'), notice: true, promotion: true, vibration: true, cacheSize: '2.4 MB' },
  onLoad() {
    if (!auth.guardPage('/pages/settings/settings')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  // 从缓存恢复通知开关和当前用户资料。
  onShow() {
    const notificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...store.get(NOTIFICATION_SETTINGS_KEY, {})
    }
    this.setData({
      user: store.get('sk_user', null),
      profileTheme: profileTheme.getTheme(store.get('sk_profile_theme', 'black')),
      ...notificationSettings
    })
  },
  back() { uni.navigateBack() },
  // 仅开关本身触发通知设置修改，并立即持久化。
  toggle(e) {
    const field = e.currentTarget.dataset.field
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_NOTIFICATION_SETTINGS, field)) return
    const nextSettings = {
      notice: this.notice,
      promotion: this.promotion,
      vibration: this.vibration,
      [field]: !this[field]
    }
    this.setData(nextSettings)
    store.set(NOTIFICATION_SETTINGS_KEY, nextSettings)
    uni.showToast({ title: '设置已保存', icon: 'none' })
  },
  // 头像改为用户自定义上传：选择本地图片后压缩为头像数据，再通过云函数写入用户资料表。
  async changeAvatar() {
    if (!this.user || !this.user.uid) {
      uni.showToast({ title: '请先重新登录账号', icon: 'none' })
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
  openAgreement(e) {
    const type = e.currentTarget.dataset.type === 'privacy' ? 'privacy' : 'user'
    uni.navigateTo({ url: `/pages/legal/legal?type=${type}` })
  },
  // 长按清除缓存三秒触发课程测试用的会员重置隐藏功能。
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
  // 普通点击只模拟清除缓存，不删除订单、地址等业务数据。
  clearCache() {
    if (this.cacheHoldTriggered) {
      this.cacheHoldTriggered = false
      return
    }
    uni.showModal({ title: '清除缓存', content: '不会清除登录、订单和地址信息', success: res => { if (res.confirm) { uni.removeStorageSync('sk_search_history'); this.setData({ cacheSize: '0 KB' }); uni.showToast({ title: '清理完成' }) } } })
  },
  // 仅供开发测试：完整移除当前账号会员身份及会员订单。
  resetMembershipForTesting() {
    if (!this.user) return
    membership.resetCurrentMembership()
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
  onUnload() { this.cancelCacheHold() }
}

export default adaptPage(pageConfig)
</script>

<style>
.settings-content{padding:22rpx 24rpx}.setting-group{padding:10rpx 26rpx;margin-bottom:20rpx}.group-title{display:block;font-size:21rpx;color:#999;padding:18rpx 0 8rpx}.setting-row{width:100%;height:94rpx;display:flex;align-items:center;justify-content:space-between;border-bottom:1rpx solid #eee;text-align:left}.setting-row:last-child{border-bottom:0}.setting-row>text:last-child{color:#999;font-size:22rpx}.switch{width:88rpx;height:48rpx;border-radius:24rpx;background:#ddd;padding:5rpx}.switch view{width:38rpx;height:38rpx;border-radius:50%;background:#fff;transition:.2s}.switch.on{background:var(--orange)}.switch.on view{transform:translateX(40rpx)}.logout{width:100%;height:92rpx;border-radius:28rpx;background:#fff;color:#ff4d3d;margin-top:35rpx;font-weight:650}

.setting-row{gap:20rpx}.setting-row>text:first-child{min-width:0}.setting-row>text:last-child{max-width:300rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
.switch{flex-shrink:0}.logout{height:86rpx}
.setting-row{width:100%!important;max-width:none!important}.logout{width:100%!important}
.switch{width:84rpx;height:46rpx;flex:0 0 84rpx;border-radius:23rpx;padding:5rpx;overflow:hidden;display:flex;align-items:center;justify-content:flex-start}
.switch view{width:36rpx;height:36rpx;box-shadow:0 2rpx 6rpx rgba(0,0,0,.16);transition:transform .2s ease}
.switch.on{justify-content:flex-end}.switch.on view{transform:none}
.logout{display:flex;align-items:center;justify-content:center;line-height:1}
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

/* 设置项保持轻量列表样式：文字缩小加粗，分割线只位于卡片内容区。 */
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
  height:86rpx;
  padding:0!important;
  margin:0!important;
}
.setting-row:not(:last-child)::before{
  content:'';
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1rpx;
  background:#ededf0;
}
.setting-row>text:first-child{
  font-size:27rpx;
  font-weight:650;
  line-height:1.2;
}
.notification-group .switch{position:relative;z-index:3;pointer-events:auto}

</style>
