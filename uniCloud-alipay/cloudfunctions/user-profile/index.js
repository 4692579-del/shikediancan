'use strict'

const db = uniCloud.database()
const users = db.collection('sk_users')

const SERVICE_KEYS = ['member', 'address', 'cart', 'wallet', 'support', 'message', 'coupons', 'reviews', 'orders']
const DEFAULT_COMMON_SERVICE_ENABLED = {
  member: true,
  address: true,
  cart: true,
  wallet: true,
  support: true,
  message: true,
  coupons: false,
  reviews: false,
  orders: false
}
const MIN_COMMON_SERVICES = 3
const MAX_COMMON_SERVICES = 6

function defaultNickname(username) {
  return `食刻用户${username}`
}

function publicUser(user) {
  return {
    uid: user._id,
    accountId: `cloud:${user._id}`,
    username: user.username,
    nickname: user.nickname || defaultNickname(user.username),
    phone: user.phone || '',
    avatar: user.avatar || '/static/assets/icons/smile.svg'
  }
}

function normalizeCommonServices(list = []) {
  const safeList = Array.isArray(list) ? list : []
  const used = new Set()
  const normalized = []

  safeList.forEach(item => {
    const key = String(item && item.key ? item.key : '').trim()
    if (!SERVICE_KEYS.includes(key) || used.has(key)) return
    used.add(key)
    normalized.push({
      key,
      enabled: typeof item.enabled === 'boolean' ? item.enabled : DEFAULT_COMMON_SERVICE_ENABLED[key] !== false
    })
  })

  SERVICE_KEYS.forEach(key => {
    if (!used.has(key)) {
      normalized.push({ key, enabled: DEFAULT_COMMON_SERVICE_ENABLED[key] !== false })
    }
  })

  return normalized
}

exports.main = async (event = {}) => {
  const action = event.action
  const uid = String(event.uid || '').trim()

  if (!uid) return { code: 401, message: '请先登录' }

  const userResult = await users.doc(uid).get()
  const user = userResult.data && userResult.data[0]
  if (!user) return { code: 404, message: '用户不存在' }

  if (action === 'get') {
    return {
      code: 0,
      user: publicUser(user),
      commonServices: normalizeCommonServices(user.commonServices || [])
    }
  }

  if (action === 'updateAvatar') {
    const avatar = String(event.avatar || '').trim()
    if (!avatar) return { code: 1001, message: '头像上传失败' }

    // 头像支持两类来源：
    // 1. 当前 H5 预览使用的 base64 图片数据；
    // 2. 后续接入云存储后返回的 http/https/cloud/static 地址。
    // 这里做基础格式与大小校验，避免异常内容写入用户资料。
    const isImageData = /^data:image\/(png|jpe?g|webp);base64,/i.test(avatar)
    const isRemoteImage = /^(https?:\/\/|cloud:\/\/|\/static\/)/i.test(avatar)
    if (!isImageData && !isRemoteImage) {
      return { code: 1002, message: '头像格式不正确' }
    }
    if (isImageData && avatar.length > 900 * 1024) {
      return { code: 1003, message: '头像图片过大' }
    }

    await users.doc(uid).update({
      avatar,
      updatedAt: Date.now()
    })
    return {
      code: 0,
      message: '头像已更新',
      user: publicUser({ ...user, avatar })
    }
  }

  if (action === 'updateNickname') {
    const nickname = String(event.nickname || '').trim()
    if (!nickname) return { code: 1004, message: '请输入昵称' }
    if (nickname.length < 2 || nickname.length > 16) {
      return { code: 1005, message: '昵称需为 2-16 个字符' }
    }
    if (/[<>]/.test(nickname)) {
      return { code: 1006, message: '昵称包含不支持的字符' }
    }

    await users.doc(uid).update({
      nickname,
      updatedAt: Date.now()
    })
    return {
      code: 0,
      message: '昵称已更新',
      user: publicUser({ ...user, nickname })
    }
  }

  if (action === 'getCommonServices') {
    return {
      code: 0,
      services: normalizeCommonServices(user.commonServices || [])
    }
  }

  if (action === 'saveCommonServices') {
    const services = normalizeCommonServices(event.services || [])
    const enabledCount = services.filter(item => item.enabled).length
    if (enabledCount < MIN_COMMON_SERVICES) {
      return { code: 1010, message: `至少保留 ${MIN_COMMON_SERVICES} 个常用服务` }
    }
    if (enabledCount > MAX_COMMON_SERVICES) {
      return { code: 1011, message: `最多只能展示 ${MAX_COMMON_SERVICES} 个常用服务` }
    }

    await users.doc(uid).update({
      commonServices: services,
      updatedAt: Date.now()
    })
    return {
      code: 0,
      message: '常用服务布局已保存',
      services
    }
  }

  return { code: -1, message: '非法操作' }
}
