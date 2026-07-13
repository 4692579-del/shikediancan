<template>
<view :style="globalThemeStyle" class="legal-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back"><image src="/static/assets/icons/back.svg" mode="aspectFit" /></button>
      <text class="nav-title">{{title}}</text>
      <view class="nav-back"></view>
    </view>
  </view>
  <scroll-view class="legal-scroll" scroll-y show-scrollbar="false">
    <view class="legal-content">
      <text class="legal-updated">更新日期：2026年6月28日</text>
      <block v-for="(item, index) in sections" :key="item.title">
        <text class="legal-heading">{{index + 1}}. {{item.title}}</text>
        <text class="legal-paragraph">{{item.content}}</text>
      </block>
    </view>
  </scroll-view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
// 用户协议与隐私政策正文页：根据 type 参数展示对应的完整条款。

const USER_SECTIONS = [
  { title: '服务说明', content: '“食刻”是模拟设计性质的移动应用，使用前端本地数据模拟菜品浏览、购物车、订单、会员及支付等流程。应用不提供真实外卖配送、真实资金支付或商家后台服务。' },
  { title: '账号与使用规范', content: '用户应以合法、正当方式使用本应用，不得利用头像、昵称、地址备注等功能制作、存储或展示违法违规、侵权、欺诈、暴力、色情或其他不适宜内容。' },
  { title: '订单与支付', content: '项目内订单、支付密码、钱包充值、提现及优惠均为前端模拟，相关金额不构成真实交易，不会从第三方平台、支付宝或银行卡扣款。' },
  { title: '本地数据', content: '购物车、地址、订单和个人偏好主要保存在当前设备的移动应用本地缓存中。卸载应用、清理第三方平台数据或更换设备可能导致数据丢失。' },
  { title: '服务调整', content: '因课程展示、功能优化或合规要求，本项目可能调整页面和功能。调整不会改变其前端模拟项目的性质。' },
  { title: '联系我们', content: '如对本协议或项目功能有疑问，可通过应用“我的—联系客服”所示渠道联系项目开发者。' }
]

const PRIVACY_SECTIONS = [
  { title: '我们处理的信息', content: '当你使用登录和地址管理功能时，我们会处理你主动填写的昵称、手机号码、联系人姓名、称呼、省市区、详细收货地址和地址标签；还会处理你在应用内产生的购物车、收藏、订单、会员、钱包及主题偏好等本地业务数据。' },
  { title: '处理目的和用途', content: '上述信息仅用于在本机完成账号展示、收货地址管理、订单确认、模拟配送信息展示以及恢复你的操作状态，不用于广告营销、用户画像或与本项目无关的用途。' },
  { title: '处理方式与存储', content: '当前项目未使用第三方平台云开发、云数据库或独立后端服务器。相关信息由前端本地数据驱动，并存储在当前设备的移动应用本地缓存中，不会由本项目上传至远程服务器。' },
  { title: '头像与内容安全', content: '头像和昵称功能仅提供随应用发布并经过开发者确认的固定安全素材，不读取相册，不接收或发布用户自行上传的图片或任意文本。相关资料仅在本机个人页面展示，不向其他用户公开。' },
  { title: '权限与最小必要原则', content: '地址由用户主动输入，本项目不会读取通讯录，也不会获取精确定位。未取得你的明确同意前，地址页面不会读取、展示或新增联系人和收货地址信息。' },
  { title: '信息管理', content: '你可以在地址管理中修改或删除地址，在设置中选择系统昵称和系统头像。你也可以通过第三方平台删除应用或清理应用数据，以删除保存在当前设备上的本地信息。' },
  { title: '信息共享与对外提供', content: '由于本项目没有远程服务端，当前不会向商家、配送人员、广告平台或其他第三方传输、共享或出售你的个人信息。' },
  { title: '未成年人保护', content: '未成年人应在监护人指导下阅读本政策并使用本应用，不应填写与模拟点餐无关的真实敏感信息。' },
  { title: '联系我们', content: '如需咨询、更正或删除相关信息，可通过应用“我的—联系客服”所示渠道联系项目开发者。' }
]

const pageConfig = {
  data: { statusHeight: 20, title: '用户服务协议', sections: USER_SECTIONS },
  onLoad(options) {
    const privacy = options.type === 'privacy'
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      title: privacy ? '隐私政策' : '用户服务协议',
      sections: privacy ? PRIVACY_SECTIONS : USER_SECTIONS
    })
  },
  back() { uni.navigateBack() }
}

export default adaptPage(pageConfig)
</script>

<style>
.legal-page{height:100vh;background:#f5f5f7;color:#111;display:flex;flex-direction:column}
.legal-scroll{flex:1;min-height:0}
.legal-content{margin:20rpx 24rpx 50rpx;padding:34rpx 30rpx 46rpx;border-radius:32rpx;background:#fff;box-shadow:0 12rpx 36rpx rgba(0,0,0,.05)}
.legal-updated{display:block;margin-bottom:26rpx;color:#777;font-size:22rpx}
.legal-heading{display:block;margin:30rpx 0 12rpx;color:#111;font-size:29rpx;font-weight:750}
.legal-paragraph{display:block;color:#333;font-size:25rpx;line-height:1.85;text-align:justify}

</style>
