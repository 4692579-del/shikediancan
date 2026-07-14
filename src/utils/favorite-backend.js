import cloud from './cloud.js'
import store from './store.js'
import data from './data.js'

const FUNCTION_NAME = 'favorite-service'
const LEGACY_CLEAR_KEY = 'sk_favorites_backend_v1_cleared'

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
  const food = data.foods.find(row => row.id === Number(item.id))
  return food ? { ...food, ...item, icon: food.icon, bg: food.bg } : item
}

function cacheFavorites(list = []) {
  const favorites = list.map(hydrateFood)
  store.set('sk_favorites', favorites.map(item => Number(item.id)))
  store.set('sk_favorite_foods', favorites)
  return favorites
}

function getCachedIds() {
  const ids = store.get('sk_favorites', [])
  return Array.isArray(ids) ? ids.map(Number) : []
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

async function fetchFavorites() {
  clearLegacyFavoritesOnce()
  const body = await call('favorite.list')
  return cacheFavorites(body.favorites || [])
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
  getCachedIds
}
