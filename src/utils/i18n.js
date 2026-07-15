// 基础国际化工具：先覆盖核心静态页面文案，业务数据名称仍优先使用后端返回内容。
const LOCALE_KEY = 'sk_locale'
const DEFAULT_LOCALE = 'zh-Hans'

const locales = [
  { code: 'zh-Hans', name: '简体中文', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: '日本語', nativeName: '日本語' },
  { code: 'zh-Hant', name: '繁體中文', nativeName: '繁體中文' }
]

const messages = {
  'zh-Hans': {
    common: {
      back: '返回',
      save: '保存',
      done: '完成',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '修改',
      none: '暂无',
      notLogin: '未登录',
      loginRequired: '请先登录账号'
    },
    tab: {
      home: '首页',
      menu: '点餐',
      orders: '订单',
      profile: '我的',
      loginTitle: '登录后享更多优惠',
      loginSub: '优惠券、订单与购物车随时查看',
      loginBtn: '立即登录'
    },
    settings: {
      title: '设置',
      notification: '消息通知',
      orderTradeNotice: '订单与交易通知',
      benefitServiceNotice: '优惠与服务通知',
      orderNotice: '订单状态通知',
      promoNotice: '优惠活动通知',
      soundNotice: '声音与振动',
      general: '通用',
      username: '用户名',
      accountSecurity: '账号与支付安全',
      personalization: '个性化',
      accessibility: '辅助功能',
      elderMode: '长辈模式',
      elderModeTip: '长辈模式持续接入中',
      fontSize: '字体大小调节',
      language: '语言切换/Language',
      cache: '清除缓存',
      privacyTitle: '协议与隐私',
      userAgreement: '用户服务协议',
      privacyPolicy: '隐私政策',
      logout: '退出登录',
      login: '登录账号',
      saved: '设置已保存'
    },
    language: {
      title: '语言',
      subtitle: '语言选择',
      desc: '选择应用显示语言',
      current: '当前语言',
      supportText: '目前首页、点餐、购物车、订单、我的、设置、登录注册等核心页面已接入多语言；商品详情、食刻钱包、会员中心及更多页面语言持续接入中。',
      toast: '语言已保存'
    },
    home: {
      addressLogin: '登录后选择收货地址',
      addressEmpty: '请选择收货地址',
      searchPlaceholder: '搜索美食、菜品或店铺',
      search: '搜索',
      heroKicker: '今日甄选 · 最高减 ¥18',
      heroTitle: '认真吃饭，\n治愈每个忙碌时刻',
      heroButton: '立即点餐 →',
      memberDay: '食刻会员日',
      memberGift: '新客礼包\n三张券已到账',
      claim: '去领取 →',
      lunch: '工作日午餐',
      lunchDesc: '30分钟送达',
      lightMeal: '轻盈一餐',
      lightMealDesc: '低卡也好吃',
      popular: '大家都在点',
      viewAll: '查看全部 ›',
      nearby: '附近好店',
      sortDistance: '按距离排序',
      monthlySales: '月售'
    },
    profile: {
      guestName: '登录 / 注册',
      guestSub: '登录后享受更多服务',
      accountLogged: '已登录账号',
      coupon: '优惠券',
      favorite: '收藏',
      points: '积分',
      myOrders: '我的订单',
      allOrders: '全部订单 ›',
      unpaid: '待付款',
      processing: '进行中',
      done: '已完成',
      myReviews: '我的评价',
      plus: '食刻 PLUS',
      plusTag: '每月省更多',
      plusDesc: '开通会员 · 每月领 ¥24 券包',
      viewNow: '立即查看',
      services: '常用服务',
      memberCenter: '会员中心',
      address: '地址管理',
      cart: '购物车',
      wallet: '食刻钱包',
      service: '联系客服',
      message: '消息设置'
    },
    cart: {
      title: '购物车',
      manage: '管理',
      exitManage: '退出管理',
      delivery: '预计 30 分钟送达',
      deliverySub: '由食刻专送提供配送服务',
      empty: '购物车还是空的',
      discount: '店铺满减',
      all: '全选',
      total: '合计',
      settle: '去结算',
      remove: '删除'
    },
    orders: {
      title: '我的订单',
      all: '全部',
      unpaid: '待付款',
      processing: '进行中',
      done: '已完成',
      cancelled: '已取消',
      emptyTitle: '还没有相关订单',
      emptyDesc: '下单后可以在这里查看进度',
      goOrder: '去点餐',
      detail: '查看详情',
      pay: '立即支付',
      paid: '实付'
    },
    login: {
      hello: 'Hello!',
      welcome: '欢迎来到食刻',
      sub: '登录后享受专属优惠与便捷点餐',
      login: '登录',
      register: '注册',
      username: '请输入用户名',
      password: '请输入密码',
      confirmPassword: '请再次输入密码',
      loginButton: '登录',
      registerButton: '注册账号',
      agree: '我已阅读并同意',
      agreement: '《用户服务协议》',
      and: '和',
      privacy: '《隐私政策》'
    }
  },
  en: {
    common: { back: 'Back', save: 'Save', done: 'Done', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete', edit: 'Edit', none: 'None', notLogin: 'Not signed in', loginRequired: 'Please sign in first' },
    tab: { home: 'Home', menu: 'Order', orders: 'Orders', profile: 'Me', loginTitle: 'More perks after sign-in', loginSub: 'Coupons, orders and cart at a glance', loginBtn: 'Sign in' },
    settings: { title: 'Settings', notification: 'Notifications', orderTradeNotice: 'Order & transaction notices', benefitServiceNotice: 'Offers & service notices', orderNotice: 'Order status', promoNotice: 'Promotions', soundNotice: 'Sound & vibration', general: 'General', username: 'Username', accountSecurity: 'Account & payment security', personalization: 'Personalization', accessibility: 'Accessibility', elderMode: 'Senior mode', elderModeTip: 'Senior mode is being added', fontSize: 'Font size', language: 'Language', cache: 'Clear cache', privacyTitle: 'Terms & Privacy', userAgreement: 'Terms of Service', privacyPolicy: 'Privacy Policy', logout: 'Log out', login: 'Sign in', saved: 'Saved' },
    language: { title: 'Language', subtitle: 'Language selection', desc: 'Choose display language', current: 'Current', supportText: 'Core pages such as Home, Order, Cart, Orders, Me, Settings and Login are supported. Product detail, Wallet, Member Center and more pages/languages are being added continuously.', toast: 'Language saved' },
    home: { addressLogin: 'Sign in to choose address', addressEmpty: 'Choose delivery address', searchPlaceholder: 'Search dishes or stores', search: 'Search', heroKicker: 'Today’s pick · Save up to ¥18', heroTitle: 'Eat well,\nheal every busy moment', heroButton: 'Order now →', memberDay: 'Shike Member Day', memberGift: 'New user coupons\nare ready', claim: 'Claim →', lunch: 'Workday lunch', lunchDesc: '30-min delivery', lightMeal: 'Light meal', lightMealDesc: 'Low-cal and tasty', popular: 'Popular picks', viewAll: 'View all ›', nearby: 'Nearby stores', sortDistance: 'By distance', monthlySales: 'Sold' },
    profile: { guestName: 'Sign in / Register', guestSub: 'More services after sign-in', accountLogged: 'Signed in', coupon: 'Coupons', favorite: 'Favorites', points: 'Points', myOrders: 'My Orders', allOrders: 'All orders ›', unpaid: 'Unpaid', processing: 'In progress', done: 'Completed', myReviews: 'Reviews', plus: 'Shike PLUS', plusTag: 'Save monthly', plusDesc: 'Join and get ¥24 coupons monthly', viewNow: 'View now', services: 'Services', memberCenter: 'Member Center', address: 'Addresses', cart: 'Cart', wallet: 'Wallet', service: 'Support', message: 'Messages' },
    cart: { title: 'Cart', manage: 'Manage', exitManage: 'Done', delivery: 'About 30 min delivery', deliverySub: 'Delivered by Shike', empty: 'Your cart is empty', discount: 'Store discount', all: 'All', total: 'Total', settle: 'Checkout', remove: 'Delete' },
    orders: { title: 'My Orders', all: 'All', unpaid: 'Unpaid', processing: 'In progress', done: 'Completed', cancelled: 'Cancelled', emptyTitle: 'No orders yet', emptyDesc: 'Order progress will appear here', goOrder: 'Order now', detail: 'Details', pay: 'Pay now', paid: 'Paid' },
    login: { hello: 'Hello!', welcome: 'Welcome to Shike', sub: 'Enjoy deals and quick ordering after sign-in', login: 'Login', register: 'Register', username: 'Username', password: 'Password', confirmPassword: 'Confirm password', loginButton: 'Login', registerButton: 'Create account', agree: 'I have read and agree to', agreement: 'Terms', and: 'and', privacy: 'Privacy Policy' }
  },
  ja: {
    common: { back: '戻る', save: '保存', done: '完了', cancel: '取消', confirm: '確認', delete: '削除', edit: '編集', none: 'なし', notLogin: '未ログイン', loginRequired: '先にログインしてください' },
    tab: { home: 'ホーム', menu: '注文', orders: '注文履歴', profile: 'マイ', loginTitle: 'ログインで特典を利用', loginSub: 'クーポン・注文・カートを確認', loginBtn: 'ログイン' },
    settings: { title: '設定', notification: '通知', orderTradeNotice: '注文・取引通知', benefitServiceNotice: 'クーポン・サービス通知', orderNotice: '注文状況通知', promoNotice: 'キャンペーン通知', soundNotice: '音と振動', general: '一般', username: 'ユーザー名', accountSecurity: 'アカウントと支払い安全', personalization: '個人設定', accessibility: 'アクセシビリティ', elderMode: 'シニアモード', elderModeTip: 'シニアモードは順次対応中です', fontSize: '文字サイズ調整', language: '言語切替/Language', cache: 'キャッシュ削除', privacyTitle: '規約とプライバシー', userAgreement: '利用規約', privacyPolicy: 'プライバシーポリシー', logout: 'ログアウト', login: 'ログイン', saved: '保存しました' },
    language: { title: '言語', subtitle: '言語選択', desc: 'アプリの表示言語を選択', current: '現在の言語', supportText: '現在、ホーム、注文、カート、注文履歴、マイページ、設定、ログイン登録などの主要ページに対応しています。商品詳細、食刻ウォレット、会員センターなどのページは順次対応中です。', toast: '言語を保存しました' },
    home: { addressLogin: 'ログインして住所を選択', addressEmpty: '配送先を選択', searchPlaceholder: '料理・商品・店舗を検索', search: '検索', heroKicker: '本日のおすすめ · 最大¥18割引', heroTitle: 'きちんと食べて、\n忙しい毎日を癒す', heroButton: '今すぐ注文 →', memberDay: '食刻会員デー', memberGift: '新規クーポン\n到着済み', claim: '受け取る →', lunch: '平日ランチ', lunchDesc: '30分でお届け', lightMeal: 'ライトミール', lightMealDesc: '低カロリーで美味しい', popular: '人気メニュー', viewAll: 'すべて見る ›', nearby: '近くのお店', sortDistance: '距離順', monthlySales: '月販売' },
    profile: { guestName: 'ログイン / 登録', guestSub: 'ログイン後にサービス利用', accountLogged: 'ログイン済み', coupon: 'クーポン', favorite: 'お気に入り', points: 'ポイント', myOrders: '注文履歴', allOrders: '全注文 ›', unpaid: '未払い', processing: '進行中', done: '完了', myReviews: '評価', plus: '食刻 PLUS', plusTag: '毎月お得', plusDesc: '会員登録 · 毎月¥24クーポン', viewNow: '確認', services: 'サービス', memberCenter: '会員センター', address: '住所管理', cart: 'カート', wallet: '食刻ウォレット', service: 'サポート', message: '通知設定' },
    cart: { title: 'カート', manage: '管理', exitManage: '完了', delivery: '約30分でお届け', deliverySub: '食刻専用配送', empty: 'カートは空です', discount: '店舗割引', all: '全選択', total: '合計', settle: '会計へ', remove: '削除' },
    orders: { title: '注文履歴', all: 'すべて', unpaid: '未払い', processing: '進行中', done: '完了', cancelled: 'キャンセル', emptyTitle: '該当注文はありません', emptyDesc: '注文後ここで進捗を確認できます', goOrder: '注文へ', detail: '詳細', pay: '支払う', paid: '支払額' },
    login: { hello: 'Hello!', welcome: '食刻へようこそ', sub: 'ログインして特典と便利な注文を利用', login: 'ログイン', register: '登録', username: 'ユーザー名', password: 'パスワード', confirmPassword: 'パスワード再入力', loginButton: 'ログイン', registerButton: '登録する', agree: '同意しました', agreement: '利用規約', and: 'と', privacy: 'プライバシーポリシー' }
  },
  'zh-Hant': {
    common: { back: '返回', save: '儲存', done: '完成', cancel: '取消', confirm: '確認', delete: '刪除', edit: '修改', none: '暫無', notLogin: '未登入', loginRequired: '請先登入帳號' },
    tab: { home: '首頁', menu: '點餐', orders: '訂單', profile: '我的', loginTitle: '登入後享更多優惠', loginSub: '優惠券、訂單與購物車隨時查看', loginBtn: '立即登入' },
    settings: { title: '設定', notification: '訊息通知', orderTradeNotice: '訂單與交易通知', benefitServiceNotice: '優惠與服務通知', orderNotice: '訂單狀態通知', promoNotice: '優惠活動通知', soundNotice: '聲音與震動', general: '通用', username: '使用者名稱', accountSecurity: '帳號與支付安全', personalization: '個人化', accessibility: '輔助功能', elderMode: '長輩模式', elderModeTip: '長輩模式持續接入中', fontSize: '字體大小調節', language: '語言切換/Language', cache: '清除快取', privacyTitle: '協議與隱私', userAgreement: '使用者服務協議', privacyPolicy: '隱私政策', logout: '登出', login: '登入帳號', saved: '設定已儲存' },
    language: { title: '語言', subtitle: '語言選擇', desc: '選擇應用顯示語言', current: '目前語言', supportText: '目前首頁、點餐、購物車、訂單、我的、設定、登入註冊等核心頁面已接入多語言；商品詳情、食刻錢包、會員中心及更多頁面語言持續接入中。', toast: '語言已儲存' },
    home: { addressLogin: '登入後選擇收貨地址', addressEmpty: '請選擇收貨地址', searchPlaceholder: '搜尋美食、菜品或店鋪', search: '搜尋', heroKicker: '今日甄選 · 最高減 ¥18', heroTitle: '認真吃飯，\n治癒每個忙碌時刻', heroButton: '立即點餐 →', memberDay: '食刻會員日', memberGift: '新客禮包\n三張券已到帳', claim: '去領取 →', lunch: '工作日午餐', lunchDesc: '30分鐘送達', lightMeal: '輕盈一餐', lightMealDesc: '低卡也好吃', popular: '大家都在點', viewAll: '查看全部 ›', nearby: '附近好店', sortDistance: '按距離排序', monthlySales: '月售' },
    profile: { guestName: '登入 / 註冊', guestSub: '登入後享受更多服務', accountLogged: '已登入帳號', coupon: '優惠券', favorite: '收藏', points: '積分', myOrders: '我的訂單', allOrders: '全部訂單 ›', unpaid: '待付款', processing: '進行中', done: '已完成', myReviews: '我的評價', plus: '食刻 PLUS', plusTag: '每月省更多', plusDesc: '開通會員 · 每月領 ¥24 券包', viewNow: '立即查看', services: '常用服務', memberCenter: '會員中心', address: '地址管理', cart: '購物車', wallet: '食刻錢包', service: '聯絡客服', message: '訊息設定' },
    cart: { title: '購物車', manage: '管理', exitManage: '退出管理', delivery: '預計 30 分鐘送達', deliverySub: '由食刻專送提供配送服務', empty: '購物車還是空的', discount: '店鋪滿減', all: '全選', total: '合計', settle: '去結算', remove: '刪除' },
    orders: { title: '我的訂單', all: '全部', unpaid: '待付款', processing: '進行中', done: '已完成', cancelled: '已取消', emptyTitle: '還沒有相關訂單', emptyDesc: '下單後可以在這裡查看進度', goOrder: '去點餐', detail: '查看詳情', pay: '立即支付', paid: '實付' },
    login: { hello: 'Hello!', welcome: '歡迎來到食刻', sub: '登入後享受專屬優惠與便捷點餐', login: '登入', register: '註冊', username: '請輸入使用者名稱', password: '請輸入密碼', confirmPassword: '請再次輸入密碼', loginButton: '登入', registerButton: '註冊帳號', agree: '我已閱讀並同意', agreement: '《使用者服務協議》', and: '和', privacy: '《隱私政策》' }
  }
}

function safeStorageGet(key, fallback) {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined ? fallback : value
  } catch (err) {
    return fallback
  }
}

function getLocale() {
  const locale = safeStorageGet(LOCALE_KEY, DEFAULT_LOCALE)
  return messages[locale] ? locale : DEFAULT_LOCALE
}

function setLocale(locale) {
  const next = messages[locale] ? locale : DEFAULT_LOCALE
  uni.setStorageSync(LOCALE_KEY, next)
  uni.$emit('localeChanged', next)
  return next
}

function mergeDeep(base = {}, override = {}) {
  const output = { ...base }
  Object.keys(override || {}).forEach(key => {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      output[key] = mergeDeep(base[key], override[key])
    } else {
      output[key] = override[key]
    }
  })
  return output
}

function page(key) {
  return mergeDeep(messages[DEFAULT_LOCALE][key] || {}, messages[getLocale()][key] || {})
}

function getLocaleName(locale = getLocale()) {
  const found = locales.find(item => item.code === locale)
  return found ? found.nativeName : locales[0].nativeName
}

export default {
  locales,
  getLocale,
  setLocale,
  getLocaleName,
  page
}
