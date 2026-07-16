// 地址后端同步工具：登录、切换账号、首页展示、购物车结算和确认订单统一从这里读取地址。
// 这样可以避免“只有进入地址管理页后地址才刷新”的状态不同步问题。
import store from './store.js'
import cloud from './cloud.js'

const ADDRESS_SYNC_KEY = 'sk_addresses_backend_sync_at'

let pendingRequest = null

function getUserId() {
  const user = store.get('sk_user', null)
  return user && (user.uid || user.userId || '')
}

function hasSynced() {
  return !!store.get(ADDRESS_SYNC_KEY, 0)
}

function markSynced() {
  store.set(ADDRESS_SYNC_KEY, Date.now())
}

function syncSelectedAddress(addresses = store.getAddresses()) {
  const selectedAddress = store.get('sk_selected_address', null)

  if (selectedAddress && selectedAddress.id) {
    const selected = addresses.find(item => String(item.id) === String(selectedAddress.id))
    if (selected) {
      store.set('sk_selected_address', { ...selected })
      return selected
    }
    store.set('sk_selected_address', null)
  }

  const defaultAddress = addresses.find(item => item.isDefault) || null
  if (defaultAddress) store.set('sk_selected_address', { ...defaultAddress })
  return defaultAddress
}

function getCurrentAddress(addresses = store.getAddresses()) {
  const selectedAddress = store.get('sk_selected_address', null)
  const selected = selectedAddress && selectedAddress.id
    ? addresses.find(item => String(item.id) === String(selectedAddress.id))
    : null
  return selected || addresses.find(item => item.isDefault) || null
}

async function fetchAddresses(options = {}) {
  const { force = false, silent = true } = options
  const userId = getUserId()

  if (!store.isLogin() || !userId) {
    store.setAddresses([])
    store.set('sk_selected_address', null)
    return []
  }

  if (!force && hasSynced()) {
    const cached = store.getAddresses()
    syncSelectedAddress(cached)
    return cached
  }

  if (pendingRequest) return pendingRequest

  pendingRequest = cloud.callFunction({
    name: 'address-service',
    data: { action: 'list', userId }
  }).then(({ result }) => {
    if (!result || result.code !== 0) {
      throw new Error((result && result.message) || '地址加载失败')
    }
    const addresses = store.setAddresses(result.addresses || [])
    syncSelectedAddress(addresses)
    markSynced()
    return addresses
  }).catch(err => {
    if (!silent) throw err
    console.error('sync addresses failed:', cloud.normalizeError(err), err)
    return store.getAddresses()
  }).finally(() => {
    pendingRequest = null
  })

  return pendingRequest
}

function updateLocal(addresses = []) {
  const next = store.setAddresses(addresses)
  syncSelectedAddress(next)
  markSynced()
  return next
}

export default {
  ADDRESS_SYNC_KEY,
  fetchAddresses,
  getCurrentAddress,
  syncSelectedAddress,
  updateLocal,
  markSynced,
  hasSynced
}
