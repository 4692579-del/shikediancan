<template>
<view class="pay-page" :style="`${globalThemeStyle};padding-top:${statusHeight}px`">
  <view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">收银台</text><view class="nav-back"></view></view>
  <view class="pay-amount"><text>{{businessType === 'membership' || businessType === 'walletRecharge' ? membershipPlanName : '支付金额'}}</text><view><text>¥</text>{{amount}}</view><text>{{expired ? (businessType === 'membership' ? '会员支付已失效' : businessType === 'walletRecharge' ? '充值订单已失效' : '订单已取消') : '请在 ' + countdown + ' 内完成支付'}}</text></view>
  <view class="method-card card">
    <text class="method-title">选择支付方式</text>
    <button v-for="(item, index) in methods" :key="item.id" hover-class="none" class="method-row" :data-id="item.id" @tap="selectMethod">
      <view class="pay-icon" :style="`background:${item.color}`"><image :src="item.icon" mode="aspectFit" /></view><view class="method-copy"><text>{{item.name}}</text><text>{{item.desc}}</text></view><view :class="`radio ${method === item.id ? 'on' : ''}`"></view>
    </button>
    <button v-if="walletOpened && !showMoreMethods" hover-class="none" class="more-methods" @tap="toggleMoreMethods"><text>展开更多支付方式</text><view class="more-arrow"></view></button>
    <view v-if="walletOpened && showMoreMethods" class="wallet-promo"><text>惠</text><text>使用食刻钱包支付最高立减30元</text></view>
    <button v-if="walletOpened && showMoreMethods" hover-class="none" class="method-row wallet-row" :data-id="walletMethod.id" @tap="selectMethod">
      <view class="pay-icon" :style="`background:${walletMethod.color}`"><image :src="walletMethod.icon" mode="aspectFit" /></view><view class="method-copy"><text>{{walletMethod.name}}</text><text>{{walletMethod.desc}}</text></view><view :class="`radio ${method === walletMethod.id ? 'on' : ''}`"></view>
    </button>
  </view>
  <view v-if="method === 'wallet'" class="wallet-saving"><text>钱包优惠</text><text>-¥{{walletDiscount}}</text></view>
  <button hover-class="none" :class="`primary-btn pay-btn ${expired ? 'disabled' : ''}`" :disabled="expired" @tap="pay">{{expired ? (businessType === 'membership' || businessType === 'walletRecharge' ? '支付已失效' : '订单已取消') : '确认支付 ¥' + amount}}</button>

  <!-- 支付密码面板：使用页面内数字键盘还原常见移动支付的输入过程。 -->
  <view v-if="showPasswordPanel" class="password-mask" @touchmove.stop="noop">
    <view class="password-backdrop"></view>
    <view class="password-panel" @tap.stop="noop">
      <view class="password-panel-head">
        <button hover-class="none" class="password-close" @tap.stop="closePasswordPanel"><view></view><view></view></button>
        <text>请输入支付密码</text>
        <view class="password-head-space"></view>
      </view>
      <view class="password-pay-body">
        <view :class="`password-brand method-${method}`">
          <view><image :src="method === 'wallet' ? walletMethod.icon : '/static/assets/icons/payment.svg'" mode="aspectFit" /></view>
          <text>{{method === 'quick' ? '微信支付' : method === 'alipay' ? '支付宝支付' : '食刻钱包支付'}}</text>
        </view>
        <view class="password-amount"><text>¥</text><text>{{amount}}</text></view>
        <text class="password-order-name">{{businessType === 'membership' || businessType === 'walletRecharge' ? membershipPlanName : '食刻·品质厨房'}}</text>
        <view class="password-boxes">
          <view v-for="(item, index) in passwordSlots" :key="item" class="password-box">
            <view v-if="payPassword.length > index" class="password-dot"></view>
          </view>
        </view>
      </view>

      <!-- 数字键盘仅记录六位数字，删除键用于逐位撤销。 -->
      <view class="pay-keyboard">
        <button hover-class="none" data-digit="1" @tap.stop="inputPayDigit">1</button>
        <button hover-class="none" data-digit="2" @tap.stop="inputPayDigit">2</button>
        <button hover-class="none" data-digit="3" @tap.stop="inputPayDigit">3</button>
        <button hover-class="none" data-digit="4" @tap.stop="inputPayDigit">4</button>
        <button hover-class="none" data-digit="5" @tap.stop="inputPayDigit">5</button>
        <button hover-class="none" data-digit="6" @tap.stop="inputPayDigit">6</button>
        <button hover-class="none" data-digit="7" @tap.stop="inputPayDigit">7</button>
        <button hover-class="none" data-digit="8" @tap.stop="inputPayDigit">8</button>
        <button hover-class="none" data-digit="9" @tap.stop="inputPayDigit">9</button>
        <view class="keyboard-blank"></view>
        <button hover-class="none" data-digit="0" @tap.stop="inputPayDigit">0</button>
        <button hover-class="none" class="keyboard-delete" @tap.stop="deletePayDigit"><view class="delete-key-shape"><text>×</text></view></button>
      </view>
    </view>
  </view>

  <view v-if="paying" class="paying-mask"><view class="spinner"></view><text>{{method === 'quick' ? '第三方平台' : method === 'alipay' ? '支付宝' : '食刻钱包'}}支付处理中…</text><text>请勿关闭页面</text></view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 收银台页：统一处理餐品订单、会员订单与钱包充值的模拟支付流程。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import paymentCountdown from '../../utils/payment-countdown.js'
import wallet from '../../utils/wallet.js'
import walletDiscount from '../../utils/wallet-discount.js'
import membership from '../../utils/membership.js'
const pageConfig = {
  data: { statusHeight: 20, amount: '0.00', originalAmount: '0.00', walletDiscount: '0.00', existingId: '', orderId: '', businessType: 'food', membershipPlanName: '', method: 'quick', paying: false, expired: false, countdown: '15:00', walletOpened: false, showMoreMethods: false, showPasswordPanel: false, payPassword: '', passwordSlots: [0, 1, 2, 3, 4, 5], methods: [
    { id: 'quick', name: '微信支付', desc: '推荐使用', icon: '/static/assets/icons/payment.svg', color: '#07c160' },
    { id: 'alipay', name: '支付宝支付', desc: '安全快捷', icon: '/static/assets/icons/payment.svg', color: '#1677ff' }
  ], walletMethod: { id: 'wallet', name: '食刻钱包支付', desc: '便捷安全支付', icon: '/static/assets/icons/wallet.svg', color: '#ff6533' } },
  // 根据 type 区分餐品、会员和钱包充值，并加载对应待支付记录。
  onLoad(options) {
    const target = auth.buildUrl('/pages/pay/pay', options)
    if (!auth.guardPage(target)) return
    if (options.type === 'walletRecharge') {
      const rechargeOrder = wallet.getRechargeOrder(options.recharge)
      if (!rechargeOrder || rechargeOrder.status !== 'unpaid') {
        uni.showToast({ title: '充值订单已失效', icon: 'none' })
        setTimeout(() => uni.redirectTo({ url: '/pages/wallet/wallet' }), 500)
        return
      }
      this.setData({
        statusHeight: getApp().globalData.statusBarHeight,
        businessType: 'walletRecharge',
        orderId: rechargeOrder.id,
        amount: Number(rechargeOrder.amount).toFixed(2),
        originalAmount: Number(rechargeOrder.amount).toFixed(2),
        membershipPlanName: '充值到食刻钱包',
        walletOpened: false,
        showMoreMethods: false,
        method: 'quick'
      })
      this.startCountdown()
      return
    }
    if (options.type === 'membership') {
      const payment = membership.getPayment(options.payment)
      if (!payment || payment.status !== 'unpaid') {
        uni.showToast({ title: '会员订单已失效', icon: 'none' })
        setTimeout(() => uni.redirectTo({ url: '/pages/plus/plus' }), 500)
        return
      }
      const validation = membership.canPayPayment(payment)
      if (!validation.allowed) {
        uni.showModal({
          title: '无法支付',
          content: validation.message,
          showCancel: false,
          success: () => uni.redirectTo({ url: '/pages/member-orders/member-orders' })
        })
        return
      }
      this.setData({
        statusHeight: getApp().globalData.statusBarHeight,
        businessType: 'membership',
        orderId: payment.id,
        amount: Number(payment.amount).toFixed(2),
        originalAmount: Number(payment.originalAmount || payment.amount).toFixed(2),
        membershipPlanName: payment.planName,
        walletOpened: wallet.isOpened()
      })
      this.startCountdown()
      return
    }
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, amount: options.amount || '0.00', existingId: options.existing || '' })
    const order = this.createOrder('unpaid')
    if (!order) return
    const originalAmount = Number(order.originalTotal || order.total || this.amount)
    this.setData({ orderId: order.id, originalAmount: originalAmount.toFixed(2), amount: originalAmount.toFixed(2), walletOpened: wallet.isOpened() })
    this.startCountdown()
  },
  // 页面恢复时重新检查钱包开通状态与支付倒计时。
  onShow() {
    if (this.businessType === 'walletRecharge') {
      this.setData({ walletOpened: false, showMoreMethods: false, method: this.method === 'alipay' ? 'alipay' : 'quick' })
      if (this.orderId) this.startCountdown()
      return
    }
    const walletOpened = wallet.isOpened()
    if (!walletOpened && this.method === 'wallet') {
      this.setData({
        walletOpened,
        showMoreMethods: false,
        method: 'quick',
        walletDiscount: '0.00',
        amount: Number(this.originalAmount || this.amount).toFixed(2)
      })
    } else {
      this.setData({ walletOpened, showMoreMethods: walletOpened ? this.showMoreMethods : false })
    }
    if (this.orderId) this.startCountdown()
  },
  onHide() { this.stopCountdown() },
  onUnload() {
    this.stopCountdown()
    clearTimeout(this.passwordSubmitTimer)
  },
  back() {
    // 密码面板打开时，返回操作只关闭面板，避免误退出整个收银台。
    if (this.showPasswordPanel) {
      this.closePasswordPanel()
      return
    }
    const isMembership = this.businessType === 'membership'
    const isRecharge = this.businessType === 'walletRecharge'
    uni.showModal({
      title: '确认离开收银台？',
      content: isMembership ? '会员尚未开通，本次支付将在倒计时结束后失效' : isRecharge ? '本次充值尚未完成，充值订单将在倒计时结束后失效' : '订单将保留在待付款中',
      confirmText: '确认离开',
      success: res => {
        if (!res.confirm) return
        if (isMembership) uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/plus/plus' }) })
        else if (isRecharge) uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/wallet/wallet' }) })
        else uni.redirectTo({ url: '/pages/orders/orders' })
      }
    })
  },
  // 切换支付方式；选择钱包时计算本单随机立减。
  selectMethod(e) {
    const method = e.currentTarget.dataset.id
    if (method === 'wallet') {
      if (!wallet.isOpened()) return uni.showToast({ title: '请先开通食刻钱包', icon: 'none' })
      const discount = this.ensureWalletDiscount()
      const amount = Math.max(0.01, Number(this.originalAmount) - discount)
      this.setData({ method, walletDiscount: discount.toFixed(2), amount: amount.toFixed(2) })
      return
    }
    this.setData({ method, walletDiscount: '0.00', amount: Number(this.originalAmount).toFixed(2) })
  },
  toggleMoreMethods() {
    if (!this.walletOpened) return
    this.setData({ showMoreMethods: true })
  },
  // 支付前再次校验订单、会员等级、钱包状态和余额。
  pay() {
    if (this.paying || this.expired) return
    // 拉起密码面板前再次校验订单、会员状态和钱包余额，防止失效订单继续支付。
    const current = this.getCurrentPaymentOrder()
    if (!current || current.status !== 'unpaid') {
      this.handleExpired()
      return
    }
    if (this.businessType === 'membership') {
      const validation = membership.canPayPayment(current)
      if (!validation.allowed) {
        return uni.showModal({ title: '无法支付', content: validation.message, showCancel: false })
      }
    }
    if (this.method === 'wallet' && !wallet.isOpened()) {
      return uni.showToast({ title: '食刻钱包未开通', icon: 'none' })
    }
    if (this.method === 'wallet' && wallet.getWallet().balance < Number(this.amount)) {
      return uni.showToast({ title: '钱包余额不足，请先充值', icon: 'none' })
    }

    // 校验通过后只展示支付密码面板，真正的支付逻辑在密码输入满六位后执行。
    this.setData({ showPasswordPanel: true, payPassword: '' })
  },

  closePasswordPanel() {
    if (this.paying) return
    clearTimeout(this.passwordSubmitTimer)
    this.setData({ showPasswordPanel: false, payPassword: '' })
  },

  noop() {},

  // 模拟真实六位支付密码键盘；任意六位数字均可通过。
  inputPayDigit(e) {
    if (this.paying) return
    const digit = String(e.currentTarget.dataset.digit || '')
    if (!/^\d$/.test(digit) || this.payPassword.length >= 6) return
    const payPassword = `${this.payPassword}${digit}`
    this.setData({ payPassword })

    // 任意六位数字均可通过；稍作停顿以完整呈现最后一位密码圆点。
    if (payPassword.length === 6) {
      clearTimeout(this.passwordSubmitTimer)
      this.passwordSubmitTimer = setTimeout(() => this.confirmPayPassword(), 180)
    }
  },

  deletePayDigit() {
    if (this.paying || !this.payPassword.length) return
    this.setData({ payPassword: this.payPassword.slice(0, -1) })
  },

  confirmPayPassword() {
    if (this.payPassword.length !== 6 || this.paying) return

    // 密码完成后关闭输入面板，进入统一的支付处理中状态。
    this.setData({ showPasswordPanel: false, payPassword: '', paying: true })
    this.processPayment()
  },

  // 按业务类型完成充值、会员开通或餐品订单，并更新本地状态。
  processPayment() {
    // 支付处理前做最后一次状态校验，解决输入密码期间订单超时的问题。
    const current = this.getCurrentPaymentOrder()
    if (!current || current.status !== 'unpaid') {
      this.setData({ paying: false })
      this.handleExpired(current)
      return
    }
    if (this.businessType === 'membership') {
      const validation = membership.canPayPayment(current)
      if (!validation.allowed) {
        this.setData({ paying: false })
        uni.showModal({ title: '无法支付', content: validation.message, showCancel: false })
        return
      }
    }

    this.setData({ paying: true })
    setTimeout(() => {
      if (this.businessType === 'walletRecharge') {
        const recharge = wallet.completeRechargeOrder(this.orderId, this.method)
        if (!recharge) {
          this.setData({ paying: false })
          this.handleExpired()
          return
        }
        this.stopCountdown()
        uni.redirectTo({ url: `/pages/pay-result/pay-result?type=walletRecharge&id=${this.orderId}&method=${this.method}` })
        return
      }
      if (this.businessType === 'membership') {
        const completed = membership.completePayment(
          this.orderId,
          this.method,
          Number(this.amount),
          Number(this.walletDiscount)
        )
        if (!completed) {
          this.setData({ paying: false })
          this.handleExpired()
          return
        }
        this.stopCountdown()
        if (this.method === 'wallet') wallet.payMembership(Number(this.amount), this.orderId)
        uni.redirectTo({ url: `/pages/pay-result/pay-result?type=membership&id=${this.orderId}&method=${this.method}` })
        return
      }
      const order = this.createOrder('making')
      if (!order || order.status !== 'making') {
        this.setData({ paying: false })
        this.handleExpired()
        return
      }
      this.stopCountdown()
      if (this.method === 'wallet') wallet.pay(Number(order.total), order.id)
      store.set('sk_cart', store.getCart().filter(item => !item.checked))
      if (order.coupon) {
        store.set('sk_coupons', store.get('sk_coupons', []).map(item => item.id === order.coupon.id ? { ...item, used: true } : item))
        store.set('sk_selected_coupon', null)
      }
      uni.redirectTo({ url: `/pages/pay-result/pay-result?id=${order.id}&method=${this.method}` })
    }, 500)
  },
  // 创建新订单或更新已有订单，保证同一订单不会被重复创建。
  createOrder(status) {
    const draft = store.get('sk_order_draft', {})
    const orders = paymentCountdown.normalizeOrders()
    const targetId = this.orderId || this.existingId
    if (targetId) {
      const current = orders.find(item => item.id === targetId)
      if (!current) return null
      if (status === 'unpaid' && current.status !== 'unpaid') return current
      if (status === 'making' && current.status !== 'unpaid') return current
      const updated = orders.map(item => item.id === targetId ? {
        ...item,
        status,
        payMethod: this.method,
        originalTotal: Number(item.originalTotal || item.total),
        total: status === 'making' ? Number(this.amount) : Number(item.originalTotal || item.total),
        walletDiscount: status === 'making' && this.method === 'wallet' ? Number(this.walletDiscount) : 0,
        paymentDeadline: status === 'unpaid' ? item.paymentDeadline : null,
        paidAt: status === 'making' ? Date.now() : item.paidAt
      } : item)
      store.set('sk_orders', updated)
      return updated.find(item => item.id === targetId)
    }
    const now = new Date()
    const id = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(Date.now()).slice(-6)}`
    const order = {
      ...draft,
      id,
      status,
      createdAt: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
      createdAtTimestamp: Date.now(),
      paymentDeadline: status === 'unpaid' ? Date.now() + paymentCountdown.PAYMENT_DURATION : null,
      originalTotal: Number(draft.total || this.amount),
      payMethod: this.method,
      shopName: '食刻·品质厨房'
    }
    store.set('sk_orders', [order, ...orders])
    this.setData({ orderId: id })
    return order
  },
  // 优惠首次生成后写入订单，保证切换支付方式时金额不反复变化。
  ensureWalletDiscount() {
    if (this.businessType === 'membership') {
      const payment = membership.getPayment(this.orderId)
      if (!payment) return 0
      const existing = Number(payment.walletDiscountOffer)
      if (existing > 0) return existing
      const discount = walletDiscount.generate(payment.originalAmount || payment.amount)
      membership.updatePayment(payment.id, { walletDiscountOffer: discount })
      return discount
    }
    const orders = paymentCountdown.normalizeOrders()
    const order = orders.find(item => item.id === this.orderId)
    if (!order) return 0
    const existing = Number(order.walletDiscountOffer)
    if (existing > 0) return existing
    const discount = walletDiscount.generate(order.originalTotal || order.total)
    store.set('sk_orders', orders.map(item => item.id === order.id ? { ...item, walletDiscountOffer: discount } : item))
    return discount
  },
  getCurrentPaymentOrder() {
    if (this.businessType === 'membership') return membership.getPayment(this.orderId)
    if (this.businessType === 'walletRecharge') return wallet.getRechargeOrder(this.orderId)
    return paymentCountdown.getOrder(this.orderId)
  },
  // 启动一秒一次的支付倒计时，并在页面隐藏时停止。
  startCountdown() {
    this.stopCountdown()
    this.updateCountdown()
    if (!this.expired) this.countdownTimer = setInterval(() => this.updateCountdown(), 1000)
  },
  stopCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },
  updateCountdown() {
    const order = this.getCurrentPaymentOrder()
    if (!order || order.status !== 'unpaid') {
      this.handleExpired(order)
      return
    }
    this.setData({ countdown: paymentCountdown.formatRemaining(order.paymentDeadline), expired: false })
  },
  // 订单超时后关闭密码面板并禁止继续支付，不主动跳转或弹窗。
  handleExpired(order) {
    this.stopCountdown()
    const expiredOrder = order || this.getCurrentPaymentOrder()
    if (expiredOrder && expiredOrder.status === 'making') return
    if (this.expired) return
    // 倒计时结束时同步关闭密码面板，避免用户继续输入已失效订单。
    clearTimeout(this.passwordSubmitTimer)
    this.setData({ expired: true, countdown: '00:00', paying: false, showPasswordPanel: false, payPassword: '' })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.pay-page{min-height:100vh;background:#f5f5f7;padding-left:24rpx;padding-right:24rpx}.pay-amount{text-align:center;padding:55rpx 0}.pay-amount>text{display:block;color:#888;font-size:22rpx}.pay-amount>view{font-size:76rpx;font-weight:800;margin:13rpx 0}.pay-amount>view text{font-size:33rpx;margin-right:5rpx}.method-card{padding:28rpx}.method-title{font-size:30rpx;font-weight:750}.method-row{width:100%;height:116rpx;display:flex;align-items:center;text-align:left}.pay-icon{width:66rpx;height:66rpx;border-radius:22rpx;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32rpx;font-weight:800;margin-right:18rpx}.method-copy{flex:1}.method-copy text{display:block}.method-copy text:first-child{font-weight:650}.method-copy text:last-child{font-size:20rpx;color:#999;margin-top:5rpx}.radio{width:40rpx;height:40rpx;border-radius:50%;border:2rpx solid #ccc}.radio.on{border:11rpx solid var(--orange)}.pay-btn{position:fixed;left:28rpx;right:28rpx;bottom:calc(30rpx + env(safe-area-inset-bottom))}.paying-mask{position:fixed;inset:0;z-index:150;background:rgba(20,20,22,.86);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.paying-mask text{margin-top:20rpx}.paying-mask text:last-child{font-size:21rpx;color:#aaa;margin-top:8rpx}.spinner{width:78rpx;height:78rpx;border-radius:50%;border:7rpx solid rgba(255,255,255,.2);border-top-color:#fff;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

.pay-page{padding-bottom:150rpx}.pay-amount{padding:42rpx 0}.pay-amount>view{font-size:68rpx}.method-card{padding:24rpx}
.method-row{height:106rpx}.pay-icon,.radio{flex-shrink:0}.method-copy{min-width:0}.method-copy text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pay-icon image{width:34rpx;height:34rpx;filter:brightness(0) invert(1)}

/* Give the payment choices clearer vertical rhythm. */
.method-card{
  padding:32rpx 28rpx 26rpx;
}
.method-title{
  display:block;
  margin-bottom:16rpx;
}
.method-row{
  height:126rpx;
  padding:8rpx 0;
}
.method-row + .method-row{
  margin-top:8rpx;
  border-top:1rpx solid #eee;
}
.more-methods{
  width:100%!important;
  max-width:none!important;
  height:76rpx;
  border-top:1rpx solid #eee;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:12rpx;
  color:#777b82;
  font-size:21rpx;
  font-weight:600;
  line-height:1;
}
.more-methods>text{
  line-height:1;
}
.more-arrow{
  width:14rpx;
  height:14rpx;
  flex:0 0 14rpx;
  margin-top:-6rpx;
  border-right:3rpx solid #8b9097;
  border-bottom:3rpx solid #8b9097;
  border-radius:1rpx;
  transform:rotate(45deg);
}
.wallet-promo{min-height:58rpx;padding:0 4rpx;border-top:1rpx solid #eee;display:flex;align-items:center;color:var(--orange);font-size:20rpx}.wallet-promo>text:first-child{width:34rpx;height:34rpx;margin-right:10rpx;border-radius:10rpx;background:var(--orange-soft);display:flex;align-items:center;justify-content:center;font-size:17rpx;font-weight:750}
.wallet-row{
  margin-top:0!important;
  border-top:1rpx solid #eee;
  animation:wallet-row-in .22s ease-out;
}
.wallet-saving{margin:18rpx 8rpx 0;padding:20rpx 24rpx;border-radius:999rpx;background:var(--orange-soft);display:flex;align-items:center;justify-content:space-between;color:var(--orange);font-size:22rpx}.wallet-saving text:last-child{font-size:26rpx;font-weight:800}
@keyframes wallet-row-in{
  from{opacity:0;transform:translateY(-8rpx)}
  to{opacity:1;transform:translateY(0)}
}
.pay-btn{height:88rpx}
.method-row{width:100%!important;max-width:none!important}.pay-btn{width:auto!important}
.pay-btn.disabled{background:#c8c8cc;box-shadow:none;color:#fff}

/* 支付方式名称和说明紧凑排列，并与左侧图标的视觉中心对齐。 */
.method-row{height:108rpx!important;padding:0!important}
.method-copy{display:flex;flex-direction:column;justify-content:center;gap:4rpx}
.method-copy text:last-child{margin-top:0!important}

/* 支付方式名称和说明作为一个整体与图标居中，小字贴近标题但不拥挤。 */
.method-row,
uni-button.method-row{
  height:96rpx!important;
  min-height:96rpx!important;
  padding:0!important;
  align-items:center!important;
}
.method-row + .method-row{
  margin-top:0!important;
}
.method-copy{
  height:66rpx!important;
  flex:1 1 auto!important;
  min-width:0!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  gap:2rpx!important;
}
.method-copy text:first-child{
  height:34rpx!important;
  line-height:34rpx!important;
  font-size:29rpx!important;
  font-weight:700!important;
  margin:0!important;
}
.method-copy text:last-child{
  height:26rpx!important;
  line-height:26rpx!important;
  margin:0!important;
  font-size:20rpx!important;
  color:#999!important;
}
.pay-icon{
  width:64rpx!important;
  height:64rpx!important;
  flex:0 0 64rpx!important;
  margin-right:18rpx!important;
}
.radio{
  flex:0 0 40rpx!important;
}

/* 支付方式和展开项使用卡片自身的留白，不使用 H5 原生按钮默认灰底。 */
.method-row,
.more-methods{
  background:transparent!important;
  border-left:0!important;
  border-right:0!important;
  box-shadow:none!important;
}

/* 支付方式之间略微拉开，形成更舒服的卡片内呼吸感。 */
.method-row,
uni-button.method-row{
  height:112rpx!important;
  min-height:112rpx!important;
}
.method-row + .method-row,
.wallet-row{
  margin-top:8rpx!important;
}
.wallet-promo{
  margin-top:8rpx!important;
  min-height:48rpx!important;
}

/* 支付密码遮罩与底部面板，使用独立层级避免被收银台按钮覆盖。 */
.password-mask{position:fixed;inset:0;z-index:140;display:flex;align-items:flex-end}
.password-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.48);animation:passwordFadeIn .2s ease both}
.password-panel{
  position:relative;
  z-index:1;
  width:100%;
  overflow:hidden;
  border-radius:34rpx 34rpx 0 0;
  background:#fff;
  box-shadow:0 -20rpx 55rpx rgba(0,0,0,.18);
  animation:passwordPanelUp .28s cubic-bezier(.22,.61,.36,1) both;
}
.password-panel-head{
  height:92rpx;
  padding:0 28rpx;
  border-bottom:1rpx solid #ededf0;
  display:grid;
  grid-template-columns:68rpx 1fr 68rpx;
  align-items:center;
}
.password-panel-head>text{text-align:center;color:#222;font-size:29rpx;font-weight:700}
.password-close{
  position:relative;
  width:58rpx!important;
  min-width:58rpx!important;
  max-width:58rpx!important;
  height:58rpx;
  padding:0!important;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
}
.password-close view{position:absolute;width:28rpx;height:3rpx;border-radius:3rpx;background:#67676d}
.password-close view:first-child{transform:rotate(45deg)}
.password-close view:last-child{transform:rotate(-45deg)}
.password-pay-body{padding:28rpx 38rpx 36rpx;text-align:center}
.password-brand{display:flex;align-items:center;justify-content:center;gap:11rpx;color:#666;font-size:21rpx}
.password-brand>view{width:36rpx;height:36rpx;border-radius:11rpx;display:flex;align-items:center;justify-content:center}
.password-brand image{width:22rpx;height:22rpx;filter:brightness(0) invert(1)}
.password-brand.method-quick>view{background:#07c160}
.password-brand.method-alipay>view{background:#1677ff}
.password-brand.method-wallet>view{background:var(--orange)}
.password-amount{margin-top:16rpx;display:flex;align-items:baseline;justify-content:center;color:#151518}
.password-amount text:first-child{margin-right:5rpx;font-size:30rpx;font-weight:750}
.password-amount text:last-child{font-size:60rpx;font-weight:850;letter-spacing:-1rpx}
.password-order-name{display:block;margin-top:7rpx;color:#999;font-size:19rpx}
.password-boxes{
  width:100%;
  height:92rpx;
  margin-top:30rpx;
  overflow:hidden;
  border:2rpx solid #d9d9de;
  border-radius:18rpx;
  display:grid;
  grid-template-columns:repeat(6,1fr);
  background:#fff;
}
.password-box{position:relative;display:flex;align-items:center;justify-content:center}
.password-box:not(:last-child)::after{content:"";position:absolute;top:0;right:0;bottom:0;width:1rpx;background:#dedee2}
.password-dot{width:22rpx;height:22rpx;border-radius:50%;background:#171719;animation:passwordDotIn .12s ease both}

/* 自定义数字键盘沿用系统支付键盘的三列结构。 */
.pay-keyboard{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1rpx;
  padding-bottom:env(safe-area-inset-bottom);
  background:#cfd1d5;
}
.pay-keyboard button,.keyboard-blank{
  width:100%!important;
  max-width:none!important;
  height:104rpx;
  border-radius:0;
  display:flex;
  align-items:center;
  justify-content:center;
  color:#171719;
  background:#fff;
  font-size:40rpx;
  font-weight:500;
}
.pay-keyboard button:active{background:#e6e7e9}
.keyboard-blank,.keyboard-delete{background:#d9dbe0!important}
.delete-key-shape{
  position:relative;
  width:42rpx;
  height:31rpx;
  border:3rpx solid #33363b;
  border-left:0;
  border-radius:5rpx;
  display:flex;
  align-items:center;
  justify-content:center;
}
.delete-key-shape::before{
  content:"";
  position:absolute;
  left:-13rpx;
  width:24rpx;
  height:24rpx;
  border-left:3rpx solid #33363b;
  border-bottom:3rpx solid #33363b;
  border-radius:3rpx;
  transform:rotate(45deg);
}
.delete-key-shape text{position:relative;z-index:1;font-size:27rpx;font-weight:400;line-height:1}
@keyframes passwordFadeIn{from{opacity:0}to{opacity:1}}
@keyframes passwordPanelUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes passwordDotIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}

</style>
