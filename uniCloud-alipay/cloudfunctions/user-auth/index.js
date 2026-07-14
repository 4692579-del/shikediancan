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
  return /^[a-zA-Z0-9_\u4e00-\u9fa5]{3,20}$/.test(username)
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
    nickname: user.nickname || user.username,
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
    return { code: 1001, message: '\u7528\u6237\u540d\u9700\u4e3a3-20\u4f4d\u4e2d\u6587\u3001\u5b57\u6bcd\u3001\u6570\u5b57\u6216\u4e0b\u5212\u7ebf' }
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
      nickname: username,
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

  await users.doc(user._id).update({
    lastLoginAt: now(),
    updatedAt: now()
  })

  return {
    code: 0,
    message: '\u767b\u5f55\u6210\u529f',
    user: publicUser(user)
  }
}
