var sha1 = require("sha1"); //引入加密模块
var axios = require('axios')
// 构造函数
function WeChat (config) {
  // 传入配置文件
  this.config = config;
  this.token = config.token;
  this.appID = config.appID;
  this.appSecret = config.appSecret;
}

// 验证
WeChat.prototype.auth = function (req, res, next) {
  // 获取微信服务器发送的数据
  var signature = req.query.signature,
    timestamp = req.query.timestamp,
    nonce = req.query.nonce,
    echostr = req.query.echostr;
  // token、timestamp、nonce三个参数进行字典序排序
  var arr = [this.token, timestamp, nonce].sort().join('');
  // sha1加密 
  var result = sha1(arr)

  if (result === signature) {
    res.send(echostr);
  } else {
    res.send('mismatch');
  }

}

// 获取 access_token
WeChat.prototype.getAccessToken = function (fn) {

  var get_access_token_url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appID}&secret=${this.appSecret}`

  axios.get(get_access_token_url).then(function (res) {
    console.log(res.data.access_token, 'res.access_token')
    global.access_token = res.data.access_token

    if (typeof fn === 'function') {
      fn()
    }
  })

}

// 获取 ticket
WeChat.prototype.getTicket = function (fn) {

  if (global.access_token) {
    var getTicketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${global.access_token}&type=jsapi`

    axios.get(getTicketUrl).then((res) => {
      console.log(res.data.ticket, 'res Ticket')
      // 将 ticket 存入 js_api_ticket
      global.js_api_ticket = res.data.ticket

      if (typeof fn === 'function') {
        fn.call(this, null)
      }
    })
  } else if (!global.repeatGetAccessTokenFlag) {
    // 第一次获取后置为 true - 防止无法获取 access 进入死循环
    global.repeatGetAccessTokenFlag = true
    // 没有获取到 access_token, 重置获取一次在调用此方法
    this.getAccessToken(this.getTicket.bind(this))
  }

}

// 获取整数时间戳
WeChat.prototype.timestamp = function () {
  return parseInt(new Date().getTime() / 1000) + ""
}

// 返回 签名
WeChat.prototype.signature = function (req, res, next) {
  if (global.access_token && global.js_api_ticket) {

    var _access_token = global.access_token
    var _js_api_ticket = global.js_api_ticket
    // 随机字符串
    var nonceStr = Math.random().toString(36).substr(2, 15);
    // 整数时间戳
    var timestamp = this.timestamp();
    // url
    var url = req.headers.referer;

    // 生成 signature
    var string = `jsapi_ticket=${_js_api_ticket}&noncestr=${nonceStr}&timestamp=$timestamp{}&url=${url}`
    var signature = sha1(string)

    res.send({
      signature,
      timestamp,
      nonceStr,
      appid: this.appID
    })

  } else {
    console.log(global.access_token, global.js_api_ticket)

    res.send('error')
  }
}

WeChat.prototype.createMenu = function () {

  var create_menu_url = ` https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${global.access_token}`

  var menu_schema = {
    "button": [
      {
        "type": "click",
        "name": "今日歌曲",
        "key": "V1001_TODAY_MUSIC"
      },
      {
        "name": "菜单",
        "sub_button": [
          {
            "type": "view",
            "name": "搜索",
            "url": "http://www.soso.com/"
          },
          {
            "type": "miniprogram",
            "name": "wxa",
            "url": "http://mp.weixin.qq.com",
            "appid": "wx286b93c14bbf93aa",
            "pagepath": "pages/lunar/index"
          },
          {
            "type": "click",
            "name": "赞一下我们",
            "key": "V1001_GOOD"
          }]
      }]
  }

  axios.post(create_menu_url, {
    params: menu_schema
  }).then(res => {
    console.log(res, 'createMenu')
  })
}


module.exports = WeChat