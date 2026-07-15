<template>
<view :style="globalThemeStyle" class="page personalization-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">个性化</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <view class="personalization-content">
    <view class="setting-group card">
      <text class="group-title">修改个人资料</text>
      <button hover-class="none" class="setting-row" @tap="changeAvatar">
        <text>更换头像</text>
        <view class="profile-entry-right"><image :src="user && user.avatar ? user.avatar : '/static/assets/icons/smile.svg'" mode="aspectFill" /><text>›</text></view>
      </button>
      <button hover-class="none" class="setting-row" @tap="editNickname">
        <text>修改昵称</text>
        <text>{{user && user.nickname ? user.nickname : '未设置'}} ›</text>
      </button>
    </view>

    <view class="setting-group card">
      <text class="group-title">主题自定义</text>
      <button hover-class="none" class="setting-row" @tap="editTheme">
        <text>更改资料卡主题</text>
        <view class="theme-entry-right"><view :style="`background:${profileTheme.color}`"></view><text>{{profileTheme.name}} ›</text></view>
      </button>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import account from '../../utils/account.js'
import profileTheme from '../../utils/profile-theme.js'
import cloud from '../../utils/cloud.js'

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

const pageConfig = {
  data: {
    statusHeight: 20,
    user: null,
    profileTheme: profileTheme.getTheme('black')
  },
  onLoad() {
    if (!auth.guardPage('/pages/personalization/personalization')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight || 20 })
  },
  onShow() {
    this.setData({
      user: store.get('sk_user', null),
      profileTheme: profileTheme.getTheme(store.get('sk_profile_theme', 'black'))
    })
  },
  back() { uni.navigateBack() },
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
  editNickname() {
    uni.navigateTo({ url: '/pages/nickname/nickname' })
  },
  editTheme() {
    uni.navigateTo({ url: '/pages/profile-theme/profile-theme' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.personalization-page{min-height:100vh;background:#f5f5f7}
.personalization-content{padding:24rpx}
.setting-group{padding:10rpx 26rpx;margin-bottom:20rpx}
.group-title{display:block;font-size:21rpx;color:#999;font-weight:400;line-height:1.2;padding:18rpx 0 8rpx}
.setting-row{position:relative;width:100%!important;height:86rpx!important;margin:0!important;padding:0!important;display:flex;align-items:center;justify-content:space-between;background:transparent!important;text-align:left}
.setting-row::after{border:0!important}
.setting-row:not(:last-child)::before{content:'';position:absolute;left:0;right:0;bottom:0;height:1rpx;background:#ededf0}
.setting-row text:first-child{font-size:27rpx;font-weight:650;color:#111}
.setting-row>text:last-child{max-width:340rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;font-size:22rpx;color:#999}
.profile-entry-right{margin-left:auto;display:flex;align-items:center;gap:14rpx}
.profile-entry-right image{width:54rpx;height:54rpx;flex:0 0 54rpx;border-radius:50%;background:#f2f2f5}
.profile-entry-right text{color:#aaa;font-size:25rpx}
.theme-entry-right{margin-left:auto;display:flex;align-items:center;gap:12rpx;color:#999;font-size:21rpx}
.theme-entry-right>view{width:38rpx;height:38rpx;flex:0 0 38rpx;border:4rpx solid #fff;border-radius:50%;box-shadow:0 2rpx 10rpx rgba(0,0,0,.18)}
</style>
