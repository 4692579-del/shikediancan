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
      <text class="legal-updated">{{updatedText}}</text>
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
import i18n from '../../utils/i18n.js'

// 用户服务协议与隐私政策正文页：根据 type 参数展示对应条款。
// 文案按当前项目真实状态编写：本项目使用 uniCloud 保存账号、地址、订单等数据，但支付仍为课程设计模拟流程。

const LEGAL_TEXT = {
  'zh-Hans': {
    updated: '更新日期：2026年7月15日',
    user: {
      title: '用户服务协议',
      sections: [
        { title: '服务说明', content: '“食刻点餐”是一个用于课程设计与学习展示的点餐类应用，主要提供注册登录、店铺与商品浏览、购物车、地址、订单、模拟支付、评价、收藏、优惠券、会员、食刻钱包、主题与辅助功能等服务。本项目不提供真实外卖配送、真实商家后台、真实资金结算或真实第三方支付扣款能力。' },
        { title: '账号注册与使用', content: '用户可通过自定义用户名和密码注册账号。用户名用于登录识别，昵称用于应用内展示。你应妥善保管账号和密码，不得使用他人账号，不得利用头像、昵称、地址、评价等功能发布违法违规、侵权、欺诈、骚扰、低俗或其他不适宜内容。' },
        { title: '点餐、购物车与订单', content: '用户可以浏览店铺、分类和商品信息，选择规格后加入购物车，并在确认订单页选择收货地址、餐具数量、优惠券等信息后提交订单。购物车、订单状态、评价状态等会通过前端页面与 uniCloud 云端数据共同完成记录和展示。配送进度、预计送达、商家制作等状态均为项目内业务模拟。' },
        { title: '支付、钱包与会员', content: '应用内微信支付、支付宝支付、食刻钱包支付、会员开通、钱包充值、提现和优惠减免均为课程设计中的模拟流程，不会向微信、支付宝、银行卡或其他真实金融账户发起扣款、充值或提现。食刻钱包余额、账单、支付密码、会员订单等信息仅用于项目内模拟业务展示。' },
        { title: '评价、收藏与个性化功能', content: '用户可对已完成订单进行评价，也可收藏商品、修改头像、修改昵称、切换主题、调整语言、开启长辈模式或调整字体大小。用户应保证评价内容真实、文明，不得发布违法违规或侵犯他人权益的内容。' },
        { title: '服务调整与数据变更', content: '由于本项目仍处于开发、课程展示和功能迭代阶段，页面设计、功能入口、数据结构和模拟业务规则可能会调整。项目开发者可根据测试、课程要求或合规需要对功能进行修改、暂停或删除。' },
        { title: '免责声明', content: '本项目为课程设计作品，不构成真实商业点餐平台。项目中展示的商品、价格、优惠、会员权益、钱包余额和订单状态仅用于演示，不代表真实交易承诺。用户不应将本项目用于真实交易、资金结算或商业经营。' },
        { title: '联系我们', content: '如对本协议、隐私政策或项目功能有疑问，可通过应用内“我的—联系客服”等入口所示方式联系项目开发者。' }
      ]
    },
    privacy: {
      title: '隐私政策',
      sections: [
        { title: '我们收集的信息', content: '为提供项目功能，我们会根据你的主动操作收集或生成账号用户名、登录密码校验信息、昵称、头像、收货联系人姓名、称呼、手机号码、省市区、详细地址、地址标签、购物车、收藏、订单、评价、优惠券、会员、钱包、主题、语言、字体大小、长辈模式和通知开关等信息。' },
        { title: '信息使用目的', content: '上述信息用于账号登录、个人资料展示、地址管理、购物车保存、订单确认、订单状态展示、模拟支付、钱包模拟收支、会员权益展示、优惠券使用、商品收藏、评价记录、主题与辅助功能设置等项目内功能。' },
        { title: '信息存储方式', content: '本项目已接入 uniCloud 云服务。账号、地址、购物车、订单、收藏、优惠券、会员、钱包、评价、店铺、分类和商品等数据会按功能需要存储在 uniCloud 云数据库或通过云函数处理。部分界面状态和偏好也可能保存在本机缓存中。' },
        { title: '头像、昵称与内容安全', content: '用户可自定义头像和昵称。为维护内容安全，用户不得上传或设置违法违规、侵权、暴力、色情、辱骂、诈骗、诱导或其他不适宜内容。项目可根据课程测试与合规需要接入内容安全检测；如发现违规内容，可提示修改、拒绝保存或清除相关内容。' },
        { title: '地址与联系方式', content: '收货地址信息由用户主动填写，用于地址管理、订单确认和模拟配送信息展示。你可以在地址管理页面修改或删除已保存地址。' },
        { title: '支付密码与账号安全', content: '登录密码和食刻钱包支付密码用于账号登录和钱包模拟支付、提现等安全校验。项目不应以明文展示你的密码。微信支付和支付宝支付在本项目中为模拟流程，不会调用真实第三方支付密码或真实支付接口。' },
        { title: '信息共享与对外提供', content: '除完成 uniCloud 云端存储、云函数调用和应用功能展示所必需的处理外，本项目不会主动向真实商家、骑手、广告平台或其他第三方出售、出租或共享你的个人信息。' },
        { title: '用户管理权利', content: '你可以在应用内修改头像、昵称、地址、主题、语言、字体、长辈模式、通知开关等信息，也可以删除地址、购物车商品、收藏商品、订单记录或评价记录。退出登录会清除当前设备登录态，但不会自动删除云端账号及业务数据。' },
        { title: '本地缓存', content: '为提升页面响应速度，应用可能在本地缓存登录态、用户偏好、页面临时状态或部分业务数据。你可以在设置页清除缓存。清除缓存可能影响本机展示状态，但不一定删除云端业务数据。' },
        { title: '未成年人保护', content: '未成年人应在监护人指导下使用本应用，不建议填写与模拟点餐无关的真实敏感信息。' },
        { title: '政策更新与联系', content: '随着项目功能迭代，本隐私政策可能会更新。更新后将在本页面展示新的更新时间。如需咨询、修改或删除相关信息，可通过应用内“我的—联系客服”等入口联系项目开发者。' }
      ]
    }
  },
  en: {
    updated: 'Updated: July 15, 2026',
    user: {
      title: 'Terms of Service',
      sections: [
        { title: 'Service description', content: 'Shike Ordering is a course-design ordering application for learning and demonstration. It provides account registration, store and product browsing, cart, addresses, orders, simulated payment, reviews, favorites, coupons, membership, Shike Wallet, themes and accessibility features. It does not provide real delivery, a real merchant backend, real fund settlement or real third-party payment deduction.' },
        { title: 'Account registration and use', content: 'You may register with a custom username and password. The username is used for login, while the nickname is used for in-app display. Please keep your account and password secure and do not publish illegal, infringing, fraudulent, harassing, vulgar or otherwise inappropriate content through avatars, nicknames, addresses or reviews.' },
        { title: 'Ordering, cart and orders', content: 'You may browse stores, categories and products, select specifications, add items to the cart, and submit an order after choosing address, tableware quantity and coupons. Cart, order and review statuses are recorded and displayed through the front end and uniCloud data. Delivery progress, estimated arrival and merchant preparation statuses are simulated for this project.' },
        { title: 'Payment, wallet and membership', content: 'WeChat Pay, Alipay, Shike Wallet payment, membership purchase, wallet top-up, withdrawal and discounts in this app are simulated course-design flows. They do not deduct, top up or withdraw money from real WeChat, Alipay, bank card or other financial accounts. Wallet balance, bills, payment password and member orders are used only for in-project simulation.' },
        { title: 'Reviews, favorites and personalization', content: 'You may review completed orders, favorite products, change avatar and nickname, switch themes, change language, enable senior mode or adjust font size. Reviews should be truthful and civil and must not violate laws or others’ rights.' },
        { title: 'Service changes and data changes', content: 'As this project is still used for development, course presentation and iteration, page design, entries, data structures and simulated business rules may change. Features may be modified, suspended or removed according to testing, course or compliance needs.' },
        { title: 'Disclaimer', content: 'This project is a course-design work and is not a real commercial ordering platform. Products, prices, discounts, membership benefits, wallet balance and order statuses are for demonstration only and do not represent real transaction commitments.' },
        { title: 'Contact', content: 'If you have questions about these terms, the privacy policy or features, you may contact the developer through entries such as Me — Customer Service in the app.' }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      sections: [
        { title: 'Information we collect', content: 'Based on your actions, we may collect or generate username, password verification information, nickname, avatar, delivery contact name, title, phone number, region, detailed address, address label, cart, favorites, orders, reviews, coupons, membership, wallet, theme, language, font size, senior mode and notification settings.' },
        { title: 'Purpose of use', content: 'The information is used for login, profile display, address management, cart storage, order confirmation, order status display, simulated payment, wallet simulation, membership benefits, coupon use, favorites, reviews, themes and accessibility settings.' },
        { title: 'Storage', content: 'This project uses uniCloud. Account, address, cart, order, favorite, coupon, membership, wallet, review, store, category and product data may be stored in uniCloud databases or processed by cloud functions. Some temporary states and preferences may also be cached locally.' },
        { title: 'Avatar, nickname and content safety', content: 'You may customize your avatar and nickname. To keep content safe, do not upload or set illegal, infringing, violent, pornographic, abusive, fraudulent, misleading or inappropriate content. The project may add content safety checks when required and may ask you to modify, refuse to save or remove unsafe content.' },
        { title: 'Addresses and contact information', content: 'Delivery addresses are entered by you and used for address management, order confirmation and simulated delivery display. You may edit or delete saved addresses on the address management page.' },
        { title: 'Passwords and account security', content: 'Login password and Shike Wallet payment password are used for login, wallet simulated payment and withdrawal verification. The app should not display your password in plain text. WeChat Pay and Alipay are simulated and do not call real payment passwords or real payment APIs.' },
        { title: 'Sharing with others', content: 'Except for required uniCloud storage, cloud function processing and feature display, this project does not actively sell, rent or share your personal information with real merchants, riders, ad platforms or unrelated third parties.' },
        { title: 'Your controls', content: 'You can modify avatar, nickname, address, theme, language, font size, senior mode and notification settings, and delete addresses, cart items, favorites, orders or reviews. Logging out clears the login state on this device but does not automatically delete cloud account data.' },
        { title: 'Local cache', content: 'To improve responsiveness, the app may cache login state, preferences, temporary page states or some business data locally. You may clear cache in Settings. Clearing cache may affect local display but does not necessarily delete cloud data.' },
        { title: 'Minors', content: 'Minors should use this app under guardian guidance and should avoid entering real sensitive information unrelated to simulated ordering.' },
        { title: 'Updates and contact', content: 'This policy may be updated as features change. The updated date will be shown on this page. For questions or data requests, contact the developer through Me — Customer Service.' }
      ]
    }
  },
  ja: {
    updated: '更新日：2026年7月15日',
    user: {
      title: '利用規約',
      sections: [
        { title: 'サービス説明', content: '「食刻点餐」は授業設計と学習展示のための注文アプリです。登録・ログイン、店舗・商品閲覧、カート、住所、注文、模擬決済、評価、お気に入り、クーポン、会員、食刻ウォレット、テーマ、補助機能などを提供します。実際の配送、実店舗管理、実資金決済、実第三者決済の引き落としは行いません。' },
        { title: 'アカウント登録と利用', content: 'ユーザーは任意のユーザー名とパスワードで登録できます。ユーザー名はログイン識別に、ニックネームはアプリ内表示に使用されます。アカウントとパスワードを適切に管理し、アイコン、ニックネーム、住所、評価などで違法・権利侵害・詐欺・嫌がらせ・低俗または不適切な内容を投稿しないでください。' },
        { title: '注文、カート、注文管理', content: '店舗、カテゴリ、商品を閲覧し、規格を選択してカートに追加し、住所、食器数、クーポンなどを選んで注文できます。カート、注文状態、評価状態はフロント画面と uniCloud データにより記録・表示されます。配送進捗、到着予定、調理中などはプロジェクト内の模擬表示です。' },
        { title: '決済、ウォレット、会員', content: 'アプリ内の微信支付、支付宝支付、食刻ウォレット決済、会員開通、チャージ、出金、割引は授業設計上の模擬フローです。実際の微信、支付宝、銀行カード、金融口座から引き落とし、チャージ、出金を行いません。ウォレット残高、明細、支払いパスワード、会員注文はプロジェクト内の模擬表示にのみ使用されます。' },
        { title: '評価、お気に入り、個人設定', content: '完了した注文を評価し、商品をお気に入りに追加し、アイコン、ニックネーム、テーマ、言語、シニアモード、文字サイズを変更できます。評価は事実に基づき、礼儀ある内容にしてください。違法または他者の権利を侵害する内容は禁止します。' },
        { title: 'サービス変更とデータ変更', content: '本プロジェクトは開発、授業展示、機能改善の段階にあるため、画面設計、機能入口、データ構造、模擬業務ルールが変更される場合があります。テスト、授業要件、コンプライアンス上の必要に応じて機能を変更、停止、削除することがあります。' },
        { title: '免責事項', content: '本プロジェクトは授業設計作品であり、実際の商用注文プラットフォームではありません。商品、価格、割引、会員特典、ウォレット残高、注文状態は表示用であり、実取引の約束ではありません。' },
        { title: 'お問い合わせ', content: '本規約、プライバシーポリシー、機能について質問がある場合は、アプリ内の「マイページ—カスタマーサービス」などから開発者へ連絡できます。' }
      ]
    },
    privacy: {
      title: 'プライバシーポリシー',
      sections: [
        { title: '収集する情報', content: '機能提供のため、操作に応じてユーザー名、パスワード検証情報、ニックネーム、アイコン、配送先連絡先、敬称、電話番号、地域、詳細住所、住所ラベル、カート、お気に入り、注文、評価、クーポン、会員、ウォレット、テーマ、言語、文字サイズ、シニアモード、通知設定などを収集または生成します。' },
        { title: '利用目的', content: 'これらの情報はログイン、プロフィール表示、住所管理、カート保存、注文確認、注文状態表示、模擬決済、ウォレット模擬収支、会員特典、クーポン利用、お気に入り、評価、テーマや補助機能設定に使用されます。' },
        { title: '保存方法', content: '本プロジェクトは uniCloud を利用しています。アカウント、住所、カート、注文、お気に入り、クーポン、会員、ウォレット、評価、店舗、カテゴリ、商品などのデータは uniCloud データベースまたはクラウド関数で処理されます。一部の状態や設定は端末内に保存される場合があります。' },
        { title: 'アイコン、ニックネームと安全', content: 'ユーザーはアイコンとニックネームを設定できます。安全維持のため、違法、権利侵害、暴力、ポルノ、誹謗中傷、詐欺、誘導、不適切な内容は設定しないでください。必要に応じて内容安全チェックを導入し、修正依頼、保存拒否、削除を行うことがあります。' },
        { title: '住所と連絡先', content: '配送先住所はユーザーが入力し、住所管理、注文確認、模擬配送表示に使用されます。住所管理画面で保存済み住所を編集または削除できます。' },
        { title: 'パスワードと安全', content: 'ログインパスワードと食刻ウォレット支払いパスワードは、ログイン、ウォレット模擬決済、出金確認に使用されます。アプリはパスワードを平文表示しません。微信支付と支付宝支付は模擬フローであり、実際の支払いパスワードや決済APIは呼び出しません。' },
        { title: '外部提供', content: 'uniCloud の保存、クラウド関数処理、機能表示に必要な場合を除き、本プロジェクトは個人情報を実店舗、配達員、広告プラットフォーム、無関係な第三者へ販売、貸与、共有しません。' },
        { title: 'ユーザーの管理権', content: 'ユーザーはアイコン、ニックネーム、住所、テーマ、言語、文字サイズ、シニアモード、通知設定を変更でき、住所、カート商品、お気に入り、注文、評価を削除できます。ログアウトすると端末のログイン状態は解除されますが、クラウド上のアカウントデータは自動削除されません。' },
        { title: 'ローカルキャッシュ', content: '表示速度向上のため、ログイン状態、設定、一時状態、一部業務データを端末内に保存する場合があります。設定からキャッシュを削除できますが、クラウドデータが必ず削除されるわけではありません。' },
        { title: '未成年者保護', content: '未成年者は保護者の指導のもとで利用し、模擬注文に関係のない実際の機微情報を入力しないことを推奨します。' },
        { title: '更新と連絡', content: '機能変更に伴い本ポリシーを更新する場合があります。質問やデータ処理の相談は「マイページ—カスタマーサービス」から開発者へ連絡できます。' }
      ]
    }
  },
  'zh-Hant': {
    updated: '更新日期：2026年7月15日',
    user: {
      title: '使用者服務協議',
      sections: [
        { title: '服務說明', content: '「食刻點餐」是用於課程設計與學習展示的點餐類應用，主要提供註冊登入、店鋪與商品瀏覽、購物車、地址、訂單、模擬支付、評價、收藏、優惠券、會員、食刻錢包、主題與輔助功能等服務。本項目不提供真實外送配送、真實商家後台、真實資金結算或真實第三方支付扣款能力。' },
        { title: '帳號註冊與使用', content: '使用者可透過自訂使用者名稱和密碼註冊帳號。使用者名稱用於登入識別，暱稱用於應用內展示。你應妥善保管帳號和密碼，不得使用他人帳號，不得利用頭像、暱稱、地址、評價等功能發布違法違規、侵權、詐欺、騷擾、低俗或其他不適宜內容。' },
        { title: '點餐、購物車與訂單', content: '使用者可以瀏覽店鋪、分類和商品資訊，選擇規格後加入購物車，並在確認訂單頁選擇收貨地址、餐具數量、優惠券等資訊後提交訂單。購物車、訂單狀態、評價狀態會透過前端頁面與 uniCloud 雲端資料共同完成記錄和展示。配送進度、預計送達、商家製作等狀態均為項目內業務模擬。' },
        { title: '支付、錢包與會員', content: '應用內微信支付、支付寶支付、食刻錢包支付、會員開通、錢包充值、提現和優惠減免均為課程設計中的模擬流程，不會向微信、支付寶、銀行卡或其他真實金融帳戶發起扣款、充值或提現。食刻錢包餘額、帳單、支付密碼、會員訂單等資訊僅用於項目內模擬業務展示。' },
        { title: '評價、收藏與個人化功能', content: '使用者可對已完成訂單進行評價，也可收藏商品、修改頭像、修改暱稱、切換主題、調整語言、開啟長輩模式或調整字體大小。使用者應保證評價內容真實、文明，不得發布違法違規或侵犯他人權益的內容。' },
        { title: '服務調整與資料變更', content: '由於本項目仍處於開發、課程展示和功能迭代階段，頁面設計、功能入口、資料結構和模擬業務規則可能會調整。項目開發者可根據測試、課程要求或合規需要對功能進行修改、暫停或刪除。' },
        { title: '免責聲明', content: '本項目為課程設計作品，不構成真實商業點餐平台。項目中展示的商品、價格、優惠、會員權益、錢包餘額和訂單狀態僅用於演示，不代表真實交易承諾。' },
        { title: '聯絡我們', content: '如對本協議、隱私政策或項目功能有疑問，可透過應用內「我的—聯絡客服」等入口所示方式聯絡項目開發者。' }
      ]
    },
    privacy: {
      title: '隱私政策',
      sections: [
        { title: '我們收集的資訊', content: '為提供項目功能，我們會根據你的主動操作收集或生成帳號使用者名稱、登入密碼校驗資訊、暱稱、頭像、收貨聯絡人姓名、稱呼、手機號碼、省市區、詳細地址、地址標籤、購物車、收藏、訂單、評價、優惠券、會員、錢包、主題、語言、字體大小、長輩模式和通知開關等資訊。' },
        { title: '資訊使用目的', content: '上述資訊用於帳號登入、個人資料展示、地址管理、購物車保存、訂單確認、訂單狀態展示、模擬支付、錢包模擬收支、會員權益展示、優惠券使用、商品收藏、評價記錄、主題與輔助功能設定等項目內功能。' },
        { title: '資訊儲存方式', content: '本項目已接入 uniCloud 雲服務。帳號、地址、購物車、訂單、收藏、優惠券、會員、錢包、評價、店鋪、分類和商品等資料會按功能需要儲存在 uniCloud 雲資料庫或透過雲函數處理。部分頁面狀態和偏好也可能保存在本機快取中。' },
        { title: '頭像、暱稱與內容安全', content: '使用者可自訂頭像和暱稱。為維護內容安全，使用者不得上傳或設定違法違規、侵權、暴力、色情、辱罵、詐騙、誘導或其他不適宜內容。項目可根據課程測試與合規需要接入內容安全檢測；如發現違規內容，可提示修改、拒絕保存或清除相關內容。' },
        { title: '地址與聯絡方式', content: '收貨地址資訊由使用者主動填寫，用於地址管理、訂單確認和模擬配送資訊展示。你可以在地址管理頁面修改或刪除已保存地址。' },
        { title: '支付密碼與帳號安全', content: '登入密碼和食刻錢包支付密碼用於帳號登入和錢包模擬支付、提現等安全校驗。項目不應以明文展示你的密碼。微信支付和支付寶支付在本項目中為模擬流程，不會調用真實第三方支付密碼或真實支付接口。' },
        { title: '資訊共享與對外提供', content: '除完成 uniCloud 雲端儲存、雲函數調用和應用功能展示所必需的處理外，本項目不會主動向真實商家、騎手、廣告平台或其他第三方出售、出租或共享你的個人資訊。' },
        { title: '使用者管理權利', content: '你可以在應用內修改頭像、暱稱、地址、主題、語言、字體、長輩模式、通知開關等資訊，也可以刪除地址、購物車商品、收藏商品、訂單記錄或評價記錄。登出會清除目前設備登入態，但不會自動刪除雲端帳號及業務資料。' },
        { title: '本地快取', content: '為提升頁面響應速度，應用可能在本地快取登入態、使用者偏好、頁面臨時狀態或部分業務資料。你可以在設定頁清除快取。清除快取可能影響本機展示狀態，但不一定刪除雲端業務資料。' },
        { title: '未成年人保護', content: '未成年人應在監護人指導下使用本應用，不建議填寫與模擬點餐無關的真實敏感資訊。' },
        { title: '政策更新與聯絡', content: '隨著項目功能迭代，本隱私政策可能會更新。如需諮詢、修改或刪除相關資訊，可透過應用內「我的—聯絡客服」等入口聯絡項目開發者。' }
      ]
    }
  }
}

function resolveLegalContent(type, locale = i18n.getLocale()) {
  const pack = LEGAL_TEXT[locale] || LEGAL_TEXT['zh-Hans']
  return type === 'privacy' ? pack.privacy : pack.user
}

const pageConfig = {
  data: { statusHeight: 20, type: 'user', title: '用户服务协议', updatedText: LEGAL_TEXT['zh-Hans'].updated, sections: LEGAL_TEXT['zh-Hans'].user.sections },
  onLoad(options = {}) {
    this.setData({ statusHeight: getApp().globalData.statusBarHeight, type: options.type === 'privacy' ? 'privacy' : 'user' })
    this.refreshText()
  },
  onShow() {
    this.refreshText()
  },
  refreshText() {
    const locale = i18n.getLocale()
    const pack = LEGAL_TEXT[locale] || LEGAL_TEXT['zh-Hans']
    const content = resolveLegalContent(this.type, locale)
    this.setData({ title: content.title, updatedText: pack.updated, sections: content.sections })
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
