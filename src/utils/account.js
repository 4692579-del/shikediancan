// 账号工具：统一管理当前登录用户、本机已登录账号列表、资料卡主题和切换账号时的会话缓存清理。

import store from './store.js'
import membership from './membership.js'

const PROFILE_KEY = 'sk_account_profiles'
const ACCOUNT_LIST_KEY = 'sk_login_accounts'
const THEME_KEY = 'sk_profile_theme'

const SESSION_ARRAY_KEYS = [
  'sk_addresses',
  'sk_cart',
  'sk_orders',
  'sk_favorites',
  'sk_favorite_foods',
  'sk_coupons',
  'sk_reviews',
  'sk_pending_reviews'
]

const SESSION_REMOVE_KEYS = [
  'sk_selected_address',
  'sk_addresses_backend_sync_at',
  'sk_selected_coupon',
  'sk_order_draft',
  'sk_wallet_cache',
  'sk_wallet_recharge_orders',
  'sk_wallet_backend_sync_at',
  'sk_orders_backend_sync_at',
  'sk_cart_backend_sync_at',
  'sk_reviews_backend_sync_at',
  'sk_pending_reviews_backend_sync_at',
  'sk_favorites_backend_sync_at',
  'sk_benefit_backend_sync_at',
  'sk_coupon_backend_sync_at',
  'sk_member_order_backend_sync_at',
  'sk_plus_membership'
]

function getAccountId(user = {}) {
  if (user.accountId) return user.accountId
  if (user.uid) return `cloud:${user.uid}`
  if (user.username) return `username:${user.username}`
  return user.phone ? `account:${user.phone}` : 'account:quick-default'
}

function getProfiles() {
  return store.get(PROFILE_KEY, {})
}

function normalizeAccount(user = {}) {
  const accountId = getAccountId(user)
  const uid = user.uid || user.userId || (accountId.startsWith('cloud:') ? accountId.replace('cloud:', '') : '')
  return {
    accountId,
    uid,
    username: user.username || '',
    nickname: user.nickname || (user.username ? `食刻用户${user.username}` : '食刻用户'),
    avatar: user.avatar || '/static/assets/icons/smile.svg',
    lastLoginAt: Date.now()
  }
}

function rememberAccount(user) {
  if (!user) return []
  const account = normalizeAccount(user)
  const list = getSavedAccounts().filter(item => item.accountId !== account.accountId)
  list.unshift(account)
  const nextList = list.slice(0, 8)
  store.set(ACCOUNT_LIST_KEY, nextList)
  return nextList
}

function getSavedAccounts() {
  const profiles = getProfiles()
  const saved = Array.isArray(store.get(ACCOUNT_LIST_KEY, [])) ? store.get(ACCOUNT_LIST_KEY, []) : []
  const map = {}

  saved.forEach(item => {
    if (item && item.accountId) map[item.accountId] = item
  })

  Object.keys(profiles).forEach(accountId => {
    const profile = profiles[accountId]
    if (!profile || !profile.user) return
    if (!map[accountId]) map[accountId] = normalizeAccount(profile.user)
  })

  return Object.values(map)
    .filter(item => item && item.accountId)
    .sort((a, b) => Number(b.lastLoginAt || 0) - Number(a.lastLoginAt || 0))
}

function removeSavedAccount(accountId) {
  if (!accountId) return getSavedAccounts()
  const list = getSavedAccounts().filter(item => item.accountId !== accountId)
  store.set(ACCOUNT_LIST_KEY, list)
  const profiles = getProfiles()
  if (profiles[accountId]) {
    delete profiles[accountId]
    store.set(PROFILE_KEY, profiles)
  }
  return list
}

function saveCurrentUser(user = store.get('sk_user', null)) {
  if (!user) return
  const accountId = getAccountId(user)
  const profiles = getProfiles()
  profiles[accountId] = {
    user: { ...user, accountId },
    themeId: store.get(THEME_KEY, profiles[accountId] ? profiles[accountId].themeId : 'black')
  }
  store.set(PROFILE_KEY, profiles)
  rememberAccount({ ...user, accountId })
}

function login(defaultUser) {
  const accountId = getAccountId(defaultUser)
  const profiles = getProfiles()
  const legacyId = defaultUser.phone ? `account:${defaultUser.phone}` : ''
  const profile = profiles[accountId] || (legacyId ? profiles[legacyId] : null)
  const user = { ...(profile ? profile.user : {}), ...defaultUser, accountId }
  const themeId = profile ? profile.themeId : 'black'

  store.set('sk_user', user)
  store.set(THEME_KEY, themeId)

  profiles[accountId] = {
    user: { ...user, accountId },
    themeId
  }
  store.set(PROFILE_KEY, profiles)
  rememberAccount(user)
  membership.syncCurrent()
  return user
}

function saveTheme(themeId) {
  const user = store.get('sk_user', null)
  if (!user) return
  store.set(THEME_KEY, themeId)
  const accountId = getAccountId(user)
  const profiles = getProfiles()
  profiles[accountId] = {
    user: { ...user, accountId },
    themeId
  }
  store.set(PROFILE_KEY, profiles)
  rememberAccount(user)
}

function clearUserSessionData() {
  SESSION_ARRAY_KEYS.forEach(key => store.set(key, []))
  SESSION_REMOVE_KEYS.forEach(key => {
    try {
      uni.removeStorageSync(key)
    } catch (err) {}
  })
  membership.clearSession()
}

function switchToUser(defaultUser) {
  saveCurrentUser()
  clearUserSessionData()
  return login(defaultUser)
}

function logout() {
  saveCurrentUser()
  clearUserSessionData()
  store.set('sk_user', null)
  uni.removeStorageSync(THEME_KEY)
}

export default {
  getAccountId,
  getSavedAccounts,
  rememberAccount,
  removeSavedAccount,
  login,
  saveCurrentUser,
  saveTheme,
  clearUserSessionData,
  switchToUser,
  logout
}
