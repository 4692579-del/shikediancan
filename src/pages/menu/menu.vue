<template>
<view :style="globalThemeStyle" :class="`page menu-page ${elderMode ? 'elder-mode' : ''}`">
  <view class="menu-head" :style="`padding-top: ${statusHeight}px`">
    <view class="menu-nav">
      <view class="shop-brand" :style="`background:${shop.color}`">{{shop.icon}}</view>
      <view class="shop-copy">
        <text class="shop-title">{{shop.name}}</text>
        <view class="shop-sub"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{shop.rating}} · {{shop.time}} · 配送 ¥{{shop.delivery}}</text></view>
      </view>
    </view>
    <view class="notice"><image src="/static/assets/icons/message.svg" mode="aspectFit" /><text>{{shop.notice}}</text></view>
    <view class="offer-row">
      <text>满30减8</text><text>满50减15</text><text>新客减12</text>
    </view>
  </view>

  <view class="menu-body">
    <scroll-view scroll-y class="category-side" :show-scrollbar="false">
      <view v-for="(item, index) in categories" :key="item.id" :class="`side-item ${active === item.id ? 'active' : ''}`" :data-id="item.id" @tap="selectCategory">
        <image class="side-icon" :src="item.icon" mode="aspectFit" />
        <text>{{item.name}}</text>
      </view>
    </scroll-view>
    <scroll-view scroll-y class="food-list" :show-scrollbar="false">
      <view class="list-title"><image v-if="active === 'hot'" src="/static/assets/icons/fire.svg" mode="aspectFit" /><text>{{active === 'hot' ? '人气热卖' : '精选菜品'}}</text></view>
      <view v-for="(item, index) in visibleFoods" :key="item.id" class="menu-food card" :data-id="item.id" @tap="goFoodDetail">
        <view class="menu-visual" :style="`background:${item.bg}`"><image :src="item.icon" mode="aspectFill" /><view class="mini-tag">{{item.tag}}</view></view>
        <view class="menu-info">
          <view class="menu-name-row"><text class="menu-name">{{item.name}}</text></view>
          <text class="menu-desc">{{item.desc}}</text>
          <text class="menu-sales">月售 {{item.sales}} · 好评 {{item.rating}}</text>
          <view class="between menu-price-row">
            <view><text class="menu-price">¥{{item.price}}</text><text class="menu-old">¥{{item.oldPrice}}</text></view>
            <button hover-class="none" class="spec-btn" :data-id="item.id" @tap.stop="showSpec">选规格</button>
          </view>
        </view>
      </view>
      <view class="list-bottom">— 已经到底啦 —</view>
      <view :class="`list-safe-space ${cartCount > 0 ? 'with-cart' : ''}`"></view>
    </scroll-view>
  </view>

  <view v-if="cartCount > 0" class="cart-bar" @tap="goCart">
    <view class="cart-icon"><image src="/static/assets/icons/cart.svg" mode="aspectFit" /><text>{{cartCount}}</text></view>
    <view class="cart-price"><text>¥{{cartTotal}}</text><text class="delivery-tip">{{membershipTier === 'pro' ? 'PRO免配送费' : '配送费以结算页为准'}}</text></view>
    <view class="checkout-label">去结算</view>
  </view>

  <view v-if="specVisible" class="mask" @tap="closeSpec">
    <view class="spec-sheet" @tap.stop="noop">
      <view class="sheet-handle"></view>
      <view class="spec-food">
        <view class="spec-visual" :style="`background:${selectedFood.bg}`"><image :src="selectedFood.icon" mode="aspectFill" /></view>
        <view><text class="spec-name">{{selectedFood.name}}</text><text class="spec-price">¥{{selectedFood.price}}</text></view>
      </view>
      <text class="spec-title">选择份量</text>
      <view class="spec-options">
        <button v-for="(item, index) in specs" :key="item" hover-class="none" :class="`spec-option ${selectedSpec === item ? 'selected' : ''}`" :data-spec="item" @tap="pickSpec">{{item}}</button>
      </view>
      <view class="spec-quantity-row">
        <view class="quantity-copy"><text>购买数量</text><text>最少购买1份</text></view>
        <view :class="`spec-stepper ${specCount === 1 ? 'single' : ''}`">
          <button v-if="specCount > 1" hover-class="none" class="minus" @tap="decreaseSpecCount">−</button>
          <input class="spec-count-input" type="number" :value="specCount" @blur="setSpecCount" />
          <button hover-class="none" class="plus" @tap="increaseSpecCount">＋</button>
        </view>
      </view>
      <button hover-class="none" class="primary-btn" @tap="confirmSpec">加入购物车</button>
    </view>
  </view>
  <bottom-nav active="menu" />
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 点餐页：按分类筛选菜品，处理规格与数量选择，并同步购物车摘要。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import membership from '../../utils/membership.js'
import orderBackend from '../../utils/order-backend.js'
import productBackend from '../../utils/product-backend.js'
import elderMode from '../../utils/elder-mode.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    shop: productBackend.getShops()[0] || {},
    categories: productBackend.getCategories().filter(item => item.id !== 'all'),
    active: 'hot',
    foods: productBackend.getFoods(),
    visibleFoods: productBackend.getFoods(),
    cartCount: 0,
    cartTotal: 0,
    membershipActive: false,
    membershipTier: '',
    elderMode: false,
    specVisible: false,
    selectedFood: null,
    selectedSpec: '标准份',
    specCount: 1,
    specs: ['标准份', '加大份 +¥5', '双倍主菜 +¥9']
  },
  // 读取分类参数并初始化左侧分类和右侧商品列表。
  onLoad(options) {
    const shopId = Number(uni.getStorageSync('sk_shop_id') || 1)
    const category = uni.getStorageSync('sk_menu_category') || 'hot'
    const productData = productBackend.getSnapshot()
    const shop = productData.shops.find(item => item.id === shopId) || productData.shops[0] || {}
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      shop,
      categories: productData.categories.filter(item => item.id !== 'all'),
      foods: productData.foods,
      active: category
    })
    this.filter(category)
    productBackend.syncProducts().then(nextData => {
      const nextShop = nextData.shops.find(item => item.id === shopId) || nextData.shops[0] || this.shop
      this.setData({
        shop: nextShop,
        categories: nextData.categories.filter(item => item.id !== 'all'),
        foods: nextData.foods
      })
      this.filter(this.active)
    }).catch(err => console.error('sync products failed', err))
    if (options.openSpec && store.isLogin()) {
      const selectedFood = productBackend.getFoodById(options.openSpec)
      if (selectedFood) this.setData({ specVisible: true, selectedFood, selectedSpec: '标准份', specCount: 1 })
    }
  },
  onShow() {
    this.setData({ elderMode: elderMode.isEnabled() })
    this.refreshCart()
  },
  refreshCart() {
    const summary = store.isLogin() ? store.cartSummary() : { count: 0, total: 0 }
    const membershipActive = store.isLogin() && membership.isActive()
    this.setData({ cartCount: summary.count, cartTotal: summary.total, membershipActive, membershipTier: membershipActive ? membership.getTier() : '' })
  },
  selectCategory(e) {
    const active = e.currentTarget.dataset.id
    this.setData({ active })
    this.filter(active)
  },
  // 人气分类按销量筛选，其余分类按 category 字段筛选。
  filter(category) {
    const foods = this.foods && this.foods.length ? this.foods : productBackend.getFoods()
    let visibleFoods = category === 'hot' ? foods.filter(item => item.sales > 900) : foods.filter(item => item.category === category)
    if (!visibleFoods.length) visibleFoods = foods.slice(0, 5)
    this.setData({ visibleFoods })
  },
  goFoodDetail(e) { uni.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` }) },
  // 未登录也允许查看规格，点击确认加入购物车时再鉴权。
  showSpec(e) {
    const id = Number(e.currentTarget.dataset.id)
    const selectedFood = productBackend.getFoodById(id)
    if (!selectedFood) return
    this.setData({ specVisible: true, selectedFood, selectedSpec: '标准份', specCount: 1 })
  },
  closeSpec() { this.setData({ specVisible: false }) },
  pickSpec(e) { this.setData({ selectedSpec: e.currentTarget.dataset.spec }) },
  decreaseSpecCount() {
    if (this.specCount <= 1) return
    this.setData({ specCount: this.specCount - 1 })
  },
  increaseSpecCount() { this.setData({ specCount: this.specCount + 1 }) },
  // 数量输入必须为大于等于 1 的整数。
  setSpecCount(e) {
    const value = String(e.detail.value || '').trim()
    if (!value) {
      this.setData({ specCount: 1 })
      return
    }
    const specCount = Math.floor(Number(value))
    if (!Number.isFinite(specCount) || specCount < 1) {
      uni.showToast({ title: '商品数量不能小于1', icon: 'none' })
      this.setData({ specCount: 1 })
      return
    }
    this.setData({ specCount })
  },
  // 根据规格计算最终单价并写入本地购物车。
  confirmSpec() {
    if (!this.selectedFood) return
    if (!auth.requireLogin(`/pages/menu/menu?openSpec=${this.selectedFood.id}`)) return
    const food = { ...this.selectedFood }
    if (this.selectedSpec.indexOf('+¥5') > -1) food.price += 5
    if (this.selectedSpec.indexOf('+¥9') > -1) food.price += 9
    store.addCart(food, this.specCount, this.selectedSpec)
    orderBackend.saveCart(store.getCart()).catch(err => console.error('sync cart failed', err))
    this.closeSpec()
    this.refreshCart()
    uni.showToast({ title: '已加入购物车' })
  },
  goCart() { if (auth.requireLogin('/pages/cart/cart')) uni.navigateTo({ url: '/pages/cart/cart' }) },
  noop() {}
}

export default adaptPage(pageConfig)
</script>

<style>
.menu-page{height:100vh;overflow:hidden;padding-bottom:0;display:flex;flex-direction:column}.menu-head{flex-shrink:0;background:#fff;padding-left:24rpx;padding-right:24rpx;box-shadow:0 6rpx 22rpx rgba(0,0,0,.04)}
.menu-nav{height:105rpx;display:flex;align-items:center}.shop-brand{width:70rpx;height:70rpx;border-radius:22rpx;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin-right:16rpx}.shop-copy{flex:1;display:flex;flex-direction:column}.shop-title{font-size:31rpx;font-weight:750}.shop-sub{font-size:20rpx;color:#888;margin-top:5rpx}.round-btn{width:56rpx!important;max-width:56rpx!important;height:56rpx;flex:0 0 56rpx;border-radius:19rpx;background:#f4f4f6;display:flex;align-items:center;justify-content:center;font-size:29rpx;margin-left:8rpx}.notice{background:#f8f8fa;border-radius:18rpx;padding:13rpx 18rpx;color:#777;font-size:21rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.offer-row{height:64rpx;display:flex;align-items:center;gap:12rpx}.offer-row text{font-size:19rpx;color:#c9573b;border:1rpx solid #f3b19f;border-radius:8rpx;padding:5rpx 9rpx}
.menu-body{flex:1;min-height:0;display:flex;padding-bottom:calc(116rpx + env(safe-area-inset-bottom))}.category-side{width:176rpx;height:100%;background:#eeeeF1;flex-shrink:0}.side-item{width:100%;height:116rpx;padding:0 8rpx;display:flex;align-items:center;justify-content:center;gap:7rpx;color:#777;font-size:23rpx;position:relative}.side-item.active{background:#fff;color:#1c1c1e;font-weight:700}.side-item.active::before{content:"";position:absolute;left:0;width:7rpx;height:42rpx;border-radius:0 8rpx 8rpx 0;background:var(--orange)}.side-icon{font-size:28rpx}
.food-list{height:100%;min-width:0;background:#f7f7f9;padding:0 18rpx}.list-title{font-size:30rpx;font-weight:750;padding:24rpx 5rpx 18rpx}.menu-food{width:100%!important;display:flex;padding:18rpx;margin-bottom:16rpx}.menu-visual{width:176rpx;height:176rpx;flex-shrink:0;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:78rpx;position:relative}.mini-tag{position:absolute;left:8rpx;top:8rpx;background:rgba(255,255,255,.86);border-radius:8rpx;padding:4rpx 7rpx;font-size:16rpx;color:#a3482a}.menu-info{flex:1;min-width:0;padding-left:16rpx}.menu-name-row{display:flex;align-items:center;gap:8rpx}.menu-name{flex:1;min-width:0;font-size:27rpx;font-weight:750;display:block}.menu-desc{font-size:19rpx;color:#8d8d92;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:8rpx 0}.menu-sales{font-size:18rpx;color:#aaa;display:block}.menu-price-row{margin-top:17rpx}.menu-price{color:var(--orange);font-size:30rpx;font-weight:800}.menu-old{font-size:17rpx;color:#aaa;text-decoration:line-through;margin-left:5rpx}.spec-btn{background:var(--orange);color:#fff;border-radius:18rpx;padding:10rpx 14rpx;font-size:19rpx;font-weight:650}.list-bottom{text-align:center;color:#bbb;font-size:21rpx;padding:30rpx 0 16rpx}
.cart-bar{position:fixed;z-index:80;left:34rpx;right:34rpx;bottom:calc(128rpx + env(safe-area-inset-bottom));height:100rpx;border-radius:52rpx;background:#1c1c1e;color:#fff;display:flex;align-items:center;box-shadow:0 15rpx 35rpx rgba(0,0,0,.25);overflow:visible}.cart-icon{width:102rpx;height:102rpx;border-radius:51rpx;background:var(--orange);display:flex;align-items:center;justify-content:center;font-size:43rpx;position:relative}.cart-icon text{position:absolute;right:-3rpx;top:-5rpx;background:#fff;color:var(--orange);border-radius:20rpx;min-width:34rpx;height:34rpx;line-height:34rpx;text-align:center;font-size:18rpx}.cart-price{flex:1;text-align:left;padding-left:20rpx;display:flex;flex-direction:column}.cart-price>text:first-child{font-size:34rpx;font-weight:800}.delivery-tip{font-size:18rpx;color:#aaa}.checkout-label{height:100rpx;line-height:100rpx;padding:0 34rpx;background:var(--orange);font-weight:700;border-radius:0 52rpx 52rpx 0}
.mask{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.38);display:flex;align-items:flex-end}.spec-sheet{width:100%;background:#fff;border-radius:40rpx 40rpx 0 0;padding:18rpx 30rpx calc(35rpx + env(safe-area-inset-bottom))}.sheet-handle{width:76rpx;height:8rpx;background:#ddd;border-radius:4rpx;margin:0 auto 25rpx}.spec-food{display:flex;align-items:center;margin-bottom:30rpx}.spec-visual{width:130rpx;height:130rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:center;font-size:64rpx;margin-right:20rpx}.spec-name,.spec-price{display:block}.spec-name{font-size:32rpx;font-weight:750}.spec-price{color:var(--orange);font-size:34rpx;font-weight:800;margin-top:14rpx}.spec-title{font-weight:700}.spec-options{display:flex;gap:14rpx;flex-wrap:wrap;margin:20rpx 0 35rpx}.spec-option{padding:17rpx 22rpx;border-radius:20rpx;background:#f4f4f6;color:#555;font-size:23rpx}.spec-option.selected{background:var(--orange-soft);color:var(--orange);border:2rpx solid var(--theme-border)}

.shop-brand,.round-btn{flex-shrink:0}.shop-copy{min-width:0}.shop-title,.shop-sub{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.round-btn{width:56rpx;height:56rpx;font-size:29rpx;margin-left:8rpx}
.offer-row{gap:8rpx;overflow:hidden}.offer-row text{flex-shrink:0;font-size:18rpx;padding:5rpx 8rpx}
.category-side{width:164rpx!important;flex:0 0 164rpx}
.side-item{
  width:164rpx!important;
  max-width:164rpx!important;
  height:112rpx;
  padding:10rpx 4rpx;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6rpx;
  font-size:20rpx;
  line-height:1.2;
  text-align:center;
  white-space:normal;
  overflow:hidden;
}
.side-item>text:last-child{
  display:block;
  width:100%;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  text-align:center;
}
.side-icon{font-size:27rpx;line-height:32rpx;flex-shrink:0}
.food-list{padding:0 10rpx}.menu-food{padding:13rpx;min-width:0}.menu-visual{width:126rpx;height:126rpx;font-size:60rpx}
.menu-info{padding-left:13rpx}.menu-name{font-size:25rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.menu-sales{font-size:17rpx;white-space:nowrap}.menu-price-row{gap:7rpx;margin-top:14rpx}
.menu-price{font-size:27rpx}.spec-btn{width:104rpx!important;flex:0 0 104rpx;padding:0;height:48rpx;font-size:18rpx}
.cart-bar{left:52rpx;right:52rpx;bottom:calc(150rpx + env(safe-area-inset-bottom));width:auto!important;max-width:none!important;height:96rpx;border-radius:32rpx;overflow:hidden}
.cart-icon{width:82rpx;height:96rpx;border-radius:0;background:#29292c;font-size:36rpx;flex-shrink:0}
.cart-price{min-width:0;padding-left:17rpx}.cart-price>text:first-child{font-size:30rpx}
.checkout-label{height:96rpx;min-width:166rpx;display:flex;align-items:center;justify-content:center;padding:0 28rpx;border-radius:0;flex-shrink:0;font-size:26rpx}
.menu-nav{padding-right:150rpx}
.food-list{flex:1}.round-btn,.side-item,.spec-btn,.spec-option{display:flex;align-items:center;justify-content:center;line-height:1;text-align:center}

/* Iconfont SVG sizing */
.shop-sub{display:flex;align-items:center}
.shop-sub image{width:20rpx;height:20rpx;margin-right:5rpx;flex-shrink:0}
.round-btn image{width:28rpx;height:28rpx}
.notice{display:flex;align-items:center}
.notice image{width:25rpx;height:25rpx;margin-right:8rpx;flex-shrink:0}
.notice text{overflow:hidden;text-overflow:ellipsis}
.side-icon{width:31rpx;height:31rpx;flex-shrink:0}
.list-title{display:flex;align-items:center}
.list-title image{width:31rpx;height:31rpx;margin-right:8rpx}
.menu-visual>image{width:72rpx;height:72rpx}
.cart-icon image{width:40rpx;height:40rpx}
.spec-visual image{width:68rpx;height:68rpx}

/* Keep the final card fully scrollable above fixed controls. */
.list-safe-space{height:200rpx}
.list-safe-space.with-cart{height:220rpx}

/* Keep the quantity badge fully visible above the floating cart bar. */
.cart-bar{overflow:visible}
.cart-icon{
  overflow:visible;
  border-radius:32rpx 0 0 32rpx;
}
.checkout-label{border-radius:0 32rpx 32rpx 0}
.cart-icon text{
  right:-8rpx;
  top:-12rpx;
  z-index:4;
  min-width:36rpx;
  height:36rpx;
  padding:0 8rpx;
  line-height:36rpx;
  box-sizing:border-box;
}

/* Pin the specification action to the far-right edge of each card. */
.menu-price-row{width:100%;display:flex;align-items:center}
.menu-price-row>view:first-child{min-width:0;flex:1}
.spec-btn{
  margin-left:auto!important;
  margin-right:0!important;
  align-self:center;
}

/* Capsule-shaped horizontal status bars and matching inner sections. */
.notice{
  border-radius:999rpx;
}
.cart-bar{
  border-radius:999rpx;
}
.cart-icon{
  border-radius:999rpx 0 0 999rpx;
}
.checkout-label{
  border-radius:0 999rpx 999rpx 0;
}
.spec-btn{
  border-radius:999rpx;
}
.offer-row text{
  border-radius:999rpx;
}

.menu-visual,.spec-visual{overflow:hidden}
.menu-visual>image,.spec-visual>image{width:100%;height:100%;display:block}

/* Keep all three specification choices on one row. */
.spec-options{
  display:flex;
  flex-wrap:nowrap;
  gap:12rpx;
}
.spec-option{
  width:auto!important;
  min-width:0!important;
  flex:1;
  height:82rpx;
  padding:0 8rpx;
  border-radius:999rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  white-space:nowrap;
  font-size:21rpx;
}

/* 使用 view 承载浮动结算栏，避免 H5 默认按钮的内边距、边框和灰色底色破坏胶囊布局。 */
.cart-bar{
  box-sizing:border-box;
  padding:0;
  border:0;
  outline:0;
  background:#1c1c1e;
}
.cart-price{align-self:stretch;justify-content:center}
.checkout-label{box-sizing:border-box}

/* Match the quantity selector used by the shared specification dialog. */
.spec-quantity-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin:0 0 30rpx;
  padding-top:24rpx;
  border-top:1rpx solid #eee;
}
.quantity-copy text{display:block}
.quantity-copy text:first-child{font-size:25rpx;font-weight:700}
.quantity-copy text:last-child{margin-top:5rpx;color:#aaa;font-size:18rpx}
.spec-stepper{
  width:150rpx;
  height:48rpx;
  flex:0 0 150rpx;
  overflow:hidden;
  border:1rpx solid #e5e5e9;
  border-radius:999rpx;
  background:#f7f7f9;
  display:flex;
  align-items:center;
}
.spec-stepper.single{width:102rpx;flex-basis:102rpx}
.spec-stepper button{
  width:48rpx!important;
  min-width:48rpx!important;
  max-width:48rpx!important;
  height:48rpx;
  flex:0 0 48rpx;
  padding:0;
  border-radius:0;
  background:transparent;
  color:#666;
  font-size:27rpx;
  display:flex;
  align-items:center;
  justify-content:center;
}
.spec-stepper .minus{border-right:1rpx solid #e5e5e9}
.spec-stepper .plus{
  border-left:1rpx solid rgba(255,255,255,.35);
  border-radius:0 999rpx 999rpx 0;
  background:var(--orange);
  color:#fff;
}
.spec-count-input{
  width:54rpx;
  height:48rpx;
  flex:0 0 54rpx;
  padding:0;
  color:#333;
  font-size:22rpx;
  font-weight:650;
  line-height:48rpx;
  text-align:center;
  background:#fff;
}

/* 长辈模式：点餐页转为更清晰的大字卡片，减少次要信息干扰。 */
.menu-page.elder-mode .menu-nav{
  height:124rpx;
}
.menu-page.elder-mode .shop-brand{
  width:82rpx;
  height:82rpx;
  border-radius:26rpx;
  font-size:34rpx;
}
.menu-page.elder-mode .shop-title{
  font-size:37rpx;
}
.menu-page.elder-mode .shop-sub{
  font-size:24rpx;
}
.menu-page.elder-mode .notice,
.menu-page.elder-mode .offer-row{
  display:none;
}
.menu-page.elder-mode .category-side{
  width:190rpx!important;
  flex-basis:190rpx!important;
  background:#f0f0f3;
}
.menu-page.elder-mode .side-item{
  width:190rpx!important;
  max-width:190rpx!important;
  height:132rpx;
  font-size:25rpx;
  font-weight:650;
}
.menu-page.elder-mode .side-icon{
  width:42rpx;
  height:42rpx;
}
.menu-page.elder-mode .list-title{
  padding:28rpx 8rpx 20rpx;
  font-size:36rpx;
}
.menu-page.elder-mode .food-list{
  padding:0 14rpx;
}
.menu-page.elder-mode .menu-food{
  padding:20rpx;
  margin-bottom:20rpx;
  border-radius:34rpx;
}
.menu-page.elder-mode .menu-visual{
  width:154rpx;
  height:154rpx;
  border-radius:30rpx;
}
.menu-page.elder-mode .mini-tag{
  font-size:19rpx;
  border-radius:999rpx;
  padding:5rpx 10rpx;
}
.menu-page.elder-mode .menu-info{
  padding-left:18rpx;
}
.menu-page.elder-mode .menu-name{
  font-size:31rpx;
}
.menu-page.elder-mode .menu-desc{
  font-size:23rpx;
  margin:10rpx 0;
}
.menu-page.elder-mode .menu-sales{
  display:none;
}
.menu-page.elder-mode .menu-price-row{
  margin-top:20rpx;
}
.menu-page.elder-mode .menu-price{
  font-size:36rpx;
}
.menu-page.elder-mode .menu-old{
  font-size:21rpx;
}
.menu-page.elder-mode .spec-btn{
  width:132rpx!important;
  flex-basis:132rpx;
  height:60rpx;
  font-size:24rpx;
  font-weight:800;
}
.menu-page.elder-mode .cart-bar{
  left:34rpx;
  right:34rpx;
  height:112rpx;
  bottom:calc(156rpx + env(safe-area-inset-bottom));
}
.menu-page.elder-mode .cart-icon{
  width:104rpx;
  height:112rpx;
}
.menu-page.elder-mode .cart-price>text:first-child{
  font-size:36rpx;
}
.menu-page.elder-mode .delivery-tip{
  font-size:22rpx;
}
.menu-page.elder-mode .checkout-label{
  height:112rpx;
  min-width:190rpx;
  font-size:30rpx;
}
.menu-page.elder-mode .spec-sheet{
  padding-left:34rpx;
  padding-right:34rpx;
}
.menu-page.elder-mode .spec-name,
.menu-page.elder-mode .spec-title{
  font-size:34rpx;
}
.menu-page.elder-mode .spec-option{
  height:92rpx;
  font-size:24rpx;
}

</style>
