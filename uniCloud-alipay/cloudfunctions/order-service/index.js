'use strict'

const db = uniCloud.database()
const carts = db.collection('sk_carts')
const orders = db.collection('sk_orders')

const PAYMENT_DURATION = 15 * 60 * 1000

function now() {
  return Date.now()
}

function ok(data = {}) {
  return { code: 0, ...data }
}

function fail(code, message) {
  return { code, message }
}

function normalizeUserId(event = {}) {
  return String(event.userId || event.uid || '').trim()
}

function makeOrderId() {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 90 + 10)}`
}

function toClientOrder(order = {}) {
  return {
    ...order,
    id: order._id || order.id,
    _id: order._id
  }
}

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return []
  return items.map(item => ({
    ...item,
    id: Number(item.id),
    key: String(item.key || `${item.id}-${item.spec || '标准份'}`),
    name: String(item.name || ''),
    spec: String(item.spec || '标准份'),
    count: Math.max(1, Number(item.count) || 1),
    price: Number(item.price) || 0,
    checked: item.checked !== false
  }))
}

async function getCartDoc(userId) {
  const result = await carts.where({ userId }).limit(1).get()
  return result.data && result.data[0]
}

async function listCart(userId) {
  const cart = await getCartDoc(userId)
  return cart ? normalizeItems(cart.items || []) : []
}

async function setCart(userId, items) {
  const data = {
    userId,
    items: normalizeItems(items),
    updatedAt: now()
  }
  const old = await getCartDoc(userId)
  if (old) await carts.doc(old._id).update(data)
  else await carts.add({ ...data, createdAt: now() })
  return data.items
}

async function autoCancelExpired(userId) {
  const current = now()
  const result = await orders.where({ userId, status: 'unpaid' }).get()
  const expired = (result.data || []).filter(item => Number(item.paymentDeadline) > 0 && Number(item.paymentDeadline) <= current)
  await Promise.all(expired.map(item => orders.doc(item._id).update({
    status: 'cancelled',
    cancelledReason: '支付超时',
    cancelledAt: current,
    updatedAt: current
  })))
}

async function listOrders(userId) {
  await autoCancelExpired(userId)
  const result = await orders.where({ userId, deletedAt: 0 }).get()
  return (result.data || [])
    .map(toClientOrder)
    .sort((a, b) => Number(b.createdAtTimestamp || 0) - Number(a.createdAtTimestamp || 0))
}

async function getOrder(userId, id) {
  await autoCancelExpired(userId)
  const result = await orders.doc(id).get()
  const order = result.data && result.data[0]
  if (!order || order.userId !== userId || order.deletedAt) return null
  return toClientOrder(order)
}

async function updateOrder(userId, id, patch) {
  const order = await getOrder(userId, id)
  if (!order) return null
  await orders.doc(id).update({ ...patch, updatedAt: now() })
  return getOrder(userId, id)
}

exports.main = async (event = {}) => {
  const action = String(event.action || '')
  const userId = normalizeUserId(event)
  if (!userId) return fail(401, '请先登录')

  if (action === 'cart.list') {
    return ok({ cart: await listCart(userId) })
  }

  if (action === 'cart.set') {
    return ok({ cart: await setCart(userId, event.items || []) })
  }

  if (action === 'cart.clear') {
    const current = await listCart(userId)
    const removeKeys = Array.isArray(event.keys) ? event.keys.map(String) : []
    const next = removeKeys.length ? current.filter(item => !removeKeys.includes(String(item.key))) : []
    return ok({ cart: await setCart(userId, next) })
  }

  if (action === 'order.create') {
    const draft = event.order || {}
    const createTime = now()
    const date = new Date(createTime)
    const createdAt = draft.createdAt || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    const order = {
      ...draft,
      userId,
      status: 'unpaid',
      shopName: draft.shopName || '食刻·品质厨房',
      items: normalizeItems(draft.items || []),
      total: Number(draft.total || 0),
      originalTotal: Number(draft.originalTotal || draft.total || 0),
      createdAt,
      createdAtTimestamp: createTime,
      paymentDeadline: createTime + PAYMENT_DURATION,
      payMethod: '',
      paidAt: 0,
      reviewed: false,
      // 评价信息默认使用空对象，避免后续更新 review.anonymous 等子字段时，
      // 数据库因为 review 为 null 而抛出 Cannot create field 的写入异常。
      review: {},
      deletedAt: 0,
      updatedAt: createTime
    }
    if (!order.items.length) return fail(1001, '订单商品不能为空')
    const addResult = await orders.add(order)
    const created = await getOrder(userId, addResult.id)
    return ok({ order: created, id: addResult.id })
  }

  if (action === 'order.list') {
    return ok({ orders: await listOrders(userId) })
  }

  if (action === 'order.get') {
    const order = await getOrder(userId, String(event.id || ''))
    if (!order) return fail(404, '订单不存在')
    return ok({ order })
  }

  if (action === 'order.pay') {
    const id = String(event.id || '')
    const order = await getOrder(userId, id)
    if (!order) return fail(404, '订单不存在')
    if (order.status !== 'unpaid') return fail(1002, '订单当前不可支付')
    if (Number(order.paymentDeadline) <= now()) {
      await updateOrder(userId, id, { status: 'cancelled', cancelledReason: '支付超时', cancelledAt: now() })
      return fail(1003, '订单已超时取消')
    }
    const paidTotal = Number(event.total || order.total || 0)
    const paid = await updateOrder(userId, id, {
      status: 'making',
      payMethod: String(event.payMethod || 'quick'),
      total: paidTotal,
      walletDiscount: Number(event.walletDiscount || 0),
      walletDiscountOffer: Number(event.walletDiscountOffer || 0),
      paymentDeadline: null,
      paidAt: now()
    })
    return ok({ order: paid })
  }

  if (action === 'order.cancel') {
    const cancelled = await updateOrder(userId, String(event.id || ''), {
      status: 'cancelled',
      cancelledReason: event.reason || '用户取消',
      cancelledAt: now()
    })
    if (!cancelled) return fail(404, '订单不存在')
    return ok({ order: cancelled })
  }

  if (action === 'order.complete') {
    const completed = await updateOrder(userId, String(event.id || ''), { status: 'done', completedAt: now() })
    if (!completed) return fail(404, '订单不存在')
    return ok({ order: completed })
  }

  if (action === 'order.review') {
    const id = String(event.id || '')
    const order = await getOrder(userId, id)
    if (!order) return fail(404, '订单不存在')
    if (order.status !== 'done') return fail(1004, '当前订单暂不可评价')
    if (order.reviewed || (order.review && Object.keys(order.review).length)) return fail(1005, '该订单已评价')

    // 兼容旧订单：旧数据中 review 可能是 null。uniCloud 更新嵌套对象时会拆成
    // review.xxx 的形式，因此必须先把 review 修正为空对象，再写入完整评价字段。
    if (!order.review || typeof order.review !== 'object') {
      await orders.doc(id).update({ review: {}, updatedAt: now() })
    }

    const reviewed = await updateOrder(userId, id, {
      reviewed: true,
      review: event.review || {},
      reviewedAt: now()
    })
    return ok({ order: reviewed })
  }

  if (action === 'order.delete') {
    const id = String(event.id || '')
    const order = await getOrder(userId, id)
    if (!order) return fail(404, '订单不存在')
    await orders.doc(id).remove()
    return ok({ id, message: '订单已删除' })
  }

  return fail(-1, '非法操作')
}
