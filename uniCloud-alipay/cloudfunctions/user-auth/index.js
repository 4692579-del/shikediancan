'use strict'

const crypto = require('crypto')
const db = uniCloud.database()
const users = db.collection('sk_users')

function now() {
  return Date.now()
}

function normalizeUsername(username) {
  return String(username || '').trim()
}

function isValidUsername(username) {
  // 用户名只作为登录凭证：5-10 位，必须字母开头，仅允许字母和数字。
  return /^[A-Za-z][A-Za-z0-9]{4,9}$/.test(username)
}

function defaultNickname(username) {
  return `食刻用户${username}`
}

function isValidPassword(password) {
  return /^.{6,20}$/.test(String(password || ''))
}

function makeSalt() {
  return crypto.randomBytes(8).toString('hex')
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

function publicUser(user) {
  return {
    uid: user._id,
    accountId: `cloud:${user._id}`,
    username: user.username,
    nickname: user.nickname || defaultNickname(user.username),
    phone: user.phone || '',
    avatar: user.avatar || '/static/assets/icons/smile.svg',
    token: crypto.randomBytes(16).toString('hex')
  }
}

exports.main = async (event = {}) => {
  const action = event.action
  const username = normalizeUsername(event.username)
  const password = String(event.password || '')

  if (action !== 'register' && action !== 'login') {
    return { code: -1, message: '\u975e\u6cd5\u64cd\u4f5c' }
  }
  if (!isValidUsername(username)) {
    return { code: 1001, message: '用户名需为5-10位，以字母开头，仅支持字母和数字' }
  }
  if (!isValidPassword(password)) {
    return { code: 1002, message: '\u5bc6\u7801\u9700\u4e3a6-20\u4f4d' }
  }

  if (action === 'register') {
    const existed = await users.where({ username }).limit(1).get()
    if (existed.data && existed.data.length) {
      return { code: 1003, message: '\u7528\u6237\u540d\u5df2\u5b58\u5728' }
    }

    const salt = makeSalt()
    const user = {
      username,
      nickname: defaultNickname(username),
      phone: '',
      avatar: '/static/assets/icons/smile.svg',
      salt,
      passwordHash: hashPassword(password, salt),
      createdAt: now(),
      updatedAt: now(),
      lastLoginAt: 0
    }
    const addResult = await users.add(user)
    return { code: 0, message: '\u6ce8\u518c\u6210\u529f', userId: addResult.id }
  }

  const loginResult = await users.where({ username }).limit(1).get()
  const user = loginResult.data && loginResult.data[0]
  if (!user || user.passwordHash !== hashPassword(password, user.salt)) {
    return { code: 1004, message: '\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef' }
  }

  const nextUser = { ...user }
  const loginUpdate = {
    lastLoginAt: now(),
    updatedAt: now()
  }
  // 兼容旧数据：早期版本把昵称写成用户名，登录时自动迁移为默认展示昵称。
  if (!nextUser.nickname || nextUser.nickname === nextUser.username) {
    nextUser.nickname = defaultNickname(nextUser.username)
    loginUpdate.nickname = nextUser.nickname
  }
  await users.doc(user._id).update(loginUpdate)

  return {
    code: 0,
    message: '\u767b\u5f55\u6210\u529f',
    user: publicUser(nextUser)
  }
}
