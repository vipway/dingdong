// axios post请求参数提交失败，改换request post
const request = require('request')
const sign = require('./sign')
const logger = require('./logger')
const {
  getHeaders,
  getPayload
} = require('../config')

function handleResult(error, response, resolve, reject) {
  try {
    if (error || response.statusCode !== 200) {
      logger.error('请求异常')
      return resolve(error || null)
    }
    const body = JSON.parse(response.body)
    if (!body) {
      logger.warn('请求返回数据为空')
      return resolve(body)
    }
    return resolve(body)
  } catch (error) {
    return reject(error)
  }
}

function buildRequest(headers, data) {
  return {
    headers: Object.assign(getHeaders(), headers),
    data: sign(Object.assign(getPayload(), data))
  }
}

function buildGetParam(param) {
  let search = ''
  for (const k in param) {
    search += `&${k}=${param[k]}`
  }
  return search.replace('&', '?')
}

function buildPostData(param) {
  return buildGetParam(param).substring(1)
}

function sendGetRequest({
  url,
  data = {},
  headers = {}
}) {
  return new Promise((resolve, reject) => {
    const staff = buildRequest(headers, data)
    request({
      url: url + buildGetParam(staff.data),
      method: 'GET',
      headers: staff.headers,
    }, function (error, response) {
      handleResult(error, response, resolve, reject)
    })
  })
}

function sendPostRequest({
  url,
  data = {},
  headers = {}
}) {
  return new Promise((resolve, reject) => {
    const staff = buildRequest(headers, data)
    request({
      url: url,
      method: 'POST',
      headers: staff.headers,
      body: buildPostData(staff.data),
    }, function (error, response) {
      handleResult(error, response, resolve, reject)
    })
  })
}

module.exports = {
  sendGetRequest,
  sendPostRequest
}