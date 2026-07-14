<template>
<view :style="globalThemeStyle" :class="`page plus-page tier-${activeTier}`">
  <view class="plus-nav safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">会员中心</text>
      <view class="nav-back"></view>
    </view>
  </view>

  <scroll-view scroll-y :bounces="false" :show-scrollbar="false" class="plus-scroll">
    <view class="plus-content">
      <view class="member-carousel" @touchstart="tierTouchStart" @touchend="tierTouchEnd">
        <view class="member-track" :style="`transform:translate3d(${tierTranslate},0,0)`">
        <view v-for="(item, index) in tierCards" :key="item.id" class="member-slide">
          <view :class="`hero-card hero-${item.id} ${currentTier === item.id ? 'active-member' : ''}`">
            <view class="hero-glow glow-one"></view><view class="hero-glow glow-two"></view>
            <text class="hero-watermark">{{item.shortName}}</text>
            <view class="brand-row">
              <view class="brand-copy"><view><text>{{item.id === 'pro' ? '食刻会员' : '食刻'}}</text><text>{{item.shortName}}</text></view><text>{{item.subtitle}}</text></view>
              <text :class="`status-tag ${currentTier === item.id ? 'active' : ''}`">{{currentTier === item.id ? '已开通' : currentTier === 'plus' && item.id === 'pro' ? '可升级' : currentTier === 'pro' && item.id === 'plus' ? '已升级' : '尚未开通'}}</text>
            </view>
            <view class="member-row">
              <image v-if="user && user.avatar" class="member-avatar" :src="user.avatar" mode="aspectFill" />
              <view v-else class="member-avatar avatar-fallback"><image src="/static/assets/icons/user.svg" mode="aspectFit" /></view>
              <view class="member-copy"><text>{{user && user.nickname ? user.nickname : '食刻用户'}}</text><text>{{currentTier === item.id ? '有效期至 ' + membershipExpireText : item.savingText}}</text></view>
            </view>
            <view class="hero-summary">
              <view><text>{{currentTier === item.id ? memberCouponCount + '张' : '¥' + item.couponValue}}</text><text>{{currentTier === item.id ? '当前可用券' : '每月券包'}}</text></view>
              <view class="summary-line"></view>
              <view><text>{{currentTier === item.id ? membershipDaysLeft + '天' : item.discountText}}</text><text>{{currentTier === item.id ? '剩余有效期' : '会员餐品价'}}</text></view>
              <view class="summary-line"></view>
              <view><text>{{item.themeText}}</text><text>专属全局主题</text></view>
            </view>
          </view>
        </view>
        </view>
      </view>
      <view v-if="tierCards.length > 1" class="tier-dots"><view v-for="(item, index) in tierCards" :key="item.id" :class="tierIndex === index ? 'on' : ''"></view></view>

      <view v-if="membershipActive && currentTier === activeTier" class="member-active-card">
        <view class="active-card-head"><view><text>{{view.shortName}} 权益已生效</text><text>本月权益将在点餐时自动使用</text></view><text>会员中</text></view>
        <view class="active-benefit-row">
          <view><image src="/static/assets/icons/gift.svg" mode="aspectFit" /><text>每月券包</text><text>{{memberCouponCount}} 张可用</text></view>
          <view><image src="/static/assets/icons/payment.svg" mode="aspectFit" /><text>会员折扣</text><text>餐品 {{view.discountText}}</text></view>
          <view><image :src="activeTier === 'pro' ? '/static/assets/icons/delivery.svg' : '/static/assets/icons/star-filled.svg'" mode="aspectFit" /><text>{{activeTier === 'pro' ? '配送权益' : '专属主题'}}</text><text>{{activeTier === 'pro' ? '配送费全免' : '2款已解锁'}}</text></view>
        </view>
      </view>

      <view v-if="isUpgrade" class="upgrade-card">
        <view><text>PLUS 升级 PRO</text><text>保留当前有效期，仅需补齐剩余 {{upgradeQuote.remainingDays}} 天差价</text></view>
        <text>¥{{upgradeQuote.amount}}</text>
      </view>

      <view class="section-block benefit-section">
        <view class="section-title-row"><view><text class="section-title">{{view.shortName}} 会员权益</text><text class="section-subtitle">当前卡片下的权益与价格同步切换</text></view><text class="title-badge">{{activeTier === 'pro' ? '高阶权益' : '轻享权益'}}</text></view>
        <view :class="`benefit-grid ${activeTier === 'pro' ? 'pro-grid' : ''}`">
          <view v-for="(item, index) in view.benefits" :key="item.name" class="benefit-item"><view class="benefit-icon"><image :src="item.icon" mode="aspectFit" /></view><text class="benefit-name">{{item.name}}</text><text class="benefit-desc">{{item.desc}}</text></view>
        </view>
        <button hover-class="none" class="compare-toggle" @tap="toggleComparison"><text>{{comparisonExpanded ? '收起权益对比' : '展开权益对比'}}</text><view :class="`compare-arrow ${comparisonExpanded ? 'expanded' : ''}`"></view></button>
        <view :class="`compare-expand ${comparisonExpanded ? 'expanded' : ''}`">
          <view class="compare-table">
            <view class="compare-head"><text>会员权益</text><view class="normal-head"><text>普通用户</text></view><view class="plus-head"><text>{{view.shortName}}</text><text>推荐</text></view></view>
            <view v-for="(item, index) in view.comparisons" :key="item.name" class="compare-row">
              <text class="compare-name">{{item.name}}</text>
              <view class="compare-value normal-value"><view v-if="item.normal" class="compare-mark check-mark"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></view><view v-else class="compare-mark cross-mark">×</view></view>
              <view class="compare-value plus-value"><view :class="`compare-mark ${item.enabled === false ? 'cross-mark' : 'check-mark plus-check'}`">{{item.enabled === false ? '×' : ''}}<image v-if="item.enabled !== false" src="/static/assets/icons/check.svg" mode="aspectFit" /></view><text>{{item.value}}</text></view>
            </view>
          </view>
        </view>
      </view>

      <view class="section-block coupon-section">
        <view class="section-title-row"><view><text class="section-title">每月专属券包</text><text class="section-subtitle">价值 ¥{{view.couponValue}} · 每月自动更新</text></view><view class="coupon-total"><text>¥</text><text>{{view.couponValue}}</text></view></view>
        <scroll-view scroll-x :show-scrollbar="false" class="coupon-scroll"><view class="coupon-list"><view v-for="(item, index) in view.coupons" :key="item.amount" class="coupon-card"><view class="coupon-value"><text>¥</text><text>{{item.amount}}</text></view><text class="coupon-condition">{{item.condition}}</text><view class="coupon-bottom"><text>{{view.shortName}} 专享</text><text>{{item.count}}</text></view></view></view></scroll-view>
      </view>

      <view class="section-block plan-section">
        <view class="section-title-row"><view><text class="section-title">{{isUpgrade ? '补款升级 PRO' : membershipActive && currentTier === activeTier ? '续费' + view.shortName : '选择' + view.shortName + '方案'}}</text><text class="section-subtitle">{{isUpgrade ? '升级后立即享受 PRO 权益，有效期保持不变' : membershipActive && currentTier === activeTier ? '续费时长将在当前有效期后累加' : '选择适合你的会员周期'}}</text></view></view>
        <view v-if="isUpgrade" class="upgrade-detail"><view><text>当前等级</text><text>食刻 PLUS</text></view><view><text>升级等级</text><text>食刻会员 PRO</text></view><view><text>剩余有效期</text><text>{{upgradeQuote.remainingDays}} 天</text></view><view><text>应补差价</text><text>¥{{upgradeQuote.amount}}</text></view></view>
        <view v-else class="plan-list">
          <button v-for="(item, index) in plans" :key="item.id" hover-class="none" :class="`plan-card ${selectedPlanId === item.id ? 'selected' : ''}`" :data-id="item.id" @tap="selectPlan"><text class="plan-tag">{{item.tag}}</text><text class="plan-name">{{item.name}}</text><view class="plan-price"><text>¥</text><text>{{item.price}}</text><text>/{{item.unit}}</text></view><text class="plan-original">{{item.original}}</text><view class="plan-check"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></view></button>
        </view>
      </view>

      <view class="section-block service-section"><text class="section-title">更多会员服务</text><view v-for="(item, index) in view.services" :key="item.name" class="service-row"><view><view class="service-icon"><image :src="item.icon" mode="aspectFit" /></view><view><text>{{item.name}}</text><text>{{item.desc}}</text></view></view><text>{{item.tag}}</text></view></view>
      <button hover-class="none" class="member-orders-entry" @tap="goMemberOrders">
        <text>会员订单</text>
        <text>›</text>
      </button>
      <view class="content-safe"></view>
    </view>
  </scroll-view>

  <view class="plus-bottom-shell"><view class="plus-bottom"><view class="bottom-price"><text>{{ctaDisabled ? '当前等级' : isUpgrade ? '补款金额' : '应付'}}</text><view v-if="!ctaDisabled"><text>¥</text><text>{{selectedPlanPrice}}</text><text v-if="!isUpgrade">/{{selectedPlanUnit}}</text></view><view v-else><text class="current-pro-text">PRO</text></view></view><button hover-class="none" :class="ctaDisabled ? 'disabled' : ''" @tap="openMembership">{{ctaText}}</button></view></view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 会员中心页：展示 PLUS/PRO 权益、方案切换、续费升级与会员订单入口。

import auth from '../../utils/auth.js'
import store from '../../utils/store.js'
import membership from '../../utils/membership.js'
import benefitBackend from '../../utils/benefit-backend.js'
// PLUS 与 PRO 的页面文案、券包、权益和对比数据配置。
const tierViews = {
  plus: {
    id: 'plus',
    name: '食刻 PLUS',
    shortName: 'PLUS',
    subtitle: '轻享品质点餐会员',
    savingText: '每月预计可省 ¥24+',
    couponValue: 24,
    couponCount: 6,
    discountText: '95折',
    themeText: '2款',
    benefits: [
      { icon: '/static/assets/icons/gift.svg', name: '每月券包', desc: '每月可领 ¥24' },
      { icon: '/static/assets/icons/star.svg', name: '会员专享价', desc: '餐品享 95 折' },
      { icon: '/static/assets/icons/star-filled.svg', name: '专属主题', desc: '解锁 2 款主题' },
      { icon: '/static/assets/icons/bell.svg', name: '优惠提前知', desc: '活动优先提醒' }
    ],
    coupons: [
      { amount: '6', condition: '满 30 元可用', count: '2 张' },
      { amount: '4', condition: '满 20 元可用', count: '2 张' },
      { amount: '2', condition: '无门槛可用', count: '2 张' }
    ],
    comparisons: [
      { name: '基础优惠活动', normal: true, value: '优先参与' },
      { name: '每月专属券包', normal: false, value: '¥24 券包' },
      { name: '会员专享价', normal: false, value: '餐品 95 折' },
      { name: '配送费减免', normal: false, enabled: false, value: '暂不包含' },
      { name: '全局限定主题', normal: false, value: '解锁 2 款' }
    ],
    services: [
      { icon: '/static/assets/icons/payment.svg', name: '专属会员价', desc: '餐品金额享 95 折，单笔最高减 ¥10', tag: '自动生效' },
      { icon: '/static/assets/icons/bell.svg', name: '优惠提前知', desc: '新品与限时活动优先提醒', tag: '抢先享' },
      { icon: '/static/assets/icons/star.svg', name: 'PLUS 全局主题', desc: '鎏金浅影与霜银疏光专属解锁', tag: '2款主题' }
    ]
  },
  pro: {
    id: 'pro',
    name: '食刻会员 PRO',
    shortName: 'PRO',
    subtitle: '高阶品质点餐会员',
    savingText: '每月预计可省 ¥60+',
    couponValue: 40,
    couponCount: 8,
    discountText: '92折',
    themeText: '4款',
    benefits: [
      { icon: '/static/assets/icons/gift.svg', name: '每月券包', desc: '每月可领 ¥40' },
      { icon: '/static/assets/icons/payment.svg', name: '高阶折扣', desc: '餐品享 92 折' },
      { icon: '/static/assets/icons/delivery.svg', name: '配送全免', desc: '每单免配送费' },
      { icon: '/static/assets/icons/star-filled.svg', name: '全局主题', desc: '解锁全部 4 款' },
      { icon: '/static/assets/icons/fire.svg', name: '折扣上限', desc: '单笔最高减 ¥20' },
      { icon: '/static/assets/icons/success.svg', name: '升级礼遇', desc: '升级即领 PRO 券' }
    ],
    coupons: [
      { amount: '8', condition: '满 30 元可用', count: '2 张' },
      { amount: '6', condition: '满 25 元可用', count: '2 张' },
      { amount: '4', condition: '满 20 元可用', count: '2 张' },
      { amount: '2', condition: '无门槛可用', count: '2 张' }
    ],
    comparisons: [
      { name: '基础优惠活动', normal: true, value: '优先参与' },
      { name: '每月专属券包', normal: false, value: '¥40 券包' },
      { name: '会员专享价', normal: false, value: '餐品 92 折' },
      { name: '配送费减免', normal: false, value: '每单全免' },
      { name: '全局限定主题', normal: false, value: '解锁 4 款' },
      { name: '单笔折扣上限', normal: false, value: '最高减 ¥20' }
    ],
    services: [
      { icon: '/static/assets/icons/payment.svg', name: 'PRO 高阶会员价', desc: '餐品金额享 92 折，单笔最高减 ¥20', tag: '更省' },
      { icon: '/static/assets/icons/delivery.svg', name: '配送费全免', desc: '有效期内每笔订单自动免配送费', tag: '每单可享' },
      { icon: '/static/assets/icons/star-filled.svg', name: '全部全局主题', desc: '含凝金沉迹、星夜幽痕 PRO 限定色', tag: '4款主题' },
      { icon: '/static/assets/icons/success.svg', name: '升级礼遇', desc: 'PLUS 补款升级后立即发放 PRO 券包', tag: '即时到账' }
    ]
  }
}

const pageConfig = {
  data: {
    statusHeight: 20,
    user: null,
    membershipActive: false,
    membership: null,
    currentTier: '',
    activeTier: 'plus',
    tierCards: [],
    tierIndex: 0,
    tierTranslate: '0rpx',
    tierTouchStartX: 0,
    view: tierViews.plus,
    membershipExpireText: '',
    membershipDaysLeft: 0,
    memberCouponCount: 0,
    selectedPlanId: 'month',
    selectedPlanPrice: '9.9',
    selectedPlanUnit: '月',
    plans: [],
    comparisonExpanded: false,
    isUpgrade: false,
    upgradeQuote: null,
    ctaText: '立即开通',
    ctaDisabled: false
  },

  onLoad() {
    if (!auth.guardPage('/pages/plus/plus')) return
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      user: store.get('sk_user', null)
    })
  },

  // 同步当前会员等级，并决定默认展示的会员卡片。
  onShow() {
    this.renderMemberCenter()
    benefitBackend.syncBenefits()
      .then(() => this.renderMemberCenter())
      .catch(err => console.error('sync member benefits failed', err))
  },

  renderMemberCenter() {
    const current = membership.syncCurrent()
    const membershipActive = membership.isActive()
    const currentTier = membershipActive ? membership.getTier() : ''
    const tierCards = [tierViews.plus, tierViews.pro]
    const becamePro = currentTier === 'pro' && this.currentTier !== 'pro'
    const activeTier = currentTier === 'pro'
      ? (becamePro ? 'pro' : (this.activeTier || 'pro'))
      : (this.activeTier === 'pro' ? 'pro' : 'plus')
    const tierIndex = Math.max(0, tierCards.findIndex(item => item.id === activeTier))
    this.setData({
      user: store.get('sk_user', null),
      membershipActive,
      membership: current,
      currentTier,
      activeTier,
      tierCards,
      tierIndex,
      tierTranslate: tierIndex === 1 ? 'calc(-100% - 20rpx)' : '0rpx',
      membershipExpireText: membershipActive ? membership.formatDate(current.expireAt) : '',
      membershipDaysLeft: membershipActive ? membership.daysLeft(current) : 0
    }, () => this.applyTierView(activeTier))
  },

  back() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
      return
    }
    uni.reLaunch({ url: '/pages/profile/profile' })
  },

  tierTouchStart(e) {
    this.setData({ tierTouchStartX: e.touches[0].clientX })
  },

  // 根据横向滑动距离切换 PLUS/PRO 卡片。
  tierTouchEnd(e) {
    const distance = e.changedTouches[0].clientX - this.tierTouchStartX
    let tierIndex = this.tierIndex
    if (distance < -45) tierIndex = Math.min(this.tierCards.length - 1, tierIndex + 1)
    if (distance > 45) tierIndex = Math.max(0, tierIndex - 1)
    const card = this.tierCards[tierIndex]
    if (!card) return
    this.setData({
      tierIndex,
      activeTier: card.id,
      tierTranslate: tierIndex === 1 ? 'calc(-100% - 20rpx)' : '0rpx',
      comparisonExpanded: false
    })
    this.applyTierView(card.id)
  },

  // 切换卡片后只更新下方内容主题和方案，不让内容跟随横向滑动。
  applyTierView(tier) {
    const view = tierViews[tier] || tierViews.plus
    const isUpgrade = this.currentTier === 'plus' && tier === 'pro'
    const upgradeQuote = isUpgrade ? membership.getUpgradeQuote(this.membership) : null
    const plans = membership.getPlans(tier)
    const selectedPlan = plans.find(item => item.id === this.selectedPlanId) || plans[0]
    const activeOwnTier = this.membershipActive && this.currentTier === tier
    const proViewingPlus = this.currentTier === 'pro' && tier === 'plus'
    const memberCouponCount = this.membershipActive
      ? store.get('sk_coupons', []).filter(item => item.source === 'plus' && item.tier === this.currentTier && !item.used).length
      : 0
    this.setData({
      view,
      plans,
      selectedPlanId: selectedPlan.id,
      selectedPlanPrice: isUpgrade && upgradeQuote ? upgradeQuote.amount.toFixed(2) : String(selectedPlan.price),
      selectedPlanUnit: isUpgrade ? '补差价' : selectedPlan.unit,
      isUpgrade,
      upgradeQuote,
      memberCouponCount,
      ctaText: proViewingPlus ? '当前已是 PRO 会员' : isUpgrade ? '补款升级 PRO' : activeOwnTier ? '立即续费' : `立即开通 ${view.shortName}`,
      ctaDisabled: proViewingPlus
    })
  },

  cardStatus(tier) {
    if (this.currentTier === tier) return '已开通'
    if (this.currentTier === 'plus' && tier === 'pro') return '可升级'
    return '尚未开通'
  },

  selectPlan(e) {
    if (this.isUpgrade) return
    const id = e.currentTarget.dataset.id
    const plan = this.plans.find(item => item.id === id)
    if (!plan) return
    this.setData({
      selectedPlanId: plan.id,
      selectedPlanPrice: String(plan.price),
      selectedPlanUnit: plan.unit
    })
  },

  toggleComparison() {
    this.setData({ comparisonExpanded: !this.comparisonExpanded })
  },

  goMemberOrders() {
    uni.navigateTo({ url: '/pages/member-orders/member-orders' })
  },

  // 开通前检查待支付会员订单，再创建开通、续费或升级订单。
  async openMembership() {
    if (this.ctaDisabled) return uni.showToast({ title: '当前已享受更高等级 PRO 权益', icon: 'none' })
    let pending = null
    try {
      pending = await benefitBackend.getPendingMemberOrder()
    } catch (err) {
      console.error('fetch pending member order failed', err)
      pending = membership.getPendingPayment()
    }
    if (pending) {
      uni.showModal({
        title: '存在待支付会员订单',
        content: '请先支付或取消当前待支付的会员订单，再继续开通其他会员。',
        confirmText: '查看订单',
        cancelText: '暂不处理',
        success: res => {
          if (res.confirm) uni.navigateTo({ url: '/pages/member-orders/member-orders' })
        }
      })
      return
    }
    try {
      const payment = await benefitBackend.createMemberOrder(this.selectedPlanId, this.activeTier)
      if (!payment) return uni.showToast({ title: '当前会员等级无需变更', icon: 'none' })
      uni.navigateTo({
        url: `/pages/pay/pay?type=membership&payment=${payment.id}&amount=${payment.amount}`
      })
    } catch (err) {
      uni.showToast({ title: err.message || '会员订单创建失败', icon: 'none' })
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.plus-page{
  height:100vh;
  min-height:0;
  padding-bottom:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:linear-gradient(180deg,#f4efe8 0,#f7f7f9 38%,#f5f5f7 100%);
}
.plus-nav{
  flex:none;
  position:relative;
  z-index:10;
  background:rgba(247,244,239,.94);
  backdrop-filter:blur(18px);
}
.plus-scroll{flex:1;min-height:0}
.plus-content{padding:18rpx 24rpx 0}
.member-carousel{position:relative;width:100%;height:390rpx;overflow:hidden;background:transparent;border-radius:42rpx;transform:translateZ(0)}
.member-track{width:100%;height:390rpx;display:flex;align-items:stretch;gap:20rpx;transition:transform .3s cubic-bezier(.22,.61,.36,1);will-change:transform}
.member-slide{position:relative;width:100%;height:390rpx;flex:0 0 100%;overflow:hidden;border-radius:42rpx;background:transparent;clip-path:inset(0 round 42rpx)}
.member-slide .hero-card{box-sizing:border-box;width:100%;height:390rpx;min-height:390rpx;margin:0;border-radius:42rpx}
.tier-dots{height:30rpx;display:flex;align-items:flex-end;justify-content:center;gap:9rpx}
.tier-dots view{width:10rpx;height:10rpx;border-radius:999rpx;background:#c9c9cd;transition:.22s}
.tier-dots view.on{width:30rpx;background:var(--member-accent)}

.tier-plus{
  --member-accent:#66717e;
  --member-border:#9da6b0;
  --member-soft:#e9edf1;
  --member-deep:#333b45;
  --member-text:#3f4954;
  --member-gradient:linear-gradient(135deg,#aeb6bf,#596471);
  background:linear-gradient(180deg,#e4e7eb 0,#f2f3f5 38%,#f5f5f7 100%);
}
.tier-pro{
  --member-accent:#b68443;
  --member-border:#d0aa69;
  --member-soft:#f8eedc;
  --member-deep:#61452a;
  --member-text:#775328;
  --member-gradient:linear-gradient(135deg,#d9b66e,#9d6c32);
  background:linear-gradient(180deg,#f4efe8 0,#f7f7f9 38%,#f5f5f7 100%);
}
.tier-plus .plus-nav{background:rgba(235,238,242,.96)}
.tier-pro .plus-nav{background:rgba(247,244,239,.94)}

.hero-card{
  position:relative;
  min-height:390rpx;
  padding:32rpx;
  overflow:hidden;
  border:1rpx solid rgba(255,231,192,.2);
  border-radius:42rpx;
  color:#fff4e1;
  background:
    radial-gradient(circle at 88% 5%,rgba(227,181,112,.22),transparent 35%),
    linear-gradient(145deg,#171719 0,#292526 52%,#47392d 100%);
  box-shadow:0 24rpx 54rpx rgba(50,39,29,.22);
}
.hero-plus{
  color:#fff;
  border-color:rgba(255,255,255,.32);
  background:
    linear-gradient(112deg,transparent 0%,rgba(255,255,255,.08) 31%,rgba(255,255,255,.24) 43%,rgba(255,255,255,.04) 55%,transparent 68%),
    radial-gradient(circle at 91% 5%,rgba(255,255,255,.3),transparent 29%),
    linear-gradient(145deg,#252b33 0%,#46515d 36%,#77828e 68%,#aeb6be 100%);
  box-shadow:
    0 24rpx 54rpx rgba(38,46,56,.25),
    inset 0 1rpx 0 rgba(255,255,255,.38),
    inset 0 -1rpx 0 rgba(14,19,25,.22);
}
.hero-plus::after{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  pointer-events:none;
  opacity:.28;
  background:repeating-linear-gradient(105deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1rpx,transparent 1rpx,transparent 7rpx);
}
.hero-pro{
  color:#fff4e1;
  border-color:rgba(255,231,192,.2);
  background:
    radial-gradient(circle at 88% 5%,rgba(227,181,112,.22),transparent 35%),
    linear-gradient(145deg,#171719 0,#292526 52%,#47392d 100%);
}
.hero-plus .brand-copy>view text:first-child{color:#fff;text-shadow:0 2rpx 8rpx rgba(0,0,0,.22)}
.hero-plus .brand-copy>view text:last-child,.hero-plus .hero-summary>view>text:first-child{color:#edf2f6}
.hero-plus .brand-copy>text,.hero-plus .member-copy text:last-child,.hero-plus .hero-summary>view>text:last-child{color:rgba(244,247,250,.76)}
.hero-plus .member-avatar{border-color:rgba(255,255,255,.75)}
.hero-plus .status-tag{color:#f8fafc;background:rgba(15,20,27,.18);border-color:rgba(255,255,255,.3);backdrop-filter:blur(10px)}
.hero-plus .status-tag.active{color:#303943;background:linear-gradient(135deg,#f7f9fb,#bec6ce);box-shadow:inset 0 1rpx rgba(255,255,255,.8)}
.hero-plus .hero-watermark{color:rgba(255,255,255,.055);text-shadow:0 1rpx rgba(255,255,255,.1)}
.hero-plus .hero-summary{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.06);backdrop-filter:none}
.hero-plus .summary-line{background:rgba(255,255,255,.2)}
.hero-glow{position:absolute;border-radius:50%;filter:blur(5rpx);pointer-events:none}
.glow-one{width:260rpx;height:260rpx;right:-80rpx;top:-110rpx;background:rgba(255,204,126,.13)}
.glow-two{width:170rpx;height:170rpx;left:-75rpx;bottom:-85rpx;background:rgba(255,126,73,.09)}
.hero-watermark{
  position:absolute;
  right:-22rpx;
  bottom:44rpx;
  color:rgba(255,255,255,.035);
  font-size:114rpx;
  font-weight:900;
  letter-spacing:4rpx;
  transform:rotate(-8deg);
}
.brand-row,.member-row,.hero-summary{position:relative;z-index:1}
.brand-row{display:flex;align-items:center}
.brand-copy{flex:1}
.brand-copy>view{display:flex;align-items:baseline;gap:9rpx}
.brand-copy>view text:first-child{font-size:28rpx;font-weight:850}
.brand-copy>view text:last-child{font-size:21rpx;font-weight:800;letter-spacing:2rpx;color:#eac78f}
.brand-copy>text{display:block;margin-top:4rpx;color:#bdb2a4;font-size:19rpx}
.status-tag{
  padding:8rpx 14rpx;border-radius:999rpx;
  color:#dfc49a;background:rgba(255,235,203,.1);
  border:1rpx solid rgba(255,229,190,.16);font-size:18rpx;
}
.status-tag.active{color:#3f2c17;background:linear-gradient(135deg,#ffe8b8,#d9aa68);border-color:transparent;font-weight:750}
.hero-card.active-member{
  background:
    radial-gradient(circle at 88% 5%,rgba(247,204,132,.28),transparent 36%),
    linear-gradient(145deg,#171719 0,#2d2725 48%,#5a432b 100%);
}
.hero-plus.active-member{
  background:
    linear-gradient(112deg,transparent 0%,rgba(255,255,255,.08) 31%,rgba(255,255,255,.24) 43%,rgba(255,255,255,.04) 55%,transparent 68%),
    radial-gradient(circle at 91% 5%,rgba(255,255,255,.3),transparent 29%),
    linear-gradient(145deg,#252b33 0%,#46515d 36%,#77828e 68%,#aeb6be 100%);
}
.member-row{display:flex;align-items:center;margin-top:42rpx}
.member-avatar{width:82rpx;height:82rpx;border-radius:50%;border:3rpx solid rgba(255,230,190,.8);background:#fff}
.avatar-fallback{display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12)}
.avatar-fallback image{width:42rpx;height:42rpx;filter:brightness(0) invert(1);opacity:.9}
.member-copy{margin-left:18rpx;display:flex;flex-direction:column;gap:8rpx}
.member-copy text:first-child{font-size:29rpx;font-weight:750}
.member-copy text:last-child{font-size:20rpx;color:#c9bdad}
.hero-summary{
  height:102rpx;margin-top:34rpx;padding:0 12rpx;
  display:flex;align-items:center;justify-content:space-around;
  border-radius:26rpx;background:rgba(255,255,255,.07);
  border:1rpx solid rgba(255,255,255,.06);
}
.hero-summary>view:not(.summary-line){flex:1;display:flex;flex-direction:column;align-items:center;gap:7rpx}
.hero-summary>view>text:first-child{font-size:29rpx;font-weight:850;color:#ffe3b5}
.hero-summary>view>text:last-child{font-size:18rpx;color:#bdb5ab}
.summary-line{width:1rpx;height:38rpx;background:rgba(255,255,255,.16)}
.member-active-card{
  margin-top:22rpx;padding:27rpx 25rpx;border-radius:36rpx;
  background:linear-gradient(145deg,#fff9ee,#f6e7cd);
  border:1rpx solid rgba(193,139,73,.18);
  box-shadow:0 12rpx 35rpx rgba(115,79,37,.08);
}
.tier-plus .member-active-card{
  background:linear-gradient(145deg,#f8fafb,#e3e7eb);
  border-color:rgba(81,95,110,.2);
  box-shadow:0 12rpx 35rpx rgba(49,61,74,.1);
}
.tier-plus .active-card-head>view text:first-child,.tier-plus .active-benefit-row text:nth-child(2){color:#46515d}
.tier-plus .active-card-head>view text:last-child,.tier-plus .active-benefit-row text:last-child{color:#7c8793}
.tier-plus .active-card-head>text{background:var(--member-gradient)}
.upgrade-card{
  margin-top:22rpx;padding:25rpx 27rpx;border-radius:34rpx;
  display:flex;align-items:center;justify-content:space-between;
  color:#59422a;background:linear-gradient(145deg,#fff8eb,#f5e3c3);
  border:1rpx solid rgba(190,139,76,.18);box-shadow:0 12rpx 30rpx rgba(95,67,36,.07);
}
.upgrade-card>view{display:flex;flex-direction:column;gap:7rpx}
.upgrade-card>view text:first-child{font-size:27rpx;font-weight:800}
.upgrade-card>view text:last-child{font-size:18rpx;color:#987a59}
.upgrade-card>text{font-size:35rpx;font-weight:850;color:#9a672e}
.active-card-head{display:flex;align-items:center;justify-content:space-between}
.active-card-head>view{display:flex;flex-direction:column;gap:7rpx}
.active-card-head>view text:first-child{font-size:29rpx;font-weight:800;color:#3f3021}
.active-card-head>view text:last-child{font-size:19rpx;color:#9a8062}
.active-card-head>text{padding:7rpx 13rpx;border-radius:999rpx;background:#d2a05e;color:#fff;font-size:17rpx;font-weight:700}
.active-benefit-row{display:grid;grid-template-columns:repeat(3,1fr);margin-top:25rpx}
.active-benefit-row>view{position:relative;display:flex;flex-direction:column;align-items:center;gap:7rpx}
.active-benefit-row>view:not(:last-child)::after{content:"";position:absolute;right:0;top:9rpx;bottom:9rpx;width:1rpx;background:rgba(121,87,47,.15)}
.active-benefit-row image{width:34rpx;height:34rpx;opacity:.72}
.active-benefit-row text:nth-child(2){font-size:20rpx;font-weight:700;color:#5c4935}
.active-benefit-row text:last-child{font-size:17rpx;color:#a08464}

.section-block{
  margin-top:22rpx;padding:28rpx;
  border:1rpx solid rgba(30,30,35,.035);
  border-radius:36rpx;background:rgba(255,255,255,.96);
  box-shadow:0 12rpx 36rpx rgba(41,41,50,.055);
}
.section-title-row{display:flex;align-items:center;justify-content:space-between}
.section-title-row>view:first-child{display:flex;flex-direction:column;gap:7rpx}
.section-title{font-size:31rpx;font-weight:800;color:#202024}
.section-subtitle{font-size:20rpx;color:#9a9a9f}
.title-badge{
  padding:7rpx 13rpx;border-radius:999rpx;
  color:#8c6232;background:#fbefd9;font-size:17rpx;font-weight:650;
}
.tier-plus .title-badge{color:#56616c;background:#e9edf1}
.tier-pro .title-badge{color:#8c6232;background:#fbefd9}
.benefit-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8rpx;margin-top:28rpx}
.benefit-grid.pro-grid{grid-template-columns:repeat(3,1fr);row-gap:26rpx}
.benefit-item{min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center}
.benefit-icon{
  width:78rpx;height:78rpx;border-radius:25rpx;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg,#fff7e9,#f6e6cc);
  box-shadow:inset 0 1rpx rgba(255,255,255,.8);
}
.benefit-icon image{width:38rpx;height:38rpx;filter:sepia(1) saturate(.9) hue-rotate(350deg) brightness(.8)}
.tier-plus .benefit-icon{background:linear-gradient(145deg,#f4f6f8,#e4e8ec)}
.tier-plus .benefit-icon image{filter:grayscale(1) brightness(.72)}
.benefit-name{margin-top:13rpx;font-size:21rpx;font-weight:720;color:#333337;white-space:nowrap}
.benefit-desc{margin-top:5rpx;font-size:16rpx;color:#a1a1a6;white-space:nowrap;transform:scale(.92)}
.compare-toggle{
  width:100%;
  height:74rpx;
  margin-top:23rpx;
  border-top:1rpx solid #f0efed;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10rpx;
  color:var(--member-text);
  font-size:20rpx;
  font-weight:650;
  line-height:1;
}
.compare-arrow{
  width:13rpx;
  height:13rpx;
  margin-top:-6rpx;
  border-right:2rpx solid var(--member-accent);
  border-bottom:2rpx solid var(--member-accent);
  transform:rotate(45deg);
  transform-origin:center;
  transition:transform .25s ease;
}
.compare-arrow.expanded{
  margin-top:6rpx;
  transform:rotate(225deg);
}
.compare-expand{
  max-height:0;
  opacity:0;
  overflow:hidden;
  transform:translateY(-8rpx);
  transition:max-height .32s ease,opacity .22s ease,transform .3s ease;
}
.compare-expand.expanded{
  max-height:720rpx;
  opacity:1;
  transform:translateY(0);
}

.coupon-total{display:flex;align-items:baseline;color:var(--member-text)}
.coupon-total text:first-child{font-size:20rpx}
.coupon-total text:last-child{font-size:41rpx;font-weight:850}
.coupon-scroll{width:100%;margin-top:24rpx;white-space:nowrap}
.coupon-list{display:inline-flex;gap:14rpx;padding-right:6rpx}
.coupon-card{
  width:220rpx;height:198rpx;padding:22rpx 20rpx 16rpx;
  display:inline-flex;flex-direction:column;
  border:1rpx solid var(--member-border);border-radius:27rpx;
  background:linear-gradient(150deg,#fff,var(--member-soft));
}
.coupon-value{display:flex;align-items:baseline;color:var(--member-accent)}
.coupon-value text:first-child{font-size:24rpx;font-weight:800}
.coupon-value text:last-child{font-size:50rpx;font-weight:900}
.coupon-condition{margin-top:5rpx;color:#665649;font-size:19rpx}
.coupon-bottom{
  margin-top:auto;padding-top:13rpx;border-top:1rpx dashed #e8cdaa;
  display:flex;align-items:center;justify-content:space-between;
  color:var(--member-text);font-size:17rpx;
}

.compare-table{
  margin-top:16rpx;
  overflow:hidden;
  border:1rpx solid #eee9e2;
  border-radius:27rpx;
  background:#fff;
}
.compare-head,.compare-row{
  display:grid;
  grid-template-columns:1.35fr .82fr 1.08fr;
  align-items:stretch;
}
.compare-head{
  min-height:82rpx;
  background:#faf9f7;
  color:#77777c;
  font-size:19rpx;
  font-weight:650;
}
.compare-head>text,.compare-head>view{
  display:flex;
  align-items:center;
  justify-content:center;
}
.compare-head>text{justify-content:flex-start;padding-left:21rpx}
.normal-head{border-left:1rpx solid #eeece8}
.plus-head{
  position:relative;
  gap:7rpx;
  border-left:1rpx solid rgba(203,151,82,.18);
  color:var(--member-text);
  background:linear-gradient(145deg,#fff,var(--member-soft));
}
.plus-head>text:last-child{
  padding:3rpx 7rpx;
  border-radius:999rpx;
  color:#fff;
  background:var(--member-accent);
  font-size:13rpx;
  font-weight:700;
}
.compare-row{
  min-height:91rpx;
  border-top:1rpx solid #f0efed;
  color:#444449;
}
.compare-name{
  padding:0 14rpx 0 21rpx;
  display:flex;
  align-items:center;
  font-size:20rpx;
  font-weight:620;
}
.compare-value{
  min-width:0;
  display:flex;
  align-items:center;
  justify-content:center;
  border-left:1rpx solid #f0efed;
}
.plus-value{
  gap:7rpx;
  background:var(--member-soft);
  color:var(--member-text);
}
.plus-value>text{
  min-width:0;
  font-size:16rpx;
  white-space:nowrap;
}
.compare-mark{
  width:31rpx;
  height:31rpx;
  flex-shrink:0;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
}
.check-mark{background:#e9ece9}
.check-mark image{width:19rpx;height:19rpx;opacity:.62}
.plus-check{background:var(--member-gradient)}
.plus-check image{filter:brightness(0) invert(1);opacity:1}
.cross-mark{
  color:#b5b5ba;
  background:#f0f0f2;
  font-size:23rpx;
  font-weight:500;
  line-height:1;
}

.plan-list{display:flex;gap:12rpx;margin-top:25rpx}
.plan-card{
  position:relative;flex:1;min-width:0;height:190rpx;padding:31rpx 10rpx 16rpx;
  overflow:hidden;border:2rpx solid #ececef;border-radius:27rpx;
  display:flex;flex-direction:column;align-items:center;
  background:#fafafd;color:#333;
}
.plan-card.selected{
  border-color:var(--member-border);
  background:linear-gradient(155deg,#fff,var(--member-soft));
  box-shadow:none;
}
.plan-tag{
  position:absolute;left:-2rpx;top:-2rpx;padding:6rpx 12rpx;
  border-radius:25rpx 0 19rpx 0;background:#ececef;color:#888;font-size:15rpx;
}
.plan-card.selected .plan-tag{background:var(--member-gradient);color:#fff}
.plan-name{font-size:20rpx;font-weight:750;white-space:nowrap}
.plan-price{margin-top:13rpx;display:flex;align-items:baseline;color:#252124}
.plan-price text:first-child{font-size:20rpx;font-weight:800}
.plan-price text:nth-child(2){font-size:38rpx;font-weight:900}
.plan-price text:last-child{font-size:16rpx;color:#888}
.plan-original{margin-top:4rpx;color:#aaa;font-size:16rpx;text-decoration:line-through}
.plan-check{
  position:absolute;right:10rpx;bottom:10rpx;width:28rpx;height:28rpx;
  border-radius:50%;display:none;align-items:center;justify-content:center;background:var(--member-accent);
}
.plan-card.selected .plan-check{display:flex}
.plan-check image{width:18rpx;height:18rpx;filter:brightness(0) invert(1)}

.service-section>.section-title{display:block;margin-bottom:15rpx}
.service-row{height:105rpx;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #f0f0f2}
.service-row:first-of-type{border-top:0}
.service-row>view{display:flex;align-items:center;min-width:0}
.service-icon{
  width:62rpx;height:62rpx;margin-right:16rpx;border-radius:21rpx;
  display:flex;align-items:center;justify-content:center;background:#f6f1e9;
}
.service-icon image{width:31rpx;height:31rpx}
.service-row>view>view:last-child{display:flex;flex-direction:column;gap:5rpx}
.service-row>view>view:last-child text:first-child{font-size:23rpx;font-weight:700;color:#333}
.service-row>view>view:last-child text:last-child{font-size:18rpx;color:#9b9ba0}
.service-row>text{font-size:18rpx;color:var(--member-text)}
.tier-plus .service-icon{background:#edf0f3}
.tier-plus .service-icon image{filter:grayscale(1) brightness(.72)}
.upgrade-detail{margin-top:22rpx;padding:7rpx 21rpx;border-radius:25rpx;background:var(--member-soft)}
.upgrade-detail>view{height:68rpx;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid rgba(80,60,40,.08)}
.upgrade-detail>view:first-child{border-top:0}
.upgrade-detail text:first-child{color:#888;font-size:20rpx}.upgrade-detail text:last-child{font-size:22rpx;font-weight:700;color:var(--member-text)}
.member-orders-entry{
  width:100%!important;max-width:none!important;height:76rpx;margin:22rpx 0 0;padding:0 25rpx;
  border:1rpx solid rgba(80,86,96,.08);border-radius:999rpx;
  display:flex;align-items:center;justify-content:space-between;text-align:left;background:rgba(255,255,255,.94);
  box-shadow:0 10rpx 28rpx rgba(37,42,50,.07);
}
.member-orders-entry>text:first-child{font-size:24rpx;font-weight:750;color:#38383d}
.member-orders-entry>text:last-child{color:#aaa;font-size:34rpx}
.content-safe{height:235rpx}

.plus-bottom-shell{
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  z-index:12;
  padding:12rpx 24rpx calc(14rpx + env(safe-area-inset-bottom));
  background:transparent!important;
  pointer-events:none;
}
.plus-bottom{
  min-height:116rpx;
  padding:14rpx 14rpx 14rpx 30rpx;
  display:flex;
  align-items:center;
  gap:22rpx;
  border:1rpx solid rgba(35,35,42,.045);
  border-radius:999rpx;
  background:rgba(255,255,255,.97);
  box-shadow:0 13rpx 36rpx rgba(35,35,45,.12);
  pointer-events:auto;
}
.bottom-price{flex:1;padding-left:8rpx}
.bottom-price>text{display:block;color:#999;font-size:18rpx}
.bottom-price>view{display:flex;align-items:baseline;margin-top:2rpx;color:#292321}
.bottom-price>view text:first-child{font-size:22rpx;font-weight:800}
.bottom-price>view text:nth-child(2){font-size:38rpx;font-weight:900}
.bottom-price>view text:last-child{font-size:18rpx;color:#8d8783}
.plus-bottom>button{
  width:300rpx;height:88rpx;border-radius:999rpx;
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:28rpx;font-weight:800;
  background:var(--member-gradient);
  box-shadow:0 9rpx 22rpx rgba(45,51,59,.14),inset 0 1rpx rgba(255,255,255,.35);
}
.plus-bottom>button.disabled{background:linear-gradient(135deg,#8d96a1,#626d79);box-shadow:none;color:rgba(255,255,255,.86)}
.current-pro-text{font-size:30rpx!important;letter-spacing:2rpx;color:#4d5661}

/* 权益对比入口仅保留文字和细分隔线，去除 H5 按钮默认浅灰底色。 */
.compare-toggle,
.member-orders-entry{
  background:transparent!important;
  box-shadow:none!important;
}
.member-orders-entry{background:rgba(255,255,255,.94)!important;box-shadow:0 10rpx 28rpx rgba(37,42,50,.07)!important}

</style>
