import cloud from './cloud.js'
import store from './store.js'
import productBackend from './product-backend.js'

const FUNCTION_NAME = 'favorite-service'
const LEGACY_CLEAR_KEY = 'sk_favorites_backend_v1_cleared'
const FAVORITES_SYNC_TIME_KEY = 'sk_favorites_backend_sync_at'
const FAVORITES_SYNC_TTL = 8000

let favoritesPromise = null

function currentUserId() {
  const user = store.get('sk_user', null)
  return user && (user.uid || user.userId || user.accountId || user.username)
}

function ensureUserId() {
  const userId = currentUserId()
  if (!userId) throw new Error('请先登录')
  return String(userId)
}

function hydrateFood(item = {}) {
  const food = productBackend.getFoodById(Number(item.id))
  return food ? { ...food, ...item, icon: food.icon, bg: food.bg } : item
}

function cacheFavorites(list = []) {
  const favorites = list.map(hydrateFood)
  store.set('sk_favorites', favorites.map(item => Number(item.id)))
  store.set('sk_favorite_foods', favorites)
  uni.setStorageSync(FAVORITES_SYNC_TIME_KEY, Date.now())
  return favorites
}

function getCachedIds() {
  const ids = store.get('sk_favorites', [])
  return Array.isArray(ids) ? ids.map(Number) : []
}

function getCachedFoods() {
  const cachedFoods = store.get('sk_favorite_foods', [])
  if (Array.isArray(cachedFoods) && cachedFoods.length) return cachedFoods.map(hydrateFood)
  const ids = getCachedIds()
  return productBackend.getFoods().filter(item => ids.includes(Number(item.id)))
}

function clearLegacyFavoritesOnce() {
  if (uni.getStorageSync(LEGACY_CLEAR_KEY)) return
  store.set('sk_favorites', [])
  store.set('sk_favorite_foods', [])
  uni.setStorageSync(LEGACY_CLEAR_KEY, true)
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
  const body = result.result || {}
  if (body.code !== 0) throw new Error(body.message || '收藏服务暂时不可用')
  return body
}

async function fetchFavorites(options = {}) {
  clearLegacyFavoritesOnce()
  const force = Boolean(options.force)
  const cached = getCachedFoods()
  const lastSyncAt = Number(uni.getStorageSync(FAVORITES_SYNC_TIME_KEY) || 0)
  if (!force && cached.length && Date.now() - lastSyncAt < FAVORITES_SYNC_TTL) return cached
  if (favoritesPromise) return favoritesPromise

  favoritesPromise = call('favorite.list')
    .then(body => cacheFavorites(body.favorites || []))
    .catch(error => {
      if (cached.length) return cached
      throw error
    })
    .finally(() => {
      favoritesPromise = null
    })

  return favoritesPromise
}

async function addFavorite(food) {
  const body = await call('favorite.add', { food })
  return cacheFavorites(body.favorites || [])
}

async function removeFavorite(foodId) {
  const body = await call('favorite.remove', { foodId: Number(foodId) })
  return cacheFavorites(body.favorites || [])
}

async function toggleFavorite(food) {
  const body = await call('favorite.toggle', { food })
  const favorites = cacheFavorites(body.favorites || [])
  return {
    favorite: Boolean(body.favorite),
    favorites
  }
}

export default {
  clearLegacyFavoritesOnce,
  fetchFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getCachedIds,
  getCachedFoods
}
