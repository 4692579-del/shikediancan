import store from './store.js'

const STORAGE_KEY = 'sk_notification_settings'

const groups = {
  order: {
    title: '订单与交易通知',
    desc: '管理下单、支付、退款和配送过程中的关键提醒。',
    items: [
      {
        key: 'orderStatus',
        title: '订单状态通知',
        desc: '订单提交、商家接单、制作完成等进度提醒'
      },
      {
        key: 'paymentRefund',
        title: '支付与退款通知',
        desc: '支付成功、待支付倒计时、退款/取消结果提醒'
      },
      {
        key: 'deliveryProgress',
        title: '配送进度通知',
        desc: '预计送达、骑手配送、确认送达等过程提醒'
      }
    ]
  },
  service: {
    title: '优惠与服务通知',
    desc: '管理优惠、会员、钱包等服务类消息提醒。',
    items: [
      {
        key: 'promotion',
        title: '优惠活动通知',
        desc: '优惠券、满减活动、新品推荐等提醒'
      },
      {
        key: 'memberWallet',
        title: '会员与钱包提醒',
        desc: '会员权益、钱包账单、余额变化等提醒'
      }
    ]
  }
}

const defaults = {
  orderStatus: true,
  paymentRefund: true,
  deliveryProgress: true,
  promotion: true,
  memberWallet: true
}

function get() {
  const saved = store.get(STORAGE_KEY, {})
  return {
    ...defaults,
    // 兼容旧版本三个开关的本地缓存，避免用户升级后设置突然丢失。
    orderStatus: saved.notice ?? saved.orderStatus ?? defaults.orderStatus,
    promotion: saved.promotion ?? defaults.promotion,
    ...saved
  }
}

function set(field, value) {
  if (!Object.prototype.hasOwnProperty.call(defaults, field)) return get()
  const next = {
    ...get(),
    [field]: Boolean(value)
  }
  store.set(STORAGE_KEY, next)
  return next
}

function getGroup(type) {
  return groups[type] || groups.order
}

export default {
  STORAGE_KEY,
  groups,
  defaults,
  get,
  set,
  getGroup
}
