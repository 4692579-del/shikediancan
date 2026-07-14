<template>
<view :style="globalThemeStyle" class="page review-page">
  <view class="safe-nav review-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">{{ labels.pageTitle }}</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="review-scroll">
    <view class="review-hero card">
      <view class="shop-mark">{{ labels.shopMark }}</view>
      <view class="hero-main">
        <text>{{ labels.shopName }}</text>
        <text>{{ labels.heroDesc }}</text>
      </view>
    </view>

    <view class="card score-card">
      <text class="card-title">{{ labels.mealTitle }}</text>
      <view class="score-line">
        <text>{{ labels.overall }}</text>
        <view class="stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= overallScore ? 'active' : ''" :data-score="star" @tap="setOverall">{{ labels.star }}</button>
        </view>
        <text class="score-text">{{ scoreHint }}</text>
      </view>
      <text class="score-slogan">{{ scoreSlogan }}</text>
      <view class="quick-tags">
        <button v-for="tag in recommendedTags" :key="tag" hover-class="none" :class="selectedTags.includes(tag) ? 'selected' : ''" :data-tag="tag" @tap="toggleTag">{{ tag }}</button>
      </view>
    </view>

    <view class="card goods-card">
      <text class="card-title">{{ labels.goodsTitle }}</text>
      <view class="goods-list">
        <view v-for="item in items" :key="item.key || item.id" class="goods-pill">
          <image :src="item.icon" mode="aspectFill" />
          <view>
            <text>{{ item.name }}</text>
            <text>{{ item.spec }} 脳{{ item.count }}</text>
          </view>
        </view>
      </view>
      <view class="goods-score">
        <text>{{ labels.goodsScore }}</text>
        <view class="mini-stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= goodsScore ? 'active' : ''" :data-score="star" @tap="setGoodsScore">{{ labels.star }}</button>
        </view>
      </view>
    </view>

    <view class="card detail-score-card">
      <text class="card-title">{{ labels.serviceTitle }}</text>
      <view class="detail-score-row">
        <text>{{ labels.delivery }}</text>
        <view class="mini-stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= deliveryScore ? 'active' : ''" :data-score="star" @tap="setDelivery">{{ labels.star }}</button>
        </view>
      </view>
      <view class="detail-score-row">
        <text>{{ labels.package }}</text>
        <view class="mini-stars">
          <button v-for="star in 5" :key="star" hover-class="none" :class="star <= packageScore ? 'active' : ''" :data-score="star" @tap="setPackage">{{ labels.star }}</button>
        </view>
      </view>
    </view>

    <view class="card comment-card">
      <view class="comment-title">
        <text>{{ labels.commentTitle }}</text>
        <text>{{ comment.length }}/120</text>
      </view>
      <textarea :value="comment" maxlength="120" :placeholder="labels.placeholder" placeholder-class="textarea-placeholder" @input="onCommentInput"></textarea>
      <view class="anonymous-row">
        <view>
          <text>{{ labels.anonymous }}</text>
          <text>{{ labels.anonymousDesc }}</text>
        </view>
        <switch class="mini-switch" :checked="anonymous" color="#ff6533" @change="toggleAnonymous" />
      </view>
    </view>

    <view class="review-bottom-space"></view>
  </scroll-view>

  <view class="review-actions">
    <button hover-class="none" class="submit-review" @tap="submitReview">{{ labels.submit }}</button>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import store from '../../utils/store.js'
import paymentCountdown from '../../utils/payment-countdown.js'
import orderBackend from '../../utils/order-backend.js'

const labels = {
  pageTitle: '评价订单',
  shopMark: '食',
  shopName: '食刻·品质厨房',
  heroDesc: '你的真实评价，会帮助我们把每一餐做得更好。',
  mealTitle: '本次用餐体验',
  overall: '总体评分',
  goodsTitle: '商品评价',
  goodsScore: '整单商品评分',
  serviceTitle: '服务细节',
  delivery: '配送速度',
  package: '包装完整',
  commentTitle: '写点感受',
  placeholder: '菜品口味、包装、送达速度都可以说说～',
  anonymous: '匿名评价',
  anonymousDesc: '隐藏昵称，仅展示评价内容',
  submit: '提交评价',
  star: '★'
}

const scoreCopy = {
  0: { hint: '未评分', slogan: '点亮星星，记录这一餐的体验', tags: [] },
  1: { hint: '很不满意', slogan: '很抱歉这次没让你满意，欢迎写下具体问题', tags: ['口味偏差', '分量不足', '包装问题', '送达偏慢'] },
  2: { hint: '不太满意', slogan: '这一餐还有改进空间，请告诉我们哪里需要优化', tags: ['口味一般', '包装普通', '送达较慢', '性价比一般'] },
  3: { hint: '还可以', slogan: '感谢你的反馈，下次我们争取做得更好', tags: ['口味还行', '分量正好', '包装完整', '送达准时'] },
  4: { hint: '满意', slogan: '看来这一餐还不错，你的好评是我们的动力', tags: ['味道不错', '分量足', '包装仔细', '送达准时', '性价比高'] },
  5: { hint: '超赞', slogan: '太棒了！感谢认可，希望每次都能稳稳满分', tags: ['味道不错', '分量足', '包装仔细', '送达准时', '性价比高', '还会再来'] }
}

const pageConfig = {
  data: {
    labels,
    statusHeight: 20,
    orderId: '',
    order: null,
    items: [],
    overallScore: 0,
    goodsScore: 0,
    deliveryScore: 0,
    packageScore: 0,
    selectedTags: [],
    comment: '',
    anonymous: true
  },
  async onLoad(options) {
    let order = null
    try {
      order = await orderBackend.getOrder(options.id)
    } catch (err) {
      console.error('load review order failed', err)
      order = paymentCountdown.getOrder(options.id)
    }
    if (!order || order.status !== 'done') {
      uni.showToast({ title: '当前订单暂不可评价', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 500)
      return
    }
    if (order.reviewed || order.review) {
      uni.showToast({ title: '该订单已评价', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 650)
      return
    }
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, orderId: order.id, order, items: order.items || [] })
  },
  back() { uni.navigateBack() },
  setOverall(e) {
    const score = Number(e.currentTarget.dataset.score)
    this.setData({ overallScore: score, selectedTags: scoreCopy[score].tags.slice(0, Math.min(2, scoreCopy[score].tags.length)) })
  },
  setGoodsScore(e) { this.setData({ goodsScore: Number(e.currentTarget.dataset.score) }) },
  setDelivery(e) { this.setData({ deliveryScore: Number(e.currentTarget.dataset.score) }) },
  setPackage(e) { this.setData({ packageScore: Number(e.currentTarget.dataset.score) }) },
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = this.selectedTags.includes(tag)
      ? this.selectedTags.filter(item => item !== tag)
      : [...this.selectedTags, tag]
    this.setData({ selectedTags })
  },
  onCommentInput(e) { this.setData({ comment: e.detail.value }) },
  toggleAnonymous(e) { this.setData({ anonymous: e.detail.value }) },
  async submitReview() {
    if (!this.overallScore) return uni.showToast({ title: '请先选择总体评分', icon: 'none' })
    if (!this.goodsScore) return uni.showToast({ title: '请为本单商品评分', icon: 'none' })
    const review = {
      overallScore: this.overallScore,
      goodsScore: this.goodsScore,
      deliveryScore: this.deliveryScore || this.overallScore,
      packageScore: this.packageScore || this.overallScore,
      tags: this.selectedTags,
      comment: this.comment.trim(),
      anonymous: this.anonymous,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
    }
    try {
      const order = await orderBackend.reviewOrder(this.orderId, review)
      const orders = store.get('sk_orders', []).map(item => item.id === this.orderId ? order : item)
      store.set('sk_orders', orders)
      uni.showToast({ title: '评价成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 650)
    } catch (err) {
      console.error('submit review failed', err)
      uni.showToast({ title: '评价提交失败，请重试', icon: 'none' })
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.review-page{background:#f5f5f7;padding-bottom:0}
.review-nav{position:relative;z-index:5;background:rgba(245,245,247,.96)}
.review-scroll{height:calc(100vh - 88rpx - env(safe-area-inset-top));padding:18rpx 24rpx 180rpx}
.review-hero{padding:24rpx;display:flex;align-items:center;gap:18rpx;margin-bottom:18rpx}
.shop-mark{width:72rpx;height:72rpx;border-radius:22rpx;background:#1c1c1e;color:#fff;font-size:34rpx;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hero-main{min-width:0}.hero-main text{display:block}.hero-main text:first-child{font-size:30rpx;font-weight:800;margin-bottom:8rpx}.hero-main text:last-child{color:#8e8e93;font-size:23rpx;line-height:1.45}
.score-card,.goods-card,.detail-score-card,.comment-card{padding:26rpx 24rpx;margin-bottom:18rpx}
.card-title{display:block;font-size:30rpx;font-weight:800;margin-bottom:22rpx}
.score-line{display:flex;align-items:center;gap:16rpx}.score-line>text:first-child,.detail-score-row>text,.goods-score>text{font-size:25rpx;font-weight:700;color:#222;flex-shrink:0}
.stars,.mini-stars{display:flex;align-items:center;gap:4rpx}.stars button,.mini-stars button{width:46rpx;height:46rpx;display:flex;align-items:center;justify-content:center;color:#d3d4da;font-size:38rpx;line-height:1;background:transparent!important;box-shadow:none!important}.mini-stars button{width:40rpx;height:40rpx;font-size:32rpx}.stars button.active,.mini-stars button.active{color:var(--orange)}
.score-text{margin-left:auto;color:var(--orange);font-size:24rpx;font-weight:700;white-space:nowrap}.score-slogan{display:block;margin:16rpx 0 0 122rpx;color:#8e8e93;font-size:22rpx;line-height:1.45}
.quick-tags{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:24rpx}.quick-tags button{height:52rpx;padding:0 24rpx;border-radius:999rpx;background:#f7f7f9!important;color:#666;font-size:23rpx}.quick-tags button.selected{background:var(--orange-soft)!important;color:var(--orange);font-weight:700}
.goods-list{display:flex;flex-direction:column;gap:14rpx;margin-bottom:20rpx}.goods-pill{display:flex;align-items:center;gap:14rpx;min-height:82rpx}.goods-pill image{width:76rpx;height:76rpx;border-radius:18rpx;flex-shrink:0}.goods-pill view{min-width:0}.goods-pill text{display:block}.goods-pill text:first-child{font-size:27rpx;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.goods-pill text:last-child{color:#999;font-size:21rpx;margin-top:5rpx}
.goods-score,.detail-score-row{display:flex;align-items:center;justify-content:space-between;min-height:56rpx;border-top:1rpx solid #f1f1f4;padding-top:16rpx}.detail-score-row:first-of-type{border-top:0;padding-top:0}.detail-score-row+.detail-score-row{margin-top:14rpx}
.comment-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:16rpx}.comment-title text:first-child{font-size:30rpx;font-weight:800}.comment-title text:last-child{color:#aaa;font-size:22rpx}.comment-card textarea{width:100%;height:180rpx;padding:22rpx;border-radius:24rpx;background:#f7f7f9;font-size:25rpx;line-height:1.55}.textarea-placeholder{color:#b3b3b8}
.anonymous-row{margin-top:18rpx;display:flex;align-items:center;justify-content:space-between}.anonymous-row view text{display:block}.anonymous-row view text:first-child{font-size:26rpx;font-weight:750}.anonymous-row view text:last-child{color:#999;font-size:21rpx;margin-top:6rpx}.mini-switch{transform:scale(.72);transform-origin:right center}
.review-bottom-space{height:40rpx}.review-actions{position:fixed;left:0;right:0;bottom:0;padding:18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(245,245,247,0),rgba(245,245,247,.96) 20%,rgba(245,245,247,.98));z-index:20}.submit-review{width:100%!important;height:88rpx;border-radius:999rpx;background:var(--orange)!important;color:#fff;font-size:30rpx;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 12rpx 28rpx var(--theme-shadow)}
uni-button.submit-review,uni-button.quick-tags button,uni-button.stars button,uni-button.mini-stars button{box-shadow:none!important}

/* 鍟嗗搧璇勪环鍙仛鏈崟鍟嗗搧姒傝锛氬乏鍥惧彸鏂囷紝閬垮厤鍍忓晢鍝佽鎯呴〉涓€鏍峰崰鐢ㄨ繃澶氱┖闂淬€?*/
.review-page .goods-card{
  padding:24rpx!important;
}
.review-page .goods-card .card-title{
  margin-bottom:18rpx!important;
}
.review-page .goods-list{
  display:flex!important;
  flex-direction:column!important;
  gap:12rpx!important;
  margin-bottom:18rpx!important;
}
.review-page .goods-pill{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  gap:14rpx!important;
  min-height:74rpx!important;
  height:74rpx!important;
  overflow:hidden!important;
}
.review-page .goods-pill image{
  width:64rpx!important;
  height:64rpx!important;
  min-width:64rpx!important;
  max-width:64rpx!important;
  min-height:64rpx!important;
  max-height:64rpx!important;
  flex:0 0 64rpx!important;
  border-radius:16rpx!important;
  display:block!important;
  object-fit:cover!important;
}
.review-page .goods-pill view{
  flex:1 1 auto!important;
  min-width:0!important;
}
.review-page .goods-pill text:first-child{
  font-size:26rpx!important;
  line-height:1.25!important;
}
.review-page .goods-pill text:last-child{
  font-size:20rpx!important;
  line-height:1.25!important;
  margin-top:4rpx!important;
}
.review-page .goods-score{
  margin-top:2rpx!important;
  padding-top:16rpx!important;
}
</style>

