import cloud from './cloud.js'

const FUNCTION_NAME = 'product-service'
const FOOD_CACHE_KEY = 'sk_backend_foods'
const CATEGORY_CACHE_KEY = 'sk_backend_categories'
const SHOP_CACHE_KEY = 'sk_backend_shops'
const SYNC_TIME_KEY = 'sk_backend_products_sync_at'
const SYNC_TTL = 10 * 60 * 1000

let syncPromise = null

function normalizeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeFood(item = {}) {
  const detail = item.detail || {}
  return {
    ...item,
    id: normalizeNumber(item.id),
    shopId: normalizeNumber(item.shopId, 1),
    price: normalizeNumber(item.price),
    oldPrice: normalizeNumber(item.oldPrice),
    sales: normalizeNumber(item.sales),
    rating: normalizeNumber(item.rating),
    category: String(item.category || ''),
    icon: String(item.icon || ''),
    bg: String(item.bg || '#F2DFCA'),
    tag: String(item.tag || ''),
    detail
  }
}

function normalizeCategory(item = {}) {
  return {
    ...item,
    id: String(item.id || ''),
    name: String(item.name || ''),
    icon: String(item.icon || ''),
    color: String(item.color || '#F4F4F6')
  }
}

function normalizeShop(item = {}) {
  return {
    ...item,
    id: normalizeNumber(item.id),
    rating: normalizeNumber(item.rating),
    delivery: normalizeNumber(item.delivery),
    min: normalizeNumber(item.min),
    color: String(item.color || '#1C1C1E')
  }
}

function getCachedArray(key) {
  const value = uni.getStorageSync(key)
  return Array.isArray(value) ? value : []
}

function hasCompleteCache() {
  return getCachedArray(FOOD_CACHE_KEY).length > 0 &&
    getCachedArray(CATEGORY_CACHE_KEY).length > 0 &&
    getCachedArray(SHOP_CACHE_KEY).length > 0
}

function getSnapshot() {
  return {
    foods: getCachedArray(FOOD_CACHE_KEY).map(normalizeFood),
    categories: getCachedArray(CATEGORY_CACHE_KEY).map(normalizeCategory),
    shops: getCachedArray(SHOP_CACHE_KEY).map(normalizeShop)
  }
}

function saveCache(payload = {}) {
  const foods = Array.isArray(payload.products) ? payload.products.map(normalizeFood) : []
  const categories = Array.isArray(payload.categories) ? payload.categories.map(normalizeCategory) : []
  const shops = Array.isArray(payload.shops) ? payload.shops.map(normalizeShop) : []
  if (foods.length) uni.setStorageSync(FOOD_CACHE_KEY, foods)
  if (categories.length) uni.setStorageSync(CATEGORY_CACHE_KEY, categories)
  if (shops.length) uni.setStorageSync(SHOP_CACHE_KEY, shops)
  if (foods.length || categories.length || shops.length) uni.setStorageSync(SYNC_TIME_KEY, Date.now())
  return getSnapshot()
}

function getFoods() {
  return getSnapshot().foods
}

function getCategories() {
  return getSnapshot().categories
}

function getShops() {
  return getSnapshot().shops
}

function getFoodById(id) {
  const productId = normalizeNumber(id)
  return getFoods().find(item => item.id === productId) || null
}

function getDetailById(id) {
  const food = getFoodById(id)
  return (food && food.detail) || {}
}

function searchFoods(keyword) {
  const word = String(keyword || '').trim()
  if (!word) return []
  return getFoods().filter(item => `${item.name}${item.desc}${item.tag}${item.category}`.includes(word))
}

async function call(action, payload = {}) {
  const result = await cloud.callFunction({
    name: FUNCTION_NAME,
    data: { action, ...payload }
  })
  const body = result.result || {}
  if (body.code !== 0) throw new Error(body.message || '商品服务暂时不可用')
  return body
}

// 商品、分类、店铺统一由 uniCloud 提供。前端只读云端缓存，不再使用本地模拟数据兜底。
async function syncProducts(options = {}) {
  const force = Boolean(options.force)
  const lastSyncAt = Number(uni.getStorageSync(SYNC_TIME_KEY) || 0)
  const cacheFresh = hasCompleteCache() && Date.now() - lastSyncAt < SYNC_TTL

  if (!force && cacheFresh) return getSnapshot()
  if (syncPromise) return syncPromise

  syncPromise = call('product.sync')
    .then(body => saveCache(body))
    .catch(error => {
      if (hasCompleteCache()) return getSnapshot()
      throw error
    })
    .finally(() => {
      syncPromise = null
    })

  return syncPromise
}

async function refreshProducts() {
  return syncProducts({ force: true })
}

async function fetchProductDetail(id) {
  const productId = normalizeNumber(id)
  const cached = getFoodById(productId)
  if (cached && cached.detail && Object.keys(cached.detail).length) return cached

  const body = await call('product.detail', { id: productId })
  if (body.product) {
    const product = normalizeFood(body.product)
    const foods = getFoods()
    const nextFoods = [product, ...foods.filter(item => item.id !== product.id)]
    uni.setStorageSync(FOOD_CACHE_KEY, nextFoods)
    uni.setStorageSync(SYNC_TIME_KEY, Date.now())
    return product
  }
  return cached
}

export default {
  syncProducts,
  refreshProducts,
  fetchProductDetail,
  getSnapshot,
  getFoods,
  getCategories,
  getShops,
  getFoodById,
  getDetailById,
  searchFoods
}
