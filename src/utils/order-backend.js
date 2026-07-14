import cloud from './cloud.js'
import store from './store.js'

const FUNCTION_NAME = 'order-service'
const LEGACY_CLEAR_KEY = 'sk_orders_backend_v1_cleared'

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

async function fetchCart() {
  const data = await call('cart.list')
  const cart = data.cart || []
  store.set('sk_cart', cart)
  return cart
}

async function saveCart(items) {
  const data = await call('cart.set', { items: items || [] })
  store.set('sk_cart', data.cart || [])
  return data.cart || []
}

async function clearCart(keys) {
  const data = await call('cart.clear', { keys })
  store.set('sk_cart', data.cart || [])
  return data.cart || []
}

async function createOrder(order) {
  const data = await call('order.create', { order })
  return data.order
}

async function fetchOrders() {
  clearLegacyOrdersOnce()
  const data = await call('order.list')
  const orders = data.orders || []
  store.set('sk_orders', orders)
  return orders
}

async function getOrder(id) {
  const data = await call('order.get', { id })
  return data.order
}

async function payOrder(id, payload = {}) {
  const data = await call('order.pay', { id, ...payload })
  return data.order
}

async function cancelOrder(id, reason = '用户取消') {
  const data = await call('order.cancel', { id, reason })
  return data.order
}

async function completeOrder(id) {
  const data = await call('order.complete', { id })
  return data.order
}

async function reviewOrder(id, review) {
  const data = await call('order.review', { id, review })
  return data.order
}

async function deleteOrder(id) {
  return call('order.delete', { id })
}

export default {
  clearLegacyOrdersOnce,
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
  deleteOrder
}
