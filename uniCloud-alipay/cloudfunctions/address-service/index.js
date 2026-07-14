'use strict'

const db = uniCloud.database()
const addresses = db.collection('sk_addresses')

function now() {
  return Date.now()
}

function toClientAddress(item) {
  return {
    id: item._id,
    name: item.name,
    phone: item.phone,
    gender: item.gender || '\u5148\u751f',
    region: item.region || [],
    regionText: item.regionText || '',
    detail: item.detail || '',
    fullDetail: item.fullDetail || '',
    tag: item.tag || '\u5bb6',
    isDefault: !!item.isDefault,
    createdAt: item.createdAt || 0,
    updatedAt: item.updatedAt || 0
  }
}

function validateAddress(address = {}) {
  const name = String(address.name || '').trim()
  const phone = String(address.phone || '').trim()
  const detail = String(address.detail || '').trim()
  const region = Array.isArray(address.region) ? address.region.filter(Boolean) : []

  if (!/^[\u4e00-\u9fa5A-Za-z\u00b7\s]{2,20}$/.test(name)) {
    return { ok: false, message: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u8054\u7cfb\u4eba\u59d3\u540d' }
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { ok: false, message: '\u8bf7\u8f93\u5165\u6b63\u786e\u7684\u624b\u673a\u53f7\u7801' }
  }
  if (region.length !== 3) {
    return { ok: false, message: '\u8bf7\u9009\u62e9\u7701\u3001\u5e02\u3001\u533a' }
  }
  if (!detail) {
    return { ok: false, message: '\u8bf7\u586b\u5199\u8be6\u7ec6\u5730\u5740' }
  }
  return { ok: true }
}

async function list(userId) {
  const result = await addresses.where({ userId }).get()
  const data = (result.data || [])
    .map(toClientAddress)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || (b.updatedAt || 0) - (a.updatedAt || 0))
  return data
}

exports.main = async (event = {}) => {
  const action = event.action
  const userId = String(event.userId || '').trim()
  if (!userId) return { code: 401, message: '\u8bf7\u5148\u767b\u5f55' }

  if (action === 'list') {
    return { code: 0, addresses: await list(userId) }
  }

  if (action === 'save') {
    const address = event.address || {}
    const check = validateAddress(address)
    if (!check.ok) return { code: 1001, message: check.message }

    const current = await list(userId)
    const id = String(address.id || '').trim()
    const isFirst = current.length === 0
    const shouldDefault = isFirst || !!address.isDefault
    const regionText = address.region.join(' ')
    const data = {
      userId,
      name: String(address.name).trim(),
      phone: String(address.phone).trim(),
      gender: address.gender === '\u5973\u58eb' ? '\u5973\u58eb' : '\u5148\u751f',
      region: address.region,
      regionText,
      detail: String(address.detail).trim(),
      fullDetail: `${regionText} ${String(address.detail).trim()}`,
      tag: ['\u5bb6', '\u516c\u53f8', '\u5b66\u6821'].includes(address.tag) ? address.tag : '\u5bb6',
      isDefault: shouldDefault,
      updatedAt: now()
    }

    if (shouldDefault) {
      const oldList = await addresses.where({ userId }).get()
      await Promise.all((oldList.data || []).map(item => addresses.doc(item._id).update({ isDefault: false, updatedAt: now() })))
    }

    if (id) {
      const old = await addresses.doc(id).get()
      const oldAddress = old.data && old.data[0]
      if (!oldAddress || oldAddress.userId !== userId) return { code: 404, message: '\u5730\u5740\u4e0d\u5b58\u5728' }
      await addresses.doc(id).update(data)
    } else {
      await addresses.add({ ...data, createdAt: now() })
    }

    return { code: 0, message: '\u5730\u5740\u5df2\u4fdd\u5b58', addresses: await list(userId) }
  }

  if (action === 'remove') {
    const id = String(event.id || '').trim()
    const current = await list(userId)
    const target = current.find(item => item.id === id)
    if (!target) return { code: 404, message: '\u5730\u5740\u4e0d\u5b58\u5728' }
    if (target.isDefault && current.length > 1) {
      return { code: 1002, message: '\u8bf7\u5148\u5c06\u5176\u4ed6\u5730\u5740\u8bbe\u4e3a\u9ed8\u8ba4\u5730\u5740' }
    }
    await addresses.doc(id).remove()
    return { code: 0, message: '\u5730\u5740\u5df2\u5220\u9664', addresses: await list(userId) }
  }

  return { code: -1, message: '\u975e\u6cd5\u64cd\u4f5c' }
}
