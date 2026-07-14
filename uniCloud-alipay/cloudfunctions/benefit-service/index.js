'use strict'

const db = uniCloud.database()
const memberships = db.collection('sk_memberships')
const memberOrders = db.collection('sk_member_orders')
const coupons = db.collection('sk_coupons')

const PAYMENT_DURATION = 15 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

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
    plans: {
      month: { id: 'month', name: '连续包月', price: 9.9, unit: '月', days: 30, original: '¥15', tag: '首月特惠' },
      quarter: { id: 'quarter', name: '季度会员', price: 25, unit: '季', days: 90, original: '¥45', tag: '省 ¥20' },
      year: { id: 'year', name: '年度会员', price: 88, unit: '年', days: 365, original: '¥180', tag: '最划算' }
    }
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
    plans: {
      month: { id: 'month', name: '连续包月', price: 19.9, unit: '月', days: 30, original: '¥30', tag: '首月特惠' },
      quarter: { id: 'quarter', name: '季度会员', price: 49, unit: '季', days: 90, original: '¥90', tag: '省 ¥41' },
      year: { id: 'year', name: '年度会员', price: 168, unit: '年', days: 365, original: '¥360', tag: '年度优选' }
    }
  }
}

function now() {
  return Date.now()
}

function ok(data = {}) {
  return { code: 0, ...data }
}

function fail(code, message) {
  return { code, message }
}

function userIdOf(event = {}) {
  return String(event.userId || event.uid || '').trim()
}

function normalizeTier(tier) {
  return tier === 'pro' ? 'pro' : 'plus'
}

function getTierConfig(tier = 'plus') {
  return tiers[normalizeTier(tier)]
}

function getPlan(planId = 'month', tier = 'plus') {
  const config = getTierConfig(tier)
  return config.plans[planId] || config.plans.month
}

function roundMoney(value) {
  return Number((Number(value) || 0).toFixed(2))
}

function monthCycle(timestamp = now()) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function couponExpireAt(membership) {
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).getTime()
  return Math.min(Number(membership.expireAt) || endOfMonth, endOfMonth)
}

function couponTemplates(tier = 'plus') {
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

function makePaymentId() {
  return `PLUS${Date.now()}${Math.random().toString(16).slice(2, 8)}`
}

function toClientDoc(doc = {}) {
  return { ...doc, id: doc._id || doc.id }
}

function toClientMembership(record) {
  if (!record) return null
  const tier = normalizeTier(record.tier)
  return {
    ...toClientDoc(record),
    tier,
    tierName: tiers[tier].name,
    opened: Boolean(record.opened) && Number(record.expireAt) > now()
  }
}

function toClientCoupon(coupon = {}) {
  return {
    ...toClientDoc(coupon),
    id: coupon._id || coupon.id,
    expire: coupon.expire || formatDate(coupon.expireAt || now())
  }
}

function toClientOrder(order = {}) {
  return {
    ...toClientDoc(order),
    id: order._id || order.id || order.paymentId,
    paymentId: order.paymentId || order._id
  }
}

async function getMembership(userId) {
  const result = await memberships.where({ userId }).limit(1).get()
  const record = result.data && result.data[0]
  if (!record) return null
  if (record.opened && Number(record.expireAt) <= now()) {
    const { _id, ...rest } = record
    const expired = { ...rest, opened: false, expiredAt: now(), updatedAt: now() }
    await memberships.doc(record._id).update(expired)
    return { ...expired, _id: record._id }
  }
  return record
}

async function saveMembership(userId, record) {
  const old = await getMembership(userId)
  const { _id, id, ...safeRecord } = record || {}
  const data = { ...safeRecord, userId, updatedAt: now() }
  if (old) {
    await memberships.doc(old._id).update(data)
    return { ...old, ...data, _id: old._id }
  }
  const addResult = await memberships.add({ ...data, createdAt: now() })
  return { ...data, _id: addResult.id }
}

async function autoCancelExpiredOrders(userId) {
  const result = await memberOrders.where({ userId, status: 'unpaid' }).get()
  const expired = (result.data || []).filter(item => Number(item.paymentDeadline) > 0 && Number(item.paymentDeadline) <= now())
  await Promise.all(expired.map(item => memberOrders.doc(item._id).update({
    status: 'cancelled',
    cancelledReason: '支付超时',
    cancelledAt: now(),
    updatedAt: now()
  })))
}

async function getPendingOrder(userId) {
  await autoCancelExpiredOrders(userId)
  const result = await memberOrders.where({ userId, status: 'unpaid' }).limit(1).get()
  return result.data && result.data[0]
}

function calculateUpgradeQuote(activeMembership, targetTier, plan) {
  if (!activeMembership || normalizeTier(activeMembership.tier) !== 'plus' || normalizeTier(targetTier) !== 'pro') {
    return null
  }
  const remainingDays = Math.max(0, Math.ceil((Number(activeMembership.expireAt) - now()) / DAY))
  if (!remainingDays) return null
  const plusMonth = tiers.plus.plans.month.price
  const proMonth = tiers.pro.plans.month.price
  const credit = roundMoney(remainingDays * (plusMonth / 30))
  const base = roundMoney(remainingDays * (proMonth / 30))
  const amount = Math.max(0.01, roundMoney(base - credit))
  return {
    fromTier: 'plus',
    toTier: 'pro',
    remainingDays,
    credit,
    originalAmount: plan.price,
    amount
  }
}

async function issueMonthlyCoupons(userId, membership) {
  if (!membership || !membership.opened || Number(membership.expireAt) <= now()) return []
  const tier = normalizeTier(membership.tier)
  const cycle = monthCycle()
  const existing = await coupons.where({ userId, source: 'plus', tier, cycle }).get()
  if ((existing.data || []).length) return (existing.data || []).map(toClientCoupon)

  const old = await coupons.where({ userId, source: 'plus', used: false }).get()
  await Promise.all((old.data || [])
    .filter(item => item.tier !== tier || item.cycle !== cycle)
    .map(item => coupons.doc(item._id).update({ used: true, expired: true, updatedAt: now() })))

  const expireAt = couponExpireAt(membership)
  const docs = couponTemplates(tier).map((item, index) => ({
    userId,
    title: `${tiers[tier].shortName} 每月专属券`,
    amount: item.amount,
    threshold: item.threshold,
    expireAt,
    expire: formatDate(expireAt),
    type: item.threshold ? '会员满减券' : '会员无门槛券',
    used: false,
    expired: false,
    source: 'plus',
    tier,
    cycle,
    index,
    createdAt: now(),
    updatedAt: now()
  }))
  await Promise.all(docs.map(doc => coupons.add(doc)))
  const fresh = await coupons.where({ userId, source: 'plus', tier, cycle }).get()
  return (fresh.data || []).map(toClientCoupon)
}

async function listCoupons(userId) {
  const membership = await getMembership(userId)
  if (membership && membership.opened && Number(membership.expireAt) > now()) {
    await issueMonthlyCoupons(userId, membership)
  }
  const result = await coupons.where({ userId }).get()
  return (result.data || [])
    .map(item => {
      const expired = Number(item.expireAt) > 0 && Number(item.expireAt) < now()
      return toClientCoupon({ ...item, expired, used: Boolean(item.used || expired) })
    })
    .sort((a, b) => Number(a.used) - Number(b.used) || Number(a.expired) - Number(b.expired) || Number(a.threshold) - Number(b.threshold))
}

async function listMemberOrders(userId) {
  await autoCancelExpiredOrders(userId)
  const result = await memberOrders.where({ userId }).get()
  return (result.data || []).map(toClientOrder).sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
}

async function syncAll(userId) {
  const membership = toClientMembership(await getMembership(userId))
  const couponList = await listCoupons(userId)
  const orderList = await listMemberOrders(userId)
  return ok({ membership, coupons: couponList, memberOrders: orderList })
}

async function createMemberOrder(userId, payload = {}) {
  const tier = normalizeTier(payload.tier)
  const plan = getPlan(payload.planId, tier)
  const currentMembership = await getMembership(userId)
  const currentTier = currentMembership && currentMembership.opened && Number(currentMembership.expireAt) > now()
    ? normalizeTier(currentMembership.tier)
    : ''

  const pending = await getPendingOrder(userId)
  if (pending) return fail('PENDING_MEMBER_ORDER', '当前有待支付的会员订单，请支付或取消后继续开通')
  if (currentTier === 'pro' && tier === 'plus') return fail('PRO_CANNOT_BUY_PLUS', '当前已是PRO会员，无法开通PLUS')

  const upgradeQuote = calculateUpgradeQuote(currentMembership, tier, plan)
  const operation = upgradeQuote ? 'upgrade' : currentTier === tier ? 'renew' : 'open'
  const amount = upgradeQuote ? upgradeQuote.amount : plan.price
  const paymentId = makePaymentId()
  const order = {
    userId,
    paymentId,
    id: paymentId,
    tier,
    tierName: tiers[tier].name,
    planId: plan.id,
    planName: plan.name,
    plan,
    amount: roundMoney(amount),
    originalAmount: roundMoney(plan.price),
    upgradeQuote,
    operation,
    status: 'unpaid',
    paymentDeadline: now() + PAYMENT_DURATION,
    createdAt: now(),
    createdText: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    updatedAt: now()
  }
  const addResult = await memberOrders.add(order)
  return ok({ order: toClientOrder({ ...order, _id: addResult.id }) })
}

async function getMemberOrder(userId, id) {
  await autoCancelExpiredOrders(userId)
  let result = await memberOrders.where({ userId, _id: id }).limit(1).get()
  let order = result.data && result.data[0]
  if (!order) {
    result = await memberOrders.where({ userId, paymentId: id }).limit(1).get()
    order = result.data && result.data[0]
  }
  if (!order) return fail('NOT_FOUND', '会员订单不存在')
  return ok({ order: toClientOrder(order) })
}

async function payMemberOrder(userId, id, payload = {}) {
  const orderResult = await getMemberOrder(userId, id)
  if (orderResult.code !== 0) return orderResult
  const order = orderResult.order
  if (order.status !== 'unpaid') return fail('ORDER_NOT_PAYABLE', '当前会员订单不可支付')
  if (Number(order.paymentDeadline) <= now()) {
    await memberOrders.doc(order._id).update({ status: 'cancelled', cancelledReason: '支付超时', cancelledAt: now(), updatedAt: now() })
    return fail('PAYMENT_EXPIRED', '会员订单已超时取消')
  }
  const current = await getMembership(userId)
  if (current && current.opened && normalizeTier(current.tier) === 'pro' && normalizeTier(order.tier) === 'plus') {
    return fail('PRO_CANNOT_PAY_PLUS', '当前已是PRO会员，无法支付PLUS订单')
  }

  const tier = normalizeTier(order.tier)
  const plan = getPlan(order.planId, tier)
  const baseExpireAt = current && current.opened && normalizeTier(current.tier) === tier && Number(current.expireAt) > now()
    ? Number(current.expireAt)
    : now()
  const expireAt = tier === 'pro' && current && normalizeTier(current.tier) === 'plus'
    ? now() + plan.days * DAY
    : baseExpireAt + plan.days * DAY

  const membership = await saveMembership(userId, {
    opened: true,
    tier,
    tierName: tiers[tier].name,
    planId: plan.id,
    planName: plan.name,
    startedAt: current && current.opened ? (current.startedAt || now()) : now(),
    renewedAt: now(),
    expireAt,
    lastPaymentId: order.paymentId,
    lastPayMethod: payload.method || 'wechat',
    lastPaidAmount: roundMoney(payload.amount || order.amount)
  })

  const paidPatch = {
    status: 'paid',
    paidAmount: roundMoney(payload.amount || order.amount),
    paidAt: now(),
    payMethod: payload.method || 'wechat',
    walletDiscount: roundMoney(payload.walletDiscount || 0),
    updatedAt: now()
  }
  await memberOrders.doc(order._id).update(paidPatch)
  await issueMonthlyCoupons(userId, membership)
  return syncAll(userId)
}

async function cancelMemberOrder(userId, id) {
  const orderResult = await getMemberOrder(userId, id)
  if (orderResult.code !== 0) return orderResult
  const order = orderResult.order
  if (order.status !== 'unpaid') return fail('ORDER_NOT_CANCELABLE', '只有待支付会员订单可以取消')
  await memberOrders.doc(order._id).update({
    status: 'cancelled',
    cancelledReason: '用户取消',
    cancelledAt: now(),
    updatedAt: now()
  })
  return syncAll(userId)
}

async function deleteMemberOrder(userId, id) {
  const orderResult = await getMemberOrder(userId, id)
  if (orderResult.code !== 0) return orderResult
  const order = orderResult.order
  if (order.status === 'unpaid') return fail('ORDER_NOT_DELETABLE', '待支付会员订单不能删除')
  await memberOrders.doc(order._id).remove()
  return syncAll(userId)
}

async function useCoupon(userId, payload = {}) {
  const id = String(payload.couponId || payload.id || '').trim()
  if (!id) return fail('COUPON_REQUIRED', '优惠券不存在')
  let result = await coupons.where({ userId, _id: id }).limit(1).get()
  let coupon = result.data && result.data[0]
  if (!coupon) {
    result = await coupons.where({ userId, id }).limit(1).get()
    coupon = result.data && result.data[0]
  }
  if (!coupon) return fail('NOT_FOUND', '优惠券不存在')
  if (coupon.used) return ok({ coupon: toClientCoupon(coupon) })
  await coupons.doc(coupon._id).update({
    used: true,
    usedAt: now(),
    orderId: payload.orderId || '',
    updatedAt: now()
  })
  return syncAll(userId)
}

async function resetMembership(userId) {
  const membership = await getMembership(userId)
  if (membership) await memberships.doc(membership._id).remove()
  const couponResult = await coupons.where({ userId, source: 'plus' }).get()
  await Promise.all((couponResult.data || []).map(item => coupons.doc(item._id).remove()))
  const orderResult = await memberOrders.where({ userId }).get()
  await Promise.all((orderResult.data || []).map(item => memberOrders.doc(item._id).remove()))
  return syncAll(userId)
}

exports.main = async (event = {}) => {
  const userId = userIdOf(event)
  if (!userId) return fail('NO_LOGIN', '请先登录')
  const action = String(event.action || '').trim()
  const payload = event.payload || {}

  if (action === 'sync' || action === 'benefit.sync') return syncAll(userId)
  if (action === 'coupon.list') return ok({ coupons: await listCoupons(userId) })
  if (action === 'coupon.use') return useCoupon(userId, payload)
  if (action === 'membership.createOrder') return createMemberOrder(userId, payload)
  if (action === 'membership.getOrder') return getMemberOrder(userId, String(payload.id || payload.paymentId || ''))
  if (action === 'membership.listOrders') return ok({ memberOrders: await listMemberOrders(userId) })
  if (action === 'membership.payOrder') return payMemberOrder(userId, String(payload.id || payload.paymentId || ''), payload)
  if (action === 'membership.cancelOrder') return cancelMemberOrder(userId, String(payload.id || payload.paymentId || ''))
  if (action === 'membership.deleteOrder') return deleteMemberOrder(userId, String(payload.id || payload.paymentId || ''))
  if (action === 'membership.reset') return resetMembership(userId)
  return fail('UNKNOWN_ACTION', '未知操作')
}
