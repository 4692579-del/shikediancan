<template>
<view :style="globalThemeStyle" class="page nickname-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">修改昵称</text>
      <button hover-class="none" class="done-btn" :disabled="saving" @tap="saveNickname">完成</button>
    </view>
  </view>

  <view class="nickname-content">
    <view class="edit-card card">
      <text class="field-label">昵称</text>
      <view class="nickname-input">
        <input
          maxlength="16"
          placeholder="请输入新的昵称"
          :value="nickname"
          @input="nicknameInput"
        />
        <button v-if="nickname" hover-class="none" class="clear-btn" @tap="clearNickname">×</button>
      </view>
      <text class="field-tip">昵称用于应用内展示，不影响登录用户名。</text>
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

const pageConfig = {
  data: {
    statusHeight: 20,
    user: null,
    nickname: '',
    saving: false
  },
  onLoad() {
    if (!auth.guardPage('/pages/nickname/nickname')) return
    const user = store.get('sk_user', null)
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight || 20,
      user,
      nickname: user && user.nickname ? user.nickname : ''
    })
  },
  back() {
    uni.navigateBack()
  },
  nicknameInput(e) {
    this.setData({ nickname: e.detail.value || '' })
  },
  clearNickname() {
    this.setData({ nickname: '' })
  },
  async saveNickname() {
    if (this.saving) return
    const nickname = String(this.nickname || '').trim()
    if (!nickname) {
      uni.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (nickname.length < 2 || nickname.length > 16) {
      uni.showToast({ title: '昵称需为2-16个字符', icon: 'none' })
      return
    }
    if (!this.user || !this.user.uid) {
      uni.showToast({ title: '请先重新登录账号', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    uni.showLoading({ title: '保存中' })
    try {
      const { result } = await cloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'updateNickname',
          uid: this.user.uid,
          nickname
        }
      })
      if (!result || result.code !== 0) {
        uni.showToast({ title: (result && result.message) || '昵称保存失败', icon: 'none' })
        return
      }
      const user = { ...this.user, ...result.user }
      store.set('sk_user', user)
      account.saveCurrentUser(user)
      uni.showToast({ title: '昵称已更新', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 420)
    } catch (err) {
      console.error('update nickname failed:', cloud.normalizeError(err), err)
      uni.showToast({ title: '昵称保存失败', icon: 'none' })
    } finally {
      uni.hideLoading()
      this.setData({ saving: false })
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.nickname-page{
  min-height:100vh;
  background:#f5f5f7;
}
.nickname-page .nav-row{
  justify-content:center;
}
.nickname-page .page-back{
  left:10rpx!important;
}
.nickname-page .nav-title{
  position:static;
  transform:none;
  margin-left:0;
}
.done-btn{
  position:absolute!important;
  left:calc(50% + 112rpx)!important;
  top:50%!important;
  transform:translateY(-50%)!important;
  width:92rpx!important;
  height:64rpx!important;
  margin:0!important;
  padding:0!important;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--orange);
  font-size:26rpx;
  font-weight:700;
  background:transparent!important;
}
.done-btn::after,
.clear-btn::after{
  border:0!important;
}
.nickname-content{
  padding:24rpx;
}
.edit-card{
  padding:28rpx;
}
.field-label{
  display:block;
  font-size:24rpx;
  color:#999;
  margin-bottom:18rpx;
}
.nickname-input{
  height:88rpx;
  border-radius:999rpx;
  background:#f7f7f9;
  border:1rpx solid rgba(0,0,0,.04);
  display:flex;
  align-items:center;
  padding:0 26rpx;
  box-sizing:border-box;
}
.nickname-input input{
  flex:1;
  min-width:0;
  height:88rpx;
  font-size:28rpx;
  color:#222;
}
.clear-btn{
  width:48rpx!important;
  height:48rpx!important;
  min-width:48rpx!important;
  max-width:48rpx!important;
  margin:0!important;
  padding:0!important;
  border-radius:50%!important;
  background:#ececf1!important;
  color:#999;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:30rpx;
  line-height:1;
}
.field-tip{
  display:block;
  margin-top:18rpx;
  font-size:22rpx;
  color:#999;
}
</style>
