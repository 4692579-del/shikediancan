<template>
<view :style="globalThemeStyle" class="page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">{{group.title}}</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <view class="content">
    <view class="notice-card card">
      <view v-for="item in group.items" :key="item.key" class="notice-row">
        <view class="notice-copy">
          <text class="notice-title">{{item.title}}</text>
          <text class="notice-desc">{{item.desc}}</text>
        </view>
        <view :class="`switch ${settings[item.key] ? 'on' : ''}`" :data-field="item.key" @tap.stop="toggle">
          <view></view>
        </view>
      </view>
    </view>

    <text class="notice-tip">关闭后将不再展示对应类型的本机提醒，不影响订单、支付和账户功能正常使用。</text>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import notificationSettings from '../../utils/notification-settings.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    type: 'order',
    group: notificationSettings.getGroup('order'),
    settings: notificationSettings.get()
  },
  onLoad(query = {}) {
    const type = query.type === 'service' ? 'service' : 'order'
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      type,
      group: notificationSettings.getGroup(type),
      settings: notificationSettings.get()
    })
  },
  onShow() {
    this.setData({ settings: notificationSettings.get() })
  },
  back() {
    uni.navigateBack()
  },
  toggle(e) {
    const field = e.currentTarget.dataset.field
    const next = notificationSettings.set(field, !this.settings[field])
    this.setData({ settings: next })
    uni.showToast({ title: '设置已保存', icon: 'none' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.page{
  min-height:100vh;
  background:#f5f5f7;
  overflow-x:hidden;
}
.content{
  padding:22rpx 24rpx 46rpx;
}
.notice-card{
  padding:8rpx 28rpx;
}
.notice-row{
  position:relative;
  width:100%;
  min-height:126rpx;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:22rpx;
}
.notice-row:not(:last-child)::before{
  content:'';
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1rpx;
  background:#ededf0;
}
.notice-copy{
  min-width:0;
  flex:1;
}
.notice-title{
  display:block;
  font-size:30rpx;
  line-height:1.25;
  font-weight:500;
  color:#111;
}
.notice-desc{
  display:block;
  margin-top:10rpx;
  font-size:23rpx;
  line-height:1.45;
  color:#999;
}
.switch{
  width:84rpx;
  height:46rpx;
  flex:0 0 84rpx;
  border-radius:23rpx;
  padding:5rpx;
  background:#ddd;
  overflow:hidden;
  display:flex;
  align-items:center;
  justify-content:flex-start;
}
.switch view{
  width:36rpx;
  height:36rpx;
  border-radius:50%;
  background:#fff;
  box-shadow:0 2rpx 6rpx rgba(0,0,0,.16);
}
.switch.on{
  justify-content:flex-end;
  background:var(--orange);
}
.notice-tip{
  display:block;
  padding:22rpx 12rpx 0;
  font-size:23rpx;
  line-height:1.55;
  color:#aaa;
}
</style>
