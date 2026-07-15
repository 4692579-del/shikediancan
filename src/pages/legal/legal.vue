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
      <text class="legal-updated">更新日期：2026年7月15日</text>
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

// 用户服务协议与隐私政策正文页：根据 type 参数展示对应条款。
// 文案按当前项目真实状态编写：本项目使用 uniCloud 保存账号、地址、订单等数据，但支付仍为课程设计模拟流程。

const USER_SECTIONS = [
  {
    title: '服务说明',
    content: '“食刻点餐”是一个用于课程设计与学习展示的点餐类应用，主要提供用户注册登录、店铺与商品浏览、购物车、收货地址、订单确认、模拟支付、订单管理、商品评价、收藏、优惠券、会员、食刻钱包、主题与辅助功能等服务。本项目目前不提供真实外卖配送、真实商家经营后台、真实资金结算或真实第三方支付扣款能力。'
  },
  {
    title: '账号注册与使用',
    content: '用户可通过自定义用户名和密码注册账号。用户名用于登录识别，昵称用于应用内展示。你应妥善保管账号和密码，不得使用他人账号，不得利用头像、昵称、地址、评价等功能发布违法违规、侵权、欺诈、骚扰、低俗或其他不适宜内容。因用户自行填写信息不准确导致的地址展示、订单信息错误等问题，由用户自行承担相应后果。'
  },
  {
    title: '点餐、购物车与订单',
    content: '用户可以浏览店铺、分类和商品信息，选择规格后加入购物车，并在确认订单页选择收货地址、餐具数量、优惠券等信息后提交订单。购物车、订单状态、评价状态等会通过前端页面与 uniCloud 云端数据共同完成记录和展示。订单流程用于模拟真实点餐体验，页面中展示的配送进度、预计送达、商家制作等状态均为项目内业务模拟。'
  },
  {
    title: '支付、钱包与会员',
    content: '应用内的微信支付、支付宝支付、食刻钱包支付、会员开通、钱包充值、提现、优惠减免等均为课程设计中的模拟支付流程，不会向微信、支付宝、银行卡或其他真实金融账户发起扣款、充值或提现。食刻钱包余额、账单、支付密码、会员订单等信息仅用于本项目内的模拟业务展示。'
  },
  {
    title: '评价、收藏与个性化功能',
    content: '用户可对已完成订单进行评价，也可收藏商品、修改头像、修改昵称、切换主题、调整语言、开启长辈模式或调整字体大小。相关功能用于提升项目完整度与用户体验。用户应保证评价内容真实、文明，不得发布违法违规或侵犯他人权益的内容。'
  },
  {
    title: '服务调整与数据变更',
    content: '由于本项目仍处于开发、课程展示和功能迭代阶段，页面设计、功能入口、数据结构和模拟业务规则可能会调整。项目开发者可根据测试、课程要求或合规需要对功能进行修改、暂停或删除。'
  },
  {
    title: '免责声明',
    content: '本项目为课程设计作品，不构成真实商业点餐平台。项目中展示的商品、价格、优惠、会员权益、钱包余额和订单状态仅用于演示，不代表真实交易承诺。用户不应将本项目用于真实交易、资金结算或商业经营。'
  },
  {
    title: '联系我们',
    content: '如对本协议、隐私政策或项目功能有疑问，可通过应用内“我的—联系客服”等入口所示方式联系项目开发者。'
  }
]

const PRIVACY_SECTIONS = [
  {
    title: '我们收集的信息',
    content: '为提供本项目功能，我们会根据你的主动操作收集或生成以下信息：账号用户名、登录密码的加密/校验信息、昵称、头像、收货联系人姓名、称呼、手机号码、省市区、详细地址、地址标签、默认地址设置、购物车商品、收藏商品、订单信息、评价内容、优惠券、会员状态、会员订单、食刻钱包余额、钱包账单、支付密码校验信息、主题、语言、字体大小、长辈模式和通知开关等偏好设置。'
  },
  {
    title: '信息使用目的',
    content: '上述信息用于完成账号登录、个人资料展示、地址管理、购物车保存、订单确认、订单状态展示、模拟支付、食刻钱包模拟收支、会员权益展示、优惠券使用、商品收藏、评价记录、主题与辅助功能设置等项目内功能。我们不会将这些信息用于与本项目无关的广告营销、用户画像或商业转售。'
  },
  {
    title: '信息存储方式',
    content: '本项目已接入 uniCloud 云服务。账号、地址、购物车、订单、收藏、优惠券、会员、钱包、评价、店铺、分类和商品等相关数据会按功能需要存储在 uniCloud 云数据库或通过云函数处理。部分界面状态和用户偏好也可能保存在本机本地缓存中，以便提升页面加载速度和使用体验。'
  },
  {
    title: '头像、昵称与内容安全',
    content: '用户可自定义头像和昵称。为维护应用内容安全，用户不得上传或设置违法违规、侵权、暴力、色情、辱骂、诈骗、诱导或其他不适宜内容。项目可根据课程测试与合规需要接入内容安全检测或人工处理机制；如发现违规内容，可提示用户修改、拒绝保存或清除相关内容。'
  },
  {
    title: '地址与联系方式',
    content: '收货地址信息由用户主动填写，用于地址管理、订单确认和模拟配送信息展示。地址数据可能包括联系人姓名、称呼、手机号码、省市区、详细地址、标签和默认地址状态。未取得你的同意前，地址功能不会主动新增地址；你可以在地址管理页面修改或删除已保存地址。'
  },
  {
    title: '支付密码与账号安全',
    content: '登录密码和食刻钱包支付密码用于账号登录和钱包模拟支付、提现等安全校验。项目不应以明文展示你的密码。请勿向他人泄露密码。微信支付和支付宝支付在本项目中为模拟流程，不会调用真实第三方支付密码或真实支付接口。'
  },
  {
    title: '信息共享与对外提供',
    content: '除完成 uniCloud 云端存储、云函数调用和应用功能展示所必需的处理外，本项目不会主动向真实商家、骑手、广告平台或其他第三方出售、出租或共享你的个人信息。本项目中的商家、配送、支付和会员权益均为模拟展示。'
  },
  {
    title: '用户管理权利',
    content: '你可以在应用内修改头像、昵称、地址、主题、语言、字体、长辈模式、通知开关等信息，也可以删除地址、购物车商品、收藏商品、订单记录或评价相关记录。退出登录后，当前设备上的登录态会清除，但云端账号及其相关业务数据不会因退出登录自动删除。'
  },
  {
    title: '本地缓存',
    content: '为提升页面响应速度，应用可能在本地缓存登录态、用户偏好、页面临时状态或部分业务数据。你可以在设置页清除缓存。清除缓存可能影响本机展示状态，但不一定删除已存储在云端的账号、订单、地址等业务数据。'
  },
  {
    title: '未成年人保护',
    content: '未成年人应在监护人指导下使用本应用，不建议填写与模拟点餐无关的真实敏感信息。监护人如发现未成年人填写了不适当信息，可联系项目开发者协助处理。'
  },
  {
    title: '政策更新与联系',
    content: '随着项目功能迭代，本隐私政策可能会更新。更新后将在本页面展示新的更新时间。如需咨询、修改或删除相关信息，可通过应用内“我的—联系客服”等入口所示方式联系项目开发者。'
  }
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
