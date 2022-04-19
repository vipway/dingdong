// 城市, 默认上海（抓包填写）
const cityId = '0101';

// 站点（抓包填写）
const stationId = '';

// 收货地址（抓包填写）
const addressId = '';

// 请求头（抓包填写）
const headerConfig = {
  'ddmc-build-version': '',
  'ddmc-api-version': '',
  'ddmc-device-id': '',
  'cookie': '',
  'ddmc-longitude': '',
  'ddmc-latitude': '',
  'ddmc-uid': '',
  'user-agent': '',
  'ddmc-city-number': cityId,
  'ddmc-station-id': stationId
}

// 公共参数（抓包填写）
const paramConfig = {
  s_id: '',
  openid: '',
  device_token: ''
}

/**
 * 请求头
 */
function getHeaders() {
  return {
    'ddmc-ip': '',
    'ddmc-time': parseInt(new Date().getTime() / 1000),
    'ddmc-channel': 'applet',
    'ddmc-os-version': '[object Undefined]',
    'ddmc-app-client-id': '4',
    'accept-encoding': 'utf-8',
    'content-type': 'application/x-www-form-urlencoded',
    'referer': 'https://servicewechat.com/wx1e113254eda17715/425/page-frame.html',
    ...headerConfig
  };
}

/**
 * 公共入参
 */
function getPayload() {
  return {
    time: parseInt(new Date().getTime() / 1000),
    uid: headerConfig['ddmc-uid'],
    longitude: headerConfig['ddmc-longitude'],
    latitude: headerConfig['ddmc-latitude'],
    station_id: headerConfig['ddmc-station-id'],
    city_number: headerConfig['ddmc-city-number'],
    api_version: headerConfig['ddmc-api-version'],
    app_version: headerConfig['ddmc-build-version'],
    applet_source: '',
    channel: 'applet',
    app_client_id: '4',
    sharer_uid: '',
    h5_source: '',
    ...paramConfig
  }
}

module.exports = {
  cityId,
  stationId,
  addressId,
  getHeaders,
  getPayload
}