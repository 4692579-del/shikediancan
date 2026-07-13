// 支付倒计时工具：格式化剩余时间，并将超时待支付订单自动转为已取消。

import store from './store.js'
const PAYMENT_DURATION = 15 * 60 * 1000

// 把支付截止时间转换为 mm:ss 倒计时文本。
function formatRemaining(deadline, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((Number(deadline) - now) / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

// 旧待支付订单缺少截止时间时补建 15 分钟支付期限。
function ensureDeadline(order, now = Date.now()) {
  if (!order || order.status !== 'unpaid') return order
  if (Number(order.paymentDeadline) > 0) return order
  return { ...order, paymentDeadline: now + PAYMENT_DURATION }
}

// 订单到期后静默修改为已取消，避免继续支付。
function expireOrder(order, now = Date.now()) {
  if (!order || order.status !== 'unpaid') return order
  const normalized = ensureDeadline(order, now)
  if (Number(normalized.paymentDeadline) > now) return normalized
  return { ...normalized, status: 'cancelled', cancelledReason: '支付超时', cancelledAt: now }
}

// 批量规范化本地订单并只在发生变化时回写缓存。
function normalizeOrders(now = Date.now()) {
  const orders = store.get('sk_orders', [])
  let changed = false
  const normalized = orders.map(item => {
    const next = expireOrder(item, now)
    if (
      next.status !== item.status ||
      next.paymentDeadline !== item.paymentDeadline ||
      next.cancelledAt !== item.cancelledAt
    ) changed = true
    return next
  })
  if (changed) store.set('sk_orders', normalized)
  return normalized
}

function getOrder(id, now = Date.now()) {
  return normalizeOrders(now).find(item => item.id === id) || null
}

export default {
  PAYMENT_DURATION,
  formatRemaining,
  ensureDeadline,
  expireOrder,
  normalizeOrders,
  getOrder
}
