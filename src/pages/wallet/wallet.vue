<template>
<view :style="globalThemeStyle" class="page wallet-page">
  <view class="wallet-nav" :style="`padding-top:${statusHeight}px`">
    <view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">食刻钱包</text><view class="nav-back"></view></view>
  </view>

  <scroll-view v-if="!opened" scroll-y :bounces="false" :show-scrollbar="false" class="wallet-open-scroll">
  <view class="wallet-open-page">
    <view class="open-hero">
      <view class="open-logo"><image src="/static/assets/icons/wallet.svg" mode="aspectFit" /></view>
      <text class="open-title">开通食刻钱包</text>
      <text class="open-subtitle">支付更便捷，每单享随机立减优惠</text>
      <view class="open-orbit orbit-one"></view><view class="open-orbit orbit-two"></view>
    </view>
    <view class="open-benefits card">
      <view><view><image src="/static/assets/icons/payment.svg" mode="aspectFit" /></view><text>钱包快捷支付</text><text>收银台一键完成支付</text></view>
      <view><view><text>惠</text></view><text>每单随机立减</text><text>最高可享30元优惠</text></view>
      <view><view><image src="/static/assets/icons/order.svg" mode="aspectFit" /></view><text>收支记录清晰</text><text>充值、支付和提现随时查看</text></view>
    </view>
    <view class="open-notice">
      <text>开通说明</text>
      <view><text>•</text><text>首次开通及关闭后重新开通，钱包余额均从 ¥0.00 开始。</text></view>
      <view><text>•</text><text>钱包数据按当前登录账号独立保存在设备中。</text></view>
    </view>
    <button hover-class="none" class="open-agreement" @tap="toggleOpenAgree"><view :class="openAgreed ? 'checked' : ''"><image src="/static/assets/icons/check.svg" mode="aspectFit" /></view><text>我已阅读并同意《食刻钱包服务说明》</text></button>
    <button hover-class="none" class="primary-btn open-wallet-btn" @tap="openWallet">{{opening ? '正在开通…' : '立即开通'}}</button>
  </view>
  </scroll-view>

  <view v-else class="wallet-content">
    <view class="balance-card">
      <view class="balance-top"><view class="wallet-badge"><image src="/static/assets/icons/wallet.svg" mode="aspectFit" /></view><text>食刻钱包</text><text>安全保障</text></view>
      <text class="balance-label">可用余额（元）</text>
      <view class="balance-value"><text>¥</text><text>{{balanceVisible ? balance : '****'}}</text><view class="balance-eye" @tap="toggleBalance"><image :src="balanceVisible ? '/static/assets/icons/eye.svg' : '/static/assets/icons/eye-off.svg'" mode="aspectFit" /></view></view>
      <view class="balance-actions">
        <button hover-class="none" class="recharge-button" @tap="openRecharge">充值</button>
        <button hover-class="none" class="withdraw-button" @tap="openWithdraw">提现</button>
        <view class="bill-toggle" @tap="toggleBills">{{showBills ? '隐藏账单' : '显示账单'}}</view>
      </view>
      <view class="balance-glow"></view>
    </view>

    <view :class="`bill-reveal ${showBills ? 'open' : ''}`">
    <view class="bill-card card">
      <view class="bill-head"><text>最近账单</text><text>{{transactions.length ? '近20条' : '暂无记录'}}</text></view>
      <scroll-view scroll-y :bounces="false" :show-scrollbar="false" class="bill-scroll">
      <view v-for="(item, index) in transactions" :key="item.id" class="bill-swipe-row">
        <view class="bill-delete-action"><button hover-class="none" :data-id="item.id" @tap.stop="deleteBill"><image src="/static/assets/icons/delete.svg" mode="aspectFit" /><text>删除</text></button></view>
        <view :class="`bill-row bill-track ${swipedBillId === item.id ? 'swiped' : ''}`" :data-id="item.id" @touchstart="billSwipeStart" @touchend="billSwipeEnd">
          <view :class="`bill-icon ${item.type}`"><image :src="item.type === 'income' ? '/static/assets/icons/plus.svg' : '/static/assets/icons/order.svg'" mode="aspectFit" /></view>
          <view class="bill-copy"><text>{{item.title}}</text><text>{{item.createdAt}}</text></view>
          <text :class="`bill-amount ${item.type}`">{{item.type === 'income' ? '+' : '-'}}¥{{item.amount}}</text>
        </view>
      </view>
      <view v-if="!transactions.length" class="bill-empty"><image src="/static/assets/icons/wallet.svg" mode="aspectFit" /><text>还没有钱包账单</text><text>充值或使用钱包支付后会显示在这里</text></view>
      </scroll-view>
    </view>
    </view>
    <button hover-class="none" class="close-wallet-entry" @tap="requestCloseWallet">关闭食刻钱包</button>
  </view>

  <view v-if="showRecharge" class="wallet-mask" @tap="closeRecharge">
    <view class="recharge-sheet" @tap.stop="noop">
      <view class="sheet-handle"></view>
      <text class="sheet-title">充值到食刻钱包</text>
      <text class="sheet-sub">请选择充值金额</text>
      <view class="amount-grid">
        <button v-for="(item, index) in amounts" :key="item" hover-class="none" :class="selectedAmount === item ? 'selected' : ''" :data-amount="item" @tap="selectAmount"><text>¥</text>{{item}}</button>
      </view>
      <view class="custom-amount"><text>¥</text><input type="digit" placeholder="其他金额" :value="customAmount" @input="customInput" /></view>
      <button hover-class="none" class="primary-btn recharge-confirm" @tap="confirmRecharge">确认充值</button>
    </view>
  </view>

  <view v-if="showWithdraw" class="wallet-mask" @tap="closeWithdraw">
    <view class="recharge-sheet withdraw-sheet" @tap.stop="noop">
      <view class="sheet-handle"></view>
      <text class="sheet-title">提现</text>
      <text class="sheet-sub">当前可提现余额 ¥{{balance}}</text>
      <view class="withdraw-methods">
        <button hover-class="none" :class="withdrawMethod === 'quick' ? 'selected' : ''" data-method="quick" @tap="selectWithdrawMethod"><view class="withdraw-method-icon quick">捷</view><text>提现到第三方平台</text><view class="withdraw-method-radio"></view></button>
        <button hover-class="none" :class="withdrawMethod === 'alipay' ? 'selected' : ''" data-method="alipay" @tap="selectWithdrawMethod"><view class="withdraw-method-icon alipay">支</view><text>提现到支付宝</text><view class="withdraw-method-radio"></view></button>
      </view>
      <view class="withdraw-input"><text>¥</text><input type="digit" placeholder="请输入提现金额" :value="withdrawAmount" @input="withdrawInput" /></view>
      <button hover-class="none" class="withdraw-all-link" @tap="withdrawAll">全部提现</button>
      <button hover-class="none" class="primary-btn recharge-confirm" @tap="confirmWithdraw">确认提现</button>
    </view>
  </view>

  <!-- 提现密码面板：密码输入完成后才会真正扣减钱包余额。 -->
  <view v-if="showWithdrawPassword" class="withdraw-password-mask" @touchmove.stop="noop">
    <view class="withdraw-password-panel">
      <view class="withdraw-password-head">
        <button hover-class="none" @tap.stop="closeWithdrawPassword"><view></view><view></view></button>
        <text>请输入支付密码</text><view></view>
      </view>
      <view class="withdraw-password-body">
        <text>提现到{{withdrawMethod === 'alipay' ? '支付宝' : '第三方平台'}}</text>
        <view class="withdraw-password-amount"><text>¥</text><text>{{withdrawAmount}}</text></view>
        <view class="withdraw-password-boxes"><view v-for="(item, index) in withdrawPasswordSlots" :key="item"><view v-if="withdrawPassword.length > index"></view></view></view>
      </view>
      <view class="withdraw-keyboard">
        <button v-for="(item, index) in withdrawNumberKeys" :key="item" hover-class="none" :data-digit="item" @tap.stop="inputWithdrawDigit">{{item}}</button>
        <view></view><button hover-class="none" data-digit="0" @tap.stop="inputWithdrawDigit">0</button>
        <button hover-class="none" class="withdraw-delete-key" @tap.stop="deleteWithdrawDigit">⌫</button>
      </view>
    </view>
  </view>

  <view v-if="showCloseReasons" class="wallet-mask" @tap="closeCloseReasons">
    <view class="recharge-sheet close-reason-sheet" @tap.stop="noop">
      <view class="sheet-handle"></view>
      <text class="sheet-title">请选择关闭原因</text>
      <text class="sheet-sub">你的反馈将帮助我们改进食刻钱包</text>
      <view class="reason-list">
        <button v-for="(item, index) in closeReasons" :key="item" hover-class="none" :class="selectedCloseReason === item ? 'selected' : ''" :data-reason="item" @tap="selectCloseReason"><text>{{item}}</text><view></view></button>
      </view>
      <textarea v-if="selectedCloseReason === '其他'" maxlength="80" placeholder="请填写具体原因" :value="otherCloseReason" @input="otherReasonInput"></textarea>
      <button hover-class="none" class="primary-btn close-continue" @tap="continueCloseWallet">继续关闭</button>
    </view>
  </view>

  <view v-if="opening || closing" class="wallet-loading">
    <view class="wallet-loading-spinner"></view>
    <text>{{closing ? '正在关闭食刻钱包…' : '正在开通食刻钱包…'}}</text>
  </view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 食刻钱包页：负责开通、余额、充值、提现、账单和关闭钱包流程。

import auth from '../../utils/auth.js'
import wallet from '../../utils/wallet.js'
import store from '../../utils/store.js'
import account from '../../utils/account.js'
import profileTheme from '../../utils/profile-theme.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    opened: false,
    opening: false,
    openAgreed: false,
    balance: '0.00',
    balanceVisible: false,
    transactions: [],
    showBills: false,
    swipedBillId: '',
    showRecharge: false,
    showWithdraw: false,
    withdrawAmount: '',
    withdrawMethod: 'quick',
    showWithdrawPassword: false,
    withdrawPassword: '',
    withdrawPasswordSlots: [0, 1, 2, 3, 4, 5],
    withdrawNumberKeys: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    showCloseReasons: false,
    closeReasons: ['暂时不需要', '使用频率较低', '担心账户安全', '优惠不够吸引', '其他'],
    selectedCloseReason: '',
    otherCloseReason: '',
    closing: false,
    selectedAmount: 50,
    customAmount: '',
    amounts: [20, 50, 100]
  },
  onLoad() {
    if (!auth.guardPage('/pages/wallet/wallet')) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  onShow() { this.refresh() },
  // 读取钱包余额和最近账单，每次返回页面都重新同步。
  refresh() {
    const data = wallet.getWallet()
    this.setData({
      opened: data.opened,
      balance: data.balance.toFixed(2),
      transactions: data.transactions.slice(0, 20),
      swipedBillId: ''
    })
  },
  back() { uni.navigateBack() },
  toggleOpenAgree() { this.setData({ openAgreed: !this.openAgreed }) },
  // 用户同意服务说明后模拟开通，首次余额必须为零。
  openWallet() {
    if (!this.openAgreed) return uni.showToast({ title: '请先阅读并同意钱包服务说明', icon: 'none' })
    if (this.opening) return
    this.setData({ opening: true })
    setTimeout(() => {
      wallet.openWallet()
      this.setData({ opening: false, opened: true, balance: '0.00', transactions: [], balanceVisible: false })
      uni.showToast({ title: '开通成功', icon: 'success' })
    }, 700)
  },
  toggleBalance() { this.setData({ balanceVisible: !this.balanceVisible }) },
  toggleBills() { this.setData({ showBills: !this.showBills, swipedBillId: '' }) },
  openRecharge() { this.setData({ showRecharge: true, selectedAmount: 50, customAmount: '' }) },
  closeRecharge() { this.setData({ showRecharge: false }) },
  openWithdraw() {
    if (Number(this.balance) <= 0) return uni.showToast({ title: '当前没有可提现余额', icon: 'none' })
    this.setData({ showWithdraw: true, withdrawAmount: '', withdrawMethod: 'quick' })
  },
  closeWithdraw() {
    if (this.showWithdrawPassword) return
    this.setData({ showWithdraw: false })
  },
  withdrawInput(e) { this.setData({ withdrawAmount: e.detail.value }) },
  withdrawAll() { this.setData({ withdrawAmount: this.balance }) },
  selectWithdrawMethod(e) { this.setData({ withdrawMethod: e.currentTarget.dataset.method }) },
  // 提现前校验金额和余额，再拉起六位密码面板。
  confirmWithdraw() {
    const amount = Number(this.withdrawAmount)
    const balance = Number(this.balance)
    if (!Number.isFinite(amount) || amount <= 0) return uni.showToast({ title: '请输入正确的提现金额', icon: 'none' })
    if (amount > balance) return uni.showToast({ title: '提现金额不能超过余额', icon: 'none' })
    // 金额与到账方式确认后拉起密码面板，输入完成前不会扣减钱包余额。
    this.setData({ showWithdrawPassword: true, withdrawPassword: '' })
  },
  closeWithdrawPassword() {
    clearTimeout(this.withdrawPasswordTimer)
    this.setData({ showWithdrawPassword: false, withdrawPassword: '' })
  },
  inputWithdrawDigit(e) {
    const digit = String(e.currentTarget.dataset.digit || '')
    if (!/^\d$/.test(digit) || this.withdrawPassword.length >= 6) return
    const withdrawPassword = `${this.withdrawPassword}${digit}`
    this.setData({ withdrawPassword })
    // 任意六位数字均可完成密码验证，短暂停顿用于展示最后一位密码圆点。
    if (withdrawPassword.length === 6) {
      clearTimeout(this.withdrawPasswordTimer)
      this.withdrawPasswordTimer = setTimeout(() => this.finishWithdraw(), 180)
    }
  },
  deleteWithdrawDigit() {
    if (!this.withdrawPassword.length) return
    this.setData({ withdrawPassword: this.withdrawPassword.slice(0, -1) })
  },
  // 密码输入完成后扣减余额并记录提现渠道。
  finishWithdraw() {
    if (this.withdrawPassword.length !== 6) return
    const amount = Number(this.withdrawAmount)
    const result = wallet.withdraw(amount, this.withdrawMethod)
    if (!result) {
      this.setData({ showWithdrawPassword: false, withdrawPassword: '' })
      return uni.showToast({ title: '提现失败，请重试', icon: 'none' })
    }
    this.setData({ showWithdrawPassword: false, withdrawPassword: '', showWithdraw: false })
    this.refresh()
    uni.showToast({ title: '提现成功', icon: 'success' })
  },
  noop() {},
  selectAmount(e) { this.setData({ selectedAmount: Number(e.currentTarget.dataset.amount), customAmount: '' }) },
  customInput(e) { this.setData({ customAmount: e.detail.value, selectedAmount: 0 }) },
  // 充值只创建待支付单，必须进入收银台支付后才到账。
  confirmRecharge() {
    const amount = Number(this.customAmount || this.selectedAmount)
    if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
      return uni.showToast({ title: '请输入1至5000元的金额', icon: 'none' })
    }
    // 充值先创建待支付订单，再进入收银台；此处不直接修改余额。
    const rechargeOrder = wallet.createRechargeOrder(amount)
    if (!rechargeOrder) return uni.showToast({ title: '暂时无法充值，请重试', icon: 'none' })
    this.setData({ showRecharge: false })
    uni.navigateTo({
      url: `/pages/pay/pay?type=walletRecharge&recharge=${rechargeOrder.id}`
    })
  },
  billSwipeStart(e) {
    const touch = e.changedTouches[0]
    this.billTouchX = touch ? touch.clientX : 0
    this.billTouchY = touch ? touch.clientY : 0
  },
  // 账单左滑显示删除入口，纵向滚动不会误触。
  billSwipeEnd(e) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this.billTouchX
    const dy = touch.clientY - this.billTouchY
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 35) return
    this.setData({ swipedBillId: dx < 0 ? e.currentTarget.dataset.id : '' })
  },
  deleteBill(e) {
    const id = e.currentTarget.dataset.id
    uni.showModal({
      title: '删除账单记录',
      content: '账单记录一旦删除将无法恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#ff4d3d',
      success: res => {
        if (!res.confirm) return
        wallet.deleteTransaction(id)
        this.refresh()
        uni.showToast({ title: '记录已删除', icon: 'none' })
      }
    })
  },
  // 余额非零时禁止关闭钱包。
  requestCloseWallet() {
    if (Number(this.balance) !== 0) {
      return uni.showModal({
        title: '暂时无法关闭',
        content: '钱包中还有余额，请先将余额全部提现后再关闭食刻钱包。',
        showCancel: false,
        confirmText: '知道了'
      })
    }
    this.setData({
      showCloseReasons: true,
      selectedCloseReason: '',
      otherCloseReason: ''
    })
  },
  closeCloseReasons() { this.setData({ showCloseReasons: false }) },
  selectCloseReason(e) { this.setData({ selectedCloseReason: e.currentTarget.dataset.reason }) },
  otherReasonInput(e) { this.setData({ otherCloseReason: e.detail.value }) },
  // 校验关闭原因并二次确认，关闭后限定主题自动回退。
  continueCloseWallet() {
    const reason = this.selectedCloseReason
    const other = this.otherCloseReason.trim()
    if (!reason) return uni.showToast({ title: '请选择关闭原因', icon: 'none' })
    if (reason === '其他' && !other) return uni.showToast({ title: '请填写关闭原因', icon: 'none' })
    uni.showModal({
      title: '确认关闭食刻钱包？',
      content: '关闭后将无法使用食刻钱包支付，也不能享受钱包支付立减优惠。重新使用时需要再次开通。',
      confirmText: '继续关闭',
      confirmColor: '#ff4d3d',
      success: res => {
        if (!res.confirm) return
        this.setData({ showCloseReasons: false, closing: true })
        setTimeout(() => {
          wallet.closeWallet(reason === '其他' ? other : reason)
          const currentTheme = profileTheme.getTheme(store.get('sk_profile_theme', 'black'))
          if (currentTheme.limited) account.saveTheme('black')
          this.setData({ closing: false })
          uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/profile/profile' }) })
        }, 1100)
      }
    })
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.wallet-page{height:100vh;min-height:0;padding-bottom:0;overflow:hidden;background:linear-gradient(180deg,#fff4ee 0,#f5f5f7 330rpx);display:flex;flex-direction:column}
.wallet-nav{position:relative;z-index:50;flex-shrink:0;background:rgba(255,246,241,.96)}
.wallet-content{flex:1;min-height:0;padding:12rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));display:flex;flex-direction:column;overflow:hidden}
.balance-card{position:relative;min-height:330rpx;flex-shrink:0;overflow:hidden;padding:28rpx 30rpx;border-radius:40rpx;background:linear-gradient(135deg,#222225 0,#353238 58%,#51362c 100%);color:#fff;box-shadow:0 22rpx 50rpx rgba(36,30,30,.22)}
.balance-top{position:relative;z-index:2;display:flex;align-items:center}.wallet-badge{width:54rpx;height:54rpx;border-radius:18rpx;background:var(--theme-gradient);display:flex;align-items:center;justify-content:center}.wallet-badge image{width:31rpx;height:31rpx;filter:brightness(0) invert(1)}.balance-top>text:nth-child(2){margin-left:14rpx;font-size:25rpx;font-weight:750}.balance-top>text:last-child{margin-left:auto;padding:7rpx 13rpx;border-radius:999rpx;background:rgba(255,255,255,.1);color:rgba(255,255,255,.72);font-size:17rpx}
.balance-label{position:relative;z-index:2;display:block;margin-top:34rpx;color:rgba(255,255,255,.62);font-size:20rpx}.balance-value{position:relative;z-index:2;min-height:82rpx;width:max-content;max-width:100%;margin-top:7rpx;display:inline-flex;align-items:center;font-size:66rpx;font-weight:850;letter-spacing:-2rpx}.balance-value>text:first-child{margin-right:7rpx;font-size:27rpx}.balance-value>text:nth-child(2){flex:0 0 auto;font-size:66rpx}.balance-eye{width:48rpx;height:48rpx;flex:0 0 48rpx;margin-left:8rpx;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;overflow:hidden}.balance-eye image{width:28rpx;height:28rpx;filter:brightness(0) saturate(100%) invert(38%) sepia(8%) saturate(550%) hue-rotate(210deg);opacity:.85}
.balance-actions{position:relative;z-index:2;width:100%;display:flex;align-items:center;gap:12rpx;margin-top:20rpx}.balance-actions .recharge-button,.balance-actions .withdraw-button{width:150rpx!important;min-width:150rpx!important;max-width:150rpx!important;height:62rpx;margin:0!important;padding:0!important;border-radius:999rpx;font-size:21rpx;font-weight:700;line-height:1;display:flex;align-items:center;justify-content:center}.balance-actions .recharge-button{background:var(--theme-gradient);color:#fff;box-shadow:0 10rpx 22rpx var(--theme-shadow)}.balance-actions .withdraw-button{border:2rpx solid rgba(255,255,255,.58);background:transparent;color:#fff}.balance-actions .bill-toggle{width:auto;min-width:0;max-width:none;height:62rpx;margin:0 0 0 auto;padding:0;color:rgba(255,255,255,.9);font-size:21rpx;font-weight:650;display:flex;align-items:center;justify-content:flex-end;line-height:1;text-align:right;white-space:nowrap}
.balance-glow{position:absolute;right:-90rpx;bottom:-155rpx;width:390rpx;height:390rpx;border-radius:50%;background:radial-gradient(circle,rgba(255,124,73,.26),transparent 66%)}
.bill-card{height:100%;min-height:0;padding:27rpx;display:flex;flex-direction:column}.bill-head{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding-bottom:18rpx}.bill-head text:first-child{font-size:29rpx;font-weight:800}.bill-head text:last-child{color:#aaa;font-size:19rpx}.bill-scroll{flex:1;min-height:0;height:0}.bill-row{min-height:104rpx;display:flex;align-items:center;border-top:1rpx solid #f0f0f2}.bill-icon{width:58rpx;height:58rpx;flex:0 0 58rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center}.bill-icon.income{background:#eaf8ef}.bill-icon.expense{background:var(--orange-soft)}.bill-icon image{width:29rpx;height:29rpx}.bill-icon.income image{filter:invert(50%) sepia(51%) saturate(610%) hue-rotate(92deg)}.bill-icon.expense image{filter:invert(47%) sepia(92%) saturate(2426%) hue-rotate(338deg)}
.bill-reveal{flex:0 0 0;min-height:0;margin-top:0;overflow:hidden;opacity:0;pointer-events:none;transform:translateY(-18rpx);transition:flex-basis .42s cubic-bezier(.22,.61,.36,1),opacity .24s ease,transform .38s cubic-bezier(.22,.61,.36,1),margin-top .38s ease}.bill-reveal.open{flex:1 1 0;margin-top:20rpx;opacity:1;pointer-events:auto;transform:translateY(0)}.bill-reveal .bill-card{margin-top:0}
.bill-copy{flex:1;min-width:0;padding-left:16rpx}.bill-copy text{display:block}.bill-copy text:first-child{font-size:23rpx;font-weight:700}.bill-copy text:last-child{margin-top:6rpx;color:#aaa;font-size:17rpx}.bill-amount{font-size:25rpx;font-weight:800}.bill-amount.income{color:#2a9b5b}.bill-amount.expense{color:#222}
.bill-swipe-row{position:relative;overflow:hidden;border-top:1rpx solid #f0f0f2}.bill-swipe-row:first-of-type{border-top:0}.bill-track{position:relative;z-index:2;border-top:0;background:#fff;transform:translate3d(0,0,0);transition:transform .25s cubic-bezier(.22,.61,.36,1);backface-visibility:hidden}.bill-track.swiped{transform:translate3d(-96rpx,0,0)}.bill-delete-action{position:absolute;z-index:1;top:0;right:0;bottom:0;width:96rpx;display:flex;align-items:center;justify-content:center;background:#fff}.bill-delete-action button{width:68rpx!important;min-width:68rpx!important;max-width:68rpx!important;height:68rpx;padding:0!important;border-radius:50%;background:linear-gradient(145deg,#ff6b58,#ed493b);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2rpx;font-size:16rpx;box-shadow:0 8rpx 18rpx rgba(28,28,32,.12)}.bill-delete-action image{width:24rpx;height:24rpx;filter:brightness(0) invert(1)}
.bill-empty{padding:54rpx 0 35rpx;display:flex;flex-direction:column;align-items:center;color:#aaa}.bill-empty image{width:76rpx;height:76rpx;opacity:.22}.bill-empty text{display:block}.bill-empty text:nth-child(2){margin-top:15rpx;color:#777;font-size:23rpx;font-weight:650}.bill-empty text:last-child{margin-top:7rpx;font-size:18rpx}
.wallet-mask{position:fixed;z-index:120;inset:0;background:rgba(20,20,22,.38);display:flex;align-items:flex-end}.recharge-sheet{width:100%;padding:17rpx 30rpx calc(28rpx + env(safe-area-inset-bottom));border-radius:40rpx 40rpx 0 0;background:#fff}.sheet-handle{width:72rpx;height:8rpx;margin:0 auto 24rpx;border-radius:999rpx;background:#ddd}.sheet-title{display:block;font-size:32rpx;font-weight:800}.sheet-sub{display:block;margin-top:8rpx;color:#999;font-size:20rpx}.amount-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14rpx;margin-top:24rpx}.amount-grid button{width:100%!important;min-width:0!important;max-width:none!important;height:72rpx;padding:0!important;border:2rpx solid transparent;border-radius:999rpx;background:#f5f5f7;font-size:26rpx;font-weight:750;line-height:1;display:flex;align-items:center;justify-content:center;white-space:nowrap}.amount-grid button text{font-size:18rpx;margin-right:2rpx}.amount-grid button.selected{border-color:var(--theme-border);background:var(--orange-soft);color:var(--orange)}.custom-amount{height:82rpx;margin-top:16rpx;padding:0 22rpx;border-radius:999rpx;background:#f5f5f7;display:flex;align-items:center}.custom-amount>text{font-size:27rpx;font-weight:750}.custom-amount input{flex:1;height:82rpx;padding-left:12rpx;font-size:24rpx}.recharge-confirm{height:84rpx;margin-top:24rpx;display:flex;align-items:center;justify-content:center;line-height:1}

.close-wallet-entry{width:100%!important;height:58rpx;flex:0 0 58rpx;margin:auto 0 0;padding:0!important;color:#3977c5;font-size:20rpx;font-weight:400;display:flex;align-items:flex-end;justify-content:center;line-height:1}

/* Wallet opening experience. */
.wallet-open-scroll{flex:1;min-height:0;height:0}.wallet-open-page{padding:12rpx 24rpx calc(45rpx + env(safe-area-inset-bottom))}
.open-hero{position:relative;min-height:300rpx;overflow:hidden;padding:38rpx 30rpx;border-radius:42rpx;background:linear-gradient(145deg,#242326,#3d342f);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:0 20rpx 50rpx rgba(34,30,31,.2)}
.open-logo{position:relative;z-index:2;width:100rpx;height:100rpx;border-radius:32rpx;background:var(--theme-gradient);display:flex;align-items:center;justify-content:center;box-shadow:0 15rpx 30rpx var(--theme-shadow)}.open-logo image{width:54rpx;height:54rpx;filter:brightness(0) invert(1)}
.open-title{position:relative;z-index:2;margin-top:22rpx;font-size:38rpx;font-weight:850}.open-subtitle{position:relative;z-index:2;margin-top:10rpx;color:rgba(255,255,255,.68);font-size:21rpx}
.open-orbit{position:absolute;border-radius:50%;border:1rpx solid rgba(255,255,255,.07)}.orbit-one{right:-100rpx;top:-150rpx;width:390rpx;height:390rpx}.orbit-two{left:-130rpx;bottom:-210rpx;width:430rpx;height:430rpx}
.open-benefits{margin-top:20rpx;padding:8rpx 27rpx}.open-benefits>view{min-height:112rpx;display:grid;grid-template-columns:62rpx 1fr;grid-template-rows:auto auto;align-content:center;border-bottom:1rpx solid #eeeeF1}.open-benefits>view:last-child{border-bottom:0}.open-benefits>view>view{grid-row:1/3;width:52rpx;height:52rpx;border-radius:18rpx;background:var(--orange-soft);display:flex;align-items:center;justify-content:center}.open-benefits image{width:28rpx;height:28rpx}.open-benefits>view:nth-child(2)>view text{color:var(--orange);font-size:20rpx;font-weight:800}.open-benefits>view>text:nth-child(2){font-size:24rpx;font-weight:750}.open-benefits>view>text:last-child{margin-top:5rpx;color:#999;font-size:18rpx}
.open-notice{margin:24rpx 8rpx 0}.open-notice>text{display:block;font-size:25rpx;font-weight:800}.open-notice>view{display:flex;margin-top:12rpx;color:#888;font-size:19rpx;line-height:1.55}.open-notice>view>text:first-child{margin-right:9rpx;color:var(--orange)}
.open-agreement{width:100%!important;margin-top:28rpx;display:flex;align-items:center;justify-content:center;color:#777;font-size:19rpx}.open-agreement>view{width:34rpx;height:34rpx;margin-right:10rpx;border:2rpx solid #ccc;border-radius:10rpx;display:flex;align-items:center;justify-content:center}.open-agreement>view.checked{border-color:var(--orange);background:var(--orange)}.open-agreement image{width:19rpx;height:19rpx;opacity:0;filter:brightness(0) invert(1)}.open-agreement>view.checked image{opacity:1}
.open-wallet-btn{height:88rpx;margin-top:22rpx}

/* Withdrawal and closure flows. */
.withdraw-input{height:88rpx;margin-top:24rpx;padding:0 22rpx;border-radius:999rpx;background:#f5f5f7;display:flex;align-items:center}.withdraw-input>text{font-size:28rpx;font-weight:800}.withdraw-input input{flex:1;height:88rpx;padding-left:12rpx;font-size:25rpx}.withdraw-all-link{width:auto!important;min-width:0!important;max-width:none!important;height:48rpx;margin:10rpx 0 0;padding:0!important;color:#3977c5;font-size:20rpx;font-weight:400;line-height:1;display:flex;align-items:center;justify-content:flex-start;text-align:left}.withdraw-sheet .recharge-confirm{margin-top:8rpx}
.withdraw-methods{margin-top:22rpx;border-radius:28rpx;background:#f6f6f8;overflow:hidden}
.withdraw-methods button{width:100%!important;max-width:none!important;height:88rpx;padding:0 20rpx!important;display:flex;align-items:center;text-align:left;border-top:1rpx solid #e8e8eb}
.withdraw-methods button:first-child{border-top:0}
.withdraw-method-icon{width:48rpx;height:48rpx;flex:0 0 48rpx;margin-right:15rpx;border-radius:16rpx;display:flex;align-items:center;justify-content:center;color:#fff;font-size:20rpx;font-weight:800}
.withdraw-method-icon.quick{background:#07c160}.withdraw-method-icon.alipay{background:#1677ff}
.withdraw-methods button>text{flex:1;font-size:22rpx;font-weight:650}
.withdraw-method-radio{width:34rpx;height:34rpx;border:2rpx solid #c7c7cc;border-radius:50%}
.withdraw-methods button.selected .withdraw-method-radio{border:10rpx solid var(--orange)}
.withdraw-password-mask{position:fixed;z-index:180;inset:0;background:rgba(0,0,0,.48);display:flex;align-items:flex-end}
.withdraw-password-panel{width:100%;overflow:hidden;border-radius:36rpx 36rpx 0 0;background:#fff;animation:withdrawPanelUp .28s cubic-bezier(.22,.61,.36,1)}
.withdraw-password-head{height:92rpx;padding:0 28rpx;border-bottom:1rpx solid #ececef;display:grid;grid-template-columns:64rpx 1fr 64rpx;align-items:center}
.withdraw-password-head>text{text-align:center;font-size:29rpx;font-weight:750}
.withdraw-password-head>button{position:relative;width:56rpx!important;height:56rpx;padding:0!important}
.withdraw-password-head>button view{position:absolute;left:14rpx;top:27rpx;width:28rpx;height:3rpx;border-radius:3rpx;background:#666}
.withdraw-password-head>button view:first-child{transform:rotate(45deg)}.withdraw-password-head>button view:last-child{transform:rotate(-45deg)}
.withdraw-password-body{padding:29rpx 38rpx 36rpx;text-align:center}.withdraw-password-body>text{color:#777;font-size:21rpx}
.withdraw-password-amount{margin-top:13rpx;display:flex;align-items:baseline;justify-content:center}.withdraw-password-amount text:first-child{font-size:28rpx;font-weight:750}.withdraw-password-amount text:last-child{font-size:57rpx;font-weight:850}
.withdraw-password-boxes{height:90rpx;margin-top:28rpx;overflow:hidden;border:2rpx solid #d8d8dd;border-radius:18rpx;display:grid;grid-template-columns:repeat(6,1fr)}
.withdraw-password-boxes>view{position:relative;display:flex;align-items:center;justify-content:center}.withdraw-password-boxes>view:not(:last-child)::after{content:"";position:absolute;right:0;top:0;bottom:0;width:1rpx;background:#dedee2}
.withdraw-password-boxes>view>view{width:21rpx;height:21rpx;border-radius:50%;background:#171719}
.withdraw-keyboard{display:grid;grid-template-columns:repeat(3,1fr);gap:1rpx;padding-bottom:env(safe-area-inset-bottom);background:#cfd1d5}
.withdraw-keyboard button,.withdraw-keyboard>view{width:100%!important;max-width:none!important;height:103rpx;border-radius:0;display:flex;align-items:center;justify-content:center;background:#fff;font-size:39rpx}
.withdraw-keyboard>view,.withdraw-keyboard .withdraw-delete-key{background:#d9dbe0!important}.withdraw-delete-key{font-size:35rpx!important}
@keyframes withdrawPanelUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.close-reason-sheet{max-height:82vh;overflow-y:auto}.reason-list{margin-top:22rpx}.reason-list button{width:100%!important;height:74rpx;border-top:1rpx solid #eee;display:flex;align-items:center;justify-content:space-between;text-align:left}.reason-list button>text{font-size:23rpx}.reason-list button>view{width:34rpx;height:34rpx;border:2rpx solid #ccc;border-radius:50%}.reason-list button.selected>view{border:10rpx solid var(--orange)}.close-reason-sheet textarea{width:100%;height:130rpx;margin-top:14rpx;padding:18rpx 20rpx;border-radius:24rpx;background:#f5f5f7;font-size:22rpx}.close-continue{height:84rpx;margin-top:24rpx}
.wallet-loading{position:fixed;z-index:200;inset:0;background:rgba(20,20,22,.82);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.wallet-loading-spinner{width:76rpx;height:76rpx;border:7rpx solid rgba(255,255,255,.2);border-top-color:var(--orange);border-radius:50%;animation:wallet-spin .8s linear infinite}.wallet-loading text{margin-top:22rpx;font-size:23rpx}@keyframes wallet-spin{to{transform:rotate(360deg)}}

/* “全部提现”和“关闭食刻钱包”是文字入口，保持透明，不使用 H5 button 默认灰底。 */
.wallet-page .withdraw-all-link,
.wallet-page .close-wallet-entry,
.wallet-page uni-button.withdraw-all-link,
.wallet-page uni-button.close-wallet-entry{
  background:transparent!important;
  background-color:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
.wallet-page .withdraw-all-link::after,
.wallet-page .close-wallet-entry::after,
.wallet-page uni-button.withdraw-all-link::after,
.wallet-page uni-button.close-wallet-entry::after{
  display:none!important;
  border:0!important;
  background:transparent!important;
}

/* 账单左滑删除圆钮：图标与“删除”文字距离更紧凑。 */
.wallet-page .bill-delete-action button{
  gap:0!important;
  line-height:1!important;
}
.wallet-page .bill-delete-action image{
  width:22rpx!important;
  height:22rpx!important;
  margin:0 0 1rpx!important;
}
.wallet-page .bill-delete-action text{
  margin-top:0!important;
  font-size:15rpx!important;
  line-height:17rpx!important;
  white-space:nowrap!important;
}

</style>
