// 优惠券与会员权益后端桥接层：负责调用 uniCloud，并把云端数据同步到现有前端状态。

import cloud from './cloud.js'
import store from './store.js'
import membership from './membership.js'

const BENEFIT_SYNC_TIME_KEY = 'sk_benefit_backend_sync_at'
const COUPON_SYNC_TIME_KEY = 'sk_coupon_backend_sync_at'
const MEMBER_ORDER_SYNC_TIME_KEY = 'sk_member_order_backend_sync_at'
const BENEFIT_SYNC_TTL = 8000

let syncPromise = null
let couponPromise = null
let memberOrderPromise = null

function currentUserId() {
  const user = store.get('sk_user', null)
  return user ? String(user.uid || user.id || user._id || '').trim() : ''
}

function ensureUserId() {
  const userId = currentUserId()
  if (!userId) throw new Error('请先登录')
  return userId
}

async function call(action, payload = {}) {
  const result = await cloud.callFunction({
    name: 'benefit-service',
    data: {
      action,
      userId: ensureUserId(),
      payload
    }
  })
  const data = result.result || {}
  if (data.code !== 0) throw new Error(data.message || '会员权益服务暂不可用')
  return data
}

function normalizeCoupon(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    _id: item._id || item.id,
    amount: Number(item.amount) || 0,
    threshold: Number(item.threshold) || 0,
    used: Boolean(item.used),
    expired: Boolean(item.expired),
    source: item.source || 'plus'
  }
}

function normalizeMemberOrder(item = {}) {
  return {
    ...item,
    id: item.paymentId || item.id || item._id,
    _id: item._id,
    paymentId: item.paymentId || item.id || item._id,
    amount: Number(item.amount) || 0,
    originalAmount: Number(item.originalAmount || item.amount) || 0,
    status: item.status || 'unpaid'
  }
}

function applySync(data = {}) {
  membership.setBackendMode(true)
  if (Object.prototype.hasOwnProperty.call(data, 'membership')) {
    if (data.membership) {
      membership.saveMembership(data.membership)
    } else {
      membership.saveMembership({ opened: false, tier: 'plus', expireAt: 0 })
    }
  }
  if (Array.isArray(data.coupons)) {
    store.set('sk_coupons', data.coupons.map(normalizeCoupon))
    uni.setStorageSync(COUPON_SYNC_TIME_KEY, Date.now())
  }
  if (Array.isArray(data.memberOrders)) {
    membership.replacePaymentList(data.memberOrders.map(normalizeMemberOrder))
    uni.setStorageSync(MEMBER_ORDER_SYNC_TIME_KEY, Date.now())
  }
  uni.setStorageSync(BENEFIT_SYNC_TIME_KEY, Date.now())
  return data
}

function getCachedCoupons() {
  const coupons = store.get('sk_coupons', [])
  return Array.isArray(coupons) ? coupons.map(normalizeCoupon) : []
}

function getCachedMemberOrders() {
  return membership.getPaymentList().map(normalizeMemberOrder)
}

function getCachedSyncData() {
  return {
    membership: membership.getMembership(),
    coupons: getCachedCoupons(),
    memberOrders: getCachedMemberOrders()
  }
}

function hasBenefitCache() {
  const cached = getCachedSyncData()
  return Boolean(cached.membership || cached.coupons.length || cached.memberOrders.length)
}

async function syncBenefits(options = {}) {
  if (!currentUserId()) return null
  const force = Boolean(options.force)
  const cached = getCachedSyncData()
  const cachedAvailable = hasBenefitCache()
  const lastSyncAt = Number(uni.getStorageSync(BENEFIT_SYNC_TIME_KEY) || 0)
  if (!force && cachedAvailable && Date.now() - lastSyncAt < BENEFIT_SYNC_TTL) return cached
  if (syncPromise) return syncPromise

  syncPromise = call('sync')
    .then(data => {
      applySync(data)
      return data
    })
    .catch(error => {
      if (cachedAvailable) return cached
      throw error
    })
    .finally(() => {
      syncPromise = null
    })

  return syncPromise
}

async function fetchCoupons(options = {}) {
  const force = Boolean(options.force)
  const cached = getCachedCoupons()
  const lastSyncAt = Number(uni.getStorageSync(COUPON_SYNC_TIME_KEY) || 0)
  if (!force && cached.length && Date.now() - lastSyncAt < BENEFIT_SYNC_TTL) return cached
  if (couponPromise) return couponPromise

  couponPromise = call('coupon.list')
    .then(data => {
      applySync(data)
      return (data.coupons || []).map(normalizeCoupon)
    })
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      couponPromise = null
    })

  return couponPromise
}

async function markCouponUsed(couponId, orderId = '') {
  if (!couponId || !currentUserId()) return null
  const data = await call('coupon.use', { couponId, orderId })
  applySync(data)
  return data
}

async function fetchMemberOrders(options = {}) {
  const force = Boolean(options.force)
  const cached = getCachedMemberOrders()
  const lastSyncAt = Number(uni.getStorageSync(MEMBER_ORDER_SYNC_TIME_KEY) || 0)
  if (!force && cached.length && Date.now() - lastSyncAt < BENEFIT_SYNC_TTL) return cached
  if (memberOrderPromise) return memberOrderPromise

  memberOrderPromise = call('membership.listOrders')
    .then(data => {
      applySync(data)
      return (data.memberOrders || []).map(normalizeMemberOrder)
    })
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      memberOrderPromise = null
    })

  return memberOrderPromise
}

async function getMemberOrder(id) {
  const data = await call('membership.getOrder', { id })
  return normalizeMemberOrder(data.order)
}

async function getPendingMemberOrder() {
  const orders = await fetchMemberOrders()
  return orders.find(item => item.status === 'unpaid') || null
}

async function createMemberOrder(planId, tier = 'plus') {
  const data = await call('membership.createOrder', { planId, tier })
  if (data.order) membership.savePayment(normalizeMemberOrder(data.order))
  return normalizeMemberOrder(data.order)
}

async function payMemberOrder(id, payload = {}) {
  const data = await call('membership.payOrder', { id, ...payload })
  applySync(data)
  return data
}

async function cancelMemberOrder(id) {
  const data = await call('membership.cancelOrder', { id })
  applySync(data)
  return data
}

async function deleteMemberOrder(id) {
  const data = await call('membership.deleteOrder', { id })
  applySync(data)
  return data
}

async function resetMembership() {
  const data = await call('membership.reset')
  applySync(data)
  membership.resetCurrentMembership()
  return data
}

export default {
  getCachedCoupons,
  getCachedMemberOrders,
  syncBenefits,
  fetchCoupons,
  markCouponUsed,
  fetchMemberOrders,
  getMemberOrder,
  getPendingMemberOrder,
  createMemberOrder,
  payMemberOrder,
  cancelMemberOrder,
  deleteMemberOrder,
  resetMembership
}
