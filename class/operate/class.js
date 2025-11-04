const mysqlJS = require('../mysql');
const util = require('../function');
const {
  v4: uuidv4
} = require('uuid');
const dayjs = require('dayjs');

module.exports.add = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower == util.POWER.ADMIN)
          mysqlJS.connect().query('INSERT INTO class SET id=?, school=?, subsidiary=?, name=?, counselor=?, tel=?, JW=?, XW=?, KCB=?, state=?',
            [uuidv4(), userdata.school, userdata.subsidiary, userdata.name, userdata.counselor, userdata.tel, null, null, '[]', 1], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "添加失败", err));
              resolve(util.returnJSON(util._ERR.Err_1000, "OK", rows));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "添加中断", "权限不足"));
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
          mysqlJS.connect().query('SELECT * FROM class WHERE id=?',
            [userdata.classid], (err, res) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));

              if (res.length == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "班级不存在", "班级不存在"));
              resolve(util.returnJSON(util._ERR.Err_1000, res[0], "获取班级信息成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.getAll = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.COMMITTEE)
          mysqlJS.connect().query('SELECT * FROM class',
            [userdata.classid], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
              resolve(util.returnJSON(util._ERR.Err_1000, rows, "获取班级列表成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "查询中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.update = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower === util.POWER.ADMIN) {
          mysqlJS.connect().query('UPDATE class SET name=?, school=?, subsidiary=?, counselor=?, tel=?,  JW=?, XW=?, KCB=?, state=? WHERE id=?', [userdata.name, userdata.school, userdata.subsidiary, userdata.counselor, userdata.tel, userdata.JW, userdata.XW, userdata.KCB, userdata.state, userdata.classid], (err, rows) => {
            if (err)
              return resolve(util.returnJSON(util._ERR.Err_1004, "修改错误", "班级信息修改错误"));
            if (rows.changedRows == 0)
              return resolve(util.returnJSON(util._ERR.Err_1002, "修改失败", "班级信息修改失败"));
            resolve(util.returnJSON(util._ERR.Err_1000, rows, "更改班级信息成功"));
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}