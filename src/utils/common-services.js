import i18n from './i18n.js'
import store from './store.js'
import cloud from './cloud.js'

const STORAGE_KEY = 'sk_common_service_layout'
const FUNCTION_NAME = 'user-profile'
const MAX_VISIBLE = 6
const MIN_VISIBLE = 3

const labels = {
  'zh-Hans': {
    member: '会员中心',
    address: '地址管理',
    cart: '购物车',
    wallet: '食刻钱包',
    support: '联系客服',
    message: '消息设置',
    coupons: '优惠券',
    reviews: '我的评价',
    orders: '订单中心',
    serviceManager: '常用服务管理'
  },
  en: {
    member: 'Member Center',
    address: 'Addresses',
    cart: 'Cart',
    wallet: 'Wallet',
    support: 'Support',
    message: 'Messages',
    coupons: 'Coupons',
    reviews: 'My reviews',
    orders: 'Orders',
    serviceManager: 'Common services'
  },
  ja: {
    member: '会員センター',
    address: '住所管理',
    cart: 'カート',
    wallet: '食刻ウォレット',
    support: 'サポート',
    message: '通知設定',
    coupons: 'クーポン',
    reviews: '評価',
    orders: '注文',
    serviceManager: 'よく使うサービス'
  },
  'zh-Hant': {
    member: '會員中心',
    address: '地址管理',
    cart: '購物車',
    wallet: '食刻錢包',
    support: '聯絡客服',
    message: '訊息設定',
    coupons: '優惠券',
    reviews: '我的評價',
    orders: '訂單中心',
    serviceManager: '常用服務管理'
  }
}

export const DEFAULT_SERVICES = [
  { key: 'member', icon: '/static/assets/icons/star-filled.svg', iconClass: 'member-service', url: '/pages/plus/plus', enabled: true },
  { key: 'address', icon: '/static/assets/icons/location.svg', iconClass: 'location-service', url: '/pages/address/address', enabled: true },
  { key: 'cart', icon: '/static/assets/icons/cart.svg', iconClass: 'cart-service', url: '/pages/cart/cart', enabled: true, featured: true, badge: 'cartCount' },
  { key: 'wallet', icon: '/static/assets/icons/wallet.svg', iconClass: 'wallet-service', url: '/pages/wallet/wallet', enabled: true },
  { key: 'support', icon: '/static/assets/icons/service.svg', iconClass: 'support-service', action: 'contact', enabled: true },
  { key: 'message', icon: '/static/assets/icons/bell.svg', iconClass: 'notice-service', url: '/pages/settings/settings', enabled: true },
  { key: 'coupons', icon: '/static/assets/icons/gift.svg', iconClass: 'coupon-service', url: '/pages/coupons/coupons', enabled: false },
  { key: 'reviews', icon: '/static/assets/icons/star.svg', iconClass: 'review-service', url: '/pages/my-reviews/my-reviews', enabled: false },
  { key: 'orders', icon: '/static/assets/icons/order.svg', iconClass: 'order-service', url: '/pages/orders/orders', enabled: false }
]

function getLocaleLabels() {
  const locale = i18n.getLocale()
  return labels[locale] || labels['zh-Hans']
}

function getUser() {
  return store.get('sk_user', null)
}

function getStorageKey() {
  const user = getUser()
  return user && user.uid ? `${STORAGE_KEY}_${user.uid}` : STORAGE_KEY
}

function getLabel(key) {
  return getLocaleLabels()[key] || labels['zh-Hans'][key] || key
}

function normalize(saved = []) {
  const safeSaved = Array.isArray(saved) ? saved : []
  const savedMap = new Map(safeSaved.map(item => [item.key, item]))
  const orderedKeys = []

  safeSaved.forEach(item => {
    if (DEFAULT_SERVICES.some(service => service.key === item.key) && !orderedKeys.includes(item.key)) {
      orderedKeys.push(item.key)
    }
  })
  DEFAULT_SERVICES.forEach(item => {
    if (!orderedKeys.includes(item.key)) orderedKeys.push(item.key)
  })

  return orderedKeys.map(key => {
    const base = DEFAULT_SERVICES.find(item => item.key === key)
    const savedItem = savedMap.get(key) || {}
    return {
      ...base,
      enabled: typeof savedItem.enabled === 'boolean' ? savedItem.enabled : base.enabled !== false,
      label: getLabel(key)
    }
  })
}

function serialize(list = []) {
  return normalize(list).map(item => ({ key: item.key, enabled: item.enabled !== false }))
}

function getConfig() {
  try {
    return normalize(uni.getStorageSync(getStorageKey()) || [])
  } catch (err) {
    return normalize([])
  }
}

function saveConfig(list = []) {
  uni.setStorageSync(getStorageKey(), serialize(list))
  return getConfig()
}

function resetConfig() {
  uni.removeStorageSync(getStorageKey())
  return getConfig()
}

function getVisibleServices() {
  return getConfig().filter(item => item.enabled).slice(0, MAX_VISIBLE)
}

async function fetchConfig() {
  const user = getUser()
  if (!user || !user.uid) return getConfig()
  const { result } = await cloud.callFunction({
    name: FUNCTION_NAME,
    data: { action: 'getCommonServices', uid: user.uid }
  })
  if (result && result.code === 0) {
    saveConfig(result.services || [])
    return getConfig()
  }
  throw new Error((result && result.message) || '获取常用服务布局失败')
}

async function saveRemoteConfig(list = []) {
  const user = getUser()
  if (!user || !user.uid) throw new Error('请先登录账号')
  const normalized = serialize(list)
  const { result } = await cloud.callFunction({
    name: FUNCTION_NAME,
    data: { action: 'saveCommonServices', uid: user.uid, services: normalized }
  })
  if (result && result.code === 0) {
    saveConfig(result.services || normalized)
    return getConfig()
  }
  throw new Error((result && result.message) || '保存常用服务布局失败')
}

export default {
  MAX_VISIBLE,
  MIN_VISIBLE,
  getLabel,
  getConfig,
  saveConfig,
  resetConfig,
  getVisibleServices,
  fetchConfig,
  saveRemoteConfig
}
