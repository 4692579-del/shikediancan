<template>
<view :style="globalThemeStyle" class="page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">我的收藏</text><view class="nav-back"></view></view>
  </view>
  <view class="favorite-list">
    <view v-for="(item, index) in foods" :key="item.id" class="fav-swipe-row">
      <view class="fav-delete-action"><button hover-class="none" :data-id="item.id" @tap.stop="remove"><image src="/static/assets/icons/delete.svg" mode="aspectFit" /><text>删除</text></button></view>
      <view :class="`fav-card card fav-track ${swipedId === item.id ? 'swiped' : ''}`" :data-id="item.id" @tap="goFoodDetail" @touchstart="swipeStart" @touchend="swipeEnd">
        <view class="fav-visual" :style="`background:${item.bg}`"><image :src="item.icon" mode="aspectFill" /></view>
        <view class="fav-copy"><text>{{item.name}}</text><text>{{item.desc}}</text><text>¥{{item.price}}</text></view>
        <view class="fav-actions"><button hover-class="none" :data-id="item.id" @tap.stop="add"><image src="/static/assets/icons/plus.svg" mode="aspectFit" /></button></view>
      </view>
    </view>
    <view v-if="!foods.length" class="empty"><view class="empty-icon"><image src="/static/assets/icons/heart.svg" mode="aspectFit" /></view><view class="empty-title">还没有收藏美食</view><view class="empty-desc">遇到喜欢的菜品，就把它收藏起来吧</view></view>
  </view>
  <product-spec-sheet :show="showSpecSheet" :food="selectedFood" @close="closeSpecSheet" @added="specAdded" />
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 收藏页：展示收藏商品，支持左滑删除、查看详情和打开规格面板。

import data from '../../utils/data.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
const pageConfig = {
  data: { statusHeight: 20, foods: [], swipedId: 0, selectedFood: null, showSpecSheet: false },
  onLoad() {
    if (!auth.guardPage('/pages/favorites/favorites')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  // 根据收藏 id 从最新商品数据中重建收藏列表。
  onShow() { const ids = store.get('sk_favorites', []); this.setData({ foods: data.foods.filter(item => ids.includes(item.id)), swipedId: 0 }) },
  back() { uni.navigateBack() },
  goFoodDetail(e) {
    if (this.swipedId) {
      this.setData({ swipedId: 0 })
      return
    }
    uni.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` })
  },
  remove(e) { const id = Number(e.currentTarget.dataset.id); const ids = store.get('sk_favorites', []).filter(item => item !== id); store.set('sk_favorites', ids); this.setData({ foods: this.foods.filter(item => item.id !== id), swipedId: 0 }); uni.showToast({ title: '已删除收藏', icon: 'none' }) },
  swipeStart(e) { const touch = e.changedTouches[0]; this.touchX = touch ? touch.clientX : 0; this.touchY = touch ? touch.clientY : 0 },
  // 收藏卡片横向左滑时显示删除按钮。
  swipeEnd(e) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this.touchX
    const dy = touch.clientY - this.touchY
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 35) return
    this.setData({ swipedId: dx < 0 ? Number(e.currentTarget.dataset.id) : 0 })
  },
  // 收藏页加号打开与商品详情相同的规格组件。
  add(e) { const selectedFood = data.foods.find(item => item.id === Number(e.currentTarget.dataset.id)); this.setData({ selectedFood, showSpecSheet: true, swipedId: 0 }) },
  closeSpecSheet() { this.setData({ showSpecSheet: false }) },
  specAdded() {}
}

export default adaptPage(pageConfig)
</script>

<style>
.favorite-list{padding:22rpx 24rpx}.fav-card{display:flex;padding:20rpx;margin-bottom:18rpx;align-items:center}.fav-visual{width:145rpx;height:145rpx;border-radius:25rpx;display:flex;align-items:center;justify-content:center;font-size:68rpx}.fav-copy{flex:1;padding-left:18rpx}.fav-copy text{display:block}.fav-copy text:first-child{font-size:28rpx;font-weight:700}.fav-copy text:nth-child(2){font-size:20rpx;color:#888;margin:8rpx 0}.fav-copy text:last-child{color:var(--orange);font-size:30rpx;font-weight:800}.fav-actions{display:flex;flex-direction:column;gap:12rpx}.fav-actions button{width:49rpx;height:49rpx;border-radius:17rpx;background:#f2f2f5;display:flex;align-items:center;justify-content:center}.fav-actions button:last-child{background:var(--orange);color:#fff}

.fav-visual{width:128rpx;height:128rpx;flex-shrink:0;font-size:59rpx}.fav-copy{min-width:0;padding-left:15rpx}
.fav-copy text:first-child,.fav-copy text:nth-child(2){white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fav-copy text:first-child{font-size:26rpx}.fav-actions{flex-shrink:0;margin-left:8rpx}
.fav-visual image{width:66rpx;height:66rpx}
.fav-actions image{width:25rpx;height:25rpx}
.fav-actions button:last-child image{filter:brightness(0) invert(1)}
.empty-icon image{width:104rpx;height:104rpx}
.fav-visual{overflow:hidden}.fav-visual image{width:100%;height:100%;display:block}
.fav-card{margin-bottom:0}
.fav-actions button:first-child{background:var(--orange)}
.fav-actions button:first-child image{filter:brightness(0) invert(1)}
.fav-actions button{
  width:50rpx!important;
  min-width:50rpx!important;
  max-width:50rpx!important;
  height:50rpx;
  flex:0 0 50rpx;
  padding:0!important;
  border-radius:50%!important;
}
.fav-swipe-row{position:relative;overflow:hidden;margin-bottom:18rpx;border-radius:32rpx}
.fav-track{position:relative;z-index:2;width:100%;background:#fff;transform:translateX(0);transition:transform .26s cubic-bezier(.22,.61,.36,1)}
.fav-track.swiped{transform:translateX(-100rpx)}
.fav-delete-action{position:absolute;z-index:1;top:0;right:0;bottom:0;width:100rpx;display:flex;align-items:center;justify-content:center;background:transparent}
.fav-delete-action button{width:72rpx!important;min-width:72rpx!important;max-width:72rpx!important;height:72rpx;border-radius:50%;background:linear-gradient(145deg,#ff6b58,#ed493b);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3rpx;font-size:17rpx;box-shadow:0 8rpx 18rpx rgba(28,28,32,.14)}
.fav-delete-action image{width:25rpx;height:25rpx;filter:brightness(0) invert(1)}

/* Keep this page opaque during card swipes so the previous page never bleeds through. */
.page{
  min-height:100vh;
  background:#f5f5f7;
  isolation:isolate;
}
.favorite-list{
  padding-bottom:calc(40rpx + env(safe-area-inset-bottom));
}
.fav-swipe-row{
  background:#f5f5f7;
  touch-action:pan-y;
}
.fav-track{
  transform:translate3d(0,0,0);
  backface-visibility:hidden;
}
.fav-track.swiped{transform:translate3d(-100rpx,0,0)}

/* 左滑删除圆钮：图标和文字贴近一些，视觉更集中。 */
.fav-delete-action button{
  gap:0!important;
  line-height:1!important;
}
.fav-delete-action image{
  width:23rpx!important;
  height:23rpx!important;
  margin:0 0 1rpx!important;
}
.fav-delete-action text{
  margin-top:0!important;
  font-size:16rpx!important;
  line-height:18rpx!important;
  white-space:nowrap!important;
}

</style>
