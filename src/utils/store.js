// 本地状态仓库：封装缓存读写，统一管理地址、购物车、订单和基础初始化。

import data from './data.js'
// 初始化必要缓存，并清除早期测试版本遗留的默认地址和无效优惠券。
function seed() {
  if (!uni.getStorageSync('sk_addresses')) {
    uni.setStorageSync('sk_addresses', [])
  } else {
    const addresses = uni.getStorageSync('sk_addresses')
    if (Array.isArray(addresses)) {
      const cleaned = addresses.filter(item => item.id !== 1)
      if (cleaned.length !== addresses.length) uni.setStorageSync('sk_addresses', cleaned)
    }
  }
  const plusMembership = uni.getStorageSync('sk_plus_membership')
  const plusOpened = Boolean(plusMembership && plusMembership.opened)
  if (!plusOpened) {
    uni.setStorageSync('sk_coupons', [])
    uni.removeStorageSync('sk_selected_coupon')
  } else if (!Array.isArray(uni.getStorageSync('sk_coupons'))) {
    uni.setStorageSync('sk_coupons', data.coupons)
  }
  if (!uni.getStorageSync('sk_cart')) uni.setStorageSync('sk_cart', [])
  if (!uni.getStorageSync('sk_orders')) uni.setStorageSync('sk_orders', [])
  if (!uni.getStorageSync('sk_favorites')) uni.setStorageSync('sk_favorites', [])
}

// 读取缓存时重新补齐最新商品图片和背景，避免历史订单保存旧资源路径。
function get(key, fallback) {
  const value = uni.getStorageSync(key)
  if (value === '' || value === undefined) return fallback
  const hydrateItem = item => {
    const food = data.foods.find(row => row.id === Number(item && item.id))
    return food ? { ...item, icon: food.icon, bg: food.bg } : item
  }
  if (key === 'sk_cart' && Array.isArray(value)) return value.map(hydrateItem)
  if (key === 'sk_orders' && Array.isArray(value)) {
    return value.map(order => ({ ...order, items: (order.items || []).map(hydrateItem) }))
  }
  if (key === 'sk_order_draft' && value && Array.isArray(value.items)) {
    return { ...value, items: value.items.map(hydrateItem) }
  }
  return value
}

function set(key, value) { uni.setStorageSync(key, value) }

// 保证地址非空时始终且仅有一个默认地址。
function normalizeAddresses(addresses = []) {
  if (!addresses.length) return []
  const defaultIndex = addresses.findIndex(item => item.isDefault)
  const keepIndex = defaultIndex >= 0 ? defaultIndex : 0
  return addresses.map((item, index) => ({
    ...item,
    isDefault: index === keepIndex
  }))
}

function getAddresses() {
  const addresses = get('sk_addresses', [])
  const normalized = normalizeAddresses(addresses)
  const changed = JSON.stringify(addresses) !== JSON.stringify(normalized)
  if (changed) set('sk_addresses', normalized)
  return normalized
}

function setAddresses(addresses) {
  const normalized = normalizeAddresses(addresses)
  set('sk_addresses', normalized)
  return normalized
}

function getDefaultAddress() {
  return getAddresses().find(item => item.isDefault) || null
}

// 首页和确认订单只展示区级及其后的详细地址。
function getCompactAddress(address) {
  if (!address) return ''
  if (Array.isArray(address.region) && address.region.length === 3) {
    return `${address.region[2]} ${address.detail || ''}`.trim()
  }
  return address.fullDetail || address.detail || ''
}

function getCart() { return get('sk_cart', []) }

// 以“商品编号 + 规格”作为购物车唯一键，同规格商品自动累加数量。
function addCart(food, count = 1, spec = '标准份') {
  const cart = getCart()
  const key = `${food.id}-${spec}`
  const found = cart.find(item => item.key === key)
  if (found) found.count += count
  else cart.push({ ...food, key, spec, count, checked: true })
  set('sk_cart', cart)
  return cart
}

// 数量小于等于零时删除商品，否则更新指定购物车项。
function updateCart(key, count) {
  let cart = getCart()
  if (count <= 0) cart = cart.filter(item => item.key !== key)
  else cart = cart.map(item => item.key === key ? { ...item, count } : item)
  set('sk_cart', cart)
  return cart
}

// 仅汇总被勾选的商品数量和金额。
function cartSummary(cart = getCart()) {
  const selected = cart.filter(item => item.checked)
  return {
    count: selected.reduce((sum, item) => sum + item.count, 0),
    total: Number(selected.reduce((sum, item) => sum + item.price * item.count, 0).toFixed(2))
  }
}

function isLogin() { return !!get('sk_user', null) }

export default {
  seed,
  get,
  set,
  getAddresses,
  setAddresses,
  getDefaultAddress,
  getCompactAddress,
  getCart,
  addCart,
  updateCart,
  cartSummary,
  isLogin
}
