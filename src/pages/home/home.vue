<template>
<view :style="globalThemeStyle" class="page home-page">
  <scroll-view scroll-y scroll-with-animation :scroll-into-view="homeScrollTarget" :show-scrollbar="false" class="home-scroll" @scroll="onHomeScroll">
    <view id="home-page-top" class="home-top-anchor"></view>
    <view class="home-head" :style="`padding-top:${statusHeight}px;opacity:${headOpacity};transform:translateY(-${headLift}rpx)`">
      <view class="head-row">
        <button hover-class="none" class="location" @tap="goAddress">
          <view class="pin"><image src="/static/assets/icons/location.svg" mode="aspectFit" /></view>
          <view class="location-text">
            <text class="address">{{address}} ›</text>
          </view>
        </button>
      </view>
      <button hover-class="none" class="search-box" @tap="goSearch">
        <image class="search-icon" src="/static/assets/icons/search.svg" mode="aspectFit" />
        <text class="placeholder">搜索美食、菜品或店铺</text>
        <text class="search-action">搜索</text>
      </button>
    </view>
  <view class="section category-grid">
    <button v-for="(item, index) in categories" :key="item.id" hover-class="none" class="category-item" :data-category="item.id" @tap="goMenu">
      <view class="category-icon" :style="`background:${item.color}`"><image :src="item.icon" mode="aspectFit" /></view>
      <text>{{item.name}}</text>
    </button>
  </view>

  <view class="section">
    <swiper class="hero-swiper" autoplay interval="4200" circular @change="bannerChange">
      <swiper-item>
        <button hover-class="none" class="hero hero-orange" @tap="goMenu" data-category="hot">
          <view class="hero-copy">
            <text class="hero-kicker">今日甄选 · 最高减 ¥18</text>
            <text class="hero-title">认真吃饭，\n治愈每个忙碌时刻</text>
            <text class="hero-btn">立即点餐 →</text>
          </view>
          <view class="hero-food">
            <image class="hero-emoji" src="/static/assets/icons/meal.svg" mode="aspectFit" />
            <view class="float-food f1"><image src="/static/assets/icons/snack.svg" mode="aspectFit" /></view>
            <view class="float-food f2"><image src="/static/assets/icons/fruit.svg" mode="aspectFit" /></view>
          </view>
        </button>
      </swiper-item>
      <swiper-item>
        <button hover-class="none" class="hero hero-dark" @tap="goCoupons">
          <view class="hero-copy">
            <text class="hero-kicker light">食刻会员日</text>
            <text class="hero-title light">新客礼包\n三张券已到账</text>
            <text class="hero-btn gold">去领取 →</text>
          </view>
          <view class="coupon-art">
            <view class="ticket">¥12</view>
            <view class="ticket small">¥8</view>
          </view>
        </button>
      </swiper-item>
    </swiper>
    <view class="dots">
      <view :class="`dot ${currentBanner === 0 ? 'on' : ''}`"></view>
      <view :class="`dot ${currentBanner === 1 ? 'on' : ''}`"></view>
    </view>
  </view>

  <view class="quick-cards section">
    <button hover-class="none" class="quick-card yellow" @tap="goMenu" data-category="rice">
      <view>
        <text class="quick-title">工作日午餐</text>
        <text class="quick-desc">30分钟送达</text>
      </view>
      <image class="quick-icon" src="/static/assets/icons/lunch.svg" mode="aspectFit" />
    </button>
    <button hover-class="none" class="quick-card green" @tap="goMenu" data-category="healthy">
      <view>
        <text class="quick-title">轻盈一餐</text>
        <text class="quick-desc">低卡也好吃</text>
      </view>
      <image class="quick-icon" src="/static/assets/icons/fruit.svg" mode="aspectFit" />
    </button>
  </view>

  <view class="section">
    <view class="section-head">
      <text class="section-title">大家都在点</text>
      <button hover-class="none" class="section-more" @tap="goMenu">查看全部 ›</button>
    </view>
    <scroll-view scroll-x :show-scrollbar="false" class="food-scroll">
      <view class="food-row">
        <view v-for="(item, index) in foods" :key="item.id" class="food-card card" :data-id="item.id" @tap="goFoodDetail">
          <view class="food-visual" :style="`background:${item.bg}`">
            <image class="food-svg" :src="item.icon" mode="aspectFill" />
            <view class="food-tag">{{item.tag}}</view>
          </view>
          <view class="food-info">
            <text class="food-name">{{item.name}}</text>
            <view class="food-sales"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{item.rating}} · 月售{{item.sales}}</text></view>
            <view class="between">
              <view><text class="price">¥{{item.price}}</text><text class="old-price">¥{{item.oldPrice}}</text></view>
              <button hover-class="none" class="add" :data-id="item.id" @tap.stop="addFood">＋</button>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>

  <view class="section">
    <view class="section-head">
      <text class="section-title">附近好店</text>
      <text class="section-more">按距离排序</text>
    </view>
    <button v-for="(item, index) in shops" :key="item.id" hover-class="none" class="shop-card card" :data-id="item.id" @tap="goShop">
      <view class="shop-logo" :style="`background:${item.color}`">{{item.icon}}</view>
      <view class="shop-main">
        <view class="between">
          <text class="shop-name">{{item.name}}</text>
          <text class="shop-distance">{{item.distance}}</text>
        </view>
        <text class="shop-desc">{{item.desc}}</text>
        <view class="shop-meta">
          <view class="rating"><image src="/static/assets/icons/star.svg" mode="aspectFit" /><text>{{item.rating}}</text></view>
          <text>{{item.time}}</text>
          <text>起送 ¥{{item.min}}</text>
        </view>
        <view class="shop-offer"><text>减</text> 满30减8，满50减15</view>
      </view>
    </button>
  </view>
  <view class="home-scroll-safe"></view>
  </scroll-view>
  <button v-if="showBackTop" hover-class="none" :class="`home-back-top ${!loggedIn ? 'guest-position' : ''}`" @tap="backToTop">
    <view class="back-top-arrow"></view>
  </button>
  <product-spec-sheet :show="showSpecSheet" :food="selectedFood" @close="closeSpecSheet" @added="specAdded" />
  <bottom-nav active="home" />
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 首页：展示地址、分类、轮播、推荐商品与店铺，并维护顶部收起和回顶交互。

import data from '../../utils/data.js'
import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    address: '请选择收货地址',
    categories: data.categories,
    foods: data.foods.slice(0, 6),
    shops: data.shops,
    cartCount: 0,
    currentBanner: 0,
    selectedFood: null,
    showSpecSheet: false,
    headOpacity: 1,
    headLift: 0,
    loggedIn: false,
    showBackTop: false,
    homeScrollTarget: ''
  },
  onLoad() {
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  // 每次返回首页时同步当前选择地址、购物车数量和全局主题。
  onShow() {
    const loggedIn = store.isLogin()
    const addresses = loggedIn ? store.getAddresses() : []
    const selectedAddress = loggedIn ? store.get('sk_selected_address', null) : null
    const selected = selectedAddress && addresses.find(item => item.id === selectedAddress.id)
    const address = selected || addresses.find(item => item.isDefault) || null
    const summary = loggedIn ? store.cartSummary() : { count: 0 }
    this.setData({
      loggedIn,
      address: loggedIn ? (address ? store.getCompactAddress(address) : '请选择收货地址') : '登录后选择收货地址',
      cartCount: summary.count
    })
  },
  // 根据滚动距离连续计算顶部卡片位移与透明度。
  onHomeScroll(e) {
    const scrollTop = Math.max(Number(e.detail.scrollTop || 0), 0)
    const progress = Math.min(scrollTop / 94, 1)
    const headOpacity = Number((1 - progress).toFixed(3))
    const headLift = Number((progress * 126).toFixed(1))
    const showBackTop = scrollTop > 12
    if (
      Math.abs(headOpacity - this.headOpacity) < 0.01 &&
      Math.abs(headLift - this.headLift) < 1 &&
      showBackTop === this.showBackTop &&
      progress !== 0 &&
      progress !== 1
    ) return
    this.setData({ headOpacity, headLift, showBackTop })
  },
  // 使用 scroll-view 定位标识平滑回到内容顶部。
  backToTop() {
    this.setData({ homeScrollTarget: '' }, () => {
      this.setData({ homeScrollTarget: 'home-page-top' })
    })
  },
  goSearch() { if (auth.requireLogin('/pages/search/search')) uni.navigateTo({ url: '/pages/search/search' }) },
  goAddress() { if (auth.requireLogin('/pages/address/address?select=1')) uni.navigateTo({ url: '/pages/address/address?select=1' }) },
  goMenu(e) {
    const category = e.currentTarget.dataset.category || 'hot'
    uni.setStorageSync('sk_menu_category', category)
    uni.redirectTo({ url: '/pages/menu/menu' })
  },
  goCoupons() { if (auth.requireLogin('/pages/coupons/coupons')) uni.navigateTo({ url: '/pages/coupons/coupons' }) },
  goShop(e) {
    uni.setStorageSync('sk_shop_id', e.currentTarget.dataset.id)
    uni.redirectTo({ url: '/pages/menu/menu' })
  },
  goFoodDetail(e) { uni.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` }) },
  // 首页加号只打开规格面板，最终加购由公共组件完成。
  addFood(e) {
    if (!auth.requireLogin('/pages/home/home')) return
    const selectedFood = data.foods.find(item => item.id === Number(e.currentTarget.dataset.id))
    this.setData({ selectedFood, showSpecSheet: true })
  },
  closeSpecSheet() { this.setData({ showSpecSheet: false }) },
  specAdded(e) { this.setData({ cartCount: e.detail.count }) },
  bannerChange(e) { this.setData({ currentBanner: e.detail.current }) }
}

export default adaptPage(pageConfig)
</script>

<style>
.home-head {
  box-sizing:border-box;
  width:100%;
  padding-left:28rpx;
  padding-right:28rpx;
  padding-bottom:24rpx;
  overflow:hidden;
  border-radius:0 0 48rpx 48rpx;
  color:#fff;
  background:var(--theme-gradient);
  box-shadow:0 12rpx 30rpx var(--theme-shadow);
  will-change:transform,opacity;
}
.head-row { height: 76rpx; padding-right: 156rpx; display: flex; align-items: center; justify-content: space-between; }
.location { display: flex; align-items: center; text-align: left; flex:1; min-width:0; }
.pin { width: 32rpx; height: 40rpx; flex:0 0 32rpx; display:flex; align-items:center; justify-content:flex-start; margin-right:7rpx; }
.location-text { display: flex; flex-direction: column; overflow: hidden; min-width:0; flex:1; }
.address { color:#fff; font-size: 27rpx; line-height:40rpx; font-weight: 700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 2rpx 7rpx rgba(30,25,20,.16); }
.search-box { width:100%!important; max-width:none!important; height: 68rpx; border-radius: 34rpx; background:rgba(255,255,255,.96); display:flex; align-items:center; padding:0 7rpx 0 22rpx; box-shadow:0 7rpx 20rpx rgba(35,35,45,.12); }
.search-icon { font-size:38rpx; margin-right:14rpx; }
.placeholder { flex:1; min-width:0; text-align:left; color:#a0a0a6; font-size:22rpx; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.search-action { width:98rpx; height:56rpx; flex:0 0 98rpx; background:var(--orange); color:#fff; border-radius:28rpx; display:flex; align-items:center; justify-content:center; padding:0; font-size:22rpx; font-weight:650; }
.category-grid { display:flex; flex-wrap:wrap; row-gap:26rpx; background:#fff; margin:20rpx 20rpx 0; padding:28rpx 12rpx 30rpx; border-radius:34rpx; }
.category-item { width:25%; flex:0 0 25%; min-width:0; display:flex; flex-direction:column; align-items:center; font-size:22rpx; white-space:nowrap; overflow:hidden; }
.category-icon { width:88rpx; height:88rpx; border-radius:29rpx; display:flex; align-items:center; justify-content:center; font-size:44rpx; margin-bottom:12rpx; }
.hero-swiper { width:100%; height:310rpx; }
.hero { position:absolute; left:0; right:0; width:auto; height:290rpx; border-radius:36rpx; overflow:hidden; text-align:left; }
.hero-orange { background:linear-gradient(125deg,#fff1e8 0%,#ffc49f 100%); }
.hero-dark { background:linear-gradient(125deg,#242426,#111112); }
.hero-copy { position:absolute; z-index:2; left:32rpx; top:35rpx; display:flex; flex-direction:column; }
.hero-kicker { color:#c64b25; font-size:22rpx; font-weight:650; margin-bottom:14rpx; }
.hero-title { font-size:38rpx; line-height:1.28; font-weight:800; white-space:pre-line; }
.hero-btn { margin-top:20rpx; font-size:23rpx; font-weight:700; color:#a33b1d; }
.light { color:#fff; }
.gold { color:#ffd486; }
.hero-food { position:absolute; right:18rpx; bottom:-10rpx; width:270rpx; height:260rpx; background:rgba(255,255,255,.35); border-radius:50%; display:flex; align-items:center; justify-content:center; transform:rotate(-8deg); }
.hero-emoji { font-size:145rpx; }
.float-food { position:absolute; width:66rpx; height:66rpx; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 8rpx 24rpx rgba(112,57,20,.15); }
.f1 { top:5rpx; right:18rpx; }.f2 { bottom:18rpx; left:8rpx; }
.coupon-art { position:absolute; right:34rpx; top:36rpx; }
.ticket { width:176rpx; height:102rpx; transform:rotate(8deg); border-radius:22rpx; background:linear-gradient(135deg,#ffd993,#e8ab50); display:flex; align-items:center; justify-content:center; font-size:50rpx; font-weight:850; color:#5d3b13; box-shadow:0 12rpx 30rpx rgba(0,0,0,.28); }
.ticket.small { width:140rpx; height:84rpx; margin-top:20rpx; margin-left:45rpx; transform:rotate(-7deg); font-size:40rpx; }
.dots { display:flex; justify-content:center; gap:8rpx; }
.dot { width:10rpx; height:10rpx; border-radius:5rpx; background:#d4d4d8; }.dot.on { width:30rpx; background:var(--orange); }
.quick-cards { display:grid; grid-template-columns:1fr 1fr; gap:12rpx; margin-top:20rpx; width:100%; }
.quick-card { min-width:0; width:100%; height:138rpx; border-radius:30rpx; padding:20rpx 18rpx; display:flex; align-items:center; justify-content:space-between; text-align:left; overflow:hidden; box-sizing:border-box; }
.yellow { background:#fff4d5; }.green { background:#e9f7e8; }
.quick-title,.quick-desc { display:block; white-space:nowrap; }.quick-title{font-size:27rpx;font-weight:750;margin-bottom:8rpx}.quick-desc{font-size:21rpx;color:#777}.quick-icon{font-size:54rpx;flex-shrink:0;margin-left:8rpx}
.food-scroll { width:100%; white-space:nowrap; }
.food-row { display:flex; gap:20rpx; padding:2rpx 2rpx 20rpx; }
.food-card { width:300rpx; flex-shrink:0; overflow:hidden; text-align:left; }
.food-visual { height:190rpx; display:flex; align-items:center; justify-content:center; position:relative; font-size:96rpx; }
.food-tag { position:absolute; left:14rpx; top:14rpx; padding:7rpx 12rpx; border-radius:12rpx; background:rgba(255,255,255,.84); color:#aa4728; font-size:18rpx; font-weight:650; }
.food-info { padding:19rpx; }.food-name{display:block;font-size:28rpx;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.food-sales{display:block;font-size:20rpx;color:#999;margin:8rpx 0 13rpx}
.food-info>.between{width:100%;justify-content:flex-start}
.price{color:var(--orange);font-size:31rpx;font-weight:800}.old-price{color:#aaa;text-decoration:line-through;font-size:19rpx;margin-left:7rpx}.add{width:50rpx!important;min-width:50rpx!important;max-width:50rpx!important;height:50rpx;flex:0 0 50rpx;margin-left:auto!important;padding:0!important;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:29rpx;line-height:1}
.section-head .section-more{margin-left:auto;text-align:right}
.section-head .section-more{width:auto!important;min-width:0!important;max-width:none!important;padding:0!important;white-space:nowrap;display:flex;align-items:center;justify-content:flex-end;line-height:1}

.food-visual{overflow:hidden}
.food-svg{width:100%;height:100%;display:block}
.shop-card { width:100%!important; max-width:none!important; padding:24rpx; margin-bottom:20rpx; display:flex; text-align:left; }
.shop-logo { width:112rpx; height:112rpx; flex:0 0 112rpx; flex-shrink:0; border-radius:28rpx; color:#fff; display:flex; align-items:center; justify-content:center; font-size:35rpx; font-weight:800; margin-right:22rpx; }
.shop-main{flex:1;min-width:0}.shop-name{font-size:29rpx;font-weight:750;max-width:330rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shop-distance,.shop-desc{font-size:21rpx;color:#999}.shop-desc{display:block;margin:5rpx 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shop-meta{display:flex;flex-wrap:wrap;gap:4rpx 12rpx;font-size:20rpx;color:#777}.rating{color:#ef8f22;font-weight:700}.shop-offer{font-size:20rpx;color:#a24b38;margin-top:7rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.shop-offer text{background:#fff0ec;padding:3rpx 7rpx;border-radius:6rpx;margin-right:7rpx}
.hero-swiper swiper-item{width:100%}.hero{display:block!important;width:100%!important;max-width:none!important}

/* Iconfont SVG sizing */
.pin image{width:26rpx;height:26rpx;filter:brightness(0) invert(1)}
.search-icon{width:27rpx;height:27rpx;flex-shrink:0;margin-right:10rpx}
.category-icon image{width:50rpx;height:50rpx}
.hero-emoji{width:150rpx;height:150rpx}
.float-food image{width:40rpx;height:40rpx}
.quick-icon{width:62rpx;height:62rpx;flex-shrink:0;margin-left:8rpx}
.food-svg{width:98rpx;height:98rpx}
.food-sales,.rating{display:flex;align-items:center}
.food-sales image,.rating image{width:22rpx;height:22rpx;margin-right:5rpx}
.home-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.home-head{
  position:relative;
  z-index:2;
}
.home-scroll{
  flex:1;
  min-height:0;
  height:0;
}
.home-top-anchor{height:0}
.home-back-top{
  position:fixed;
  z-index:28;
  right:30rpx;
  bottom:calc(174rpx + env(safe-area-inset-bottom));
  width:78rpx!important;
  min-width:78rpx!important;
  max-width:78rpx!important;
  height:78rpx;
  padding:0!important;
  border:1rpx solid rgba(35,35,42,.08);
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
  background:rgba(255,255,255,.96);
  box-shadow:0 10rpx 28rpx rgba(28,31,38,.16);
  animation:backTopIn .2s ease both;
}
.home-back-top.guest-position{
  bottom:calc(276rpx + env(safe-area-inset-bottom));
}
.back-top-arrow{
  width:20rpx;
  height:20rpx;
  margin-top:9rpx;
  border-left:4rpx solid var(--orange);
  border-top:4rpx solid var(--orange);
  transform:rotate(45deg);
}
@keyframes backTopIn{
  from{opacity:0;transform:translateY(12rpx) scale(.92)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
.home-scroll-safe{
  height:calc(250rpx + env(safe-area-inset-bottom));
}

/* Real product photos must fill the complete visual frame. */
.food-visual{
  overflow:hidden;
}
.food-visual .food-svg{
  width:100%!important;
  height:100%!important;
  display:block;
}

</style>
