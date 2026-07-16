<template>
<view :style="globalThemeStyle" class="page switch-account-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">切换账号</text>
      <button hover-class="none" class="manage-btn" @tap="toggleManage">{{manageMode ? '完成' : '管理'}}</button>
    </view>
  </view>

  <view class="content">
    <text class="headline">点击头像切换账号</text>

    <view class="account-list">
      <view v-for="item in accounts" :key="item.accountId" class="account-card-wrap">
        <view class="account-card" @tap="chooseAccount" :data-id="item.accountId">
          <view class="avatar">
            <image v-if="item.avatar" :src="item.avatar" mode="aspectFill" />
            <text v-else>{{item.initial}}</text>
          </view>
          <view class="account-info">
            <text class="account-name">{{item.displayName}}</text>
            <text class="account-sub">{{item.username}}</text>
          </view>
          <view v-if="item.isCurrent" class="current-mark">
            <view></view>
            <text>当前登录</text>
          </view>
          <button
            v-else-if="manageMode"
            hover-class="none"
            class="delete-account"
            @tap.stop="deleteAccount"
            :data-id="item.accountId"
          >删除</button>
        </view>
      </view>

      <button hover-class="none" class="add-card" @tap="addAccount">
        <view class="add-icon">＋</view>
        <text>添加账号</text>
      </button>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import account from '../../utils/account.js'
import auth from '../../utils/auth.js'
import cloud from '../../utils/cloud.js'
import addressBackend from '../../utils/address-backend.js'

function displayName(user = {}) {
  return user.nickname || (user.username ? `食刻用户${user.username}` : '食刻用户')
}

function accountInitial(user = {}) {
  return String(displayName(user)).slice(0, 1).toUpperCase()
}

function getUid(item = {}) {
  if (item.uid) return item.uid
  if (item.userId) return item.userId
  if (item.accountId && item.accountId.startsWith('cloud:')) return item.accountId.replace('cloud:', '')
  return ''
}

const pageConfig = {
  data: {
    statusHeight: 20,
    currentUser: null,
    accounts: [],
    manageMode: false,
    switchingId: ''
  },
  onLoad() {
    if (!auth.guardPage('/pages/switch-account/switch-account')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight || 20 })
  },
  onShow() {
    this.refreshAccounts()
  },
  back() {
    uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/settings/settings' }) })
  },
  refreshAccounts() {
    const currentUser = store.get('sk_user', null)
    if (currentUser) account.rememberAccount(currentUser)
    const currentId = currentUser ? account.getAccountId(currentUser) : ''
    const list = account.getSavedAccounts()
      .map(item => ({
        ...item,
        displayName: displayName(item),
        initial: accountInitial(item),
        isCurrent: item.accountId === currentId
      }))
      .sort((a, b) => {
        if (a.isCurrent) return -1
        if (b.isCurrent) return 1
        return Number(b.lastLoginAt || 0) - Number(a.lastLoginAt || 0)
      })
    this.setData({ currentUser, accounts: list })
  },
  toggleManage() {
    this.setData({ manageMode: !this.manageMode })
  },
  addAccount() {
    uni.navigateTo({ url: '/pages/login/login' })
  },
  async chooseAccount(e) {
    const accountId = e.currentTarget.dataset.id
    const item = this.accounts.find(accountItem => accountItem.accountId === accountId)
    if (!item || this.manageMode) return
    if (item.isCurrent) {
      uni.showToast({ title: '当前已是该账号', icon: 'none' })
      return
    }
    if (this.switchingId) return

    const uid = getUid(item)
    if (!uid) {
      uni.showToast({ title: '账号信息不完整，请重新登录', icon: 'none' })
      return
    }

    this.setData({ switchingId: accountId })
    uni.showLoading({ title: '正在切换' })
    try {
      const { result } = await cloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'get',
          uid
        }
      })
      if (!result || result.code !== 0 || !result.user) {
        uni.showToast({ title: (result && result.message) || '账号状态异常', icon: 'none' })
        return
      }
      account.switchToUser(result.user)
      await addressBackend.fetchAddresses({ force: true })
      store.set('sk_privacy_consent_v1', true)
      this.refreshAccounts()
      uni.showToast({ title: '切换成功', icon: 'success' })
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/profile/profile' })
      }, 450)
    } catch (err) {
      console.error('switch account failed:', cloud.normalizeError(err), err)
      uni.showToast({ title: '后端服务暂时不可用', icon: 'none' })
    } finally {
      uni.hideLoading()
      this.setData({ switchingId: '' })
    }
  },
  deleteAccount(e) {
    const accountId = e.currentTarget.dataset.id
    const item = this.accounts.find(accountItem => accountItem.accountId === accountId)
    if (!item) return
    if (item.isCurrent) {
      uni.showToast({ title: '当前账号不能删除', icon: 'none' })
      return
    }
    uni.showModal({
      title: '删除账号记录',
      content: `仅删除本设备上的「${item.displayName}」登录记录，不会注销云端账号。`,
      confirmText: '删除',
      confirmColor: '#ea6f46',
      success: res => {
        if (!res.confirm) return
        account.removeSavedAccount(accountId)
        this.refreshAccounts()
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.switch-account-page{
  min-height:100vh;
  background:#f3f3f4;
  overflow-x:hidden;
}
.switch-account-page .safe-nav{
  background:#fff;
}
.switch-account-page .nav-row{
  padding:0 28rpx;
  justify-content:center;
}
.switch-account-page .nav-title{
  font-size:34rpx;
  font-weight:750;
  color:#111;
  pointer-events:none;
}
.manage-btn{
  position:absolute!important;
  right:26rpx!important;
  top:0!important;
  bottom:0!important;
  height:88rpx!important;
  min-width:88rpx!important;
  max-width:none!important;
  padding:0 4rpx!important;
  margin:0!important;
  display:flex;
  align-items:center;
  justify-content:center;
  background:transparent!important;
  color:#111;
  font-size:28rpx;
  font-weight:520;
  line-height:1;
}
.content{
  padding:76rpx 24rpx 60rpx;
}
.headline{
  display:block;
  text-align:center;
  font-size:34rpx;
  font-weight:520;
  color:#202023;
  margin-bottom:74rpx;
}
.account-list{
  display:flex;
  flex-direction:column;
  gap:22rpx;
}
.account-card-wrap{
  width:100%;
}
.account-card,
.add-card{
  width:100%!important;
  min-height:146rpx;
  border-radius:20rpx!important;
  background:#fff!important;
  padding:0 30rpx!important;
  margin:0!important;
  display:flex;
  align-items:center;
  text-align:left;
  box-shadow:none!important;
  line-height:1;
  box-sizing:border-box;
}
.account-card{
  gap:28rpx;
}
.avatar{
  width:82rpx;
  height:82rpx;
  border-radius:50%;
  overflow:hidden;
  background:#f3e8dc;
  color:#ea6f46;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:32rpx;
  font-weight:800;
  flex-shrink:0;
}
.avatar image{
  width:100%;
  height:100%;
  display:block;
}
.account-info{
  min-width:0;
  flex:1;
  display:flex;
  flex-direction:column;
  gap:12rpx;
}
.account-name{
  font-size:32rpx;
  color:#222;
  font-weight:520;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.account-sub{
  font-size:24rpx;
  color:#777;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.current-mark{
  display:flex;
  align-items:center;
  gap:12rpx;
  color:#222;
  font-size:27rpx;
  flex-shrink:0;
}
.current-mark view{
  width:12rpx;
  height:12rpx;
  border-radius:50%;
  background:#55c56a;
}
.delete-account{
  width:104rpx!important;
  height:58rpx!important;
  min-width:104rpx!important;
  margin:0!important;
  padding:0!important;
  border-radius:999rpx!important;
  background:rgba(234,111,70,.1)!important;
  color:#ea6f46!important;
  font-size:25rpx;
  font-weight:650;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}
.add-card{
  gap:28rpx;
  color:#999;
  font-size:31rpx;
  font-weight:520;
}
.add-icon{
  width:82rpx;
  height:82rpx;
  border-radius:50%;
  border:2rpx dashed #ddd;
  color:#bbb;
  font-size:56rpx;
  line-height:76rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  box-sizing:border-box;
  flex-shrink:0;
}
button::after{
  border:0;
}
</style>
