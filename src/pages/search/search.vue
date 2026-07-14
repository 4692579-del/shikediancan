<template>
<view :style="globalThemeStyle" class="page search-page">
  <view class="search-head" :style="`--search-status-height:${statusHeight}px`">
    <view class="search-row"><button hover-class="none" class="nav-back search-page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><view class="search-input"><image src="/static/assets/icons/search.svg" mode="aspectFit" /><input focus placeholder="搜索美食、菜品或店铺" :value="keyword" @input="input" confirm-type="search" @confirm="search"/><text v-if="keyword" class="clear" @tap="clear">×</text></view><button hover-class="none" class="search-btn" @tap="search">搜索</button></view>
  </view>
  <view v-if="!searched" class="search-content">
    <view v-if="history.length" class="search-section">
      <view class="history-head"><text class="search-title">最近搜索</text></view>
      <view class="history-list">
        <view v-for="(item, index) in history" :key="item" class="history-row">
          <view :class="`history-track ${swipedHistory === item ? 'swiped' : ''}`" :data-word="item" @touchstart="historyTouchStart" @touchend="historyTouchEnd">
            <button hover-class="none" class="history-word" :data-word="item" @tap="historySearch">{{item}}</button>
            <button hover-class="none" class="history-delete" :data-word="item" @tap.stop="removeHistory">×</button>
          </view>
        </view>
      </view>
    </view>
    <view class="search-section">
      <text class="search-title">热门搜索</text>
      <view class="hot-list"><button v-for="(item, index) in hot" :key="item" hover-class="none" :data-word="item" @tap="search"><text>{{index + 1}}</text>{{item}}</button></view>
    </view>
  </view>
  <view v-else class="result-content">
    <text class="result-count">为你找到 {{results.length}} 个结果</text>
    <view v-for="(item, index) in results" :key="item.id" class="result-card card" :data-id="item.id" @tap="goFoodDetail">
      <view class="result-visual" :style="`background:${item.bg}`"><image :src="item.icon" mode="aspectFill" /></view>
      <view class="result-main"><text class="result-name">{{item.name}}</text><text class="result-desc">{{item.desc}}</text><view class="result-sales"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{item.rating}} · 月售 {{item.sales}}</text></view><view class="between"><text class="result-price">¥{{item.price}}</text><button hover-class="none" :data-id="item.id" @tap.stop="add">＋</button></view></view>
    </view>
    <view v-if="!results.length" class="empty"><view class="empty-icon"><image src="/static/assets/icons/search.svg" mode="aspectFit" /></view><view class="empty-title">没有找到相关美食</view><view class="empty-desc">换个关键词试试</view></view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 搜索页：完成菜品关键字搜索、历史记录管理和商品详情跳转。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import orderBackend from '../../utils/order-backend.js'
import productBackend from '../../utils/product-backend.js'
const pageConfig = {
  data: { statusHeight: 20, keyword: '', results: [], searched: false, history: [], swipedHistory: '', hot: ['照烧鸡腿饭', '麻辣香锅', '杨枝甘露', '轻食沙拉', '牛肉意面', '双人餐'] },
  onLoad() {
    if (!auth.guardPage('/pages/search/search')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, history: store.get('sk_search_history', []) })
    productBackend.syncProducts().catch(err => console.error('sync products failed', err))
  },
  back() { uni.navigateBack() },
  input(e) { this.setData({ keyword: e.detail.value }); if (!e.detail.value) this.setData({ searched: false, results: [] }) },
  clear() { this.setData({ keyword: '', searched: false, results: [] }) },
  // 按名称和描述执行不区分大小写的本地模糊搜索，并更新历史记录。
  search(e) {
    const keyword = (e.currentTarget.dataset.word || this.keyword).trim()
    if (!keyword) return
    const results = productBackend.searchFoods(keyword)
    const history = [keyword].concat(this.history.filter(item => item !== keyword)).slice(0, 8)
    store.set('sk_search_history', history)
    this.setData({ keyword, results, searched: true, history, swipedHistory: '' })
  },
  historyTouchStart(e) {
    const touch = e.changedTouches[0]
    this.historyTouchX = touch ? touch.clientX : 0
    this.historyTouchY = touch ? touch.clientY : 0
  },
  // 历史记录左滑后显示单条删除按钮。
  historyTouchEnd(e) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this.historyTouchX
    const dy = touch.clientY - this.historyTouchY
    const word = e.currentTarget.dataset.word
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 32) return
    this.setData({ swipedHistory: dx < 0 ? word : '' })
  },
  historySearch(e) {
    const word = e.currentTarget.dataset.word
    if (this.swipedHistory) {
      this.setData({ swipedHistory: '' })
      return
    }
    this.search({ currentTarget: { dataset: { word } } })
  },
  removeHistory(e) {
    const word = e.currentTarget.dataset.word
    const history = this.history.filter(item => item !== word)
    store.set('sk_search_history', history)
    this.setData({ history, swipedHistory: '' })
  },
  goFoodDetail(e) { uni.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` }) },
  add(e) {
    const food = productBackend.getFoodById(e.currentTarget.dataset.id)
    if (!food) return uni.showToast({ title: '商品数据加载中', icon: 'none' })
    store.addCart(food)
    orderBackend.saveCart(store.getCart()).catch(err => console.error('sync cart failed', err))
    uni.showToast({ title: '已加入购物车' })
  },
}

export default adaptPage(pageConfig)
</script>

<style>
.search-head{background:#f5f5f7;padding-left:15rpx;padding-right:24rpx}.search-row{height:100rpx;display:flex;align-items:center}.search-input{flex:1;height:76rpx;border-radius:25rpx;background:#fff;display:flex;align-items:center;padding:0 18rpx;box-shadow:0 5rpx 16rpx rgba(0,0,0,.04)}.search-input>text:first-child{font-size:34rpx;margin-right:10rpx}.search-input input{flex:1}.clear{font-size:34rpx;color:#aaa}.search-btn{color:var(--orange);font-weight:650;padding-left:18rpx}.search-content,.result-content{padding:20rpx 28rpx}.search-section{margin-bottom:42rpx}.search-title{font-size:32rpx;font-weight:750}.trash{font-size:22rpx;color:#999}.word-list{display:flex;flex-wrap:wrap;gap:16rpx;margin-top:20rpx}.word-list button{padding:14rpx 22rpx;background:#fff;border-radius:22rpx;font-size:23rpx}.hot-list{display:grid;grid-template-columns:1fr 1fr;gap:5rpx 24rpx;margin-top:16rpx}.hot-list button{text-align:left;height:72rpx;font-size:25rpx}.hot-list text{display:inline-block;width:34rpx;color:#aaa;font-style:italic}.hot-list button:nth-child(-n+3) text{color:var(--orange);font-weight:800}.result-count{display:block;color:#999;font-size:22rpx;margin-bottom:18rpx}.result-card{display:flex;padding:20rpx;margin-bottom:18rpx}.result-visual{width:170rpx;height:170rpx;border-radius:26rpx;display:flex;align-items:center;justify-content:center;font-size:76rpx}.result-main{flex:1;padding-left:19rpx}.result-name,.result-desc,.result-sales{display:block}.result-name{font-size:29rpx;font-weight:750}.result-desc{font-size:20rpx;color:#888;margin:8rpx 0}.result-sales{font-size:19rpx;color:#aaa;margin-bottom:15rpx}.result-price{color:var(--orange);font-size:32rpx;font-weight:800}.result-main button{width:48rpx;height:48rpx;border-radius:16rpx;background:var(--orange);color:#fff;font-size:31rpx}

.search-input{min-width:0}.search-input input{min-width:0}.search-btn{flex-shrink:0;padding-left:14rpx}
.result-card{padding:18rpx;min-width:0}.result-visual{width:145rpx;height:145rpx;flex-shrink:0;font-size:66rpx}.result-main{min-width:0;padding-left:16rpx}
.result-name,.result-desc,.result-sales{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.result-name{font-size:27rpx}.result-main button{flex-shrink:0}
.search-row{padding-right:150rpx}
.result-main button{width:48rpx!important;flex:0 0 48rpx}
.search-input>image{width:30rpx;height:30rpx;margin-right:10rpx;flex-shrink:0}
.result-visual image{width:72rpx;height:72rpx}
.result-visual{overflow:hidden}.result-visual image{width:100%;height:100%;display:block}
.result-sales{display:flex;align-items:center}
.result-sales image{width:20rpx;height:20rpx;margin-right:5rpx}
.empty-icon image{width:104rpx;height:104rpx}

/* Place the complete search row below the native capsule. */
.search-head{
  padding:calc(var(--search-status-height, 20px) + 62rpx) 24rpx 12rpx;
}

.search-input{
  border-radius:999rpx;
}
.word-list button{
  border-radius:999rpx;
}
.search-row{
  width:100%;
  height:82rpx;
  padding:0 0 0 52rpx;
  gap:12rpx;
  position:relative;
}
.search-row .search-page-back{
  position:absolute!important;
  left:-10rpx!important;
  top:50%;
  transform:translateY(-50%);
  width:48rpx;
  min-width:48rpx;
  max-width:48rpx;
  height:70rpx;
  flex:0 0 48rpx;
  justify-content:center;
  margin:0!important;
  padding:0!important;
}
.search-row .search-page-back image{width:28rpx;height:28rpx}
.search-input{
  min-width:0;
  height:72rpx;
  padding:0 18rpx;
  border-radius:24rpx;
}
.search-btn{
  width:92rpx!important;
  min-width:92rpx!important;
  max-width:92rpx!important;
  height:70rpx;
  flex:0 0 92rpx;
  padding:0!important;
  border-radius:23rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  background:var(--orange);
  font-size:23rpx;
}

/* Give the hot-search heading and entries more breathing room. */
.hot-list{
  margin-top:28rpx;
  row-gap:12rpx;
}

/* Final capsule override after the compact search-layout rules above. */
.search-input,
.search-btn,
.word-list button{
  border-radius:999rpx;
}

/* Match the home-page search control exactly. */
.search-row{
  height:76rpx;
  gap:10rpx;
}
.search-input{
  height:68rpx;
  padding:0 12rpx 0 22rpx;
  border-radius:34rpx;
  box-shadow:0 6rpx 18rpx rgba(35,35,45,.05);
}
.search-input>image{
  width:27rpx;
  height:27rpx;
  margin-right:10rpx;
}
.search-input input{
  font-size:22rpx;
}
.search-input .clear{
  padding:8rpx;
  font-size:28rpx;
}
.search-btn{
  width:98rpx!important;
  min-width:98rpx!important;
  max-width:98rpx!important;
  height:56rpx;
  flex:0 0 98rpx;
  border-radius:28rpx;
  font-size:22rpx;
}

/* One search record per row, with an opt-in individual delete mode. */
.history-head{
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.history-list{
  margin-top:16rpx;
  border-radius:26rpx;
  overflow:hidden;
  background:#fff;
}
.history-row{
  height:76rpx;
  position:relative;
  overflow:hidden;
  border-bottom:1rpx solid #f0f0f2;
}
.history-row:last-child{
  border-bottom:0;
}
.history-track{
  width:calc(100% + 76rpx);
  height:76rpx;
  display:flex;
  align-items:center;
  transform:translateX(0);
  transition:transform .22s ease;
}
.history-track.swiped{
  transform:translateX(-76rpx);
}
.history-word{
  min-width:0;
  width:calc(100% - 76rpx)!important;
  flex:0 0 calc(100% - 76rpx);
  height:76rpx;
  padding:0 22rpx!important;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  color:#333;
  font-size:24rpx;
  text-align:left;
}
.history-delete{
  width:76rpx!important;
  min-width:76rpx!important;
  max-width:76rpx!important;
  height:76rpx;
  flex:0 0 76rpx;
  border-radius:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#fff;
  background:#ff5c45;
  font-size:32rpx;
  line-height:1;
}

/* 热门搜索是文字列表，不要每条内容背后的浅色按钮底。 */
.search-page .hot-list button,
.search-page .hot-list uni-button{
  background:transparent!important;
  background-color:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
.search-page .hot-list button::after,
.search-page .hot-list uni-button::after{
  display:none!important;
  border:0!important;
  background:transparent!important;
}

</style>
