<template>
<view class="result-page" :style="`${globalThemeStyle};padding-top:${statusHeight}px`">
  <view :class="`success-icon ${businessType === 'membership' ? 'member-success-icon' : ''} member-success-${memberTier}`"><image src="/static/assets/icons/success.svg" mode="aspectFit" /></view><text class="success-title">{{businessType === 'membership' ? membershipResultTitle : businessType === 'walletRecharge' ? '充值成功' : '支付成功'}}</text><text class="success-desc">{{businessType === 'membership' ? '会员权益已经到账，即刻开始享受' : businessType === 'walletRecharge' ? '充值金额已存入食刻钱包' : method + '已完成，商家正在接单'}}</text>
  <view v-if="method === '食刻钱包支付' && walletDiscount !== '0.00'" class="discount-result"><view><text>惠</text><text>食刻钱包支付优惠</text></view><text>本单已减 ¥{{walletDiscount}}</text></view>
  <view v-if="businessType === 'membership'" :class="`member-arrival-card member-arrival-${memberTier}`">
    <view class="arrival-head"><text>{{planName}}</text><text>有效期至 {{expireText}}</text></view>
    <view class="arrival-benefits">
      <view><image src="/static/assets/icons/gift.svg" mode="aspectFit" /><text>{{couponCount}} 张券已到账</text></view>
      <view><image src="/static/assets/icons/payment.svg" mode="aspectFit" /><text>餐品会员 {{memberDiscountText}}</text></view>
      <view><image :src="freeDelivery ? '/static/assets/icons/delivery.svg' : '/static/assets/icons/bell.svg'" mode="aspectFit" /><text>{{freeDelivery ? '配送费全免' : '优惠活动优先知'}}</text></view>
      <view><image src="/static/assets/icons/star-filled.svg" mode="aspectFit" /><text>{{themeCount}} 款全局主题已解锁</text></view>
    </view>
  </view>
  <view class="result-card card"><view><text>{{businessType === 'walletRecharge' ? '充值金额' : '支付金额'}}</text><text>{{businessType === 'membership' ? '支付编号' : businessType === 'walletRecharge' ? '充值编号' : '订单编号'}}</text><text>{{businessType === 'membership' ? '会员状态' : businessType === 'walletRecharge' ? '到账状态' : '预计送达'}}</text></view><view><text>¥{{amount}}</text><text>{{id}}</text><text class="orange">{{businessType === 'membership' ? '已生效' : businessType === 'walletRecharge' ? '已到账' : '约 30 分钟'}}</text></view></view>
  <button hover-class="none" class="primary-btn" @tap="detail">{{businessType === 'membership' ? '查看会员权益' : businessType === 'walletRecharge' ? '查看钱包' : '查看订单'}}</button><button hover-class="none" class="secondary-btn" @tap="home">{{businessType === 'membership' || businessType === 'walletRecharge' ? '返回我的' : '返回首页'}}</button>
  <view v-if="businessType === 'food'" class="progress"><view class="progress-item done"><view class="progress-dot"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></view><view><text>支付成功</text><text>订单已提交</text></view></view><view class="line"></view><view class="progress-item active"><view class="progress-dot">2</view><view><text>商家制作</text><text>预计 15 分钟</text></view></view><view class="line"></view><view class="progress-item"><view class="progress-dot">3</view><view><text>骑手配送</text><text>送餐上门</text></view></view></view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 支付结果页：根据业务类型展示结果，并跳转到订单、钱包或会员中心。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import membership from '../../utils/membership.js'
import wallet from '../../utils/wallet.js'
import benefitBackend from '../../utils/benefit-backend.js'
const pageConfig = {
  data: { statusHeight: 20, id: '', method: '快捷支付', amount: '0.00', walletDiscount: '0.00', businessType: 'food', planName: '', memberTier: 'plus', memberShortName: 'PLUS', membershipResultTitle: 'PLUS 开通成功', memberDiscountText: '95折', freeDelivery: false, themeCount: 2, expireText: '', couponCount: 0 },
  // 根据业务类型读取支付结果，准备减免金额和结果文案。
  onLoad(options) {
    const target = auth.buildUrl('/pages/pay-result/pay-result', options)
    if (!auth.guardPage(target)) return
    const method = options.method === 'alipay' ? '支付宝支付' : options.method === 'wallet' ? '食刻钱包支付' : '快捷支付'
    if (options.type === 'walletRecharge') {
      const recharge = wallet.getRechargeOrder(options.id)
      this.setData({
        statusHeight: getApp().globalData.statusBarHeight,
        id: options.id,
        method,
        businessType: 'walletRecharge',
        amount: recharge ? Number(recharge.amount).toFixed(2) : '0.00'
      })
      return
    }
    if (options.type === 'membership') {
      benefitBackend.syncBenefits().catch(err => console.error('sync benefits on pay result failed', err))
      const payment = membership.getPayment(options.id)
      const current = membership.getMembership()
      const memberTier = current ? current.tier : payment && payment.tier || 'plus'
      const tierConfig = membership.getTierConfig(memberTier)
      this.setData({
        statusHeight: getApp().globalData.statusBarHeight,
        id: options.id,
        method,
        businessType: 'membership',
        amount: payment ? Number(payment.paidAmount || payment.amount).toFixed(2) : '0.00',
        walletDiscount: payment ? Number(payment.walletDiscount || 0).toFixed(2) : '0.00',
        planName: payment ? payment.planName : '食刻 PLUS',
        memberTier,
        memberShortName: tierConfig.shortName,
        membershipResultTitle: payment && payment.operation === 'upgrade' ? 'PRO 升级成功' : `${tierConfig.shortName} 开通成功`,
        memberDiscountText: tierConfig.discountText,
        freeDelivery: tierConfig.freeDelivery,
        themeCount: memberTier === 'pro' ? 4 : 2,
        expireText: current ? membership.formatDate(current.expireAt) : '',
        couponCount: store.get('sk_coupons', []).filter(item => item.source === 'plus' && item.tier === memberTier && !item.used).length
      })
      return
    }
    const order = store.get('sk_orders', []).find(item => item.id === options.id)
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      id: options.id,
      method,
      amount: order ? Number(order.total).toFixed(2) : '0.00',
      walletDiscount: order ? Number(order.walletDiscount || 0).toFixed(2) : '0.00'
    })
  },
  // 将用户带到对应的订单详情、钱包或会员中心。
  detail() {
    if (this.businessType === 'walletRecharge') {
      uni.reLaunch({ url: '/pages/wallet/wallet' })
      return
    }
    if (this.businessType === 'membership') {
      uni.reLaunch({ url: '/pages/plus/plus' })
      return
    }
    uni.reLaunch({
      url: `/pages/order-detail/order-detail?id=${this.id}&from=payResult`
    })
  },
  home() {
    uni.reLaunch({
      url: this.businessType === 'membership'
        ? '/pages/profile/profile'
        : this.businessType === 'walletRecharge'
          ? '/pages/profile/profile'
          : '/pages/home/home'
    })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.result-page{min-height:100vh;padding-left:34rpx;padding-right:34rpx;text-align:center;background:linear-gradient(180deg,#eaf8ef,#f5f5f7 45%)}.success-icon{width:138rpx;height:138rpx;border-radius:69rpx;background:#20b26b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:76rpx;margin:100rpx auto 25rpx;box-shadow:0 18rpx 40rpx rgba(32,178,107,.25)}.success-title{display:block;font-size:44rpx;font-weight:800}.success-desc{display:block;color:#777;margin:12rpx 0 38rpx}.result-card{display:flex;justify-content:space-between;text-align:left;padding:28rpx;margin-bottom:28rpx}.result-card>view{display:flex;flex-direction:column;gap:22rpx}.result-card>view:last-child{text-align:right;font-weight:650}.secondary-btn{margin-top:16rpx}.progress{margin-top:55rpx;text-align:left;padding:0 35rpx}.progress-item{display:flex;align-items:center;color:#aaa}.progress-item>text{width:48rpx;height:48rpx;border-radius:24rpx;background:#ddd;color:#fff;display:flex;align-items:center;justify-content:center;margin-right:18rpx}.progress-item>view text{display:block}.progress-item>view text:last-child{font-size:20rpx;margin-top:3rpx}.progress-item.done>text,.progress-item.active>text{background:#20b26b}.progress-item.done,.progress-item.active{color:#222}.line{height:42rpx;border-left:3rpx dashed #ccc;margin-left:23rpx}

.result-page{padding-bottom:35rpx}.success-icon{width:116rpx;height:116rpx;font-size:64rpx;margin:65rpx auto 20rpx}.success-title{font-size:40rpx}.success-desc{margin-bottom:28rpx}
.result-card{padding:24rpx}.result-card>view{min-width:0}.result-card>view:last-child{max-width:420rpx}.result-card>view:last-child text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.primary-btn,.secondary-btn{height:84rpx}.progress{margin-top:38rpx}
.success-icon image{width:72rpx;height:72rpx;filter:brightness(0) invert(1)}
.progress-item>.progress-dot{width:48rpx;height:48rpx;border-radius:24rpx;background:#ddd;color:#fff;display:flex;align-items:center;justify-content:center;margin-right:18rpx;flex-shrink:0}
.progress-item.done>.progress-dot,.progress-item.active>.progress-dot{background:#20b26b}
.progress-dot image{width:22rpx;height:22rpx;filter:brightness(0) invert(1)}
.discount-result{margin:0 0 18rpx;padding:20rpx 24rpx;border:1rpx solid var(--theme-border);border-radius:28rpx;background:linear-gradient(135deg,var(--orange-soft),var(--orange-soft));display:flex;align-items:center;justify-content:space-between;text-align:left;color:var(--orange);box-shadow:0 8rpx 24rpx var(--theme-shadow)}.discount-result>view{display:flex;align-items:center}.discount-result>view>text:first-child{width:38rpx;height:38rpx;margin-right:11rpx;border-radius:12rpx;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18rpx;font-weight:800}.discount-result>view>text:last-child{font-size:21rpx;font-weight:650}.discount-result>text{font-size:24rpx;font-weight:800}
.member-success-icon{background:linear-gradient(145deg,#e1b66f,#a97839);box-shadow:0 18rpx 40rpx rgba(169,120,57,.25)}
.member-success-plus{background:linear-gradient(145deg,#b9c0c7,#6f7a86);box-shadow:0 18rpx 40rpx rgba(83,96,110,.22)}
.member-arrival-card{margin-bottom:20rpx;padding:26rpx;border-radius:32rpx;background:linear-gradient(145deg,#282426,#4b3a2d);color:#f6dfbc;text-align:left;box-shadow:0 15rpx 36rpx rgba(52,40,30,.18)}
.member-arrival-plus{background:linear-gradient(145deg,#707985,#bfc5cb);color:#fff}
.member-arrival-plus .arrival-head text:last-child{color:rgba(255,255,255,.72)}
.arrival-head{display:flex;align-items:center;justify-content:space-between;padding-bottom:20rpx;border-bottom:1rpx solid rgba(255,255,255,.1)}
.arrival-head text:first-child{font-size:28rpx;font-weight:800}.arrival-head text:last-child{font-size:18rpx;color:#cab99f}
.arrival-benefits{display:grid;grid-template-columns:1fr 1fr;gap:20rpx 14rpx;margin-top:22rpx}
.arrival-benefits view{display:flex;align-items:center;font-size:19rpx}.arrival-benefits image{width:31rpx;height:31rpx;margin-right:10rpx;filter:sepia(1) saturate(.7) brightness(1.55)}

</style>
