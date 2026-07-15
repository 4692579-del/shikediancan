<template>
<view class="pay-page" :style="`${globalThemeStyle};padding-top:${statusHeight}px`">
  <view class="nav-row">
    <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
    <text class="nav-title">收银台</text>
    <view class="nav-back"></view>
  </view>

  <view class="pay-amount">
    <text>{{ businessType === 'membership' || businessType === 'walletRecharge' ? membershipPlanName : '支付金额' }}</text>
    <view><text>¥</text>{{ amount }}</view>
    <text>{{ expired ? expiredText() : '请在 ' + countdown + ' 内完成支付' }}</text>
  </view>

  <view class="method-card card">
    <text class="method-title">选择支付方式</text>
    <button v-for="item in methods" :key="item.id" hover-class="none" class="method-row" :data-id="item.id" @tap="selectMethod">
      <view class="pay-icon" :style="`background:${item.color}`"><image :src="item.icon" mode="aspectFit" /></view>
      <view class="method-copy"><text>{{ item.name }}</text><text>{{ item.desc }}</text></view>
      <view :class="`radio ${method === item.id ? 'on' : ''}`"></view>
    </button>
    <button v-if="walletOpened && !showMoreMethods" hover-class="none" class="more-methods" @tap="toggleMoreMethods"><text>展开更多支付方式</text><view class="more-arrow"></view></button>
    <view v-if="walletOpened && showMoreMethods" class="wallet-promo"><text>惠</text><text>使用食刻钱包支付最高立减30元</text></view>
    <button v-if="walletOpened && showMoreMethods" hover-class="none" class="method-row wallet-row" :data-id="walletMethod.id" @tap="selectMethod">
      <view class="pay-icon" :style="`background:${walletMethod.color}`"><image :src="walletMethod.icon" mode="aspectFit" /></view>
      <view class="method-copy"><text>{{ walletMethod.name }}</text><text>{{ walletMethod.desc }}</text></view>
      <view :class="`radio ${method === walletMethod.id ? 'on' : ''}`"></view>
    </button>
  </view>

  <view v-if="method === 'wallet'" class="wallet-saving"><text>钱包优惠</text><text>-¥{{ walletDiscount }}</text></view>
  <button hover-class="none" :class="`primary-btn pay-btn ${expired ? 'disabled' : ''}`" :disabled="expired" @tap="pay">{{ expired ? expiredButtonText() : '确认支付 ¥' + amount }}</button>

  <!-- 支付密码面板：微信/支付宝为模拟输入；食刻钱包会把 6 位密码提交到后端校验。 -->
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
          <text>{{ method === 'quick' ? '微信支付' : method === 'alipay' ? '支付宝支付' : '食刻钱包支付' }}</text>
        </view>
        <view class="password-amount"><text>¥</text><text>{{ amount }}</text></view>
        <text class="password-order-name">{{ businessType === 'membership' || businessType === 'walletRecharge' ? membershipPlanName : '食刻·品质厨房' }}</text>
        <view class="password-boxes">
          <view v-for="item in passwordSlots" :key="item" class="password-box"><view v-if="payPassword.length > item" class="password-dot"></view></view>
        </view>
      </view>
      <view class="pay-keyboard">
        <button v-for="digit in [1,2,3,4,5,6,7,8,9]" :key="digit" hover-class="none" :data-digit="digit" @tap.stop="inputPayDigit">{{ digit }}</button>
        <view class="keyboard-blank"></view>
        <button hover-class="none" data-digit="0" @tap.stop="inputPayDigit">0</button>
        <button hover-class="none" class="keyboard-delete" @tap.stop="deletePayDigit"><view class="delete-key-shape"><text>×</text></view></button>
      </view>
    </view>
  </view>

  <view v-if="paying" class="paying-mask"><view class="spinner"></view><text>{{ method === 'quick' ? '微信' : method === 'alipay' ? '支付宝' : '食刻钱包' }}支付处理中…</text><text>请勿关闭页面</text></view>
</view>
</template>
<script>
import adaptPage from '@/utils/page-adapter.js'
// 鏀堕摱鍙伴〉锛氱粺涓€澶勭悊椁愬搧璁㈠崟銆佷細鍛樿鍗曚笌閽卞寘鍏呭€肩殑妯℃嫙鏀粯娴佺▼銆?

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import paymentCountdown from '../../utils/payment-countdown.js'
import wallet from '../../utils/wallet.js'
import walletDiscount from '../../utils/wallet-discount.js'
import membership from '../../utils/membership.js'
import orderBackend from '../../utils/order-backend.js'
import benefitBackend from '../../utils/benefit-backend.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    amount: '0.00',
    originalAmount: '0.00',
    walletDiscount: '0.00',
    existingId: '',
    orderId: '',
    businessType: 'food',
    membershipPlanName: '',
    method: 'quick',
    paying: false,
    expired: false,
    countdown: '15:00',
    walletOpened: false,
    showMoreMethods: false,
    showPasswordPanel: false,
    payPassword: '',
    paymentPasswordForSubmit: '',
    passwordSlots: [0, 1, 2, 3, 4, 5],
    methods: [
      { id: 'quick', name: '微信支付', desc: '推荐使用', icon: '/static/assets/icons/payment.svg', color: '#07c160' },
      { id: 'alipay', name: '支付宝支付', desc: '安全快捷', icon: '/static/assets/icons/payment.svg', color: '#1677ff' }
    ],
    walletMethod: { id: 'wallet', name: '食刻钱包支付', desc: '便捷安全支付', icon: '/static/assets/icons/wallet.svg', color: '#ff6533' }
  },
  // 鏍规嵁 type 鍖哄垎椁愬搧銆佷細鍛樺拰閽卞寘鍏呭€硷紝骞跺姞杞藉搴斿緟鏀粯璁板綍銆?
  async onLoad(options) {
    const target = auth.buildUrl('/pages/pay/pay', options)
    if (!auth.guardPage(target)) return
    if (options.type === 'walletRecharge') {
      const rechargeOrder = await wallet.getRechargeOrder(options.recharge).catch(() => wallet.getCachedRechargeOrder(options.recharge))
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
      let payment = null
      try {
        payment = await benefitBackend.getMemberOrder(options.payment)
        membership.savePayment(payment)
      } catch (err) {
        console.error('load member payment failed', err)
        payment = membership.getPayment(options.payment)
      }
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
        walletOpened: (await wallet.fetchWallet({ force: true }).catch(() => wallet.getWallet())).opened
      })
      this.startCountdown()
      return
    }
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, amount: options.amount || '0.00', existingId: options.existing || '' })
    try {
      let order = options.existing ? await orderBackend.getOrder(options.existing) : null
      if (!order) order = await orderBackend.createOrder(store.get('sk_order_draft', {}))
      const originalAmount = Number(order.originalTotal || order.total || this.amount)
      const localOrders = store.get('sk_orders', [])
      store.set('sk_orders', [order, ...localOrders.filter(item => item.id !== order.id)])
      this.setData({ orderId: order.id, originalAmount: originalAmount.toFixed(2), amount: originalAmount.toFixed(2), walletOpened: (await wallet.fetchWallet({ force: true }).catch(() => wallet.getWallet())).opened })
      this.startCountdown()
    } catch (err) {
      console.error('load backend order failed', err)
      uni.showToast({ title: '订单加载失败，请重试', icon: 'none' })
      setTimeout(() => uni.redirectTo({ url: '/pages/orders/orders' }), 600)
    }
  },
  // 椤甸潰鎭㈠鏃堕噸鏂版鏌ラ挶鍖呭紑閫氱姸鎬佷笌鏀粯鍊掕鏃躲€?
  async onShow() {
    if (this.businessType === 'walletRecharge') {
      this.setData({ walletOpened: false, showMoreMethods: false, method: this.method === 'alipay' ? 'alipay' : 'quick' })
      if (this.orderId) this.startCountdown()
      return
    }
    const walletOpened = (await wallet.fetchWallet({ force: true }).catch(() => wallet.getWallet())).opened
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
  expiredText() {
    if (this.businessType === 'membership') return '会员支付已失效'
    if (this.businessType === 'walletRecharge') return '充值订单已失效'
    return '订单已取消'
  },
  expiredButtonText() {
    return this.businessType === 'membership' || this.businessType === 'walletRecharge'
      ? '支付已失效'
      : '订单已取消'
  },
  back() {
    // 瀵嗙爜闈㈡澘鎵撳紑鏃讹紝杩斿洖鎿嶄綔鍙叧闂潰鏉匡紝閬垮厤璇€€鍑烘暣涓敹閾跺彴銆?
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
  // 鍒囨崲鏀粯鏂瑰紡锛涢€夋嫨閽卞寘鏃惰绠楁湰鍗曢殢鏈虹珛鍑忋€?
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
  // 鏀粯鍓嶅啀娆℃牎楠岃鍗曘€佷細鍛樼瓑绾с€侀挶鍖呯姸鎬佸拰浣欓銆?
  async pay() {
    if (this.paying || this.expired) return
    // 鎷夎捣瀵嗙爜闈㈡澘鍓嶅啀娆℃牎楠岃鍗曘€佷細鍛樼姸鎬佸拰閽卞寘浣欓锛岄槻姝㈠け鏁堣鍗曠户缁敮浠樸€?
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
    const walletData = this.method === 'wallet' ? await wallet.fetchWallet({ force: true }).catch(() => wallet.getWallet()) : null
    if (this.method === 'wallet' && !walletData.opened) {
      return uni.showToast({ title: '食刻钱包未开通', icon: 'none' })
    }
    if (this.method === 'wallet' && walletData.balance < Number(this.amount)) {
      return uni.showToast({ title: '钱包余额不足，请先充值', icon: 'none' })
    }

    // 鏍￠獙閫氳繃鍚庡彧灞曠ず鏀粯瀵嗙爜闈㈡澘锛岀湡姝ｇ殑鏀粯閫昏緫鍦ㄥ瘑鐮佽緭鍏ユ弧鍏綅鍚庢墽琛屻€?
    this.setData({ showPasswordPanel: true, payPassword: '' })
  },

  closePasswordPanel() {
    if (this.paying) return
    clearTimeout(this.passwordSubmitTimer)
    this.setData({ showPasswordPanel: false, payPassword: '' })
  },

  noop() {},

  // 自定义六位支付密码键盘；钱包支付时会把密码交给后端校验。
  inputPayDigit(e) {
    if (this.paying) return
    const digit = String(e.currentTarget.dataset.digit || '')
    if (!/^\d$/.test(digit) || this.payPassword.length >= 6) return
    const payPassword = `${this.payPassword}${digit}`
    this.setData({ payPassword })

    // 稍作停顿，让最后一位密码圆点完整显示后再提交。
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

    // 密码输入完成后先暂存，随后进入统一支付处理。
    this.paymentPasswordForSubmit = this.payPassword
    this.setData({ showPasswordPanel: false, payPassword: '', paying: true })
    this.processPayment()
  },

  // 按业务类型完成充值、会员开通或餐品订单支付，并同步本地状态。
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
        uni.showModal({ title: '鏃犳硶鏀粯', content: validation.message, showCancel: false })
        return
      }
    }

    this.setData({ paying: true })
    setTimeout(async () => {
      if (this.businessType === 'walletRecharge') {
        const recharge = await wallet.completeRechargeOrder(this.orderId, this.method).catch(error => {
          uni.showToast({ title: error.message || '充值失败，请重试', icon: 'none' })
          return null
        })
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
        try {
          if (this.method === 'wallet') {
            await wallet.payMembership(Number(this.amount), this.orderId, this.paymentPasswordForSubmit || '')
          }
          await benefitBackend.payMemberOrder(this.orderId, {
            method: this.method,
            amount: Number(this.amount),
            walletDiscount: Number(this.walletDiscount)
          })
        } catch (err) {
          console.error('backend membership pay failed', err)
          this.paymentPasswordForSubmit = ''
          this.setData({ paying: false })
          uni.showToast({ title: err.message || '会员支付失败，请重试', icon: 'none' })
          return
        }
        this.stopCountdown()
        this.paymentPasswordForSubmit = ''
        uni.redirectTo({ url: `/pages/pay-result/pay-result?type=membership&id=${this.orderId}&method=${this.method}` })
        return
      }
      let order = null
      if (this.method === 'wallet') {
        try {
          await wallet.pay(Number(this.amount), this.orderId, this.paymentPasswordForSubmit || '')
        } catch (error) {
          this.paymentPasswordForSubmit = ''
          this.setData({ paying: false })
          uni.showToast({ title: error.message || '钱包支付失败，请重试', icon: 'none' })
          return
        }
      }
      try {
        order = await orderBackend.payOrder(this.orderId, {
          payMethod: this.method,
          total: Number(this.amount),
          walletDiscount: Number(this.walletDiscount)
        })
      } catch (err) {
        console.error('backend pay failed', err)
        this.paymentPasswordForSubmit = ''
        this.setData({ paying: false })
        uni.showToast({ title: '支付失败，请重试', icon: 'none' })
        return
      }
      if (!order || order.status !== 'making') {
        this.paymentPasswordForSubmit = ''
        this.setData({ paying: false })
        this.handleExpired(order)
        return
      }
      this.stopCountdown()
      const localOrders = store.get('sk_orders', [])
      store.set('sk_orders', [order, ...localOrders.filter(item => item.id !== order.id)])
      if (order.coupon) {
        try {
          await benefitBackend.markCouponUsed(order.coupon.id, order.id)
        } catch (err) {
          console.error('mark coupon used failed', err)
          store.set('sk_coupons', store.get('sk_coupons', []).map(item => item.id === order.coupon.id ? { ...item, used: true } : item))
        }
        store.set('sk_selected_coupon', null)
      }
      uni.redirectTo({ url: `/pages/pay-result/pay-result?id=${order.id}&method=${this.method}` })
      this.paymentPasswordForSubmit = ''
    }, 500)
  },
  // 鍒涘缓鏂拌鍗曟垨鏇存柊宸叉湁璁㈠崟锛屼繚璇佸悓涓€璁㈠崟涓嶄細琚噸澶嶅垱寤恒€?
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
      shopName: '椋熷埢路鍝佽川鍘ㄦ埧'
    }
    store.set('sk_orders', [order, ...orders])
    this.setData({ orderId: id })
    return order
  },
  // 浼樻儬棣栨鐢熸垚鍚庡啓鍏ヨ鍗曪紝淇濊瘉鍒囨崲鏀粯鏂瑰紡鏃堕噾棰濅笉鍙嶅鍙樺寲銆?
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
    if (this.businessType === 'walletRecharge') return wallet.getCachedRechargeOrder(this.orderId)
    return paymentCountdown.getOrder(this.orderId)
  },
  // 鍚姩涓€绉掍竴娆＄殑鏀粯鍊掕鏃讹紝骞跺湪椤甸潰闅愯棌鏃跺仠姝€?
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
  // 璁㈠崟瓒呮椂鍚庡叧闂瘑鐮侀潰鏉垮苟绂佹缁х画鏀粯锛屼笉涓诲姩璺宠浆鎴栧脊绐椼€?
  handleExpired(order) {
    this.stopCountdown()
    const expiredOrder = order || this.getCurrentPaymentOrder()
    if (expiredOrder && expiredOrder.status === 'making') return
    if (this.expired) return
    // 鍊掕鏃剁粨鏉熸椂鍚屾鍏抽棴瀵嗙爜闈㈡澘锛岄伩鍏嶇敤鎴风户缁緭鍏ュ凡澶辨晥璁㈠崟銆?
    clearTimeout(this.passwordSubmitTimer)
    this.paymentPasswordForSubmit = ''
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

/* 鏀粯鏂瑰紡鍚嶇О鍜岃鏄庣揣鍑戞帓鍒楋紝骞朵笌宸︿晶鍥炬爣鐨勮瑙変腑蹇冨榻愩€?*/
.method-row{height:108rpx!important;padding:0!important}
.method-copy{display:flex;flex-direction:column;justify-content:center;gap:4rpx}
.method-copy text:last-child{margin-top:0!important}

/* 鏀粯鏂瑰紡鍚嶇О鍜岃鏄庝綔涓轰竴涓暣浣撲笌鍥炬爣灞呬腑锛屽皬瀛楄创杩戞爣棰樹絾涓嶆嫢鎸ゃ€?*/
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

/* 鏀粯鏂瑰紡鍜屽睍寮€椤逛娇鐢ㄥ崱鐗囪嚜韬殑鐣欑櫧锛屼笉浣跨敤 H5 鍘熺敓鎸夐挳榛樿鐏板簳銆?*/
.method-row,
.more-methods{
  background:transparent!important;
  border-left:0!important;
  border-right:0!important;
  box-shadow:none!important;
}

/* 鏀粯鏂瑰紡涔嬮棿鐣ュ井鎷夊紑锛屽舰鎴愭洿鑸掓湇鐨勫崱鐗囧唴鍛煎惛鎰熴€?*/
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

/* 鏀粯瀵嗙爜閬僵涓庡簳閮ㄩ潰鏉匡紝浣跨敤鐙珛灞傜骇閬垮厤琚敹閾跺彴鎸夐挳瑕嗙洊銆?*/
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

/* 鑷畾涔夋暟瀛楅敭鐩樻部鐢ㄧ郴缁熸敮浠橀敭鐩樼殑涓夊垪缁撴瀯銆?*/
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

