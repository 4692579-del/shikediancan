import store from './store.js'
import membership from './membership.js'
import profileTheme from './profile-theme.js'

const PAGE_LIFECYCLES = new Set(["onBackPress", "onHide", "onLoad", "onPageScroll", "onPullDownRefresh", "onReachBottom", "onReady", "onResize", "onShareAppMessage", "onShow", "onUnload"])

function cloneData(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function themeStyle() {
  const themeId = store.get('sk_profile_theme', 'black')
  const theme = profileTheme.getTheme(themeId)
  const activeId = theme.membershipLimited && !membership.hasTier(theme.requiredTier || 'plus') ? 'black' : themeId
  return profileTheme.getGlobalStyle(activeId)
}

export default function adaptPage(config = {}) {
  const options = {
    data() {
      return { ...cloneData(config.data || {}), globalThemeStyle: themeStyle() }
    },
    methods: {
      setData(patch = {}, callback) {
        Object.keys(patch).forEach(key => {
          const segments = key.replace(/\[(\d+)\]/g, '.$1').split('.')
          let target = this
          while (segments.length > 1) {
            const segment = segments.shift()
            if (target[segment] == null) target[segment] = {}
            target = target[segment]
          }
          target[segments[0]] = patch[key]
        })
        this.$nextTick(() => { if (typeof callback === 'function') callback.call(this) })
      }
    }
  }
  Object.keys(config).forEach(key => {
    if (key === 'data') return
    const value = config[key]
    if (PAGE_LIFECYCLES.has(key)) {
      options[key] = function (...args) {
        if (key === 'onLoad' || key === 'onShow') this.globalThemeStyle = themeStyle()
        return value.apply(this, args)
      }
    } else if (typeof value === 'function') {
      options.methods[key] = value
    } else {
      options[key] = value
    }
  })
  return options
}
