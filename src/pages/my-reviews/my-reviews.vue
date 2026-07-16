<template>
<view :style="globalThemeStyle" class="page my-reviews-page">
  <view class="safe-nav reviews-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">我的评价</text>
      <view class="nav-back"></view>
    </view>
    <view class="review-tabs">
      <button hover-class="none" :class="active === 'pending' ? 'active' : ''" data-tab="pending" @tap="switchTab">待评价</button>
      <button hover-class="none" :class="active === 'reviewed' ? 'active' : ''" data-tab="reviewed" @tap="switchTab">已评价</button>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="reviews-scroll">
    <view v-if="active === 'pending'">
      <view
        v-for="item in pendingOrders"
        :key="item.id"
        class="review-record pending-record card"
        :data-id="item.id"
        @tap="goReview"
      >
        <view class="record-head">
          <view class="shop-logo">食</view>
          <view class="record-title">
            <text>{{ item.shopName || '食刻·品质厨房' }}</text>
            <text>{{ item.completedAt ? formatTime(item.completedAt) : item.createdAt }}</text>
          </view>
          <view class="pending-badge">待评价</view>
        </view>
        <view class="record-goods">
          <image v-if="mainFood(item).icon" :src="mainFood(item).icon" mode="aspectFill" />
          <view>
            <text>{{ orderSummary(item) }}</text>
            <text>{{ item.items && item.items.length > 1 ? '共 ' + item.items.length + ' 件商品' : mainFood(item).spec || '标准价' }}</text>
          </view>
        </view>
        <view class="record-footer pending-footer">
          <text>点击订单去评价</text>
          <text>›</text>
        </view>
      </view>

      <view v-if="!pendingOrders.length && !loading" class="empty">
        <view class="empty-icon"><image src="/static/assets/icons/star.svg" mode="aspectFit" /></view>
        <view class="empty-title">暂无待评价订单</view>
        <view class="empty-desc">完成订单后，可以在这里快速评价</view>
      </view>
    </view>

    <view v-else>
      <view v-for="item in reviews" :key="item.id" class="review-record card" :data-id="item.id">
        <view class="record-head">
          <view class="shop-logo">食</view>
          <view class="record-title">
            <text>{{ item.shopName || '食刻·品质厨房' }}</text>
            <text>{{ item.review && item.review.createdAt ? item.review.createdAt : item.createdAt }}</text>
          </view>
          <view class="record-stars">{{ stars(item.review && item.review.overallScore) }}</view>
        </view>
        <view class="record-goods">
          <image v-if="mainFood(item).icon" :src="mainFood(item).icon" mode="aspectFill" />
          <view>
            <text>{{ orderSummary(item) }}</text>
            <text>{{ item.items && item.items.length > 1 ? '共 ' + item.items.length + ' 件商品' : mainFood(item).spec || '标准价' }}</text>
          </view>
        </view>
        <view v-if="item.review && item.review.tags && item.review.tags.length" class="tag-row">
          <text v-for="tag in item.review.tags" :key="tag">{{ tag }}</text>
        </view>
        <text class="comment-preview">{{ (item.review && item.review.comment) || '用户没有填写文字评价' }}</text>
        <view class="record-footer reviewed-footer">
          <button hover-class="none" class="review-more-action" :data-id="item.id" @tap.stop="toggleReviewActions">
            <view class="review-more-dots"><text></text><text></text><text></text></view>
          </button>
          <button hover-class="none" class="review-detail-action" :data-id="item.id" @tap.stop="openReview">查看评价内容</button>
        </view>
      </view>

      <view v-if="!reviews.length && !loading" class="empty">
        <view class="empty-icon"><image src="/static/assets/icons/star.svg" mode="aspectFit" /></view>
        <view class="empty-title">还没有评价记录</view>
        <view class="empty-desc">评价完成后，会在这里统一查看</view>
      </view>
    </view>

    <view class="reviews-bottom-space"></view>
  </scroll-view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import auth from '../../utils/auth.js'
import orderBackend from '../../utils/order-backend.js'

function hasOrderReview(order) {
  return Boolean(order && order.reviewed === true)
}

const pageConfig = {
  data: {
    statusHeight: 20,
    active: 'pending',
    pendingOrders: [],
    reviews: [],
    actionMenuId: '',
    loading: false
  },
  onLoad() {
    if (!auth.guardPage('/pages/my-reviews/my-reviews')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  onShow() {
    this.renderCached()
    this.refresh()
  },
  renderCached() {
    const pendingOrders = orderBackend.getCachedPendingReviews()
    const reviews = orderBackend.getCachedReviews()
    this.setData({ pendingOrders, reviews })
  },
  async refresh() {
    this.setData({ loading: true })
    const [pendingResult, reviewsResult] = await Promise.allSettled([
      orderBackend.fetchPendingReviews(),
      orderBackend.fetchReviews()
    ])

    if (pendingResult.status === 'fulfilled') this.setData({ pendingOrders: pendingResult.value })
    else console.error('fetch pending review orders failed', pendingResult.reason)

    if (reviewsResult.status === 'fulfilled') this.setData({ reviews: reviewsResult.value })
    else console.error('fetch reviews failed', reviewsResult.reason)

    this.setData({ loading: false })
  },
  buildPending() {
    const pendingOrders = (this.pendingOrders || [])
      .filter(item => item.status === 'done' && !hasOrderReview(item))
      .sort((a, b) => Number(b.completedAt || b.updatedAt || 0) - Number(a.completedAt || a.updatedAt || 0))
    this.setData({ pendingOrders })
  },
  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.tab, actionMenuId: '' })
  },
  back() {
    uni.navigateBack({ fail: () => uni.navigateTo({ url: '/pages/profile/profile' }) })
  },
  mainFood(order) {
    return (order.items && order.items[0]) || {}
  },
  orderSummary(order) {
    const food = this.mainFood(order)
    if (!food.name) return '订单商品'
    return order.items && order.items.length > 1 ? `${food.name} 等${order.items.length}件` : food.name
  },
  formatTime(value) {
    if (!value) return ''
    if (typeof value === 'string') return value
    const date = new Date(Number(value))
    if (Number.isNaN(date.getTime())) return ''
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },
  stars(score) {
    const count = Math.max(0, Math.min(5, Number(score) || 0))
    return '★★★★★'.slice(0, count) + '☆☆☆☆☆'.slice(0, 5 - count)
  },
  goReview(e) {
    uni.navigateTo({ url: `/pages/review/review?id=${e.currentTarget.dataset.id}` })
  },
  openReview(e) {
    const item = this.reviews.find(row => row.id === e.currentTarget.dataset.id)
    if (!item || !item.review) return
    const review = item.review
    const lines = [
      `总体评分：${review.overallScore || 0} 星`,
      `商品评分：${review.goodsScore || 0} 星`,
      `配送速度：${review.deliveryScore || 0} 星`,
      `包装完整：${review.packageScore || 0} 星`
    ]
    if (review.tags && review.tags.length) lines.push(`评价标签：${review.tags.join('、')}`)
    lines.push(`评价内容：${review.comment || '用户没有填写文字评价'}`)
    uni.showModal({
      title: '评价详情',
      content: lines.join('\n'),
      showCancel: false,
      confirmText: '知道了'
    })
  },
  toggleReviewActions(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ actionMenuId: '' })
    uni.showActionSheet({
      itemList: ['\u5220\u9664\u8ba2\u5355'],
      itemColor: '#1c1c1e',
      success: res => {
        if (res.tapIndex === 0) this.deleteReview(id)
      }
    })
  },
  async deleteReview(id) {
    if (!id) return
    uni.showModal({
      title: '删除评价记录',
      content: '这只会从“我的评价”列表中移除，商品详情页中的用户评价仍会保留。如需删除商品详情页评价，请进入对应商品详情页删除。',
      confirmText: '删除',
      confirmColor: '#ef5b3d',
      success: async res => {
        if (!res.confirm) return
        try {
          await orderBackend.deleteReview(id)
          this.setData({
            reviews: this.reviews.filter(item => item.id !== id),
            actionMenuId: ''
          })
          uni.showToast({ title: '\u5df2\u5220\u9664', icon: 'none' })
        } catch (err) {
          console.error('delete review failed', err)
          uni.showToast({ title: '\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5', icon: 'none' })
        }
      }
    })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.my-reviews-page{height:100vh;min-height:0;overflow:hidden;background:#f5f5f7;display:flex;flex-direction:column}
.reviews-nav{flex-shrink:0;background:#f5f5f7;position:relative;z-index:5}
.review-tabs{height:82rpx;padding:0 44rpx;display:flex;align-items:center;justify-content:center;gap:54rpx}
.review-tabs button{height:72rpx;min-width:160rpx;display:flex;align-items:center;justify-content:center;position:relative;color:#888;font-size:27rpx;font-weight:650;background:transparent!important;border:0!important}
.review-tabs button.active{color:#1c1c1e;font-weight:800}
.review-tabs button.active::after{content:"";position:absolute;left:50%;bottom:4rpx;width:42rpx;height:7rpx;border-radius:999rpx;background:var(--orange);transform:translateX(-50%)}
.reviews-scroll{flex:1;height:0;min-height:0;padding:20rpx 24rpx 0;box-sizing:border-box}
.review-record{padding:24rpx;margin-bottom:18rpx;text-align:left;background:#fff!important;border-radius:30rpx;box-shadow:0 10rpx 28rpx rgba(28,28,32,.045)}
.record-head{display:flex;align-items:center;gap:14rpx}
.shop-logo{width:52rpx;height:52rpx;border-radius:17rpx;background:#1c1c1e;color:#fff;font-size:27rpx;font-weight:800;display:flex;align-items:center;justify-content:center;flex:0 0 52rpx}
.record-title{flex:1;min-width:0}
.record-title text{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.record-title text:first-child{font-size:28rpx;font-weight:800;color:#1c1c1e}
.record-title text:last-child{margin-top:5rpx;font-size:20rpx;color:#aaa}
.record-stars{color:var(--orange);font-size:22rpx;letter-spacing:1rpx;white-space:nowrap}
.pending-badge{height:42rpx;padding:0 18rpx;border-radius:999rpx;background:var(--orange-soft);color:var(--orange);font-size:20rpx;font-weight:750;display:flex;align-items:center}
.record-goods{display:flex;align-items:center;margin-top:20rpx;gap:16rpx}
.record-goods image{width:82rpx;height:82rpx;border-radius:20rpx;flex:0 0 82rpx;background:#f3f3f5}
.record-goods view{flex:1;min-width:0}
.record-goods text{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.record-goods text:first-child{font-size:26rpx;font-weight:750;color:#222}
.record-goods text:last-child{margin-top:7rpx;color:#999;font-size:21rpx}
.tag-row{display:flex;flex-wrap:wrap;gap:10rpx;margin-top:18rpx}
.tag-row text{height:42rpx;padding:0 18rpx;border-radius:999rpx;background:var(--orange-soft);color:var(--orange);font-size:20rpx;display:flex;align-items:center}
.comment-preview{display:block;margin-top:16rpx;color:#666;font-size:23rpx;line-height:1.55;word-break:break-all}
.record-footer{margin-top:18rpx;padding-top:16rpx;border-top:1rpx solid #f1f1f4;display:flex;align-items:center;justify-content:flex-end;color:var(--orange);font-size:22rpx;font-weight:700}
.record-footer text:last-child{font-size:32rpx;margin-left:4rpx;line-height:1}
.pending-footer{justify-content:space-between;color:#777}
.pending-footer text:last-child{color:var(--orange)}
.reviewed-footer{position:relative;min-height:62rpx;display:grid;grid-template-columns:64rpx 1fr 178rpx;gap:0;align-items:center}
.review-more-action{grid-column:1;width:64rpx!important;height:58rpx!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;display:flex;align-items:center;justify-content:center}
.review-more-dots{width:36rpx;display:flex;align-items:center;justify-content:space-between}
.review-more-dots text{width:7rpx;height:7rpx;min-width:7rpx;border-radius:50%;background:#777;display:block;flex:0 0 7rpx}
.review-detail-action{grid-column:3;width:178rpx!important;height:58rpx!important;border-radius:999rpx!important;border:2rpx solid var(--orange)!important;background:#fff!important;color:var(--orange)!important;font-size:21rpx!important;font-weight:700!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;white-space:nowrap!important}
.reviews-bottom-space{height:calc(48rpx + env(safe-area-inset-bottom))}
</style>
