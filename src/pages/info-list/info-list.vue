<template>
<view :style="globalThemeStyle" class="list-page">
  <view class="safe-nav" :style="`--status-height:${statusHeight}px`">
    <view class="nav-row">
      <button hover-class="none" class="nav-back page-back" @tap="back">
        <image src="/static/assets/icons/back.svg" mode="aspectFit" />
      </button>
      <text class="nav-title">{{title}}</text>
      <view class="nav-back"></view>
    </view>
  </view>
  <scroll-view class="list-scroll" scroll-y show-scrollbar="false">
    <view class="list-card">
      <text class="updated">{{updatedText}}</text>
      <view v-for="(section, index) in sections" :key="index" class="section">
        <text class="section-title">{{index + 1}}. {{section.title}}</text>
        <text class="section-content">{{section.content}}</text>
      </view>
    </view>
  </scroll-view>
</view>
</template>

<script>
import adaptPage from '@/utils/page-adapter.js'
import profileTheme from '../../utils/profile-theme.js'
import store from '../../utils/store.js'
import i18n from '../../utils/i18n.js'

const INFO_TEXT = {
  'zh-Hans': {
    updated: '更新日期：2026年7月16日',
    personal: {
      title: '个人信息收集清单',
      sections: [
        { title: '账号与身份信息', content: '收集内容：用户名、昵称、头像、登录密码相关校验信息。使用目的：用于账号注册、登录认证、个人中心展示、账号切换及资料维护。登录密码仅用于身份校验，前端不展示明文密码；头像由用户主动选择上传。' },
        { title: '收货地址信息', content: '收集内容：联系人姓名、手机号码、省市区、详细地址、地址标签、默认地址状态。使用目的：用于地址管理、订单确认、配送信息展示及下单流程。用户可在地址管理页面新增、修改或删除地址。' },
        { title: '点餐与交易流程信息', content: '收集内容：购物车商品、商品规格、数量、订单商品、订单金额、优惠金额、订单状态、下单时间、支付方式、模拟支付状态、餐具数量、订单备注等。使用目的：用于购物车结算、订单确认、订单列表、订单详情、支付状态模拟和售后展示。' },
        { title: '食刻钱包与会员信息', content: '收集内容：食刻钱包开通状态、余额、账单记录、提现记录、支付密码校验信息、会员等级、会员订单、会员权益、优惠券领取与使用记录。使用目的：用于钱包充值、提现、钱包支付、会员开通、会员权益展示及优惠计算。' },
        { title: '收藏与评价信息', content: '收集内容：收藏商品记录、订单评价星级、评价标签、评价文字、匿名评价状态、评价时间。使用目的：用于我的收藏、我的评价、订单评价记录展示及订单评价状态判断。' },
        { title: '应用偏好与本地状态', content: '收集内容：语言设置、字体大小、长辈模式、主题颜色、消息通知开关、搜索历史、当前登录状态及本设备曾登录账号列表。使用目的：用于提升使用体验、恢复用户偏好、支持账号切换和页面个性化展示。部分偏好会保存在本地缓存中。' },
        { title: '存储与删除方式', content: '上述信息主要通过 uniCloud 云数据库、云函数及本地缓存实现保存和读取。用户可通过页面中的删除、清除、退出登录、关闭钱包等功能管理相关信息；部分业务记录会随账号保存在云端。' }
      ]
    },
    third: {
      title: '第三方信息数据共享清单',
      sections: [
        { title: 'uniCloud 云服务', content: '共享对象：DCloud uniCloud 及当前项目所绑定的云服务空间。共享内容：账号资料、地址、购物车、订单、评价、收藏、钱包、会员、优惠券及应用偏好等项目运行所需数据。共享目的：用于云函数处理、云数据库存储、跨设备读取和后端化业务实现。' },
        { title: '云存储与头像处理', content: '共享对象：项目绑定的云服务空间。共享内容：用户主动选择上传的头像图片或头像数据。共享目的：用于保存用户头像并在个人中心、账号切换等页面展示。' },
        { title: '系统相册、相机与剪贴板能力', content: '涉及对象：用户设备系统能力。涉及内容：用户主动选择的头像图片、复制用户名时写入剪贴板的用户名。使用目的：用于更换头像和复制用户名。上述能力由用户主动触发，本项目不会在未授权或未操作时读取相册、相机或剪贴板内容。' },
        { title: '支付相关说明', content: '本项目中的微信支付、支付宝支付为课程设计中的前端模拟流程，不接入真实微信支付、支付宝支付接口，不向微信或支付宝提交真实支付订单、银行卡信息或真实支付密码。食刻钱包支付密码仅用于本项目内的钱包支付与提现校验。' },
        { title: '不会共享的情形', content: '本项目不会将用户个人信息主动共享给广告平台、画像平台、营销数据平台或无关第三方。除完成登录、点餐、订单、钱包、会员、地址、评价等项目功能所必需的云服务处理外，不会用于与本项目无关的用途。' },
        { title: '用户管理方式', content: '用户可在应用内查看、修改或删除地址、收藏、订单、评价、钱包账单等相关记录；如关闭钱包或退出登录，应用会按功能设计停止展示或清理对应本地状态。' }
      ]
    }
  },
  en: {
    updated: 'Updated: July 16, 2026',
    personal: {
      title: 'Personal Information Collection List',
      sections: [
        { title: 'Account and identity information', content: 'Collected: username, nickname, avatar and login password verification information. Purpose: account registration, login authentication, profile display, account switching and profile maintenance. Passwords are used only for verification and are not displayed in plain text; avatars are uploaded only after user selection.' },
        { title: 'Delivery address information', content: 'Collected: contact name, phone number, region, detailed address, address label and default-address status. Purpose: address management, order confirmation, delivery information display and ordering flow. Users may add, edit or delete addresses.' },
        { title: 'Ordering and transaction flow information', content: 'Collected: cart items, product specifications, quantity, order items, order amount, discounts, order status, order time, payment method, simulated payment status, tableware quantity and remarks. Purpose: cart checkout, order confirmation, order list, order detail, payment simulation and after-sales display.' },
        { title: 'Shike Wallet and membership information', content: 'Collected: wallet activation status, balance, bills, withdrawal records, payment password verification information, membership level, member orders, benefits, coupon receiving and usage records. Purpose: wallet top-up, withdrawal, wallet payment, membership, benefits display and discount calculation.' },
        { title: 'Favorites and reviews', content: 'Collected: favorite product records, order review rating, tags, review text, anonymous-review status and review time. Purpose: favorites, reviews, review history display and order review status judgment.' },
        { title: 'App preferences and local state', content: 'Collected: language, font size, senior mode, theme color, notification switches, search history, current login state and accounts logged in on this device. Purpose: improve experience, restore preferences, support account switching and personalized display. Some preferences may be cached locally.' },
        { title: 'Storage and deletion', content: 'The above information is mainly stored and read through uniCloud database, cloud functions and local cache. Users can manage related information through delete, clear cache, logout and wallet-closing functions; some business records are stored in the cloud with the account.' }
      ]
    },
    third: {
      title: 'Third-party Data Sharing List',
      sections: [
        { title: 'uniCloud service', content: 'Recipient: DCloud uniCloud and the cloud space bound to this project. Data: account profile, addresses, carts, orders, reviews, favorites, wallet, membership, coupons and app preferences. Purpose: cloud function processing, cloud database storage, cross-device reading and backend features.' },
        { title: 'Cloud storage and avatar processing', content: 'Recipient: the bound cloud space. Data: avatar images or avatar data actively selected by users. Purpose: store avatars and display them in profile and account-switching pages.' },
        { title: 'System album, camera and clipboard', content: 'Involved capability: device system features. Data: avatar image selected by the user and username written to clipboard when copying. Purpose: changing avatar and copying username. These are triggered by user action only.' },
        { title: 'Payment notice', content: 'WeChat Pay and Alipay in this project are front-end simulated flows for course design. The project does not connect real WeChat Pay or Alipay APIs and does not submit real payment orders, bank card information or real payment passwords. Shike Wallet payment password is used only for in-project wallet payment and withdrawal verification.' },
        { title: 'No unrelated sharing', content: 'This project does not actively share personal information with ad platforms, profiling platforms, marketing data platforms or unrelated third parties. Data is used only for required project functions.' },
        { title: 'User controls', content: 'Users may view, modify or delete addresses, favorites, orders, reviews and wallet bills in the app. When closing wallet or logging out, the app clears or stops displaying related local states according to feature rules.' }
      ]
    }
  },
  ja: {
    updated: '更新日：2026年7月16日',
    personal: {
      title: '個人情報収集リスト',
      sections: [
        { title: 'アカウントと本人情報', content: '収集内容：ユーザー名、ニックネーム、アイコン、ログインパスワード検証情報。利用目的：登録、ログイン認証、プロフィール表示、アカウント切替、資料管理。パスワードは検証のみに使用され、平文表示されません。アイコンはユーザーが選択した場合のみアップロードされます。' },
        { title: '配送先住所情報', content: '収集内容：連絡先氏名、電話番号、地域、詳細住所、住所ラベル、既定住所状態。利用目的：住所管理、注文確認、配送情報表示、注文フロー。ユーザーは住所を追加、編集、削除できます。' },
        { title: '注文と取引フロー情報', content: '収集内容：カート商品、商品規格、数量、注文商品、注文金額、割引額、注文状態、注文時間、支払い方法、模擬支払い状態、食器数、注文メモなど。利用目的：カート精算、注文確認、注文一覧、注文詳細、支払い状態の模擬表示、アフターサービス表示。' },
        { title: '食刻ウォレットと会員情報', content: '収集内容：ウォレット開通状態、残高、明細、出金記録、支払いパスワード検証情報、会員レベル、会員注文、会員特典、クーポン受取・使用記録。利用目的：チャージ、出金、ウォレット決済、会員開通、特典表示、割引計算。' },
        { title: 'お気に入りと評価情報', content: '収集内容：お気に入り商品、注文評価の星数、タグ、評価文、匿名評価状態、評価時間。利用目的：お気に入り、評価一覧、評価記録表示、注文評価状態の判断。' },
        { title: 'アプリ設定とローカル状態', content: '収集内容：言語、文字サイズ、シニアモード、テーマ色、通知スイッチ、検索履歴、現在のログイン状態、この端末でログインしたアカウント一覧。利用目的：体験向上、設定復元、アカウント切替、個人化表示。一部は端末内に保存されます。' },
        { title: '保存と削除', content: '上記情報は主に uniCloud データベース、クラウド関数、ローカルキャッシュで保存・読み取りされます。削除、キャッシュ削除、ログアウト、ウォレット閉鎖などにより関連情報を管理できます。一部の業務記録はアカウントに紐づきクラウドに保存されます。' }
      ]
    },
    third: {
      title: '第三者情報共有リスト',
      sections: [
        { title: 'uniCloud クラウドサービス', content: '共有先：DCloud uniCloud および本プロジェクトに紐づくクラウドスペース。共有内容：アカウント資料、住所、カート、注文、評価、お気に入り、ウォレット、会員、クーポン、アプリ設定など。目的：クラウド関数処理、データベース保存、複数端末での読み取り、バックエンド機能実現。' },
        { title: 'クラウドストレージとアイコン処理', content: '共有先：紐づくクラウドスペース。共有内容：ユーザーが選択したアイコン画像または画像データ。目的：アイコン保存およびプロフィール、アカウント切替ページでの表示。' },
        { title: '端末のアルバム、カメラ、クリップボード', content: '対象：端末システム機能。内容：ユーザーが選択したアイコン画像、ユーザー名コピー時にクリップボードへ書き込むユーザー名。目的：アイコン変更とユーザー名コピー。これらはユーザー操作によってのみ実行されます。' },
        { title: '支払い関連説明', content: '本プロジェクトの微信支付と支付宝支付は授業設計のフロントエンド模擬フローであり、実際の決済APIには接続しません。実注文、銀行カード情報、実支払いパスワードを送信しません。食刻ウォレット支払いパスワードはプロジェクト内の決済・出金確認にのみ使用されます。' },
        { title: '共有しない場合', content: '本プロジェクトは広告、プロファイリング、マーケティングデータ、無関係な第三者へ個人情報を能動的に共有しません。必要なプロジェクト機能の範囲内でのみ使用します。' },
        { title: 'ユーザー管理方法', content: 'ユーザーはアプリ内で住所、お気に入り、注文、評価、ウォレット明細を確認、変更、削除できます。ウォレット閉鎖またはログアウト時、機能設計に従って関連するローカル状態を停止または削除します。' }
      ]
    }
  },
  'zh-Hant': {
    updated: '更新日期：2026年7月16日',
    personal: {
      title: '個人資訊收集清單',
      sections: [
        { title: '帳號與身分資訊', content: '收集內容：使用者名稱、暱稱、頭像、登入密碼相關校驗資訊。使用目的：用於帳號註冊、登入認證、個人中心展示、帳號切換及資料維護。登入密碼僅用於身分校驗，前端不展示明文密碼；頭像由使用者主動選擇上傳。' },
        { title: '收貨地址資訊', content: '收集內容：聯絡人姓名、手機號碼、省市區、詳細地址、地址標籤、預設地址狀態。使用目的：用於地址管理、訂單確認、配送資訊展示及下單流程。使用者可在地址管理頁面新增、修改或刪除地址。' },
        { title: '點餐與交易流程資訊', content: '收集內容：購物車商品、商品規格、數量、訂單商品、訂單金額、優惠金額、訂單狀態、下單時間、支付方式、模擬支付狀態、餐具數量、訂單備註等。使用目的：用於購物車結算、訂單確認、訂單列表、訂單詳情、支付狀態模擬和售後展示。' },
        { title: '食刻錢包與會員資訊', content: '收集內容：食刻錢包開通狀態、餘額、帳單記錄、提現記錄、支付密碼校驗資訊、會員等級、會員訂單、會員權益、優惠券領取與使用記錄。使用目的：用於錢包充值、提現、錢包支付、會員開通、會員權益展示及優惠計算。' },
        { title: '收藏與評價資訊', content: '收集內容：收藏商品記錄、訂單評價星級、評價標籤、評價文字、匿名評價狀態、評價時間。使用目的：用於我的收藏、我的評價、訂單評價記錄展示及訂單評價狀態判斷。' },
        { title: '應用偏好與本地狀態', content: '收集內容：語言設定、字體大小、長輩模式、主題顏色、訊息通知開關、搜尋歷史、目前登入狀態及本設備曾登入帳號列表。使用目的：用於提升使用體驗、恢復使用者偏好、支援帳號切換和頁面個人化展示。部分偏好會保存在本地快取中。' },
        { title: '儲存與刪除方式', content: '上述資訊主要透過 uniCloud 雲資料庫、雲函數及本地快取實現保存和讀取。使用者可透過頁面中的刪除、清除、登出、關閉錢包等功能管理相關資訊；部分業務記錄會隨帳號保存在雲端。' }
      ]
    },
    third: {
      title: '第三方資訊資料共享清單',
      sections: [
        { title: 'uniCloud 雲服務', content: '共享對象：DCloud uniCloud 及目前項目所綁定的雲服務空間。共享內容：帳號資料、地址、購物車、訂單、評價、收藏、錢包、會員、優惠券及應用偏好等項目運行所需資料。共享目的：用於雲函數處理、雲資料庫儲存、跨設備讀取和後端化業務實現。' },
        { title: '雲儲存與頭像處理', content: '共享對象：項目綁定的雲服務空間。共享內容：使用者主動選擇上傳的頭像圖片或頭像資料。共享目的：用於保存使用者頭像並在個人中心、帳號切換等頁面展示。' },
        { title: '系統相簿、相機與剪貼簿能力', content: '涉及對象：使用者設備系統能力。涉及內容：使用者主動選擇的頭像圖片、複製使用者名稱時寫入剪貼簿的使用者名稱。使用目的：用於更換頭像和複製使用者名稱。上述能力由使用者主動觸發，本項目不會在未授權或未操作時讀取相簿、相機或剪貼簿內容。' },
        { title: '支付相關說明', content: '本項目中的微信支付、支付寶支付為課程設計中的前端模擬流程，不接入真實微信支付、支付寶支付接口，不向微信或支付寶提交真實支付訂單、銀行卡資訊或真實支付密碼。食刻錢包支付密碼僅用於本項目內的錢包支付與提現校驗。' },
        { title: '不會共享的情形', content: '本項目不會將使用者個人資訊主動共享給廣告平台、畫像平台、行銷資料平台或無關第三方。除完成登入、點餐、訂單、錢包、會員、地址、評價等項目功能所必需的雲服務處理外，不會用於與本項目無關的用途。' },
        { title: '使用者管理方式', content: '使用者可在應用內查看、修改或刪除地址、收藏、訂單、評價、錢包帳單等相關記錄；如關閉錢包或登出，應用會按功能設計停止展示或清理對應本地狀態。' }
      ]
    }
  }
}

function resolveInfoContent(type, locale = i18n.getLocale()) {
  const pack = INFO_TEXT[locale] || INFO_TEXT['zh-Hans']
  return type === 'third' ? pack.third : pack.personal
}

const pageConfig = {
  data: {
    statusHeight: 20,
    type: 'personal',
    title: '个人信息收集清单',
    updatedText: INFO_TEXT['zh-Hans'].updated,
    sections: INFO_TEXT['zh-Hans'].personal.sections
  },
  onLoad(options = {}) {
    const type = options.type === 'third' ? 'third' : 'personal'
    this.setData({
      statusHeight: getApp().globalData.statusBarHeight,
      type,
      globalThemeStyle: profileTheme.getGlobalStyle(store.get('sk_profile_theme', 'black'))
    })
    this.refreshText()
  },
  onShow() {
    this.refreshText()
  },
  refreshText() {
    const locale = i18n.getLocale()
    const pack = INFO_TEXT[locale] || INFO_TEXT['zh-Hans']
    const content = resolveInfoContent(this.type, locale)
    this.setData({ title: content.title, updatedText: pack.updated, sections: content.sections })
  },
  back() {
    uni.navigateBack()
  }
}

export default adaptPage(pageConfig)
</script>

<style>
.list-page{height:100vh;background:#f5f5f7;color:#111;display:flex;flex-direction:column}
.list-scroll{flex:1;min-height:0}
.list-card{margin:20rpx 24rpx 54rpx;padding:34rpx 30rpx 46rpx;border-radius:32rpx;background:#fff;box-shadow:0 12rpx 36rpx rgba(0,0,0,.05)}
.updated{display:block;margin-bottom:22rpx;color:#8b8b90;font-size:22rpx}
.section{margin-top:30rpx}
.section-title{display:block;margin-bottom:12rpx;color:#111;font-size:29rpx;font-weight:700}
.section-content{display:block;color:#333;font-size:25rpx;line-height:1.85;text-align:justify}
</style>
