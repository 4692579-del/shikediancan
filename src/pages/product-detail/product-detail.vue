<template>
<view :style="globalThemeStyle" v-if="food" :class="`page product-page ${elderMode ? 'elder-mode' : ''}`">
  <view class="product-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">商品详情</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :show-scrollbar="false" class="product-scroll">
    <view class="product-hero" :style="`background:${food.bg}`">
      <image :src="food.icon" mode="aspectFill" />
      <text>{{food.tag}}</text>
    </view>

    <view class="product-main">
      <view class="product-summary card">
        <text class="product-name">{{food.name}}</text>
        <text class="product-desc">{{food.desc}}</text>
        <view class="product-meta">
          <view><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{food.rating}} 分</text></view>
          <text>月售 {{food.sales}}</text>
          <text>约30分钟送达</text>
        </view>
        <view class="product-price"><text>¥</text>{{displayPrice}}<text class="old-price">¥{{food.oldPrice}}</text></view>
      </view>

      <view class="detail-card card">
        <text class="detail-title">商品介绍</text>
        <text class="intro">{{detail.intro}}</text>
        <view class="detail-facts"><view><text>分量</text><text>{{detail.serving}}</text></view><view><text>参考热量</text><text>{{detail.energy}}</text></view></view>
      </view>

      <view class="detail-card card">
        <text class="detail-title">主要食材</text>
        <view class="chip-row"><text v-for="(item, index) in detail.ingredients" :key="item">{{item}}</text></view>
        <text class="detail-subtitle">口味特点</text>
        <view class="chip-row taste"><text v-for="(item, index) in detail.taste" :key="item">{{item}}</text></view>
      </view>

      <button hover-class="none" class="detail-card card spec-entry" @tap="openSpecSheet"><text class="detail-title">选择规格</text><view><text>{{selectedSpec}}</text><text>›</text></view></button>

      <button hover-class="none" class="detail-card card review-entry" @tap="openReviewSheet">
        <view>
          <text class="detail-title">用户评价</text>
          <text>{{productReviews.length ? productReviews.length + '条真实评价' : '暂无评价'}}</text>
        </view>
        <text>›</text>
      </button>

      <view class="service-note"><text>食刻专送</text><text>品质保障</text><text>食材新鲜</text></view>
      <view class="product-safe"></view>
    </view>
  </scroll-view>

  <view class="product-actions">
    <button hover-class="none" class="cart-entry" @tap="goCart"><image src="/static/assets/icons/cart.svg" mode="aspectFit" /><text v-if="cartCount">{{cartCount}}</text><view>购物车</view></button>
    <button hover-class="none" :class="`favorite-entry ${favorite ? 'on' : ''}`" @tap="toggleFavorite"><image :src="favorite ? '/static/assets/icons/star-filled.svg' : '/static/assets/icons/star.svg'" mode="aspectFit" /><view>{{favorite ? '已收藏' : '收藏'}}</view></button>
    <button hover-class="none" class="add-cart" @tap="addCart">{{showSpecSheet ? '确认加入购物车' : '加入购物车'}}</button>
  </view>

  <view v-if="showSpecSheet" class="spec-mask" @tap="closeSpecSheet">
    <view class="spec-dialog" @tap.stop="noop">
      <view class="sheet-handle"></view>
      <view class="sheet-product">
        <view class="sheet-visual" :style="`background:${food.bg}`"><image :src="food.icon" mode="aspectFill" /></view>
        <view class="sheet-copy"><text>{{food.name}}</text><view><text>¥</text>{{displayPrice}}</view></view>
      </view>
      <text class="sheet-title">选择规格</text>
      <view class="detail-specs">
        <button v-for="(item, index) in specs" :key="item.name" hover-class="none" :class="selectedSpec === item.name ? 'on' : ''" :data-name="item.name" @tap="selectSpec">
          <text>{{item.name}}</text><text v-if="item.extra">+¥{{item.extra}}</text><text v-else>原价</text>
        </button>
      </view>
      <view class="sheet-quantity-row">
        <view><text>购买数量</text><text>最少购买1份</text></view>
        <view :class="`sheet-stepper ${count === 1 ? 'single' : ''}`">
          <button v-if="count > 1" hover-class="none" class="minus" @tap="decrease">−</button>
          <input class="count-input" type="number" :value="count" @blur="setCount" />
          <button hover-class="none" class="plus" @tap="increase">+</button>
        </view>
      </view>
    </view>
  </view>

  <view v-if="showReviewSheet" class="review-mask" @tap="closeReviewSheet">
    <view class="review-sheet" @tap.stop="noop">
      <view class="review-sheet-nav">
        <button hover-class="none" class="review-back" @tap="closeReviewSheet"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      </view>
      <view class="review-sheet-head">
        <view>
          <text>用户评价</text>
          <text>{{productReviews.length ? productReviews.length + '条真实评价' : '暂无评价'}}</text>
        </view>
      </view>
      <view class="review-search">
        <image src="/static/assets/icons/search.svg" mode="aspectFit" />
        <input :value="reviewKeyword" placeholder="搜索评价内容" confirm-type="search" @input="onReviewSearch" />
      </view>
      <view class="review-controls">
        <view class="review-dropdown-wrap">
          <button hover-class="none" class="review-dropdown-btn" @tap="toggleReviewDropdown">
            <text>{{reviewStarText}}</text><text :class="`review-arrow ${reviewDropdownOpen ? 'up' : ''}`"></text>
          </button>
          <view v-if="reviewDropdownOpen" class="review-dropdown-menu">
            <button v-for="item in reviewStarOptions" :key="item.value" hover-class="none" :class="reviewStar === item.value ? 'active' : ''" :data-star="item.value" @tap="selectReviewStar">{{item.label}}</button>
          </view>
        </view>
        <view class="review-sort-texts">
          <text v-for="item in reviewSortOptions" :key="item.value" :class="reviewSort === item.value ? 'on' : ''" :data-sort="item.value" @tap="selectReviewSort">{{item.label}}</text>
        </view>
      </view>
      <scroll-view scroll-y :show-scrollbar="false" class="review-sheet-scroll">
        <view v-if="reviewsLoading" class="review-empty">评价加载中...</view>
        <view v-else-if="!filteredReviews.length" class="review-empty">暂无符合条件的评价</view>
        <view v-else class="review-list">
          <view v-for="item in filteredReviews" :key="item.id" class="review-item">
            <view class="review-head">
              <image v-if="item.avatar" class="review-avatar" :src="item.avatar" mode="aspectFill" />
              <view v-else class="review-avatar placeholder">食</view>
              <view class="review-name">
                <view>
                  <text>{{item.displayName}}</text>
                  <text v-if="item.isMine" class="mine-badge">我的</text>
                  <text v-if="item.anonymous && item.isMine" class="anonymous-badge">匿名发布</text>
                </view>
                <text>{{reviewTime(item)}} · {{item.itemSummary}}</text>
              </view>
              <text class="review-stars">{{reviewStars(item.score)}}</text>
            </view>
            <text v-if="item.comment" class="review-copy">{{item.comment}}</text>
            <view v-if="item.tags && item.tags.length" class="review-tags">
              <text v-for="tag in item.tags" :key="tag">{{tag}}</text>
            </view>
            <view v-if="item.canDelete" class="review-more-row">
              <button hover-class="none" class="review-more-btn" :data-order-id="item.orderId" :data-food-id="item.foodId" @tap="openProductReviewActions">
                <text></text><text></text><text></text>
              </button>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 商品详情页：展示商品信息，处理规格、数量、收藏和加入购物车。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import orderBackend from '../../utils/order-backend.js'
import favoriteBackend from '../../utils/favorite-backend.js'
import productBackend from '../../utils/product-backend.js'
import elderMode from '../../utils/elder-mode.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    food: null,
    detail: null,
    favorite: false,
    selectedSpec: '标准价',
    specs: [
      { name: '标准价', extra: 0 },
      { name: '加大份', extra: 5 },
      { name: '双倍主菜', extra: 9 }
    ],
    count: 1,
    displayPrice: '0.0',
    cartCount: 0,
    elderMode: false,
    showSpecSheet: false,
    productReviews: [],
    filteredReviews: [],
    reviewsLoading: false,
    showReviewSheet: false,
    reviewDropdownOpen: false,
    reviewKeyword: '',
    reviewStar: 'all',
    reviewStarText: '全部评价',
    reviewSort: 'new',
    reviewStarOptions: [
      { label: '5星', value: '5' },
      { label: '4星', value: '4' },
      { label: '3星', value: '3' },
      { label: '2星', value: '2' },
      { label: '1星', value: '1' }
    ],
    reviewSortOptions: [
      { label: '最新', value: 'new' },
      { label: '最早', value: 'old' }
    ]
  },
  // 根据商品 id 读取详情数据，找不到商品时返回上一页。
  async onLoad(options) {
    let food = productBackend.getFoodById(options.id)
    if (!food) {
      try {
        await productBackend.syncProducts()
        food = productBackend.getFoodById(options.id)
      } catch (err) {
        console.error('sync products failed', err)
      }
    }
    if (!food) {
      uni.showToast({ title: '商品不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 500)
      return
    }
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      food,
      detail: productBackend.getDetailById(food.id) || {},
      displayPrice: food.price.toFixed(1),
      showSpecSheet: options.openSpec === '1'
    })
    this.loadProductReviews(food.id)
    productBackend.fetchProductDetail(food.id).then(latest => {
      if (!latest) return
      this.setData({
        food: latest,
        detail: productBackend.getDetailById(latest.id) || {},
        displayPrice: (latest.price + (this.specs.find(item => item.name === this.selectedSpec)?.extra || 0)).toFixed(1)
      })
      this.loadProductReviews(latest.id)
    }).catch(err => console.error('load product detail failed', err))
  },
  onShow() {
    if (!this.food) return
    this.setData({ elderMode: elderMode.isEnabled() })
    this.syncPageState()
    this.loadProductReviews(this.food.id)
    if (store.isLogin()) {
      favoriteBackend.fetchFavorites()
        .then(() => this.syncPageState())
        .catch(err => console.error('fetch favorites failed', err))
    }
  },
  async loadProductReviews(foodId = this.food && this.food.id) {
    if (!foodId) return
    this.setData({ reviewsLoading: true })
    try {
      const reviews = await orderBackend.fetchProductReviews(foodId)
      this.setData({
        productReviews: Array.isArray(reviews) ? reviews : [],
        reviewsLoading: false
      })
      this.applyReviewFilters()
    } catch (err) {
      console.error('load product reviews failed', err)
      this.setData({
        productReviews: [],
        filteredReviews: [],
        reviewsLoading: false
      })
    }
  },
  onReviewSearch(e) {
    this.setData({ reviewKeyword: e.detail.value || '' })
    this.applyReviewFilters()
  },
  openReviewSheet() {
    this.setData({ showReviewSheet: true, reviewDropdownOpen: false })
    this.applyReviewFilters()
  },
  closeReviewSheet() {
    this.setData({ showReviewSheet: false, reviewDropdownOpen: false })
  },
  toggleReviewDropdown() {
    this.setData({ reviewDropdownOpen: !this.reviewDropdownOpen })
  },
  selectReviewStar(e) {
    const value = String(e.currentTarget.dataset.star || 'all')
    const option = this.reviewStarOptions.find(item => item.value === value)
    this.setData({
      reviewStar: value,
      reviewStarText: option ? option.label : '全部评价',
      reviewDropdownOpen: false
    })
    this.applyReviewFilters()
  },
  selectReviewSort(e) {
    this.setData({ reviewSort: String(e.currentTarget.dataset.sort || 'new') })
    this.applyReviewFilters()
  },
  applyReviewFilters() {
    const keyword = String(this.reviewKeyword || '').trim().toLowerCase()
    let list = Array.isArray(this.productReviews) ? [...this.productReviews] : []
    if (this.reviewStar !== 'all') {
      list = list.filter(item => Number(item.score || 0) === Number(this.reviewStar))
    }
    if (keyword) {
      list = list.filter(item => {
        const haystack = [
          item.displayName,
          item.itemSummary,
          item.comment,
          ...(Array.isArray(item.tags) ? item.tags : [])
        ].join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }
    list.sort((a, b) => {
      const left = Number(a.createdAtTimestamp || 0)
      const right = Number(b.createdAtTimestamp || 0)
      return this.reviewSort === 'old' ? left - right : right - left
    })
    this.setData({ filteredReviews: list })
  },
  reviewStars(score) {
    const count = Math.max(0, Math.min(5, Math.round(Number(score) || 0)))
    return `${'★'.repeat(count)}${'☆'.repeat(5 - count)}`
  },
  reviewTime(item = {}) {
    const ts = Number(item.createdAtTimestamp || 0)
    if (ts) {
      const date = new Date(ts)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return String(item.createdAt || '').split(' ')[0] || '刚刚'
  },
  openProductReviewActions(e) {
    const orderId = e.currentTarget.dataset.orderId
    const foodId = e.currentTarget.dataset.foodId
    if (!orderId || !foodId) return
    if (!auth.requireLogin(`/pages/product-detail/product-detail?id=${this.food.id}`)) return
    uni.showActionSheet({
      itemList: ['删除此商品评价'],
      itemColor: '#ef5b3d',
      success: res => {
        if (res.tapIndex === 0) this.deleteProductReviewByIds(orderId, foodId)
      }
    })
  },
  async deleteProductReviewByIds(orderId, foodId) {
    uni.showModal({
      title: '删除商品评价',
      content: '删除后该评价将不再显示在此商品详情页，无法恢复，也不能重新评价；我的评价列表与原订单不受影响。',
      confirmText: '删除',
      confirmColor: '#ef5b3d',
      success: async res => {
        if (!res.confirm) return
        try {
          await orderBackend.deleteProductReview(orderId, foodId)
          const nextReviews = this.productReviews.filter(item => !(String(item.orderId) === String(orderId) && String(item.foodId) === String(foodId)))
          this.setData({ productReviews: nextReviews })
          this.applyReviewFilters()
          uni.showToast({ title: '已删除', icon: 'none' })
        } catch (err) {
          console.error('delete product review failed', err)
          uni.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    })
  },
  syncPageState() {
    this.setData({
      favorite: favoriteBackend.getCachedIds().includes(this.food.id),
      cartCount: store.isLogin() ? store.cartSummary().count : 0
    })
  },
  back() { uni.navigateBack() },
  selectSpec(e) {
    const selectedSpec = e.currentTarget.dataset.name
    const spec = this.specs.find(item => item.name === selectedSpec)
    this.setData({
      selectedSpec,
      displayPrice: (this.food.price + spec.extra).toFixed(1)
    })
  },
  decrease() {
    if (this.count <= 1) return
    this.setData({ count: this.count - 1 })
  },
  increase() { this.setData({ count: this.count + 1 }) },
  setCount(e) {
    const value = String(e.detail.value || '').trim()
    if (!value) {
      this.setData({ count: 1 })
      return
    }
    const count = Math.floor(Number(value))
    if (!Number.isFinite(count) || count < 1) {
      uni.showToast({ title: '商品数量不能小于1', icon: 'none' })
      this.setData({ count: 1 })
      return
    }
    this.setData({ count })
  },
  openSpecSheet() { this.setData({ showSpecSheet: true }) },
  closeSpecSheet() { this.setData({ showSpecSheet: false }) },
  noop() {},
  // 收藏状态改由 uniCloud 后端保存，前端只保留一份缓存用于即时刷新星标。
  async toggleFavorite() {
    const id = this.food.id
    if (!auth.requireLogin(`/pages/product-detail/product-detail?id=${id}`)) return
    const oldFavorite = this.favorite
    this.setData({ favorite: !oldFavorite })
    try {
      const result = await favoriteBackend.toggleFavorite(this.food)
      this.setData({ favorite: result.favorite })
      uni.showToast({ title: result.favorite ? '已收藏' : '已取消收藏', icon: 'none' })
    } catch (err) {
      console.error('toggle favorite failed', err)
      this.setData({ favorite: oldFavorite })
      uni.showToast({ title: '收藏失败，请重试', icon: 'none' })
    }
  },
  // 首次点击先展开规格面板，面板已打开时才确认加入购物车。
  addCart() {
    const food = this.food
    if (!this.showSpecSheet) {
      this.openSpecSheet()
      return
    }
    if (!auth.requireLogin(`/pages/product-detail/product-detail?id=${food.id}&openSpec=1`)) return
    const spec = this.specs.find(item => item.name === this.selectedSpec)
    store.addCart({ ...food, price: food.price + spec.extra }, this.count, `${spec.name}${spec.extra ? ` +¥${spec.extra}` : ''}`)
    orderBackend.saveCart(store.getCart()).catch(err => console.error('sync cart failed', err))
    this.setData({ cartCount: store.cartSummary().count, showSpecSheet: false, count: 1 })
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  },
  goCart() {
    if (auth.requireLogin('/pages/cart/cart')) uni.navigateTo({ url: '/pages/cart/cart' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.product-page{height:100vh;min-height:0;padding-bottom:0;overflow:hidden;display:flex;flex-direction:column;background:#f5f5f7}
.product-nav{position:relative;z-index:20;flex-shrink:0;background:rgba(245,245,247,.96)}
.product-scroll{flex:1;min-height:0;height:0}
.product-hero{height:430rpx;position:relative;display:flex;align-items:center;justify-content:center}
.product-hero image{width:210rpx;height:210rpx}
.product-hero>text{position:absolute;left:30rpx;top:28rpx;padding:9rpx 16rpx;border-radius:999rpx;background:rgba(255,255,255,.88);color:#a94b2d;font-size:21rpx;font-weight:650}
.product-main{position:relative;margin-top:-30rpx;padding:0 24rpx}
.product-summary{padding:28rpx;margin-bottom:18rpx}
.product-name{display:block;font-size:38rpx;font-weight:800;line-height:1.25}
.product-desc{display:block;margin-top:10rpx;color:#777;font-size:22rpx;line-height:1.55}
.product-meta{display:flex;align-items:center;gap:20rpx;margin-top:18rpx;color:#999;font-size:20rpx}
.product-meta view{display:flex;align-items:center;color:#e98a20}.product-meta image{width:22rpx;height:22rpx;margin-right:5rpx}
.product-price{margin-top:20rpx;color:var(--orange);font-size:42rpx;font-weight:850}.product-price>text:first-child{font-size:24rpx;margin-right:3rpx}
.product-price .old-price{font-size:20rpx;font-weight:400}
.detail-card{padding:27rpx;margin-bottom:18rpx}
.detail-title{font-size:29rpx;font-weight:750}
.intro{display:block;margin-top:16rpx;color:#666;font-size:23rpx;line-height:1.75}
.detail-facts{display:grid;grid-template-columns:1fr 1fr;margin-top:22rpx;padding-top:20rpx;border-top:1rpx solid #eee}
.detail-facts view{display:flex;flex-direction:column;gap:7rpx}.detail-facts view+view{padding-left:25rpx;border-left:1rpx solid #eee}
.detail-facts text:first-child{font-size:20rpx;color:#999}.detail-facts text:last-child{font-size:23rpx;font-weight:650}
.detail-subtitle{display:block;margin-top:25rpx;font-size:24rpx;font-weight:700}
.chip-row{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:17rpx}.chip-row text{padding:10rpx 17rpx;border-radius:999rpx;background:#f4f4f6;color:#555;font-size:20rpx}.chip-row.taste text{background:var(--orange-soft);color:var(--orange)}
.detail-heading{display:flex;align-items:center;justify-content:space-between}.detail-heading>text:last-child{color:#999;font-size:20rpx}
.spec-entry{width:100%!important;max-width:none!important;display:flex;align-items:center;justify-content:space-between;text-align:left}
.spec-entry>view{display:flex;align-items:center;gap:14rpx;color:#999;font-size:21rpx}.spec-entry>view text:last-child{font-size:34rpx;line-height:1}
.review-entry{width:100%!important;max-width:none!important;display:flex;align-items:center;justify-content:space-between;text-align:left}
.review-entry>view{display:flex;flex-direction:column;gap:8rpx}
.review-entry>view>text:last-child{color:#999;font-size:21rpx;font-weight:400}
.review-entry>text{color:#bbb;font-size:36rpx;line-height:1}
.detail-specs{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10rpx;margin-top:20rpx}
.detail-specs button{width:100%!important;min-width:0!important;max-width:none!important;height:82rpx;padding:0 4rpx!important;overflow:hidden;border:2rpx solid transparent;border-radius:999rpx;background:#f4f4f6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx}
.detail-specs button text{display:block;width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail-specs button text:first-child{font-size:20rpx;font-weight:650}.detail-specs button text:last-child{font-size:16rpx;color:#999}
.detail-specs button.on{border-color:var(--theme-border);background:var(--orange-soft);color:var(--orange)}.detail-specs button.on text:last-child{color:var(--theme-border)}
.review-mask{position:fixed;z-index:120;inset:0;background:rgba(18,18,20,.35);display:flex;align-items:flex-end}
.review-sheet{width:100%;height:80vh;box-sizing:border-box;padding:18rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));border-radius:42rpx 42rpx 0 0;background:#fff;box-shadow:0 -16rpx 50rpx rgba(20,20,24,.18);animation:review-rise .23s ease-out;display:flex;flex-direction:column}
@keyframes review-rise{from{transform:translateY(100%);opacity:.65}to{transform:translateY(0);opacity:1}}
.review-sheet-nav{height:62rpx;display:flex;align-items:center;justify-content:flex-start}
.review-back{width:58rpx!important;height:58rpx;margin-left:-8rpx;padding:0!important;border:0!important;background:transparent!important;display:flex;align-items:center;justify-content:flex-start}
.review-back image{width:30rpx;height:30rpx}
.review-sheet-head{display:flex;align-items:center;justify-content:space-between;margin:4rpx 0 20rpx}
.review-sheet-head>view{display:flex;align-items:flex-end;gap:14rpx}
.review-sheet-head text:first-child{font-size:32rpx;font-weight:800;color:#111}
.review-sheet-head text:last-child{padding-bottom:3rpx;color:#999;font-size:20rpx}
.review-search{height:66rpx;padding:0 22rpx;border-radius:999rpx;background:#f7f7f9;display:flex;align-items:center;gap:10rpx}
.review-search image{width:24rpx;height:24rpx;opacity:.55}
.review-search input{flex:1;height:66rpx;color:#333;font-size:22rpx}
.review-controls{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;margin-top:18rpx;padding-bottom:8rpx}
.review-dropdown-wrap{position:relative}
.review-dropdown-btn{height:52rpx;padding:0 16rpx!important;border:0!important;border-radius:16rpx;background:#fff!important;color:#111;font-size:24rpx;font-weight:750;display:flex;align-items:center;gap:10rpx;line-height:52rpx}
.review-arrow{display:block;width:0;height:0;margin-top:3rpx;border-left:7rpx solid transparent;border-right:7rpx solid transparent;border-top:9rpx solid #aaa;transition:transform .18s ease}
.review-arrow.up{transform:rotate(180deg)}
.review-dropdown-menu{position:absolute;left:0;top:60rpx;width:170rpx;padding:10rpx;border-radius:18rpx;background:#fff;box-shadow:0 16rpx 44rpx rgba(22,22,28,.14)}
.review-dropdown-menu button{width:100%!important;height:56rpx;padding:0 18rpx!important;border:0!important;border-radius:14rpx;background:#fff!important;color:#555;font-size:22rpx;text-align:left;display:flex;align-items:center}
.review-dropdown-menu button.active{background:var(--orange-soft)!important;color:var(--orange);font-weight:750}
.review-sort-texts{display:flex;align-items:center;gap:34rpx;padding-right:4rpx;color:#aaa;font-size:22rpx}
.review-sort-texts text.on{color:var(--orange);font-weight:750}
.review-sheet-scroll{flex:1;min-height:0;margin-top:2rpx}
.review-entry::after,
.review-back::after,
.review-dropdown-btn::after,
.review-dropdown-menu button::after{border:0!important;background:transparent!important}
.review-empty{padding:34rpx 0;text-align:center;color:#aaa;font-size:22rpx}
.review-list{padding-bottom:24rpx}
.review-item{padding:24rpx 0;border-top:1rpx solid #f1f1f4}
.review-item:first-child{border-top:0}
.review-head{display:flex;align-items:center;gap:14rpx}
.review-avatar{width:58rpx;height:58rpx;flex:0 0 58rpx;border-radius:50%;background:#1c1c1e;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24rpx;font-weight:800}
.review-avatar.placeholder{background:#1c1c1e;color:#fff}
.review-name{flex:1;min-width:0}
.review-name>view{display:flex;align-items:center;gap:8rpx;min-width:0}
.review-name>view>text:first-child{max-width:170rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#222;font-size:23rpx;font-weight:700}
.review-name>text{display:block;margin-top:5rpx;color:#999;font-size:19rpx}
.mine-badge,.anonymous-badge{padding:4rpx 9rpx;border-radius:999rpx;background:var(--orange-soft);color:var(--orange);font-size:16rpx}
.anonymous-badge{background:#f4f4f6;color:#777}
.review-stars{white-space:nowrap;color:#ef6a43;font-size:22rpx;letter-spacing:1rpx}
.review-copy{display:block;margin-top:14rpx;color:#555;font-size:22rpx;line-height:1.6}
.review-tags{display:flex;flex-wrap:wrap;gap:10rpx;margin-top:14rpx}
.review-tags text{padding:8rpx 14rpx;border-radius:999rpx;background:#f7f7f9;color:#666;font-size:18rpx}
.review-more-row{display:flex;justify-content:flex-start;margin-top:4rpx}
.review-more-btn{width:72rpx!important;height:34rpx;margin:0!important;padding:0!important;border:0!important;background:transparent!important;line-height:34rpx!important;display:flex;align-items:center;justify-content:flex-start;gap:8rpx}
.review-more-btn text{width:7rpx;height:7rpx;border-radius:50%;background:#8f8f94;display:block}
.review-more-btn::after{border:0!important;background:transparent!important}
.service-note{display:flex;justify-content:center;gap:30rpx;padding:18rpx 0 8rpx;color:#999;font-size:19rpx}.service-note text::before{content:"✓";color:#36a568;margin-right:5rpx}
.product-safe{height:230rpx}
.product-actions{position:fixed;z-index:80;left:24rpx;right:24rpx;bottom:calc(18rpx + env(safe-area-inset-bottom));height:100rpx;padding:10rpx 12rpx;border-radius:999rpx;background:rgba(255,255,255,.98);box-shadow:0 12rpx 38rpx rgba(26,26,32,.16);display:flex;align-items:center;gap:12rpx}
.product-actions>button{box-sizing:border-box;padding:0!important;border:0!important;overflow:visible!important;}
.cart-entry{width:76rpx;flex:0 0 76rpx;height:80rpx;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#777;font-size:17rpx}.cart-entry image{width:31rpx;height:31rpx;margin-bottom:3rpx}.cart-entry>text{position:absolute;right:4rpx;top:0;min-width:28rpx;height:28rpx;padding:0 7rpx;border-radius:14rpx;background:var(--orange);color:#fff;font-size:16rpx;display:flex;align-items:center;justify-content:center}
.cart-entry{min-width:76rpx!important;max-width:76rpx!important;white-space:nowrap}
.favorite-entry{width:76rpx!important;min-width:76rpx!important;max-width:76rpx!important;flex:0 0 76rpx;height:80rpx;padding:0!important;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#777;font-size:17rpx}.favorite-entry image{width:31rpx;height:31rpx;margin-bottom:3rpx;opacity:.7}.favorite-entry.on{color:var(--orange)}.favorite-entry.on image{opacity:1;filter:invert(48%) sepia(93%) saturate(2460%) hue-rotate(338deg) brightness(102%) contrast(101%)}
.add-cart{flex:1;min-width:0;height:78rpx;border-radius:999rpx;background:var(--theme-gradient);color:#fff;font-size:24rpx;font-weight:750;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.spec-mask{position:fixed;z-index:70;inset:0;background:rgba(18,18,20,.32);display:flex;align-items:flex-end}
.spec-dialog{width:100%;padding:16rpx 30rpx calc(154rpx + env(safe-area-inset-bottom));background:#fff;border-radius:40rpx 40rpx 0 0;box-shadow:0 -15rpx 45rpx rgba(25,25,30,.14);animation:spec-rise .24s ease-out}
@keyframes spec-rise{from{transform:translateY(100%);opacity:.6}to{transform:translateY(0);opacity:1}}
.sheet-handle{width:72rpx;height:8rpx;margin:0 auto 22rpx;border-radius:999rpx;background:#ddd}
.sheet-product{position:relative;display:flex;align-items:center;padding-bottom:26rpx;border-bottom:1rpx solid #eee}
.sheet-visual{width:112rpx;height:112rpx;flex:0 0 112rpx;border-radius:25rpx;display:flex;align-items:center;justify-content:center}.sheet-visual image{width:62rpx;height:62rpx}
.sheet-copy{min-width:0;padding-left:18rpx}.sheet-copy>text{display:block;max-width:410rpx;font-size:27rpx;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet-copy>view{margin-top:10rpx;color:var(--orange);font-size:36rpx;font-weight:850}.sheet-copy>view text{font-size:22rpx;margin-right:3rpx}
.sheet-title{display:block;margin-top:25rpx;font-size:28rpx;font-weight:750}
.sheet-quantity-row{display:flex;align-items:center;justify-content:space-between;margin-top:30rpx;padding-top:24rpx;border-top:1rpx solid #eee}
.sheet-quantity-row>view:first-child text{display:block}.sheet-quantity-row>view:first-child text:first-child{font-size:25rpx;font-weight:700}.sheet-quantity-row>view:first-child text:last-child{margin-top:5rpx;color:#aaa;font-size:18rpx}
.sheet-stepper{width:150rpx;height:48rpx;flex:0 0 150rpx;overflow:hidden;border:1rpx solid #e5e5e9;border-radius:999rpx;background:#f7f7f9;display:flex;align-items:center}
.sheet-stepper.single{width:102rpx;flex-basis:102rpx}
.sheet-stepper button{width:48rpx!important;min-width:48rpx!important;max-width:48rpx!important;height:48rpx;flex:0 0 48rpx;border-radius:0;background:transparent;color:#666;font-size:27rpx;display:flex;align-items:center;justify-content:center}
.sheet-stepper .minus{border-right:1rpx solid #e5e5e9}.sheet-stepper .plus{border-left:1rpx solid rgba(255,255,255,.35);border-radius:0 999rpx 999rpx 0;background:var(--orange);color:#fff}
.sheet-stepper .count-input{width:54rpx;height:48rpx;flex:0 0 54rpx;padding:0;color:#333;font-size:22rpx;font-weight:650;line-height:48rpx;text-align:center;background:#fff}
.product-hero{overflow:hidden}.product-hero>image{width:100%;height:100%;display:block}
.sheet-visual{overflow:hidden}.sheet-visual image{width:100%;height:100%;display:block}

/* 鍟嗗搧璇︽儏搴曢儴宸︿晶涓や釜鍏ュ彛鍙繚鐣欏浘鏍囧拰鏂囧瓧锛屼笉浣跨敤 H5 榛樿鎸夐挳鐏板簳銆?*/
.product-actions .cart-entry,
.product-actions .favorite-entry,
uni-button.cart-entry,
uni-button.favorite-entry{
  background:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
.product-actions .cart-entry::after,
.product-actions .favorite-entry::after,
uni-button.cart-entry::after,
uni-button.favorite-entry::after{
  border:0!important;
  background:transparent!important;
}

/* 长辈模式：商品详情页采用更大图片区、标题、说明和底部操作按钮。 */
.product-page.elder-mode .product-hero{
  height:480rpx;
}
.product-page.elder-mode .product-main{
  padding:0 26rpx;
}
.product-page.elder-mode .product-summary,
.product-page.elder-mode .detail-card{
  padding:32rpx;
  margin-bottom:22rpx;
  border-radius:38rpx;
}
.product-page.elder-mode .product-name{
  font-size:44rpx;
}
.product-page.elder-mode .product-desc{
  font-size:27rpx;
}
.product-page.elder-mode .product-meta{
  gap:18rpx;
  font-size:24rpx;
  flex-wrap:wrap;
}
.product-page.elder-mode .product-meta image{
  width:27rpx;
  height:27rpx;
}
.product-page.elder-mode .product-price{
  font-size:50rpx;
}
.product-page.elder-mode .product-price>text:first-child{
  font-size:30rpx;
}
.product-page.elder-mode .product-price .old-price{
  font-size:24rpx;
}
.product-page.elder-mode .detail-title{
  font-size:35rpx;
}
.product-page.elder-mode .intro{
  font-size:28rpx;
  line-height:1.85;
}
.product-page.elder-mode .detail-facts text:first-child{
  font-size:24rpx;
}
.product-page.elder-mode .detail-facts text:last-child{
  font-size:28rpx;
}
.product-page.elder-mode .chip-row text{
  padding:13rpx 20rpx;
  font-size:24rpx;
}
.product-page.elder-mode .spec-entry{
  min-height:112rpx;
}
.product-page.elder-mode .spec-entry>view{
  font-size:27rpx;
}
.product-page.elder-mode .review-copy,
.product-page.elder-mode .review-name>view>text:first-child{
  font-size:26rpx;
}
.product-page.elder-mode .review-search input{
  font-size:25rpx;
}
.product-page.elder-mode .review-dropdown-btn,
.product-page.elder-mode .review-dropdown-menu button{
  height:58rpx;
  font-size:24rpx;
}
.product-page.elder-mode .review-sort-texts{
  font-size:25rpx;
}
.product-page.elder-mode .service-note{
  font-size:23rpx;
}
.product-page.elder-mode .product-actions{
  left:28rpx;
  right:28rpx;
  height:116rpx;
  padding:12rpx 14rpx;
}
.product-page.elder-mode .cart-entry,
.product-page.elder-mode .favorite-entry{
  width:92rpx!important;
  min-width:92rpx!important;
  max-width:92rpx!important;
  flex-basis:92rpx;
  height:92rpx;
  font-size:21rpx;
}
.product-page.elder-mode .cart-entry image,
.product-page.elder-mode .favorite-entry image{
  width:38rpx;
  height:38rpx;
}
.product-page.elder-mode .add-cart{
  height:92rpx;
  font-size:30rpx;
}
.product-page.elder-mode .spec-dialog{
  padding:18rpx 34rpx calc(178rpx + env(safe-area-inset-bottom));
}
.product-page.elder-mode .sheet-visual{
  width:130rpx;
  height:130rpx;
  flex-basis:130rpx;
}
.product-page.elder-mode .sheet-copy>text{
  font-size:32rpx;
}
.product-page.elder-mode .sheet-copy>view{
  font-size:42rpx;
}
.product-page.elder-mode .sheet-title{
  font-size:34rpx;
}
.product-page.elder-mode .detail-specs button{
  height:96rpx;
}
.product-page.elder-mode .detail-specs button text:first-child{
  font-size:24rpx;
}
.product-page.elder-mode .detail-specs button text:last-child{
  font-size:19rpx;
}
.product-page.elder-mode .sheet-quantity-row>view:first-child text:first-child{
  font-size:30rpx;
}
.product-page.elder-mode .sheet-stepper{
  width:174rpx;
  height:58rpx;
  flex-basis:174rpx;
}
.product-page.elder-mode .sheet-stepper.single{
  width:122rpx;
  flex-basis:122rpx;
}
.product-page.elder-mode .sheet-stepper button{
  width:58rpx!important;
  min-width:58rpx!important;
  max-width:58rpx!important;
  height:58rpx;
}
.product-page.elder-mode .sheet-stepper .count-input{
  width:58rpx;
  height:58rpx;
  flex-basis:58rpx;
  font-size:26rpx;
  line-height:58rpx;
}

</style>

