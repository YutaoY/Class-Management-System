const mysqlJS = require('../mysql');
const util = require('../function');
const {
  v4: uuidv4
} = require('uuid');
const dayjs = require('dayjs');

module.exports._upload = async (data) => {
  return new Promise((resolve) => {
    util.isFileRepeat(data.id, data.filename)
      .then((length) => {
        if (length > 0) resolve(util.returnJSON(util._ERR.Err_1007, "文件已存在", "文件已存在"));
        else resolve(util.returnJSON(util._ERR.Err_1000, "", ""));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "文件信息获取失败", err));
      })
  })
}

module.exports.upload = async (userdata, filedata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('INSERT INTO file SET id=?, user=?, class=?, type=?, name=?, size=?, folder=?, time=?, state=?',
            [userdata.md5, userdata.id, userdata.class, userdata.type, filedata.filename, userdata.size, JSON.stringify(userdata.folder), dayjs().valueOf(), 1], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "文件信息上传失败", err));
              resolve(util.returnJSON(util._ERR.Err_1000, "OK", rows));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "上传中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getUserFile = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('SELECT * FROM file WHERE user=?',
            [userdata.id], (err, res) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
              let data = [];
              res.forEach((item) => {
                if (item.state !== util.FileState.DELETE)
                  data.push({
                    id: item.id,
                    name: item.name,
                    size: item.size,
                    type: item.type,
                    time: item.time,
                    state: item.state,
                    folder: JSON.parse(item.folder)
                  })
              })
              resolve(util.returnJSON(util._ERR.Err_1000, data, "获取个人网络文件成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getClassFile = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('SELECT * FROM file WHERE class=? AND type=? AND state=?',
            [userdata.class, JSON.stringify(true), 1], (err, res) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
              let data = [];
              res.forEach((item) => {
                data.push({
                  id: item.id,
                  name: item.name,
                  size: item.size,
                  type: item.type,
                  time: item.time,
                  folder: JSON.parse(item.folder),
                  user: item.user,
                  state: item.state
                })
              })
              resolve(util.returnJSON(util._ERR.Err_1000, data, "获取班级网络文件成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getALLFile = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower === util.POWER.ADMIN)
          mysqlJS.connect().query('SELECT * FROM file',
            [], (err, res) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
              let data = [];
              res.forEach((item) => {
                data.push({
                  id: item.id,
                  name: item.name,
                  size: item.size,
                  type: item.type,
                  time: item.time,
                  folder: JSON.parse(item.folder),
                  user: item.user,
                  class: item.class,
                  state: item.state
                })
              })
              resolve(util.returnJSON(util._ERR.Err_1000, data, "获取所有文件成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.download = async (userdata) => {
  return new Promise((resolve, reject) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('SELECT * FROM file WHERE id=? AND state = 1',
            [userdata.fileid, userdata.password], (err, res) => {

              if (err) return reject(util.returnJSON(util._ERR.Err_1004, "查询错误", err));
              if (res.length == 0) return reject(util.returnJSON(util._ERR.Err_1002, "文件信息错误", err));

              resolve({
                md5: res[0].id,
                name: res[0].name
              });
            })
        else reject(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        reject(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.update = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL) {

          if (userdata.state !== util.FileState.DELETE)
            if (userpower !== util.POWER.ADMIN)
              return resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));

          mysqlJS.connect().query('UPDATE file SET state=? WHERE id=?',
            [userdata.state, userdata.fileid], (err, rows) => {
              if (err)
                return resolve(util.returnJSON(util._ERR.Err_1004, "修改错误", err));
              if (rows.changedRows == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "修改失败", "文件状态修改失败"));
              resolve(util.returnJSON(util._ERR.Err_1000, rows, "文件状态修改成功"));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}