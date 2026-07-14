<template>
<view :style="globalThemeStyle" class="page theme-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`"><view class="nav-row"><button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button><text class="nav-title">更改主题</text><view class="nav-back"></view></view></view>
  <scroll-view scroll-y :show-scrollbar="false" class="theme-scroll">
    <view class="theme-content">
      <text class="preview-label">效果预览</text>
      <view :class="`theme-preview ${selectedTheme.tone === 'light' ? 'light-theme' : ''} ${selectedTheme.watermark ? 'limited-theme' : ''}`" :style="`background:${selectedTheme.color}`">
        <text v-if="selectedTheme.watermark" class="theme-v-watermark">V</text>
        <view class="preview-user"><view class="preview-avatar"><image :src="user.avatar || '/static/assets/icons/user.svg'" :mode="user ? 'aspectFill' : 'aspectFit'" /></view><view><text>{{user.nickname || '食刻用户'}}</text><text>{{user.phone || user.username || '登录后享受更多服务'}}</text></view><text>›</text></view>
        <view class="preview-stats"><view><text>3</text><text>优惠券</text></view><view><text>0</text><text>收藏</text></view><view><text>128</text><text>积分</text></view></view>
      </view>

      <view class="theme-heading"><text>选择颜色</text><text>固定主题色均经过白色文字适配</text></view>
      <view class="theme-grid">
        <button v-for="(item, index) in themes" :key="item.id" hover-class="none" :class="`theme-option ${selectedId === item.id ? 'selected' : ''} ${item.limited || item.membershipLimited ? 'limited-option' : ''}`" :data-id="item.id" @tap="selectTheme">
          <view :class="`theme-color ${item.watermark ? 'watermark-swatch' : ''}`" :style="`background:${item.color}`"><text v-if="item.watermark">V</text><image v-if="selectedId === item.id" src="/static/assets/icons/check.svg" mode="aspectFit" /></view>
          <view class="theme-copy"><view><text>{{item.name}}</text><text v-if="item.limited" class="limited-badge">食刻限定</text><text v-if="item.membershipLimited" class="limited-badge plus-limited-badge plus-only-badge">PLUS专属</text></view><text>{{item.desc}}</text></view>
        </button>
      </view>
      <view class="theme-heading global-heading"><text>全局主题</text><text>该颜色将应用于全局主题</text></view>
      <view class="theme-grid global-theme-grid">
        <button v-for="(item, index) in globalThemes" :key="item.id" hover-class="none" :class="`theme-option global-theme-option ${selectedId === item.id ? 'selected' : ''}`" :data-id="item.id" @tap="selectTheme">
          <view class="theme-color watermark-swatch" :style="`background:${item.color}`"><text>V</text><image v-if="selectedId === item.id" src="/static/assets/icons/check.svg" mode="aspectFit" /></view>
          <view class="theme-copy"><view><text>{{item.name}}</text><text :class="`limited-badge plus-limited-badge ${item.requiredTier === 'pro' ? 'pro-only-badge' : 'plus-only-badge'}`">{{item.requiredTier === 'pro' ? 'PRO专属' : 'PLUS专属'}}</text></view><text>{{item.desc}}</text></view>
        </button>
      </view>
      <view class="theme-safe"></view>
    </view>
  </scroll-view>
  <button hover-class="none" class="primary-btn theme-save" @tap="save">保存主题</button>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 主题设置页：预览并保存资料卡或会员限定全局主题。

import store from '../../utils/store.js'
import auth from '../../utils/auth.js'
import profileTheme from '../../utils/profile-theme.js'
import account from '../../utils/account.js'
import wallet from '../../utils/wallet.js'
import membership from '../../utils/membership.js'
const pageConfig = {
  data: {
    statusHeight: 20,
    themes: profileTheme.themes.filter(item => !item.globalTheme),
    globalThemes: profileTheme.themes.filter(item => item.globalTheme),
    selectedId: 'black',
    selectedTheme: profileTheme.getTheme('black'),
    user: null,
    walletOpened: false,
    membershipActive: false
  },
  // 加载当前主题、会员等级和钱包状态用于权限判断。
  onLoad() {
    if (!auth.guardPage('/pages/profile-theme/profile-theme')) return
    let selectedId = store.get('sk_profile_theme', 'black')
    let selectedTheme = profileTheme.getTheme(selectedId)
    if (selectedTheme.membershipLimited && !membership.hasTier(selectedTheme.requiredTier || 'plus')) {
      selectedId = 'black'
      selectedTheme = profileTheme.getTheme('black')
    }
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      selectedId,
      selectedTheme,
      globalThemeStyle: profileTheme.getGlobalStyle(selectedId),
      user: store.get('sk_user', null),
      walletOpened: wallet.isOpened(),
      membershipActive: membership.isActive()
    })
  },
  back() { uni.navigateBack() },
  // 选择限定主题时检查 PLUS/PRO 资格，不满足则引导开通。
  selectTheme(e) {
    const selectedId = e.currentTarget.dataset.id
    const selectedTheme = profileTheme.getTheme(selectedId)
    if (selectedTheme.limited && !wallet.isOpened()) {
      uni.showModal({
        title: '食刻钱包限定主题',
        content: '该主题仅限已开通食刻钱包的用户使用，开通后即可解锁浅金与银灰限定主题。',
        confirmText: '去开通',
        cancelText: '暂不开通',
        success: res => {
          if (res.confirm) uni.navigateTo({ url: '/pages/wallet/wallet' })
        }
      })
      return
    }
    if (selectedTheme.membershipLimited && !membership.hasTier(selectedTheme.requiredTier || 'plus')) {
      const proOnly = selectedTheme.requiredTier === 'pro'
      uni.showModal({
        title: proOnly ? '食刻 PRO 专属主题' : '食刻 PLUS 专属主题',
        content: proOnly ? '该主题仅限食刻 PRO 会员使用，PLUS 会员可补款升级后解锁。' : '该主题仅限已开通食刻 PLUS 或 PRO 的用户使用。',
        confirmText: proOnly && membership.hasTier('plus') ? '去升级' : '去开通',
        cancelText: '暂不开通',
        success: res => {
          if (res.confirm) uni.navigateTo({ url: '/pages/plus/plus' })
        }
      })
      return
    }
    this.setData({
      selectedId,
      selectedTheme,
      globalThemeStyle: profileTheme.getGlobalStyle(selectedId)
    })
  },
  // 把主题写入当前账号，并立即更新全局主题状态。
  save() {
    if (this.selectedTheme.limited && !wallet.isOpened()) {
      return uni.showToast({ title: '请先开通食刻钱包', icon: 'none' })
    }
    if (this.selectedTheme.membershipLimited && !membership.hasTier(this.selectedTheme.requiredTier || 'plus')) {
      return uni.showToast({ title: this.selectedTheme.requiredTier === 'pro' ? '该主题为 PRO 专属' : '请先开通食刻 PLUS', icon: 'none' })
    }
    account.saveTheme(this.selectedId)
    this.setData({ globalThemeStyle: profileTheme.getGlobalStyle(this.selectedId) })
    uni.showToast({ title: '主题已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 450)
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.theme-page{height:100vh;min-height:0;padding-bottom:0;overflow:hidden;display:flex;flex-direction:column;background:#f5f5f7}
.theme-scroll{flex:1;min-height:0;height:0}
.theme-content{padding:20rpx 24rpx}
.preview-label{display:block;margin:2rpx 5rpx 14rpx;color:#999;font-size:21rpx}
.theme-preview{position:relative;min-height:320rpx;overflow:hidden;padding:32rpx 26rpx;border-radius:38rpx;color:#fff;box-shadow:0 18rpx 42rpx rgba(30,30,38,.18);transition:background .2s ease}.theme-preview>view{position:relative;z-index:2}
.preview-user{display:flex;align-items:center}.preview-avatar{width:92rpx;height:92rpx;flex:0 0 92rpx;overflow:hidden;border:4rpx solid rgba(255,255,255,.6);border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center}
.preview-avatar image{width:100%;height:100%}.preview-user>view:nth-child(2){flex:1;min-width:0;padding-left:18rpx}.preview-user>view:nth-child(2) text{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.preview-user>view:nth-child(2) text:first-child{font-size:32rpx;font-weight:800}.preview-user>view:nth-child(2) text:last-child{margin-top:8rpx;color:rgba(255,255,255,.68);font-size:20rpx}.preview-user>text{font-size:40rpx;color:rgba(255,255,255,.55)}
.preview-stats{display:grid;grid-template-columns:repeat(3,1fr);margin-top:42rpx}.preview-stats view{position:relative;display:flex;flex-direction:column;align-items:center}.preview-stats view:not(:last-child)::after{content:"";position:absolute;right:0;top:7rpx;bottom:7rpx;width:2rpx;background:rgba(255,255,255,.25)}.preview-stats text:first-child{font-size:31rpx;font-weight:800}.preview-stats text:last-child{margin-top:8rpx;color:rgba(255,255,255,.72);font-size:19rpx}
.theme-heading{margin:32rpx 5rpx 18rpx}.theme-heading text{display:block}.theme-heading text:first-child{font-size:29rpx;font-weight:800}.theme-heading text:last-child{margin-top:6rpx;color:#999;font-size:19rpx}
.theme-grid{display:grid;grid-template-columns:1fr 1fr;gap:16rpx}.theme-option{width:100%!important;max-width:none!important;min-width:0!important;height:104rpx;padding:12rpx 18rpx;border:2rpx solid transparent;border-radius:999rpx;background:#fff;display:flex;align-items:center;text-align:left;box-shadow:0 7rpx 22rpx rgba(34,34,45,.05)}.theme-option.selected{border-color:var(--theme-border);background:#fffaf7}.theme-color{width:70rpx;height:70rpx;flex:0 0 70rpx;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2rpx rgba(255,255,255,.14)}.theme-color image{width:27rpx;height:27rpx;filter:brightness(0) invert(1)}.theme-copy{min-width:0;padding-left:14rpx}.theme-copy text{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.theme-copy text:first-child{font-size:23rpx;font-weight:700}.theme-copy text:last-child{margin-top:6rpx;color:#999;font-size:17rpx}
.theme-v-watermark{position:absolute;z-index:1;right:-45rpx;bottom:-150rpx;color:rgba(255,255,255,.18);font-family:Georgia,"Times New Roman",serif;font-size:390rpx;font-weight:700;font-style:italic;line-height:1;transform:rotate(-8deg);pointer-events:none}
.theme-preview.light-theme{color:#352f25}.theme-preview.light-theme .preview-user>view:nth-child(2) text:last-child,.theme-preview.light-theme .preview-user>text,.theme-preview.light-theme .preview-stats text:last-child{color:rgba(45,42,38,.62)}.theme-preview.light-theme .preview-stats view:not(:last-child)::after{background:rgba(45,42,38,.2)}.theme-preview.light-theme .preview-avatar{border-color:rgba(255,255,255,.68);background:rgba(255,255,255,.28)}.theme-preview.light-theme .theme-v-watermark{color:rgba(255,255,255,.27);text-shadow:0 1rpx 0 rgba(70,60,45,.08)}
.limited-option{position:relative;border-color:rgba(190,151,83,.24);background:linear-gradient(145deg,#fff,#fbfaf7)}.limited-option.selected{border-color:#b99a60;background:#fffaf0}.theme-color.watermark-swatch{position:relative;overflow:hidden}.theme-color.watermark-swatch>text{position:absolute;right:-8rpx;bottom:-19rpx;color:rgba(255,255,255,.32);font-family:Georgia,serif;font-size:76rpx;font-weight:800;font-style:italic;line-height:1}.theme-color.watermark-swatch image{position:relative;z-index:2}.theme-copy>view{display:flex;align-items:center;gap:6rpx;min-width:0}.theme-copy>view>text:first-child{min-width:0;font-size:22rpx;font-weight:700;overflow:hidden;text-overflow:ellipsis}.limited-badge{flex-shrink:0!important;padding:3rpx 7rpx;border:1rpx solid rgba(151,112,52,.32);border-radius:999rpx;background:linear-gradient(135deg,#fff2c9,#d6b36b);color:#63491f;font-size:12rpx!important;font-weight:750!important;letter-spacing:0}
.plus-limited-badge{color:#fff}
/* 会员标识采用薄长条胶囊，避免标识宽度压过主题名称。 */
.limited-badge{height:22rpx!important;padding:0 7rpx!important;display:inline-flex;align-items:center;justify-content:center;line-height:1;white-space:nowrap;font-size:11rpx!important}
.plus-only-badge{
  border-color:rgba(125,136,148,.34);
  background:linear-gradient(135deg,#f7f9fb 0%,#cfd5dc 45%,#929ca8 100%);
  color:#3d4650;
  box-shadow:inset 0 1rpx 0 rgba(255,255,255,.82),0 2rpx 6rpx rgba(45,55,66,.12);
}
.pro-only-badge{
  border-color:rgba(102,77,46,.32);
  background:linear-gradient(135deg,#2d2825,#b48249);
  color:#fff4df;
}
.global-heading{margin-top:38rpx;padding-top:28rpx;border-top:1rpx solid #e4e4e8}
.global-theme-option{border-color:rgba(127,107,78,.18);background:linear-gradient(145deg,#fff,#faf9f6)}
.global-theme-option.selected{border-color:var(--theme-border);background:var(--orange-soft)}
.theme-safe{height:150rpx}.theme-save{position:fixed;z-index:20;left:28rpx;right:28rpx;bottom:calc(24rpx + env(safe-area-inset-bottom));width:auto!important}

</style>
