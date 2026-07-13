<template>
<view :style="globalThemeStyle" class="page review-page">
  <view class="safe-nav review-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">评价订单</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="review-scroll">
    <view class="review-hero card">
      <view class="shop-mark">食</view>
      <view class="hero-main">
        <text>食刻·品质厨房</text>
        <text>你的真实评价，会帮助我们把每一餐做得更好。</text>
      </view>
    </view>

    <view class="card score-card">
      <text class="card-title">本次用餐体验</text>
      <view class="score-line">
        <text>总体评分</text>
        <view class="stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= overallScore ? 'active' : ''" :data-score="star" @tap="setOverall">★</button>
        </view>
        <text class="score-text">{{scoreText(overallScore)}}</text>
      </view>
      <view class="quick-tags">
        <button v-for="tag in quickTags" :key="tag" hover-class="none" :class="selectedTags.includes(tag) ? 'selected' : ''" :data-tag="tag" @tap="toggleTag">{{tag}}</button>
      </view>
    </view>

    <view class="card goods-card">
      <text class="card-title">商品评价</text>
      <view v-for="(item, index) in items" :key="item.key || item.id" class="goods-review">
        <view class="goods-top">
          <image :src="item.icon" mode="aspectFill" />
          <view>
            <text>{{item.name}}</text>
            <text>{{item.spec}} ×{{item.count}}</text>
          </view>
        </view>
        <view class="goods-score">
          <text>商品评分</text>
          <view class="mini-stars">
            <button v-for="star in 5" :key="star" hover-class="none" :class="star <= itemScores[index] ? 'active' : ''" :data-index="index" :data-score="star" @tap="setItemScore">★</button>
          </view>
        </view>
      </view>
    </view>

    <view class="card detail-score-card">
      <text class="card-title">服务细节</text>
      <view class="detail-score-row">
        <text>配送速度</text>
        <view class="mini-stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= deliveryScore ? 'active' : ''" :data-score="star" @tap="setDelivery">★</button>
        </view>
      </view>
      <view class="detail-score-row">
        <text>包装完整</text>
        <view class="mini-stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= packageScore ? 'active' : ''" :data-score="star" @tap="setPackage">★</button>
        </view>
      </view>
    </view>

    <view class="card comment-card">
      <view class="comment-title">
        <text>写点感受</text>
        <text>{{comment.length}}/120</text>
      </view>
      <textarea :value="comment" maxlength="120" placeholder="菜品口味、包装、送达速度都可以说说～" placeholder-class="textarea-placeholder" @input="onCommentInput"></textarea>
      <view class="anonymous-row">
        <view>
          <text>匿名评价</text>
          <text>隐藏昵称，仅展示评价内容</text>
        </view>
        <switch :checked="anonymous" color="#ff6533" @change="toggleAnonymous" />
      </view>
    </view>

    <view class="review-bottom-space"></view>
  </scroll-view>

  <view class="review-actions">
    <button hover-class="none" class="submit-review" @tap="submitReview">提交评价</button>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import paymentCountdown from '../../utils/payment-countdown.js'

const pageConfig = {
  data: {
    statusHeight: 20,
    orderId: '',
    order: null,
    items: [],
    overallScore: 5,
    deliveryScore: 5,
    packageScore: 5,
    itemScores: [],
    quickTags: ['味道不错', '分量足', '包装仔细', '送达准时', '性价比高', '还会再来'],
    selectedTags: ['味道不错'],
    comment: '',
    anonymous: true
  },
  onLoad(options) {
    const order = paymentCountdown.getOrder(options.id)
    if (!order || order.status !== 'done') {
      uni.showToast({ title: '当前订单暂不可评价', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 500)
      return
    }
    const oldReview = order.review || {}
    const itemScores = (order.items || []).map((item, index) => oldReview.itemScores ? oldReview.itemScores[index] || 5 : 5)
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      orderId: order.id,
      order,
      items: order.items || [],
      overallScore: oldReview.overallScore || 5,
      deliveryScore: oldReview.deliveryScore || 5,
      packageScore: oldReview.packageScore || 5,
      itemScores,
      selectedTags: oldReview.tags || ['味道不错'],
      comment: oldReview.comment || '',
      anonymous: oldReview.anonymous !== false
    })
  },
  back() { uni.navigateBack() },
  scoreText(score) {
    return ['很差', '较差', '一般', '满意', '超赞'][Math.max(1, Math.min(5, Number(score))) - 1]
  },
  setOverall(e) { this.setData({ overallScore: Number(e.currentTarget.dataset.score) }) },
  setDelivery(e) { this.setData({ deliveryScore: Number(e.currentTarget.dataset.score) }) },
  setPackage(e) { this.setData({ packageScore: Number(e.currentTarget.dataset.score) }) },
  setItemScore(e) {
    const index = Number(e.currentTarget.dataset.index)
    const score = Number(e.currentTarget.dataset.score)
    const itemScores = [...this.itemScores]
    itemScores[index] = score
    this.setData({ itemScores })
  },
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = this.selectedTags.includes(tag)
      ? this.selectedTags.filter(item => item !== tag)
      : [...this.selectedTags, tag]
    this.setData({ selectedTags })
  },
  onCommentInput(e) { this.setData({ comment: e.detail.value }) },
  toggleAnonymous(e) { this.setData({ anonymous: e.detail.value }) },
  submitReview() {
    if (!this.overallScore) {
      uni.showToast({ title: '请先选择总体评分', icon: 'none' })
      return
    }
    const review = {
      overallScore: this.overallScore,
      deliveryScore: this.deliveryScore,
      packageScore: this.packageScore,
      itemScores: this.itemScores,
      tags: this.selectedTags,
      comment: this.comment.trim(),
      anonymous: this.anonymous,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
    }
    const orders = store.get('sk_orders', []).map(item => item.id === this.orderId ? { ...item, review, reviewed: true } : item)
    store.set('sk_orders', orders)
    uni.showToast({ title: '评价成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 650)
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.review-page{
  background:#f5f5f7;
  padding-bottom:0;
}
.review-nav{
  position:relative;
  z-index:5;
  background:rgba(245,245,247,.96);
}
.review-scroll{
  height:calc(100vh - 88rpx - env(safe-area-inset-top));
  padding:18rpx 24rpx 180rpx;
}
.review-hero{
  padding:24rpx;
  display:flex;
  align-items:center;
  gap:18rpx;
  margin-bottom:18rpx;
}
.shop-mark{
  width:72rpx;
  height:72rpx;
  border-radius:22rpx;
  background:#1c1c1e;
  color:#fff;
  font-size:34rpx;
  font-weight:800;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}
.hero-main{
  min-width:0;
}
.hero-main text{
  display:block;
}
.hero-main text:first-child{
  font-size:30rpx;
  font-weight:800;
  margin-bottom:8rpx;
}
.hero-main text:last-child{
  color:#8e8e93;
  font-size:23rpx;
  line-height:1.45;
}
.score-card,.goods-card,.detail-score-card,.comment-card{
  padding:26rpx 24rpx;
  margin-bottom:18rpx;
}
.card-title{
  display:block;
  font-size:30rpx;
  font-weight:800;
  margin-bottom:22rpx;
}
.score-line{
  display:flex;
  align-items:center;
  gap:16rpx;
}
.score-line>text:first-child,.detail-score-row>text,.goods-score>text{
  font-size:25rpx;
  font-weight:700;
  color:#222;
  flex-shrink:0;
}
.stars,.mini-stars{
  display:flex;
  align-items:center;
  gap:4rpx;
}
.stars button,.mini-stars button{
  width:46rpx;
  height:46rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#d3d4da;
  font-size:38rpx;
  line-height:1;
  background:transparent!important;
  box-shadow:none!important;
}
.mini-stars button{
  width:40rpx;
  height:40rpx;
  font-size:32rpx;
}
.stars button.active,.mini-stars button.active{
  color:var(--orange);
}
.score-text{
  margin-left:auto;
  color:var(--orange);
  font-size:24rpx;
  font-weight:700;
}
.quick-tags{
  display:flex;
  flex-wrap:wrap;
  gap:14rpx;
  margin-top:24rpx;
}
.quick-tags button{
  height:52rpx;
  padding:0 24rpx;
  border-radius:999rpx;
  background:#f7f7f9!important;
  color:#666;
  font-size:23rpx;
}
.quick-tags button.selected{
  background:var(--orange-soft)!important;
  color:var(--orange);
  font-weight:700;
}
.goods-review{
  padding:18rpx 0;
  border-top:1rpx solid #f0f0f3;
}
.goods-review:first-of-type{
  border-top:0;
  padding-top:0;
}
.goods-top{
  display:flex;
  align-items:center;
  gap:16rpx;
  margin-bottom:18rpx;
}
.goods-top image{
  width:86rpx;
  height:86rpx;
  border-radius:20rpx;
  flex-shrink:0;
}
.goods-top view{
  min-width:0;
}
.goods-top text{
  display:block;
}
.goods-top text:first-child{
  font-size:28rpx;
  font-weight:800;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.goods-top text:last-child{
  color:#999;
  font-size:22rpx;
  margin-top:6rpx;
}
.goods-score,.detail-score-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  min-height:52rpx;
}
.detail-score-row+.detail-score-row{
  border-top:1rpx solid #f1f1f4;
  margin-top:14rpx;
  padding-top:16rpx;
}
.comment-title{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16rpx;
}
.comment-title text:first-child{
  font-size:30rpx;
  font-weight:800;
}
.comment-title text:last-child{
  color:#aaa;
  font-size:22rpx;
}
.comment-card textarea{
  width:100%;
  height:180rpx;
  padding:22rpx;
  border-radius:24rpx;
  background:#f7f7f9;
  font-size:25rpx;
  line-height:1.55;
}
.textarea-placeholder{
  color:#b3b3b8;
}
.anonymous-row{
  margin-top:18rpx;
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.anonymous-row view text{
  display:block;
}
.anonymous-row view text:first-child{
  font-size:26rpx;
  font-weight:750;
}
.anonymous-row view text:last-child{
  color:#999;
  font-size:21rpx;
  margin-top:6rpx;
}
.review-bottom-space{
  height:40rpx;
}
.review-actions{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
  background:linear-gradient(180deg, rgba(245,245,247,0), rgba(245,245,247,.96) 20%, rgba(245,245,247,.98));
  z-index:20;
}
.submit-review{
  width:100%!important;
  height:88rpx;
  border-radius:999rpx;
  background:var(--orange)!important;
  color:#fff;
  font-size:30rpx;
  font-weight:800;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 12rpx 28rpx var(--theme-shadow);
}
uni-button.submit-review,
uni-button.quick-tags button,
uni-button.stars button,
uni-button.mini-stars button{
  box-shadow:none!important;
}
</style>
