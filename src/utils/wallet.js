// 钱包业务工具：按账号保存钱包状态、余额、账单、充值订单和支付记录。

import store from './store.js'
const WALLET_KEY = 'sk_wallet_accounts'
const RECHARGE_KEY = 'sk_wallet_recharge_orders'
const RECHARGE_DURATION = 15 * 60 * 1000

// 钱包数据按当前登录账号隔离保存。
function accountId() {
  const user = store.get('sk_user', null)
  if (!user) return ''
  return user.accountId || user.phone || 'quick-default'
}

function getAccounts() {
  return store.get(WALLET_KEY, {})
}

// 读取并修复钱包数据结构，首次使用时余额固定为零。
function getWallet() {
  const id = accountId()
  if (!id) return { opened: false, balance: 0, transactions: [] }
  const accounts = getAccounts()
  const saved = accounts[id]
  if (!saved) return { opened: false, balance: 0, transactions: [] }

  // Migrate the old auto-opened wallet that included a fixed demo balance.
  if (typeof saved.opened !== 'boolean') {
    accounts[id] = { opened: false, balance: 0, transactions: [] }
    store.set(WALLET_KEY, accounts)
    return { ...accounts[id] }
  }
  return {
    ...saved,
    opened: saved.opened === true,
    balance: Number(saved.balance || 0),
    transactions: Array.isArray(saved.transactions) ? saved.transactions : []
  }
}

function saveWallet(wallet) {
  const id = accountId()
  if (!id) return wallet
  const accounts = getAccounts()
  accounts[id] = wallet
  store.set(WALLET_KEY, accounts)
  return wallet
}

function isOpened() {
  return getWallet().opened === true
}

// 开通钱包时重置余额和账单，避免继承历史测试数据。
function openWallet() {
  return saveWallet({
    opened: true,
    balance: 0,
    transactions: [],
    openedAt: Date.now()
  })
}

function closeWallet(reason) {
  const current = getWallet()
  if (!current.opened || Number(current.balance) !== 0) return null
  return saveWallet({
    opened: false,
    balance: 0,
    transactions: [],
    closedAt: Date.now(),
    closeReason: reason || ''
  })
}

function timeText(timestamp = Date.now()) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 统一生成充值、提现和消费账单记录。
function addTransaction(type, amount, title, orderId = '') {
  const wallet = getWallet()
  if (!wallet.opened) return null
  const value = Number(Number(amount).toFixed(2))
  wallet.balance = Number((wallet.balance + (type === 'income' ? value : -value)).toFixed(2))
  wallet.transactions.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    amount: value,
    title,
    orderId,
    createdAt: timeText()
  })
  return saveWallet(wallet)
}

function recharge(amount, method = '') {
  const methodText = method === 'alipay' ? '支付宝' : method === 'quick' ? '第三方平台' : ''
  return addTransaction('income', amount, methodText ? `${methodText}充值` : '钱包充值')
}

function withdraw(amount, method = 'quick') {
  const wallet = getWallet()
  const value = Number(amount)
  if (!wallet.opened || !Number.isFinite(value) || value <= 0 || wallet.balance < value) return null
  return addTransaction('expense', value, `提现到${method === 'alipay' ? '支付宝' : '第三方平台'}`)
}

// 创建充值订单。余额不会在此处增加，必须等收银台完成支付后再入账。
// 充值先创建待支付订单，实际到账在收银台支付完成后执行。
function createRechargeOrder(amount) {
  const value = Number(Number(amount).toFixed(2))
  if (!isOpened() || !Number.isFinite(value) || value < 1 || value > 5000) return null
  const orders = store.get(RECHARGE_KEY, {})
  const now = Date.now()
  const order = {
    id: `WR${now}${Math.random().toString(16).slice(2, 6)}`,
    accountId: accountId(),
    amount: value,
    status: 'unpaid',
    createdAt: now,
    paymentDeadline: now + RECHARGE_DURATION
  }
  orders[order.id] = order
  store.set(RECHARGE_KEY, orders)
  return order
}

function getRechargeOrder(id) {
  const orders = store.get(RECHARGE_KEY, {})
  const order = orders[id]
  if (!order || order.accountId !== accountId()) return null
  if (order.status === 'unpaid' && Number(order.paymentDeadline) <= Date.now()) {
    orders[id] = { ...order, status: 'cancelled', cancelledAt: Date.now(), paymentDeadline: null }
    store.set(RECHARGE_KEY, orders)
    return orders[id]
  }
  return order
}

// 完成充值时先写入订单状态，再增加余额，确保同一充值订单只入账一次。
// 充值支付成功后更新订单状态并增加钱包余额。
function completeRechargeOrder(id, method) {
  const order = getRechargeOrder(id)
  if (!order || order.status !== 'unpaid' || method === 'wallet') return null
  const orders = store.get(RECHARGE_KEY, {})
  const paid = {
    ...order,
    status: 'paid',
    method,
    paidAt: Date.now(),
    paymentDeadline: null
  }
  orders[id] = paid
  store.set(RECHARGE_KEY, orders)
  const result = recharge(order.amount, method)
  return result ? paid : null
}

// 钱包支付前校验开通状态和余额，成功后扣款并生成账单。
function pay(amount, orderId) {
  const wallet = getWallet()
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0 || wallet.balance < value) return null
  return addTransaction('expense', value, '食刻订单支付', orderId)
}

function payMembership(amount, paymentId) {
  const wallet = getWallet()
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0 || wallet.balance < value) return null
  return addTransaction('expense', value, '食刻会员开通/升级', paymentId)
}

function deleteTransaction(id) {
  const wallet = getWallet()
  wallet.transactions = wallet.transactions.filter(item => item.id !== id)
  return saveWallet(wallet)
}

export default {
  getWallet,
  isOpened,
  openWallet,
  closeWallet,
  recharge,
  withdraw,
  createRechargeOrder,
  getRechargeOrder,
  completeRechargeOrder,
  pay,
  payMembership,
  deleteTransaction
}
