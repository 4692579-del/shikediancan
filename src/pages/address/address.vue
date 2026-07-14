<template>
<view :style="globalThemeStyle" class="page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">{{selectMode ? '选择收货地址' : '地址管理'}}</text>
      <view class="nav-back"></view>
    </view>
  </view>
  <block v-if="privacyReady">
    <view class="address-list">
      <view v-for="(item, index) in addresses" :key="item.id" class="address-swipe-row">
        <view class="address-swipe-actions">
          <button hover-class="none" class="address-edit-action" :data-id="item.id" @tap.stop="edit"><image src="/static/assets/icons/edit.svg" mode="aspectFit" /><text>修改</text></button>
          <button hover-class="none" class="address-delete-action" :data-id="item.id" @tap.stop="remove"><image src="/static/assets/icons/delete.svg" mode="aspectFit" /><text>删除</text></button>
        </view>
        <button hover-class="none" :class="`address-card card address-track ${swipedId === item.id ? 'swiped' : ''}`" :data-id="item.id" @tap="select" @touchstart="swipeStart" @touchend="swipeEnd">
          <view :class="`tag ${item.tag === '学校' ? 'school' : ''}`">{{item.tag}}</view>
          <view class="address-copy"><text class="detail">{{item.fullDetail || item.detail}}</text><text class="person">{{item.name}} {{item.gender}}　{{item.phone}}</text><text v-if="item.isDefault" class="default">默认地址</text></view>
        </button>
      </view>
      <view v-if="!addresses.length" class="empty"><view class="empty-icon"><image src="/static/assets/icons/location.svg" mode="aspectFit" /></view><view class="empty-title">还没有收货地址</view><view class="empty-desc">添加地址，让美食准确送到你手中</view></view>
    </view>
    <button hover-class="none" class="primary-btn add-bottom" @tap="add">＋ 新增收货地址</button>
    <view v-if="editing" class="mask" @tap="close">
      <view class="form-sheet" @tap.stop="noop">
        <view class="handle"></view>
        <text class="form-title">{{form.id ? '编辑地址' : '新增地址'}}</text>
        <view class="form-row"><text>联系人</text><input maxlength="20" placeholder="姓名" :value="form.name" data-field="name" @input="field" /></view>
        <view class="gender-row"><text>称呼</text><view class="gender-options"><button hover-class="none" :class="form.gender === '先生' ? 'on' : ''" data-field="gender" data-value="先生" @tap="choice">先生</button><button hover-class="none" :class="form.gender === '女士' ? 'on' : ''" data-field="gender" data-value="女士" @tap="choice">女士</button><view class="gender-placeholder"></view></view></view>
        <view class="form-row"><text>手机号</text><input type="number" maxlength="11" placeholder="收货人手机号" :value="form.phone" data-field="phone" @input="field" /></view>
        <picker class="region-picker" mode="multiSelector" :range="regionColumns" :value="regionIndexes" @columnchange="regionColumnChange" @change="regionChange">
          <view class="form-row region-row"><text>省市区</text><view :class="form.region.length ? 'region-value' : 'region-placeholder'">{{form.region.length ? form.regionText : '请选择省、市、区'}}<text>›</text></view></view>
        </picker>
        <view class="form-row detail-row"><text>详细地址</text><textarea placeholder="楼栋、门牌号等" :value="form.detail" data-field="detail" @input="field"></textarea></view>
        <view class="tag-row"><text>标签</text><button v-for="(item, index) in tags" :key="item" hover-class="none" :class="form.tag === item ? 'on' : ''" data-field="tag" :data-value="item" @tap="choice">{{item}}</button></view>
        <view class="default-row"><text>设为默认地址</text><button hover-class="none" class="switch-tap" @tap.stop="toggleDefault"><view :class="`switch ${form.isDefault ? 'on' : ''}`"><view></view></view></button></view>
        <button hover-class="none" class="primary-btn" @tap="save">保存地址</button>
      </view>
    </view>
  </block>
  <view v-else-if="privacyChecked" class="privacy-gate">
    <view class="privacy-gate-card">
      <text class="privacy-gate-title">地址信息使用说明</text>
      <text class="privacy-gate-desc">为完成收货地址管理、订单确认和配送信息展示，我们需要收集并在本机存储你主动填写的联系人姓名、手机号码、省市区及详细地址。上述信息仅用于本应用的模拟点餐流程，不会上传至服务器或用于其他用途。</text>
      <view class="privacy-gate-links"><text>请阅读并同意</text><button hover-class="none" data-type="user" @tap="openAgreement">《用户服务协议》</button><text>和</text><button hover-class="none" data-type="privacy" @tap="openAgreement">《隐私政策》</button></view>
      <button v-if="platformPrivacyRequired" hover-class="none" class="primary-btn privacy-agree">同意并继续</button>
      <button v-else hover-class="none" class="primary-btn privacy-agree" @tap="agreePrivacy">同意并继续</button>
      <button hover-class="none" class="privacy-decline" @tap="declinePrivacy">暂不同意</button>
    </view>
  </view>
</view>
</template>
<script>
import adaptPage from '@/utils/page-adapter.js'
// 地址管理页：负责地址新增、编辑、默认地址约束、左滑操作和下单地址选择。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import cloud from '../../utils/cloud.js'
import { areaList } from '@vant/area-data'
// 列表展示时将默认地址置顶，但不改变用户手动选择的地址。
function defaultFirst(addresses = []) {
  return [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

// 使用完整的省、市、区数据，并按行政区编码建立级联关系，避免省市区随意组合。
const areaEntries = {
  provinces: Object.entries(areaList.province_list),
  cities: Object.entries(areaList.city_list),
  counties: Object.entries(areaList.county_list)
}
function cityEntries(provinceCode) {
  return areaEntries.cities.filter(([code]) => code.slice(0, 2) === provinceCode.slice(0, 2))
}
function countyEntries(cityCode) {
  return areaEntries.counties.filter(([code]) => code.slice(0, 4) === cityCode.slice(0, 4))
}
function regionColumnsFor(provinceIndex = 0, cityIndex = 0) {
  const province = areaEntries.provinces[provinceIndex] || areaEntries.provinces[0]
  const cities = cityEntries(province[0])
  const city = cities[cityIndex] || cities[0]
  const counties = city ? countyEntries(city[0]) : []
  return [
    areaEntries.provinces.map(([, name]) => name),
    cities.map(([, name]) => name),
    counties.map(([, name]) => name)
  ]
}
function regionCodesFor(provinceIndex = 0, cityIndex = 0, countyIndex = 0) {
  const province = areaEntries.provinces[provinceIndex] || areaEntries.provinces[0]
  const cities = cityEntries(province[0])
  const city = cities[cityIndex] || cities[0]
  const counties = city ? countyEntries(city[0]) : []
  return [province && province[0], city && city[0], counties[countyIndex] && counties[countyIndex][0]]
}

const pageConfig = {
  data: {
    statusHeight: 20,
    addresses: [],
    selectMode: false,
    editing: false,
    privacyReady: false,
    privacyChecked: false,
    platformPrivacyRequired: false,
    swipedId: 0,
    tags: ['家', '公司', '学校'],
    form: { name: '', phone: '', gender: '先生', region: [], regionText: '', detail: '', tag: '家', isDefault: false },
    regionColumns: regionColumnsFor(),
    regionIndexes: [0, 0, 0]
  },
  onLoad(options) {
    const target = auth.buildUrl('/pages/address/address', options)
    if (!auth.guardPage(target)) return
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, selectMode: options.select === '1' })
    this.checkPrivacyAuthorization()
  },
  onShow() {
    if (this.privacyReady) this.loadAddresses()
  },
  back() { uni.navigateBack() },
  // 地址属于个人信息；未明确同意协议前不读取、不展示，也不允许新增或编辑。
  checkPrivacyAuthorization() {
    if (store.get('sk_privacy_consent_v1', false)) {
      this.enableAddressFeature()
      return
    }
    if (!uni.getPrivacySetting) {
      this.setData({ privacyChecked: true, platformPrivacyRequired: false })
      return
    }
    uni.getPrivacySetting({
      success: res => this.setData({ privacyChecked: true, platformPrivacyRequired: !!res.needAuthorization }),
      fail: () => this.setData({ privacyChecked: true, platformPrivacyRequired: false })
    })
  },
  async loadAddresses() {
    const user = store.get('sk_user', null)
    if (!user || !user.uid) {
      this.setData({ addresses: [], swipedId: 0 })
      return
    }
    try {
      const { result } = await cloud.callFunction({
        name: 'address-service',
        data: { action: 'list', userId: user.uid }
      })
      if (!result || result.code !== 0) {
        uni.showToast({ title: (result && result.message) || '地址加载失败', icon: 'none' })
        return
      }
      let addresses = result.addresses || []
      addresses = store.setAddresses(addresses)
      this.setData({ addresses: defaultFirst(addresses), swipedId: 0 })
    } catch (err) {
      console.error('load addresses failed:', cloud.normalizeError(err), err)
      this.setData({ addresses: defaultFirst(store.getAddresses()), swipedId: 0 })
      uni.showToast({ title: '地址加载失败，已显示本地缓存', icon: 'none' })
    }
  },
  enableAddressFeature() {
    store.set('sk_privacy_consent_v1', true)
    this.setData({
      privacyReady: true,
      privacyChecked: true,
      addresses: defaultFirst(store.getAddresses()),
      swipedId: 0
    })
    this.loadAddresses()
  },
  agreePrivacy() { this.enableAddressFeature() },
  privacyAuthorizationResult(e) {
    const errMsg = e.detail && e.detail.errMsg ? e.detail.errMsg : ''
    if (errMsg && !errMsg.endsWith(':ok')) {
      uni.showToast({ title: '需同意隐私政策后使用地址功能', icon: 'none' })
      return
    }
    this.enableAddressFeature()
  },
  declinePrivacy() {
    uni.showToast({ title: '未同意，无法使用地址功能', icon: 'none' })
    setTimeout(() => uni.navigateBack({ fail: () => uni.redirectTo({ url: '/pages/profile/profile' }) }), 500)
  },
  openAgreement(e) {
    const type = e.currentTarget.dataset.type === 'privacy' ? 'privacy' : 'user'
    uni.navigateTo({ url: `/pages/legal/legal?type=${type}` })
  },
  // 首次新增地址时强制默认开关为开启，但不提前弹窗。
  add() {
    this.setData({
      editing: true,
      form: {
        name: '',
        phone: '',
        gender: '先生',
        region: [],
        regionText: '',
        detail: '',
        tag: '家',
        isDefault: this.addresses.length === 0
      },
      regionColumns: regionColumnsFor(),
      regionIndexes: [0, 0, 0]
      
    })
  },
  edit(e) {
    const id = String(e.currentTarget.dataset.id)
    const form = this.addresses.find(item => String(item.id) === id)
    if (!form) return
    const region = form.region || []
    const provinceIndex = Math.max(0, areaEntries.provinces.findIndex(([, name]) => name === region[0]))
    const cities = cityEntries(areaEntries.provinces[provinceIndex][0])
    const cityIndex = Math.max(0, cities.findIndex(([, name]) => name === region[1]))
    const counties = countyEntries(cities[cityIndex] ? cities[cityIndex][0] : '')
    const countyIndex = Math.max(0, counties.findIndex(([, name]) => name === region[2]))
    const regionIndexes = [provinceIndex, cityIndex, countyIndex]
    this.setData({ editing: true, swipedId: 0, regionColumns: regionColumnsFor(provinceIndex, cityIndex), regionIndexes, form: { ...form, region, regionText: region.join(' ') } })
  },
  swipeStart(e) {
    const touch = e.changedTouches[0]
    this.touchX = touch ? touch.clientX : 0
    this.touchY = touch ? touch.clientY : 0
  },
  // 根据横向滑动方向展开或收起修改、删除操作。
  swipeEnd(e) {
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this.touchX
    const dy = touch.clientY - this.touchY
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 35) return
    this.setData({ swipedId: dx < 0 ? String(e.currentTarget.dataset.id) : 0 })
  },
  close() { this.setData({ editing: false }) },
  field(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }) },
  regionColumnChange(e) {
    const detail = e.detail || {}
    const column = Number(detail.column)
    const value = Number(detail.value)
    const indexes = [...this.regionIndexes]
    indexes[column] = value
    if (column === 0) {
      indexes[1] = 0
      indexes[2] = 0
    } else if (column === 1) {
      indexes[2] = 0
    }
    this.setData({ regionColumns: regionColumnsFor(indexes[0], indexes[1]), regionIndexes: indexes })
  },
  regionChange(e) {
    const regionIndexes = e.detail.value || [0, 0, 0]
    const region = regionIndexes.map((index, column) => this.regionColumns[column][index])
    this.setData({ regionIndexes, 'form.region': region, 'form.regionText': region.join(' ') })
  },
  choice(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.currentTarget.dataset.value }) },
  // 存在地址时禁止取消唯一默认地址。
  toggleDefault() {
    if (this.form.isDefault) {
      if (!this.addresses.length || this.form.id) {
        uni.showToast({ title: '至少存在一个默认地址', icon: 'none' })
        return
      }
    }
    this.setData({ 'form.isDefault': !this.form.isDefault })
  },
  // 校验姓名、手机号、省市区和详细地址，并维护唯一默认地址。
  async save() {
    const form = { ...this.form }
    form.name = form.name.trim()
    form.phone = form.phone.trim()
    form.detail = form.detail.trim()
    const nameValid = /^[\u4e00-\u9fa5A-Za-z·\s]{2,20}$/.test(form.name)
    const phoneValid = /^1[3-9]\d{9}$/.test(form.phone)
    if (!nameValid) return uni.showToast({ title: '请输入正确的联系人姓名', icon: 'none' })
    if (!phoneValid) return uni.showToast({ title: '请输入正确的手机号码', icon: 'none' })
    if (!form.region || form.region.length !== 3) return uni.showToast({ title: '请选择省、市、区', icon: 'none' })
    if (!form.detail) return uni.showToast({ title: '请填写详细地址', icon: 'none' })
    form.regionText = form.region.join(' ')
    form.fullDetail = `${form.regionText} ${form.detail}`
    if (!this.addresses.length) form.isDefault = true
    const user = store.get('sk_user', null)
    if (!user || !user.uid) return uni.showToast({ title: '请先登录', icon: 'none' })
    try {
      uni.showLoading({ title: '保存中' })
      const { result } = await cloud.callFunction({
        name: 'address-service',
        data: {
          action: 'save',
          userId: user.uid,
          address: form
        }
      })
      if (!result || result.code !== 0) {
        uni.showToast({ title: (result && result.message) || '地址保存失败', icon: 'none' })
        return
      }
      const addresses = store.setAddresses(result.addresses || [])
      const selectedAddress = store.get('sk_selected_address', null)
      if (selectedAddress && form.id && String(selectedAddress.id) === String(form.id)) {
        const updatedSelected = addresses.find(item => String(item.id) === String(form.id))
        store.set('sk_selected_address', updatedSelected ? { ...updatedSelected } : null)
      }
      this.setData({ addresses: defaultFirst(addresses), editing: false })
      uni.showToast({ title: '地址已保存' })
    } catch (err) {
      console.error('save address failed:', cloud.normalizeError(err), err)
      uni.showToast({ title: '地址保存失败', icon: 'none' })
    } finally {
      uni.hideLoading()
    }
  },
  // 删除默认地址前确保其他地址已被设为默认；唯一地址允许直接删除。
  remove(e) {
    const id = String(e.currentTarget.dataset.id)
    const target = this.addresses.find(item => String(item.id) === id)
    if (!target) return
    if (target.isDefault && this.addresses.length > 1) {
      uni.showModal({
        title: '请保留默认地址',
        content: '当前地址是默认地址。请先将其他地址设置为默认地址，再删除该地址。',
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    uni.showModal({ title: '删除地址', content: '确定删除这个收货地址吗？', success: async res => {
      if (!res.confirm) return
      const user = store.get('sk_user', null)
      if (!user || !user.uid) return uni.showToast({ title: '请先登录', icon: 'none' })
      try {
        uni.showLoading({ title: '删除中' })
        const { result } = await cloud.callFunction({
          name: 'address-service',
          data: { action: 'remove', userId: user.uid, id }
        })
        if (!result || result.code !== 0) {
          uni.showToast({ title: (result && result.message) || '地址删除失败', icon: 'none' })
          return
        }
        const addresses = store.setAddresses(result.addresses || [])
        const selectedAddress = store.get('sk_selected_address', null)
        if (selectedAddress && String(selectedAddress.id) === id) store.set('sk_selected_address', null)
        this.setData({ addresses: defaultFirst(addresses), swipedId: 0 })
      } catch (err) {
        console.error('remove address failed:', cloud.normalizeError(err), err)
        uni.showToast({ title: '地址删除失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }})
  },
  // 选择地址只更新当前收货选择，不擅自修改默认地址。
  select(e) {
    if (this.swipedId) {
      this.setData({ swipedId: 0 })
      return
    }
    if (!this.selectMode) return
    const id = String(e.currentTarget.dataset.id)
    const address = this.addresses.find(item => String(item.id) === id)
    if (!address) return
    store.set('sk_selected_address', { ...address })
    uni.navigateBack()
  },
  noop() {}
}

export default adaptPage(pageConfig)
</script>

<style>
.address-list{padding:20rpx 24rpx 170rpx}.address-card{width:100%;padding:25rpx;display:flex;align-items:flex-start;text-align:left;margin-bottom:18rpx}.tag{background:var(--orange-soft);color:var(--orange);border-radius:10rpx;padding:6rpx 10rpx;font-size:19rpx;margin-right:15rpx;margin-top:3rpx}.tag.school{background:#eaf3ff;color:#4384d8}.address-copy{flex:1}.detail,.person,.default{display:block}.detail{font-size:29rpx;font-weight:750}.person{color:#888;font-size:22rpx;margin-top:10rpx}.default{color:var(--orange);font-size:19rpx;margin-top:9rpx}.address-actions{display:flex}.address-actions button{padding:8rpx 12rpx;color:#888;font-size:31rpx}.add-bottom{position:fixed;left:28rpx;right:28rpx;bottom:calc(25rpx + env(safe-area-inset-bottom))}.mask{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.35);display:flex;align-items:flex-end}.form-sheet{width:100%;background:#fff;border-radius:40rpx 40rpx 0 0;padding:17rpx 30rpx calc(30rpx + env(safe-area-inset-bottom))}.handle{width:72rpx;height:8rpx;background:#ddd;border-radius:4rpx;margin:0 auto 22rpx}.form-title{display:block;font-size:34rpx;font-weight:750;margin-bottom:20rpx}.form-row{height:90rpx;border-bottom:1rpx solid #eee;display:flex;align-items:center}.form-row>text,.tag-row>text,.gender-row>text{width:145rpx;color:#666}.form-row input{flex:1}.detail-row{height:125rpx;align-items:flex-start;padding-top:25rpx}.detail-row textarea{height:90rpx;flex:1}.gender-row{min-height:82rpx;border-bottom:1rpx solid #eee;display:flex;align-items:center}.gender-options{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12rpx}.gender-options button,.tag-row button{height:52rpx;background:#f4f4f6;border-radius:15rpx;display:flex;align-items:center;justify-content:center;font-size:21rpx}.gender-options button.on,.tag-row button.on{background:var(--orange-soft);color:var(--orange)}.tag-row{height:85rpx;display:flex;align-items:center;gap:12rpx}.default-row{width:100%;height:78rpx;display:flex;align-items:center;justify-content:space-between}.switch{width:88rpx;height:48rpx;border-radius:24rpx;background:#ddd;padding:5rpx}.switch view{width:38rpx;height:38rpx;background:#fff;border-radius:50%;transition:.2s}.switch.on{background:var(--orange)}.switch.on view{transform:translateX(40rpx)}

.tag{flex-shrink:0}.address-copy{min-width:0}.detail{font-size:27rpx;line-height:1.4;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.person{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.address-actions{flex-shrink:0;margin-left:6rpx}.address-actions button{width:52rpx;height:52rpx;padding:0;display:flex;align-items:center;justify-content:center}
.form-sheet{max-height:88vh;overflow-y:auto}.form-row>text,.tag-row>text,.gender-row>text{width:130rpx;flex-shrink:0}
.tag-row{gap:9rpx}.tag-row button{padding:10rpx 17rpx}
.address-card{width:100%!important;max-width:none!important}.address-actions button{width:52rpx!important;flex:0 0 52rpx}.add-bottom{width:auto!important}
.switch{width:84rpx;height:46rpx;flex:0 0 84rpx;border-radius:23rpx;padding:5rpx;overflow:hidden;display:flex;align-items:center;justify-content:flex-start}
.switch view{width:36rpx;height:36rpx;box-shadow:0 2rpx 6rpx rgba(0,0,0,.16);transition:transform .2s ease}
.switch.on{justify-content:flex-end}.switch.on view{transform:none}
.address-actions image{width:27rpx;height:27rpx}
.empty-icon image{width:104rpx;height:104rpx}

/* Match gender controls to the three-column tag option layout. */
.gender-options{
  flex:1;
  min-width:0;
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  align-items:center;
  gap:9rpx;
}
.gender-options button{
  width:100%!important;
  min-width:0!important;
  max-width:none!important;
  height:52rpx;
  padding:0!important;
  border-radius:15rpx;
  background:#f4f4f6;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:21rpx;
}
.gender-options button.on{background:var(--orange-soft);color:var(--orange)}
.gender-placeholder{height:52rpx}

/* Give the default-address control its own comfortable, left-aligned row. */
.default-row{
  width:auto!important;
  min-width:0!important;
  height:92rpx;
  margin:20rpx 0 14rpx;
  padding:0;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:20rpx;
  text-align:left;
}
.default-row>text{
  flex:0 0 auto;
  font-size:25rpx;
  font-weight:650;
}
.default-row .switch{
  margin:0;
}
.form-sheet>.primary-btn{
  margin-top:10rpx;
}
.region-picker{display:block;width:100%}
.region-row{width:100%}
.region-value,.region-placeholder{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:12rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.region-value{color:#222}
.region-placeholder{color:#aaa}
.region-value>text,.region-placeholder>text{flex-shrink:0;color:#aaa;font-size:34rpx}

/* Swipe actions for address cards. */
.address-swipe-row{position:relative;overflow:hidden;margin-bottom:18rpx;border-radius:32rpx}
.address-track{position:relative;z-index:2;margin-bottom:0;background:#fff;transform:translateX(0);transition:transform .26s cubic-bezier(.22,.61,.36,1)}
.address-track.swiped{transform:translateX(-180rpx)}
.address-swipe-actions{position:absolute;z-index:1;top:0;right:0;bottom:0;width:176rpx;display:flex;align-items:center;justify-content:center;gap:16rpx;background:transparent}
.address-swipe-actions button{width:72rpx!important;min-width:72rpx!important;max-width:72rpx!important;height:72rpx;flex:0 0 72rpx;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3rpx;color:#fff;font-size:17rpx;box-shadow:0 8rpx 18rpx rgba(28,28,32,.14)}
.address-swipe-actions image{width:25rpx;height:25rpx;filter:brightness(0) invert(1)}
.address-edit-action{background:var(--theme-gradient)}
.address-delete-action{background:linear-gradient(145deg,#ff6b58,#ed493b)}

/* Keep this page opaque during card swipes so the previous page never bleeds through. */
.page{
  min-height:100vh;
  background:#f5f5f7;
  isolation:isolate;
}
.address-swipe-row{
  background:#f5f5f7;
  touch-action:pan-y;
}
.address-track{
  transform:translate3d(0,0,0);
  backface-visibility:hidden;
}
.address-track.swiped{transform:translate3d(-180rpx,0,0)}

/* 地址隐私授权门：同意前不渲染任何已存地址或编辑表单。 */
.privacy-gate{min-height:calc(100vh - 150rpx);padding:100rpx 32rpx 40rpx;display:flex;align-items:flex-start;justify-content:center}
.privacy-gate-card{width:100%;padding:42rpx 34rpx 30rpx;border-radius:36rpx;background:#fff;box-shadow:0 18rpx 55rpx rgba(31,31,35,.08)}
.privacy-gate-title{display:block;color:#1c1c1e;font-size:34rpx;font-weight:750;text-align:center}
.privacy-gate-desc{display:block;margin-top:24rpx;color:#666;font-size:24rpx;line-height:1.8;text-align:justify}
.privacy-gate-links{
  min-height:56rpx;
  margin:24rpx 0 28rpx;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-wrap:nowrap;
  gap:4rpx;
  color:#8e8e93;
  white-space:nowrap;
}
.privacy-gate-links text{
  flex:0 0 auto;
  font-size:21rpx;
  line-height:56rpx;
}
.privacy-gate-links button{
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  height:56rpx!important;
  min-height:56rpx!important;
  padding:0!important;
  margin:0!important;
  flex:0 0 auto!important;
  display:flex;
  align-items:center;
  justify-content:center;
  color:var(--orange);
  font-size:21rpx;
  font-weight:600;
  line-height:56rpx!important;
}
.privacy-agree{width:100%!important}
.privacy-decline{width:100%!important;height:70rpx;margin-top:10rpx;color:#999;font-size:22rpx}

/* 三个地址标签等分占满整行，保持横向长条且不换行。 */
.tag-row{gap:10rpx}
.tag-row>text{width:130rpx!important;flex:0 0 130rpx}
.tag-row button{
  flex:1!important;
  width:auto!important;
  min-width:0!important;
  max-width:none!important;
  height:52rpx;
  padding:0!important;
  white-space:nowrap;
}

/* 地址卡片信息更紧凑：标签统一尺寸，“家”和“公司”视觉大小一致。 */
.address-list .address-card{
  min-height:136rpx!important;
  padding:24rpx 25rpx!important;
  align-items:flex-start!important;
}
.address-list .tag{
  width:50rpx!important;
  min-width:50rpx!important;
  max-width:50rpx!important;
  height:50rpx!important;
  padding:0!important;
  margin:2rpx 17rpx 0 0!important;
  border-radius:13rpx!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  box-sizing:border-box!important;
  font-size:19rpx!important;
  line-height:1!important;
  text-align:center!important;
  white-space:nowrap!important;
}
.address-list .address-copy{
  padding-top:0!important;
}
.address-list .detail{
  font-size:27rpx!important;
  line-height:34rpx!important;
  margin:0!important;
  -webkit-line-clamp:1!important;
}
.address-list .person{
  margin-top:8rpx!important;
  font-size:21rpx!important;
  line-height:27rpx!important;
}
.address-list .default{
  margin-top:8rpx!important;
  font-size:18rpx!important;
  line-height:24rpx!important;
}

/* 地址左滑修改/删除按钮：缩小图标和文字间距，保持圆形按钮精致感。 */
.address-swipe-actions button{
  gap:0!important;
  line-height:1!important;
}
.address-swipe-actions image{
  width:23rpx!important;
  height:23rpx!important;
  margin:0 0 1rpx!important;
}
.address-swipe-actions text{
  margin-top:0!important;
  font-size:16rpx!important;
  line-height:18rpx!important;
  white-space:nowrap!important;
}

/* 默认地址行不再作为整行按钮：去掉灰底，只让右侧滑块按钮可点。 */
.form-sheet .default-row{
  background:transparent!important;
  background-color:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
.form-sheet .default-row::after{
  display:none!important;
}
.form-sheet .switch-tap{
  width:84rpx!important;
  min-width:84rpx!important;
  max-width:84rpx!important;
  height:46rpx!important;
  padding:0!important;
  margin:0!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  background:transparent!important;
  background-color:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.form-sheet .switch-tap::after{
  display:none!important;
  border:0!important;
  background:transparent!important;
}

</style>
