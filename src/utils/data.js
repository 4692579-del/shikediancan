// 静态业务数据：集中维护分类、菜品、商品详情、优惠券和店铺展示数据。

const categories = [
  { id: 'hot', name: '人气热卖', icon: '/static/assets/icons/fire.svg', color: '#FFF1EC' },
  { id: 'rice', name: '米饭套餐', icon: '/static/assets/icons/food.svg', color: '#FFF7DF' },
  { id: 'noodle', name: '面食粉类', icon: '/static/assets/icons/restaurant.svg', color: '#F1F8E9' },
  { id: 'snack', name: '小吃夜宵', icon: '/static/assets/icons/snack.svg', color: '#FFF0F5' },
  { id: 'drink', name: '饮品甜点', icon: '/static/assets/icons/drink.svg', color: '#EAF5FF' },
  { id: 'healthy', name: '轻食沙拉', icon: '/static/assets/icons/fruit.svg', color: '#EAF8F0' },
  { id: 'fast', name: '汉堡披萨', icon: '/static/assets/icons/hamburger.svg', color: '#FFF1E6' },
  { id: 'all', name: '全部分类', icon: '/static/assets/icons/more.svg', color: '#F1F1F5' }
]

const foods = [
  { id: 1, name: '招牌照烧鸡腿饭', desc: '鲜嫩去骨鸡腿 · 溏心蛋 · 时蔬', price: 26.8, oldPrice: 32, category: 'rice', sales: 1268, rating: 4.9, icon: '/static/assets/foods/teriyaki-chicken-rice-mobile.jpg', bg: '#F2DFCA', tag: '店长推荐' },
  { id: 2, name: '黑椒牛肉意面', desc: '澳洲牛肉粒 · 黑椒酱 · 意大利面', price: 32.8, oldPrice: 39, category: 'noodle', sales: 865, rating: 4.8, icon: '/static/assets/foods/black-pepper-beef-pasta-mobile.jpg', bg: '#E7D6BE', tag: '限时特价' },
  { id: 3, name: '川香麻辣香锅', desc: '16种丰富配菜 · 香辣过瘾 · 配米饭', price: 36.8, oldPrice: 45, category: 'hot', sales: 2104, rating: 4.9, icon: '/static/assets/foods/mala-xiang-guo-mobile.jpg', bg: '#E4C5A5', tag: '销量冠军' },
  { id: 4, name: '鲜虾牛油果沙拉', desc: '大颗鲜虾 · 牛油果 · 油醋汁', price: 29.8, oldPrice: 35, category: 'healthy', sales: 643, rating: 4.8, icon: '/static/assets/foods/shrimp-avocado-salad-mobile.jpg', bg: '#D9E1C8', tag: '低卡轻食' },
  { id: 5, name: '经典芝士牛肉堡', desc: '厚切牛肉饼 · 双层芝士 · 酸黄瓜', price: 24.8, oldPrice: 29, category: 'fast', sales: 1532, rating: 4.7, icon: '/static/assets/foods/cheese-beef-burger-mobile.jpg', bg: '#E7D3B4', tag: '人气单品' },
  { id: 6, name: '红油鲜肉抄手', desc: '手工现包 · 鲜肉多汁 · 12只', price: 18.8, oldPrice: 22, category: 'snack', sales: 934, rating: 4.8, icon: '/static/assets/foods/red-oil-wontons-mobile.jpg', bg: '#E7C9AD', tag: '必点小吃' },
  { id: 7, name: '杨枝甘露', desc: '芒果 · 西柚 · 椰奶 · 西米', price: 16.8, oldPrice: 20, category: 'drink', sales: 1160, rating: 4.9, icon: '/static/assets/foods/mango-pomelo-sago-mobile.jpg', bg: '#EAD6B9', tag: '饭后甜品' },
  { id: 8, name: '番茄肥牛米线', desc: '酸甜番茄汤 · 肥牛卷 · 云南米线', price: 27.8, oldPrice: 33, category: 'noodle', sales: 789, rating: 4.8, icon: '/static/assets/foods/tomato-beef-rice-noodles-mobile.jpg', bg: '#E7C9B3', tag: '暖胃首选' },
  { id: 9, name: '蜜汁烤鸡双人餐', desc: '整只烤鸡 · 薯条 · 沙拉 · 饮品×2', price: 69.9, oldPrice: 88, category: 'hot', sales: 521, rating: 4.9, icon: '/static/assets/foods/honey-roast-chicken-set-mobile.jpg', bg: '#DCC6A9', tag: '双人优选' },
  { id: 10, name: '抹茶巴斯克蛋糕', desc: '宇治抹茶 · 奶油奶酪 · 低甜配方', price: 22.8, oldPrice: 28, category: 'drink', sales: 408, rating: 4.7, icon: '/static/assets/foods/matcha-basque-cheesecake-mobile.jpg', bg: '#D5D5BD', tag: '新品' }
]

const foodDetails = {
  1: { intro: '选用整块去骨鸡腿，慢火煎至外焦里嫩，刷上日式照烧汁，搭配溏心蛋和当日时蔬。', ingredients: ['去骨鸡腿', '溏心蛋', '时令蔬菜', '东北大米'], taste: ['咸甜适口', '肉质鲜嫩', '酱香浓郁'], energy: '约 682 千卡', serving: '约 520g' },
  2: { intro: '澳洲牛肉粒现点现炒，黑胡椒酱香气饱满，意面筋道爽滑，适合喜欢浓郁风味的你。', ingredients: ['牛肉粒', '意大利面', '黑椒酱', '彩椒'], taste: ['黑椒浓香', '微辣', '面条筋道'], energy: '约 635 千卡', serving: '约 460g' },
  3: { intro: '十六种荤素配菜组合，秘制香辣酱大火翻炒，麻、辣、鲜、香层次分明，并附赠米饭。', ingredients: ['牛肉', '午餐肉', '藕片', '菌菇', '时蔬'], taste: ['香辣过瘾', '层次丰富', '下饭'], energy: '约 816 千卡', serving: '约 650g' },
  4: { intro: '大颗鲜虾搭配成熟牛油果和多种脆爽蔬菜，淋上清爽油醋汁，轻负担也能吃得满足。', ingredients: ['鲜虾', '牛油果', '生菜', '圣女果', '油醋汁'], taste: ['清爽酸甜', '低负担', '蔬菜脆嫩'], energy: '约 368 千卡', serving: '约 380g' },
  5: { intro: '厚切牛肉饼高温锁汁，双层芝士充分融化，搭配酸黄瓜与柔软面包胚，经典又满足。', ingredients: ['牛肉饼', '芝士', '酸黄瓜', '生菜', '汉堡胚'], taste: ['芝士浓郁', '肉汁丰富', '经典咸香'], energy: '约 728 千卡', serving: '约 360g' },
  6: { intro: '每日手工现包鲜肉抄手，薄皮大馅，浇入秘制红油和芝麻香料，鲜香微麻。', ingredients: ['猪肉', '抄手皮', '红油', '芝麻', '香葱'], taste: ['鲜香微辣', '皮薄馅足', '红油醇香'], energy: '约 486 千卡', serving: '12只 / 约320g' },
  7: { intro: '新鲜芒果、西柚果粒、椰奶与Q弹西米组合，酸甜清爽，是餐后解腻的好选择。', ingredients: ['芒果', '西柚', '椰奶', '西米'], taste: ['酸甜清爽', '果香浓郁', '冰凉顺滑'], energy: '约 286 千卡', serving: '约 450ml' },
  8: { intro: '番茄慢熬成浓汤，加入肥牛卷和云南米线，汤底酸甜开胃，暖胃又饱腹。', ingredients: ['肥牛卷', '云南米线', '番茄', '青菜'], taste: ['酸甜浓郁', '暖胃', '米线爽滑'], energy: '约 596 千卡', serving: '约 580g' },
  9: { intro: '整只蜜汁烤鸡搭配薯条、沙拉和两杯饮品，分量充足，适合两人共享。', ingredients: ['整鸡', '薯条', '蔬菜沙拉', '饮品×2'], taste: ['蜜汁咸甜', '外皮焦香', '适合分享'], energy: '约 1480 千卡', serving: '双人份 / 约1.3kg' },
  10: { intro: '宇治抹茶与奶油奶酪融合，低温烘烤出绵密流心口感，甜度克制、茶香清晰。', ingredients: ['奶油奶酪', '宇治抹茶', '鸡蛋', '淡奶油'], taste: ['抹茶清香', '绵密顺滑', '低甜'], energy: '约 398 千卡', serving: '约 160g' }
}

const shops = [
  { id: 1, name: '食刻·品质厨房', desc: '品质简餐 · 月售 5000+', rating: 4.9, time: '28分钟', distance: '1.2km', delivery: 0, min: 15, icon: 'SK', color: '#1C1C1E', notice: '欢迎光临食刻品质厨房，每一餐都认真对待。' },
  { id: 2, name: '川味里·冒菜香锅', desc: '川湘菜 · 月售 3200+', rating: 4.8, time: '35分钟', distance: '2.0km', delivery: 2, min: 20, icon: '川', color: '#D84C32', notice: '正宗川味，默认微辣，可在备注中调整辣度。' },
  { id: 3, name: '麦香手作烘焙', desc: '甜品饮品 · 月售 1800+', rating: 4.7, time: '40分钟', distance: '2.8km', delivery: 3, min: 25, icon: '麦', color: '#C28A52', notice: '蛋糕均为当日制作，请尽快食用。' }
]

const coupons = []

export default { categories, foods, foodDetails, shops, coupons }
