<template>
<view :style="globalThemeStyle" class="page"><view class="safe-nav" :style="`--status-height:${statusHeight}px`"><view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">优惠券</text><view class="nav-back"></view></view><view class="coupon-tabs"><button hover-class="none" :class="active === 'usable' ? 'on' : ''" data-id="usable" @tap="tab">可使用</button><button hover-class="none" :class="active === 'used' ? 'on' : ''" data-id="used" @tap="tab">已使用/过期</button></view></view>
<view class="coupon-list">
  <block v-for="(item, index) in coupons" :key="item.id">
    <view v-if="(active === 'usable' && !item.used) || (active === 'used' && item.used)" :class="`coupon-card ${item.used ? 'disabled' : ''}`" :data-id="item.id" @tap="use">
      <view class="coupon-amount"><text>¥</text>{{item.amount}}</view>
      <view class="coupon-copy"><text>{{item.title}}</text><text>{{item.threshold ? '满 ¥' + item.threshold + ' 可用' : '无门槛可用'}} · {{item.type}}</text><text>有效期至 {{item.expire}}</text></view>
      <view class="use-btn">{{item.used ? '已使用' : selectMode ? '选择' : '去使用'}}</view>
    </view>
  </block>
  <view v-if="(active === 'usable' && usableCount === 0) || (active === 'used' && usedCount === 0)" class="coupon-empty">
    <view class="empty-icon"><image src="/static/assets/icons/gift.svg" mode="aspectFit" /></view>
    <text>{{active === 'usable' ? '暂无可用优惠券' : '暂无已使用或过期优惠券'}}</text>
    <text>{{active === 'usable' ? (membershipActive ? '本月会员券已使用完，下月将自动更新' : '开通食刻会员后可领取每月专属券包') : '使用过的优惠券会显示在这里'}}</text>
  </view>
  <view class="coupon-note">使用规则：每笔订单限用一张优惠券，不与部分活动同享</view>
</view></view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 优惠券页：展示可用与已使用优惠券，并支持从确认订单页选择优惠券。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import membership from '../../utils/membership.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    coupons: [],
    active: 'usable',
    selectMode: false,
    amount: 0,
    usableCount: 0,
    usedCount: 0,
    membershipActive: false
  },
  onLoad(options) {
    const target = auth.buildUrl('/pages/coupons/coupons', options)
    if (!auth.guardPage(target)) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, selectMode: options.select === '1', amount: Number(options.amount || 0) })
  },
  onShow() { this.refresh() },
  // 按使用状态和订单金额整理当前可展示的优惠券。
  refresh() {
    const coupons = store.get('sk_coupons', [])
    this.setData({
      coupons,
      usableCount: coupons.filter(item => !item.used).length,
      usedCount: coupons.filter(item => item.used).length,
      membershipActive: membership.isActive()
    })
  },
  back() { uni.navigateBack() },
  tab(e) { this.setData({ active: e.currentTarget.dataset.id }) },
  // 选择模式下把优惠券写入订单缓存；普通模式下跳转点餐页。
  use(e) {
    const coupon = this.coupons.find(item => String(item.id) === String(e.currentTarget.dataset.id))
    if (coupon.used) return
    if (this.selectMode) {
      if (this.amount < coupon.threshold) return uni.showToast({ title: `满¥${coupon.threshold}可用`, icon: 'none' })
      store.set('sk_selected_coupon', coupon); uni.navigateBack()
    } else { uni.redirectTo({ url: '/pages/menu/menu' }) }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.coupon-tabs{height:75rpx;display:flex}.coupon-tabs button{flex:1;color:#888;position:relative}.coupon-tabs button.on{color:#222;font-weight:700}.coupon-tabs button.on::after{content:"";position:absolute;bottom:5rpx;left:50%;width:42rpx;height:6rpx;background:var(--orange);border-radius:3rpx;transform:translateX(-50%)}.coupon-list{padding:24rpx}.coupon-card{width:100%;height:190rpx;background:#fff;border-radius:30rpx;display:flex;align-items:center;text-align:left;padding:24rpx;margin-bottom:18rpx;position:relative;overflow:hidden;box-shadow:0 8rpx 25rpx rgba(0,0,0,.05)}.coupon-card::before,.coupon-card::after{content:"";position:absolute;width:30rpx;height:30rpx;border-radius:50%;background:#f5f5f7;right:145rpx}.coupon-card::before{top:-15rpx}.coupon-card::after{bottom:-15rpx}.coupon-amount{width:150rpx;color:var(--orange);font-size:58rpx;font-weight:850}.coupon-amount text{font-size:25rpx}.coupon-copy{flex:1;border-right:2rpx dashed #eee}.coupon-copy text{display:block}.coupon-copy text:first-child{font-size:28rpx;font-weight:750}.coupon-copy text:nth-child(2){font-size:21rpx;color:#777;margin:9rpx 0}.coupon-copy text:last-child{font-size:18rpx;color:#aaa}.use-btn{width:120rpx;text-align:center;color:var(--orange);font-weight:700}.coupon-card.disabled{filter:grayscale(1);opacity:.55}.coupon-note{text-align:center;color:#aaa;font-size:19rpx;padding:25rpx}

.coupon-card{height:176rpx;padding:20rpx}.coupon-card::before,.coupon-card::after{right:116rpx}
.coupon-amount{width:122rpx;flex-shrink:0;font-size:50rpx}.coupon-copy{min-width:0;padding-right:10rpx}
.coupon-copy text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.coupon-copy text:first-child{font-size:26rpx}.coupon-copy text:nth-child(2){font-size:19rpx}.coupon-copy text:last-child{font-size:17rpx}
.use-btn{width:96rpx;flex-shrink:0;font-size:22rpx}
.coupon-card{width:100%!important;max-width:none!important}
.coupon-tabs button{display:flex;align-items:center;justify-content:center;line-height:1}
.coupon-empty{min-height:500rpx;padding:110rpx 28rpx 50rpx;display:flex;flex-direction:column;align-items:center;text-align:center}
.empty-icon{width:112rpx;height:112rpx;border-radius:38rpx;background:var(--orange-soft);display:flex;align-items:center;justify-content:center}
.empty-icon image{width:55rpx;height:55rpx;opacity:.72}
.coupon-empty>text:nth-child(2){margin-top:28rpx;color:#333;font-size:28rpx;font-weight:700}
.coupon-empty>text:nth-child(3){margin-top:12rpx;color:#aaa;font-size:20rpx}

/* 优惠券卡片使用普通容器承载，避免 H5 按钮默认布局把卡片挤成横向并裁切内容。 */
.coupon-list{display:block;min-height:100vh;padding-bottom:80rpx;box-sizing:border-box}
.coupon-card{box-sizing:border-box;display:flex!important;flex:none!important;min-height:176rpx;overflow:hidden}
.coupon-tabs button{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}

</style>
