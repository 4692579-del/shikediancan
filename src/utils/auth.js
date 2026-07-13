// 登录鉴权工具：记录受限操作目标，并在登录完成后恢复原页面。

import store from './store.js'
const LOGIN_PAGE = '/pages/login/login'
const RETURN_KEY = 'sk_login_return'

// 将页面路径和参数重新拼接为可恢复的完整跳转地址。
function buildUrl(path, options = {}) {
  const query = Object.keys(options)
    .filter(key => options[key] !== undefined && options[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(options[key])}`)
    .join('&')
  return query ? `${path}?${query}` : path
}

function saveReturn(target) {
  if (target && !target.startsWith(LOGIN_PAGE)) store.set(RETURN_KEY, target)
}

// 用于点击操作：未登录时保存目标并以 navigateTo 打开登录页。
function requireLogin(target) {
  if (store.isLogin()) return true
  saveReturn(target)
  uni.navigateTo({ url: LOGIN_PAGE })
  return false
}

// 用于受限页面入口：未登录时用 redirectTo 替换当前页面。
function guardPage(target) {
  if (store.isLogin()) return true
  saveReturn(target)
  uni.redirectTo({ url: LOGIN_PAGE })
  return false
}

// 登录成功后优先返回登录前的目标操作，没有目标时返回个人中心。
function finishLogin(fallback = '/pages/profile/profile') {
  const target = store.get(RETURN_KEY, '')
  uni.removeStorageSync(RETURN_KEY)
  if (target) {
    uni.redirectTo({ url: target, fail: () => uni.redirectTo({ url: fallback }) })
    return
  }
  uni.navigateBack({ fail: () => uni.redirectTo({ url: fallback }) })
}

function cancelLogin() {
  uni.removeStorageSync(RETURN_KEY)
}

export default { buildUrl, requireLogin, guardPage, finishLogin, cancelLogin }
