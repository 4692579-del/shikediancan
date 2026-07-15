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

      <view class="detail-card card review-card">
        <view class="detail-heading"><text class="detail-title">用户评价</text><text>{{food.rating}} 好评</text></view>
        <view class="review-user"><view>食</view><text>匿名用户</text><text>★★★★★</text></view>
        <text class="review-copy">味道很好，包装也很仔细，分量足，送达时还是热的。</text>
      </view>

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
    showSpecSheet: false
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
    productBackend.fetchProductDetail(food.id).then(latest => {
      if (!latest) return
      this.setData({
        food: latest,
        detail: productBackend.getDetailById(latest.id) || {},
        displayPrice: (latest.price + (this.specs.find(item => item.name === this.selectedSpec)?.extra || 0)).toFixed(1)
      })
    }).catch(err => console.error('load product detail failed', err))
  },
  onShow() {
    if (!this.food) return
    this.setData({ elderMode: elderMode.isEnabled() })
    this.syncPageState()
    if (store.isLogin()) {
      favoriteBackend.fetchFavorites()
        .then(() => this.syncPageState())
        .catch(err => console.error('fetch favorites failed', err))
    }
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
.detail-specs{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10rpx;margin-top:20rpx}
.detail-specs button{width:100%!important;min-width:0!important;max-width:none!important;height:82rpx;padding:0 4rpx!important;overflow:hidden;border:2rpx solid transparent;border-radius:999rpx;background:#f4f4f6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5rpx}
.detail-specs button text{display:block;width:100%;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.detail-specs button text:first-child{font-size:20rpx;font-weight:650}.detail-specs button text:last-child{font-size:16rpx;color:#999}
.detail-specs button.on{border-color:var(--theme-border);background:var(--orange-soft);color:var(--orange)}.detail-specs button.on text:last-child{color:var(--theme-border)}
.review-user{display:flex;align-items:center;margin-top:22rpx}.review-user>view{width:52rpx;height:52rpx;border-radius:50%;background:#1c1c1e;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;margin-right:12rpx}
.review-user>text:nth-child(2){flex:1;font-size:22rpx}.review-user>text:last-child{color:#f0a020;font-size:20rpx;letter-spacing:2rpx}
.review-copy{display:block;margin-top:14rpx;font-size:22rpx;color:#555;line-height:1.6}
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
.product-page.elder-mode .review-user>text:nth-child(2){
  font-size:26rpx;
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

