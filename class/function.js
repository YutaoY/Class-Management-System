const mysqlJS = require('./mysql');
const {
  v4: uuidv4
} = require('uuid');
const sha256 = require("sha256");
const dayjs = require('dayjs');
const path = require('path');
const fs = require("fs");

let useroutlogin = [];
const maxLoginCount = 5;

let contentLog = {};
let startLog = false;

// 错误码
const _ERR = {
  Err_1000: 1000, //无错误
  Err_1001: 1001, //参数错误
  Err_1002: 1002, //数据错误
  Err_1003: 1003, //未知错误
  Err_1004: 1004, //数据库错误
  Err_1005: 1005, //文件错误
  Err_1006: 1006, //权限错误
  Err_1007: 1007, //已存在
  Err_1010: 1010, //身份失效
}

// 权限
const POWER = {
  NULL: -1,
  ORDINARY: 0,
  COMMITTEE: 1,
  COUNSELOR: 2,
  ADMIN: 3
};

const FileState = {
  SUCCESS: 1,
  ABNORMAL: 2,
  DELETE: -1,
  WAITING: 0
}

// 数据返回
/**
 * 接口数据返回
 * @param {_ERR} err 错误码
 * @param {*} data 返回数据
 * @param {string} csl 错误字段
 */
const returnJSON = (err, data, csl) => {
  let returnData = {
    err: _ERR.Err_1000,
    result: []
  };
  returnData.err = err;
  returnData.result = data;
  pm2Log_out("响应数据", {
    响应码: err,
    返回字段: csl
  }, "end");
  return returnData;
}

// 日志输出
/**
 * PM2日志输出
 * @param {string} name
 * @param {*} data
 * @param {'start'|'conent'|'end'} pos 
 */
const pm2Log_out = (name, data, pos) => {
  if (pos === 'start' && !startLog) startLog = true;
  if (startLog) contentLog[`【${dayjs().format('YYYY-MM-DD HH:mm:ss')}】[${name}]`] = data;
  else console.log(`【${dayjs().format('YYYY-MM-DD HH:mm:ss')}】[${name}]: `, data)
  if (pos === 'end' && startLog) {
    startLog = false;
    console.log("=========================================================================================");
    console.log(`字段[${uuidv4()}]:`, contentLog);
    console.log("=========================================================================================");
    console.log("");
    contentLog = {};
  }
}

// 获取用户权限
const getUserPower = (id, token) => {
  return new Promise((resolve, reject) => {
    mysqlJS.connect().query('SELECT power FROM user WHERE id=? AND token=? AND state=?',
      [id, token, 1], (err, rows) => {
        if (rows.length == 0) return resolve(util.returnJSON(util._ERR.Err_1002, "用户数据为空", err));
        mysqlJS.connect().query('UPDATE user SET lasttime=? WHERE id=? AND token=?', [dayjs().format("YYYY-MM-DD HH:mm:ss"), id, token], (err, rows) => {
          if (err) returnJSON(_ERR.Err_1004, "数据库异常", err)
        })
        pm2Log_out('获取用户权限', {
          用户ID: id,
          错误值: err
        }, "conent");
        if (err) return reject(err);
        if (rows.length == 0)
          return reject("用户数据为空");

        resolve(rows[0].power);
      })
  });
}

//登录生成token
const loginUserToken = (userid) => {
  return new Promise((resolve, reject) => {
    if (useroutlogin.filter(item => item.id == userid).length === 1) {
      const userdata = useroutlogin.filter(item => item.id == userid)[0];
      if (new Date().getTime() < userdata.outtime) {
        if (userdata.count < maxLoginCount) {
          userdata.count++;
          pm2Log_out('用户登录', {
            ...userdata,
            meg: ""
          }, "conent");
          resolve({
            id: userid,
            token: userdata.token
          });
        } else {
          const token = sha256(userid + new Date().getTime() + uuidv4());
          mysqlJS.connect().query('UPDATE user SET token=? WHERE id=?', [token, userid], (err, rows) => {
            if (err) return reject(err);
            userdata.token = token;
            userdata.count = 1;
            pm2Log_out('用户登录', {
              ...userdata,
              meg: "登录次数超过上限"
            }, "conent");
            resolve({
              id: userid,
              token
            });
          })
        }
      } else {
        const token = sha256(userid + new Date().getTime() + uuidv4());
        mysqlJS.connect().query('UPDATE user SET token=? WHERE id=?', [token, userid], (err, rows) => {
          if (err) return reject(err);
          userdata.token = token;
          userdata.outtime = new Date().getTime() + 1000 * 60 * 60 * 24 * 7;
          pm2Log_out('用户登录', {
            ...userdata,
            meg: "刷新下次登录时间"
          }, "conent");
          resolve({
            id: userid,
            token
          });
        })
      }
    } else {
      const token = sha256(userid + new Date().getTime() + uuidv4());
      mysqlJS.connect().query('UPDATE user SET token=? WHERE id=?', [token, userid], (err, rows) => {
        if (err) return reject(err);
        const userdata = {
          id: userid,
          count: 1,
          token,
          outtime: new Date().getTime() + 1000 * 60 * 60 * 24 * 7
        };
        pm2Log_out('用户登录', {
          ...userdata,
          meg: "记录用户登录信息"
        }, "conent");
        useroutlogin.push(userdata);
        resolve({
          id: userid,
          token
        });
      })
    }
  });
}

const isFileRepeat = (userid, name) => {
  return new Promise((resolve, reject) => {
    mysqlJS.connect().query('SELECT * FROM file WHERE user=? AND name=? ',
      [userdata.id], (err, res) => {
        if (err) return resolve(false);
        if (res.length == 0) return resolve(false);
        resolve(true)
      })
  });
}

module.exports = {
  _ERR,
  POWER,
  FileState,
  returnJSON,
  loginUserToken,
  getUserPower,
  isFileRepeat,
  pm2Log_out
}