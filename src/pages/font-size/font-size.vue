<template>
<view :style="globalThemeStyle" class="page font-size-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">字体大小调节</text>
      <view class="nav-spacer"></view>
    </view>
  </view>

  <view class="font-content">
    <text class="section-title">字体预览</text>

    <view class="preview-card card" :style="previewStyle">
      <view class="preview-head">
        <text class="preview-kicker">{{current.label}}</text>
        <text class="preview-state">实时预览</text>
      </view>
      <text class="preview-title">招牌照烧鸡腿饭</text>
      <text class="preview-desc">鲜嫩去骨鸡腿，搭配蔬菜和米饭，适合日常快速点餐。</text>
      <view class="preview-row">
        <text class="preview-price">¥26.8</text>
        <button hover-class="none" class="preview-btn">选规格</button>
      </view>
    </view>

    <view class="control-card card">
      <view class="control-head">
        <text>当前字号</text>
        <text>{{current.label}}</text>
      </view>
      <view
        :class="`custom-slider ${sliding ? 'sliding' : ''}`"
        @tap="tapTrack"
        @touchstart="beginSlide"
        @touchmove="moveSlide"
        @touchend="endSlide"
        @touchcancel="endSlide"
        @mousedown="beginMouseSlide"
      >
        <view class="custom-slider-track">
          <view class="custom-slider-progress" :style="progressStyle"></view>
          <view class="custom-slider-stop left"></view>
          <view class="custom-slider-stop center"></view>
          <view class="custom-slider-stop right"></view>
          <view class="custom-slider-thumb" :style="thumbStyle"></view>
        </view>
      </view>
      <view class="size-labels">
        <text
          v-for="(item, index) in levels"
          :key="item.key"
          :class="`size-label ${activeIndex === index ? 'active' : ''}`"
        >
          {{item.label}}
        </text>
      </view>
    </view>

    <view class="tips-card card">
      <text class="tips-title">说明</text>
      <text class="tips-desc">{{current.desc}}</text>
      <text class="tips-desc">当前仅在本页面实时预览，设置已保存，后续可继续接入到首页、点餐、购物车等核心页面。</text>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import fontSize from '../../utils/font-size.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    levels: fontSize.levels,
    activeIndex: fontSize.getIndex(),
    dragPercent: fontSize.getIndex() * 50,
    sliding: false,
    current: fontSize.getCurrent()
  },
  computed: {
    previewStyle() {
      const scale = this.current && this.current.scale ? this.current.scale : 1
      return `--font-scale:${scale}`
    },
    thumbStyle() {
      return `left:${this.dragPercent}%`
    },
    progressStyle() {
      return `width:${this.dragPercent}%`
    }
  },
  onLoad() {
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      activeIndex: fontSize.getIndex(),
      dragPercent: fontSize.getIndex() * 50,
      current: fontSize.getCurrent()
    })
  },
  onUnload() {
    this.removeMouseListeners()
  },
  back() {
    uni.navigateBack()
  },
  getEventClientX(e) {
    const touch = e && e.touches && e.touches[0]
    const changedTouch = e && e.changedTouches && e.changedTouches[0]
    return touch ? touch.clientX : (changedTouch ? changedTouch.clientX : (e && e.clientX))
  },
  queryTrackRect() {
    return new Promise(resolve => {
      uni.createSelectorQuery()
        .in(this)
        .select('.custom-slider-track')
        .boundingClientRect(rect => resolve(rect))
        .exec()
    })
  },
  async updateByClientX(clientX, snap = false) {
    if (typeof clientX !== 'number') return
    const rect = await this.queryTrackRect()
    if (!rect || !rect.width) return
    const rawPercent = ((clientX - rect.left) / rect.width) * 100
    const percent = Math.max(0, Math.min(100, rawPercent))
    const nearestIndex = Math.max(0, Math.min(2, Math.round(percent / 50)))
    const current = fontSize.levels[nearestIndex]
    this.setData({
      dragPercent: snap ? nearestIndex * 50 : percent,
      activeIndex: nearestIndex,
      current
    })
    if (snap) fontSize.setLevelByIndex(nearestIndex)
  },
  beginSlide(e) {
    this.setData({ sliding: true })
    this.updateByClientX(this.getEventClientX(e))
  },
  moveSlide(e) {
    if (!this.sliding) return
    this.updateByClientX(this.getEventClientX(e))
  },
  endSlide(e) {
    if (!this.sliding) return
    this.setData({ sliding: false })
    this.updateByClientX(this.getEventClientX(e), true)
    this.removeMouseListeners()
  },
  beginMouseSlide(e) {
    this.setData({ sliding: true })
    this.updateByClientX(this.getEventClientX(e))
    if (typeof document !== 'undefined') {
      this._mouseMoveHandler = event => this.moveSlide(event)
      this._mouseUpHandler = event => this.endSlide(event)
      document.addEventListener('mousemove', this._mouseMoveHandler)
      document.addEventListener('mouseup', this._mouseUpHandler)
    }
  },
  removeMouseListeners() {
    if (typeof document === 'undefined') return
    if (this._mouseMoveHandler) document.removeEventListener('mousemove', this._mouseMoveHandler)
    if (this._mouseUpHandler) document.removeEventListener('mouseup', this._mouseUpHandler)
    this._mouseMoveHandler = null
    this._mouseUpHandler = null
  },
  tapTrack(e) {
    this.updateByClientX(this.getEventClientX(e), true)
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.font-size-page{
  min-height:100vh;
  background:#f2f2f3;
}
.font-size-page .safe-nav{
  background:#f2f2f3;
}
.font-size-page .nav-row{
  padding:0 24rpx;
  justify-content:center;
}
.font-size-page .nav-title{
  font-size:34rpx;
  font-weight:800;
  color:#111;
}
.font-size-page .nav-spacer{
  width:72rpx;
  height:72rpx;
}
.font-content{
  padding:24rpx 26rpx 44rpx;
}
.section-title{
  display:block;
  margin:10rpx 16rpx 26rpx;
  font-size:28rpx;
  color:#9a9aa0;
}
.preview-card,
.control-card,
.tips-card{
  border-radius:32rpx;
  background:#fff;
  box-shadow:none;
}
.preview-card{
  padding:34rpx 32rpx;
}
.preview-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.preview-kicker{
  padding:8rpx 18rpx;
  border-radius:999rpx;
  color:var(--orange);
  background:rgba(238,111,70,.1);
  font-size:calc(22rpx * var(--font-scale));
  font-weight:700;
}
.preview-state{
  color:#9a9aa0;
  font-size:calc(22rpx * var(--font-scale));
}
.preview-title{
  display:block;
  margin-top:28rpx;
  color:#111;
  font-size:calc(34rpx * var(--font-scale));
  font-weight:800;
  line-height:1.28;
}
.preview-desc{
  display:block;
  margin-top:16rpx;
  color:#777;
  font-size:calc(26rpx * var(--font-scale));
  line-height:1.55;
}
.preview-row{
  margin-top:30rpx;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.preview-price{
  color:var(--orange);
  font-size:calc(36rpx * var(--font-scale));
  font-weight:900;
}
.preview-btn,
.font-size-page uni-button.preview-btn{
  width:168rpx!important;
  height:64rpx;
  margin:0!important;
  padding:0!important;
  border-radius:999rpx;
  background:var(--orange)!important;
  color:#fff!important;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:calc(25rpx * var(--font-scale));
  font-weight:800;
  line-height:64rpx;
}
.control-card{
  margin-top:24rpx;
  padding:30rpx 26rpx 26rpx;
}
.control-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 8rpx 18rpx;
  color:#111;
  font-size:30rpx;
  font-weight:600;
}
.control-head text:last-child{
  color:var(--orange);
}
.custom-slider{
  padding:30rpx 12rpx 20rpx;
}
.custom-slider-track{
  position:relative;
  height:12rpx;
  border-radius:999rpx;
  background:#ececef;
  box-shadow:inset 0 1rpx 2rpx rgba(0,0,0,.04);
}
.custom-slider-progress{
  position:absolute;
  left:0;
  top:0;
  height:12rpx;
  border-radius:999rpx;
  background:linear-gradient(90deg, rgba(238,111,70,.72), var(--orange));
  transition:width .2s ease;
}
.custom-slider-stop{
  position:absolute;
  top:50%;
  width:10rpx;
  height:10rpx;
  border-radius:50%;
  background:rgba(255,255,255,.9);
  transform:translate(-50%, -50%);
  box-shadow:0 0 0 1rpx rgba(238,111,70,.12);
}
.custom-slider-stop.left{
  left:0;
}
.custom-slider-stop.center{
  left:50%;
}
.custom-slider-stop.right{
  left:100%;
}
.custom-slider-thumb{
  position:absolute;
  top:50%;
  width:34rpx;
  height:34rpx;
  border-radius:50%;
  background:#fff;
  transform:translate(-50%, -50%);
  box-shadow:0 8rpx 20rpx rgba(238,111,70,.28), 0 0 0 9rpx rgba(238,111,70,.12);
  border:6rpx solid var(--orange);
  box-sizing:border-box;
  transition:left .22s cubic-bezier(.2,.8,.2,1);
  z-index:2;
}
.custom-slider.sliding .custom-slider-progress,
.custom-slider.sliding .custom-slider-thumb{
  transition:none;
}
.size-labels{
  margin-top:10rpx;
  display:grid;
  grid-template-columns:repeat(3, 1fr);
}
.size-label{
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:26rpx;
  font-weight:600;
  color:#9a9aa0;
}
.size-label:first-child{
  justify-content:flex-start;
  padding-left:8rpx;
}
.size-label:last-child{
  justify-content:flex-end;
  padding-right:8rpx;
}
.size-label.active{
  color:var(--orange);
}
.tips-card{
  margin-top:24rpx;
  padding:30rpx 32rpx;
}
.tips-title{
  display:block;
  color:#111;
  font-size:30rpx;
  font-weight:700;
}
.tips-desc{
  display:block;
  margin-top:14rpx;
  color:#8e8e93;
  font-size:26rpx;
  line-height:1.65;
}
</style>
