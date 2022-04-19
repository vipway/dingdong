const path = require('path')
const sound = require('sound-play')
const logger = require('./utils/logger')
const {
  v4: uuid
} = require('uuid')
const request = require('./utils/request')
const {
  sendPostRequest
} = require('./utils/request2')

const {
  cityId,
  addressId,
  stationId,
  getPayload
} = require('./config')

function stringObject(obj) {
  return encodeURIComponent(JSON.stringify(obj))
}

function play() {
  const interval = setInterval(function () {
    const filePath = path.join(__dirname, 'audio/tips.wav')
    sound.play(filePath)
  }, 1050)

  setTimeout(function () {
    clearInterval(interval)
  }, 2150)
}

/**
 * 检查配置
 */
async function checkConfig() {
  await request({
    url: 'https://sunquan.api.ddxq.mobi/api/v1/user/address/',
    params: getPayload(),
  }).then(function (response) {
    const validAddress = response.data.valid_address
    for (let i = 0; i < validAddress.length; i++) {
      const address = validAddress[i]
      if (address.is_default) {
        const stationInfo = address.station_info

        logger.info('获取默认收货地址成功 请仔细核对站点和收货地址信息 站点信息配置错误将导致无法下单')
        logger.info('1.该地址对应城市名称为：' + stationInfo.city_name)
        logger.info('2.该地址对应站点名称为：' + stationInfo.name)
        logger.info('3.该地址详细信息：' + address.addr_detail + ' 手机号：' + address.mobile)
        logger.info('')

        // 校验下返回类型
        if (address.city_number !== cityId) {
          if (address.city_number) {
            logger.error('城市id配置不正确，请填入config.cityId = ' + stationInfo.city_number)
          } else {
            logger.error('城市id未从接口中获取，请人工确认城市id是否正确，通过抓包可以看到请求体中有city_number字段，上海默认0101，不用改')
          }
          return new Promise((resolve, reject) => reject())
        } else {
          logger.info('城市id配置正确')
        }
        if (stationInfo.id !== stationId) {
          logger.error('站点id配置不正确，请填入config.stationId = ' + stationInfo.id)
          return new Promise((resolve, reject) => reject())
        } else {
          logger.log('站点id配置正确')
        }
        if (!address.id === addressId) {
          logger.error('地址id配置不正确，请填入config.addressId = ' + address.id)
          return new Promise((resolve, reject) => reject())
        } else {
          logger.info('地址id配置正确')
        }
      }
    }
    return new Promise((resolve) => resolve())
  }).catch(function (error) {
    logger.error('checkConfig-error', error)
    logger.error('没有可用的默认收货地址，请自行登录叮咚设置该站点可用的默认收货地址')
    return new Promise((resolve, reject) => reject())
  })
}

/**
 * 购物车全选
 */
async function selectAll() {
  try {
    const response = await request({
      url: 'https://maicai.api.ddxq.mobi/cart/allCheck',
      params: Object.assign(getPayload(), {
        is_check: 1,
        is_load: 1,
        ab_config: {
          key_onion: 'D',
          key_cart_discount_price: 'C'
        }
      })
    })
    const {
      data
    } = response
    if (data && data.product && data.product.effective.length > 0) {
      const products = data.product.effective[0].products
      logger.info(`购物车成功选择了${products.length}件商品: ${products.map(item => item.product_name).join(',')}`)
      return new Promise((resolve) => resolve(products))
    }
    logger.warn(`勾选购物车无可购买商品`)
    return new Promise((resolve) => resolve([]))
  } catch (error) {
    logger.error('勾选购物车全选按钮失败: ' + error)
    return new Promise((resolve, reject) => reject(error))
  }
}

/**
 * 获取购物车信息
 *
 * @return 购物车信息
 */
async function getCart() {
  try {
    const response = await request({
      url: 'https://maicai.api.ddxq.mobi/cart/index',
      params: Object.assign(getPayload(), {
        is_load: 1,
        ab_config: {
          key_onion: 'D',
          key_cart_discount_price: 'C'
        }
      })
    })
    const data = response.data
    if (data.new_order_product_list.length === 0) {
      logger.warn('购物车无可买的商品')
      return new Promise((resolve) => resolve(null))
    }
    const newOrderProduct = data.new_order_product_list[0]
    const products = newOrderProduct.products
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      product.total_money = product.total_price
      product.total_origin_money = product.total_origin_price
    }
    const result = {
      products: products,
      parent_order_sign: data.parent_order_info.parent_order_sign,
      total_money: newOrderProduct.total_money,
      total_origin_money: newOrderProduct.total_origin_money,
      goods_real_money: newOrderProduct.goods_real_money,
      total_count: newOrderProduct.total_count,
      cart_count: newOrderProduct.cart_count,
      is_presale: newOrderProduct.is_presale,
      instant_rebate_money: newOrderProduct.instant_rebate_money,
      coupon_rebate_money: newOrderProduct.coupon_rebate_money,
      total_rebate_money: newOrderProduct.total_rebate_money,
      used_balance_money: newOrderProduct.used_balance_money,
      used_point_num: newOrderProduct.used_point_num,
      used_point_money: newOrderProduct.used_point_money,
      can_used_point_num: newOrderProduct.can_used_point_num,
      can_used_point_money: newOrderProduct.can_used_point_money,
      is_share_station: newOrderProduct.is_share_station,
      only_today_products: newOrderProduct.only_today_products,
      only_tomorrow_products: newOrderProduct.only_tomorrow_products,
      package_type: newOrderProduct.package_type,
      package_id: newOrderProduct.package_id,
      front_package_text: newOrderProduct.front_package_text,
      front_package_type: newOrderProduct.front_package_type,
      front_package_stock_color: newOrderProduct.front_package_stock_color,
      front_package_bg_color: newOrderProduct.front_package_bg_color
    }
    logger.info('获取购物商品成功,订单金额：' + newOrderProduct.total_money)
    return new Promise((resolve) => resolve(result))
  } catch (error) {
    logger.error('getCart-error', error)
    return new Promise((resolve, reject) => reject(error))
  }
}

/**
 * 获取配送信息
 *
 * @param cartMap   购物车信息
 * @return 配送信息
 */
async function getMultiReserveTime(cartMap) {
  try {
    const response = await sendPostRequest({
      url: 'https://maicai.api.ddxq.mobi/order/getMultiReserveTime',
      data: Object.assign(getPayload(), {
        address_id: addressId,
        group_config_id: '',
        isBridge: false,
        products: stringObject([cartMap.products])
      })
    })
    let result = null
    if (response.data && response.data[0] && response.data[0].time && response.data[0].time[0]) {
      const times = response.data[0].time[0].times
      for (let i = 0; i < times.length; i++) {
        const time = times[i]
        if (time.disableType === 0 && !time.select_msg.includes('尽快')) {
          result = {
            reserved_time_start: time.start_timestamp,
            reserved_time_end: time.end_timestamp
          }
          logger.info('获取配送时间成功')
        }
      }
    }
    if (!result) {
      logger.warn('无可选的配送时间')
    }
    return new Promise((resolve) => resolve(result))
  } catch (error) {
    logger.error('获取配送时间失败')
    return new Promise((resolve, reject) => reject(error))
  }
}

/**
 * 获取订单确认信息
 *
 * @param cartMap             购物车信息
 * @param multiReserveTimeMap 配送信息
 * @return 订单确认信息
 */
async function getCheckOrder(cartMap, multiReserveTimeMap) {
  try {
    const response = await sendPostRequest({
      url: 'https://maicai.api.ddxq.mobi/order/checkOrder',
      data: Object.assign(getPayload(), {
        address_id: addressId,
        user_ticket_id: 'default',
        freight_ticket_id: 'default',
        is_use_point: '0',
        is_use_balance: '0',
        is_buy_vip: '0',
        coupons_id: '0',
        is_buy_coupons: '0',
        check_order_type: '0',
        is_support_merge_payment: '1',
        showData: true,
        showMsg: false,
        packages: stringObject([{
          products: cartMap.products,
          total_money: cartMap.total_money,
          total_origin_money: cartMap.total_money,
          total_count: cartMap.total_count,
          cart_count: cartMap.cart_count,
          is_presale: cartMap.is_presale,
          instant_rebate_money: cartMap.instant_rebate_money,
          coupon_rebate_money: cartMap.coupon_rebate_money,
          total_rebate_money: cartMap.total_rebate_money,
          used_balance_money: cartMap.used_balance_money,
          can_used_balance_money: cartMap.can_used_balance_money,
          used_point_num: cartMap.used_point_num,
          used_point_money: cartMap.used_point_money,
          can_used_point_num: cartMap.can_used_point_num,
          is_share_station: cartMap.is_share_station,
          only_today_products: cartMap.only_today_products,
          only_tomorrow_products: cartMap.only_tomorrow_products,
          package_type: cartMap.package_type,
          package_id: cartMap.package_id,
          front_package_text: cartMap.front_package_text,
          front_package_type: cartMap.front_package_type,
          front_package_stock_color: cartMap.front_package_stock_color,
          front_package_bg_color: cartMap.front_package_bg_color,
          reserved_time: {
            reserved_time_start: multiReserveTimeMap.reserved_time_start,
            reserved_time_end: multiReserveTimeMap.reserved_time_end
          }
        }])
      })
    })
    const data = response.data

    if (data && data.order) {
      const order = data.order
      const result = {
        freight_discount_money: order.freight_discount_money,
        freight_money: order.freight_money,
        total_money: order.total_money,
        freight_real_money: order.freights[0].freight.freight_real_money,
        user_ticket_id: order.default_coupon._id
      }
      logger.info('获取订单确认信息成功')
      return new Promise((resolve) => resolve(result))
    }
    logger.warn('获取订单确认信息为空')
    return new Promise((resolve) => resolve(null))
  } catch (error) {
    logger.error('获取订单确认信息失败: ' + error)
    return new Promise((resolve, reject) => reject(error))
  }
}

/**
 * 提交订单
 *
 * @param cartMap             购物车信息
 * @param multiReserveTimeMap 配送信息
 * @param checkOrderMap       订单确认信息
 */
async function placeOrder(cartMap, multiReserveTimeMap, checkOrderMap) {
  try {
    const response = await sendPostRequest({
      url: 'https://maicai.api.ddxq.mobi/order/addNewOrder',
      method: 'post',
      data: Object.assign(getPayload(), {
        showMsg: 'false',
        showData: 'true',
        ab_config: JSON.stringify({
          key_onion: 'C'
        }),
        package_order: stringObject({
          payment_order: {
            reserved_time_start: multiReserveTimeMap.reserved_time_start,
            reserved_time_end: multiReserveTimeMap.reserved_time_end,
            price: checkOrderMap.total_money,
            freight_money: checkOrderMap.freight_money,
            order_freight: checkOrderMap.freight_real_money,
            parent_order_sign: cartMap.parent_order_sign,
            product_type: 1,
            address_id: addressId,
            form_id: uuid().replace(/-/g, ''),
            receipt_without_sku: null,
            pay_type: 6,
            user_ticket_id: checkOrderMap.user_ticket_id,
            vip_money: '',
            vip_buy_user_ticket_id: '',
            coupons_money: '',
            coupons_id: ''
          },
          packages: [{
            products: cartMap.products,
            total_money: cartMap.total_money,
            total_origin_money: cartMap.total_money,
            goods_real_money: cartMap.goods_real_money,
            total_count: cartMap.total_count,
            cart_count: cartMap.cart_count,
            is_presale: cartMap.is_presale,
            instant_rebate_money: cartMap.instant_rebate_money,
            coupon_rebate_money: cartMap.coupon_rebate_money,
            total_rebate_money: cartMap.total_rebate_money,
            used_balance_money: cartMap.used_balance_money,
            can_used_balance_money: cartMap.can_used_balance_money,
            used_point_num: cartMap.used_point_num,
            used_point_money: cartMap.used_point_money,
            can_used_point_num: cartMap.can_used_point_num,
            can_used_point_money: cartMap.can_used_point_money,
            can_used_balance_money: cartMap.can_used_point_money,
            is_share_station: cartMap.is_share_station,
            only_today_products: cartMap.only_today_products,
            only_tomorrow_products: cartMap.only_tomorrow_products,
            package_type: cartMap.package_type,
            package_id: cartMap.package_id,
            front_package_text: cartMap.front_package_text,
            front_package_type: cartMap.front_package_type,
            front_package_stock_color: cartMap.front_package_stock_color,
            front_package_bg_color: cartMap.front_package_bg_color,
            eta_trace_id: '',
            reserved_time_start: multiReserveTimeMap.reserved_time_start,
            reserved_time_end: multiReserveTimeMap.reserved_time_end,
            soon_arrival: '',
            first_selected_big_time: 0,
            receipt_without_sku: 0
          }]
        })
      })
    })
    if (response.success) {
      logger.info('恭喜你，已成功下单 当前下单总金额：' + cartMap.total_money)
      play()
    }
    return new Promise((resolve) => resolve(response))
  } catch (error) {
    logger.error('下单失败: ' + error)
    return new Promise((resolve, reject) => reject(error))
  }
}

module.exports = {
  checkConfig,
  selectAll,
  getCart,
  getMultiReserveTime,
  getCheckOrder,
  placeOrder
}