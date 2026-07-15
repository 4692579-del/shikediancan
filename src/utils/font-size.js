const FONT_SIZE_KEY = 'sk_font_size_level'

const levels = [
  { key: 'small', label: '小号', scale: 0.92, desc: '显示更紧凑，适合信息浏览。' },
  { key: 'standard', label: '标准', scale: 1, desc: '默认字号，兼顾信息量与舒适度。' },
  { key: 'large', label: '大号', scale: 1.12, desc: '文字更醒目，点餐阅读更轻松。' }
]

function safeGet() {
  try {
    const value = uni.getStorageSync(FONT_SIZE_KEY)
    return levels.some(item => item.key === value) ? value : 'standard'
  } catch (err) {
    return 'standard'
  }
}

function getLevel() {
  return safeGet()
}

function getIndex() {
  return Math.max(0, levels.findIndex(item => item.key === getLevel()))
}

function getCurrent() {
  return levels[getIndex()] || levels[1]
}

function setLevelByIndex(index) {
  const normalized = Math.max(0, Math.min(2, Number(index) || 0))
  const next = levels[normalized] || levels[1]
  uni.setStorageSync(FONT_SIZE_KEY, next.key)
  uni.$emit('fontSizeChanged', next)
  return next
}

export default {
  levels,
  getLevel,
  getIndex,
  getCurrent,
  setLevelByIndex
}
