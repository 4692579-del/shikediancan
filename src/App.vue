<script>
import store from './utils/store.js'
import paymentCountdown from './utils/payment-countdown.js'
import membership from './utils/membership.js'

export default {
  globalData: { statusBarHeight: 20, navBarHeight: 44 },
  onLaunch() {
    const system = uni.getSystemInfoSync()
    this.globalData.statusBarHeight = system.statusBarHeight || 20
    this.globalData.navBarHeight = 44
    store.seed()
    membership.syncCurrent()
    paymentCountdown.normalizeOrders()
  },
  onShow() {
    membership.syncCurrent()
    paymentCountdown.normalizeOrders()
  }
}
</script>

<style>
page {
  --orange: #ff6533;
  --orange-soft: #fff0ea;
  --theme-border: #ff8057;
  --theme-gradient: linear-gradient(135deg, #ff7a45, #ff552b);
  --theme-shadow: rgba(255, 92, 46, .24);
  --ink: #191919;
  --muted: #8e8e93;
  --line: #ececf0;
  --surface: #ffffff;
  --bg: #f5f5f7;
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif;
  font-size: 28rpx;
}

view, text, image, button, input, textarea, scroll-view {
  box-sizing: border-box;
}

button {
  min-width: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  line-height: inherit;
  font-size: inherit;
  border-radius: 0;
  border: 0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  overflow: visible;
}

button::after { border: 0; }
button:focus,
button:focus-visible,
button:active,
input:focus,
textarea:focus {
  outline: none;
}

/* H5 运行时会把 button 转成 uni-button，并额外注入默认灰色边框。 */
uni-button {
  background: transparent;
  box-shadow: none;
  border: 0 !important;
  outline: none !important;
  -webkit-appearance: none;
  appearance: none;
}

uni-button::after,
uni-button:after {
  background: transparent;
  border: 0 !important;
  outline: none !important;
  box-shadow: none;
}

/* 这些无背景交互项在 H5 中也要保持透明，避免被运行时默认底色包住。 */
uni-button.location,
uni-button.category-item,
uni-button.section-more,
uni-button.user-row,
uni-button.tab,
uni-button.page-back,
uni-button.nav-back,
.stats > uni-button,
.service-grid > uni-button {
  background: transparent !important;
  box-shadow: none !important;
}

/* 设置页的列表行同样不使用 H5 默认按钮底色。 */
uni-button.setting-row {
  background: transparent !important;
  box-shadow: none !important;
}

/* 左滑操作按钮统一保持横向文字，避免窄屏下“修改/删除/收藏”等文字换行。 */
.address-swipe-actions button,
.fav-delete-action button,
.cart-item-actions button,
.member-order-delete button {
  white-space: nowrap !important;
  word-break: keep-all !important;
  writing-mode: horizontal-tb !important;
  overflow: visible !important;
}

/* 底部导航当前选项仍保留项目主题色。 */
uni-button.tab.active {
  background: var(--theme-gradient) !important;
  box-shadow: 0 8rpx 18rpx var(--theme-shadow) !important;
}

.page {
  min-height: 100vh;
  padding-bottom: calc(150rpx + env(safe-area-inset-bottom));
}

.safe-nav {
  padding-top: var(--status-height);
  background: rgba(245, 245, 247, .94);
}

.nav-row {
  height: 88rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  max-width: 430rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-back image {
  width: 30rpx;
  height: 30rpx;
  display: block;
}

/* Match the login page exactly; keep this selector simple for legacy CSS. */
.page-back {
  position: absolute !important;
  left: 10rpx !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 64rpx !important;
  min-width: 64rpx !important;
  max-width: 64rpx !important;
  height: 64rpx !important;
  margin: 0 !important;
  padding: 0 !important;
  z-index: 3;
}

.card {
  background: var(--surface);
  border-radius: 32rpx;
  box-shadow: 0 10rpx 32rpx rgba(40, 40, 55, .055);
}

.section {
  padding: 0 28rpx;
  margin-top: 30rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 750;
  letter-spacing: -1rpx;
}

.section-more {
  color: var(--muted);
  font-size: 25rpx;
}

.primary-btn {
  width: 100%!important;
  max-width: none!important;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  background: var(--theme-gradient);
  box-shadow: 0 14rpx 30rpx var(--theme-shadow);
}

.secondary-btn {
  width: 100%!important;
  max-width: none!important;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 650;
  background: #fff;
  border: 2rpx solid var(--line);
}

.pill {
  border-radius: 999rpx;
}

.muted { color: var(--muted); }
.orange { color: var(--orange); }
.bold { font-weight: 700; }
.row { display: flex; align-items: center; }
.between { display: flex; align-items: center; justify-content: space-between; }

input, textarea {
  min-width: 0;
}

.empty {
  padding: 120rpx 40rpx;
  text-align: center;
}

.empty-icon {
  font-size: 104rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 34rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.empty-desc {
  color: var(--muted);
  line-height: 1.7;
  margin-bottom: 36rpx;
}

.toast-tip {
  font-size: 23rpx;
  color: var(--muted);
}

</style>
