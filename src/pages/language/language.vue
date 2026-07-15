<template>
<view :style="globalThemeStyle" class="page language-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">{{text.title}}</text>
      <button hover-class="none" class="save-btn" @tap="saveLocale">{{common.save}}</button>
    </view>
  </view>

  <view class="language-content">
    <text class="section-title">{{text.subtitle}}</text>

    <view class="language-card card">
      <button
        v-for="item in locales"
        :key="item.code"
        hover-class="none"
        :class="`language-row ${tempLocale === item.code ? 'active' : ''}`"
        :data-code="item.code"
        @tap="selectLocale"
      >
        <text class="language-name">{{item.name}}</text>
        <view class="check-dot">
          <image v-if="tempLocale === item.code" src="/static/assets/icons/check.svg" mode="aspectFit" />
        </view>
      </button>
    </view>

    <text class="support-note">{{text.supportText}}</text>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import i18n from '../../utils/i18n.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    locale: i18n.getLocale(),
    tempLocale: i18n.getLocale(),
    locales: i18n.locales,
    text: i18n.page('language'),
    common: i18n.page('common')
  },
  onLoad() {
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  onShow() {
    this.refreshText()
  },
  refreshText() {
    this.setData({
      locale: i18n.getLocale(),
      tempLocale: i18n.getLocale(),
      text: i18n.page('language'),
      common: i18n.page('common')
    })
  },
  back() {
    uni.navigateBack()
  },
  selectLocale(e) {
    const locale = e.currentTarget.dataset.code
    this.setData({ tempLocale: locale })
  },
  saveLocale() {
    i18n.setLocale(this.tempLocale)
    this.refreshText()
    uni.showToast({ title: i18n.page('language').toast, icon: 'none' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.language-page{min-height:100vh;background:#f2f2f3}
.language-page .safe-nav{background:#f2f2f3}
.language-page .nav-row{padding:0 24rpx;justify-content:center}
.language-page .nav-title{font-size:34rpx;font-weight:800;color:#111;z-index:1;pointer-events:none}
.language-page .save-btn,
.language-page uni-button.save-btn{
  width:auto!important;
  min-width:92rpx!important;
  max-width:none!important;
  height:54rpx;
  margin-left:auto!important;
  padding:0 24rpx!important;
  border-radius:999rpx;
  background:var(--orange)!important;
  color:#fff!important;
  font-size:26rpx;
  font-weight:700;
  line-height:54rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  position:absolute!important;
  right:24rpx;
  top:50%;
  transform:translateY(-50%);
  z-index:3;
}
.language-content{padding:24rpx 26rpx 0}
.section-title{display:block;margin:10rpx 16rpx 26rpx;font-size:28rpx;color:#9a9aa0}
.language-card{overflow:hidden;padding:0;border-radius:32rpx;background:#fff;box-shadow:none}
.language-row{height:100rpx;padding:0 28rpx;display:flex;align-items:center;justify-content:space-between;text-align:left}
.language-row:last-child{border-bottom:0}
.language-name{font-size:30rpx;font-weight:500;color:#171719}
.check-dot{width:42rpx;height:42rpx;border-radius:50%;border:3rpx solid #d5d5d8;display:flex;align-items:center;justify-content:center;box-sizing:border-box}
.language-row.active .check-dot{border-color:var(--orange);background:var(--orange)}
.check-dot image{width:24rpx;height:24rpx;filter:brightness(0) invert(1)}
.support-note{display:block;margin:28rpx 16rpx 0;line-height:1.65;font-size:28rpx;color:#999aa0}
</style>
