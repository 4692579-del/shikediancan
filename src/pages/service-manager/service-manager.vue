<template>
  <view :style="globalThemeStyle" class="page">
    <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
      <view class="nav-row">
        <button hover-class="none" class="nav-back page-back" @tap="back">
          <image src="/static/assets/icons/back.svg" mode="aspectFit" />
        </button>
        <view class="nav-center">
          <text class="nav-title">{{text.title}}</text>
        </view>
        <button hover-class="none" class="nav-save-inline" @tap="save">{{text.save}}</button>
        <view class="nav-back nav-placeholder"></view>
      </view>
    </view>

    <view class="content">
      <text class="intro-desc">{{text.desc}}</text>

      <view class="preview-card card">
        <view class="section-head">
          <text>{{text.preview}}</text>
          <button class="reset-btn" hover-class="none" @tap="reset">{{text.reset}}</button>
        </view>
        <view class="preview-grid">
          <view v-for="item in visibleServices" :key="item.key" class="preview-item">
            <view class="preview-icon"><image :src="item.icon" mode="aspectFit" /></view>
            <text>{{item.label}}</text>
          </view>
        </view>
      </view>

      <view class="list-card card">
        <view class="section-head">
          <text>{{text.sort}}</text>
          <text class="section-tip">{{limitTip}}</text>
        </view>
        <view v-for="(item, index) in services" :key="item.key" class="service-row">
          <view class="service-main">
            <view class="service-icon"><image :src="item.icon" mode="aspectFit" /></view>
            <view class="service-info">
              <text>{{item.label}}</text>
              <text>{{getDesc(item.key)}}</text>
            </view>
          </view>
          <view class="service-actions">
            <button hover-class="none" :disabled="index === 0" @tap="moveUp(index)">↑</button>
            <button hover-class="none" :disabled="index === services.length - 1" @tap="moveDown(index)">↓</button>
            <switch color="#ee6a3f" :checked="item.enabled" :data-index="index" @change="toggleService" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import commonServices from '../../utils/common-services.js'
import i18n from '../../utils/i18n.js'
import auth from '../../utils/auth.js'

const pageText = {
  'zh-Hans': {
    title: '常用服务管理',
    save: '保存',
    desc: '调整“我的”页面常用服务卡片里的入口顺序，也可以隐藏不常用入口。当前布局会跟随账号保存。',
    preview: '当前预览',
    reset: '恢复默认',
    sort: '服务排序',
    selected: '已选 {count}/{max}，至少 {min} 项',
    saved: '布局已保存',
    resetDone: '已恢复默认',
    keepMin: '至少保留 {min} 个常用服务',
    maxLimit: '最多只能展示 {max} 个常用服务',
    loadingFail: '获取布局失败，已显示本地缓存',
    saveFail: '保存失败，请重试',
    descs: {
      member: '会员权益、会员订单与专属服务',
      address: '管理收货地址和默认地址',
      cart: '查看已选商品并继续结算',
      wallet: '余额、账单、充值和提现',
      support: '联系食刻客服获取帮助',
      message: '管理订单、优惠和服务提醒',
      coupons: '查看可用优惠券和使用记录',
      reviews: '查看待评价和已评价订单',
      orders: '查看全部订单与订单进度'
    }
  },
  en: {
    title: 'Common services',
    save: 'Save',
    desc: 'Adjust the order and visibility of services on the Profile page. The layout is saved with your account.',
    preview: 'Preview',
    reset: 'Reset',
    sort: 'Sort services',
    selected: '{count}/{max} selected, min {min}',
    saved: 'Saved',
    resetDone: 'Reset done',
    keepMin: 'Keep at least {min} services',
    maxLimit: 'Show up to {max} services',
    loadingFail: 'Failed to load. Local cache is shown.',
    saveFail: 'Save failed',
    descs: {
      member: 'Membership benefits and orders',
      address: 'Manage delivery addresses',
      cart: 'View cart and checkout',
      wallet: 'Balance, bills, top-up and withdrawal',
      support: 'Contact support',
      message: 'Manage notices',
      coupons: 'View coupons and history',
      reviews: 'View pending and submitted reviews',
      orders: 'View orders and progress'
    }
  },
  ja: {
    title: 'よく使うサービス',
    save: '保存',
    desc: 'マイページに表示するサービスの順番と表示状態を調整できます。設定はアカウントごとに保存されます。',
    preview: 'プレビュー',
    reset: '初期化',
    sort: '並び替え',
    selected: '{count}/{max} 選択中、最低 {min}',
    saved: '保存しました',
    resetDone: '初期状態に戻しました',
    keepMin: '最低 {min} 件のサービスを残してください',
    maxLimit: '最大 {max} 件まで表示できます',
    loadingFail: '取得に失敗しました。キャッシュを表示しています。',
    saveFail: '保存に失敗しました',
    descs: {
      member: '会員特典と注文',
      address: '配送先住所を管理',
      cart: 'カートと決済',
      wallet: '残高、明細、チャージ、出金',
      support: 'サポートへ連絡',
      message: '通知を管理',
      coupons: 'クーポンと利用履歴',
      reviews: '未評価と評価済み注文',
      orders: '注文と進行状況'
    }
  },
  'zh-Hant': {
    title: '常用服務管理',
    save: '保存',
    desc: '調整「我的」頁面常用服務卡片中的入口順序，也可以隱藏不常用入口。當前佈局會跟隨帳號保存。',
    preview: '目前預覽',
    reset: '恢復預設',
    sort: '服務排序',
    selected: '已選 {count}/{max}，至少 {min} 項',
    saved: '佈局已保存',
    resetDone: '已恢復預設',
    keepMin: '至少保留 {min} 個常用服務',
    maxLimit: '最多只能展示 {max} 個常用服務',
    loadingFail: '取得佈局失敗，已顯示本機快取',
    saveFail: '保存失敗，請重試',
    descs: {
      member: '會員權益、會員訂單與專屬服務',
      address: '管理收貨地址和預設地址',
      cart: '查看已選商品並繼續結算',
      wallet: '餘額、帳單、儲值和提現',
      support: '聯絡食刻客服取得協助',
      message: '管理訂單、優惠和服務提醒',
      coupons: '查看可用優惠券和使用記錄',
      reviews: '查看待評價和已評價訂單',
      orders: '查看全部訂單與訂單進度'
    }
  }
}

function getText() {
  const locale = i18n.getLocale()
  return pageText[locale] || pageText['zh-Hans']
}

function format(template, values) {
  return Object.keys(values).reduce((text, key) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), values[key]), template)
}

const pageConfig = {
  data: {
    statusHeight: 20,
    text: getText(),
    services: commonServices.getConfig()
  },
  computed: {
    visibleServices() {
      return this.services.filter(item => item.enabled).slice(0, commonServices.MAX_VISIBLE)
    },
    visibleCount() {
      return this.services.filter(item => item.enabled).length
    },
    limitTip() {
      return format(this.text.selected, {
        count: this.visibleCount,
        max: commonServices.MAX_VISIBLE,
        min: commonServices.MIN_VISIBLE
      })
    }
  },
  onLoad() {
    this.setData({ statusHeight: getApp().globalData.statusBarHeight })
  },
  onShow() {
    if (!auth.requireLogin('/pages/service-manager/service-manager')) return
    this.setData({ text: getText(), services: commonServices.getConfig() })
    commonServices.fetchConfig().then(services => {
      this.setData({ services })
    }).catch(err => {
      console.error('fetch common services failed', err)
      uni.showToast({ title: this.text.loadingFail, icon: 'none' })
    })
  },
  back() {
    uni.navigateBack()
  },
  getDesc(key) {
    return (this.text.descs && this.text.descs[key]) || ''
  },
  updateLocal(services) {
    const next = commonServices.saveConfig(services)
    this.setData({ services: next })
  },
  moveUp(index) {
    if (index <= 0) return
    const list = this.services.slice()
    ;[list[index - 1], list[index]] = [list[index], list[index - 1]]
    this.updateLocal(list)
  },
  moveDown(index) {
    if (index >= this.services.length - 1) return
    const list = this.services.slice()
    ;[list[index], list[index + 1]] = [list[index + 1], list[index]]
    this.updateLocal(list)
  },
  toggleService(e) {
    const index = Number(e.currentTarget.dataset.index)
    const checked = !!e.detail.value
    const list = this.services.slice()
    const enabledCount = list.filter(item => item.enabled).length

    if (!checked && enabledCount <= commonServices.MIN_VISIBLE) {
      uni.showToast({
        title: format(this.text.keepMin, { min: commonServices.MIN_VISIBLE }),
        icon: 'none'
      })
      this.setData({ services: commonServices.getConfig() })
      return
    }
    if (checked && enabledCount >= commonServices.MAX_VISIBLE) {
      uni.showToast({
        title: format(this.text.maxLimit, { max: commonServices.MAX_VISIBLE }),
        icon: 'none'
      })
      this.setData({ services: commonServices.getConfig() })
      return
    }

    list[index] = { ...list[index], enabled: checked }
    this.updateLocal(list)
  },
  reset() {
    const next = commonServices.resetConfig()
    this.setData({ services: next })
    uni.showToast({ title: this.text.resetDone, icon: 'none' })
  },
  async save() {
    try {
      uni.showLoading({ title: this.text.save, mask: true })
      const services = await commonServices.saveRemoteConfig(this.services)
      this.setData({ services })
      uni.showToast({ title: this.text.saved, icon: 'success' })
    } catch (err) {
      console.error('save common services failed', err)
      uni.showToast({ title: this.text.saveFail, icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.page{min-height:100vh;background:#f5f5f7;padding-bottom:50rpx}
.content{padding:22rpx 24rpx 48rpx}
.nav-row{position:relative}
.nav-center{position:absolute;left:150rpx;right:150rpx;top:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.nav-title{position:static!important;left:auto!important;top:auto!important;transform:none!important;line-height:1}
.nav-save-inline{position:absolute;right:42rpx;top:50%;transform:translateY(-50%);z-index:2;pointer-events:auto;min-width:92rpx;width:auto;height:48rpx;margin:0;border-radius:999rpx;background:var(--orange);color:#fff;font-size:23rpx;font-weight:600;display:flex;align-items:center;justify-content:center;padding:0 18rpx;box-shadow:0 8rpx 18rpx rgba(238,106,63,.22)}
.nav-placeholder{visibility:hidden}
.intro-desc{display:block;padding:4rpx 12rpx 22rpx;font-size:25rpx;line-height:1.65;color:#8f8f95}
.preview-card,.list-card{padding:24rpx 22rpx;margin-bottom:20rpx}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:20rpx;width:100%;margin-bottom:22rpx}
.section-head>text:first-child{font-size:30rpx;font-weight:600;color:#111}
.reset-btn{flex:0 0 auto;margin:0 0 0 auto!important;width:auto!important;padding:0 22rpx;height:48rpx;border-radius:999rpx;background:#fff3ed;color:var(--orange);font-size:23rpx}
.section-tip{font-size:22rpx!important;font-weight:400!important;color:#999!important}
.preview-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18rpx 10rpx}
.preview-item{min-height:112rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10rpx;background:transparent!important;border-radius:0}
.preview-icon,.service-icon{width:58rpx;height:58rpx;border-radius:18rpx;background:#f4f4f6;display:flex;align-items:center;justify-content:center}
.preview-icon image,.service-icon image{width:34rpx;height:34rpx}
.preview-item text{font-size:24rpx;color:#333}
.service-row{position:relative;display:flex;align-items:center;justify-content:space-between;gap:18rpx;padding:24rpx 0}
.service-row:not(:last-child)::after{content:'';position:absolute;left:76rpx;right:0;bottom:0;height:1rpx;background:#eeeeef}
.service-main{display:flex;align-items:center;gap:18rpx;min-width:0;flex:1}
.service-info{display:flex;flex-direction:column;gap:7rpx;min-width:0}
.service-info text:first-child{font-size:29rpx;font-weight:550;color:#111}
.service-info text:last-child{font-size:22rpx;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:310rpx}
.service-actions{display:flex;align-items:center;gap:10rpx;flex-shrink:0}
.service-actions button{width:48rpx;height:42rpx;border-radius:999rpx;background:#f6f6f7;color:#555;font-size:24rpx;display:flex;align-items:center;justify-content:center}
.service-actions button[disabled]{opacity:.28}
.service-actions switch{transform:scale(.78);transform-origin:right center}
</style>
