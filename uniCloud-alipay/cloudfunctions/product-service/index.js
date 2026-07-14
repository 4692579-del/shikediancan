'use strict'

const db = uniCloud.database()
const shops = db.collection('sk_shops')
const categories = db.collection('sk_categories')
const products = db.collection('sk_products')

function now() {
  return Date.now()
}

function ok(data = {}) {
  return { code: 0, ...data }
}

function fail(code, message) {
  return { code, message }
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeShop(row = {}, index = 0) {
  const id = toNumber(row.id, index + 1)
  return {
    id,
    name: String(row.name || ''),
    desc: String(row.desc || ''),
    rating: toNumber(row.rating, 0),
    time: String(row.time || ''),
    distance: String(row.distance || ''),
    delivery: toNumber(row.delivery, 0),
    min: toNumber(row.min, 0),
    icon: String(row.icon || ''),
    color: String(row.color || '#1C1C1E'),
    notice: String(row.notice || ''),
    sort: toNumber(row.sort, index),
    createdAt: row.createdAt || now(),
    updatedAt: now()
  }
}

function normalizeCategory(row = {}, index = 0) {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    icon: String(row.icon || ''),
    color: String(row.color || '#F4F4F6'),
    sort: toNumber(row.sort, index),
    createdAt: row.createdAt || now(),
    updatedAt: now()
  }
}

function normalizeDetail(row = {}) {
  return {
    intro: String(row.intro || ''),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients.map(String) : [],
    taste: Array.isArray(row.taste) ? row.taste.map(String) : [],
    energy: String(row.energy || ''),
    serving: String(row.serving || '')
  }
}

function normalizeProduct(row = {}, detailMap = {}, index = 0) {
  const id = toNumber(row.id, index + 1)
  const detail = row.detail || detailMap[id] || detailMap[String(id)] || {}
  return {
    id,
    shopId: toNumber(row.shopId, 1),
    name: String(row.name || ''),
    desc: String(row.desc || ''),
    price: toNumber(row.price, 0),
    oldPrice: toNumber(row.oldPrice, 0),
    category: String(row.category || ''),
    sales: toNumber(row.sales, 0),
    rating: toNumber(row.rating, 0),
    icon: String(row.icon || ''),
    bg: String(row.bg || '#F2DFCA'),
    tag: String(row.tag || ''),
    detail: normalizeDetail(detail),
    status: row.status || 'on',
    sort: toNumber(row.sort, index),
    createdAt: row.createdAt || now(),
    updatedAt: now()
  }
}

function stripDbFields(row = {}) {
  const { _id, ...rest } = row
  return rest
}

async function isEmpty(collection) {
  const result = await collection.limit(1).get()
  return !(result.data && result.data.length)
}

async function seedIfNeeded(seed = {}) {
  const hasProducts = !(await isEmpty(products))
  const hasCategories = !(await isEmpty(categories))
  const hasShops = !(await isEmpty(shops))
  if (hasProducts && hasCategories && hasShops) return false

  const tasks = []
  if (!hasShops && Array.isArray(seed.shops) && seed.shops.length) {
    tasks.push(Promise.all(seed.shops.map((item, index) => shops.add(normalizeShop(item, index)))))
  }
  if (!hasCategories && Array.isArray(seed.categories) && seed.categories.length) {
    tasks.push(Promise.all(seed.categories.map((item, index) => categories.add(normalizeCategory(item, index)))))
  }
  if (!hasProducts && Array.isArray(seed.products) && seed.products.length) {
    const detailMap = seed.details || {}
    tasks.push(Promise.all(seed.products.map((item, index) => products.add(normalizeProduct(item, detailMap, index)))))
  }
  await Promise.all(tasks)
  return true
}

async function listAll() {
  const [shopResult, categoryResult, productResult] = await Promise.all([
    shops.get(),
    categories.get(),
    products.where({ status: 'on' }).get()
  ])
  return {
    shops: (shopResult.data || []).map(stripDbFields).sort((a, b) => toNumber(a.sort) - toNumber(b.sort) || toNumber(a.id) - toNumber(b.id)),
    categories: (categoryResult.data || []).map(stripDbFields).sort((a, b) => toNumber(a.sort) - toNumber(b.sort)),
    products: (productResult.data || []).map(stripDbFields).sort((a, b) => toNumber(a.sort) - toNumber(b.sort) || toNumber(a.id) - toNumber(b.id))
  }
}

async function findProduct(id) {
  const productId = toNumber(id, 0)
  if (!productId) return null
  const result = await products.where({ id: productId, status: 'on' }).limit(1).get()
  return result.data && result.data[0] ? stripDbFields(result.data[0]) : null
}

exports.main = async (event = {}) => {
  const action = String(event.action || 'product.sync')

  if (action === 'product.sync') {
    await seedIfNeeded(event.seed || {})
    return ok(await listAll())
  }

  if (action === 'product.list') {
    return ok(await listAll())
  }

  if (action === 'product.detail') {
    const product = await findProduct(event.id)
    if (!product) return fail(404, '商品不存在')
    return ok({ product })
  }

  if (action === 'product.search') {
    const keyword = String(event.keyword || '').trim()
    const all = await listAll()
    const products = keyword
      ? all.products.filter(item => `${item.name}${item.desc}${item.tag}${item.category}`.includes(keyword))
      : []
    return ok({ products })
  }

  return fail(404, '未知操作')
}
