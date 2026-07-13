function normalizeProps(properties = {}) {
  const props = {}
  Object.keys(properties).forEach(key => {
    const definition = properties[key]
    if (typeof definition === 'function') props[key] = { type: definition }
    else props[key] = { type: definition.type, default: definition.value }
  })
  return props
}

export default function adaptComponent(config = {}) {
  const options = {
    props: normalizeProps(config.properties),
    data() { return JSON.parse(JSON.stringify(config.data || {})) },
    methods: {
      setData(patch = {}, callback) {
        Object.keys(patch).forEach(key => {
          const segments = key.replace(/\[(\d+)\]/g, '.$1').split('.')
          let target = this
          while (segments.length > 1) target = target[segments.shift()]
          target[segments[0]] = patch[key]
        })
        this.$nextTick(() => { if (typeof callback === 'function') callback.call(this) })
      },
      triggerEvent(name, detail) { this.$emit(name, detail) }
    }
  }
  Object.assign(options.methods, config.methods || {})
  if (config.lifetimes && config.lifetimes.attached) options.mounted = config.lifetimes.attached
  if (config.lifetimes && config.lifetimes.detached) options.beforeUnmount = config.lifetimes.detached
  return options
}
