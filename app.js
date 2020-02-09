var express = require('express')
var xml2js = require('xml2js');
var parseString = require('xml2js').parseString;
var WeChat = require('./tool/weChat')
var config = require('./config/weChat')
var axios = require('axios')

var app = new express()
// var sortArr = ['noncestr', 'jsapi_ticket', 'timestamp', 'url']

// 将 obj 转换为 xml 格式
var xml_builder = new xml2js.Builder();

var wechat = new WeChat(config)
wechat.getAccessToken(wechat.getTicket.bind(wechat))

app.get("/", (req, res, next) => {
  console.log('get')

  wechat.auth(req, res, next);
})

app.get("/signature", (req, res, next) => {
  console.log('get')

  wechat.signature(req, res, next);
})


app.post("/", (req, res, next) => {
  console.log('post')

  try {
    var buffer = [];
    //监听 data 事件 用于接收数据
    req.on('data', function (data) {
      buffer.push(data);
    });
    //监听 end 事件 用于处理接收完成的数据
    req.on('end', function () {
      //输出接收完成的数据
      parseString(Buffer.concat(buffer).toString('utf-8'), { explicitArray: false }, function (err, result) {
        if (err) {
          //打印错误信息
          console.log(err);
        } else {
          //打印解析结果
          result = result.xml;
          var server_user = result.ToUserName; //接收方微信 - 公众号
          var client_user = result.FromUserName;//发送方微信 - 关注公众号的用户

          // console.log(result, 'toUser');
          // console.log(access_token, 'access_token');

          // ToUserName	是	接收方帐号（收到的OpenID）
          // FromUserName	是	开发者微信号
          // CreateTime	是	消息创建时间 （整型）
          // MsgType	是	消息类型，文本为text
          // Content	是	回复的消息内容（换行：在content中能够换行，微信客户端就支持换行显示）
          var text_obj_info = {
            xml: {
              // 回复的时候 - 从服务端发送给客户 - 接受人和发送人要反一下
              ToUserName: client_user,
              FromUserName: server_user,
              CreateTime: wechat.timestamp(),
              MsgType: 'text',
              Content: '小林\n你真棒\n测试成功了'
            }
          }

          var result_info = xml_builder.buildObject(text_obj_info)
          console.log(result_info)

          // 回复消息
          res.send(result_info);

          //判断是否是事件类型
          if (result.Event) {
            //处理事件类型
            switch (result.Event) {
              case "subscribe":
                //关注公众号
                break;
              default:

            }
          } else {
            //处理消息类型

            switch (result.MsgType) {
              case "text":
                //处理文本消息
                break;
              case "image":
                //处理图片消息
                break;
              case "voice":
                //处理语音消息
                break;
              case "video":
                //处理视频消息
                break;
              case "shortvideo":
                //处理小视频消息
                break;
              case "location":
                //处理发送地理位置
                break;
              case "link":
                //处理点击链接消息
                break;
              default:

            }
          }
        }
      })
    });
  } catch (err) {
    res.send(err);
  }

})

// 监听1234端口
app.listen(1234)