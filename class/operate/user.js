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
          mysqlJS.connect().query('INSERT INTO user SET id=?, name=?, sex=?, position=?, address=?, blurb=?, tag=?, paw=?, token=?, class=?, power=?, state=?, lasttime=?',
            [uuidv4(), userdata.name, userdata.sex, userdata.position, userdata.address, null, null, userdata.password, null, userdata.classid, util.POWER.ORDINARY, 1, null], (err, rows) => {
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

module.exports.login = async (userdata) => {
  return new Promise((resolve) => {
    mysqlJS.connect().query('SELECT * from user WHERE name=? AND paw=? AND class=?',
      [userdata.name, userdata.paw, userdata.class], async (err, rows) => {
        if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "未知错误", err));
        if (rows.length == 0)
          return resolve(util.returnJSON(util._ERR.Err_1002, "用户名或密码错误", "用户名或密码错误"));
        if (rows[0].state !== 1)
          return resolve(util.returnJSON(util._ERR.Err_1002, "账号异常，禁止登录！"));
        await util.loginUserToken(rows[0].id)
          .then((res) => {
            resolve(util.returnJSON(util._ERR.Err_1000, res, res));
          })
          .catch((err) => {
            resolve(util.returnJSON(util._ERR.Err_1004, "登录时发生错误", err));
          })
      })
  });
}

module.exports.getClass = async () => {
  return new Promise((resolve) => {
    mysqlJS.connect().query('SELECT * FROM class',
      [], (err, rows) => {
        if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "查询失败", err));
        let classList = [{
          id: "Administrator",
          name: "系统管理员",
          school: "班级管理系统"
        }];
        rows.forEach(element => {
          classList.push({
            id: element.id,
            name: element.name,
            school: element.school
          });
        });
        resolve(util.returnJSON(util._ERR.Err_1000, classList, "获取登录班级列表成功"));
      })
  })
}

module.exports.verify = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          return resolve(util.returnJSON(util._ERR.Err_1000, true, "可执行操作"));

        resolve(util.returnJSON(util._ERR.Err_1006, false, "无权限操作"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.self = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        mysqlJS.connect().query('SELECT * FROM user WHERE id=?', [userdata.userid], (err, res) => {
          if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "用户数据获取失败", err));

          if (res.length == 0)
            return resolve(util.returnJSON(util._ERR.Err_1002, "用户数据为空", err));

          if (userdata.id == userdata.userid) {
            return resolve(util.returnJSON(util._ERR.Err_1000, {
              id: res[0].id,
              name: res[0].name,
              sex: res[0].sex,
              position: res[0].position,
              address: res[0].address,
              blurb: res[0].blurb,
              tag: res[0].tag,
              class: res[0].class,
              avatar: res[0].avatar,
              token: res[0].token,
              power: res[0].power
            }, "获取自身账号成功"))
          }

          if ((userpower == util.POWER.ORDINARY || userpower == util.POWER.COMMITTEE) && userdata.classid == res[0].class)
            return resolve(util.returnJSON(util._ERR.Err_1000, {
              id: res[0].id,
              name: res[0].name,
              avatar: res[0].avatar,
              sex: res[0].sex,
              position: res[0].position,
              blurb: res[0].blurb,
              tag: res[0].tag,
            }, "获取同班账号成功"))

          if (userpower > util.POWER.COMMITTEE)
            return resolve(util.returnJSON(util._ERR.Err_1000, res[0], "[管理员/辅导员]获取账号成功"))

          resolve(util.returnJSON(util._ERR.Err_1006, "获取用户信息失败", "权限不足"))
        })
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
        mysqlJS.connect().query('SELECT * FROM user WHERE class = ?',
          [userdata.classid], (err, res) => {
            if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "获取信息错误！", err));
            let returnGetUserList = [];
            if (userpower === util.POWER.NULL)
              return resolve(util.returnJSON(util._ERR.Err_1006, [], err));
            if (userpower > util.POWER.NULL) {
              res.forEach(element => {
                returnGetUserList.push({
                  id: element.id,
                  name: element.name,
                  state: element.state,
                  position: element.position,
                  sex: element.sex,
                  avatar: element.avatar,
                  power: element.power,
                  lasttime: element.lasttime
                });
              });
              return resolve(util.returnJSON(util._ERR.Err_1000, returnGetUserList, "获取班级名单成功"));
            }
            resolve(util.returnJSON(util._ERR.Err_1002, [], "错误的权限枚举"));
          })
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.password = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL)
          mysqlJS.connect().query('UPDATE user SET paw=? WHERE id=? AND paw=?',
            [userdata.newpaw, userdata.id, userdata.oldpaw], (err, rows) => {
              if (err)
                return resolve(util.returnJSON(util._ERR.Err_1004, "修改失败", "修改密码错误"));
              if (rows.changedRows == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "当前密码错误", "当前密码错误"));
              resolve(util.returnJSON(util._ERR.Err_1000, rows, "密码修改成功"));
            })
        else resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));
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
        if (userpower > util.POWER.NULL) {
          let sql = {
            str: 'UPDATE user SET address=?, blurb=? WHERE id=?',
            data: [userdata.address, userdata.blurb, userdata.id]
          }
          if (userdata.source === util.POWER.ADMIN) sql = {
            str: 'UPDATE user SET name=?, sex=?, position=?, class=?, power=?, state=? WHERE id=?',
            data: [userdata.name, userdata.sex, userdata.position, userdata.class, userdata.power, userdata.state, userdata.userid]
          }
          mysqlJS.connect().query(sql.str, sql.data, (err, rows) => {
            if (err)
              return resolve(util.returnJSON(util._ERR.Err_1004, "修改错误", "用户信息修改错误"));
            if (rows.changedRows == 0)
              return resolve(util.returnJSON(util._ERR.Err_1002, "修改失败", "用户信息修改失败"));
            resolve(util.returnJSON(util._ERR.Err_1000, rows, "更改用户信息成功"));
          })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.avatar = async (userdata, filedata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower > util.POWER.NULL) {
          mysqlJS.connect().query('UPDATE user SET avatar=? WHERE id=?',
            [`${userdata.source}/public/avatar/${filedata.filename}`, userdata.id], (err, rows) => {
              if (err)
                return resolve(util.returnJSON(util._ERR.Err_1004, "修改错误", "用户信息修改错误"));
              resolve(util.returnJSON(util._ERR.Err_1000, rows, "更改成功"));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "更改中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  })
}

module.exports.delete = async (userdata) => {
  return new Promise((resolve) => {
    util.getUserPower(userdata.id, userdata.token)
      .then((userpower) => {
        if (userpower == util.POWER.ADMIN) {
          mysqlJS.connect().query('DELETE FROM user WHERE id=?',
            [userdata.userid], (err, rows) => {
              if (err) return resolve(util.returnJSON(util._ERR.Err_1004, "移除中出错", err));
              if (rows.affectedRows == 0)
                return resolve(util.returnJSON(util._ERR.Err_1002, "移除失败", "成员不存在"));
              if (rows.affectedRows == 1)
                return resolve(util.returnJSON(util._ERR.Err_1000, rows, "删除成功"));
            })
        } else resolve(util.returnJSON(util._ERR.Err_1006, "移除中断", "权限不足"));
      })
      .catch((err) => {
        resolve(util.returnJSON(util._ERR.Err_1010, "获取用户权限失败", err));
      })
  });
}