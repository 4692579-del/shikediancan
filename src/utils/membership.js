// 会员业务工具：管理 PLUS/PRO 状态、券包、折扣、续费升级与会员支付订单。

import store from './store.js'
const MEMBERSHIP_KEY = 'sk_plus_memberships'
const CURRENT_KEY = 'sk_plus_membership'
const PAYMENT_KEY = 'sk_plus_payments'
const COUPON_ACCOUNTS_KEY = 'sk_plus_coupon_accounts'
const BACKEND_MODE_KEY = 'sk_benefit_backend_enabled'
const PAYMENT_DURATION = 15 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

// 会员等级配置：定义价格方案、券包、折扣上限与配送权益。
const tiers = {
  plus: {
    id: 'plus',
    name: '食刻 PLUS',
    shortName: 'PLUS',
    rank: 1,
    couponValue: 24,
    couponCount: 6,
    discountRate: 0.05,
    discountText: '95折',
    maxDiscount: 10,
    freeDelivery: false,
    plans: [
      { id: 'month', name: '连续包月', price: 9.9, unit: '月', days: 30, original: '¥15', tag: '首月特惠' },
      { id: 'quarter', name: '季度会员', price: 25, unit: '季', days: 90, original: '¥45', tag: '省 ¥20' },
      { id: 'year', name: '年度会员', price: 88, unit: '年', days: 365, original: '¥180', tag: '最划算' }
    ]
  },
  pro: {
    id: 'pro',
    name: '食刻会员 PRO',
    shortName: 'PRO',
    rank: 2,
    couponValue: 40,
    couponCount: 8,
    discountRate: 0.08,
    discountText: '92折',
    maxDiscount: 20,
    freeDelivery: true,
    plans: [
      { id: 'month', name: '连续包月', price: 19.9, unit: '月', days: 30, original: '¥30', tag: '首月特惠' },
      { id: 'quarter', name: '季度会员', price: 49, unit: '季', days: 90, original: '¥90', tag: '省 ¥41' },
      { id: 'year', name: '年度会员', price: 168, unit: '年', days: 365, original: '¥360', tag: '年度优选' }
    ]
  }
}

// 会员状态和会员订单按当前账号隔离。
function accountId() {
  const user = store.get('sk_user', null)
  if (!user) return ''
  return user.accountId || user.phone || 'quick-default'
}

function normalizeTier(tier) {
  return tier === 'pro' ? 'pro' : 'plus'
}

function getTierConfig(tier = 'plus') {
  return { ...tiers[normalizeTier(tier)] }
}

function setBackendMode(enabled = true) {
  uni.setStorageSync(BACKEND_MODE_KEY, Boolean(enabled))
}

function isBackendMode() {
  return Boolean(uni.getStorageSync(BACKEND_MODE_KEY))
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function cycleKey(timestamp = Date.now()) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getPlans(tier = 'plus') {
  return tiers[normalizeTier(tier)].plans.map(item => ({ ...item }))
}

function getPlan(id, tier = 'plus') {
  const plans = tiers[normalizeTier(tier)].plans
  return { ...(plans.find(item => item.id === id) || plans[0]) }
}

function getMemberships() {
  return store.get(MEMBERSHIP_KEY, {})
}

function normalizeRecord(record) {
  if (!record) return null
  const tier = normalizeTier(record.tier)
  return {
    ...record,
    tier,
    tierName: tiers[tier].name
  }
}

// 保存账号会员记录，并同步当前会话中的会员状态。
function saveMembership(record) {
  const id = accountId()
  if (!id) return null
  const normalized = normalizeRecord(record)
  const memberships = getMemberships()
  memberships[id] = normalized
  store.set(MEMBERSHIP_KEY, memberships)
  store.set(CURRENT_KEY, normalized)
  return normalized
}

function rawMembership() {
  const id = accountId()
  if (!id) return null
  const record = normalizeRecord(getMemberships()[id] || null)
  if (record && !getMemberships()[id].tier) saveMembership(record)
  return record
}

function saveCouponSnapshot() {
  const id = accountId()
  if (!id) return
  const accounts = store.get(COUPON_ACCOUNTS_KEY, {})
  accounts[id] = store.get('sk_coupons', []).filter(item => item.source === 'plus')
  store.set(COUPON_ACCOUNTS_KEY, accounts)
}

// 重新登录时恢复该账号尚未使用的会员券。
function restoreCouponSnapshot() {
  const id = accountId()
  if (!id) return
  const coupons = store.get('sk_coupons', [])
  const current = coupons.filter(item => item.source === 'plus')
  if (current.length) {
    saveCouponSnapshot()
    return
  }
  const saved = store.get(COUPON_ACCOUNTS_KEY, {})[id] || []
  if (saved.length) store.set('sk_coupons', [...coupons.filter(item => item.source !== 'plus'), ...saved])
}

function removeMemberCoupons(saveSnapshot = false) {
  if (saveSnapshot) saveCouponSnapshot()
  const coupons = store.get('sk_coupons', [])
  const next = coupons.filter(item => item.source !== 'plus')
  if (next.length !== coupons.length) store.set('sk_coupons', next)
  const selected = store.get('sk_selected_coupon', null)
  if (selected && selected.source === 'plus') uni.removeStorageSync('sk_selected_coupon')
}

function couponTemplates(tier) {
  if (normalizeTier(tier) === 'pro') {
    return [
      { amount: 8, threshold: 30 }, { amount: 8, threshold: 30 },
      { amount: 6, threshold: 25 }, { amount: 6, threshold: 25 },
      { amount: 4, threshold: 20 }, { amount: 4, threshold: 20 },
      { amount: 2, threshold: 0 }, { amount: 2, threshold: 0 }
    ]
  }
  return [
    { amount: 6, threshold: 30 }, { amount: 6, threshold: 30 },
    { amount: 4, threshold: 20 }, { amount: 4, threshold: 20 },
    { amount: 2, threshold: 0 }, { amount: 2, threshold: 0 }
  ]
}

// 每个自然月仅发放一次当前等级券包，并使旧周期未使用券失效。
function grantMonthlyCoupons(record) {
  if (!record || !record.opened || Number(record.expireAt) <= Date.now()) return []
  const tier = normalizeTier(record.tier)
  const cycle = cycleKey()
  const originalCoupons = store.get('sk_coupons', [])
  const coupons = originalCoupons.map(item => (
    item.source === 'plus' && (!item.tier || item.tier !== tier || item.cycle !== cycle) && !item.used
      ? { ...item, used: true, expired: true }
      : item
  ))
  if (JSON.stringify(coupons) !== JSON.stringify(originalCoupons)) store.set('sk_coupons', coupons)
  const selected = store.get('sk_selected_coupon', null)
  if (selected && selected.source === 'plus' && (selected.tier !== tier || selected.cycle !== cycle)) {
    uni.removeStorageSync('sk_selected_coupon')
  }
  const existing = coupons.filter(item => item.source === 'plus' && item.tier === tier && item.cycle === cycle)
  if (existing.length) return existing
  if (isBackendMode()) return []

  const expireAt = Math.min(Number(record.expireAt), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).getTime())
  const issued = couponTemplates(tier).map((item, index) => ({
    id: `${tier}-${cycle}-${index + 1}`,
    title: `${tiers[tier].shortName} 每月专属券`,
    amount: item.amount,
    threshold: item.threshold,
    expire: formatDate(expireAt),
    type: item.threshold ? '会员满减券' : '会员无门槛券',
    used: false,
    source: 'plus',
    tier,
    cycle
  }))
  store.set('sk_coupons', [...coupons, ...issued])
  saveCouponSnapshot()
  return issued
}

// 统一校验会员有效期、券包和当前会话状态。
function syncCurrent() {
  const record = rawMembership()
  if (!record) {
    store.set(CURRENT_KEY, null)
    removeMemberCoupons()
    return null
  }
  if (!record.opened || Number(record.expireAt) <= Date.now()) {
    const expired = { ...record, opened: false, expiredAt: Date.now() }
    saveMembership(expired)
    removeMemberCoupons()
    return expired
  }
  store.set(CURRENT_KEY, record)
  restoreCouponSnapshot()
  grantMonthlyCoupons(record)
  return record
}

function getMembership() {
  return syncCurrent()
}

function isActive() {
  const record = syncCurrent()
  return Boolean(record && record.opened && Number(record.expireAt) > Date.now())
}

function getTier() {
  const record = syncCurrent()
  return isActive() ? normalizeTier(record.tier) : ''
}

function hasTier(requiredTier = 'plus') {
  if (!isActive()) return false
  return tiers[getTier()].rank >= tiers[normalizeTier(requiredTier)].rank
}

function isPro() {
  return hasTier('pro')
}

function daysLeft(record = getMembership()) {
  if (!record || !record.opened) return 0
  return Math.max(0, Math.ceil((Number(record.expireAt) - Date.now()) / DAY))
}

// 按 PLUS 剩余有效天数计算升级 PRO 所需补差价。
function getUpgradeQuote(record = getMembership()) {
  if (!record || !record.opened || normalizeTier(record.tier) !== 'plus') return null
  const plusPlan = getPlan(record.planId, 'plus')
  const proPlan = getPlan(record.planId, 'pro')
  const remainingDays = daysLeft(record)
  const dailyDifference = proPlan.price / proPlan.days - plusPlan.price / plusPlan.days
  return {
    operation: 'upgrade',
    fromTier: 'plus',
    tier: 'pro',
    planId: record.planId,
    planName: `补款升级 PRO（剩余${remainingDays}天）`,
    amount: Number(Math.max(0.01, dailyDifference * remainingDays).toFixed(2)),
    remainingDays
  }
}

// 支付完成后开通、续费或升级会员，并发放对应券包。
function activate(planId, tier = 'plus', payment = {}) {
  const normalizedTier = normalizeTier(tier)
  const plan = getPlan(planId, normalizedTier)
  const current = rawMembership()
  const now = Date.now()
  const upgrading = payment.operation === 'upgrade' && current && current.opened && normalizeTier(current.tier) === 'plus'
  const base = current && current.opened && Number(current.expireAt) > now ? Number(current.expireAt) : now
  const record = {
    ...(current || {}),
    opened: true,
    tier: normalizedTier,
    tierName: tiers[normalizedTier].name,
    planId: upgrading ? current.planId : plan.id,
    planName: upgrading ? current.planName : plan.name,
    startedAt: current && current.startedAt ? current.startedAt : now,
    renewedAt: now,
    upgradedAt: upgrading ? now : current && current.upgradedAt,
    expireAt: upgrading ? Number(current.expireAt) : base + plan.days * DAY,
    lastPaymentId: payment.id || '',
    lastPayMethod: payment.method || '',
    lastPaidAmount: Number(payment.amount || plan.price)
  }
  saveMembership(record)
  grantMonthlyCoupons(record)
  return record
}

// 按会员等级计算订单折扣，同时应用单笔优惠上限。
function getMemberDiscount(goodsTotal) {
  if (!isActive()) return 0
  const config = tiers[getTier()]
  return Number(Math.min(config.maxDiscount, Number(goodsTotal || 0) * config.discountRate).toFixed(2))
}

function hasFreeDelivery() {
  return isPro()
}

function getPayments() {
  return store.get(PAYMENT_KEY, {})
}

function getPaymentList() {
  const id = accountId()
  if (!id) return []
  const payments = getPayments()
  Object.keys(payments).forEach(paymentId => getPayment(paymentId))
  return Object.values(getPayments())
    .filter(item => item && item.accountId === id)
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
}

function getPendingPayment() {
  return getPaymentList().find(item => item.status === 'unpaid') || null
}

function savePayment(payment) {
  const payments = getPayments()
  payments[payment.id] = payment
  store.set(PAYMENT_KEY, payments)
  return payment
}

function replacePaymentList(list = []) {
  const id = accountId()
  if (!id) return []
  const payments = getPayments()
  Object.keys(payments).forEach(paymentId => {
    if (payments[paymentId] && payments[paymentId].accountId === id) delete payments[paymentId]
  })
  list.forEach(item => {
    if (item && item.id) payments[item.id] = { ...item, accountId: id }
  })
  store.set(PAYMENT_KEY, payments)
  return getPaymentList()
}

// 创建会员待支付订单；存在其他待支付会员订单时禁止重复创建。
function createPayment(planId, tier = 'plus') {
  const targetTier = normalizeTier(tier)
  const current = getMembership()
  if (getPendingPayment()) return null
  if (current && current.opened && normalizeTier(current.tier) === 'pro' && targetTier === 'plus') return null
  const upgrade = targetTier === 'pro' ? getUpgradeQuote(current) : null
  const plan = getPlan(planId, targetTier)
  const now = Date.now()
  const payment = upgrade || {
    operation: current && current.opened ? 'renew' : 'open',
    tier: targetTier,
    planId: plan.id,
    planName: `${tiers[targetTier].name} · ${plan.name}`,
    amount: plan.price
  }
  return savePayment({
    ...payment,
    id: `${targetTier.toUpperCase()}${now}${Math.random().toString(16).slice(2, 6)}`,
    accountId: accountId(),
    type: 'membership',
    originalAmount: payment.amount,
    status: 'unpaid',
    createdAt: now,
    paymentDeadline: now + PAYMENT_DURATION
  })
}

// 读取会员订单时自动取消已超过支付期限的订单。
function getPayment(id) {
  const payment = getPayments()[id] || null
  if (!payment) return null
  if (payment.accountId && payment.accountId !== accountId()) return null
  if (payment.status === 'unpaid' && Number(payment.paymentDeadline) <= Date.now()) {
    return savePayment({ ...payment, status: 'cancelled', cancelledReason: '支付超时', cancelledAt: Date.now() })
  }
  return payment
}

function updatePayment(id, patch) {
  const payment = getPayment(id)
  if (!payment) return null
  return savePayment({ ...payment, ...patch })
}

function cancelPayment(id, reason = '用户取消') {
  const payment = getPayment(id)
  if (!payment || payment.status !== 'unpaid') return null
  return savePayment({
    ...payment,
    status: 'cancelled',
    cancelledReason: reason,
    cancelledAt: Date.now(),
    paymentDeadline: null
  })
}

// 付款前校验会员等级变化，防止 PRO 用户支付低等级 PLUS 旧订单。
function canPayPayment(payment) {
  if (!payment || payment.status !== 'unpaid') return { allowed: false, message: '会员订单已失效' }
  const current = getMembership()
  if (!current || !current.opened) return { allowed: true, message: '' }
  const currentTier = normalizeTier(current.tier)
  const targetTier = normalizeTier(payment.tier)
  if (tiers[currentTier].rank > tiers[targetTier].rank) {
    return { allowed: false, message: `当前已是${tiers[currentTier].shortName}会员，无法支付低等级会员订单` }
  }
  if (payment.operation === 'upgrade' && currentTier !== 'plus') {
    return { allowed: false, message: '当前会员状态已变化，该升级订单无法继续支付' }
  }
  return { allowed: true, message: '' }
}

function deletePayment(id) {
  const payment = getPayment(id)
  if (!payment) return false
  const payments = getPayments()
  delete payments[id]
  store.set(PAYMENT_KEY, payments)
  return true
}

// 完成会员订单并调用 activate 落实会员身份和权益。
function completePayment(id, method, amount, discount = 0) {
  const payment = getPayment(id)
  const validation = canPayPayment(payment)
  if (!validation.allowed) return null
  const paid = savePayment({
    ...payment,
    status: 'paid',
    method,
    paidAmount: Number(amount),
    walletDiscount: Number(discount || 0),
    paidAt: Date.now(),
    paymentDeadline: null
  })
  const membership = activate(payment.planId, payment.tier, {
    id: payment.id,
    method,
    amount,
    operation: payment.operation
  })
  return { payment: paid, membership }
}

function clearSession() {
  uni.removeStorageSync(CURRENT_KEY)
  removeMemberCoupons(true)
}

// 开发测试入口：清除当前账号会员、券包和会员订单。
function resetCurrentMembership() {
  const id = accountId()
  if (!id) return false
  const memberships = getMemberships()
  delete memberships[id]
  store.set(MEMBERSHIP_KEY, memberships)
  const couponAccounts = store.get(COUPON_ACCOUNTS_KEY, {})
  delete couponAccounts[id]
  store.set(COUPON_ACCOUNTS_KEY, couponAccounts)
  const payments = getPayments()
  Object.keys(payments).forEach(paymentId => {
    if (payments[paymentId] && payments[paymentId].accountId === id) delete payments[paymentId]
  })
  store.set(PAYMENT_KEY, payments)
  uni.removeStorageSync(CURRENT_KEY)
  removeMemberCoupons()
  return true
}

export default {
  PAYMENT_DURATION,
  getPlans,
  getPlan,
  getTierConfig,
  setBackendMode,
  isBackendMode,
  saveMembership,
  getMembership,
  isActive,
  getTier,
  hasTier,
  isPro,
  syncCurrent,
  activate,
  daysLeft,
  getUpgradeQuote,
  getMemberDiscount,
  hasFreeDelivery,
  grantMonthlyCoupons,
  createPayment,
  savePayment,
  replacePaymentList,
  getPayment,
  getPaymentList,
  getPendingPayment,
  updatePayment,
  cancelPayment,
  canPayPayment,
  deletePayment,
  completePayment,
  clearSession,
  resetCurrentMembership,
  formatDate
}
