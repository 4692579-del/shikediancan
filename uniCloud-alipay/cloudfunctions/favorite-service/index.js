'use strict'

const db = uniCloud.database()
const favorites = db.collection('sk_favorites')

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

function normalizeFood(food = {}) {
  const id = Number(food.id)
  if (!Number.isFinite(id)) return null
  return {
    id,
    name: String(food.name || ''),
    desc: String(food.desc || ''),
    price: Number(food.price) || 0,
    oldPrice: Number(food.oldPrice) || 0,
    rating: Number(food.rating) || 0,
    sales: Number(food.sales) || 0,
    tag: String(food.tag || ''),
    bg: String(food.bg || ''),
    icon: String(food.icon || ''),
    category: String(food.category || '')
  }
}

function toClientFavorite(row = {}) {
  return {
    ...row.food,
    favoriteId: row._id,
    favoritedAt: row.createdAt
  }
}

async function findFavorite(userId, foodId) {
  const result = await favorites.where({ userId, foodId }).limit(1).get()
  return result.data && result.data[0]
}

async function listFavorites(userId) {
  const result = await favorites.where({ userId }).get()
  return (result.data || [])
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .map(toClientFavorite)
}

async function addFavorite(userId, food) {
  const normalized = normalizeFood(food)
  if (!normalized) return fail(1001, '商品信息不完整')
  const old = await findFavorite(userId, normalized.id)
  const current = now()
  if (old) {
    await favorites.doc(old._id).update({
      food: normalized,
      updatedAt: current
    })
  } else {
    await favorites.add({
      userId,
      foodId: normalized.id,
      food: normalized,
      createdAt: current,
      updatedAt: current
    })
  }
  return ok({ favorite: true, favorites: await listFavorites(userId) })
}

async function removeFavorite(userId, foodId) {
  const id = Number(foodId)
  if (!Number.isFinite(id)) return fail(1002, '商品ID不正确')
  const old = await findFavorite(userId, id)
  if (old) await favorites.doc(old._id).remove()
  return ok({ favorite: false, favorites: await listFavorites(userId) })
}

exports.main = async (event = {}) => {
  const action = String(event.action || '')
  const userId = normalizeUserId(event)
  if (!userId) return fail(401, '请先登录')

  if (action === 'favorite.list') {
    return ok({ favorites: await listFavorites(userId) })
  }

  if (action === 'favorite.add') {
    return addFavorite(userId, event.food || {})
  }

  if (action === 'favorite.remove') {
    return removeFavorite(userId, event.foodId)
  }

  if (action === 'favorite.toggle') {
    const normalized = normalizeFood(event.food || {})
    if (!normalized) return fail(1001, '商品信息不完整')
    const old = await findFavorite(userId, normalized.id)
    if (old) return removeFavorite(userId, normalized.id)
    return addFavorite(userId, normalized)
  }

  return fail(404, '未知操作')
}
