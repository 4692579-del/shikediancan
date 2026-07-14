import cloud from './cloud.js'
import store from './store.js'

const FUNCTION_NAME = 'order-service'
const LEGACY_CLEAR_KEY = 'sk_orders_backend_v1_cleared'
const ORDERS_SYNC_TIME_KEY = 'sk_orders_backend_sync_at'
const ORDERS_SYNC_TTL = 8000
const CART_SYNC_TIME_KEY = 'sk_cart_backend_sync_at'
const CART_SYNC_TTL = 8000
const REVIEWS_SYNC_TIME_KEY = 'sk_reviews_backend_sync_at'
const REVIEWS_SYNC_TTL = 8000

let ordersPromise = null
let cartPromise = null
let reviewsPromise = null

function currentUserId() {
  const user = store.get('sk_user', null)
  return user && (user.uid || user.userId || user.accountId || user.username)
}

function ensureUserId() {
  const userId = currentUserId()
  if (!userId) throw new Error('请先登录')
  return String(userId)
}

async function call(action, payload = {}) {
  const result = await cloud.callFunction({
    name: FUNCTION_NAME,
    data: {
      action,
      userId: ensureUserId(),
      ...payload
    }
  })
  const data = result.result || {}
  if (data.code !== 0) throw new Error(data.message || '后端服务暂时不可用')
  return data
}

function clearLegacyOrdersOnce() {
  if (uni.getStorageSync(LEGACY_CLEAR_KEY)) return
  uni.setStorageSync('sk_orders', [])
  uni.setStorageSync(LEGACY_CLEAR_KEY, true)
}

function getCachedOrders() {
  const orders = store.get('sk_orders', [])
  return Array.isArray(orders) ? orders : []
}

function saveOrdersCache(orders = []) {
  store.set('sk_orders', Array.isArray(orders) ? orders : [])
  uni.setStorageSync(ORDERS_SYNC_TIME_KEY, Date.now())
  return getCachedOrders()
}

function patchOrderCache(order) {
  if (!order || !order.id) return getCachedOrders()
  const orders = getCachedOrders()
  return saveOrdersCache([order, ...orders.filter(item => item.id !== order.id)])
}

function getCachedCart() {
  const cart = store.get('sk_cart', [])
  return Array.isArray(cart) ? cart : []
}

function saveCartCache(cart = []) {
  store.set('sk_cart', Array.isArray(cart) ? cart : [])
  uni.setStorageSync(CART_SYNC_TIME_KEY, Date.now())
  return getCachedCart()
}

async function fetchCart(options = {}) {
  const force = Boolean(options.force)
  const cached = getCachedCart()
  const lastSyncAt = Number(uni.getStorageSync(CART_SYNC_TIME_KEY) || 0)
  if (!force && Date.now() - lastSyncAt < CART_SYNC_TTL) return cached
  if (cartPromise) return cartPromise

  cartPromise = call('cart.list')
    .then(data => saveCartCache(data.cart || []))
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      cartPromise = null
    })

  return cartPromise
}

async function saveCart(items) {
  const data = await call('cart.set', { items: items || [] })
  return saveCartCache(data.cart || [])
}

async function clearCart(keys) {
  const data = await call('cart.clear', { keys })
  return saveCartCache(data.cart || [])
}

async function createOrder(order) {
  const data = await call('order.create', { order })
  if (data.order) patchOrderCache(data.order)
  return data.order
}

// 订单列表页面切换频繁，优先读取本地缓存，再按需刷新云端，避免每次切页都长时间空白。
async function fetchOrders(options = {}) {
  clearLegacyOrdersOnce()
  const force = Boolean(options.force)
  const cached = getCachedOrders()
  const lastSyncAt = Number(uni.getStorageSync(ORDERS_SYNC_TIME_KEY) || 0)
  if (!force && cached.length && Date.now() - lastSyncAt < ORDERS_SYNC_TTL) return cached
  if (ordersPromise) return ordersPromise

  ordersPromise = call('order.list')
    .then(data => saveOrdersCache(data.orders || []))
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      ordersPromise = null
    })

  return ordersPromise
}

async function getOrder(id) {
  const data = await call('order.get', { id })
  if (data.order) patchOrderCache(data.order)
  return data.order
}

async function payOrder(id, payload = {}) {
  const data = await call('order.pay', { id, ...payload })
  if (data.order) patchOrderCache(data.order)
  return data.order
}

async function cancelOrder(id, reason = '用户取消') {
  const data = await call('order.cancel', { id, reason })
  if (data.order) patchOrderCache(data.order)
  return data.order
}

async function completeOrder(id) {
  const data = await call('order.complete', { id })
  if (data.order) patchOrderCache(data.order)
  return data.order
}

async function reviewOrder(id, review) {
  const data = await call('order.review', { id, review })
  if (data.order) patchOrderCache(data.order)
  uni.removeStorageSync(REVIEWS_SYNC_TIME_KEY)
  return data.order
}

function getCachedReviews() {
  const reviews = store.get('sk_reviews', [])
  return Array.isArray(reviews) ? reviews : []
}

function saveReviewsCache(reviews = []) {
  store.set('sk_reviews', Array.isArray(reviews) ? reviews : [])
  uni.setStorageSync(REVIEWS_SYNC_TIME_KEY, Date.now())
  return getCachedReviews()
}

async function fetchReviews(options = {}) {
  const force = Boolean(options.force)
  const cached = getCachedReviews()
  const lastSyncAt = Number(uni.getStorageSync(REVIEWS_SYNC_TIME_KEY) || 0)
  if (!force && cached.length && Date.now() - lastSyncAt < REVIEWS_SYNC_TTL) return cached
  if (reviewsPromise) return reviewsPromise

  reviewsPromise = call('review.list')
    .then(data => saveReviewsCache(data.reviews || []))
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      reviewsPromise = null
    })

  return reviewsPromise
}

async function deleteOrder(id) {
  const data = await call('order.delete', { id })
  saveOrdersCache(getCachedOrders().filter(item => item.id !== id))
  saveReviewsCache(getCachedReviews().filter(item => item.id !== id))
  return data
}

export default {
  clearLegacyOrdersOnce,
  getCachedOrders,
  getCachedCart,
  getCachedReviews,
  fetchCart,
  saveCart,
  clearCart,
  createOrder,
  fetchOrders,
  getOrder,
  payOrder,
  cancelOrder,
  completeOrder,
  reviewOrder,
  fetchReviews,
  deleteOrder
}
