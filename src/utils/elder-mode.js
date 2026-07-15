const ELDER_MODE_KEY = 'sk_elder_mode'

function isEnabled() {
  return Boolean(uni.getStorageSync(ELDER_MODE_KEY))
}

function setEnabled(enabled) {
  uni.setStorageSync(ELDER_MODE_KEY, Boolean(enabled))
}

function toggle() {
  const next = !isEnabled()
  setEnabled(next)
  return next
}

export default {
  key: ELDER_MODE_KEY,
  isEnabled,
  setEnabled,
  toggle
}
