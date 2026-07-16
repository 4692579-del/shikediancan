'use strict'

const crypto = require('crypto')
const db = uniCloud.database()
const wallets = db.collection('sk_wallets')
const recharges = db.collection('sk_wallet_recharges')
const discountOffers = db.collection('sk_wallet_discount_offers')

const PAY_EXPIRE_TIME = 15 * 60 * 1000
const MAX_BILLS = 80

function now() {
  return Date.now()
}

function ok(data = {}) {
  return { code: 0, ...data }
}

function fail(code, message) {
  return { code, message }
}

function normalizeUserId(event = {}) {
  return String(event.userId || event.uid || '').trim()
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function validAmount(value) {
  const amount = roundMoney(value)
  return amount > 0 && Number.isFinite(amount) ? amount : 0
}

function makeId(prefix = 'W') {
  return `${prefix}${Date.now()}${Math.random().toString(16).slice(2, 8)}`
}

function makeSalt() {
  return crypto.randomBytes(8).toString('hex')
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex')
}

function normalizePayPassword(password) {
  return String(password || '').trim()
}

function isValidPayPassword(password) {
  return /^\d{6}$/.test(normalizePayPassword(password))
}

function isValidLoginPassword(password) {
  return /^.{6,20}$/.test(String(password || ''))
}

function hasPayPassword(wallet = {}) {
  return Boolean(wallet.payPasswordHash && wallet.payPasswordSalt)
}

function verifyPayPassword(wallet = {}, password) {
  const payPassword = normalizePayPassword(password)
  if (!hasPayPassword(wallet)) return fail(4020, '请先设置食刻钱包支付密码')
  if (!isValidPayPassword(payPassword)) return fail(4021, '请输入6位数字支付密码')
  if (hashPassword(payPassword, wallet.payPasswordSalt) !== wallet.payPasswordHash) {
    return fail(4022, '支付密码错误')
  }
  return null
}

function timeText(timestamp) {
  const date = new Date(timestamp || now())
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function emptyWallet(userId) {
  return {
    userId,
    opened: false,
    balance: 0,
    transactions: [],
    payPasswordSet: false,
    everOpened: false,
    firstOpenBonusEligible: false,
    firstWalletPayUsed: false
  }
}

function toClientWallet(wallet = {}) {
  const everOpened = wallet.everOpened === true || Boolean(wallet.firstOpenedAt || wallet.openedAt || wallet.closedAt)
  return {
    id: wallet._id || '',
    userId: wallet.userId || '',
    opened: wallet.opened === true,
    payPasswordSet: hasPayPassword(wallet),
    balance: roundMoney(wallet.balance || 0),
    transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
    everOpened,
    firstOpenBonusEligible: wallet.firstOpenBonusEligible === true && wallet.firstWalletPayUsed !== true,
    firstWalletPayUsed: wallet.firstWalletPayUsed === true
  }
}

function toClientRecharge(order = {}) {
  return {
    id: order._id || order.id,
    type: 'walletRecharge',
    title: '食刻钱包充值',
    amount: roundMoney(order.amount || 0),
    status: order.status || 'unpaid',
    method: order.method || '',
    createdAt: order.createdAt || now(),
    paymentDeadline: order.paymentDeadline || 0,
    paidAt: order.paidAt || 0
  }
}

function buildTransaction({ type, amount, title, method, orderId }) {
  const current = now()
  return {
    id: makeId(type === 'income' ? 'IN' : 'OUT'),
    type,
    amount: roundMoney(amount),
    title,
    method: method || '',
    orderId: orderId || '',
    createdAt: current,
    time: timeText(current)
  }
}

async function findWallet(userId) {
  const result = await wallets.where({ userId }).limit(1).get()
  return result.data && result.data[0]
}

async function ensureWallet(userId) {
  const existed = await findWallet(userId)
  if (existed) return existed
  const current = now()
  const wallet = {
    ...emptyWallet(userId),
    createdAt: current,
    updatedAt: current
  }
  const added = await wallets.add(wallet)
  return { ...wallet, _id: added.id || added._id }
}

async function updateWallet(wallet, patch) {
  const next = {
    ...patch,
    updatedAt: now()
  }
  await wallets.doc(wallet._id).update(next)
  return {
    ...wallet,
    ...next
  }
}

async function getWallet(userId) {
  const wallet = await findWallet(userId)
  return ok({ wallet: toClientWallet(wallet || emptyWallet(userId)) })
}

async function openWallet(userId, payPassword) {
  const wallet = await ensureWallet(userId)
  const password = normalizePayPassword(payPassword)
  if (!isValidPayPassword(password)) return fail(4021, '请设置6位数字支付密码')
  const payPasswordSalt = makeSalt()
  const current = now()
  const everOpened = wallet.everOpened === true || Boolean(wallet.firstOpenedAt || wallet.openedAt || wallet.closedAt)
  const next = await updateWallet(wallet, {
    opened: true,
    balance: wallet.opened ? roundMoney(wallet.balance || 0) : roundMoney(wallet.balance || 0),
    payPasswordSalt,
    payPasswordHash: hashPassword(password, payPasswordSalt),
    payPasswordUpdatedAt: current,
    everOpened: true,
    firstOpenedAt: wallet.firstOpenedAt || current,
    firstOpenBonusEligible: everOpened ? wallet.firstOpenBonusEligible === true && wallet.firstWalletPayUsed !== true && !wallet.closedAt : true,
    openedAt: current,
    closedAt: 0,
    closeReason: null
  })
  return ok({ wallet: toClientWallet(next) })
}

async function closeWallet(userId, reason) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return ok({ wallet: toClientWallet(wallet) })
  if (roundMoney(wallet.balance || 0) > 0) return fail(4001, '钱包还有余额，无法关闭')
  const next = await updateWallet(wallet, {
    opened: false,
    everOpened: true,
    firstOpenBonusEligible: false,
    transactions: [],
    closedAt: now(),
    closeReason: reason || null
  })
  return ok({ wallet: toClientWallet(next) })
}

function generateRandomDiscount(amount) {
  const payable = Number(amount)
  if (!Number.isFinite(payable) || payable <= 0.01) return 0

  const chance = Math.random()
  let discount
  if (chance < 0.985) {
    discount = 0.01 + Math.random() * 0.48
  } else if (chance < 0.997) {
    discount = 0.5 + Math.pow(Math.random(), 2) * 1.5
  } else if (chance < 0.9995) {
    discount = 2 + Math.pow(Math.random(), 2) * 8
  } else {
    discount = 10 + Math.pow(Math.random(), 3) * 20
  }

  const maximum = Math.min(30, payable - 0.01)
  return roundMoney(Math.max(0.01, Math.min(discount, maximum)))
}

function normalizeScene(scene) {
  return scene === 'membership' ? 'membership' : 'food'
}

function clientOffer(offer = {}) {
  return {
    id: offer._id || offer.id || '',
    orderId: offer.orderId || '',
    scene: offer.scene || 'food',
    originalAmount: roundMoney(offer.originalAmount || 0),
    discount: roundMoney(offer.discount || 0),
    payableAmount: roundMoney(offer.payableAmount || 0),
    firstUse: offer.firstUse === true,
    status: offer.status || 'locked'
  }
}

async function findLockedDiscountOffer(userId, orderId, scene) {
  if (!orderId) return null
  const result = await discountOffers
    .where({ userId, orderId: String(orderId), scene: normalizeScene(scene), status: 'locked' })
    .limit(1)
    .get()
  return result.data && result.data[0]
}

async function prepareDiscountOffer(userId, amount, orderId, scene) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const originalAmount = validAmount(amount)
  if (!originalAmount) return fail(4050, '优惠金额计算失败')
  if (!orderId) return fail(4051, '缺少支付订单信息')
  const normalizedScene = normalizeScene(scene)
  const existed = await findLockedDiscountOffer(userId, orderId, normalizedScene)
  if (existed && Math.abs(roundMoney(existed.originalAmount || 0) - originalAmount) < 0.01) {
    return ok({ offer: clientOffer(existed), wallet: toClientWallet(wallet) })
  }

  const canUseFirstBonus = wallet.firstOpenBonusEligible === true && wallet.firstWalletPayUsed !== true
  const maximum = Math.max(0, originalAmount - 0.01)
  const discount = canUseFirstBonus ? roundMoney(Math.min(8, maximum)) : generateRandomDiscount(originalAmount)
  const current = now()
  const offer = {
    userId,
    orderId: String(orderId),
    scene: normalizedScene,
    originalAmount,
    discount,
    payableAmount: roundMoney(Math.max(0.01, originalAmount - discount)),
    firstUse: canUseFirstBonus,
    status: 'locked',
    createdAt: current,
    updatedAt: current
  }
  const added = await discountOffers.add(offer)
  return ok({ offer: clientOffer({ ...offer, _id: added.id || added._id }), wallet: toClientWallet(wallet) })
}

async function withdraw(userId, amount, method, payPassword) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const passwordError = verifyPayPassword(wallet, payPassword)
  if (passwordError) return passwordError
  const money = validAmount(amount)
  if (!money) return fail(4003, '请输入正确的提现金额')
  if (roundMoney(wallet.balance || 0) < money) return fail(4004, '钱包余额不足')

  const methodText = method === 'alipay' ? '支付宝' : '第三方平台'
  const transaction = buildTransaction({
    type: 'expense',
    amount: money,
    title: `提现到${methodText}`,
    method
  })
  const next = await updateWallet(wallet, {
    balance: roundMoney(wallet.balance - money),
    transactions: [transaction, ...(wallet.transactions || [])].slice(0, MAX_BILLS)
  })
  return ok({ wallet: toClientWallet(next) })
}

async function pay(userId, amount, orderId, scene, payPassword, originalAmount, discountOfferId) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const passwordError = verifyPayPassword(wallet, payPassword)
  if (passwordError) return passwordError
  const original = validAmount(originalAmount || amount)
  if (!original) return fail(4005, '支付金额不正确')
  let offer = null
  if (discountOfferId) {
    const offerResult = await discountOffers.doc(discountOfferId).get()
    const candidate = offerResult.data && offerResult.data[0]
    if (candidate && candidate.userId === userId && candidate.orderId === String(orderId) && candidate.scene === normalizeScene(scene) && candidate.status === 'locked') {
      offer = candidate
    }
  }
  if (!offer) offer = await findLockedDiscountOffer(userId, orderId, scene)
  if (!offer) {
    const prepared = await prepareDiscountOffer(userId, original, orderId, scene)
    if (prepared.code !== 0) return prepared
    const offerResult = await discountOffers.doc(prepared.offer.id).get()
    offer = offerResult.data && offerResult.data[0]
  }
  if (!offer) return fail(4052, '支付优惠锁定失败，请重新进入收银台')
  if (offer.firstUse && wallet.firstWalletPayUsed === true) return fail(4053, '首次优惠已使用，无法重复享受')
  const money = roundMoney(Math.max(0.01, original - roundMoney(offer.discount || 0)))
  if (Math.abs(money - validAmount(amount)) >= 0.01) return fail(4054, '支付金额异常，请重新进入收银台')
  if (roundMoney(wallet.balance || 0) < money) return fail(4004, '钱包余额不足')

  const transaction = buildTransaction({
    type: 'expense',
    amount: money,
    title: scene === 'membership' ? '会员服务支付' : '食刻订单支付',
    method: 'wallet',
    orderId
  })
  const next = await updateWallet(wallet, {
    balance: roundMoney(wallet.balance - money),
    transactions: [transaction, ...(wallet.transactions || [])].slice(0, MAX_BILLS),
    firstWalletPayUsed: offer.firstUse ? true : wallet.firstWalletPayUsed === true,
    firstWalletPayUsedAt: offer.firstUse ? now() : wallet.firstWalletPayUsedAt,
    firstOpenBonusEligible: offer.firstUse ? false : wallet.firstOpenBonusEligible === true
  })
  await discountOffers.doc(offer._id).update({
    status: 'used',
    usedAt: now(),
    updatedAt: now()
  })
  return ok({ wallet: toClientWallet(next) })
}

async function changePayPassword(userId, oldPassword, newPassword) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const passwordError = verifyPayPassword(wallet, oldPassword)
  if (passwordError) return passwordError
  const nextPassword = normalizePayPassword(newPassword)
  if (!isValidPayPassword(nextPassword)) return fail(4021, '新支付密码需为6位数字')
  if (normalizePayPassword(oldPassword) === nextPassword) return fail(4023, '新旧支付密码不能相同')
  const payPasswordSalt = makeSalt()
  const next = await updateWallet(wallet, {
    payPasswordSalt,
    payPasswordHash: hashPassword(nextPassword, payPasswordSalt),
    payPasswordUpdatedAt: now()
  })
  return ok({ wallet: toClientWallet(next) })
}

async function setPayPassword(userId, newPassword) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  if (hasPayPassword(wallet)) return fail(4024, '已设置支付密码，请使用修改支付密码功能')
  const nextPassword = normalizePayPassword(newPassword)
  if (!isValidPayPassword(nextPassword)) return fail(4021, '支付密码需为6位数字')
  const payPasswordSalt = makeSalt()
  const next = await updateWallet(wallet, {
    payPasswordSalt,
    payPasswordHash: hashPassword(nextPassword, payPasswordSalt),
    payPasswordUpdatedAt: now()
  })
  return ok({ wallet: toClientWallet(next) })
}

async function changeLoginPassword(uid, oldPassword, newPassword) {
  const users = db.collection('sk_users')
  const userResult = await users.doc(uid).get()
  const user = userResult.data && userResult.data[0]
  if (!user) return fail(404, '用户不存在')
  if (!isValidLoginPassword(oldPassword) || !isValidLoginPassword(newPassword)) {
    return fail(4030, '登录密码需为6-20位')
  }
  if (hashPassword(String(oldPassword), user.salt) !== user.passwordHash) {
    return fail(4031, '原登录密码错误')
  }
  if (String(oldPassword) === String(newPassword)) return fail(4032, '新旧登录密码不能相同')
  const salt = makeSalt()
  await users.doc(uid).update({
    salt,
    passwordHash: hashPassword(String(newPassword), salt),
    updatedAt: now()
  })
  return ok({ message: '登录密码已修改' })
}

async function deleteTransaction(userId, id) {
  const wallet = await ensureWallet(userId)
  const transactions = (wallet.transactions || []).filter(item => item.id !== id)
  const next = await updateWallet(wallet, { transactions })
  return ok({ wallet: toClientWallet(next) })
}

async function createRecharge(userId, amount) {
  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const money = validAmount(amount)
  if (!money) return fail(4010, '请输入正确的充值金额')
  if (money > 5000) return fail(4011, '单次充值金额不能超过5000元')

  const current = now()
  const order = {
    userId,
    amount: money,
    status: 'unpaid',
    method: '',
    createdAt: current,
    updatedAt: current,
    paymentDeadline: current + PAY_EXPIRE_TIME
  }
  const added = await recharges.add(order)
  return ok({ order: toClientRecharge({ ...order, _id: added.id || added._id }) })
}

async function findRecharge(userId, id) {
  if (!id) return null
  const result = await recharges.doc(id).get()
  const order = result.data && result.data[0]
  if (!order || order.userId !== userId) return null
  return order
}

async function expireRechargeIfNeeded(order) {
  if (order.status === 'unpaid' && Number(order.paymentDeadline || 0) <= now()) {
    await recharges.doc(order._id).update({
      status: 'cancelled',
      cancelledAt: now(),
      updatedAt: now()
    })
    return { ...order, status: 'cancelled', cancelledAt: now() }
  }
  return order
}

async function getRecharge(userId, id) {
  const order = await findRecharge(userId, id)
  if (!order) return fail(4012, '充值订单不存在')
  const next = await expireRechargeIfNeeded(order)
  return ok({ order: toClientRecharge(next) })
}

async function completeRecharge(userId, id, method) {
  if (method === 'wallet') return fail(4013, '不能使用食刻钱包为钱包充值')
  const order = await findRecharge(userId, id)
  if (!order) return fail(4012, '充值订单不存在')
  const currentOrder = await expireRechargeIfNeeded(order)
  if (currentOrder.status !== 'unpaid') return fail(4014, '该充值订单已失效')

  const wallet = await ensureWallet(userId)
  if (!wallet.opened) return fail(4002, '请先开通食刻钱包')
  const money = roundMoney(currentOrder.amount || 0)
  const transaction = buildTransaction({
    type: 'income',
    amount: money,
    title: method === 'alipay' ? '支付宝充值' : '第三方平台充值',
    method: method || 'quick',
    orderId: currentOrder._id
  })
  const nextWallet = await updateWallet(wallet, {
    balance: roundMoney(wallet.balance + money),
    transactions: [transaction, ...(wallet.transactions || [])].slice(0, MAX_BILLS)
  })
  await recharges.doc(currentOrder._id).update({
    status: 'paid',
    method: method || 'quick',
    paidAt: now(),
    updatedAt: now()
  })

  return ok({
    wallet: toClientWallet(nextWallet),
    order: toClientRecharge({
      ...currentOrder,
      status: 'paid',
      method: method || 'quick',
      paidAt: now()
    })
  })
}

exports.main = async (event = {}) => {
  const userId = normalizeUserId(event)
  if (!userId) return fail(401, '请先登录')

  switch (event.action) {
    case 'wallet.get':
      return getWallet(userId)
    case 'wallet.open':
      return openWallet(userId, event.payPassword)
    case 'wallet.close':
      return closeWallet(userId, event.reason)
    case 'wallet.withdraw':
      return withdraw(userId, event.amount, event.method, event.payPassword)
    case 'wallet.pay':
      return pay(userId, event.amount, event.orderId, event.scene, event.payPassword, event.originalAmount, event.discountOfferId)
    case 'wallet.discount.prepare':
      return prepareDiscountOffer(userId, event.amount, event.orderId, event.scene)
    case 'wallet.payPassword.change':
      return changePayPassword(userId, event.oldPassword, event.newPassword)
    case 'wallet.payPassword.set':
      return setPayPassword(userId, event.newPassword)
    case 'account.loginPassword.change':
      return changeLoginPassword(userId, event.oldPassword, event.newPassword)
    case 'wallet.transaction.delete':
      return deleteTransaction(userId, event.id)
    case 'recharge.create':
      return createRecharge(userId, event.amount)
    case 'recharge.get':
      return getRecharge(userId, event.id)
    case 'recharge.complete':
      return completeRecharge(userId, event.id, event.method)
    default:
      return fail(404, '未知钱包操作')
  }
}
