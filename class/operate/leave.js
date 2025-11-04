const mysqlJS = require('../mysql');
const util = require('../function');
const {
  v4: uuidv4
} = require('uuid');
const path = require('path');
const fs = require("fs");
const md5 = require('md5');
const dayjs = require('dayjs');
const tencentcloud = require("tencentcloud-sdk-nodejs-ocr");
const OcrClient = tencentcloud.ocr.v20181119.Client;

function convertToTimestamp(dateTimeStr) {
  const currentYear = new Date().getFullYear();
  // 直接按固定位置截取
  const month = dateTimeStr.substring(0, 2);
  const day = dateTimeStr.substring(3, 5);
  const hours = dateTimeStr.substring(5, 7);
  const minutes = dateTimeStr.substring(8, 10);

  const date = new Date(currentYear, month - 1, day, hours, minutes);
  return date.getTime();
}

function addOneYear(timestamp) {
  const date = new Date(timestamp);
  date.setFullYear(date.getFullYear() + 1); // 增加 1 年
  return date.getTime(); // 返回新的时间戳
}

// 实例化一个认证对象，入参需要传入腾讯云账户 SecretId 和 SecretKey，此处还需注意密钥对的保密
// 代码泄露可能会导致 SecretId 和 SecretKey 泄露，并威胁账号下所有资源的安全性
// 以下代码示例仅供参考，建议采用更安全的方式来使用密钥
// 请参见：https://cloud.tencent.com/document/product/1278/85305
// 密钥可前往官网控制台 https://console.cloud.tencent.com/cam/capi 进行获取
const clientConfig = {
  credential: {
    secretId: "",
    secretKey: "",
  },
  region: "",
  profile: {
    httpProfile: {
      endpoint: "ocr.tencentcloudapi.com",
    },
  },
};

const getLeaveVerifyInfo = (obj, userdata) => {
  return new Promise((resolve, reject) => {
    mysqlJS.connect().query('SELECT * FROM user WHERE name=? AND class=? AND state=?',
      [obj.name, userdata.class, 1], (err, rows) => {
        if (err) return resolve([]);
        if (rows.length == 0) return resolve([]);
        resolve(rows)
      })
  })
}

module.exports.add = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL) {
          mysqlJS.connect().query('SELECT * FROM off WHERE md5=?', [userdata.md5], (err, rows) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "数据检索出错！", err));
            if (rows.length > 0) return resolve(util.returnJSON(util._ERR.Err_1002, "重复提交！", rows));

            const client = new OcrClient(clientConfig);
            const params = {
              "ImageBase64": userdata.img
            };
            client.GeneralBasicOCR(params).then(
              async (data) => {

                let obj = {
                  user: '',
                  name: '',
                  pass: false,
                  start: '',
                  end: '',
                  type: '',
                  text: ''
                }
                obj.user = userdata.id
                data.TextDetections.forEach(item => {
                  const linetext = item.DetectedText.replace(/\s+/g, '');
                  if (linetext.indexOf('-发起申请') > -1) {
                    obj.name = linetext.substring(0, linetext.indexOf('-发起申请'))
                  }

                  if (linetext.indexOf('审批通过') > -1 || linetext.indexOf('审批已通过') > -1 || linetext.indexOf('审批己通过') > -1) {
                    obj.pass = true
                  }

                  if (linetext.indexOf('开始时间:') > -1) {
                    const text = '开始时间:';
                    obj.start = convertToTimestamp(linetext.substring(linetext.indexOf(text) + text.length).replace(/\s+/g, ''))
                  }

                  if (linetext.indexOf('结束时间:') > -1) {
                    const text = '结束时间:';
                    obj.end = convertToTimestamp(linetext.substring(linetext.indexOf(text) + text.length).replace(/\s+/g, ''))
                  }

                  if (linetext.indexOf('请假类型:') > -1) {
                    const text = '请假类型:';
                    obj.type = linetext.substring(linetext.indexOf(text) + text.length)
                  }

                  if (linetext.indexOf('请假原因:') > -1) {
                    const text = '请假原因:';
                    obj.text = linetext.substring(linetext.indexOf(text) + text.length)
                  }
                })

                if (obj.pass) {
                  if (userdata.other === true) {
                    const userinfo = await getLeaveVerifyInfo(obj, userdata)
                    if (userinfo.length == 0)
                      return resolve(util.returnJSON(util._ERR.Err_1002, "成员信息错误或不存在", obj));

                    if (userinfo.length == 1) {
                      obj.user = userinfo[0].id
                      obj.name = userinfo[0].name
                    } else return resolve(util.returnJSON(util._ERR.Err_1002, "多个成员信息存在", obj));
                  } else {
                    if (obj.name !== userdata.name)
                      return resolve(util.returnJSON(util._ERR.Err_1002, `请报备${userdata.name}的请假记录`, obj));
                    if (obj.end < obj.start) obj.end = addOneYear(obj.end)
                    if (obj.end < new Date().getTime())
                      return resolve(util.returnJSON(util._ERR.Err_1002, "报备已过期！", obj));
                  }

                  const ocrid = md5(uuidv4() + new Date().getTime() + data.RequestId);
                  mysqlJS.connect().query('INSERT INTO off SET id=?, user=?, class=?, md5=?, time=?, start=?, end=?, type=?, text=?',
                    [ocrid, obj.user, userdata.class, userdata.md5, String(new Date().getTime()), String(obj.start), String(obj.end), obj.type, obj.text], (err, rows) => {
                      if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "数据格式出错！", err));
                      var base64Data = userdata.img.replace(/^data:image\/\w+;base64,/, "");
                      var dataBuffer = Buffer.from(base64Data, 'base64');
                      const url = path.join('./public/leave/' + userdata.md5)
                      fs.writeFile(url, dataBuffer, function (err) {
                        if (err) resolve(util.returnJSON(util._ERR.Err_1005, "图片保存失败！", err))
                        else resolve(util.returnJSON(util._ERR.Err_1000, obj, JSON.stringify([obj, rows])))
                      });
                    })
                }
              }, (err) => {
                resolve(util.returnJSON(util._ERR.Err_1002, "图片内容获取失败！", err));
              });
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "提交中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  });
}



module.exports.get = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('SELECT * FROM off WHERE user=?', [userdata.id], (err, res) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "数据获取失败", err));
            return resolve(util.returnJSON(util._ERR.Err_1000, res, "个人请假信息获取成功"))
          })
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getClass = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY)
          mysqlJS.connect().query('SELECT * FROM off WHERE class=?', [userdata.class], (err, res) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "数据获取失败", err));
            return resolve(util.returnJSON(util._ERR.Err_1000, res, "班级全部成员请假信息获取成功"))
          })
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getCover = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.ORDINARY)
          mysqlJS.connect().query('SELECT * FROM off WHERE class=?', [userdata.class], (err, res) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "数据获取失败", err));
            let return_data = []
            res.forEach(item => {
              return_data.push({
                id: item.id,
                user: item.user,
                start: item.start,
                end: item.end,
                type: item.type,
              })
            })
            return resolve(util.returnJSON(util._ERR.Err_1000, return_data, "班级请假信息获取成功"))
          })
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}