// 主题配置工具：定义资料卡和全局主题，并生成页面可直接绑定的主题变量。

// 资料卡主题配置；requiredTier 表示对应会员等级限制。
const themes = [
  { id: 'black', name: '曜石黑', color: '#242426', desc: '经典沉稳' },
  { id: 'orange', name: '食刻橙', color: '#E96132', desc: '温暖活力' },
  { id: 'blue', name: '深海蓝', color: '#315A7D', desc: '安静清爽' },
  { id: 'green', name: '松柏绿', color: '#386457', desc: '自然柔和' },
  { id: 'purple', name: '暮光紫', color: '#5C4F78', desc: '优雅克制' },
  { id: 'red', name: '赤陶红', color: '#814B47', desc: '复古温润' },
  {
    id: 'wallet-gold',
    name: '鎏金浅影',
    color: 'linear-gradient(135deg,#f4e7c5 0%,#d8bb7d 48%,#b89454 100%)',
    desc: '低调奢华',
    membershipLimited: true,
    requiredTier: 'plus',
    globalTheme: true,
    primary: '#B68A43',
    soft: '#F7F0E1',
    border: '#CDAA67',
    gradient: 'linear-gradient(135deg,#D8B86F,#A87838)',
    shadow: 'rgba(182,138,67,.24)',
    tone: 'light',
    watermark: true
  },
  {
    id: 'wallet-silver',
    name: '霜银疏光',
    color: 'linear-gradient(135deg,#eef0f2 0%,#c8ccd1 48%,#9298a0 100%)',
    desc: '沉静克制',
    membershipLimited: true,
    requiredTier: 'plus',
    globalTheme: true,
    primary: '#7B8591',
    soft: '#EEF1F4',
    border: '#A7AFB8',
    gradient: 'linear-gradient(135deg,#B1B8C0,#707A86)',
    shadow: 'rgba(93,104,117,.22)',
    tone: 'light',
    watermark: true
  },
  {
    id: 'plus-amber',
    name: '凝金沉迹',
    color: 'linear-gradient(135deg,#292321 0%,#6e4c2e 54%,#c29152 100%)',
    desc: '会员鎏金质感',
    membershipLimited: true,
    requiredTier: 'pro',
    globalTheme: true,
    primary: '#805D3B',
    soft: '#F2ECE6',
    border: '#A78360',
    gradient: 'linear-gradient(135deg,#A98053,#65452E)',
    shadow: 'rgba(101,69,46,.25)',
    watermark: true
  },
  {
    id: 'plus-night',
    name: '星夜幽痕',
    color: 'linear-gradient(135deg,#17191f 0%,#29354c 52%,#526a91 100%)',
    desc: '深邃静谧',
    membershipLimited: true,
    requiredTier: 'pro',
    globalTheme: true,
    primary: '#465B7C',
    soft: '#E9EDF3',
    border: '#7083A0',
    gradient: 'linear-gradient(135deg,#687C9E,#35455F)',
    shadow: 'rgba(53,69,95,.25)',
    watermark: true
  }
]

// 默认全局主题配置；未选择限定主题时使用项目橙色主视觉。
const defaultGlobalTheme = {
  primary: '#ff6533',
  soft: '#fff0ea',
  border: '#ff8057',
  gradient: 'linear-gradient(135deg,#ff7a45,#ff552b)',
  shadow: 'rgba(255,92,46,.24)'
}

// 根据主题编号返回资料卡主题，非法编号回退默认主题。
function getTheme(id) {
  return themes.find(item => item.id === id) || themes[0]
}

function getGlobalTheme(id) {
  const theme = getTheme(id)
  return theme.globalTheme ? {
    primary: theme.primary,
    soft: theme.soft,
    border: theme.border,
    gradient: theme.gradient,
    shadow: theme.shadow
  } : { ...defaultGlobalTheme }
}

// 生成页面 style 可直接使用的 CSS 自定义变量字符串。
function getGlobalStyle(id) {
  const theme = getGlobalTheme(id)
  return `--orange:${theme.primary};--orange-soft:${theme.soft};--theme-border:${theme.border};--theme-gradient:${theme.gradient};--theme-shadow:${theme.shadow};`
}

export default { themes, getTheme, getGlobalTheme, getGlobalStyle }
