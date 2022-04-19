const api = require('./api')
const logger = require('./utils/logger')

async function run() {
  try {

    // 购物车全选
    const products = await api.selectAll()
    if (products.length === 0) {
      return
    }

    // 获取购物车商品
    const cartRes = await api.getCart()
    if (!cartRes) {
      logger.warn('购物车无有效商品')
      return
    }

    // 获取配送信息
    const multiReserveTimeRes = await api.getMultiReserveTime(cartRes)
    if (!multiReserveTimeRes) {
      return
    }

    // 获取订单确认信息
    const checkOrderRes = await api.getCheckOrder(cartRes, multiReserveTimeRes)
    if (!checkOrderRes) {
      return
    }

    // 提交订单
    const confirmOrder = await api.placeOrder(cartRes, multiReserveTimeRes, checkOrderRes)

  } catch (error) {
    // setTimeout(() => {
    //   run()
    // }, 3000)
    logger.error('run-error: ' + error)
  }
}

run()