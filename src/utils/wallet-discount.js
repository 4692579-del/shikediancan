// 钱包立减工具：按概率生成每单必得、且以小额为主的随机优惠。

// 优惠金额随概率递减：绝大多数小于 0.5 元，且每单至少优惠 0.01 元。
function generate(total) {
  const payable = Number(total)
  if (!Number.isFinite(payable) || payable <= 0.01) return 0

  const chance = Math.random()
  let discount
  if (chance < 0.985) {
    discount = 0.01 + Math.random() * 0.48
  } else if (chance < 0.997) {
    discount = 0.5 + Math.pow(Math.random(), 2) * 1.5
  } else if (chance < 0.9995) {
    discount = 2 + Math.pow(Math.random(), 2) * 8
  } else {
    discount = 10 + Math.pow(Math.random(), 3) * 20
  }

  const maximum = Math.min(30, payable - 0.01)
  return Number(Math.max(0.01, Math.min(discount, maximum)).toFixed(2))
}

export default { generate }
