<template>
<view :style="globalThemeStyle" class="page checkout-page">
  <view class="checkout-head" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">确认订单</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :bounces="false" :show-scrollbar="false" class="checkout-scroll">
    <view class="checkout-scroll-inner">
      <view class="delivery-panel">
        <button hover-class="none" class="address-panel" @tap="chooseAddress">
          <view class="address-pin"><image src="/static/assets/icons/location.svg" mode="aspectFit" /></view>
          <view v-if="address" class="address-main">
            <text class="address-detail">{{ addressDisplay }}</text>
            <text class="address-user">{{ address.name }} {{ address.gender }} · {{ address.phone }}</text>
          </view>
          <view v-else class="address-main">
            <text class="address-detail">请选择收货地址</text>
            <text class="address-user">完善地址后才能配送</text>
          </view>
          <text class="arrow">›</text>
        </button>
        <view class="delivery-divider"></view>
        <view class="time-panel">
          <view><text class="time-label">送达时间</text><text class="time-safe">准时宝保障</text></view>
          <button hover-class="none" @tap="showTime">{{ deliveryTime }} ›</button>
        </view>
      </view>

      <view class="checkout-content">
        <view class="order-goods card">
          <text class="shop-title">食刻·品质厨房</text>
          <view v-for="item in cart" :key="item.key" class="goods-row">
            <view class="goods-visual" :style="`background:${item.bg || '#f6e2c9'}`"><image :src="item.icon" mode="aspectFill" /></view>
            <view class="goods-name"><text>{{ item.name }}</text><text>{{ item.spec }}</text></view>
            <text class="goods-count">×{{ item.count }}</text><text class="goods-price">¥{{ item.price * item.count }}</text>
          </view>
          <view class="bill-row"><text>包装费</text><text>¥{{ packingFee }}</text></view>
          <view class="bill-row"><text>配送费 <text v-if="membershipTier === 'pro'" class="plus-badge">PRO</text></text><text :class="membershipTier === 'pro' ? 'plus-saving' : ''">{{ deliveryFee === 0 ? 'PRO免配送费' : '¥' + deliveryFee }}</text></view>
          <view class="bill-row"><text><text class="offer-badge">减</text> 店铺满减</text><text class="orange">-¥{{ discount }}</text></view>
          <view v-if="membershipActive && memberDiscount > 0" class="bill-row"><text><text class="offer-badge plus">{{ membershipTier === 'pro' ? 'PRO' : 'PLUS' }}</text> 会员专享价 {{ memberDiscountText }}</text><text class="orange">-¥{{ memberDiscount }}</text></view>
          <button hover-class="none" class="bill-row" @tap="chooseCoupon"><text><text class="offer-badge coupon">券</text> 优惠券</text><text class="orange">{{ coupon ? '-¥' + couponDiscount : coupons.length + '张可用 ›' }}</text></button>
          <view class="subtotal">共 {{ cart.length }} 件商品　小计 <text>¥{{ total }}</text></view>
        </view>

        <view class="option-card card">
          <button hover-class="none" class="option-row" @tap="setRemark"><text>订单备注</text><text>{{ remark || '口味、偏好等' }} ›</text></button>
          <button hover-class="none" class="option-row" @tap="showTableware"><text>餐具数量</text><text>{{ tableware || '请选择' }} ›</text></button>
          <view class="option-row"><text>发票</text><text class="muted">暂不支持</text></view>
        </view>
        <view class="green-tip"><image src="/static/assets/icons/fruit.svg" mode="aspectFit" /><text>选择无需餐具，为环保减碳做贡献</text></view>
      </view>
    </view>
  </scroll-view>

  <view class="submit-bar">
    <view><text>合计</text><text class="submit-price">¥{{ total }}</text><text class="save-tip">已优惠 ¥{{ discount + couponDiscount + memberDiscount }}</text></view>
    <button hover-class="none" :disabled="submitting" @tap="submit">{{ submitting ? '正在提交…' : '提交订单' }}</button>
  </view>

  <view v-if="timeVisible" class="mask" @tap="closeTime">
    <view class="sheet" @tap.stop="noop">
      <view class="handle"></view><text class="sheet-title">选择送达时间</text>
      <button hover-class="none" data-time="立即配送（约30分钟）" @tap="pickTime"><text>立即配送</text><text>约 30 分钟送达</text></button>
      <button hover-class="none" data-time="今天 19:00-19:15" @tap="pickTime"><text>今天 19:00-19:15</text><text>预约配送</text></button>
      <button hover-class="none" data-time="今天 19:30-19:45" @tap="pickTime"><text>今天 19:30-19:45</text><text>预约配送</text></button>
    </view>
  </view>
  <view v-if="tablewareVisible" class="mask" @tap="closeTableware">
    <view class="sheet tableware-sheet" @tap.stop="noop">
      <view class="handle"></view><text class="sheet-title">选择餐具数量</text>
      <button v-for="item in tablewareOptions" :key="item" hover-class="none" :data-value="item" @tap="pickTableware"><text>{{ item }}</text><text :class="tableware === item ? 'tableware-selected' : ''">{{ tableware === item ? '已选择' : '›' }}</text></button>
    </view>
  </view>
  <view v-if="showRemark" class="mask" @tap="closeRemark">
    <view class="sheet remark-sheet" @tap.stop="noop">
      <view class="handle"></view><text class="sheet-title">订单备注</text>
      <textarea maxlength="80" placeholder="请输入口味、包装等要求" :value="remark" @input="remarkInput"></textarea>
      <view class="quick-remarks"><button v-for="item in quickRemarks" :key="item" hover-class="none" :data-text="item" @tap="pickQuick">{{ item }}</button></view>
      <button hover-class="none" class="primary-btn" @tap="saveRemark">保存备注</button>
    </view>
  </view>
</view>
</template>
<script>
import adaptPage from '@/utils/page-adapter.js'
// 纭璁㈠崟椤碉細姹囨€诲晢鍝併€佸湴鍧€銆侀厤閫併€佷紭鎯犮€侀鍏峰拰澶囨敞锛屽苟鐢熸垚寰呮敮浠樿鍗曡崏绋裤€?

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import membership from '../../utils/membership.js'
import orderBackend from '../../utils/order-backend.js'
import benefitBackend from '../../utils/benefit-backend.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    cart: [],
    address: null,
    addressDisplay: '',
    coupon: null,
    coupons: [],
    goodsTotal: 0,
    deliveryFee: 3,
    packingFee: 2,
    discount: 8,
    couponDiscount: 0,
    memberDiscount: 0,
    membershipActive: false,
    membershipTier: '',
    memberDiscountText: '',
    total: 0,
    remark: '',
    quickRemarks: ['不要辣', '少放盐', '多点米饭', '不要香菜', '餐品分装'],
    tableware: '',
    tablewareOptions: ['无需餐具', '1份餐具', '2份餐具', '3份餐具'],
    deliveryTime: '立即配送（约30分钟）',
    timeVisible: false,
    showRemark: false,
    tablewareVisible: false,
    submitting: false
  },
  onLoad() {
    if (!auth.guardPage('/pages/checkout/checkout')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  // 鍔犺浇璐墿杞︺€佺敤鎴烽€夊畾鍦板潃銆佷紭鎯犲埜鍜屼細鍛樻潈鐩娿€?
  onShow() {
    this.renderCheckout()
    if (store.isLogin()) {
      benefitBackend.syncBenefits()
        .then(() => this.renderCheckout())
        .catch(err => console.error('sync benefits failed', err))
    }
  },
  renderCheckout() {
    const cart = store.getCart().filter(item => item.checked)
    const addresses = store.getAddresses()
    const defaultAddress = store.getDefaultAddress()
    const selectedAddress = store.get('sk_selected_address', null)
    const selected = selectedAddress && addresses.find(item => item.id === selectedAddress.id)
    const address = selected || defaultAddress || null
    const coupon = store.get('sk_selected_coupon', null)
    const membershipActive = membership.isActive()
    const membershipTier = membershipActive ? membership.getTier() : ''
    const tierConfig = membershipActive ? membership.getTierConfig(membershipTier) : null
    this.setData({
      cart,
      address,
      addressDisplay: store.getCompactAddress(address),
      coupon,
      membershipActive,
      membershipTier,
      memberDiscountText: tierConfig ? tierConfig.discountText : '',
      deliveryFee: membership.hasFreeDelivery() ? 0 : 3,
      coupons: store.get('sk_coupons', []).filter(item => !item.used)
    })
    this.calculate()
  },
  // 缁熶竴璁＄畻鍟嗗搧銆佸寘瑁呫€侀厤閫併€佹弧鍑忋€佷紭鎯犲埜銆佷細鍛樻姌鎵ｅ拰瀹炰粯閲戦銆?
  calculate() {
    const goodsTotal = Number(this.cart.reduce((sum, item) => sum + item.price * item.count, 0).toFixed(2))
    const couponDiscount = this.coupon && goodsTotal >= this.coupon.threshold ? this.coupon.amount : 0
    const memberDiscount = membership.getMemberDiscount(goodsTotal)
    const total = Number(Math.max(0.01, goodsTotal + this.deliveryFee + this.packingFee - this.discount - couponDiscount - memberDiscount).toFixed(2))
    this.setData({ goodsTotal, couponDiscount, memberDiscount, total })
  },
  back() { uni.navigateBack() },
  chooseAddress() { uni.navigateTo({ url: '/pages/address/address?select=1' }) },
  chooseCoupon() { uni.navigateTo({ url: `/pages/coupons/coupons?select=1&amount=${this.goodsTotal}` }) },
  showTime() { this.setData({ timeVisible: true }) },
  pickTime(e) { this.setData({ deliveryTime: e.currentTarget.dataset.time, timeVisible: false }) },
  closeTime() { this.setData({ timeVisible: false }) },
  remarkInput(e) { this.setData({ remark: e.detail.value }) },
  setRemark() { this.setData({ showRemark: true }) },
  closeRemark() { this.setData({ showRemark: false }) },
  pickQuick(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ remark: this.remark ? `${this.remark}，${text}` : text })
  },
  saveRemark() { this.setData({ showRemark: false }) },
  showTableware() { this.setData({ tablewareVisible: true }) },
  closeTableware() { this.setData({ tablewareVisible: false }) },
  pickTableware(e) { this.setData({ tableware: e.currentTarget.dataset.value, tablewareVisible: false }) },
  async submit() {
    if (this.submitting) return
    if (!this.address) return uni.showToast({ title: '璇烽€夋嫨鏀惰揣鍦板潃', icon: 'none' })
    if (!this.tableware) {
      this.setData({ tablewareVisible: true })
      return
    }
    const draft = {
      items: this.cart, address: this.address, coupon: this.coupon,
      goodsTotal: this.goodsTotal, deliveryFee: this.deliveryFee, packingFee: this.packingFee,
      discount: this.discount, couponDiscount: this.couponDiscount, memberDiscount: this.memberDiscount,
      membershipActive: this.membershipActive, membershipTier: this.membershipTier, total: this.total,
      remark: this.remark, tableware: this.tableware, deliveryTime: this.deliveryTime
    }
    store.set('sk_order_draft', draft)
    this.setData({ submitting: true })
    try {
      const order = await orderBackend.createOrder(draft)
      const orderedKeys = this.cart.map(item => item.key)
      const remainingCart = store.getCart().filter(item => !orderedKeys.includes(item.key))
      store.set('sk_cart', remainingCart)
      await orderBackend.clearCart(orderedKeys)
      uni.redirectTo({
        url: `/pages/pay/pay?amount=${this.total}&existing=${order.id}`,
        fail: err => {
          this.setData({ submitting: false })
          console.error('enter cashier failed', err)
          uni.showToast({ title: '收银台加载失败，请重试', icon: 'none' })
        }
      })
    } catch (err) {
      this.setData({ submitting: false })
      console.error('create order failed', err)
      uni.showToast({ title: '提交订单失败，请稍后重试', icon: 'none' })
    }
  },
  noop() {}
}

export default adaptPage(pageConfig)
</script>

<style>
.checkout-head{background:linear-gradient(180deg,var(--orange-soft),#f5f5f7);padding:0 24rpx 12rpx}.address-panel{width:100%;display:flex;align-items:center;text-align:left;padding:22rpx 6rpx}.address-pin{width:68rpx;height:68rpx;border-radius:23rpx;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:35rpx;margin-right:18rpx}.address-main{flex:1}.address-detail,.address-user{display:block}.address-detail{font-size:32rpx;font-weight:750}.address-user{font-size:22rpx;color:#777;margin-top:8rpx}.arrow{font-size:45rpx;color:#aaa}.time-panel{height:96rpx;display:flex;align-items:center;justify-content:space-between;padding:0 23rpx}.time-label{font-weight:700;margin-right:10rpx}.time-safe{font-size:18rpx;color:#1e9b5b;background:#e9f8ef;border-radius:8rpx;padding:5rpx 7rpx}.time-panel button{color:var(--orange);font-size:22rpx}.checkout-content{padding:10rpx 24rpx 190rpx}.order-goods,.option-card{padding:27rpx;margin-bottom:20rpx}.shop-title{font-size:30rpx;font-weight:750;display:block;margin-bottom:20rpx}.goods-row{display:flex;align-items:center;padding:16rpx 0}.goods-visual{width:116rpx;height:116rpx;border-radius:24rpx;display:flex;align-items:center;justify-content:center;font-size:55rpx}.goods-name{flex:1;padding-left:16rpx}.goods-name text{display:block}.goods-name text:first-child{font-weight:650}.goods-name text:last-child{font-size:19rpx;color:#999;margin-top:8rpx}.goods-count{font-size:22rpx;color:#777;margin-right:18rpx}.goods-price{font-weight:650}.bill-row,.option-row{width:100%;height:80rpx;border-top:1rpx solid #f1f1f3;display:flex;align-items:center;justify-content:space-between;text-align:left}.offer-badge{background:var(--orange-soft);color:var(--orange);padding:4rpx 7rpx;border-radius:7rpx;font-size:18rpx;margin-right:8rpx}.offer-badge.coupon{background:#fff2d7;color:#e99116}.subtotal{text-align:right;padding-top:21rpx}.subtotal text{font-size:35rpx;font-weight:800;color:var(--orange)}.option-row>text:last-child,.option-row picker{color:#999;font-size:22rpx}.green-tip{text-align:center;color:#409665;font-size:21rpx}.submit-bar{position:fixed;z-index:60;bottom:0;left:0;right:0;height:132rpx;padding:0 24rpx env(safe-area-inset-bottom);background:#fff;display:flex;align-items:center}.submit-bar>view{flex:1}.submit-price{font-size:38rpx;color:var(--orange);font-weight:850;margin-left:8rpx}.save-tip{font-size:19rpx;color:var(--orange);margin-left:8rpx}.submit-bar>button{height:86rpx;border-radius:29rpx;background:var(--orange);color:#fff;padding:0 36rpx;font-weight:750}.mask{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.35);display:flex;align-items:flex-end}.sheet{width:100%;background:#fff;border-radius:40rpx 40rpx 0 0;padding:18rpx 30rpx calc(30rpx + env(safe-area-inset-bottom))}.handle{width:74rpx;height:8rpx;border-radius:4rpx;background:#ddd;margin:0 auto 25rpx}.sheet-title{font-size:34rpx;font-weight:750;display:block;margin-bottom:20rpx}.sheet>button:not(.primary-btn){height:95rpx;border-top:1rpx solid #eee;display:flex;align-items:center;justify-content:space-between;text-align:left}.sheet>button text:last-child{color:#999;font-size:22rpx}.remark-sheet textarea{width:100%;height:170rpx;border-radius:25rpx;background:#f5f5f7;padding:20rpx}.quick-remarks{display:flex;flex-wrap:wrap;gap:12rpx;margin:20rpx 0 30rpx}.quick-remarks button{padding:13rpx 18rpx;border-radius:18rpx;background:#f2f2f5;font-size:22rpx}

.address-main{min-width:0}.address-detail{font-size:29rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.address-user{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.time-panel{min-height:96rpx;height:auto;padding:16rpx 20rpx;gap:12rpx}.time-panel>view{flex-shrink:0}.time-panel button{flex:1;min-width:0;text-align:right;line-height:1.35}
.checkout-page .order-goods,.checkout-page .option-card{padding:23rpx}.checkout-page .goods-visual{width:104rpx;height:104rpx;flex-shrink:0;font-size:49rpx}.checkout-page .goods-name{min-width:0;padding-left:13rpx}
.checkout-page .goods-name text:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.checkout-page .goods-count{margin:0 12rpx;flex-shrink:0}.checkout-page .goods-price{flex-shrink:0}
.checkout-page .bill-row>text:last-child,.checkout-page .option-row>text:last-child,.checkout-page .option-row picker{max-width:390rpx;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.submit-bar{min-height:126rpx;height:auto;padding:13rpx 22rpx calc(13rpx + env(safe-area-inset-bottom));gap:12rpx}
.submit-bar>view{min-width:0;white-space:nowrap}.submit-price{font-size:34rpx}.save-tip{display:block;margin-left:0;font-size:17rpx}
.submit-bar>button{height:78rpx;flex-shrink:0;border-radius:27rpx;padding:0 28rpx}
.address-panel,.bill-row,.option-row{width:100%!important;max-width:none!important}.submit-bar>button{width:auto!important}
.submit-bar>button{width:210rpx!important;height:78rpx;flex:0 0 210rpx;padding:0;display:flex;align-items:center;justify-content:center;line-height:1}
.address-pin image{width:34rpx;height:34rpx;filter:brightness(0) invert(1)}
.checkout-page .goods-visual image{width:56rpx;height:56rpx}
.green-tip{display:flex;align-items:center;justify-content:center}
.green-tip image{width:25rpx;height:25rpx;margin-right:8rpx}

/* Only the title bar is fixed; address and all order content scroll together. */
.checkout-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.checkout-head{
  flex-shrink:0;
  position:relative;
  z-index:20;
  padding-left:24rpx;
  padding-right:24rpx;
  padding-bottom:0;
  background:#fff3ed;
}
.checkout-scroll{
  flex:1;
  min-height:0;
  height:0;
}
.checkout-scroll-inner{
  padding:12rpx 24rpx calc(150rpx + env(safe-area-inset-bottom));
}
.checkout-scroll .time-panel{margin:0 0 10rpx}
.checkout-scroll .checkout-content{padding:0}

/* Floating capsule action/status bars. */
.time-panel{
  border-radius:999rpx;
}
.submit-bar{
  left:24rpx;
  right:24rpx;
  bottom:calc(18rpx + env(safe-area-inset-bottom));
  min-height:102rpx;
  padding:12rpx 12rpx 12rpx 22rpx;
  border-radius:999rpx;
  box-shadow:0 10rpx 32rpx rgba(28,28,32,.13);
}
.submit-bar>button{
  border-radius:999rpx;
}
  .time-safe,
  .offer-badge{
    border-radius:999rpx;
  }
  .plus-badge{margin-left:7rpx;padding:3rpx 8rpx;border-radius:999rpx;background:linear-gradient(135deg,#f6d69f,#c9914d);color:#53381d;font-size:14rpx;font-weight:800}
  .offer-badge.plus{background:linear-gradient(135deg,#f7e0b8,#d3a15f);color:#64431e;font-size:14rpx;font-weight:800}
  .plus-saving{color:#b77735;font-weight:700}

.checkout-head .nav-row{
  margin-bottom:0;
}
.delivery-panel{
  overflow:hidden;
  margin-bottom:20rpx;
  border:1rpx solid rgba(28,28,32,.035);
  border-radius:30rpx;
  background:rgba(255,255,255,.94);
  box-shadow:0 8rpx 26rpx rgba(28,28,32,.05);
}
.address-panel{
  min-height:112rpx;
  padding:20rpx 22rpx!important;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
.address-pin{
  width:42rpx;
  height:42rpx;
  flex:0 0 42rpx;
  margin-right:16rpx;
  border-radius:0;
  background:transparent;
}
.address-pin image{
  width:32rpx;
  height:32rpx;
  filter:none;
  opacity:.7;
}
.address-detail{
  font-size:29rpx;
  line-height:1.35;
}
.address-user{
  margin-top:7rpx;
  color:#8e8e93;
}
.address-panel .arrow{
  margin-left:12rpx;
  font-size:34rpx;
  color:#b2b2b7;
}
.delivery-divider{
  height:1rpx;
  margin:0 22rpx;
  background:#eeeeF1;
}
.delivery-panel .time-panel{
  min-height:88rpx;
  margin:0;
  padding:14rpx 22rpx;
  border-radius:0;
  background:transparent;
  box-shadow:none;
}
.tableware-selected{color:var(--orange)!important;font-weight:650}
.checkout-page .goods-visual{overflow:hidden}.checkout-page .goods-visual image{width:100%;height:100%;display:block}
.checkout-scroll-inner{
  padding-top:16rpx;
}

/* 璁㈠崟閫夐」鏄櫧鑹插崱鐗囦腑鐨勬棤搴曡壊琛岋紝鍘婚櫎 H5 鎸夐挳榛樿鐏板簳鍜岃竟妗嗐€?*/
.time-panel button,
.checkout-page .bill-row,
.checkout-page .option-row,
.checkout-page .bill-row::after,
.checkout-page .option-row::after{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}

/* 鎭㈠纭璁㈠崟鐨勬í鍚戜俊鎭竷灞€锛岄伩鍏嶆枃鏈鎸夐挳榛樿瑙勫垯鎸ゆ垚绔栨帓銆?*/
.checkout-page .order-goods{display:block!important;width:100%;box-sizing:border-box;overflow:hidden}
.checkout-page .shop-title{display:block!important;width:100%;white-space:nowrap;word-break:keep-all;writing-mode:horizontal-tb!important}
.checkout-page .goods-row{display:flex!important;flex-wrap:nowrap!important;width:100%;box-sizing:border-box}
.checkout-page .goods-name{min-width:0;flex:1 1 auto}
.checkout-page .goods-count,.checkout-page .goods-price{flex:0 0 auto;white-space:nowrap}
.checkout-page .bill-row,.checkout-page .option-row{display:flex!important;flex-wrap:nowrap!important;width:100%;box-sizing:border-box}
.checkout-page .bill-row>text,.checkout-page .option-row>text{white-space:nowrap;word-break:keep-all;writing-mode:horizontal-tb!important}
.checkout-page .bill-row>text:first-child,.checkout-page .option-row>text:first-child{min-width:0;flex:1 1 auto}
.checkout-page .bill-row>text:last-child,.checkout-page .option-row>text:last-child{flex:0 0 auto}
.checkout-page .option-row>text:first-child{font-size:25rpx;font-weight:500;line-height:1.2}
.checkout-page .option-row>text:last-child{font-size:22rpx}
.checkout-page .bill-row .offer-badge.coupon{font-size:22rpx;color:#555;background:transparent;padding:0;margin-right:0}
.checkout-page .bill-row .offer-badge.coupon + text{font-size:25rpx;font-weight:500}
.checkout-page .bill-row>text:first-child{font-size:25rpx;font-weight:500}

/* 璐圭敤鍜岄€夐」琛岀粺涓€鍩虹嚎锛氬乏渚ф爣棰樸€佸彸渚ц鏄庨兘椤剁瀵归綈锛岄伩鍏嶁€滃娉?椁愬叿鈥濈湅璧锋潵姣斿彂绁ㄩ珮浣庝笉涓€銆?*/
.checkout-page .bill-row,
.checkout-page .option-row{
  min-height:80rpx!important;
  height:80rpx!important;
  padding:0!important;
  align-items:center!important;
}
.checkout-page .bill-row>text:first-child,
.checkout-page .option-row>text:first-child{
  display:flex!important;
  align-items:center!important;
  height:80rpx!important;
  min-width:0!important;
  color:#111!important;
  font-size:25rpx!important;
  font-weight:500!important;
  line-height:1!important;
}
.checkout-page .bill-row>text:last-child,
.checkout-page .option-row>text:last-child{
  display:flex!important;
  align-items:center!important;
  justify-content:flex-end!important;
  height:80rpx!important;
  max-width:390rpx!important;
  margin-left:18rpx!important;
  color:#999;
  font-size:22rpx!important;
  font-weight:400!important;
  line-height:1!important;
  text-align:right!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
.checkout-page .bill-row>text:last-child.orange{
  color:var(--orange)!important;
  font-size:25rpx!important;
}
.checkout-page .bill-row .offer-badge,
.checkout-page .bill-row .offer-badge.coupon{
  width:32rpx!important;
  min-width:32rpx!important;
  height:32rpx!important;
  margin-right:10rpx!important;
  padding:0!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  border-radius:999rpx!important;
  font-size:18rpx!important;
  font-weight:500!important;
  line-height:1!important;
}
.checkout-page .bill-row .offer-badge.coupon{
  background:#fff2d7!important;
  color:#e99116!important;
}
.checkout-page .bill-row .offer-badge.coupon + text,
.checkout-page .bill-row .offer-badge + text{
  display:inline!important;
  font-size:25rpx!important;
  font-weight:500!important;
  line-height:1!important;
}

/* 椁愬叿鏁伴噺寮瑰眰涓殑姣忎竴椤规槸绾櫧鍒楄〃琛岋紝鍘绘帀 uni-app H5 button 榛樿娴呯伆搴曘€?*/
.checkout-page .tableware-sheet>button,
.checkout-page .tableware-sheet uni-button,
.checkout-page .sheet.tableware-sheet>button{
  background:transparent!important;
  background-color:transparent!important;
  box-shadow:none!important;
  border-left:0!important;
  border-right:0!important;
  border-radius:0!important;
}
.checkout-page .tableware-sheet>button::after,
.checkout-page .tableware-sheet uni-button::after,
.checkout-page .sheet.tableware-sheet>button::after{
  display:none!important;
  border:0!important;
  background:transparent!important;
}

</style>

