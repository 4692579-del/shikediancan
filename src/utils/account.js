// 账号工具：按账号保存和恢复用户资料、主题及登录状态。

import store from './store.js'
import membership from './membership.js'
const PROFILE_KEY = 'sk_account_profiles'
const THEME_KEY = 'sk_profile_theme'

// 为第三方平台登录和手机号登录生成稳定的本地账号标识。
function getAccountId(user = {}) {
  if (user.accountId) return user.accountId
  return user.phone ? `account:${user.phone}` : 'account:quick-default'
}

function getProfiles() {
  return store.get(PROFILE_KEY, {})
}

// 将头像、昵称等资料按账号持久化，防止退出后丢失。
function saveCurrentUser(user = store.get('sk_user', null)) {
  if (!user) return
  const accountId = getAccountId(user)
  const profiles = getProfiles()
  profiles[accountId] = {
    user: { ...user, accountId },
    themeId: store.get(THEME_KEY, profiles[accountId] ? profiles[accountId].themeId : 'black')
  }
  store.set(PROFILE_KEY, profiles)
}

// 登录时合并该账号历史资料并恢复账号专属主题。
function login(defaultUser) {
  const accountId = getAccountId(defaultUser)
  const profiles = getProfiles()
  const legacyId = defaultUser.phone ? `account:${defaultUser.phone}` : ''
  const profile = profiles[accountId] || (legacyId ? profiles[legacyId] : null)
  const user = { ...defaultUser, ...(profile ? profile.user : {}), accountId }
  const themeId = profile ? profile.themeId : 'black'
  store.set('sk_user', user)
  store.set(THEME_KEY, themeId)
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
}

// 退出仅清除当前会话，保留账号资料供下次登录恢复。
function logout() {
  saveCurrentUser()
  membership.clearSession()
  store.set('sk_user', null)
  uni.removeStorageSync(THEME_KEY)
}

export default { login, saveCurrentUser, saveTheme, logout }
