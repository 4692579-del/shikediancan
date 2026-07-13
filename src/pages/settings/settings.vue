<template>
<view :style="globalThemeStyle" class="page"><view class="safe-nav" :style="`--status-height:${statusHeight}px`"><view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">设置</text><view class="nav-back"></view></view></view>
<view class="settings-content">
  <view class="setting-group notification-group card"><text class="group-title">消息通知</text><button hover-class="none" class="setting-row"><text>订单状态通知</text><view :class="`switch ${notice ? 'on' : ''}`" data-field="notice" @tap="toggle"><view></view></view></button><button hover-class="none" class="setting-row"><text>优惠活动通知</text><view :class="`switch ${promotion ? 'on' : ''}`" data-field="promotion" @tap="toggle"><view></view></view></button><button hover-class="none" class="setting-row"><text>声音与振动</text><view :class="`switch ${vibration ? 'on' : ''}`" data-field="vibration" @tap="toggle"><view></view></view></button></view>
  <view class="setting-group card"><text class="group-title">通用</text><button hover-class="none" class="setting-row" @tap="changeAvatar"><text>选择系统头像</text><view class="profile-entry-right"><image :src="user.avatar" mode="aspectFill" /><text>›</text></view></button><button hover-class="none" class="setting-row" @tap="editNickname"><text>选择系统昵称</text><text>{{user.nickname}} ›</text></button><button hover-class="none" class="setting-row" @tap="editTheme"><text>更改资料卡主题</text><view class="theme-entry-right"><view :style="`background:${profileTheme.color}`"></view><text>{{profileTheme.name}} ›</text></view></button><button hover-class="none" class="setting-row" @touchstart="startCacheHold" @touchend="cancelCacheHold" @touchcancel="cancelCacheHold" @tap="clearCache"><text>清除缓存</text><text>{{cacheSize}} ›</text></button></view>
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
const NOTIFICATION_SETTINGS_KEY = 'sk_notification_settings'
const DEFAULT_NOTIFICATION_SETTINGS = {
  notice: true,
  promotion: true,
  vibration: true
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
  // 头像仅允许选择随应用发布的固定安全素材，不再读取相册或接收用户上传图片。
  // 这样可从源头消除头像场景中的用户生成图片内容，避免未经服务端内容安全检测的图片被使用。
  changeAvatar() {
    const avatars = [
      { name: '经典微笑', path: '/static/assets/icons/smile.svg' },
      { name: '简约人物', path: '/static/assets/icons/user.svg' },
      { name: '食刻标识', path: '/static/assets/icons/food.svg' }
    ]
    uni.showActionSheet({
      itemList: avatars.map(item => item.name),
      success: res => {
        const selected = avatars[res.tapIndex]
        if (!selected) return
        const user = { ...this.user, avatar: selected.path }
        store.set('sk_user', user)
        account.saveCurrentUser(user)
        this.setData({ user })
        uni.showToast({ title: '头像已更换', icon: 'success' })
      }
    })
  },
  // 昵称同样使用固定安全文案，避免产生未经过服务端内容安全检测的任意文本发布入口。
  editNickname() {
    const nicknames = ['食刻用户', '美食探索家', '干饭达人', '今日好胃口']
    uni.showActionSheet({
      itemList: nicknames,
      success: res => {
        const nickname = nicknames[res.tapIndex]
        if (!nickname) return
        const user = { ...this.user, nickname }
        store.set('sk_user', user)
        account.saveCurrentUser(user)
        this.setData({ user })
        uni.showToast({ title: '昵称已更新', icon: 'success' })
      }
    })
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
