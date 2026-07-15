<template>
<view :style="globalThemeStyle" class="page elder-page">
  <view class="safe-nav elder-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">长辈模式</text>
      <view class="nav-spacer"></view>
    </view>
  </view>

  <view class="elder-content">
    <view class="preview-wrap">
      <view class="phone-shell">
        <view class="phone-top">
          <text class="phone-time">9:41</text>
          <view class="phone-dots">
            <view></view><view></view><view></view>
          </view>
        </view>
        <view class="elder-demo">
          <view class="demo-location">
            <image src="/static/assets/icons/location.svg" mode="aspectFit" />
            <text>泉州市 闽南科技学院</text>
          </view>
          <view class="demo-search">
            <view class="demo-search-left">
              <image src="/static/assets/icons/search.svg" mode="aspectFit" />
              <text>搜索菜品</text>
            </view>
            <view class="demo-search-btn">搜索</view>
          </view>
          <view class="demo-shortcuts">
            <view class="demo-shortcut active">
              <text class="demo-shortcut-icon">热</text>
              <text>热卖</text>
            </view>
            <view class="demo-shortcut">
              <text class="demo-shortcut-icon">餐</text>
              <text>套餐</text>
            </view>
            <view class="demo-shortcut">
              <text class="demo-shortcut-icon">甜</text>
              <text>甜品</text>
            </view>
          </view>
          <view class="demo-food-card">
            <view class="demo-food-img">
              <image src="/static/assets/icons/restaurant.svg" mode="aspectFit" />
            </view>
            <view class="demo-food-info">
              <text class="demo-food-name">招牌照烧鸡腿饭</text>
              <text class="demo-food-desc">鲜嫩鸡腿 · 约30分钟送达</text>
              <view class="demo-food-bottom">
                <text class="demo-price">¥26.8</text>
                <view class="demo-add">选规格</view>
              </view>
            </view>
          </view>
          <view class="demo-cart-bar">
            <view>
              <text class="demo-cart-label">已选 1 件</text>
              <text class="demo-cart-price">¥26.8</text>
            </view>
            <view class="demo-checkout">去结算</view>
          </view>
        </view>
      </view>
    </view>

    <view class="intro-card">
      <text class="headline">字大更清晰\n流程更简单\n点餐更轻松</text>
      <view class="mode-compare">
        <view class="compare-row">
          <view class="compare-badge normal">普通</view>
          <text>信息展示更完整，适合熟悉点餐流程的用户。</text>
        </view>
        <view class="compare-row">
          <view class="compare-badge elder">简洁</view>
          <text>突出菜品、价格和下单按钮，减少次要干扰。</text>
        </view>
        <view class="compare-row">
          <view class="compare-badge elder">清晰</view>
          <text>开启后首页、点餐页、购物车和确认订单会进入简洁大字版。</text>
        </view>
      </view>
      <button hover-class="none" class="enable-btn" @tap="toggleElderMode">
        {{enabled ? '关闭长辈模式' : '开启长辈模式'}}
      </button>
      <view class="note-line">
        <text>长辈模式会精简部分展示内容，核心下单功能保持可用。</text>
      </view>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import elderMode from '../../utils/elder-mode.js'

export default adaptPage({
  data: {
    statusHeight: 20,
    enabled: false
  },
  onLoad() {
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight || 20,
      enabled: elderMode.isEnabled()
    })
  },
  onShow() {
    this.setData({ enabled: elderMode.isEnabled() })
  },
  back() {
    uni.navigateBack()
  },
  toggleElderMode() {
    const next = !this.enabled
    elderMode.setEnabled(next)
    this.setData({ enabled: next })
    uni.showToast({
      title: next ? '已开启长辈模式' : '已关闭长辈模式',
      icon: 'none'
    })
  }
})
</script>

<style>
.elder-page{
  min-height:100vh;
  background:#f4f4f5;
  color:#151515;
}
.elder-page .safe-nav{
  background:#f4f4f5;
}
.elder-page .nav-row{
  padding:0 28rpx;
  justify-content:center;
}
.elder-page .nav-title{
  font-size:34rpx;
  font-weight:800;
  color:#111;
}
.elder-page .nav-spacer{
  width:72rpx;
  height:72rpx;
}
.elder-content{
  position:relative;
  padding:20rpx 0 40rpx;
}
.preview-wrap{
  height:600rpx;
  display:flex;
  justify-content:center;
  overflow:hidden;
}
.phone-shell{
  width:520rpx;
  height:680rpx;
  margin-top:8rpx;
  padding:34rpx 28rpx;
  border:14rpx solid #252525;
  border-bottom:0;
  border-radius:72rpx 72rpx 0 0;
  background:linear-gradient(180deg, rgba(238,111,70,.92), rgba(255,234,216,.96) 42%, #fff 100%);
  box-shadow:0 28rpx 54rpx rgba(28,28,28,.16);
  box-sizing:border-box;
}
.phone-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-weight:700;
  color:#222;
}
.phone-time{
  font-size:26rpx;
}
.phone-dots{
  display:flex;
  gap:8rpx;
}
.phone-dots view{
  width:10rpx;
  height:10rpx;
  border-radius:50%;
  background:#222;
}
.elder-demo{
  margin-top:34rpx;
  padding:24rpx;
  border-radius:36rpx;
  background:rgba(255,255,255,.72);
  box-shadow:0 18rpx 42rpx rgba(92,58,35,.12), inset 0 0 0 1rpx rgba(255,255,255,.72);
  backdrop-filter:blur(8rpx);
}
.demo-location{
  display:flex;
  align-items:center;
  gap:10rpx;
  font-size:25rpx;
  line-height:1;
  font-weight:800;
  color:#222;
}
.demo-location image{
  width:28rpx;
  height:28rpx;
}
.demo-search{
  height:64rpx;
  margin-top:18rpx;
  padding:0 8rpx 0 20rpx;
  border-radius:999rpx;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  box-shadow:0 10rpx 24rpx rgba(238,111,70,.12);
}
.demo-search-left{
  display:flex;
  align-items:center;
  gap:10rpx;
  color:#999;
  font-size:22rpx;
}
.demo-search-left image{
  width:26rpx;
  height:26rpx;
}
.demo-search-btn{
  width:96rpx;
  height:50rpx;
  border-radius:999rpx;
  background:var(--orange);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22rpx;
  font-weight:800;
}
.demo-shortcuts{
  margin-top:18rpx;
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:12rpx;
}
.demo-shortcut{
  height:98rpx;
  border-radius:24rpx;
  background:rgba(255,255,255,.78);
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:8rpx;
  color:#444;
  font-size:21rpx;
  font-weight:700;
}
.demo-shortcut.active{
  background:rgba(238,111,70,.14);
  color:var(--orange);
}
.demo-shortcut-icon{
  width:38rpx;
  height:38rpx;
  border-radius:14rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#fff;
  font-size:20rpx;
}
.demo-food-card{
  margin-top:18rpx;
  padding:18rpx;
  border-radius:28rpx;
  background:#fff;
  display:flex;
  gap:18rpx;
  box-shadow:0 16rpx 34rpx rgba(70,70,70,.08);
}
.demo-food-img{
  width:108rpx;
  height:108rpx;
  border-radius:24rpx;
  background:linear-gradient(135deg, #ffe4c9, #f3b27e);
  display:flex;
  align-items:center;
  justify-content:center;
  flex:none;
}
.demo-food-img image{
  width:56rpx;
  height:56rpx;
}
.demo-food-info{
  min-width:0;
  flex:1;
  display:flex;
  flex-direction:column;
}
.demo-food-name{
  font-size:26rpx;
  line-height:1.2;
  color:#202020;
  font-weight:900;
}
.demo-food-desc{
  margin-top:8rpx;
  font-size:20rpx;
  color:#999;
}
.demo-food-bottom{
  margin-top:auto;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12rpx;
}
.demo-price{
  color:var(--orange);
  font-size:30rpx;
  font-weight:900;
}
.demo-add{
  width:96rpx;
  height:44rpx;
  border-radius:999rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--orange);
  color:#fff;
  font-size:20rpx;
  font-weight:800;
}
.demo-cart-bar{
  height:76rpx;
  margin-top:18rpx;
  padding:0 12rpx 0 24rpx;
  border-radius:999rpx;
  background:#202020;
  display:flex;
  align-items:center;
  justify-content:space-between;
  box-shadow:0 14rpx 30rpx rgba(0,0,0,.18);
}
.demo-cart-label{
  display:block;
  color:rgba(255,255,255,.72);
  font-size:18rpx;
}
.demo-cart-price{
  display:block;
  margin-top:2rpx;
  color:#fff;
  font-size:28rpx;
  font-weight:900;
}
.demo-checkout{
  width:126rpx;
  height:56rpx;
  border-radius:999rpx;
  background:var(--orange);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:23rpx;
  font-weight:900;
}
.intro-card{
  position:relative;
  margin-top:-38rpx;
  padding:72rpx 40rpx 38rpx;
  min-height:470rpx;
  border-radius:42rpx 42rpx 0 0;
  background:#fff;
  box-shadow:0 -18rpx 40rpx rgba(20,20,20,.06);
  z-index:2;
}
.headline{
  display:block;
  white-space:pre-line;
  text-align:center;
  font-size:46rpx;
  line-height:1.55;
  font-weight:900;
  letter-spacing:1rpx;
  color:#1f1f1f;
}
.mode-compare{
  margin-top:44rpx;
  padding:10rpx 8rpx;
}
.compare-row{
  display:flex;
  align-items:flex-start;
  gap:16rpx;
  margin-bottom:18rpx;
  font-size:25rpx;
  line-height:1.55;
  color:#777;
}
.compare-badge{
  flex:none;
  min-width:72rpx;
  height:36rpx;
  padding:0 12rpx;
  border-radius:999rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:22rpx;
  font-weight:700;
  box-sizing:border-box;
}
.compare-badge.normal{
  color:#777;
  background:#f1f1f2;
}
.compare-badge.elder{
  color:var(--orange);
  background:rgba(238,111,70,.12);
}
.enable-btn,
.elder-page uni-button.enable-btn{
  width:100%!important;
  height:88rpx;
  margin:38rpx 0 0!important;
  border-radius:999rpx;
  background:var(--orange)!important;
  color:#fff!important;
  font-size:30rpx;
  font-weight:800;
  line-height:88rpx;
  box-shadow:0 18rpx 34rpx rgba(238,111,70,.26);
}
.note-line{
  margin-top:26rpx;
  text-align:center;
}
.note-line text{
  font-size:24rpx;
  line-height:1.6;
  color:#999;
}
</style>
