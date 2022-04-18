const axios = require('axios')
const {
  getHeaders
} = require('../config')
const sign = require('../utils/sign')

const request = axios.create({
  withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000 // request timeout
})

// request interceptor
request.interceptors.request.use(
  config => {
    // set generic header
    config.headers = Object.assign(config.headers, getHeaders())
    if (config.data) {
      sign(config.data)
    }
    if (config.params) {
      sign(config.params)
    }
    return config
  },
  error => {
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res && res.success) {
      if (405 === res.code) {
        console.log('失败: 出现此问题有三个可能 1.偶发，无需处理 2.一个账号一天只能下两单  3.不要长时间运行程序，目前已知有人被风控了，暂时未确认风控的因素是ip还是用户或设备相关信息，如果要测试用单次执行模式，并发只能用于6点、8点半的前一分钟，然后执行时间不能超过2分钟，如果买不到就不要再执行程序了，切忌切忌');
        console.log('405问题解决方案，不保证完全有效,退出App账号重新登录，尝试刷新购物车和提交订单是否正常，如果正常退出小程序重新登录后再抓包，替换UserConfig中的cookie和device_token。');
      }
      if ('您的访问已过期' === res.msg) {
        console.log('用户信息失效，请确保UserConfig参数准确，并且微信上的叮咚小程序不能退出登录');
      }
      return res
    }
    console.log('res', res)
    console.error(' 失败:' + (res.msg == null || '' === res.msg ? '未解析返回数据内容，全字段输出:' + JSON.stringify(res) : res.msg));
    return Promise.reject(new Error(res.msg || 'Error'))
  },
  error => {
    console.error(error)
    return Promise.reject(error)
  }
)

module.exports = request