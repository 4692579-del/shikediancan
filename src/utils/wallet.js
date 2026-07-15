// 食刻钱包后端工具层：
// 页面优先读取本地缓存保证显示速度，开通、关闭、充值、提现、支付和账单删除都通过 uniCloud 写入后端。
import cloud from './cloud.js'
import store from './store.js'

const FUNCTION_NAME = 'wallet-service'
const WALLET_CACHE_KEY = 'sk_wallet_cache'
const RECHARGE_CACHE_KEY = 'sk_wallet_recharge_orders'
const WALLET_SYNC_TIME_KEY = 'sk_wallet_backend_sync_at'
const WALLET_SYNC_TTL = 8000

let walletPromise = null

function currentUserId() {
  const user = store.get('sk_user', null)
  return user && (user.uid || user.userId || user.accountId || user.username)
}

function ensureUserId() {
  const userId = currentUserId()
  if (!userId) throw new Error('请先登录')
  return String(userId)
}

function emptyWallet() {
  return { opened: false, payPasswordSet: false, balance: 0, transactions: [] }
}

function normalizeWallet(wallet = {}) {
  return {
    ...wallet,
    opened: wallet.opened === true,
    payPasswordSet: wallet.payPasswordSet === true,
    balance: Number(wallet.balance || 0),
    transactions: Array.isArray(wallet.transactions) ? wallet.transactions : []
  }
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
  const data = result.result || {}
  if (data.code !== 0) throw new Error(data.message || '钱包服务暂时不可用')
  return data
}

function getWallet() {
  return normalizeWallet(store.get(WALLET_CACHE_KEY, emptyWallet()))
}

function saveWalletCache(wallet) {
  const normalized = normalizeWallet(wallet || emptyWallet())
  store.set(WALLET_CACHE_KEY, normalized)
  uni.setStorageSync(WALLET_SYNC_TIME_KEY, Date.now())
  return normalized
}

async function fetchWallet(options = {}) {
  const force = Boolean(options.force)
  const cached = getWallet()
  const lastSyncAt = Number(uni.getStorageSync(WALLET_SYNC_TIME_KEY) || 0)
  if (!force && Date.now() - lastSyncAt < WALLET_SYNC_TTL) return cached
  if (walletPromise) return walletPromise

  walletPromise = call('wallet.get')
    .then(data => saveWalletCache(data.wallet || emptyWallet()))
    .catch(error => {
      if (cached.opened || cached.transactions.length) return cached
      throw error
    })
    .finally(() => {
      walletPromise = null
    })

  return walletPromise
}

function isOpened() {
  return getWallet().opened === true
}

async function openWallet(payPassword) {
  const data = await call('wallet.open', { payPassword })
  return saveWalletCache(data.wallet)
}

async function closeWallet(reason, payPassword) {
  const data = await call('wallet.close', { reason, payPassword })
  return saveWalletCache(data.wallet)
}

async function withdraw(amount, method = 'quick', payPassword = '') {
  const data = await call('wallet.withdraw', { amount, method, payPassword })
  return saveWalletCache(data.wallet)
}

async function pay(amount, orderId, payPassword = '') {
  const data = await call('wallet.pay', { amount, orderId, scene: 'food', payPassword })
  return saveWalletCache(data.wallet)
}

async function payMembership(amount, paymentId, payPassword = '') {
  const data = await call('wallet.pay', { amount, orderId: paymentId, scene: 'membership', payPassword })
  return saveWalletCache(data.wallet)
}

async function changePayPassword(oldPassword, newPassword) {
  const data = await call('wallet.payPassword.change', { oldPassword, newPassword })
  return saveWalletCache(data.wallet)
}

async function setPayPassword(newPassword) {
  const data = await call('wallet.payPassword.set', { newPassword })
  return saveWalletCache(data.wallet)
}

async function changeLoginPassword(oldPassword, newPassword) {
  const data = await call('account.loginPassword.change', { oldPassword, newPassword })
  return data
}

async function deleteTransaction(id) {
  const data = await call('wallet.transaction.delete', { id })
  return saveWalletCache(data.wallet)
}

function getRechargeCache() {
  const orders = store.get(RECHARGE_CACHE_KEY, {})
  return orders && typeof orders === 'object' ? orders : {}
}

function getCachedRechargeOrder(id) {
  if (!id) return null
  return getRechargeCache()[id] || null
}

function saveRechargeCache(order) {
  if (!order || !order.id) return order
  const orders = getRechargeCache()
  orders[order.id] = order
  store.set(RECHARGE_CACHE_KEY, orders)
  return order
}

async function createRechargeOrder(amount) {
  const data = await call('recharge.create', { amount })
  return saveRechargeCache(data.order)
}

async function getRechargeOrder(id) {
  const data = await call('recharge.get', { id })
  return saveRechargeCache(data.order)
}

async function completeRechargeOrder(id, method) {
  const data = await call('recharge.complete', { id, method })
  if (data.wallet) saveWalletCache(data.wallet)
  return saveRechargeCache(data.order)
}

export default {
  getWallet,
  fetchWallet,
  isOpened,
  openWallet,
  closeWallet,
  withdraw,
  createRechargeOrder,
  getRechargeOrder,
  getCachedRechargeOrder,
  completeRechargeOrder,
  pay,
  payMembership,
  deleteTransaction,
  changePayPassword,
  setPayPassword,
  changeLoginPassword
}
